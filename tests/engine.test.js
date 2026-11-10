import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../www/js/config.js';
import { calcDPS, calcFDR, calcTBSD, calcSourceTax, dutyForBalance, exciseByYear, toPaisa } from '../www/js/engine/index.js';
import { addMonths, isLeap, diffDays } from '../www/js/engine/dates.js';
import { mulDiv } from '../www/js/engine/money.js';

const cfg = (over = {}) => {
  const c = structuredClone(DEFAULT_CONFIG);
  for (const [k, v] of Object.entries(over)) c[k] = { ...c[k], ...v };
  return c;
};
const tk = (p) => p / 100; // paisa -> taka for readable asserts

// ---------- money / dates ----------
test('toPaisa parses exactly, no float drift', () => {
  assert.equal(toPaisa('0.1') + toPaisa('0.2'), 30);
  assert.equal(toPaisa('1234.565'), 123457);
  assert.ok(Number.isNaN(toPaisa('abc')));
});
test('mulDiv rounding modes', () => {
  assert.equal(mulDiv(1, 5, 10, 'half_up'), 1);
  assert.equal(mulDiv(1, 5, 10, 'floor'), 0);
  assert.equal(mulDiv(1, 5, 10, 'bankers'), 0);
  assert.equal(mulDiv(3, 5, 10, 'bankers'), 2);
  assert.equal(mulDiv(1, 1, 3, 'ceil'), 1);
});
test('addMonths clamps month end and handles leap years', () => {
  assert.equal(addMonths('2024-01-31', 1), '2024-02-29');
  assert.equal(addMonths('2025-01-31', 1), '2025-02-28');
  assert.equal(addMonths('2024-02-29', 12), '2025-02-28');
  assert.equal(addMonths('2024-02-29', 48), '2028-02-29');
  assert.ok(isLeap(2000) && !isLeap(1900) && isLeap(2024));
  assert.equal(diffDays('2024-02-01', '2024-03-01'), 29);
});

// ---------- source tax ----------
test('source tax 10% / 15%, interest only', () => {
  assert.equal(calcSourceTax(toPaisa(1000), 'submitted', cfg()), toPaisa(100));
  assert.equal(calcSourceTax(toPaisa(1000), 'not_submitted', cfg()), toPaisa(150));
  assert.equal(calcSourceTax(0, 'submitted', cfg()), 0);
});
test('source tax rates are configurable', () => {
  const c = cfg({ tax: { submitted: 12.5 } });
  assert.equal(calcSourceTax(toPaisa(1000), 'submitted', c), toPaisa(125));
});
test('rounding unit taka', () => {
  const c = cfg({ rounding: { unit: 'taka', mode: 'half_up' } });
  assert.equal(calcSourceTax(toPaisa('1234.56'), 'submitted', c), toPaisa(123)); // 123.456 -> 123
});

// ---------- excise ----------
test('excise slab boundaries (inclusive upper bounds)', () => {
  const s = DEFAULT_CONFIG.excise.slabs;
  const d = (taka) => tk(dutyForBalance(toPaisa(taka), s));
  assert.equal(d(300000), 0);
  assert.equal(d('300000.01'), 150);
  assert.equal(d(500000), 150);
  assert.equal(d(500001), 500);
  assert.equal(d(1000000), 500);
  assert.equal(d(1000001), 3000);
  assert.equal(d(5000000), 3000);
  assert.equal(d(5000001), 5000);
  assert.equal(d(10000000), 5000);
  assert.equal(d(10000001), 10000);
  assert.equal(d(20000000), 10000);
  assert.equal(d(20000001), 20000);
  assert.equal(d(50000000), 20000);
  assert.equal(d(50000001), 50000);
});
test('excise: highest balance per calendar year, one duty per year', () => {
  const rows = exciseByYear([
    { date: '2026-03-01', balance: toPaisa(400000) },
    { date: '2026-12-31', balance: toPaisa(600000) },
    { date: '2026-06-01', balance: toPaisa(100000) },
    { date: '2027-01-01', balance: toPaisa(200000) },
  ], DEFAULT_CONFIG.excise);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r) => tk(r.duty)), [500, 0]);
});

