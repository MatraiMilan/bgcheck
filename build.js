import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Jimp } from 'jimp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BeerCheck Dashboard</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍺</text></svg>">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{overflow-y:scroll}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#faf7f3;color:#1a1a1a;min-height:100vh}
header{background:#1c1007;color:#fff;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
header h1{font-size:1.3rem;font-weight:700}
.meta{font-size:.78rem;color:#b8977e}
.toolbar{background:#fff;border-bottom:1px solid #ddd0b8;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;position:sticky;top:0;z-index:10;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.stats{display:flex;flex-direction:column;align-items:center;gap:16px}
.stats-row{display:flex;gap:20px;flex-wrap:wrap;justify-content:center}
.stats-total{font-size:.83rem;color:#666}
.stat{font-size:.83rem;color:#666}
.stat strong{color:#1a1a1a;font-weight:600}
#search{padding:7px 12px;border:1.5px solid #ddd;border-radius:6px;font-size:.88rem;width:210px;outline:none;transition:border-color .15s;margin-left:auto}
#search:focus{border-color:#d97706}
#search::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none;cursor:pointer;width:10px;height:10px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M1 1l10 10M11 1L1 11' stroke='%23d97706' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat center/contain}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px;padding:28px 32px 28px;max-width:1400px;margin:0 auto}
.card{background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.22);cursor:pointer;display:flex;flex-direction:column;transition:box-shadow .15s,transform .15s}
.card:hover{box-shadow:0 5px 18px rgba(0,0,0,.26);transform:translateY(-2px)}
.card.hidden{display:none}
.card-img{aspect-ratio:1/1;background:#fdf6ee;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;flex-shrink:0}
.card-img-inner{width:calc(100% - 20px);height:calc(100% - 20px);border-radius:10px 10px 0 0;overflow:hidden;display:flex;align-items:center;justify-content:center}
.card-img img{width:100%;height:100%;object-fit:contain}
.fallback{font-size:3.2rem;opacity:.22}
.badge{position:absolute;top:8px;right:8px;font-size:.68rem;font-weight:700;padding:2px 7px;border-radius:99px;letter-spacing:.05em;text-transform:uppercase;margin:10px}
.badge.in{background:#dcfce7;color:#15803d}
.badge.out{background:#fee2e2;color:#b91c1c}
.badge.new{background:#dbeafe;color:#1d4ed8}
.badge.back{background:#ede9fe;color:#7c3aed}
.card-body{padding:11px 13px 9px;display:flex;flex-direction:column;gap:5px;flex:1}
.card-name{font-size:.9rem;font-weight:600;line-height:1.4;color:#2d2015;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card-price-row{display:flex;align-items:center;gap:7px}
.card-price{font-size:1.15rem;font-weight:700;color:#d97706}
.change{font-size:1.15rem;font-weight:700;line-height:1}
.change.up{color:#dc2626}
.change.down{color:#16a34a}
.sparkline-wrap{height:90px;padding:8px 13px 12px}
.sparkline-wrap canvas{width:100%!important;height:74px!important}
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200;align-items:center;justify-content:center;padding:20px}
.overlay.open{display:flex}
.modal{background:#fff;border-radius:12px;width:100%;max-width:700px;max-height:90vh;overflow-y:auto;padding:22px;position:relative}
.modal-top{display:flex;align-items:flex-start;gap:14px;margin-bottom:14px}
.modal-img{width:76px;height:76px;object-fit:contain;background:#fdf6ee;border-radius:8px;padding:6px;flex-shrink:0}
.modal-img-ph{width:76px;height:76px;display:flex;align-items:center;justify-content:center;font-size:2.6rem;background:#fdf6ee;border-radius:8px;flex-shrink:0}
.modal-info{flex:1;min-width:0}
.modal-info h2{font-size:.95rem;font-weight:700;color:#1a1a1a;line-height:1.4;margin-bottom:4px}
.modal-info a{font-size:.78rem;color:#d97706;text-decoration:none}
.modal-info a:hover{opacity:.8}
.modal-close{background:none;border:none;font-size:1.3rem;cursor:pointer;color:#aaa;line-height:1;padding:4px;flex-shrink:0;margin-left:auto}
.modal-close:hover{color:#333}
.modal-kpis{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #f0e8d8}
.kpi{font-size:.82rem;color:#666}
.kpi strong{color:#1a1a1a;font-weight:600}
.modal-chart{position:relative;height:260px}
.stat-check{font-size:.83rem;color:#666;display:flex;align-items:center;gap:5px;cursor:pointer;user-select:none}
.stat-check input[type=checkbox]{accent-color:#d97706;cursor:pointer;width:14px;height:14px;flex-shrink:0}
.stat-check.disabled{opacity:.35;cursor:not-allowed}
.stat-check.disabled input[type=checkbox]{cursor:not-allowed}
.price-filter{display:flex;flex-direction:column;gap:7px;min-width:200px;max-width:280px}
.range-wrap{position:relative;height:28px}
.range-track{position:absolute;top:50%;transform:translateY(-50%);height:4px;width:100%;background:#ddd0b8;border-radius:2px;pointer-events:none}
.range-fill{position:absolute;height:100%;background:#d97706;border-radius:2px}
.range-wrap input[type=range]{-webkit-appearance:none;appearance:none;position:absolute;width:100%;height:100%;top:0;background:transparent;pointer-events:none;outline:none;margin:0;padding:0}
.range-wrap input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#1c1007;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);pointer-events:all;cursor:pointer}
.range-wrap input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#1c1007;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);pointer-events:all;cursor:pointer}
.range-vals{display:flex;align-items:center;gap:8px}
.range-val{background:#fdf6ee;border:1px solid #ddd0b8;border-radius:20px;padding:3px 10px;font-size:.8rem;font-weight:500;color:#1a1a1a;min-width:88px;text-align:center;outline:none;font-family:inherit;cursor:text}
.range-val:focus{border-color:#d97706;background:#fff}
.range-sep{color:#aaa;font-size:.9rem}
.csel{position:relative}
.csel-btn{display:flex;align-items:center;gap:8px;padding:7px 12px;border:1.5px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;font-size:.88rem;font-family:inherit;color:#1a1a1a;transition:border-color .15s;white-space:nowrap;width:210px;justify-content:space-between}
.csel-btn:focus{outline:none}
.csel.open .csel-btn,.csel-btn:focus{border-color:#d97706}
.csel-chevron{flex-shrink:0;transition:transform .2s ease}
.csel.open .csel-chevron{transform:rotate(180deg)}
.csel-list{display:none;position:absolute;top:calc(100% + 4px);left:0;min-width:100%;background:#fff;border:1.5px solid #ddd;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.1);z-index:50;overflow:hidden}
.csel.open .csel-list{display:block}
.csel-option{padding:8px 14px;cursor:pointer;font-size:.88rem;white-space:nowrap;transition:background .1s}
.csel-option:hover{background:#fdf6ee}
.sort-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:0;height:36px;border:1.5px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;font-size:.88rem;font-family:inherit;color:#1a1a1a;transition:border-color .15s,background .15s;white-space:nowrap;user-select:none;width:60px;flex-shrink:0}
.sort-btn:hover{border-color:#d97706}
.sort-btn.active{border-color:#d97706;background:#fdf6ee;color:#d97706}
.sort-btn.active .sort-arrow{font-size:1.25rem;margin-bottom:0.25rem}
.sort-arrow{font-size:1rem;line-height:1;display:inline-flex;align-items:center;justify-content:center;width:18px}
.csel-option.selected{color:#d97706;font-weight:600}
.price-sort-group{display:flex;align-items:center;gap:24px;flex-shrink:0}
.toolbar-chevron{display:none;position:absolute;bottom:-24px;left:50%;transform:translateX(-50%);width:48px;height:24px;background:#fff;border:1px solid #ddd0b8;border-top:none;border-radius:0 0 100px 100px;cursor:pointer;z-index:11;-webkit-tap-highlight-color:transparent;user-select:none}
.toolbar-chevron::after{content:'';position:absolute;top:3px;left:50%;width:9px;height:9px;border-right:1.5px solid #1a1a1a;border-bottom:1.5px solid #1a1a1a;transform:translateX(-50%) rotate(45deg);transition:transform .4s ease,top .4s ease}
.toolbar-chevron.active::after{transform:translateX(-50%) rotate(225deg);top:7px}
.toolbar-filters{display:contents}
@media(min-width:1178px){#search{margin-left:0}}
@media(max-width:725px){
  .toolbar{padding:8px 12px 8px;gap:12px;align-items:center}
  .toolbar-chevron{display:block}
  .toolbar-filters{display:flex;flex-direction:column;gap:18px;width:100%;max-height:0;overflow:hidden;transition:max-height .5s ease,padding-top .5s ease;padding-top:0}
  .toolbar-filters.open{max-height:280px;padding-top:14px}
  .stats{width:100%;justify-content:center}
  .price-sort-group{width:100%;flex-shrink:1}
  .price-filter{min-width:0;flex:1;max-width:none}
  .csel{width:100%}
  .csel-btn{width:100%}
  .csel-list{width:100%}
  #search{width:100%}
  .grid{padding:34px 14px 14px;gap:14px}
  .reset-fab{width:60px;height:60px}
  .reset-fab.pushed{bottom:96px}
  .scroll-top-fab{width:60px;height:60px}
}
.reset-fab{position:fixed;bottom:24px;right:24px;width:52px;height:52px;border-radius:50%;background:#1c1007;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.85),0 1px 3px rgba(0,0,0,.6);opacity:0;pointer-events:none;transition:opacity 300ms ease,transform .15s ease,bottom 300ms ease;z-index:100}
.reset-fab.visible{opacity:1;pointer-events:auto}
.reset-fab.pushed{bottom:88px}
.reset-fab:hover{background:#3a2010}
.reset-fab:active{transform:scale(.94)}
.scroll-top-fab{position:fixed;bottom:24px;right:24px;width:52px;height:52px;border-radius:50%;background:#1c1007;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.85),0 1px 3px rgba(0,0,0,.6);opacity:0;pointer-events:none;transform:translateY(80px);transition:opacity 300ms ease,transform 300ms ease;z-index:100}
.scroll-top-fab.visible{opacity:1;pointer-events:auto;transform:translateY(0)}
.scroll-top-fab:hover{background:#3a2010}
.scroll-top-fab:active{transform:scale(.94)}
.bell-btn{background:none;border:none;cursor:pointer;padding:6px;position:relative;color:#fff;display:flex;align-items:center;justify-content:center;border-radius:6px;transition:background .15s;flex-shrink:0}
.bell-btn:hover{background:rgba(255,255,255,.12)}
.bell-badge{position:absolute;top:2px;right:2px;width:16px;height:16px;background:#ef4444;border-radius:50%;display:none;align-items:center;justify-content:center;font-size:.62rem;font-weight:700;color:#fff;border:1.5px solid #1c1007;line-height:1;pointer-events:none}
body.scroll-locked{position:fixed;width:100%}
.diff-modal-box{overflow:hidden;display:flex;flex-direction:column}
#diff-list{max-height:460px;overflow-y:auto}
#diff-subtitle{display:flex;align-items:center;gap:5px;flex-wrap:wrap;font-size:.78rem;color:#d97706;margin-top:2px}
.diff-item{display:flex;align-items:center;gap:12px;padding:8px 6px;border-bottom:1px solid #f0e8d8;border-radius:6px;transition:background .1s;cursor:pointer;text-decoration:none;color:inherit}
.diff-item:hover{background:#faf5ee}
.diff-item:last-child{border-bottom:none}
.diff-item-img{width:48px;height:48px;object-fit:contain;border-radius:6px;padding:4px;flex-shrink:0}
.diff-item-name{font-size:.85rem;font-weight:600;color:#1a1a1a;line-height:1.35;margin-bottom:3px}
.diff-item-change{font-size:.8rem;display:flex;gap:8px;align-items:center;justify-content:flex-start}
.diff-empty{text-align:center;padding:32px 0;color:#999;font-size:.9rem}
.ext-link{color:#d97706;display:inline-flex;align-items:center;flex-shrink:0;padding:2px;border-radius:3px;transition:opacity .15s}
.ext-link:hover{opacity:.7}
</style>
</head>
<body>

<header>
  <div style="display:flex;align-items:center;gap:16px">
    <div style="display:flex;gap:8px;align-items:flex-start">
      <span style="font-size:1.3rem;line-height:1.4">🍺</span>
      <div>
        <h1>BeerCheck Dashboard</h1>
        <span class="meta" id="meta"></span>
      </div>
    </div>
  </div>
  <button class="bell-btn" id="bell-btn" title="Legújabb változások" aria-label="Legújabb változások">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    <span class="bell-badge" id="bell-badge">!</span>
  </button>
</header>

<div class="toolbar">
  <div class="stats" id="stats"></div>
  <div class="toolbar-filters" id="toolbar-filters">
    <div class="price-sort-group">
      <div class="price-filter">
        <div class="range-wrap">
          <div class="range-track"><div class="range-fill" id="rf"></div></div>
          <input type="range" id="pmin" step="1">
          <input type="range" id="pmax" step="1">
        </div>
        <div class="range-vals">
          <input class="range-val" id="pmin-val" type="text">
          <span class="range-sep">—</span>
          <input class="range-val" id="pmax-val" type="text">
        </div>
      </div>
      <button type="button" class="sort-btn" id="sort-btn">
        <span>Ár</span><span class="sort-arrow" id="sort-arrow">⇅</span>
      </button>
    </div>
    <div class="csel" id="csel">
      <button type="button" class="csel-btn" id="csel-btn">
        <span id="csel-label">Minden kategória</span>
        <svg class="csel-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="csel-list" id="csel-list"></div>
    </div>
    <input id="search" type="search" placeholder="Keresés…">
  </div>
  <div class="toolbar-chevron" id="toolbar-chevron"></div>
</div>

<div class="grid" id="grid"></div>

<button class="reset-fab" id="reset-fab" title="Szűrők törlése" aria-label="Szűrők törlése">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
</button>

<button class="scroll-top-fab" id="scroll-top-fab" title="Ugrás az elejére" aria-label="Ugrás az elejére">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
</button>

<div class="overlay" id="overlay">
  <div class="modal">
    <div class="modal-top">
      <div id="modal-img"></div>
      <div class="modal-info" id="modal-info"></div>
      <button class="modal-close" id="modal-close">✕</button>
    </div>
    <div class="modal-kpis" id="modal-kpis"></div>
    <div class="modal-chart"><canvas id="mchart"></canvas></div>
  </div>
</div>

<div class="overlay" id="diff-overlay">
  <div class="modal diff-modal-box">
    <div class="modal-top" style="flex-shrink:0">
      <div class="modal-info">
        <h2>Legújabb változások</h2>
        <div id="diff-subtitle"></div>
      </div>
      <button class="modal-close" id="diff-modal-close">✕</button>
    </div>
    <div id="diff-list"></div>
  </div>
</div>

<script type="application/json" id="D">__DATA__<\/script>
<script>
const DATA = JSON.parse(document.getElementById('D').textContent);

const fmt = p => Math.round(p).toLocaleString('hu-HU') + ' Ft';
const fmtDate = iso => new Date(iso).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
const fmtDT = iso => new Date(iso).toLocaleString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escA = s => s.replace(/"/g,'&quot;');

document.getElementById('meta').textContent = 'Generálva: ' + DATA.generatedAt;

const all = Object.values(DATA.products);
const getState = p => {
  const latest = p.history.at(-1);
  if (latest.outOfStock) return 'out';
  if (p.history.length === 1) return 'new';
  if (p.history.at(-2).price === null) return 'back';
  return 'in';
};
const inCount  = all.filter(p => getState(p) === 'in').length;
const outCount = all.filter(p => getState(p) === 'out').length;
const newCount = all.filter(p => getState(p) === 'new' || getState(p) === 'back').length;
const statCheck = (id, label, count) =>
  '<label class="stat-check' + (count === 0 ? ' disabled' : '') + '"><input type="checkbox" id="' + id + '"' + (count === 0 ? ' disabled' : ' checked') + '> ' + label + ': <strong>' + count + '</strong></label>';
document.getElementById('stats').innerHTML =
  '<div class="stats-total">Összesen: <strong>' + all.length + '</strong></div>' +
  '<div class="stats-row">' +
  statCheck('chk-in', 'Készleten', inCount) +
  statCheck('chk-out', 'Elfogyott', outCount) +
  statCheck('chk-new', 'Új', newCount) +
  '</div>';

// Price range init
const allPrices = all.map(p => p.history.at(-1).price);
const globalMin = Math.min(...allPrices);
const globalMax = Math.max(...allPrices);
const pmin = document.getElementById('pmin');
const pmax = document.getElementById('pmax');
const rf = document.getElementById('rf');
[pmin, pmax].forEach(el => { el.min = globalMin; el.max = globalMax; });
pmin.value = globalMin;
pmax.value = globalMax;

const pminVal = document.getElementById('pmin-val');
const pmaxVal = document.getElementById('pmax-val');
const parsePrice = s => parseInt(String(s).replace(/[^0-9]/g, '')) || 0;

const updateRangeFill = () => {
  const lo = parseInt(pmin.value), hi = parseInt(pmax.value);
  const span = globalMax - globalMin;
  rf.style.left  = ((lo - globalMin) / span * 100) + '%';
  rf.style.right = ((globalMax - hi) / span * 100) + '%';
  if (document.activeElement !== pminVal) pminVal.value = fmt(lo);
  if (document.activeElement !== pmaxVal) pmaxVal.value = fmt(hi);
};
updateRangeFill();

// Custom section dropdown
let cselValue = '';
const csel = document.getElementById('csel');
const cselBtn = document.getElementById('csel-btn');
const cselLabel = document.getElementById('csel-label');
const cselList = document.getElementById('csel-list');

const seenSections = [];
Object.values(DATA.products).forEach(p => {
  if (p.section && !seenSections.includes(p.section)) seenSections.push(p.section);
});

[{ value: '', label: 'Minden kategória' }, ...seenSections.map(s => ({
  value: s, label: s.split(' ').slice(0, 2).join(' ')
}))].forEach(opt => {
  const item = document.createElement('div');
  item.className = 'csel-option' + (opt.value === '' ? ' selected' : '');
  item.dataset.value = opt.value;
  item.textContent = opt.label;
  item.addEventListener('click', () => {
    cselValue = opt.value;
    cselLabel.textContent = opt.label;
    cselList.querySelectorAll('.csel-option').forEach(o =>
      o.classList.toggle('selected', o.dataset.value === cselValue));
    csel.classList.remove('open');
    applyFilters();
  });
  cselList.appendChild(item);
});

cselBtn.addEventListener('click', e => { e.stopPropagation(); csel.classList.toggle('open'); });
document.addEventListener('click', () => csel.classList.remove('open'));

// Combined filter
const applyFilters = () => {
  const q = document.getElementById('search').value.toLowerCase().trim();
  const lo = parseInt(pmin.value), hi = parseInt(pmax.value);
  const showIn  = document.getElementById('chk-in')?.checked ?? true;
  const showOut = document.getElementById('chk-out')?.checked ?? true;
  const showNew = document.getElementById('chk-new')?.checked ?? true;
  const section = cselValue;
  document.querySelectorAll('.card').forEach(card => {
    const p = DATA.products[card.dataset.id];
    const latest = p.history.at(-1);
    const state = card.dataset.state;
    const hidden =
      (q && !card.dataset.name.includes(q)) ||
      (latest.price < lo || latest.price > hi) ||
      (state === 'out' ? !showOut : state === 'in' ? !showIn : !showNew) ||
      (section && p.section !== section);
    card.classList.toggle('hidden', hidden);
  });
  updateResetBtn();
};

// Slider input handlers
pmin.addEventListener('input', () => {
  if (parseInt(pmin.value) > parseInt(pmax.value)) pmin.value = pmax.value;
  updateRangeFill(); applyFilters();
});
pmax.addEventListener('input', () => {
  if (parseInt(pmax.value) < parseInt(pmin.value)) pmax.value = pmin.value;
  updateRangeFill(); applyFilters();
});

// Text input handlers
pminVal.addEventListener('focus', () => { pminVal.value = parseInt(pmin.value); pminVal.select(); });
pminVal.addEventListener('input', () => {
  const v = Math.max(globalMin, Math.min(parsePrice(pminVal.value), parseInt(pmax.value)));
  pmin.value = v; updateRangeFill(); applyFilters();
});
pminVal.addEventListener('blur', () => { pminVal.value = fmt(parseInt(pmin.value)); });

pmaxVal.addEventListener('focus', () => { pmaxVal.value = parseInt(pmax.value); pmaxVal.select(); });
pmaxVal.addEventListener('input', () => {
  const v = Math.min(globalMax, Math.max(parsePrice(pmaxVal.value), parseInt(pmin.value)));
  pmax.value = v; updateRangeFill(); applyFilters();
});
pmaxVal.addEventListener('blur', () => { pmaxVal.value = fmt(parseInt(pmax.value)); });

document.getElementById('chk-in')?.addEventListener('change', applyFilters);
document.getElementById('chk-out')?.addEventListener('change', applyFilters);
document.getElementById('chk-new')?.addEventListener('change', applyFilters);

// Price sort
const sortStates = [null, 'asc', 'desc'];
const sortArrows = { null: '⇅', asc: '↑', desc: '↓' };
let sortIdx = 0;
const sortBtn = document.getElementById('sort-btn');
const sortArrow = document.getElementById('sort-arrow');
const applySort = () => {
  const state = sortStates[sortIdx];
  sortArrow.textContent = sortArrows[state];
  sortBtn.classList.toggle('active', state !== null);
  const cards = [...document.querySelectorAll('.card')];
  const grid = document.getElementById('grid');
  if (!state) {
    cards.sort((a, b) => a.dataset.origIdx - b.dataset.origIdx);
  } else {
    cards.sort((a, b) => {
      const pa = DATA.products[a.dataset.id].history.at(-1).price;
      const pb = DATA.products[b.dataset.id].history.at(-1).price;
      return state === 'asc' ? pa - pb : pb - pa;
    });
  }
  cards.forEach(c => grid.appendChild(c));
  updateResetBtn();
};
sortBtn.addEventListener('click', () => { sortIdx = (sortIdx + 1) % sortStates.length; applySort(); });

const grid = document.getElementById('grid');
Object.entries(DATA.products).forEach(([id, p], origIdx) => {
  const latest = p.history.at(-1);
  const prev = p.history.length > 1 ? p.history.at(-2) : null;
  const diff = (prev && prev.price !== null) ? latest.price - prev.price : 0;
  const changeHtml = diff > 0 ? '<span class="change up" title="+' + fmt(diff) + '">&#9650;</span>'
    : diff < 0 ? '<span class="change down" title="-' + fmt(-diff) + '">&#9660;</span>' : '';
  const state = latest.outOfStock ? 'out' : p.history.length === 1 ? 'new' : (prev && prev.price === null) ? 'back' : 'in';
  const badgeText = { in: 'Készleten', out: 'Elfogyott', new: 'Új', back: 'Újra elérhető' }[state];

  const imgHtml = p.image
    ? '<div class="card-img-inner"><img src="' + escA(p.image) + '" alt="" loading="lazy" onerror="this.style.display=\\'none\\';this.nextSibling.style.display=\\'flex\\'"></div>'
      + '<span class="fallback" style="display:none">&#x1F37A;</span>'
    : '<span class="fallback">&#x1F37A;</span>';

  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id = id;
  card.dataset.name = p.name.toLowerCase();
  card.dataset.state = state;
  card.dataset.origIdx = origIdx;
  const bgStyle = p.bgColor ? ' style="background:' + p.bgColor + '"' : '';
  card.innerHTML =
    '<div class="card-img"' + bgStyle + '>' + imgHtml +
      '<span class="badge ' + state + '">' + badgeText + '</span>' +
    '</div>' +
    '<div class="card-body">' +
      '<div class="card-name">' + esc(p.name) + '</div>' +
      '<div class="card-price-row"><span class="card-price">' + fmt(latest.price) + '</span>' + changeHtml + '</div>' +
    '</div>' +
    '<div class="sparkline-wrap"><canvas data-id="' + id + '"></canvas></div>';
  grid.appendChild(card);
});

// Lazy sparklines
const sparkDone = new Set();
const sparkObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const c = e.target, id = c.dataset.id;
    if (sparkDone.has(id)) return;
    sparkDone.add(id);
    sparkObs.unobserve(c);
    const h = DATA.products[id]?.history;
    if (!h || h.length < 2) return;
    new Chart(c, {
      type: 'line',
      data: {
        labels: h.map(x => x.t),
        datasets: [{ data: h.map(x => x.price), spanGaps: false, borderColor: '#d97706', borderWidth: 1.5,
          pointRadius: h.map(x => x.outOfStock ? 3 : 0),
          pointBackgroundColor: h.map(x => x.outOfStock ? '#ef4444' : '#d97706'),
          fill: true, backgroundColor: 'rgba(217,119,6,.08)', tension: 0.4 }]
      },
      options: { responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } } }
    });
  });
}, { rootMargin: '120px' });
document.querySelectorAll('.sparkline-wrap canvas').forEach(c => sparkObs.observe(c));


document.getElementById('search').addEventListener('input', applyFilters);

// Modal
const overlay = document.getElementById('overlay');
let mChart = null;

const extLinkSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/><\\/svg>';

let scrollLockY = 0;
const lockScroll = () => {
  scrollLockY = window.scrollY;
  document.body.style.top = '-' + scrollLockY + 'px';
  document.body.classList.add('scroll-locked');
};
const unlockScroll = () => {
  document.body.classList.remove('scroll-locked');
  document.body.style.top = '';
  window.scrollTo(0, scrollLockY);
  window.dispatchEvent(new Event('scroll'));
};
const updateBodyScroll = () => {
  const anyOpen = overlay.classList.contains('open') || diffOverlay.classList.contains('open');
  anyOpen ? lockScroll() : unlockScroll();
};

const closeModal = () => {
  overlay.classList.remove('open');
  if (mChart) { mChart.destroy(); mChart = null; }
  updateBodyScroll();
};

document.getElementById('modal-close').addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeDiffModal(); } });

grid.addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (!card) return;
  const id = card.dataset.id;
  const p = DATA.products[id];
  if (!p) return;

  const latest = p.history.at(-1);
  const prices = p.history.map(h => h.price);
  const realPrices = prices.filter(v => v !== null);
  const minP = Math.min(...realPrices), maxP = Math.max(...realPrices);

  document.getElementById('modal-img').innerHTML = p.image
    ? '<img class="modal-img" src="' + escA(p.image) + '" alt="" onerror="this.style.display=\\'none\\'">'
    : '<div class="modal-img-ph">&#x1F37A;</div>';

  document.getElementById('modal-info').innerHTML =
    '<h2>' + esc(p.name) + '</h2>' +
    '<a href="' + escA(p.url) + '" target="_blank" rel="noopener" class="ext-link" style="font-size:.78rem;gap:5px">Megnyitás a weboldalon ' + extLinkSvg + '</a>';

  const modalState = card.dataset.state;
  const statusHtml = {
    in:   '<span style="color:#15803d;font-weight:600">Készleten</span>',
    out:  '<span style="color:#b91c1c;font-weight:600">Elfogyott</span>',
    new:  '<span style="color:#1d4ed8;font-weight:600">Új</span>',
    back: '<span style="color:#7c3aed;font-weight:600">Újra elérhető</span>',
  }[modalState];

  document.getElementById('modal-kpis').innerHTML =
    kpi('Jelenlegi ár', fmt(latest.price)) +
    kpi('Min. ár', fmt(minP)) +
    kpi('Max. ár', fmt(maxP)) +
    kpi('Első adat', fmtDate(p.history[0].t)) +
    kpi('Utolsó adat', fmtDate(latest.t)) +
    kpi('Státusz', statusHtml);

  if (mChart) mChart.destroy();
  const ctx = document.getElementById('mchart');
  if (p.history.length >= 2) {
    mChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: p.history.map(h => fmtDT(h.t)),
        datasets: [{
          label: 'Ar', data: prices, spanGaps: false,
          borderColor: '#d97706', borderWidth: 2,
          pointRadius: p.history.map(h => h.outOfStock ? 5 : 3),
          pointBackgroundColor: p.history.map(h => h.outOfStock ? '#ef4444' : '#d97706'),
          pointBorderColor: '#fff', pointBorderWidth: 1.5,
          fill: true, backgroundColor: 'rgba(217,119,6,.06)', tension: 0.35
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: {
            label: c => fmt(c.raw) + (p.history[c.dataIndex].outOfStock ? ' - Elfogyott' : '')
          }}
        },
        scales: {
          x: { ticks: { font: { size: 10 }, maxRotation: 35, maxTicksLimit: 8 }, grid: { color: 'rgba(0,0,0,.04)' } },
          y: { ticks: { callback: v => v.toLocaleString('hu-HU') + ' Ft', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,.04)' } }
        }
      }
    });
  }

  overlay.classList.add('open');
  updateBodyScroll();
});

// Bell / diff modal
const bellBtn = document.getElementById('bell-btn');
const bellBadge = document.getElementById('bell-badge');
const diffOverlay = document.getElementById('diff-overlay');

const lastViewed = localStorage.getItem('beercheck_lastViewedDiff');
if (!lastViewed || new Date(lastViewed) < new Date(DATA.lastCrawl)) {
  bellBadge.style.display = 'flex';
}

const closeDiffModal = () => { diffOverlay.classList.remove('open'); updateBodyScroll(); };
document.getElementById('diff-modal-close').addEventListener('click', closeDiffModal);
diffOverlay.addEventListener('click', e => { if (e.target === diffOverlay) closeDiffModal(); });

const diffTypeLabel = type => {
  if (type === 'new')        return '<span style="color:#1d4ed8;font-weight:600">Új termék</span>';
  if (type === 'removed')    return '<span style="color:#6b7280;font-weight:600">Törölve a weboldalról</span>';
  if (type === 'oos')        return '<span style="color:#b91c1c;font-weight:600">Elfogyott</span>';
  if (type === 'back')       return '<span style="color:#7c3aed;font-weight:600">Újra elérhető</span>';
  if (type === 'price_up')   return '<span style="color:#dc2626;font-weight:600">&#9650; Ár nőtt</span>';
  if (type === 'price_down') return '<span style="color:#16a34a;font-weight:600">&#9660; Ár csökkent</span>';
  return '';
};

bellBtn.addEventListener('click', () => {
  const diff = DATA.diff;
  const diffList = document.getElementById('diff-list');
  const setSubtitle = () => {
    if (diff && diff.prevCrawl) {
      document.getElementById('diff-subtitle').innerHTML =
        '<span>' + fmtDT(diff.prevCrawl) + '</span>' +
        '<span style="line-height:1">→</span>' +
        '<span>' + fmtDT(DATA.lastCrawl) + '</span>';
    }
  };
  if (!diff || !diff.prevCrawl) {
    diffList.innerHTML = '<div class="diff-empty">Nincs előző snapshot, diff nem elérhető.</div>';
  } else if (!diff.changes.length) {
    setSubtitle();
    diffList.innerHTML = '<div class="diff-empty">Nincs változás az előző snapshot óta.</div>';
  } else {
    setSubtitle();
    diffList.innerHTML = diff.changes.map(c => {
      const bg = c.bgColor || '#fdf6ee';
      const imgHtml = c.image
        ? '<img class="diff-item-img" src="' + escA(c.image) + '" alt="" style="background:' + bg + '" onerror="this.style.display=\\'none\\'">'
        : '<div class="diff-item-img" style="background:#fdf6ee;display:flex;align-items:center;justify-content:center;font-size:1.8rem">&#x1F37A;</div>';
      let extra = '';
      if (c.type === 'price_up' || c.type === 'price_down') {
        extra = '<span style="color:#888;font-size:.75rem">' + fmt(c.prevPrice) + ' → ' + fmt(c.newPrice) + '</span>';
      } else if (c.type === 'new' && c.newPrice != null) {
        extra = '<span style="color:#888;font-size:.75rem">' + fmt(c.newPrice) + '</span>';
      } else if (c.type === 'removed' && c.prevPrice != null) {
        extra = '<span style="color:#888;font-size:.75rem">volt: ' + fmt(c.prevPrice) + '</span>';
      } else if ((c.type === 'oos' || c.type === 'back') && c.newPrice != null) {
        extra = '<span style="color:#888;font-size:.75rem">' + fmt(c.newPrice) + '</span>';
      }
      return '<a href="' + escA(c.url) + '" target="_blank" rel="noopener" class="diff-item">' + imgHtml +
        '<div style="flex:1;min-width:0">' +
          '<div class="diff-item-name">' + esc(c.name) + '</div>' +
          '<div class="diff-item-change">' + diffTypeLabel(c.type) + extra + '</div>' +
        '</div></a>';
    }).join('');
  }
  diffOverlay.classList.add('open');
  updateBodyScroll();
  localStorage.setItem('beercheck_lastViewedDiff', DATA.lastCrawl);
  bellBadge.style.display = 'none';
});

function kpi(label, val) {
  return '<div class="kpi">' + label + ': <strong>' + val + '</strong></div>';
}

const toolbarChevron = document.getElementById('toolbar-chevron');
const toolbarFilters = document.getElementById('toolbar-filters');
toolbarFilters.addEventListener('transitionend', e => {
  if (e.propertyName === 'max-height' && toolbarFilters.classList.contains('open')) {
    toolbarFilters.style.overflow = 'visible';
  }
});
toolbarChevron.addEventListener('click', () => {
  if (toolbarFilters.classList.contains('open')) {
    toolbarFilters.style.overflow = 'hidden';
  }
  const open = toolbarFilters.classList.toggle('open');
  toolbarChevron.classList.toggle('active', open);
});

const resetFab = document.getElementById('reset-fab');

const isFiltersDirty = () =>
  parseInt(pmin.value) !== globalMin ||
  parseInt(pmax.value) !== globalMax ||
  document.getElementById('search').value !== '' ||
  !(document.getElementById('chk-in')?.checked ?? true) ||
  !(document.getElementById('chk-out')?.checked ?? true) ||
  !(document.getElementById('chk-new')?.checked ?? true) ||
  cselValue !== '' ||
  sortIdx !== 0;

const updateResetBtn = () => {
  resetFab.classList.toggle('visible', isFiltersDirty());
  resetFab.classList.toggle('pushed', scrollTopFab.classList.contains('visible'));
};

resetFab.addEventListener('click', () => {
  pmin.value = globalMin;
  pmax.value = globalMax;
  pminVal.value = fmt(globalMin);
  pmaxVal.value = fmt(globalMax);
  updateRangeFill();
  document.getElementById('search').value = '';
  ['chk-in','chk-out','chk-new'].forEach(id => { const el = document.getElementById(id); if (el) el.checked = true; });
  cselValue = '';
  cselLabel.textContent = 'Minden kategória';
  cselList.querySelectorAll('.csel-option').forEach(o => o.classList.toggle('selected', o.dataset.value === ''));
  sortIdx = 0;
  applySort();
  applyFilters();
});

const scrollTopFab = document.getElementById('scroll-top-fab');
const SCROLL_THRESHOLD = 600;

const updateScrollTopFab = () => {
  const y = document.body.classList.contains('scroll-locked') ? scrollLockY : window.scrollY;
  const show = y >= SCROLL_THRESHOLD;
  scrollTopFab.classList.toggle('visible', show);
  resetFab.classList.toggle('pushed', show);
};

window.addEventListener('scroll', updateScrollTopFab, { passive: true });

scrollTopFab.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
<\/script>
</body>
</html>`;

const colorCache = {};

const getAvgColor = async (url) => {
        if (colorCache[url] !== undefined) return colorCache[url];
        try {
                const buf = await fetch(url).then(r => r.arrayBuffer()).then(b => Buffer.from(b));
                const img = await Jimp.fromBuffer(buf);
                img.resize({ w: 8, h: 8 });
                let r = 0, g = 0, b = 0, n = 0;
                img.scan(0, 0, 8, 8, (x, y, idx) => {
                        r += img.bitmap.data[idx];
                        g += img.bitmap.data[idx + 1];
                        b += img.bitmap.data[idx + 2];
                        n++;
                });
                const blend = v => Math.round(v / n * 0.40 + 255 * 0.60);
                const color = 'rgb(' + blend(r) + ',' + blend(g) + ',' + blend(b) + ')';
                colorCache[url] = color;
                return color;
        } catch (e) {
                colorCache[url] = null;
                return null;
        }
};

export const build = async () => {
        const snapshotsDir = join(__dirname, 'data', 'snapshots');
        const dashboardDir = join(__dirname, 'dashboard');
        const outputFile = join(dashboardDir, 'index.html');

        if (!fs.existsSync(snapshotsDir)) {
                console.log('No snapshots directory, skipping build.');
                return;
        }

        const files = fs.readdirSync(snapshotsDir).filter(f => f.endsWith('.json')).sort();
        if (!files.length) {
                console.log('No snapshots found, skipping build.');
                return;
        }

        const snapshots = files.map(f => JSON.parse(fs.readFileSync(join(snapshotsDir, f), 'utf-8')));

        const products = {};
        const seenInSnap = new Map(snapshots.map(s => [s.timestamp, new Set(s.products.map(p => String(p.id)))]));

        for (const snap of snapshots) {
                for (const p of snap.products) {
                        if (!products[p.id]) {
                                products[p.id] = { name: p.name, url: p.url, image: null, section: null, bgColor: null, history: [] };
                        }
                        if (p.image) products[p.id].image = p.image;
                        if (p.section) products[p.id].section = p.section;
                        products[p.id].history.push({
                                t: snap.timestamp,
                                price: Math.round(parseFloat(p.price)),
                                outOfStock: p.outOfStock
                        });
                }
                // Insert null for products that appeared before but are missing in this snapshot
                for (const [id, p] of Object.entries(products)) {
                        if (!seenInSnap.get(snap.timestamp).has(id)) {
                                p.history.push({ t: snap.timestamp, price: null, outOfStock: false });
                        }
                }
        }

        console.log('Computing image colors...');
        await Promise.all(
                Object.values(products)
                        .filter(p => p.image && !p.bgColor)
                        .map(async p => { p.bgColor = await getAvgColor(p.image); })
        );

        const generatedAt = new Date().toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' });
        const lastCrawl = snapshots[snapshots.length - 1].timestamp;

        const visibleProducts = Object.fromEntries(
                Object.entries(products).filter(([_, p]) => p.history.at(-1).t === lastCrawl)
        );

        // Compute diff between last two snapshots
        const prevCrawl = snapshots.length >= 2 ? snapshots[snapshots.length - 2].timestamp : null;
        const diffChanges = [];
        if (prevCrawl) {
                const latestSnap = snapshots[snapshots.length - 1];
                const prevSnap = snapshots[snapshots.length - 2];
                const latestById = new Map(latestSnap.products.map(p => [String(p.id), p]));
                const prevById = new Map(prevSnap.products.map(p => [String(p.id), p]));
                const mkEntry = (id, p, type, prevPrice, newPrice) => ({
                        id, name: p.name, image: products[id]?.image || p.image || null,
                        bgColor: products[id]?.bgColor || null, url: p.url,
                        type, prevPrice, newPrice
                });
                for (const [id, curr] of latestById) {
                        const prev = prevById.get(id);
                        if (!prev) {
                                diffChanges.push(mkEntry(id, curr, 'new', null, Math.round(parseFloat(curr.price))));
                                continue;
                        }
                        const currPrice = Math.round(parseFloat(curr.price));
                        const prevPrice = Math.round(parseFloat(prev.price));
                        if (prev.outOfStock !== curr.outOfStock) {
                                diffChanges.push(mkEntry(id, curr, curr.outOfStock ? 'oos' : 'back', prevPrice, currPrice));
                        } else if (prevPrice !== currPrice) {
                                diffChanges.push(mkEntry(id, curr, currPrice > prevPrice ? 'price_up' : 'price_down', prevPrice, currPrice));
                        }
                }
                for (const [id, prev] of prevById) {
                        if (!latestById.has(id)) {
                                diffChanges.push(mkEntry(id, prev, 'removed', Math.round(parseFloat(prev.price)), null));
                        }
                }
        }
        const diff = { prevCrawl, changes: diffChanges };

        const safeJson = JSON.stringify({ generatedAt, lastCrawl, diff, products: visibleProducts })
                .replace(/<\/script>/gi, '<\\/script>');

        if (!fs.existsSync(dashboardDir)) fs.mkdirSync(dashboardDir);
        fs.writeFileSync(outputFile, HTML_TEMPLATE.replace('__DATA__', safeJson));
        console.log('Dashboard built: dashboard/index.html');
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
        build().catch(console.error);
}
