import { loadConfig, saveConfig, resetConfig } from './config.js';
import { calculate } from './engine/index.js';
import { PRODUCTS } from './products.js';
import { t, getLang, setLang } from './i18n.js';
import { fmtMoney, fmtDate, fmtInt, localizeDigits, esc } from './format.js';

const app = document.getElementById('app');
const $ = (s, r = document) => r.querySelector(s);
let cfg = loadConfig();
const VKEY = 'pbdc.vals.v1';
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const store = (k, v) => { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) { /* ignore */ } };
let vals = load(VKEY, {});
let last = (() => { try { return localStorage.getItem('pbdc.last') || ''; } catch (e) { return ''; } })();
if (!PRODUCTS[last]) last = '';

const L = () => getLang();
const M = (v, sym = true) => fmtMoney(v, L(), { symbol: sym });
const F = { m: (v) => M(v, false), d: (iso) => fmtDate(iso, L()), n: (n) => fmtInt(n, L()) };
const ensure = (p) => {
  if (!vals[p]) vals[p] = {};
  const d = PRODUCTS[p].defaults(cfg);
  for (const k of Object.keys(d)) if (vals[p][k] === undefined) vals[p][k] = d[k]; // mutate in place so bound references stay valid
  return vals[p];
};
const compute = (p) => calculate(p, PRODUCTS[p].engineInput(ensure(p)), cfg);