// ---------- DPS ----------
const dpsIn = (o = {}) => ({ monthlyInstallment: 1000, ratePercent: 12, tenureYears: 1, taxStatus: 'submitted', openingDate: '2026-01-15', ...o });
// tenureYears is allowed to be fractional only in tests via 1 -> 12 months
test('DPS simple interest hand-calc: 12 x 1000 @12% = 780.00 interest', () => {
  const r = calcDPS(dpsIn(), cfg({ dps: { compoundingMonths: 0 } }));
  assert.deepEqual(r.errors, []);
  assert.equal(tk(r.summary.principal), 12000);
  assert.equal(tk(r.summary.grossInterest), 780);
  assert.equal(tk(r.summary.grossAmount), 12780);
  assert.equal(tk(r.summary.sourceTax), 78);
  assert.equal(tk(r.summary.excise), 0);
  assert.equal(tk(r.summary.takeHome), 12702);
  assert.equal(r.months.length, 12);
  assert.equal(r.summary.maturityDate, '2027-01-15');
});
test('DPS quarterly compounding hand-calc = 801.90 interest', () => {
  const r = calcDPS(dpsIn(), cfg({ dps: { compoundingMonths: 3 } }));
  assert.equal(tk(r.summary.grossInterest), 801.9);
  assert.equal(tk(r.months.at(-1).closing), 12801.9);
});
test('DPS monthly compounding matches closed form within rounding', () => {
  const r = calcDPS(dpsIn(), cfg({ dps: { compoundingMonths: 1 } }));
  const closed = 1000 * ((1.01 ** 12 - 1) / 0.01) * 1.01; // 12809.3
  assert.ok(Math.abs(tk(r.summary.grossAmount) - closed) < 0.2);
});
test('DPS not-submitted charges 15%', () => {
  const r = calcDPS(dpsIn({ taxStatus: 'not_submitted' }), cfg({ dps: { compoundingMonths: 0 } }));
  assert.equal(tk(r.summary.sourceTax), 117);
});
test('DPS month table is continuous and totals reconcile', () => {
  const r = calcDPS(dpsIn({ tenureYears: 3 }), cfg());
  for (let i = 1; i < r.months.length; i++) assert.equal(r.months[i].opening, r.months[i - 1].closing);
  assert.equal(r.months.at(-1).closing, r.summary.grossAmount);
  assert.equal(r.months.reduce((s, m) => s + m.interest, 0), r.summary.grossInterest);
  assert.equal(r.summary.takeHome, r.summary.grossAmount - r.summary.sourceTax - r.summary.excise - r.summary.otherCharges);
});
test('DPS all supported tenures, multi-year excise, years sum to totals', () => {
  for (const y of [3, 5, 7]) {
    const r = calcDPS(dpsIn({ monthlyInstallment: 50000, tenureYears: y, openingDate: '2026-07-01' }), cfg());
    assert.equal(r.summary.installments, y * 12);
    assert.equal(r.years.reduce((s, x) => s + x.tax, 0), r.summary.sourceTax);
    assert.equal(r.years.reduce((s, x) => s + x.excise, 0), r.summary.excise);
    assert.equal(r.years.reduce((s, x) => s + x.interest, 0), r.summary.grossInterest);
    assert.equal(r.years.at(-1).netAccumulated, r.summary.takeHome + r.summary.otherCharges);
    assert.equal(new Set(r.exciseRows.map((e) => e.year)).size, r.exciseRows.length);
  }
});
test('DPS excise uses the peak balance in each year, not year-end', () => {
  const r = calcDPS(dpsIn({ monthlyInstallment: 90000, tenureYears: 3, openingDate: '2026-01-01' }), cfg({ excise: { basis: 'principal' } }));
  // principal at end 2026 = 12 x 90,000 = 10,80,000 -> 3,000 ; 2027 = 21,60,000 -> 3,000 ; 2028 = 32,40,000 -> 3,000
  assert.deepEqual(r.exciseRows.map((e) => tk(e.duty)), [3000, 3000, 3000]);
  assert.equal(r.exciseRows.length, 3); // maturity on 2029-01-01 must NOT add a 4th year
});
test('DPS custom installment day prorates first period; actual day count works', () => {
  const r = calcDPS(dpsIn({ installmentDay: 25, openingDate: '2026-01-10' }), cfg({ dps: { compoundingMonths: 0 } }));
  assert.deepEqual(r.errors, []);
  assert.equal(r.months[1].startDate, '2026-02-25');
  assert.ok(r.months[0].interest > toPaisa(10)); // longer than a month on 1000 @12%
  const a = calcDPS(dpsIn({ openingDate: '2024-01-01' }), cfg({ dps: { compoundingMonths: 0, dayCount: 'actual' } }));
  assert.deepEqual(a.errors, []);
  assert.ok(a.summary.grossInterest > 0);
});
test('DPS limits and validation', () => {
  assert.ok(calcDPS(dpsIn({ monthlyInstallment: 0 }), cfg()).errors.includes('amount_invalid'));
  assert.ok(calcDPS(dpsIn({ monthlyInstallment: 'x' }), cfg()).errors.length);
  assert.ok(calcDPS(dpsIn({ openingDate: '2026-02-30' }), cfg()).errors.includes('date_invalid'));
  const c = cfg({ limits: { dps: { min: 500, max: 100000 } } });
  assert.ok(calcDPS(dpsIn({ monthlyInstallment: 499 }), c).errors.includes('amount_min'));
  assert.deepEqual(calcDPS(dpsIn({ monthlyInstallment: 500 }), c).errors, []);
  assert.deepEqual(calcDPS(dpsIn({ monthlyInstallment: 100000 }), c).errors, []);
  assert.ok(calcDPS(dpsIn({ monthlyInstallment: 100001 }), c).errors.includes('amount_max'));
});
test('DPS leap-year opening date maturity', () => {
  const r = calcDPS(dpsIn({ openingDate: '2024-02-29', tenureYears: 3 }), cfg());
  assert.equal(r.summary.maturityDate, '2027-02-28');
});

