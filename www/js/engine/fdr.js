import { toPaisa, mulDivR } from './money.js';
import { addMonths, diffDays, daysInYear, yearOf, activeEnd } from './dates.js';
import { calcSourceTax, taxRatePct } from './tax.js';
import { exciseByYear } from './excise.js';
import { checkLimits, checkRate, checkDate, buildYears, summarize } from './shared.js';

function periodInterest(base, bp, startISO, endISO, months, dayCount, R) {
  if (dayCount === 'actual') return mulDivR(base, bp * diffDays(startISO, endISO), 10000 * daysInYear(yearOf(startISO)), R);
  return mulDivR(base, bp * months, 10000 * 12, R);
}

/** Interest for one term. Simple = on principal. Compound = interest capitalised every `f` months within the term. */
export function termInterest(P, bp, T, start, method, f, dayCount, R) {
  if (method !== 'compound' || !(f > 0) || f >= T) return periodInterest(P, bp, start, addMonths(start, T), T, dayCount, R);
  let bal = P, m = 0;
  while (m < T) {
    const step = Math.min(f, T - m);
    bal += periodInterest(bal, bp, addMonths(start, m), addMonths(start, m + step), step, dayCount, R);
    m += step;
  }
  return bal - P;
}

/**
 * FDR with optional auto-renewal.
 * tenureMonths (1|3|6|12) is the rate period / renewal period. The TOTAL tenure is separate: pass totalMonths
 * (a multiple of tenureMonths, e.g. 60 for a 1-year FDR auto-renewed to 5 years). Terms = totalMonths / tenureMonths.
 * (Legacy: without totalMonths, autoRenewal:'yes' + renewals adds that many extra terms.)
 * input: {amount, ratePercent, tenureMonths, totalMonths, openingDate, renewalMethod,
 *         renewalRatePercent?, renewalRates?[], method:'simple'|'compound', compoundingMonths?, taxStatus}
 * renewalMethod:
 *   principal_only        renew principal; net interest (after tax) paid out each term
 *   principal_interest    renew principal + GROSS interest; tax accrued each term and deducted at final maturity
 *   principal_net_interest renew principal + NET interest (tax deducted every term)
 */
export function calcFDR(input, cfg) {
  const R = cfg.rounding;
  const errors = [];
  const P0 = toPaisa(input.amount);
  const bp0 = toPaisa(input.ratePercent);
  const T = Number(input.tenureMonths);
  const open = input.openingDate;
  const auto = input.autoRenewal === true || input.autoRenewal === 'yes';
  const renewals = auto ? Math.max(0, Math.floor(Number(input.renewals || 0))) : 0;
  const hasTotal = input.totalMonths !== undefined && input.totalMonths !== null && input.totalMonths !== '';
  const totalMonths = hasTotal ? Number(input.totalMonths) : null;
  let terms = 1 + renewals;
  const method = input.method === 'compound' ? 'compound' : 'simple';
  const f = Number(input.compoundingMonths ?? cfg.fdr.compoundingMonths);
  const renewalMethod = input.renewalMethod || 'principal_only';
  const dayCount = cfg.fdr.dayCount;
  const basis = cfg.excise.basis;
  checkLimits(P0, 'fdr', cfg, errors);
  checkRate(bp0, errors);
  checkDate(open, errors);
  if (![1, 3, 6, 12].includes(T)) errors.push('tenure_invalid');
  if (hasTotal) {
    if (Number.isInteger(totalMonths) && T > 0 && totalMonths >= T && totalMonths % T === 0) terms = totalMonths / T;
    else errors.push('total_tenure_invalid');
  }
  if (terms > 600) errors.push('renewals_invalid');
  const rateFor = (t) => {
    if (t === 0) return bp0;
    const r = input.renewalRates?.[t - 1] ?? input.renewalRatePercent ?? input.ratePercent;
    return toPaisa(r);
  };
  for (let t = 1; t < terms; t++) checkRate(rateFor(t), errors);
  if (errors.length) return { errors };

  let P = P0, deferredTax = 0, totalInterest = 0, totalTax = 0;
  const periods = [], snaps = [], events = [{ date: open, principalAdded: P0 }];
  for (let t = 0; t < terms; t++) {
    const start = addMonths(open, t * T), end = addMonths(open, (t + 1) * T);
    const bp = rateFor(t);
    const interest = termInterest(P, bp, T, start, method, f, dayCount, R);
    const tax = calcSourceTax(interest, input.taxStatus, cfg);
    const isFinal = t === terms - 1;
    let renewalAmount, taxDeductedNow = tax, interestPaidOut = 0;
    if (renewalMethod === 'principal_interest') {
      taxDeductedNow = isFinal ? tax + deferredTax : 0;
      if (!isFinal) deferredTax += tax;
      renewalAmount = isFinal ? P + interest - taxDeductedNow : P + interest;
    } else if (renewalMethod === 'principal_net_interest') {
      renewalAmount = P + interest - tax;
    } else {
      interestPaidOut = interest - tax;
      renewalAmount = isFinal ? P + interestPaidOut : P;
    }
    periods.push({ n: t + 1, startDate: start, endDate: end, ratePct: bp / 100, opening: P, interest, tax, taxDeductedNow, interestPaidOut, renewalAmount, isFinal });
    snaps.push({ date: start, balance: P });
    snaps.push({ date: activeEnd(end), balance: basis === 'principal' ? P : P + interest });
    events.push({ date: activeEnd(end), interest, tax });
    totalInterest += interest; totalTax += tax;
    if (!isFinal) P = renewalAmount;
  }

  const exciseRows = exciseByYear(snaps, cfg.excise);
  const excise = exciseRows.reduce((s, r) => s + r.duty, 0);
  const otherCharges = toPaisa(cfg.otherCharges.fdr);
  const summary = {
    ...summarize({ principal: P0, grossInterest: totalInterest, sourceTax: totalTax, excise, otherCharges }),
    openingDate: open, maturityDate: addMonths(open, terms * T), taxRatePct: taxRatePct(input.taxStatus, cfg), terms,
  };
  return {
    errors: [], summary, periods,
    years: buildYears(events, exciseRows, totalTax, input.taxStatus, cfg),
    exciseRows,
    meta: { method, compoundingMonths: f, dayCount, renewalMethod: terms > 1 ? renewalMethod : null, exciseBasis: basis, rounding: R },
  };
}