/* ---------------- icons ---------------- */
const G = '#1aa84f', GD = '#0d7a33', OR = '#f6a623';
const ICONS = {
  dps: `<svg viewBox="0 0 64 64"><ellipse cx="30" cy="40" rx="19" ry="17" fill="${G}"/><rect x="24" y="14" width="12" height="9" rx="3" fill="${GD}"/><circle cx="46" cy="30" r="11" fill="${OR}"/><text x="46" y="35" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">৳</text></svg>`,
  fdr: `<svg viewBox="0 0 64 64"><rect x="10" y="8" width="38" height="48" rx="6" fill="${G}"/><rect x="17" y="18" width="22" height="3.5" rx="1.7" fill="#d8f3e2"/><rect x="17" y="27" width="22" height="3.5" rx="1.7" fill="#d8f3e2"/><rect x="17" y="36" width="14" height="3.5" rx="1.7" fill="#d8f3e2"/><circle cx="46" cy="44" r="12" fill="${OR}"/><text x="46" y="50" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">%</text></svg>`,
  tbsd: `<svg viewBox="0 0 64 64"><rect x="8" y="12" width="40" height="40" rx="6" fill="${G}"/><rect x="8" y="12" width="40" height="11" rx="5" fill="${GD}"/><rect x="16" y="30" width="8" height="6" rx="1.5" fill="#d8f3e2"/><rect x="28" y="30" width="8" height="6" rx="1.5" fill="#d8f3e2"/><rect x="16" y="40" width="8" height="6" rx="1.5" fill="#d8f3e2"/><circle cx="46" cy="42" r="13" fill="${OR}"/><text x="46" y="48" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">৳</text></svg>`,
  details: `<svg viewBox="0 0 64 64"><rect x="12" y="8" width="40" height="48" rx="6" fill="${G}"/><rect x="20" y="20" width="24" height="4" rx="2" fill="#d8f3e2"/><rect x="20" y="30" width="24" height="4" rx="2" fill="#d8f3e2"/><rect x="20" y="40" width="14" height="4" rx="2" fill="#d8f3e2"/></svg>`,
  settings: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="18" fill="none" stroke="#9aa3ad" stroke-width="9" stroke-dasharray="7 7.07"/><circle cx="32" cy="32" r="14" fill="#9aa3ad"/><circle cx="32" cy="32" r="6" fill="#fff"/></svg>`,
  lang: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="${G}"/><text x="24" y="38" text-anchor="middle" font-size="18" font-weight="700" fill="#fff">A</text><text x="42" y="42" text-anchor="middle" font-size="17" font-weight="700" fill="#fff">অ</text></svg>`,
  user: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#e8f7ee"/><circle cx="32" cy="25" r="10" fill="${G}"/><path d="M12 54c3-12 13-17 20-17s17 5 20 17z" fill="${G}"/></svg>`,
  home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6zm8 1.5V8h4.5M9 13h8M9 17h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

/* ---------------- shared pieces ---------------- */
const nav = (active) => `<nav class="tabbar">
  <a href="#/" class="${active === 'home' ? 'on' : ''}">${ICONS.home}<span>${t('home')}</span></a>
  <a href="#/details/${last || 'dps'}" class="${active === 'details' ? 'on' : ''}">${ICONS.doc}<span>${t('details')}</span></a>
  <a href="#/settings" class="${active === 'settings' ? 'on' : ''}">${ICONS.gear}<span>${t('settings')}</span></a></nav>`;

const langBtn = () => `<button class="pill" id="lang" type="button">${t('language')}</button>`;
const topBar = (title, back = '#/') => `<header class="bar"><a class="back" href="${back}" aria-label="${t('back')}">‹</a><h1>${esc(title)}</h1>${langBtn()}</header>`;
const estNote = () => `<p class="est">${t('estimateBanner')}</p>`;

function methodList(p, r) {
  const m = r.meta;
  const rows = [];
  if (p === 'dps') {
    rows.push([t('mCompounding'), m.compoundingMonths > 0 ? t('mEveryN', { n: localizeDigits(m.compoundingMonths, L()) }) : t('mSimple')]);
  }
  if (p === 'fdr') {
    rows.push([t('method'), m.method === 'compound' ? `${t('compound')} (${t('mEveryN', { n: localizeDigits(m.compoundingMonths, L()) })})` : t('simple')]);
    if (m.renewalMethod) rows.push([t('renewalMethod'), t(`rm_${m.renewalMethod}`)]);
  }
  rows.push([t('mDayCount'), t(m.dayCount === 'actual' ? 'dcActual' : 'dcMonthly')]);
  const tt = p === 'fdr' ? (m.renewalMethod === 'principal_interest' ? 'tt_maturity' : 'tt_each_term') : `tt_${m.taxTiming}`;
  rows.push([t('mTaxTiming'), t(tt)]);
  rows.push([t('mExciseBasis'), t(`eb_${m.exciseBasis}`)]);
  rows.push([t('mRounding'), `${t(`rmode_${m.rounding.mode}`)} / ${t(`ru_${m.rounding.unit}`)}`]);
  return `<ul class="kv">${rows.map(([a, b]) => `<li><span>${esc(a)}</span><b>${esc(b)}</b></li>`).join('')}</ul>`;
}

function table(cols, rows, foot) {
  return `<div class="tablewrap"><table><thead><tr>${cols.map((c) => `<th class="${c.num ? 'num' : ''}">${esc(t(c.h))}</th>`).join('')}</tr></thead>
  <tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td class="${c.num ? 'num' : ''}">${c.f(r)}</td>`).join('')}</tr>`).join('')}</tbody>
  ${foot ? `<tfoot>${foot}</tfoot>` : ''}</table></div>`;
}
const yearCols = () => [
  { h: 'colYear', f: (y) => localizeDigits(y.year, L()) }, { h: 'colInstTotal', f: (y) => F.m(y.principal), num: 1 },
  { h: 'colAccInterest', f: (y) => F.m(y.interest), num: 1 }, { h: 'sourceTax', f: (y) => F.m(y.tax), num: 1 },
  { h: 'exciseDuty', f: (y) => F.m(y.excise), num: 1 }, { h: 'colNetAcc', f: (y) => F.m(y.netAccumulated), num: 1 },
];
const exciseCols = () => [
  { h: 'colYear', f: (e) => localizeDigits(e.year, L()) }, { h: 'colPeak', f: (e) => F.m(e.peakBalance), num: 1 }, { h: 'colDuty', f: (e) => F.m(e.duty), num: 1 },
];
const errorsHtml = (errs) => `<div class="card err"><ul>${errs.map((e) => `<li>${esc(t(`err_${e}`))}</li>`).join('')}</ul></div>`;

