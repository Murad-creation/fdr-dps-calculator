// UI-side product definitions. To add a product: register its engine function in engine/index.js,
// then add an entry here (defaults, fields, onChange, engineInput, tables).
import { todayISO } from './format.js';

const seg = (k, label, opts, extra = {}) => ({ k, type: 'seg', label, options: opts, ...extra });
const rateOf = (cfg, p, key) => String(cfg.rates[p][key] ?? cfg.rates[p].default ?? 8);
const taxSeg = () => seg('taxStatus', 'taxStatus', [{ v: 'submitted', lk: 'submitted' }, { v: 'not_submitted', lk: 'notSubmitted' }]);
const monthsOpt = (n) => (n % 12 === 0
  ? { v: String(n), num: n / 12, sk: n === 12 ? 'year' : 'years' }
  : { v: String(n), num: n, sk: 'months' });
const blank = (x) => x === undefined || x === null || String(x).trim() === '';

export const PRODUCTS = {
  dps: {
    id: 'dps', title: 'dps', full: 'dpsFull', monthlyTab: 'tabMonthly', tableKey: 'months',
    defaults: (cfg) => ({
      monthlyInstallment: '5000', tenureYears: String(cfg.defaults.dpsYears), ratePercent: rateOf(cfg, 'dps', cfg.defaults.dpsYears),
      taxStatus: 'submitted', openingDate: todayISO(), installmentDay: '',
    }),
    fields: () => [
      { k: 'monthlyInstallment', type: 'money', label: 'monthlyInstallment' },
      seg('tenureYears', 'tenure', [3, 5, 7].map((n) => ({ v: String(n), num: n, sk: 'years' }))),
      { k: 'ratePercent', type: 'percent', label: 'rate', hint: 'rateHint' },
      taxSeg(),
      { k: 'openingDate', type: 'date', label: 'openingDate' },
      { k: 'installmentDay', type: 'int', label: 'installmentDay', hint: 'installmentDayHint' },
    ],
    onChange: (k, v, cfg) => { if (k === 'tenureYears') v.ratePercent = rateOf(cfg, 'dps', v.tenureYears); },
    engineInput: (v) => ({ ...v }),
    monthlyCols: (f) => [
      { h: 'colMonth', f: (r) => f.n(r.n) }, { h: 'colDate', f: (r) => f.d(r.startDate) },
      { h: 'colInstallment', f: (r) => f.m(r.installment), num: 1 }, { h: 'colOpening', f: (r) => f.m(r.opening), num: 1 },
      { h: 'colInterest', f: (r) => f.m(r.interest), num: 1 }, { h: 'colClosing', f: (r) => f.m(r.closing), num: 1 },
    ],
    summaryRows: (s, f) => [
      ['principal', f.m(s.principal)], ['grossInterest', f.m(s.grossInterest)], ['grossMaturity', f.m(s.grossAmount), 'strong'],
      ['installments', f.n(s.installments)], ['maturityDate', f.d(s.maturityDate)],
    ],
  },

  fdr: {
    id: 'fdr', title: 'fdr', full: 'fdrFull', monthlyTab: 'tabPeriods', tableKey: 'periods',
    defaults: (cfg) => ({
      amount: '500000', tenureMonths: String(cfg.defaults.fdrMonths), ratePercent: rateOf(cfg, 'fdr', cfg.defaults.fdrMonths),
      totalYears: '1', totalExtraMonths: '0', openingDate: todayISO(), renewalMethod: 'principal_only', renewalRatePercent: '',
      method: 'simple', compoundingMonths: String(cfg.fdr.compoundingMonths || 3), taxStatus: 'submitted',
    }),
    // The 1/3/6/12-month choice only selects the interest rate (and renewal period). Total tenure is a separate input;
    // the FDR renews automatically at the end of each term until the total tenure is reached.
    fields: (cfg, v) => {
      const T = Number(v.tenureMonths) || 12;
      const total = Math.round((Number(v.totalYears) || 0) * 12 + (Number(v.totalExtraMonths) || 0));
      return [
        { k: 'amount', type: 'money', label: 'initialDeposit' },
        seg('tenureMonths', 'fdrTerm', [1, 3, 6, 12].map(monthsOpt)),
        { k: 'ratePercent', type: 'percent', label: 'rate', hint: 'rateHint' },
        { k: 'totalYears', type: 'dec', label: 'totalYears', hint: 'totalTenureHint' },
        { k: 'totalExtraMonths', type: 'int', label: 'totalExtraMonths' },
        { k: 'openingDate', type: 'date', label: 'openingDate' },
        seg('method', 'method', [{ v: 'simple', lk: 'simple' }, { v: 'compound', lk: 'compound' }]),
        ...(v.method === 'compound' ? [seg('compoundingMonths', 'compounding', [
          { v: '1', lk: 'cmMonthly' }, { v: '3', lk: 'cmQuarterly' }, { v: '6', lk: 'cmHalf' }, { v: '12', lk: 'cmYearly' }])] : []),
        taxSeg(),
        ...(total > T ? [
          seg('renewalMethod', 'renewalMethod', [
            { v: 'principal_only', lk: 'rm_principal_only' }, { v: 'principal_interest', lk: 'rm_principal_interest' },
            { v: 'principal_net_interest', lk: 'rm_principal_net_interest' }]),
          { k: 'renewalRatePercent', type: 'percent', label: 'renewalRate', placeholderFrom: 'ratePercent' },
        ] : []),
      ];
    },
    onChange: (k, v, cfg) => { if (k === 'tenureMonths') v.ratePercent = rateOf(cfg, 'fdr', v.tenureMonths); },
    engineInput: (v) => {
      const total = Math.round((Number(v.totalYears) || 0) * 12 + (Number(v.totalExtraMonths) || 0));
      return { ...v, totalMonths: total, renewalRatePercent: blank(v.renewalRatePercent) ? undefined : v.renewalRatePercent };
    },
    monthlyCols: (f) => [
      { h: 'colPeriod', f: (r) => f.n(r.n) }, { h: 'colDate', f: (r) => `${f.d(r.startDate)} → ${f.d(r.endDate)}` },
      { h: 'colOpeningPrincipal', f: (r) => f.m(r.opening), num: 1 }, { h: 'colInterest', f: (r) => f.m(r.interest), num: 1 },
      { h: 'colTax', f: (r) => f.m(r.tax), num: 1 }, { h: 'colRenewalFinal', f: (r) => f.m(r.renewalAmount), num: 1 },
    ],
    summaryRows: (s, f) => [
      ['principal', f.m(s.principal)], ['grossInterest', f.m(s.grossInterest)], ['grossMaturity', f.m(s.grossAmount), 'strong'],
      ['terms', f.n(s.terms)], ['maturityDate', f.d(s.maturityDate)],
    ],
  },

  tbsd: {
    id: 'tbsd', title: 'tbsd', full: 'tbsdFull', monthlyTab: 'tabMonthly', tableKey: 'months',
    defaults: (cfg) => ({
      mode: 'onetime', amount: '500000', tenureMonths: String(cfg.defaults.tbsdMonths), tenureYears: '',
      ratePercent: rateOf(cfg, 'tbsd', 'default'), openingDate: todayISO(), taxStatus: 'submitted',
    }),
    fields: (cfg, v) => [
      seg('mode', 'depositMode', [{ v: 'onetime', lk: 'modeOnetime' }, { v: 'monthly', lk: 'modeMonthly' }]),
      { k: 'amount', type: 'money', label: v.mode === 'monthly' ? 'monthlyDeposit' : 'initialDeposit' },
      seg('tenureMonths', 'tenure', (cfg.tbsd.tenures || [6, 12]).map(monthsOpt), { overriddenBy: 'tenureYears' }),
      { k: 'tenureYears', type: 'dec', label: 'tbsdManualYears', hint: 'tbsdManualHint' },
      { k: 'ratePercent', type: 'percent', label: 'rate', hint: 'rateHint' },
      taxSeg(),
      { k: 'openingDate', type: 'date', label: 'openingDate' },
    ],
    onChange: () => {},
    // A manually typed number of years overrides the month presets (fractions allowed, e.g. 2.5 years = 30 months).
    engineInput: (v) => ({ ...v, tenureMonths: blank(v.tenureYears) ? v.tenureMonths : Math.round(Number(v.tenureYears) * 12) }),
    monthlyCols: (f, r) => [
      { h: 'colMonth', f: (x) => f.n(x.n) }, { h: 'colDate', f: (x) => f.d(x.payDate) },
      { h: 'colDeposit', f: (x) => f.m(x.deposit), num: 1 }, { h: 'colOpening', f: (x) => f.m(x.balance), num: 1 },
      { h: 'colGrossInt', f: (x) => f.m(x.grossInterest), num: 1 }, { h: 'sourceTax', f: (x) => f.m(x.sourceTax), num: 1 },
      { h: r?.summary?.compound ? 'colNetIntCredit' : 'colNetInt', f: (x) => f.m(x.netInterest), num: 1 },
      ...(r?.summary?.compound ? [{ h: 'colClosing', f: (x) => f.m(x.closing), num: 1 }] : []),
    ],
    summaryRows: (s, f) => [
      ['principal', f.m(s.principal)], ['grossInterest', f.m(s.grossInterest)], ['grossAmount', f.m(s.grossAmount), 'strong'],
      [s.compound ? 'netInterestCredited' : 'netInterestPaid', f.m(s.netInterestPaid)],
      [s.compound ? 'finalPayable' : 'finalPrincipal', f.m(s.finalPrincipalPayable)], ['maturityDate', f.d(s.maturityDate)],
    ],
  },
};
