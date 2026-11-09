import { toPaisa } from './money.js';
import { yearOf, isValidISO } from './dates.js';
import { calcSourceTax } from './tax.js';

export function checkLimits(amountPaisa, product, cfg, errors) {
  if (!(amountPaisa > 0)) { errors.push('amount_invalid'); return; }
  const lim = cfg.limits?.[product];
  if (lim && amountPaisa < toPaisa(lim.min)) errors.push('amount_min');
  if (lim && amountPaisa > toPaisa(lim.max)) errors.push('amount_max');
}
export function checkRate(bp, errors) { if (!(bp >= 0) || bp > 10000) errors.push('rate_invalid'); }
export function checkDate(iso, errors) { if (!isValidISO(iso)) errors.push('date_invalid'); }

/**
 * Calendar-year table. events: [{date, principalAdded?, interest?, tax?}]
 * If events carry `tax`, those are summed per year; otherwise totalTax is allocated per year
 * from that year's interest (last year takes the remainder so the column sums exactly).
 */
export function buildYears(events, exciseRows, totalTax, status, cfg) {
  const years = new Set(exciseRows.map((r) => r.year));
  events.forEach((e) => years.add(yearOf(e.date)));
  const list = [...years].sort((a, b) => a - b);
  const byYear = new Map(list.map((y) => [y, { year: y, principal: 0, interest: 0, tax: 0, excise: 0 }]));
  for (const e of events) {
    const row = byYear.get(yearOf(e.date));
    row.principal += e.principalAdded || 0;
    row.interest += e.interest || 0;
    if (e.tax != null) row.tax += e.tax;
  }
  if (!events.some((e) => e.tax != null)) {
    let allocated = 0;
    list.forEach((y, i) => {
      const row = byYear.get(y);
      row.tax = i === list.length - 1 ? totalTax - allocated : calcSourceTax(row.interest, status, cfg);
      allocated += row.tax;
    });
  }
  exciseRows.forEach((r) => { byYear.get(r.year).excise = r.duty; });
  let cp = 0, ci = 0, ct = 0, ce = 0;
  return list.map((y) => {
    const r = byYear.get(y);
    cp += r.principal; ci += r.interest; ct += r.tax; ce += r.excise;
    return { ...r, netAccumulated: cp + ci - ct - ce };
  });
}

export function summarize({ principal, grossInterest, sourceTax, excise, otherCharges }) {
  const grossAmount = principal + grossInterest;
  const totalDeductions = sourceTax + excise + otherCharges;
  return { principal, grossInterest, grossAmount, sourceTax, excise, otherCharges, totalDeductions, takeHome: grossAmount - totalDeductions };
}