/* ---------------- Home ---------------- */
function viewHome() {
  const tile = (href, icon, label, sub, id) => `<${id ? 'button type="button" id="' + id + '"' : 'a href="' + href + '"'} class="tile">${ICONS[icon]}<span>${esc(label)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</${id ? 'button' : 'a'}>`;
  return `<div class="hero"><div class="seal">★</div><div class="brand"><div class="bn">পূবালী ব্যাংক পিএলসি</div><div class="en">PUBALI BANK PLC</div></div></div>
  <div class="userbar"><div class="avatar">${ICONS.user}</div><div class="uname">${esc(t('appTitle'))}</div>${langBtn()}</div>
  <main class="sheet"><div class="grid">
    ${tile('#/dps', 'dps', t('dps'), t('dpsFull'))}${tile('#/fdr', 'fdr', t('fdr'), t('fdrFull'))}${tile('#/tbsd', 'tbsd', t('tbsd'), t('tbsdFull'))}
    ${tile(`#/details/${last || 'dps'}`, 'details', t('lastResult'))}${tile('#/settings', 'settings', t('settings'))}${tile('', 'lang', t('language'), '', 'lang2')}
  </div>${estNote()}</main>${nav('home')}`;
}

/* ---------------- Calculator ---------------- */
function optLabel(o) { return o.lk ? t(o.lk) : `${localizeDigits(o.num, L())} ${t(o.sk)}`; }
function fieldsHtml(p) {
  const v = ensure(p);
  return PRODUCTS[p].fields(cfg, v).map((f) => {
    const label = `<span class="lbl">${esc(t(f.label))}</span>`;
    const hint = f.hint ? `<small class="hint">${esc(t(f.hint))}</small>` : '';
    if (f.type === 'seg') {
      return `<div class="fld">${label}<div class="seg" role="group">${f.options.map((o) => `<button type="button" class="${String(v[f.k]) === o.v ? 'on' : ''}" data-seg="${f.k}" data-v="${o.v}">${esc(optLabel(o))}</button>`).join('')}</div></div>`;
    }
    if (f.type === 'select') {
      return `<label class="fld">${label}<select data-k="${f.k}">${f.options.map((o) => `<option value="${o.v}" ${String(v[f.k]) === o.v ? 'selected' : ''}>${esc(optLabel(o))}</option>`).join('')}</select></label>`;
    }
    if (f.type === 'date') return `<label class="fld">${label}<input type="date" data-k="${f.k}" value="${esc(v[f.k])}"></label>`;
    const prefix = f.type === 'money' ? '<em>৳</em>' : f.type === 'percent' ? '<em>%</em>' : '';
    const ph = f.placeholderFrom ? esc(v[f.placeholderFrom]) : '';
    return `<label class="fld">${label}<div class="inp">${prefix}<input data-k="${f.k}" inputmode="${f.type === 'int' ? 'numeric' : 'decimal'}" autocomplete="off" value="${esc(v[f.k])}" placeholder="${ph}"></div>${hint}</label>`;
  }).join('');
}

function resultCard(p, r) {
  const s = r.summary;
  const rows = [
    `<div class="row"><span>${t('sourceTax')} (${localizeDigits(s.taxRatePct, L())}%)</span><b>${M(s.sourceTax)}</b></div>`,
    `<div class="row"><span>${t('exciseDuty')}</span><b>${M(s.excise)}</b></div>`,
    `<div class="row"><span>${t('otherCharges')}</span><b>${M(s.otherCharges)}</b></div>`,
  ].join('');
  const extra = p === 'tbsd' ? `<div class="extra"><div class="row"><span>${t('netInterestPaid')}</span><b>${M(s.netInterestPaid)}</b></div><div class="row"><span>${t('finalPrincipal')}</span><b>${M(s.finalPrincipalPayable)}</b></div><p class="note">${t('tbsdNote')}</p></div>` : '';
  return `<section class="card result">
    <div class="row gross"><span>${t('grossAmount')}</span><b>${M(s.grossAmount)}</b></div>
    <div class="less">${t('less')}:</div>${rows}
    <div class="row total"><span>${t('totalDeduction')}</span><b>${M(s.totalDeductions)}</b></div>
    <div class="take"><span>${t('takeHome')}</span><strong>${M(s.takeHome)}</strong></div>${extra}
    <a class="btn" href="#/details/${p}">${t('viewDetails')}</a>${estNote()}</section>`;
}

function renderResult(p) {
  const r = compute(p);
  last = p; store('pbdc.last', p);
  const box = $('#result'), sticky = $('#sticky');
  if (!box) return;
  if (r.errors.length) { box.innerHTML = errorsHtml(r.errors); sticky.classList.add('hide'); return; }
  box.innerHTML = resultCard(p, r);
  sticky.classList.remove('hide');
  sticky.innerHTML = `<div><small>${t('takeHome')}</small><b>${M(r.summary.takeHome)}</b></div><a href="#/details/${p}">${t('details')} ›</a>`;
}

function viewCalc(p) {
  return `${topBar(`${t(PRODUCTS[p].title)} — ${t(PRODUCTS[p].full)}`)}
  <main class="sheet pad"><section class="card"><div id="fields">${fieldsHtml(p)}</div></section><div id="result"></div></main>
  <div class="sticky hide" id="sticky"></div>${nav('')}`;
}
function bindCalc(p) {
  const v = ensure(p);
  const fields = $('#fields');
  const after = (k) => { PRODUCTS[p].onChange?.(k, v, cfg); store(VKEY, vals); fields.innerHTML = fieldsHtml(p); renderResult(p); };
  fields.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k || e.target.tagName === 'SELECT') return;
    v[k] = e.target.value; store(VKEY, vals); renderResult(p);
  });
  fields.addEventListener('change', (e) => { if (e.target.tagName === 'SELECT') { v[e.target.dataset.k] = e.target.value; after(e.target.dataset.k); } });
  fields.addEventListener('click', (e) => {
    const b = e.target.closest('[data-seg]');
    if (b) { v[b.dataset.seg] = b.dataset.v; after(b.dataset.seg); }
  });
  renderResult(p);
}

/* ---------------- Details ---------------- */
function summaryTab(p, r) {
  const s = r.summary, P = PRODUCTS[p];
  const rows = P.summaryRows(s, F).map(([k, val, cls]) => `<li class="${cls || ''}"><span>${t(k)}</span><b>${val}</b></li>`).join('');
  return `<section class="card"><h3>${t('maturityDetail')}</h3><ul class="kv">${rows}
    <li class="neg"><span>− ${t('sourceTax')} (${localizeDigits(s.taxRatePct, L())}%)</span><b>${F.m(s.sourceTax)}</b></li>
    <li class="neg"><span>− ${t('exciseDuty')}</span><b>${F.m(s.excise)}</b></li>
    <li class="neg"><span>− ${t('otherCharges')}</span><b>${F.m(s.otherCharges)}</b></li>
    <li class="neg"><span>${t('totalDeduction')}</span><b>${F.m(s.totalDeductions)}</b></li>
    <li class="take"><span>${t('takeHome')}</span><b>${M(s.takeHome)}</b></li></ul></section>
    <section class="card"><h3>${t('methodUsed')}</h3>${methodList(p, r)}</section>`;
}
function taxTab(p, r) {
  const s = r.summary;
  const eTotal = r.exciseRows.reduce((a, e) => a + e.duty, 0);
  return `<section class="card"><h3>${t('taxDetail')}</h3><ul class="kv">
    <li><span>${t('grossInterest')}</span><b>${F.m(s.grossInterest)}</b></li>
    <li><span>${t('taxRateApplied')}</span><b>${localizeDigits(s.taxRatePct, L())}%</b></li>
    <li class="strong"><span>${t('sourceTax')}</span><b>${F.m(s.sourceTax)}</b></li></ul></section>
    <section class="card"><h3>${t('exciseDetail')}</h3>${table(exciseCols(), r.exciseRows, `<tr><td colspan="2">${t('exciseDuty')}</td><td class="num"><b>${F.m(eTotal)}</b></td></tr>`)}</section>`;
}
function viewDetails(p, tab) {
  if (!PRODUCTS[p]) return `${topBar(t('details'))}<main class="sheet pad"><div class="card"><p>${t('noResult')}</p></div></main>${nav('details')}`;
  const r = compute(p);
  const P = PRODUCTS[p];
  const tabs = [['summary', 'tabSummary'], ['monthly', P.monthlyTab], ['yearly', 'tabYearly'], ['tax', 'tabTax']];
  const head = `${topBar(`${t(P.title)} — ${t('details')}`, `#/${p}`)}
  <div class="tabs">${tabs.map(([k, lk]) => `<a href="#/details/${p}/${k}" class="${tab === k ? 'on' : ''}">${t(lk)}</a>`).join('')}</div>`;
  if (r.errors.length) return `${head}<main class="sheet pad">${errorsHtml(r.errors)}</main>${nav('details')}`;
  let body;
  if (tab === 'monthly') body = `<section class="card">${table(P.monthlyCols(F), r[P.tableKey])}</section>`;
  else if (tab === 'yearly') body = `<section class="card">${table(yearCols(), r.years)}</section>`;
  else if (tab === 'tax') body = taxTab(p, r);
  else body = summaryTab(p, r);
  return `${head}<main class="sheet pad">${body}
    <div class="actions"><button class="btn" id="print" type="button">${t('print')}</button><button class="btn ghost" id="csv" type="button">${t('csv')}</button></div>${estNote()}</main>${nav('details')}`;
}

/* ---------------- Statement (print) + CSV ---------------- */
function inputsTable(p) {
  const v = ensure(p);
  const rows = PRODUCTS[p].fields(cfg, v).map((f) => {
    let val = v[f.k] ?? '';
    if (f.type === 'seg' || f.type === 'select') { const o = f.options.find((x) => x.v === String(val)); val = o ? optLabel(o) : val; }
    else if (f.type === 'date') val = F.d(val);
    else if (f.type === 'money') val = M(Math.round(Number(val) * 100));
    else if (f.type === 'percent') val = val === '' ? '—' : `${localizeDigits(val, L())}%`;
    else val = val === '' ? '—' : localizeDigits(val, L());
    return `<li><span>${esc(t(f.label))}</span><b>${esc(val)}</b></li>`;
  }).join('');
  return `<ul class="kv">${rows}</ul>`;
}
function statementHtml(p, r) {
  const P = PRODUCTS[p], s = r.summary;
  const eTotal = r.exciseRows.reduce((a, e) => a + e.duty, 0);
  return `<h1>পূবালী ব্যাংক পিএলসি / PUBALI BANK PLC</h1><h2>${t('statement')} — ${t(P.title)} (${t(P.full)})</h2>
  <p>${t('generatedOn')}: ${F.d(new Date().toISOString().slice(0, 10))}</p>
  <h3>${t('inputs')}</h3>${inputsTable(p)}
  <h3>${t('maturityDetail')}</h3>${summaryTab(p, r)}
  <h3>${t(P.monthlyTab)}</h3>${table(P.monthlyCols(F), r[P.tableKey])}
  <h3>${t('tabYearly')}</h3>${table(yearCols(), r.years)}
  <h3>${t('exciseDetail')}</h3>${table(exciseCols(), r.exciseRows, `<tr><td colspan="2">${t('exciseDuty')}</td><td class="num"><b>${F.m(eTotal)}</b></td></tr>`)}
  <p class="est">${t('estimateNote')}</p>`;
}
function doPrint(p) {
  const r = compute(p);
  if (r.errors.length) return;
  $('#print-root').innerHTML = statementHtml(p, r);
  window.print();
}
function doCsv(p) {
  const r = compute(p);
  if (r.errors.length) return;
  const q = (x) => `"${String(x).replace(/"/g, '""')}"`;
  const plain = (cols, rows) => [cols.map((c) => q(t(c.h))).join(','), ...rows.map((row) => cols.map((c) => q(c.f(row).replace(/<[^>]*>/g, '')) ).join(','))].join('\n');
  const s = r.summary, P = PRODUCTS[p];
  const sumRows = [[t('grossAmount'), F.m(s.grossAmount)], [t('sourceTax'), F.m(s.sourceTax)], [t('exciseDuty'), F.m(s.excise)], [t('otherCharges'), F.m(s.otherCharges)], [t('totalDeduction'), F.m(s.totalDeductions)], [t('takeHome'), F.m(s.takeHome)]];
  const text = ['﻿' + q(t('statement') + ' - ' + t(P.title)), '', ...sumRows.map((x) => x.map(q).join(',')), '', plain(P.monthlyCols(F), r[P.tableKey]), '', plain(yearCols(), r.years), '', plain(exciseCols(), r.exciseRows), '', q(t('estimateNote'))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  a.download = `pubali-${p}-statement.csv`;
  document.body.appendChild(a); a.click(); a.remove();
}