// ---------- FDR ----------
const fdrIn = (o = {}) => ({ amount: 100000, ratePercent: 12, tenureMonths: 12, openingDate: '2026-03-01', autoRenewal: 'no', method: 'simple', taxStatus: 'submitted', ...o });
test('FDR simple 1,00,000 @12% for 12m', () => {
  const r = calcFDR(fdrIn(), cfg());
  assert.equal(tk(r.summary.grossInterest), 12000);
  assert.equal(tk(r.summary.grossAmount), 112000);
  assert.equal(tk(r.summary.sourceTax), 1200);
  assert.equal(tk(r.summary.excise), 0);
  assert.equal(tk(r.summary.takeHome), 110800);
  assert.equal(r.summary.maturityDate, '2027-03-01');
});
test('FDR all tenures simple', () => {
  const exp = { 1: 1000, 3: 3000, 6: 6000, 12: 12000 };
  for (const t of [1, 3, 6, 12]) {
    assert.equal(tk(calcFDR(fdrIn({ tenureMonths: t }), cfg()).summary.grossInterest), exp[t]);
  }
  assert.ok(calcFDR(fdrIn({ tenureMonths: 2 }), cfg()).errors.includes('tenure_invalid'));
});
test('FDR compound monthly 12m ~ 12,682.50', () => {
  const r = calcFDR(fdrIn({ method: 'compound', compoundingMonths: 1 }), cfg());
  assert.ok(Math.abs(tk(r.summary.grossInterest) - 12682.5) < 0.1);
});
test('FDR compound with frequency >= tenure falls back to simple', () => {
  const r = calcFDR(fdrIn({ tenureMonths: 3, method: 'compound', compoundingMonths: 12 }), cfg());
  assert.equal(tk(r.summary.grossInterest), 3000);
});
test('FDR excise boundary uses principal+interest basis (configurable)', () => {
  const inp = fdrIn({ amount: 1000000, openingDate: '2026-01-01' }); // stays inside calendar 2026
  assert.equal(tk(calcFDR(inp, cfg()).summary.excise), 3000);              // 11,20,000 peak
  assert.equal(tk(calcFDR(inp, cfg({ excise: { basis: 'principal' } })).summary.excise), 500); // 10,00,000 inclusive
  // opened mid-way: two calendar years -> 2026 peak 10,00,000 (500) + 2027 peak 11,20,000 (3,000)
  const two = calcFDR(fdrIn({ amount: 1000000, openingDate: '2026-02-01' }), cfg());
  assert.deepEqual(two.exciseRows.map((e) => tk(e.duty)), [500, 3000]);
});
test('FDR not submitted 15%', () => {
  assert.equal(tk(calcFDR(fdrIn({ taxStatus: 'not_submitted' }), cfg()).summary.sourceTax), 1800);
});
test('FDR auto-renewal: principal only (3m x 3 terms)', () => {
  const r = calcFDR(fdrIn({ tenureMonths: 3, autoRenewal: 'yes', renewals: 2, renewalMethod: 'principal_only' }), cfg());
  assert.equal(r.periods.length, 3);
  assert.deepEqual(r.periods.map((p) => tk(p.opening)), [100000, 100000, 100000]);
  assert.equal(tk(r.summary.grossInterest), 9000);
  assert.equal(tk(r.summary.sourceTax), 900);
  assert.equal(r.summary.maturityDate, '2026-12-01');
  assert.equal(r.summary.takeHome, r.summary.grossAmount - r.summary.sourceTax - r.summary.excise);
});
test('FDR auto-renewal: principal + net interest (tax every term)', () => {
  const r = calcFDR(fdrIn({ tenureMonths: 3, autoRenewal: 'yes', renewals: 1, renewalMethod: 'principal_net_interest' }), cfg());
  assert.equal(tk(r.periods[1].opening), 102700);              // 100000 + 3000 - 300
  assert.equal(tk(r.periods[1].interest), 3081);               // 102700 x 3%
  assert.equal(tk(r.summary.grossInterest), 6081);
  assert.equal(tk(r.summary.sourceTax), 608.1);
});
test('FDR auto-renewal: principal + gross interest defers tax to final maturity', () => {
  const r = calcFDR(fdrIn({ tenureMonths: 3, autoRenewal: 'yes', renewals: 1, renewalMethod: 'principal_interest' }), cfg());
  assert.equal(tk(r.periods[0].taxDeductedNow), 0);
  assert.equal(tk(r.periods[1].opening), 103000);
  assert.equal(tk(r.periods[1].interest), 3090);
  assert.equal(tk(r.periods[1].taxDeductedNow), 300 + 309);
  assert.equal(tk(r.periods[1].renewalAmount), 103000 + 3090 - 609);
});
test('FDR total tenure: 1-year FDR running 5 years = 5 terms (no separate auto-renewal switch)', () => {
  const r = calcFDR(fdrIn({ tenureMonths: 12, totalMonths: 60 }), cfg());
  assert.deepEqual(r.errors, []);
  assert.equal(r.periods.length, 5);
  assert.equal(r.summary.maturityDate, '2031-03-01');
  assert.equal(tk(r.summary.grossInterest), 60000);              // principal-only renewal, 12% x 5
});
test('FDR total tenure with compounding renewal (principal + net interest)', () => {
  const r = calcFDR(fdrIn({ tenureMonths: 12, totalMonths: 36, renewalMethod: 'principal_net_interest' }), cfg());
  assert.equal(tk(r.periods[1].opening), 110800);               // 1,00,000 + 12,000 - 1,200
  assert.equal(r.periods.length, 3);
});
test('FDR total tenure must be a multiple of the rate period', () => {
  assert.ok(calcFDR(fdrIn({ tenureMonths: 12, totalMonths: 30 }), cfg()).errors.includes('total_tenure_invalid'));
  assert.ok(calcFDR(fdrIn({ tenureMonths: 12, totalMonths: 6 }), cfg()).errors.includes('total_tenure_invalid'));
  assert.deepEqual(calcFDR(fdrIn({ tenureMonths: 3, totalMonths: 3 }), cfg()).errors, []);
});
test('FDR auto renewal off ignores renewals; renewal rates configurable', () => {
  assert.equal(calcFDR(fdrIn({ renewals: 5 }), cfg()).periods.length, 1);
  const r = calcFDR(fdrIn({ tenureMonths: 3, autoRenewal: 'yes', renewals: 1, renewalRatePercent: 6 }), cfg());
  assert.equal(tk(r.periods[1].interest), 1500);
});
test('FDR multi-calendar-year excise is charged once per year', () => {
  const r = calcFDR(fdrIn({ amount: 600000, tenureMonths: 6, autoRenewal: 'yes', renewals: 3, openingDate: '2026-07-01' }), cfg());
  assert.deepEqual(r.exciseRows.map((e) => e.year), [2026, 2027, 2028]);
  assert.equal(r.exciseRows.length, new Set(r.exciseRows.map((e) => e.year)).size);
});

