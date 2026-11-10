// Default configuration. Everything here is editable in Settings and stored in localStorage;
// the engine never reads constants from anywhere else.
//
// IMPORTANT: interest rates below are ILLUSTRATIVE PLACEHOLDERS, not Pubali Bank's published rates.
// Update them in Settings (or here) from the bank's current rate sheet before real customer use.

export const DEFAULT_CONFIG = {
  version: 1,
  rounding: { mode: 'half_up', unit: 'paisa' }, // mode: half_up | floor | ceil | bankers ; unit: paisa | taka
  tax: { submitted: 10, notSubmitted: 15 },
  rates: {
    dps: { 3: 8, 5: 8, 7: 8 },
    fdr: { 1: 8, 3: 8, 6: 8, 12: 8 },
    tbsd: { default: 8 },
  },
  excise: {
    // balance basis for the "highest balance in the year": principal | principal_plus_interest
    basis: 'principal_plus_interest',
    slabs: [
      { upTo: 300000, duty: 0 },
      { upTo: 500000, duty: 150 },
      { upTo: 1000000, duty: 500 },
      { upTo: 5000000, duty: 3000 },
      { upTo: 10000000, duty: 5000 },
      { upTo: 20000000, duty: 10000 },
      { upTo: 50000000, duty: 20000 },
      { upTo: null, duty: 50000 },
    ],
  },
  otherCharges: { dps: 0, fdr: 0, tbsd: 0 }, // BDT, flat
  limits: { // BDT, technical guard rails (edit to match product rules)
    dps: { min: 1, max: 10000000000 },
    fdr: { min: 1, max: 10000000000 },
    tbsd: { min: 1, max: 10000000000 },
  },
  dps: { compoundingMonths: 3, dayCount: 'monthly' }, // compoundingMonths: 0 = simple, 1, 3, 6, 12
  fdr: { compoundingMonths: 3, dayCount: 'monthly' },
  // interestMode: 'compound' = net interest (after source tax) is credited monthly and compounds; 'payout' = paid out monthly
  tbsd: { dayCount: 'monthly', interestMode: 'compound', minMonths: 6, tenures: [6, 12, 24, 36, 48, 60] }, // months
  defaults: { dpsYears: 5, fdrMonths: 12, tbsdMonths: 12 },
};

const KEY = 'pbdc.config.v1';

export function loadConfig() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return merge(structuredClone(DEFAULT_CONFIG), JSON.parse(raw));
  } catch (e) { /* ignore */ }
  return structuredClone(DEFAULT_CONFIG);
}
export function saveConfig(cfg) { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* ignore */ } }
export function resetConfig() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } return structuredClone(DEFAULT_CONFIG); }

function merge(base, over) {
  for (const k of Object.keys(over || {})) {
    if (Array.isArray(over[k])) base[k] = over[k];
    else if (over[k] && typeof over[k] === 'object' && base[k] && typeof base[k] === 'object') merge(base[k], over[k]);
    else base[k] = over[k];
  }
  return base;
}