/* ---------------- Settings ---------------- */
const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
function setPath(obj, path, val) { const ks = path.split('.'); const last_ = ks.pop(); ks.reduce((o, k) => o[k], obj)[last_] = val; }
function numInput(path, label, suffix = '') {
  return `<label class="fld sm"><span class="lbl">${esc(label)}</span><div class="inp"><input data-path="${path}" data-num="1" inputmode="decimal" value="${esc(get(cfg, path))}">${suffix ? `<em>${suffix}</em>` : ''}</div></label>`;
}
function selInput(path, label, options, num) {
  return `<label class="fld sm"><span class="lbl">${esc(label)}</span><select data-path="${path}" ${num ? 'data-num="1"' : ''}>${options.map(([v, l]) => `<option value="${v}" ${String(get(cfg, path)) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
}
function viewSettings() {
  const cm = [[0, t('cmSimple')], [1, t('cmMonthly')], [3, t('cmQuarterly')], [6, t('cmHalf')], [12, t('cmYearly')]];
  const dc = [['monthly', t('dcMonthly')], ['actual', t('dcActual')]];
  const slabs = cfg.excise.slabs.map((s, i) => `<div class="slab"><input data-slab="${i}" data-f="upTo" inputmode="numeric" placeholder="${t('sNoLimit')}" value="${s.upTo ?? ''}"><input data-slab="${i}" data-f="duty" inputmode="numeric" value="${s.duty}"><button type="button" class="x" data-del="${i}" aria-label="remove">×</button></div>`).join('');
  return `${topBar(t('settings'))}<main class="sheet pad">
  <section class="card"><h3>${t('sRates')}</h3><p class="note">${t('sRatesNote')}</p>
    <h4>${t('dps')}</h4><div class="g3">${[3, 5, 7].map((y) => numInput(`rates.dps.${y}`, `${localizeDigits(y, L())} ${t('years')}`, '%')).join('')}</div>
    <h4>${t('fdr')}</h4><div class="g2">${[1, 3, 6, 12].map((m) => numInput(`rates.fdr.${m}`, m === 12 ? `1 ${t('year')}`.replace('1', localizeDigits(1, L())) : `${localizeDigits(m, L())} ${t('months')}`, '%')).join('')}</div>
    <h4>${t('tbsd')}</h4>${numInput('rates.tbsd.default', t('rate'), '%')}</section>
  <section class="card"><h3>${t('sTax')}</h3><div class="g2">${numInput('tax.submitted', t('submitted'), '%')}${numInput('tax.notSubmitted', t('notSubmitted'), '%')}</div></section>
  <section class="card"><h3>${t('sExcise')}</h3><div class="slabhead"><span>${t('sUpTo')}</span><span>${t('sDuty')}</span></div><div id="slabs">${slabs}</div>
    <button type="button" class="btn ghost" id="addSlab">${t('sAddSlab')}</button></section>
  <section class="card"><h3>${t('sMethods')}</h3>
    ${selInput('dps.compoundingMonths', t('sDpsCm'), cm, true)}${selInput('dps.dayCount', t('sDpsDc'), dc)}
    ${selInput('fdr.compoundingMonths', t('sFdrCm'), cm.slice(1), true)}${selInput('fdr.dayCount', t('sFdrDc'), dc)}${selInput('tbsd.dayCount', t('sTbsdDc'), dc)}
    ${selInput('excise.basis', t('sExBasis'), [['principal', t('eb_principal')], ['principal_plus_interest', t('eb_principal_plus_interest')]])}</section>
  <section class="card"><h3>${t('sRounding')}</h3>
    ${selInput('rounding.mode', t('sRoundMode'), ['half_up', 'floor', 'ceil', 'bankers'].map((m) => [m, t(`rmode_${m}`)]))}
    ${selInput('rounding.unit', t('sRoundUnit'), [['paisa', t('ru_paisa')], ['taka', t('ru_taka')]])}</section>
  <section class="card"><h3>${t('sDefaults')}</h3>
    ${selInput('defaults.dpsYears', `${t('dps')} (${t('years')})`, [[3, '3'], [5, '5'], [7, '7']].map(([v, l]) => [v, localizeDigits(l, L())]), true)}
    ${selInput('defaults.fdrMonths', `${t('fdr')} (${t('months')})`, [1, 3, 6, 12].map((m) => [m, localizeDigits(m, L())]), true)}
    <label class="fld sm"><span class="lbl">${t('sTbsdTenures')}</span><div class="inp"><input id="tbsdTen" value="${cfg.tbsd.tenures.join(', ')}"></div></label>
    ${selInput('defaults.tbsdMonths', `${t('tbsd')} (${t('months')})`, cfg.tbsd.tenures.map((m) => [m, localizeDigits(m, L())]), true)}</section>
  <section class="card"><h3>${t('sOther')}</h3><div class="g3">${['dps', 'fdr', 'tbsd'].map((k) => numInput(`otherCharges.${k}`, t(k))).join('')}</div></section>
  <section class="card"><h3>${t('sLimits')}</h3>${['dps', 'fdr', 'tbsd'].map((k) => `<h4>${t(k)}</h4><div class="g2">${numInput(`limits.${k}.min`, t('sMin'))}${numInput(`limits.${k}.max`, t('sMax'))}</div>`).join('')}</section>
  <button type="button" class="btn ghost danger" id="reset">${t('sReset')}</button><p class="note center" id="saved"></p></main>${nav('settings')}`;
}
function bindSettings() {
  const flash = () => { const s = $('#saved'); if (s) s.textContent = `✓ ${t('sSaved')}`; };
  const commit = () => { saveConfig(cfg); flash(); };
  app.addEventListener('change', onSettingsChange);
  function onSettingsChange(e) {
    const el = e.target;
    if (el.dataset.path) {
      let val = el.value.trim();
      if (el.dataset.num) { const n = Number(val); if (val === '' || Number.isNaN(n)) return; val = n; }
      setPath(cfg, el.dataset.path, val); commit();
    } else if (el.dataset.slab !== undefined) {
      const i = Number(el.dataset.slab), f = el.dataset.f, raw = el.value.trim();
      if (f === 'upTo') cfg.excise.slabs[i].upTo = raw === '' ? null : Number(raw);
      else cfg.excise.slabs[i].duty = Number(raw) || 0;
      commit();
    } else if (el.id === 'tbsdTen') {
      const list = el.value.split(',').map((x) => parseInt(x, 10)).filter((n) => n > 0);
      if (list.length) { cfg.tbsd.tenures = [...new Set(list)].sort((a, b) => a - b); commit(); render(); }
    }
  }
  app.addEventListener('click', onSettingsClick);
  function onSettingsClick(e) {
    const el = e.target.closest('button');
    if (!el) return;
    if (el.id === 'addSlab') { cfg.excise.slabs.push({ upTo: null, duty: 0 }); commit(); render(); }
    else if (el.dataset.del !== undefined) { cfg.excise.slabs.splice(Number(el.dataset.del), 1); commit(); render(); }
    else if (el.id === 'reset' && confirm(t('sConfirmReset'))) { cfg = resetConfig(); vals = {}; store(VKEY, vals); render(); }
  }
  settingsCleanup = () => { app.removeEventListener('change', onSettingsChange); app.removeEventListener('click', onSettingsClick); };
}
let settingsCleanup = null;

/* ---------------- Router ---------------- */
function render() {
  settingsCleanup?.(); settingsCleanup = null;
  const [page = '', a, b] = location.hash.replace(/^#\/?/, '').split('/');
  let html;
  if (PRODUCTS[page]) html = viewCalc(page);
  else if (page === 'details') html = viewDetails(PRODUCTS[a] ? a : last, b || 'summary');
  else if (page === 'settings') html = viewSettings();
  else html = viewHome();
  app.innerHTML = html;
  document.title = `${t('appTitle')} | Pubali Bank`;
  const toggle = () => { setLang(L() === 'en' ? 'bn' : 'en'); render(); };
  $('#lang')?.addEventListener('click', toggle);
  $('#lang2')?.addEventListener('click', toggle);
  if (PRODUCTS[page]) bindCalc(page);
  else if (page === 'details') {
    const p = PRODUCTS[a] ? a : last;
    $('#print')?.addEventListener('click', () => doPrint(p));
    $('#csv')?.addEventListener('click', () => doCsv(p));
  } else if (page === 'settings') bindSettings();
  if (!(page === 'settings')) window.scrollTo(0, 0);
}
setLang(L());
window.addEventListener('hashchange', render);
render();
