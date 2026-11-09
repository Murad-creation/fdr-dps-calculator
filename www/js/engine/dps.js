import { toPaisa, mulDivR } from './money.js';
import { addMonths, dayInMonthOffset, diffDays, daysInYear, yearOf, activeEnd } from './dates.js';
import { calcSourceTax, taxRatePct } from './tax.js';
import { exciseByYear } from './excise.js';
import { checkLimits, checkRate, checkDate, buildYears, summarize } from './shared.js';

/**
 * DPS: installment paid at the START of each monthly period (the opening date is the first installment).
 * Interest for a period = (capitalised balance + that period's installment) x rate x period fraction.
 * Interest is accrued every month but capitalised every `compoundingMonths` months
 * (1 = monthly, 3 = quarterly, 6, 12; 0 = simple interest on principal). Remaining accrued interest
 * is always capitalised at maturity. Source tax is deducted once, at maturity, on total interest.
 *
 * input: {monthlyInstallment, ratePercent, tenureYears, taxStatus, openingDate, installmentDay?}
 */
export function calcDPS(input, cfg) {
  const R = cfg.rounding;
  const errors = [];
  const inst = toPaisa(input.monthlyInstallment);
  const bp = toPaisa(input.ratePercent);
  const years = Number(input.tenureYears);
  const n = years * 12;
  const open = input.openingDate;
  const instDay = input.installmentDay ? Number(input.installmentDay) : null;
  checkLimits(inst, 'dps', cfg, errors);
  checkRate(bp, errors);
  checkDate(open, errors);
  if (!(years >= 1)) errors.push('tenure_invalid');
  if (instDay !== null && !(instDay >= 1 && instDay <= 31)) errors.push('day_invalid');
  if (errors.length) return { errors };

  const cm = Number(cfg.dps.compoundingMonths);
  const dayCount = cfg.dps.dayCount;
  const basis = cfg.excise.basis;

  const dates = [open];
  for (let k = 1; k <= n; k++) dates.push(instDay ? dayInMonthOffset(open, k, instDay) : addMonths(open, k));

  let cap = 0, pending = 0, principal = 0, grossInterest = 0;
  const months = [], snaps = [], events = [];
  for (let k = 0; k < n; k++) {
    const start = dates[k], end = dates[k + 1];
    const opening = cap + pending;
    cap += inst; principal += inst;
    const days = diffDays(start, end);
    let interest;
    if (dayCount === 'actual') {
      interest = mulDivR(cap, bp * days, 10000 * daysInYear(yearOf(start)), R);
    } else if (instDay && k === 0) {
      // custom instalment day -> first period is partial; prorate against a standard month
      const std = diffDays(start, addMonths(start, 1));
      interest = mulDivR(cap, bp * days, 10000 * 12 * std, R);
    } else {
      interest = mulDivR(cap, bp, 10000 * 12, R);
    }
    pending += interest; grossInterest += interest;
    const closing = cap + pending;
    const last = k === n - 1;
    if ((cm > 0 && (k + 1) % cm === 0) || last) { cap += pending; pending = 0; }
    months.push({ n: k + 1, startDate: start, endDate: end, installment: inst, opening, interest, closing, cumPrincipal: principal });
    snaps.push({ date: start, balance: basis === 'principal' ? principal : opening + inst });
    snaps.push({ date: activeEnd(end), balance: basis === 'principal' ? principal : closing });
    events.push({ date: start, principalAdded: inst });
    events.push({ date: activeEnd(end), interest });
  }

  const sourceTax = calcSourceTax(grossInterest, input.taxStatus, cfg);
  const exciseRows = exciseByYear(snaps, cfg.excise);
  const excise = exciseRows.reduce((s, r) => s + r.duty, 0);
  const otherCharges = toPaisa(cfg.otherCharges.dps);
  const summary = {
    ...summarize({ principal, grossInterest, sourceTax, excise, otherCharges }),
    openingDate: open, maturityDate: dates[n], taxRatePct: taxRatePct(input.taxStatus, cfg), installments: n,
  };
  return {
    errors: [], summary, months,
    years: buildYears(events, exciseRows, sourceTax, input.taxStatus, cfg),
    exciseRows,
    meta: { compoundingMonths: cm, dayCount, taxTiming: 'maturity', exciseBasis: basis, rounding: R },
  };
}
