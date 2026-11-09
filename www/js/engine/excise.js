import { toPaisa } from './money.js';
import { yearOf } from './dates.js';

/** Duty (paisa) for a balance (paisa). Slab `upTo` is inclusive, in BDT; null/undefined = no upper limit. */
export function dutyForBalance(balancePaisa, slabs) {
  const sorted = [...slabs].sort((a, b) => (a.upTo == null ? Infinity : a.upTo) - (b.upTo == null ? Infinity : b.upTo));
  for (const s of sorted) {
    if (s.upTo == null || s.upTo === '' || balancePaisa <= toPaisa(s.upTo)) return toPaisa(s.duty);
  }
  return 0;
}

/**
 * One duty per calendar year, based on the HIGHEST balance seen in that year (not year-end).
 * snapshots: [{date:'YYYY-MM-DD', balance:paisa}] -> [{year, peakBalance, duty}]
 */
export function exciseByYear(snapshots, exciseCfg) {
  const peaks = new Map();
  for (const s of snapshots) {
    const y = yearOf(s.date);
    peaks.set(y, Math.max(peaks.get(y) || 0, s.balance));
  }
  return [...peaks.keys()].sort((a, b) => a - b).map((year) => ({
    year,
    peakBalance: peaks.get(year),
    duty: dutyForBalance(peaks.get(year), exciseCfg.slabs),
  }));
}
