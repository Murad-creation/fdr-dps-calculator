import { toPaisa, mulDivR } from './money.js';
import { addMonths, diffDays, daysInYear, yearOf, activeEnd } from './dates.js';
import { calcSourceTax, taxRatePct } from './tax.js';
import { exciseByYear } from './excise.js';
import { checkLimits, checkRate, checkDate, buildYears } from './shared.js';

/**
 * TBSD: interest is PAID OUT every month (never compounded, never part of the maturity amount).
 * mode 'monthly': a deposit at the start of every month; mode 'onetime': a single deposit at opening.
 * Monthly interest = balance x rate / 12 (or actual days / year-days if configured).
 * Source tax is deducted from each monthly payment. Excise is per calendar year on the highest
 * balance (principal only, because interest never accumulates in the account).
 *
 * Final principal payable = principal - excise (excise is recovered from the principal at closure).
 * Final take-home = final principal payable + total net interest already paid.
 *
 * input: {mode:'monthly'|'onetime', amount, ratePercent, tenureMonths, openingDate, taxStatus}
 */
export function calcTBSD(input, cfg) {
  const R = cfg.rounding;
  const errors = [];
  const mode = input.mode === 'monthly' ? 'monthly' : 'onetime';
  const amt = toPaisa(input.amount);
  const bp = toPaisa(input.ratePercent);
  const n = Number(input.tenureMonths);
  const open = input.openingDate;
  checkLimits(amt, 'tbsd', cfg, errors);
  checkRate(bp, errors);
  checkDate(open, errors);
  if (!(n >= 1) || !Number.isInteger(n)) errors.push('tenure_invalid');
  if (errors.length) return { errors };

  const dayCount = cfg.tbsd.dayCount;
  let balance = 0, grossTotal = 0, taxTotal = 0, netTotal = 0;
  const months = [], snaps = [], events = [];
  for (let k = 0; k < n; k++) {
    const start = addMonths(open, k), end = addMonths(open, k + 1);
    const deposit = mode === 'monthly' || k === 0 ? amt : 0;
    balance += deposit;
    const gross = dayCount === 'actual'
      ? mulDivR(balance, bp * diffDays(start, end), 10000 * daysInYear(yearOf(start)), R)
      : mulDivR(balance, bp, 10000 * 12, R);
    const tax = calcSourceTax(gross, input.taxStatus, cfg);
    const net = gross - tax;
    grossTotal += gross; taxTotal += tax; netTotal += net;
    months.push({ n: k + 1, startDate: start, payDate: end, deposit, balance, grossInterest: gross, sourceTax: tax, netInterest: net });
    snaps.push({ date: start, balance });
    snaps.push({ date: activeEnd(end), balance });
    if (deposit) events.push({ date: start, principalAdded: deposit });
    events.push({ date: activeEnd(end), interest: gross, tax });
  }
  const principal = balance;
  const exciseRows = exciseByYear(snaps, cfg.excise);
  const excise = exciseRows.reduce((s, r) => s + r.duty, 0);
  const otherCharges = toPaisa(cfg.otherCharges.tbsd);
  const grossAmount = principal + grossTotal;
  const totalDeductions = taxTotal + excise + otherCharges;
  const finalPrincipalPayable = principal - excise - otherCharges;
  const summary = {
    principal, grossInterest: grossTotal, grossAmount, sourceTax: taxTotal, excise, otherCharges, totalDeductions,
    takeHome: grossAmount - totalDeductions,
    netInterestPaid: netTotal, finalPrincipalPayable,
    openingDate: open, maturityDate: addMonths(open, n), taxRatePct: taxRatePct(input.taxStatus, cfg), mode,
  };
  return {
    errors: [], summary, months,
    years: buildYears(events, exciseRows, taxTotal, input.taxStatus, cfg),
    exciseRows,
    meta: { mode, dayCount, taxTiming: 'monthly', exciseBasis: 'principal', rounding: R },
  };
}
