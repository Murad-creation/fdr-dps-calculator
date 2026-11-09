// Bangladeshi (lakh/crore) grouping, BDT symbol, Bangla digits, dates.
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];

export const localizeDigits = (s, lang) => (lang === 'bn' ? String(s).replace(/\d/g, (d) => BN_DIGITS[d]) : String(s));

export function groupBD(intStr) {
  if (intStr.length <= 3) return intStr;
  const last3 = intStr.slice(-3);
  const rest = intStr.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/** paisa (integer) -> "৳ 10,00,000.00" */
export function fmtMoney(paisa, lang = 'en', { symbol = true } = {}) {
  const neg = paisa < 0;
  const abs = Math.abs(paisa);
  const taka = Math.floor(abs / 100);
  const p = String(abs % 100).padStart(2, '0');
  const s = `${neg ? '-' : ''}${groupBD(String(taka))}.${p}`;
  return localizeDigits(symbol ? `৳ ${s}` : s, lang);
}
export const fmtInt = (n, lang) => localizeDigits(groupBD(String(Math.round(n))), lang);
export const fmtPct = (n, lang) => localizeDigits(`${Number(n)}%`, lang);

export function fmtDate(iso, lang = 'en') {
  const [y, m, d] = iso.split('-').map(Number);
  const mon = (lang === 'bn' ? MONTHS_BN : MONTHS_EN)[m - 1];
  return localizeDigits(`${String(d).padStart(2, '0')} ${mon} ${y}`, lang);
}
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
