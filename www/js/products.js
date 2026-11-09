// UI-side product definitions. To add a product: register its engine function in engine/index.js,
// then add an entry here (defaults, fields, onChange, engineInput, tables).
import { todayISO } from './format.js';

const seg = (k, label, opts) => ({ k, type: 'seg', label, options: opts });
const rateOf = (cfg, p, key) => String(cfg.rates[p][key] ?? cfg.rates[p].default ?? 8);

export const PRODUCTS = {
  dps: {
    id: 'dps', icon: 'dps', title: 'dps', full: 'dpsFull', monthlyTab: 'tabMonthly', tableKey: 'months',
    defaults: (cfg) => ({
      monthlyInstallment: '5000', tenureYears: String(cfg.defaults.dpsYears), ratePercent: rateOf(cfg, 'dps', cfg.defaults.dpsYears),
      taxStatus: 'submitted', openingDate: todayISO(), installmentDay: '',
    }),
    fields: () => [
      { k: 'monthlyInstallment', type: 'money', label: 'monthlyInstallment' },
      seg('tenureYears', 'tenure', [3, 5, 7].map((n) => ({ v: String(n), num: n, sk: 'years' }))),
      { k: 'ratePercent', type: 'percent', label: 'rate', hint: 'rateHint' },
      seg('taxStatus', 'taxStatus', [{ v: 'submitted', lk: 'submitted' }, { v: 'not_submitted', lk: 'notSubmitted' }]),
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
    id: 'fdr', icon: 'fdr', title: 'fdr', full: 'fdrFull', monthlyTab: 'tabPeriods', tableKey: 'periods',
    defaults: (cfg) => ({
      amount: '500000', tenureMonths: String(cfg.defaults.fdrMonths), ratePercent: rateOf(cfg, 'fdr', cfg.defaults.fdrMonths),
      openingDate: todayISO(), autoRenewal: 'no', renewals: '3', renewalMethod: 'principal_only', renewalRatePercent: '',
      method: 'simple', compoundingMonths: String(cfg.fdr.compoundingMonths || 3), taxStatus: 'submitted',
    }),
    fields: (cfg, v) => [
      { k: 'amount', type: 'money', label: 'initialDeposit' },
      seg('tenureMonths', 'tenure', [1, 3, 6, 12].map((n) => (n === 12
        ? { v: '12', num: 1, sk: 'year' } : { v: String(n), num: n, sk: 'months' }))),
      { k: 'ratePercent', type: 'percent', label: 'rate', hint: 'rateHint' },
      { k: 'openingDate', type: 'date', label: 'openingDate' },
      seg('method', 'method', [{ v: 'simple', lk: 'simple' }, { v: 'compound', lk: 'compound' }]),
      ...(v.method === 'compound' ? [seg('compoundingMonths', 'compounding', [
        { v: '1', lk: 'cmMonthly' }, { v: '3', lk: 'cmQuarterly' }, { v: '6', lk: 'cmHalf' }, { v: '12', lk: 'cmYearly' }])] : []),
      seg('taxStatus', 'taxStatus', [{ v: 'submitted', lk: 'submitted' }, { v: 'not_submitted', lk: 'notSubmitted' }]),
      seg('autoRenewal', 'autoRenewal', [{ v: 'yes', lk: 'yes' }, { v: 'no', lk: 'no' }]),
      ...(v.autoRenewal === 'yes' ? [
        { k: 'renewals', type: 'int', label: 'renewals' },
        seg('renewalMethod', 'renewalMethod', [
          { v: 'principal_only', lk: 'rm_principal_only' }, { v: 'principal_interest', lk: 'rm_principal_interest' },
          { v: 'principal_net_interest', lk: 'rm_principal_net_interest' }]),
        { k: 'renewalRatePercent', type: 'percent', label: 'renewalRate', placeholderFrom: 'ratePercent' },
      ] : []),
    ],
    onChange: (k, v, cfg) => { if (k === 'tenureMonths') v.ratePercent = rateOf(cfg, 'fdr', v.tenureMonths); },
    engineInput: (v) => ({ ...v, renewalRatePercent: v.renewalRatePercent === '' ? undefined : v.renewalRatePercent }),
    monthlyCols: (f) => [
      { h: 'colPeriod', f: (r) => `${f.n(r.n)}${r.isFinal ? '' : ''}` }, { h: 'colDate', f: (r) => `${f.d(r.startDate)} → ${f.d(r.endDate)}` },
      { h: 'colOpeningPrincipal', f: (r) => f.m(r.opening), num: 1 }, { h: 'colInterest', f: (r) => f.m(r.interest), num: 1 },
      { h: 'colTax', f: (r) => f.m(r.tax), num: 1 }, { h: 'colRenewalFinal', f: (r) => f.m(r.renewalAmount), num: 1 },
    ],
    summaryRows: (s, f) => [
      ['principal', f.m(s.principal)], ['grossInterest', f.m(s.grossInterest)], ['grossMaturity', f.m(s.grossAmount), 'strong'],
      ['maturityDate', f.d(s.maturityDate)],
    ],
  },

  tbsd: {
    id: 'tbsd', icon: 'tbsd', title: 'tbsd', full: 'tbsdFull', monthlyTab: 'tabMonthly', tableKey: 'months',
    defaults: (cfg) => ({
      mode: 'onetime', amount: '500000', tenureMonths: String(cfg.defaults.tbsdMonths), ratePercent: rateOf(cfg, 'tbsd', 'default'),
      openingDate: todayISO(), taxStatus: 'submitted',
    }),
    fields: (cfg, v) => [
      seg('mode', 'depositMode', [{ v: 'onetime', lk: 'modeOnetime' }, { v: 'monthly', lk: 'modeMonthly' }]),
      { k: 'amount', type: 'money', label: v.mode === 'monthly' ? 'monthlyDeposit' : 'initialDeposit' },
      { k: 'tenureMonths', type: 'select', label: 'tenureMonths', options: (cfg.tbsd.tenures || [12]).map((n) => ({ v: String(n), num: n, sk: 'months' })) },
      { k: 'ratePercent', type: 'percent', label: 'rate', hint: 'rateHint' },
      seg('taxStatus', 'taxStatus', [{ v: 'submitted', lk: 'submitted' }, { v: 'not_submitted', lk: 'notSubmitted' }]),
      { k: 'openingDate', type: 'date', label: 'openingDate' },
    ],
    onChange: () => {},
    engineInput: (v) => ({ ...v }),
    monthlyCols: (f) => [
      { h: 'colMonth', f: (r) => f.n(r.n) }, { h: 'colDate', f: (r) => f.d(r.payDate) },
      { h: 'colDeposit', f: (r) => f.m(r.deposit), num: 1 }, { h: 'colBalance', f: (r) => f.m(r.balance), num: 1 },
      { h: 'colGrossInt', f: (r) => f.m(r.grossInterest), num: 1 }, { h: 'sourceTax', f: (r) => f.m(r.sourceTax), num: 1 },
      { h: 'colNetInt', f: (r) => f.m(r.netInterest), num: 1 },
    ],
    summaryRows: (s, f) => [
      ['principal', f.m(s.principal)], ['grossInterest', f.m(s.grossInterest)], ['grossAmount', f.m(s.grossAmount), 'strong'],
      ['netInterestPaid', f.m(s.netInterestPaid)], ['finalPrincipal', f.m(s.finalPrincipalPayable)], ['maturityDate', f.d(s.maturityDate)],
    ],
  },
};
