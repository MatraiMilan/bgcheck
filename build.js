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
.stats{display:flex;gap:20px;flex-wrap:wrap}
.stat{font-size:.83rem;color:#666}
.stat strong{color:#1a1a1a;font-weight:600}
#search{padding:7px 12px;border:1.5px solid #ddd;border-radius:6px;font-size:.88rem;width:210px;outline:none;transition:border-color .15s}
#search:focus{border-color:#d97706}
#search::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none;cursor:pointer;width:10px;height:10px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M1 1l10 10M11 1L1 11' stroke='%23d97706' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat center/contain}
.grid{display:grid;grid-template-columns:repeat(3,330px);gap:46px;padding:46px 80px 36px;max-width:1400px;margin:0 auto}
.card{background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.22);cursor:pointer;display:flex;flex-direction:column;transition:box-shadow .15s,transform .15s}
.card:hover{box-shadow:0 5px 18px rgba(0,0,0,.26);transform:translateY(-2px)}
.card.hidden{display:none}
.card-img{height:330px;aspect-ratio:1/1;background:#fdf6ee;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;flex-shrink:0}
.card-img-inner{width:calc(100% - 20px);height:calc(100% - 20px);border-radius:10px 10px 0 0;overflow:hidden;display:flex;align-items:center;justify-content:center}
.card-img img{width:100%;height:100%;object-fit:contain}
.fallback{font-size:3.2rem;opacity:.22}
.badge{position:absolute;top:8px;right:8px;font-size:.68rem;font-weight:700;padding:2px 7px;border-radius:99px;letter-spacing:.05em;text-transform:uppercase;margin:10px}
.badge.in{background:#dcfce7;color:#15803d}
.badge.out{background:#fee2e2;color:#b91c1c}
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
.modal-info a{font-size:.78rem;color:#d97706}
.modal-info a:hover{text-decoration:underline}
.modal-close{background:none;border:none;font-size:1.3rem;cursor:pointer;color:#aaa;line-height:1;padding:4px;flex-shrink:0;margin-left:auto}
.modal-close:hover{color:#333}
.modal-kpis{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #f0e8d8}
.kpi{font-size:.82rem;color:#666}
.kpi strong{color:#1a1a1a;font-weight:600}
.modal-chart{position:relative;height:260px}
.stat-check{font-size:.83rem;color:#666;display:flex;align-items:center;gap:5px;cursor:pointer;user-select:none}
.stat-check input[type=checkbox]{accent-color:#d97706;cursor:pointer;width:14px;height:14px;flex-shrink:0}
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
.csel-option.selected{color:#d97706;font-weight:600}
</style>
</head>
<body>

<header>
  <div style="display:flex;align-items:center;gap:16px">
    <h1>🍺 BeerCheck Dashboard</h1>
    <span style="color:#b8977e;font-size:.9rem">|</span>
    <span id="total-count" style="color:#f5d78e;font-size:.9rem"></span>
  </div>
  <span class="meta" id="meta"></span>
</header>

<div class="toolbar">
  <div class="stats" id="stats"></div>
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
  <div class="csel" id="csel">
    <button type="button" class="csel-btn" id="csel-btn">
      <span id="csel-label">Minden kategória</span>
      <svg class="csel-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="#999" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="csel-list" id="csel-list"></div>
  </div>
  <input id="search" type="search" placeholder="Szűrés…">
</div>

<div class="grid" id="grid"></div>

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

<script type="application/json" id="D">__DATA__<\/script>
<script>
const DATA = JSON.parse(document.getElementById('D').textContent);

const fmt = p => Math.round(p).toLocaleString('hu-HU') + ' Ft';
const fmtDate = iso => new Date(iso).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
const fmtDT = iso => new Date(iso).toLocaleString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escA = s => s.replace(/"/g,'&quot;');

document.getElementById('meta').textContent = 'Generálva: ' + DATA.generatedAt;

const all = Object.values(DATA.products);
const inCount = all.filter(p => !p.history.at(-1).outOfStock).length;
const outCount = all.length - inCount;
document.getElementById('total-count').textContent = 'Termékek: ' + all.length;
document.getElementById('stats').innerHTML =
  '<label class="stat-check"><input type="checkbox" id="chk-in" checked> Készleten: <strong>' + inCount + '</strong></label>' +
  '<label class="stat-check"><input type="checkbox" id="chk-out" checked> Elfogyott: <strong>' + outCount + '</strong></label>';

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
  const showIn  = document.getElementById('chk-in').checked;
  const showOut = document.getElementById('chk-out').checked;
  const section = cselValue;
  document.querySelectorAll('.card').forEach(card => {
    const p = DATA.products[card.dataset.id];
    const latest = p.history.at(-1);
    const hidden =
      (q && !card.dataset.name.includes(q)) ||
      (latest.price < lo || latest.price > hi) ||
      (latest.outOfStock ? !showOut : !showIn) ||
      (section && p.section !== section);
    card.classList.toggle('hidden', hidden);
  });
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

document.getElementById('chk-in').addEventListener('change', applyFilters);
document.getElementById('chk-out').addEventListener('change', applyFilters);

const grid = document.getElementById('grid');
Object.entries(DATA.products).forEach(([id, p]) => {
  const latest = p.history.at(-1);
  const prev = p.history.length > 1 ? p.history.at(-2) : null;
  const diff = prev ? latest.price - prev.price : 0;
  const changeHtml = diff > 0 ? '<span class="change up" title="+' + fmt(diff) + '">&#9650;</span>'
    : diff < 0 ? '<span class="change down" title="-' + fmt(-diff) + '">&#9660;</span>' : '';

  const imgHtml = p.image
    ? '<div class="card-img-inner"><img src="' + escA(p.image) + '" alt="" loading="lazy" onerror="this.style.display=\\'none\\';this.nextSibling.style.display=\\'flex\\'"></div>'
      + '<span class="fallback" style="display:none">&#x1F37A;</span>'
    : '<span class="fallback">&#x1F37A;</span>';

  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id = id;
  card.dataset.name = p.name.toLowerCase();
  const bgStyle = p.bgColor ? ' style="background:' + p.bgColor + '"' : '';
  card.innerHTML =
    '<div class="card-img"' + bgStyle + '>' + imgHtml +
      '<span class="badge ' + (latest.outOfStock ? 'out' : 'in') + '">' + (latest.outOfStock ? 'Elfogyott' : 'Keszleten') + '</span>' +
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
        datasets: [{ data: h.map(x => x.price), borderColor: '#d97706', borderWidth: 1.5,
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

const closeModal = () => {
  overlay.classList.remove('open');
  if (mChart) { mChart.destroy(); mChart = null; }
};

document.getElementById('modal-close').addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

grid.addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (!card) return;
  const id = card.dataset.id;
  const p = DATA.products[id];
  if (!p) return;

  const latest = p.history.at(-1);
  const prices = p.history.map(h => h.price);
  const minP = Math.min(...prices), maxP = Math.max(...prices);

  document.getElementById('modal-img').innerHTML = p.image
    ? '<img class="modal-img" src="' + escA(p.image) + '" alt="" onerror="this.style.display=\\'none\\'">'
    : '<div class="modal-img-ph">&#x1F37A;</div>';

  document.getElementById('modal-info').innerHTML =
    '<h2>' + esc(p.name) + '</h2>' +
    '<a href="' + escA(p.url) + '" target="_blank" rel="noopener">Megnyitas a weboldalon &rarr;</a>';

  document.getElementById('modal-kpis').innerHTML =
    kpi('Jelenlegi ar', fmt(latest.price)) +
    kpi('Min ar', fmt(minP)) +
    kpi('Max ar', fmt(maxP)) +
    kpi('Elso adat', fmtDate(p.history[0].t)) +
    kpi('Utolso adat', fmtDate(latest.t)) +
    kpi('Statusz', latest.outOfStock
      ? '<span style="color:#b91c1c;font-weight:600">Elfogyott</span>'
      : '<span style="color:#15803d;font-weight:600">Keszleten</span>');

  if (mChart) mChart.destroy();
  const ctx = document.getElementById('mchart');
  if (p.history.length >= 2) {
    mChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: p.history.map(h => fmtDT(h.t)),
        datasets: [{
          label: 'Ar', data: prices,
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
});

function kpi(label, val) {
  return '<div class="kpi">' + label + ': <strong>' + val + '</strong></div>';
}
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
        }

        console.log('Computing image colors...');
        await Promise.all(
                Object.values(products)
                        .filter(p => p.image && !p.bgColor)
                        .map(async p => { p.bgColor = await getAvgColor(p.image); })
        );

        const generatedAt = new Date().toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' });
        const lastCrawl = snapshots[snapshots.length - 1].timestamp;

        const safeJson = JSON.stringify({ generatedAt, lastCrawl, products })
                .replace(/<\/script>/gi, '<\\/script>');

        if (!fs.existsSync(dashboardDir)) fs.mkdirSync(dashboardDir);
        fs.writeFileSync(outputFile, HTML_TEMPLATE.replace('__DATA__', safeJson));
        console.log('Dashboard built: dashboard/index.html');
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
        build().catch(console.error);
}
