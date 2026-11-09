// Date helpers on ISO strings (YYYY-MM-DD). Pure calendar arithmetic, no timezone dependence.
const pad = (n) => String(n).padStart(2, '0');

export const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; };
export const toISO = ({ y, m, d }) => `${y}-${pad(m)}-${pad(d)}`;
export const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
export const daysInYear = (y) => (isLeap(y) ? 366 : 365);
export const daysInMonth = (y, m) => [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
export const yearOf = (iso) => Number(iso.slice(0, 4));

export function isValidISO(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const { y, m, d } = parseISO(s);
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

export const dayNumber = (iso) => { const { y, m, d } = parseISO(iso); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };
export const diffDays = (a, b) => dayNumber(b) - dayNumber(a);

/** Add n months, clamping the day to month length (31 Jan + 1m = 28/29 Feb). Always compute from the opening date to avoid drift. */
export function addMonths(iso, n) {
  const { y, m, d } = parseISO(iso);
  const t = y * 12 + (m - 1) + n;
  const ny = Math.floor(t / 12), nm = (t % 12) + 1;
  return toISO({ y: ny, m: nm, d: Math.min(d, daysInMonth(ny, nm)) });
}

/** The given day-of-month in the month that is n months after iso's month (clamped). */
export function dayInMonthOffset(iso, n, day) {
  const { y, m } = parseISO(iso);
  const t = y * 12 + (m - 1) + n;
  const ny = Math.floor(t / 12), nm = (t % 12) + 1;
  return toISO({ y: ny, m: nm, d: Math.min(day, daysInMonth(ny, nm)) });
}

export function addDays(iso, n) {
  const dt = new Date(dayNumber(iso) * 86400000 + n * 86400000);
  return toISO({ y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() });
}
/** Last day an account is active for a period ending (exclusive) on `endISO`. */
export const activeEnd = (endISO) => addDays(endISO, -1);