// ---------- TBSD ----------
const PAY = { tbsd: { interestMode: 'payout' } };
const tbIn = (o = {}) => ({ mode: 'onetime', amount: 1200000, ratePercent: 12, tenureMonths: 12, openingDate: '2026-01-01', taxStatus: 'submitted', ...o });
test('TBSD payout mode, one-time: monthly interest paid, principal untouched', () => {
  const r = calcTBSD(tbIn(), cfg(PAY));
  assert.deepEqual(r.errors, []);
  assert.equal(r.months.length, 12);
  assert.equal(tk(r.months[0].grossInterest), 12000);
  assert.equal(tk(r.months[0].sourceTax), 1200);
  assert.equal(tk(r.months[0].netInterest), 10800);
  assert.equal(tk(r.summary.grossInterest), 144000);
  assert.equal(tk(r.summary.sourceTax), 14400);
  assert.equal(tk(r.summary.netInterestPaid), 129600);
  assert.equal(tk(r.summary.excise), 3000);                  // single calendar year (maturity 2027-01-01 not double counted)
  assert.equal(tk(r.summary.finalPrincipalPayable), 1197000);
  assert.equal(tk(r.summary.takeHome), 1200000 + 144000 - 14400 - 3000);
  assert.equal(r.summary.takeHome, r.summary.finalPrincipalPayable + r.summary.netInterestPaid);
});
test('TBSD one-time not submitted 15%', () => {
  const r = calcTBSD(tbIn({ taxStatus: 'not_submitted' }), cfg(PAY));
  assert.equal(tk(r.months[0].sourceTax), 1800);
});
test('TBSD monthly deposit: interest on growing balance, not compounded', () => {
  const r = calcTBSD(tbIn({ mode: 'monthly', amount: 10000, tenureMonths: 12 }), cfg(PAY));
  assert.equal(tk(r.summary.principal), 120000);
  assert.equal(tk(r.months[0].grossInterest), 100);       // 10,000 x 1%
  assert.equal(tk(r.months[11].grossInterest), 1200);     // 1,20,000 x 1%
  assert.equal(tk(r.summary.grossInterest), 7800);        // 100 x (1+..+12)
  assert.equal(r.months.reduce((s, m) => s + m.netInterest, 0), r.summary.netInterestPaid);
});
test('TBSD multi-year: duty each calendar year and tenures', () => {
  for (const n of [12, 24, 36, 60]) {
    const r = calcTBSD(tbIn({ tenureMonths: n, openingDate: '2026-06-15', amount: 600000 }), cfg(PAY));
    assert.equal(r.months.length, n);
    assert.equal(r.years.reduce((s, y) => s + y.excise, 0), r.summary.excise);
    assert.equal(r.years.reduce((s, y) => s + y.tax, 0), r.summary.sourceTax);
  }
});
test('TBSD validation', () => {
  assert.ok(calcTBSD(tbIn({ amount: -5 }), cfg(PAY)).errors.length);
  assert.ok(calcTBSD(tbIn({ tenureMonths: 0 }), cfg(PAY)).errors.includes('tenure_invalid'));
  assert.ok(calcTBSD(tbIn({ ratePercent: -1 }), cfg(PAY)).errors.includes('rate_invalid'));
});

