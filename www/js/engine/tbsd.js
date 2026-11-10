import { toPaisa, mulDivR } from './money.js';
import { addMonths, diffDays, daysInYear, yearOf, activeEnd } from './dates.js';
import { calcSourceTax, taxRatePct } from './tax.js';
import { exciseByYear } from './excise.js';
import { checkLimits, checkRate, checkDate, buildYears } from './shared.js';

/**
 * TBSD (Target Based Small Deposit): interest is credited EVERY MONTH, for both one-time and monthly deposit modes.
 * Source tax is deducted from each month's interest, and (default `cfg.tbsd.interestMode = 'compound'`) the NET interest
 * is added to the balance, so the next month's interest is calculated on principal + earlier net interest.
 * With interestMode = 'payout' the net interest is paid out each month instead and never compounds.
 * mode 'monthly': a deposit at the start of every month; mode 'onetime': a single deposit at opening.
 * Monthly interest = balance x rate / 12 (or actual days / year-days if configured).
 * Excise is per calendar year on the highest balance (cfg.excise.basis; payout mode always principal).
 * Minimum tenure: cfg.tbsd.minMonths (default 6). No maximum.
 *
 * Final payable at maturity = closing balance - excise - other charges; take-home equals it in compound mode.
 * In payout mode: final principal payable = principal - excise; take-home = that + total net interest already paid.
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
  const minMonths = Number(cfg.tbsd.minMonths ?? 6);
  checkLimits(amt, 'tbsd', cfg, errors);
  checkRate(bp, errors);
  checkDate(open, errors);
  if (!(n >= 1) || !Number.isInteger(n) || n > 1200) errors.push('tenure_invalid');
  else if (n < minMonths) errors.push('tenure_min');
  if (errors.length) return { errors };

  const dayCount = cfg.tbsd.dayCount;
  const compound = cfg.tbsd.interestMode !== 'payout';
  const basis = cfg.excise.basis;
  let principal = 0, balance = 0, grossTotal = 0, taxTotal = 0, netTotal = 0;
  const months = [], snaps = [], events = [];
  for (let k = 0; k < n; k++) {
    const start = addMonths(open, k), end = addMonths(open, k + 1);
    const deposit = mode === 'monthly' || k === 0 ? amt : 0;
    principal += deposit; balance += deposit;
    const base = balance; // balance before this month's interest (includes earlier net interest when compounding)
    const gross = dayCount === 'actual'
      ? mulDivR(base, bp * diffDays(start, end), 10000 * daysInYear(yearOf(start)), R)
      : mulDivR(base, bp, 10000 * 12, R);
    const tax = calcSourceTax(gross, input.taxStatus, cfg);
    const net = gross - tax;
    grossTotal += gross; taxTotal += tax; netTotal += net;
    if (compound) balance += net;
    months.push({ n: k + 1, startDate: start, payDate: end, deposit, balance: base, grossInterest: gross, sourceTax: tax, netInterest: net, closing: balance });
    const exBase = compound && basis !== 'principal';
    snaps.push({ date: start, balance: exBase ? base : principal });
    snaps.push({ date: activeEnd(end), balance: exBase ? balance : principal });
    if (deposit) events.push({ date: start, principalAdded: deposit });
    events.push({ date: activeEnd(end), interest: gross, tax });
  }
  const exciseRows = exciseByYear(snaps, cfg.excise);
  const excise = exciseRows.reduce((s, r) => s + r.duty, 0);
  const otherCharges = toPaisa(cfg.otherCharges.tbsd);
  const grossAmount = principal + grossTotal;
  const totalDeductions = taxTotal + excise + otherCharges;
  const finalPrincipalPayable = (compound ? balance : principal) - excise - otherCharges;
  const summary = {
    principal, grossInterest: grossTotal, grossAmount, sourceTax: taxTotal, excise, otherCharges, totalDeductions,
    takeHome: grossAmount - totalDeductions,
    netInterestPaid: netTotal, finalPrincipalPayable, compound,
    openingDate: open, maturityDate: addMonths(open, n), taxRatePct: taxRatePct(input.taxStatus, cfg), mode, tenureMonths: n,
  };
  return {
    errors: [], summary, months,
    years: buildYears(events, exciseRows, taxTotal, input.taxStatus, cfg),
    exciseRows,
    meta: { mode, dayCount, interestMode: compound ? 'compound' : 'payout', taxTiming: 'monthly', exciseBasis: compound ? basis : 'principal', rounding: R },
  };
}
