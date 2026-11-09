// Integer money helpers. All amounts inside the engine are integer PAISA (1 BDT = 100 paisa).
// Intermediate products use BigInt so there is no floating-point drift.

/** Parse a decimal string/number (taka or percent) into integer hundredths, half-up on the 3rd decimal. NaN if invalid. */
export function toPaisa(v) {
  if (v === null || v === undefined) return NaN;
  const s = String(v).trim();
  if (!/^-?\d*\.?\d*$/.test(s) || s === '' || s === '.' || s === '-') return NaN;
  const neg = s.startsWith('-');
  const [i, f = ''] = s.replace('-', '').split('.');
  const frac = (f + '00').slice(0, 2);
  const up = f.length > 2 && f[2] >= '5' ? 1 : 0;
  const p = Number(i || '0') * 100 + Number(frac) + up;
  return neg ? -p : p;
}

/** (a * b) / c with integer rounding. a,b,c are non-negative integers. */
export function mulDiv(a, b, c, mode = 'half_up') {
  const num = BigInt(a) * BigInt(b);
  const den = BigInt(c);
  let q = num / den;
  const r = num % den;
  const twice = r * 2n;
  if (mode === 'half_up') { if (twice >= den) q += 1n; }
  else if (mode === 'ceil') { if (r > 0n) q += 1n; }
  else if (mode === 'bankers') { if (twice > den || (twice === den && q % 2n === 1n)) q += 1n; }
  // 'floor' / 'truncate': nothing to add
  return Number(q);
}

/** mulDiv honouring the configured rounding {mode, unit: 'paisa'|'taka'} */
export function mulDivR(a, b, c, rounding = { mode: 'half_up', unit: 'paisa' }) {
  if (rounding.unit === 'taka') return mulDiv(a, b, c * 100, rounding.mode) * 100;
  return mulDiv(a, b, c, rounding.mode);
}