test('TBSD default is monthly compound: net interest is added to the balance', () => {
  const r = calcTBSD(tbIn(), cfg());
  assert.deepEqual(r.errors, []);
  assert.equal(r.summary.compound, true);
  assert.equal(tk(r.months[0].grossInterest), 12000);
  assert.equal(tk(r.months[0].netInterest), 10800);
  assert.equal(tk(r.months[0].closing), 1210800);
  assert.equal(r.months[1].balance, r.months[0].closing);
  assert.equal(tk(r.months[1].grossInterest), 12108);          // 12,10,800 x 1%
  const closed = 1200000 * (1 + 0.01 * 0.9) ** 12;               // 13,36,2xx
  assert.ok(Math.abs(tk(r.months[11].closing) - closed) < 1);
  assert.equal(r.summary.excise > 0, true);
  assert.equal(r.summary.takeHome, r.months[11].closing - r.summary.excise - r.summary.otherCharges);
  assert.equal(r.summary.takeHome, r.summary.grossAmount - r.summary.totalDeductions);
});
test('TBSD compound, monthly deposits', () => {
  const r = calcTBSD(tbIn({ mode: 'monthly', amount: 10000, tenureMonths: 6 }), cfg());
  assert.equal(tk(r.months[0].closing), 10090);                  // 10,000 + 100 - 10
  assert.equal(tk(r.months[1].balance), 20090);                  // + second deposit
  assert.equal(r.summary.principal, toPaisa(60000));
  assert.equal(r.summary.takeHome, r.months[5].closing - r.summary.excise);
});
test('TBSD minimum tenure 6 months, no upper limit (manual years)', () => {
  assert.ok(calcTBSD(tbIn({ tenureMonths: 5 }), cfg()).errors.includes('tenure_min'));
  assert.deepEqual(calcTBSD(tbIn({ tenureMonths: 6 }), cfg()).errors, []);
  const r = calcTBSD(tbIn({ tenureMonths: 120, amount: 100000 }), cfg());     // 10 years
  assert.deepEqual(r.errors, []);
  assert.equal(r.months.length, 120);
  assert.equal(r.years.reduce((s, y) => s + y.excise, 0), r.summary.excise);
});

// ---------- cross-cutting ----------
test('Gross - tax - excise - other = take-home for all products with other charges', () => {
  const c = cfg({ otherCharges: { dps: 100, fdr: 50, tbsd: 25 } });
  for (const r of [calcDPS(dpsIn({ tenureYears: 3 }), c), calcFDR(fdrIn(), c), calcTBSD(tbIn(), c)]) {
    const s = r.summary;
    assert.equal(s.takeHome, s.grossAmount - s.sourceTax - s.excise - s.otherCharges);
    assert.equal(s.totalDeductions, s.sourceTax + s.excise + s.otherCharges);
  }
});
test('engine returns only integers (paisa)', () => {
  const r = calcDPS(dpsIn({ monthlyInstallment: '3333.33', ratePercent: '7.77', tenureYears: 5 }), cfg());
  for (const v of Object.values(r.summary)) if (typeof v === 'number') assert.ok(Number.isInteger(v));
  for (const m of r.months) assert.ok(Number.isInteger(m.interest) && Number.isInteger(m.closing));
});
