/* ============================================================
   app.js — Calendario · planificador de borrado en seco
   Todo vive en localStorage. Sin servidor, sin cuentas.
   ============================================================ */

import { STICKERS, STICKER_CATS, normKey } from './stickers.js';
import { EMOJI, EMOJI_CATS } from './emoji.js';
import * as Nube from './firebase.js';
import { PANEL } from './firebase-config.js';

/* ---------- atajos DOM ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.prototype.slice.call(r.querySelectorAll(s));

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* ---------- constantes ---------- */
const STORE_KEY = 'calendario-borrado-v1';
/* Con cuentas, cada persona tiene su propio cajón: la clave del almacén
   lleva su uid. «local» es el cajón de quien usa la app sin cuenta. */
let dueno = 'local';
let miUid = '';
let soloLectura = false;
let mirandoA = null;          // { uid, alias, rol } si ves el de otra persona
function storeKey(uid) {
  return STORE_KEY + (uid && uid !== 'local' ? ':' + uid : '');
}
const CHECK_SVG = '<svg viewBox="0 0 32 32"><path d="M7 18.5l6.8 6.6L26 9.4" fill="none" stroke="#17512f" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const FONTS = [
  { id: 'Caveat',              label: 'Caveat · manuscrita fina' },
  { id: 'Gochi Hand',          label: 'Gochi Hand · rotulador' },
  { id: 'Kalam',               label: 'Kalam · bolígrafo' },
  { id: 'Patrick Hand',        label: 'Patrick Hand · escolar' },
  { id: 'Shadows Into Light',  label: 'Shadows Into Light · trazo suelto' },
  { id: 'Dancing Script',      label: 'Dancing Script · cursiva' },
];

const MONTH_EN = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
const MONTH_ES = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DAY_EN   = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
const DAY_ES   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

const CAT_ORDER = [];
[].concat(STICKER_CATS, EMOJI_CATS).forEach((c) => { if (CAT_ORDER.indexOf(c) < 0) CAT_ORDER.push(c); });

const STICKER_BY_KEY = new Map(STICKERS.map((s) => [s.key, s]));
const EMOJI_BY_KEY   = new Map(EMOJI.map((s) => [s.key, s]));
const ALL_ICONS      = STICKERS.concat(EMOJI);
const MAX_RECENTS    = 24;

/* ---------- iconos colocables: tamaño, giro y movimiento ----------
   Cada icono suelto de una casilla guarda su propia posición (en % de la
   casilla), su escala, su giro y su animación. */
const STICKER_BASE = 32;      // lado en píxeles con escala 1
const STICKER_MIN  = 0.5;     // 50 %
const STICKER_MAX  = 3.5;     // 350 %
const ROT_STEP     = 15;      // grados por pulsación
const ANIMS = [
  { id: '',       label: 'Sin movimiento' },
  { id: 'float',  label: 'Flotar' },
  { id: 'pulse',  label: 'Latir' },
  { id: 'swing',  label: 'Vaivén' },
  { id: 'bounce', label: 'Botar' },
  { id: 'spin',   label: 'Girar' },
  { id: 'wiggle', label: 'Zigzag' },
];
const ANIM_IDS = ANIMS.map((a) => a.id);

function clampNum(v, min, max, def) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  if (!isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

function uid() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

/* ---------- estado ---------- */
const DEF = {
  v: 1,
  /* Cuándo se tocó por última vez este calendario. Sirve para decidir, al
     abrir, si manda el de este equipo o el de la nube: gana el más nuevo,
     sin preguntar nada al usuario. */
  guardadoEn: 0,
  settings: {
    font: 'Caveat',
    ink: '#17512f',
    weekStart: 0,
    goal: '',
    note: '',
    cheer: 'Have A Good Day!',
    headSticker: 'svg:fireworks',
    cheerSticker: 'emo:😊',
    collapsed: { todo: false, grocery: false },
  },
  days: {},
  todo: [],
  grocery: [],
  recents: [],
};

let state = load();
const today = new Date();
const view = { y: today.getFullYear(), m: today.getMonth() };

/* Deja cualquier objeto (del almacén o de la nube) con la forma esperada. */
function normalizar(data) {
  const s = clone(DEF);
  if (!data || typeof data !== 'object') return s;
  s.v = data.v || 1;
  s.guardadoEn = Number(data.guardadoEn) || 0;
  Object.assign(s.settings, data.settings || {});
  s.settings.collapsed = Object.assign({ todo: false, grocery: false }, (data.settings || {}).collapsed || {});
  s.days = (data.days && typeof data.days === 'object') ? data.days : {};
  Object.keys(s.days).forEach((k) => {
    const r = s.days[k];
    if (!r || typeof r !== 'object') { delete s.days[k]; return; }
    if (!Array.isArray(r.items)) r.items = [];
    r.stickers = Array.isArray(r.stickers) ? r.stickers.map(normSticker).filter(Boolean) : [];
    if (dayEmpty(r)) delete s.days[k];
  });
  s.todo = Array.isArray(data.todo) ? data.todo : [];
  s.grocery = Array.isArray(data.grocery) ? data.grocery : [];
  s.recents = Array.isArray(data.recents) ? data.recents : [];
  return s;
}

function load() {
  try {
    const raw = localStorage.getItem(storeKey(dueno));
    if (!raw) return clone(DEF);
    return normalizar(JSON.parse(raw));
  } catch (err) {
    console.warn('No se pudo leer el almacenamiento, se empieza de cero.', err);
    return clone(DEF);
  }
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* Un icono colocado a mano: posición, tamaño, giro y movimiento. */
function normSticker(s) {
  if (!s || !s.icon || !iconOf(s.icon)) return null;
  return {
    id: s.id || uid(),
    icon: s.icon,
    x: clampNum(s.x, 4, 96, 50),
    y: clampNum(s.y, 6, 94, 50),
    s: clampNum(s.s, STICKER_MIN, STICKER_MAX, 1),
    r: clampNum(s.r, -180, 180, 0),
    anim: ANIM_IDS.indexOf(s.anim) > 0 ? s.anim : '',
  };
}
function normStickers() {
  Object.keys(state.days).forEach((k) => {
    const r = state.days[k];
    if (!r) return;
    r.stickers = Array.isArray(r.stickers) ? r.stickers.map(normSticker).filter(Boolean) : [];
    if (dayEmpty(r)) delete state.days[k];
  });
}

let saveTimer = 0;
function save() {
  if (soloLectura) return;      // el calendario de otra persona no se toca
  state.guardadoEn = Date.now();   // marca de la última edición en este equipo
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(storeKey(dueno), JSON.stringify(state));
    } catch (err) {
      toast('No se pudo guardar: almacenamiento lleno');
      console.warn(err);
    }
    subirNube();
  }, 180);
}

/* ---------- utilidades de fecha ---------- */
const pad2 = (n) => (n < 10 ? '0' : '') + n;
const keyOf = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
function dateOfKey(k) {
  const p = String(k).split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]);
}
function dayRecord(k, create) {
  let r = state.days[k];
  if (!r && create) { r = { items: [], ink: null, stickers: [] }; state.days[k] = r; }
  if (r && !Array.isArray(r.stickers)) r.stickers = [];
  return r;
}
function dayEmpty(r) {
  if (!r) return true;
  return !(r.items && r.items.length) && !(r.stickers && r.stickers.length) && !r.ink;
}
function hasContent(k) {
  return !dayEmpty(state.days[k]);
}

/* ---------- iconos ---------- */
function iconOf(key) { return STICKER_BY_KEY.get(key) || EMOJI_BY_KEY.get(key) || null; }
function iconEl(key, cls) {
  const s = iconOf(key);
  if (!s) return null;
  const span = el('span', (cls || '') + (s.kind === 'emo' ? ' emo' : ''));
  if (s.kind === 'svg') span.innerHTML = s.svg; else span.textContent = s.ch;
  return span;
}
function iconHTML(key) {
  const s = iconOf(key);
  if (!s) return '';
  return s.kind === 'svg' ? s.svg : esc(s.ch);
}
function pushRecent(key) {
  const i = state.recents.indexOf(key);
  if (i >= 0) state.recents.splice(i, 1);
  state.recents.unshift(key);
  if (state.recents.length > MAX_RECENTS) state.recents.length = MAX_RECENTS;
}

/* ---------- aviso flotante ---------- */
let toastTimer = 0;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 1800);
}

/* ---------- tipografía ---------- */
function applyFont(id) {
  const stack = "'" + id + "', 'Segoe Print', 'Bradley Hand', cursive";
  document.documentElement.style.setProperty('--font-hand', stack);
}
function fillFontSelect() {
  const sel = $('#font-select');
  sel.textContent = '';
  FONTS.forEach((f) => {
    const o = el('option', null, f.label);
    o.value = f.id;
    sel.append(o);
  });
  sel.value = state.settings.font;
}

/* ---------- navegación de meses ---------- */
function fillNav() {
  const sm = $('#sel-month');
  sm.textContent = '';
  MONTH_ES.forEach((n, i) => {
    const o = el('option', null, n.charAt(0).toUpperCase() + n.slice(1));
    o.value = String(i);
    sm.append(o);
  });
  sm.value = String(view.m);

  const sy = $('#sel-year');
  sy.textContent = '';
  const base = today.getFullYear();
  for (let y = base - 5; y <= base + 5; y++) {
    const o = el('option', null, String(y));
    o.value = String(y);
    sy.append(o);
  }
  if (!$$('option', sy).some((o) => o.value === String(view.y))) {
    const o = el('option', null, String(view.y));
    o.value = String(view.y);
    sy.append(o);
  }
  sy.value = String(view.y);
}
function goto(y, m) {
  const d = new Date(y, m, 1);
  view.y = d.getFullYear();
  view.m = d.getMonth();
  $('#sel-month').value = String(view.m);
  const sy = $('#sel-year');
  if (!$$('option', sy).some((o) => o.value === String(view.y))) {
    const o = el('option', null, String(view.y));
    o.value = String(view.y);
    sy.append(o);
  }
  sy.value = String(view.y);
  stopDraw();
  closeEditor();
  renderSheet();
}

/* ---------- hoja (cabecera y pie) ---------- */
function setEditable(node, value) {
  if (document.activeElement === node) return;
  if (node.textContent !== value) node.textContent = value;
}
function renderSheet() {
  $('#month-name').innerHTML = esc(MONTH_EN[view.m]) + '<span class="yr">' + view.y + '</span>';
  setEditable($('#goal'), state.settings.goal);
  setEditable($('#month-note'), state.settings.note);
  setEditable($('#cheer'), state.settings.cheer);

  const head = $('#head-sticker');
  head.textContent = '';
  const hi = iconEl(state.settings.headSticker, '');
  if (hi) head.append(hi);

  const che = $('#cheer-sticker');
  che.textContent = '';
  const ci = iconEl(state.settings.cheerSticker, '');
  if (ci) che.append(ci);

  $$('.weekdays span').forEach((s) => { s.remove(); });
  renderWeekdays();
  renderGrid();
  renderLists();
}

function renderWeekdays() {
  const host = $('#weekdays');
  host.textContent = '';
  const start = state.settings.weekStart ? 1 : 0;
  for (let i = 0; i < 7; i++) {
    const d = (start + i) % 7;
    const s = el('span');
    /* Dos etiquetas por día: la larga (SUNDAY) para pantallas grandes y la
       corta (DO) para el móvil. El CSS decide cuál se ve; con la larga sola,
       «WEDNESDAY» no cabe en una columna estrecha y estira toda la hoja. */
    s.append(el('span', 'dia-largo', DAY_EN[d]));
    s.append(el('span', 'dia-corto', DAY_ES[d].slice(0, 2).toUpperCase()));
    host.append(s);
  }
}

/* ---------- cuadrícula ---------- */
function renderGrid() {
  const grid = $('#grid');
  grid.textContent = '';

  const first = new Date(view.y, view.m, 1);
  const start = state.settings.weekStart ? 1 : 0;
  const lead = (first.getDay() - start + 7) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const total = Math.max(35, Math.ceil((lead + daysInMonth) / 7) * 7);
  const tKey = keyOf(today);

  for (let i = 0; i < total; i++) {
    const date = new Date(view.y, view.m, 1 - lead + i);
    const k = keyOf(date);
    const dow = date.getDay();
    const cell = el('div', 'cell');
    cell.dataset.day = k;
    if (date.getMonth() !== view.m) cell.classList.add('other');
    if (dow === 0 || dow === 6) cell.classList.add('weekend');
    if (k === tKey) cell.classList.add('today');

    const num = el('span', 'num', String(date.getDate()));
    const add = el('button', 'add', '+');
    add.type = 'button';
    add.title = 'Añadir al día';
    add.setAttribute('aria-label', 'Añadir al día');

    const cv = el('canvas', 'ink');
    cv.dataset.day = k;

    const box = el('div', 'cell-items');
    const rec = state.days[k];
    if (rec && rec.items) {
      rec.items.forEach((it) => box.append(buildChip(it, k, false)));
    }

    const layer = el('div', 'cell-stickers');
    if (rec && rec.stickers) {
      rec.stickers.forEach((st) => layer.append(stickerNode(st, k)));
    }

    cell.append(num, add, cv, box, layer);
    if (drawDay === k) cell.classList.add('drawing');
    grid.append(cell);
  }
  initInk();
  applySelection();
}

function buildChip(item, dayKey, withTools) {
  const chip = el('div', 'chip');
  chip.dataset.item = item.id;
  if (item.icon) {
    const st = iconEl(item.icon, 'st');
    if (st) {
      st.title = 'Cambiar icono';
      st.style.cursor = 'pointer';
      chip.append(st);
    }
  }
  const txt = el('span', 'txt', item.text || '');
  txt.contentEditable = 'plaintext-only';
  txt.spellcheck = false;
  txt.dataset.act = 'text';
  chip.append(txt);

  if (withTools) {
    const del = el('button', 'del', '×');
    del.type = 'button';
    del.title = 'Quitar';
    del.dataset.act = 'del-item';
    chip.append(del);
  }
  return chip;
}

/* ---------- capa de tinta (dibujo a mano) ---------- */
let drawDay = null;

function sizeCanvas(cv) {
  const w = cv.clientWidth || cv.parentElement.clientWidth || 100;
  const h = cv.clientHeight || 80;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.max(1, Math.round(w * dpr));
  cv.height = Math.max(1, Math.round(h * dpr));
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return { ctx, w, h };
}

function initInk() {
  $$('.ink').forEach((cv) => {
    const k = cv.dataset.day;
    const { ctx, w, h } = sizeCanvas(cv);
    const rec = state.days[k];
    if (rec && rec.ink) {
      const img = new Image();
      img.onload = () => { try { ctx.drawImage(img, 0, 0, w, h); } catch (e) { /* ignorar */ } };
      img.src = rec.ink;
    }
    let drawing = false;
    let last = null;

    const pos = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    cv.addEventListener('pointerdown', (e) => {
      if (drawDay !== k) return;
      drawing = true;
      last = pos(e);
      cv.setPointerCapture(e.pointerId);
      ctx.strokeStyle = state.settings.ink;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(last.x, last.y, 1.05, 0, Math.PI * 2);
      ctx.fillStyle = state.settings.ink;
      ctx.fill();
      e.preventDefault();
    });

    cv.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const p = pos(e);
      ctx.strokeStyle = state.settings.ink;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
      e.preventDefault();
    });

    const finish = () => {
      if (!drawing) return;
      drawing = false;
      const r = dayRecord(k, true);
      try { r.ink = cv.toDataURL('image/png'); } catch (err) { /* ignorar */ }
      if (dayEmpty(r)) delete state.days[k];
      save();
      updateHint();
    };
    cv.addEventListener('pointerup', finish);
    cv.addEventListener('pointercancel', finish);
    cv.addEventListener('pointerleave', () => { if (drawing) finish(); });
  });
}

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { initInk(); placePopover(); placeStickerBar(); }, 220);
});
window.addEventListener('scroll', () => {
  if (editing) placePopover();
  if (selected) placeStickerBar();
}, { passive: true });

/* ============================================================
   Iconos colocables: mover, agrandar, reducir, girar y animar
   ============================================================ */
let selected = null;        // { day, id } del icono seleccionado
let swallowClick = false;   // evita que un arrastre cuente como clic

function getSticker(day, id) {
  const r = state.days[day];
  if (!r || !Array.isArray(r.stickers)) return null;
  const hit = r.stickers.filter((s) => s.id === id)[0];
  return hit || null;
}
function stickerInDom(day, id) {
  return $('.sticker[data-day="' + day + '"][data-id="' + id + '"]');
}

function stickerNode(st, dayKey) {
  const node = el('div', 'sticker');
  node.dataset.id = st.id;
  node.dataset.day = dayKey;
  node.style.left = st.x + '%';
  node.style.top = st.y + '%';
  node.style.setProperty('--base', STICKER_BASE + 'px');
  node.style.setProperty('--sc', String(st.s));
  node.style.setProperty('--rot', st.r + 'deg');
  if (st.anim) node.dataset.anim = st.anim;

  const box = el('div', 'sticker-box');
  const anim = el('div', 'sticker-anim');
  const fig = iconEl(st.icon, 'st-fig');
  if (fig) anim.append(fig);

  const grip = el('button', 'sticker-grip');
  grip.type = 'button';
  grip.dataset.act = 'resize';
  grip.title = 'Arrastra para agrandar o reducir';
  grip.setAttribute('aria-label', 'Cambiar tamaño del icono');

  box.append(anim, grip);
  node.append(box);

  const s = iconOf(st.icon);
  node.title = (s ? s.name : 'Icono') + ' · arrastra para moverlo de sitio o de día';
  if (selected && selected.day === dayKey && selected.id === st.id) node.classList.add('sel');
  return node;
}

function applySelection() {
  if (selected && !getSticker(selected.day, selected.id)) {
    selected = null;
    const b = $('#sticker-bar');
    if (b) b.hidden = true;
  }
  $$('.sticker').forEach((n) => {
    const on = !!(selected && n.dataset.day === selected.day && n.dataset.id === selected.id);
    n.classList.toggle('sel', on);
  });
  syncStickerBar();
}

function selectSticker(day, id) {
  selected = { day: day, id: id };
  const bar = ensureStickerBar();
  const st = getSticker(day, id);
  if (st) {
    const s = iconOf(st.icon);
    const d = dateOfKey(day);
    bar.querySelector('.sbar-name').textContent =
      (s ? s.name : 'Icono') + ' — ' + d.getDate() + ' de ' + MONTH_ES[d.getMonth()];
  }
  bar.hidden = false;
  applySelection();
  placeStickerBar();
}

function clearSelection() {
  selected = null;
  $$('.sticker').forEach((n) => n.classList.remove('sel'));
  const bar = $('#sticker-bar');
  if (bar) bar.hidden = true;
}

function placeStickerBar() {
  const bar = $('#sticker-bar');
  if (!bar || bar.hidden || !selected) return;
  const cell = cellOf(selected.day);
  if (!cell) return;
  const r = cell.getBoundingClientRect();
  const bw = bar.offsetWidth || 520;
  const bh = bar.offsetHeight || 44;
  const margin = 8;
  let top = r.bottom + 6;
  if (top + bh > window.innerHeight - margin) {
    const above = r.top - bh - 6;
    top = above > margin ? above : Math.max(margin, Math.min(top, window.innerHeight - bh - margin));
  }
  const left = Math.min(Math.max(margin, r.left), Math.max(margin, window.innerWidth - bw - margin));
  bar.style.left = Math.round(left) + 'px';
  bar.style.top = Math.round(top) + 'px';
}

function ensureStickerBar() {
  let bar = $('#sticker-bar');
  if (bar) return bar;
  const mk = (act, label, title) => {
    const b = el('button', 'btn btn-mini', label);
    b.type = 'button';
    b.dataset.act = act;
    b.title = title || label;
    return b;
  };

  bar = el('div', 'sticker-bar');
  bar.id = 'sticker-bar';
  bar.hidden = true;
  bar.append(el('span', 'sbar-name', 'Icono'));

  const val = el('span', 'sbar-val', '100%');
  const animWrap = el('label', 'sbar-anim');
  animWrap.append(el('span', 'sbar-lbl', 'Movimiento'));
  const sel = el('select', 'sbar-select');
  ANIMS.forEach((a) => {
    const o = el('option', null, a.label);
    o.value = a.id;
    sel.append(o);
  });
  animWrap.append(sel);

  const del = mk('remove', 'Quitar', 'Quitar este icono');
  del.classList.add('btn-danger');
  const done = el('button', 'btn btn-mini btn-primary', 'Listo');
  done.type = 'button';
  done.dataset.act = 'close-sticker';

  bar.append(
    mk('size-down', '−', 'Reducir (rueda del ratón hacia abajo)'),
    val,
    mk('size-up', '+', 'Agrandar (rueda del ratón hacia arriba)'),
    mk('rot-left', '⟲', 'Girar a la izquierda'),
    mk('rot-right', '⟳', 'Girar a la derecha'),
    animWrap,
    mk('center', 'Centrar', 'Volver al centro del día'),
    del,
    done
  );
  document.body.append(bar);

  bar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || !selected) return;
    const st = getSticker(selected.day, selected.id);
    if (!st) return;
    const a = b.dataset.act;
    if (a === 'size-down') setStickerSize(st.s - 0.25);
    else if (a === 'size-up') setStickerSize(st.s + 0.25);
    else if (a === 'rot-left') setStickerRot(st.r - ROT_STEP);
    else if (a === 'rot-right') setStickerRot(st.r + ROT_STEP);
    else if (a === 'center') moveStickerTo(selected.day, selected.id, 50, 50);
    else if (a === 'remove') removeSticker(selected.day, selected.id);
    else if (a === 'close-sticker') clearSelection();
  });
  sel.addEventListener('change', () => {
    if (selected) setStickerAnim(sel.value);
  });
  return bar;
}

function syncStickerBar() {
  const bar = $('#sticker-bar');
  if (!bar || bar.hidden || !selected) return;
  const st = getSticker(selected.day, selected.id);
  if (!st) return;
  const val = bar.querySelector('.sbar-val');
  if (val) val.textContent = Math.round(st.s * 100) + '%';
  const sel = bar.querySelector('.sbar-select');
  if (sel && sel.value !== st.anim) sel.value = st.anim;
}

function setStickerSize(v) {
  if (!selected) return;
  const st = getSticker(selected.day, selected.id);
  if (!st) return;
  st.s = clampNum(v, STICKER_MIN, STICKER_MAX, st.s);
  const n = stickerInDom(selected.day, st.id);
  if (n) n.style.setProperty('--sc', String(st.s));
  syncStickerBar();
  save();
}

function setStickerRot(v) {
  if (!selected) return;
  const st = getSticker(selected.day, selected.id);
  if (!st) return;
  st.r = clampNum(v, -180, 180, st.r);
  const n = stickerInDom(selected.day, st.id);
  if (n) n.style.setProperty('--rot', st.r + 'deg');
  save();
}

function setStickerAnim(v) {
  if (!selected) return;
  const st = getSticker(selected.day, selected.id);
  if (!st) return;
  st.anim = ANIM_IDS.indexOf(v) > 0 ? v : '';
  const n = stickerInDom(selected.day, st.id);
  if (n) {
    if (st.anim) n.dataset.anim = st.anim; else delete n.dataset.anim;
  }
  save();
}

function paintStickerPos() {
  if (!selected) return;
  const st = getSticker(selected.day, selected.id);
  const n = stickerInDom(selected.day, selected.id);
  if (st && n) { n.style.left = st.x + '%'; n.style.top = st.y + '%'; }
  save();
}

/* Coloca un icono nuevo (por defecto del tamaño y sin movimiento). */
function addSticker(day, key, x, y) {
  if (!iconOf(key)) return null;
  const rec = dayRecord(day, true);
  const st = normSticker({
    id: uid(), icon: key,
    x: clampNum(x, 4, 96, 50),
    y: clampNum(y, 6, 94, 50),
    s: 1, r: 0, anim: '',
  });
  if (!st) return null;
  rec.stickers.push(st);
  pushRecent(key);
  save();
  return st;
}

function moveStickerTo(day, id, x, y) {
  const st = getSticker(day, id);
  if (!st) return;
  st.x = clampNum(x, 4, 96, st.x);
  st.y = clampNum(y, 6, 94, st.y);
  const n = stickerInDom(day, id);
  if (n) { n.style.left = st.x + '%'; n.style.top = st.y + '%'; }
  save();
}

/* Mueve un icono, incluso de un día a otro. */
function moveSticker(fromDay, id, toDay, x, y) {
  const src = state.days[fromDay];
  if (!src || !Array.isArray(src.stickers)) return;
  const i = src.stickers.map((s) => s.id).indexOf(id);
  if (i < 0) return;
  const st = src.stickers.splice(i, 1)[0];
  st.x = clampNum(x, 4, 96, st.x);
  st.y = clampNum(y, 6, 94, st.y);
  const dst = dayRecord(toDay, true);
  dst.stickers.push(st);
  if (dayEmpty(src)) delete state.days[fromDay];

  renderGrid();
  updateHint();
  if (editing && (!state.days[editing])) closeEditor();
  else if (editing) renderEditor();
  const s = iconOf(st.icon);
  if (fromDay === toDay) {
    selectSticker(toDay, st.id);
  } else {
    selectSticker(toDay, st.id);
    const d = dateOfKey(toDay);
    toast('«' + (s ? s.name : 'Icono') + '» movido al ' + d.getDate() + ' de ' + MONTH_ES[d.getMonth()]);
  }
  save();
}

function removeSticker(day, id) {
  const rec = state.days[day];
  if (!rec || !Array.isArray(rec.stickers)) return;
  const i = rec.stickers.map((s) => s.id).indexOf(id);
  if (i < 0) return;
  const st = rec.stickers.splice(i, 1)[0];
  clearSelection();
  if (dayEmpty(rec)) delete state.days[day];
  renderGrid();
  updateHint();
  if (editing === day) { if (state.days[day]) renderEditor(); else closeEditor(); }
  const s = iconOf(st.icon);
  toast('«' + (s ? s.name : 'Icono') + '» quitado');
  save();
}

/* --- arrastrar un icono ya colocado (dentro del día o a otro día) --- */
function startStickerDrag(e, node) {
  const from = node.dataset.day;
  const id = node.dataset.id;
  const st = getSticker(from, id);
  if (!st) return;
  const startX = e.clientX;
  const startY = e.clientY;
  let moved = false;
  let target = null;

  const clearTarget = () => {
    if (target) target.classList.remove('drop-target');
    target = null;
  };
  const cellAt = (x, y) => {
    const under = document.elementFromPoint(x, y);
    return under && under.closest ? under.closest('.cell') : null;
  };

  const onMove = (ev) => {
    if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 5) return;
    if (!moved) {
      moved = true;
      node.classList.add('ghost');
      document.body.append(node);
      document.body.classList.add('drag-icon');
    }
    node.style.left = ev.clientX + 'px';
    node.style.top = ev.clientY + 'px';
    const cell = cellAt(ev.clientX, ev.clientY);
    if (cell !== target) {
      clearTarget();
      target = cell;
      if (target) target.classList.add('drop-target');
    }
  };

  const onUp = (ev) => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
    clearTarget();
    const cell = cellAt(ev.clientX, ev.clientY);   // antes de devolver el buscador
    document.body.classList.remove('drag-icon');
    if (!moved) { selectSticker(from, id); return; }
    const to = cell && cell.dataset.day;
    node.remove();          // el fantasma sobra: la casilla se vuelve a pintar
    if (to) {
      const r = cell.getBoundingClientRect();
      moveSticker(from, id, to,
        ((ev.clientX - r.left) / r.width) * 100,
        ((ev.clientY - r.top) / r.height) * 100);
    } else {
      renderGrid();
      selectSticker(from, id);
    }
  };

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);
}

/* --- tirar del pico para agrandar o reducir --- */
function startStickerResize(e, grip) {
  const node = grip.closest('.sticker');
  const day = node.dataset.day;
  const id = node.dataset.id;
  const st = getSticker(day, id);
  const cell = cellOf(day);
  if (!st || !cell) return;
  const cr = cell.getBoundingClientRect();
  const cx = cr.left + (cr.width * st.x) / 100;
  const cy = cr.top + (cr.height * st.y) / 100;
  const d0 = Math.max(14, Math.hypot(e.clientX - cx, e.clientY - cy));
  const s0 = st.s;

  const onMove = (ev) => {
    const d = Math.hypot(ev.clientX - cx, ev.clientY - cy);
    st.s = clampNum(s0 * (d / d0), STICKER_MIN, STICKER_MAX, st.s);
    node.style.setProperty('--sc', String(st.s));
    syncStickerBar();
  };
  const onUp = () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
    save();
  };
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);
}

/* --- arrastrar un icono desde el buscador hasta un día --- */
function startPickDrag(e, key) {
  const startX = e.clientX;
  const startY = e.clientY;
  let moved = false;
  let ghost = null;
  let target = null;

  const clearTarget = () => {
    if (target) target.classList.remove('drop-target');
    target = null;
  };
  const at = (x, y) => {
    const under = document.elementFromPoint(x, y);
    return under && under.closest ? under : null;
  };

  const onMove = (ev) => {
    if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return;
    if (!moved) {
      moved = true;
      ghost = el('div', 'icon-ghost');
      const fig = iconEl(key, 'st-fig');
      if (fig) ghost.append(fig);
      document.body.append(ghost);
      document.body.classList.add('drag-icon');   // aparta el buscador y deja ver el mes
    }
    ghost.style.left = ev.clientX + 'px';
    ghost.style.top = ev.clientY + 'px';
    const under = at(ev.clientX, ev.clientY);
    const cell = under ? under.closest('.cell') : null;
    if (cell !== target) {
      clearTarget();
      target = cell;
      if (target) target.classList.add('drop-target');
    }
  };

  const onUp = (ev) => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
    clearTarget();
    /* Ojo con el orden: `drag-icon` es lo que aparta el buscador, así que hay que
       mirar qué hay debajo ANTES de devolverlo. Si no, el propio panel (que vuelve
       a ser hitable) intercepta el punto y el icono nunca llega a la casilla. */
    const under = at(ev.clientX, ev.clientY);
    const cell = under ? under.closest('.cell') : null;
    document.body.classList.remove('drag-icon');
    if (ghost) ghost.remove();
    if (!moved) return;            // fue un clic normal: lo resuelve el propio clic
    swallowClick = true;

    const s = iconOf(key);
    if (cell && cell.dataset.day) {
      const r = cell.getBoundingClientRect();
      addSticker(cell.dataset.day, key,
        ((ev.clientX - r.left) / r.width) * 100,
        ((ev.clientY - r.top) / r.height) * 100);
      renderGrid();
      updateHint();
      const d = dateOfKey(cell.dataset.day);
      toast('«' + (s ? s.name : 'Icono') + '» en el ' + d.getDate() + ' de ' + MONTH_ES[d.getMonth()]);
      closePicker();
      return;
    }
    if (under) {
      if (under.closest('#head-sticker')) {
        state.settings.headSticker = key; renderSheet(); save(); closePicker(); return;
      }
      if (under.closest('#cheer-sticker')) {
        state.settings.cheerSticker = key; renderSheet(); save(); closePicker(); return;
      }
    }
    /* Soltado en cualquier otro sitio: el buscador vuelve donde estaba. */
  };

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);
}

/* ---------- listas: To do y Grocery ---------- */
const pendingIcon = { todo: null, grocery: null };

function listOf(kind) { return kind === 'grocery' ? state.grocery : state.todo; }
function listEl(kind) { return kind === 'grocery' ? $('#list-grocery') : $('#list-todo'); }

function renderLists() {
  ['todo', 'grocery'].forEach((kind) => {
    const ul = listEl(kind);
    ul.textContent = '';
    listOf(kind).forEach((it) => {
      const li = el('li', 'row' + (it.done ? ' done' : ''));
      li.dataset.id = it.id;

      const check = el('button', 'check');
      check.type = 'button';
      check.title = 'Marcar como hecho';
      check.setAttribute('aria-label', 'Marcar');
      check.dataset.act = 'toggle';
      check.innerHTML = CHECK_SVG;

      const ico = el('span', 'ico' + (it.icon && iconOf(it.icon) && iconOf(it.icon).kind === 'emo' ? ' emo' : ''));
      ico.dataset.act = 'icon';
      ico.title = it.icon ? 'Cambiar icono' : 'Poner icono';
      const s = it.icon ? iconOf(it.icon) : null;
      if (s) { if (s.kind === 'svg') ico.innerHTML = s.svg; else ico.textContent = s.ch; }

      const txt = el('span', 'txt', it.text || '');
      txt.contentEditable = 'plaintext-only';
      txt.spellcheck = false;
      txt.dataset.act = 'text';

      li.append(check, ico, txt);

      if (kind === 'grocery' && it.qty) li.append(el('span', 'qty', '*' + it.qty));

      const del = el('button', 'del', '×');
      del.type = 'button';
      del.title = 'Quitar';
      del.dataset.act = 'del';
      li.append(del);

      ul.append(li);
    });

    const card = $('#card-' + kind);
    if (card) card.classList.toggle('collapsed', !!state.settings.collapsed[kind]);
    const btn = $('[data-collapse="' + kind + '"]');
    if (btn) btn.textContent = state.settings.collapsed[kind] ? '+' : '–';
  });

  refreshSlots();
}

function refreshSlots() {
  ['todo', 'grocery'].forEach((kind) => {
    const slot = $('[data-pick-icon="' + kind + '"] .ico-slot');
    if (!slot) return;
    slot.textContent = '';
    const s = pendingIcon[kind] ? iconOf(pendingIcon[kind]) : null;
    if (!s) { slot.textContent = '☺'; slot.style.opacity = '.55'; return; }
    slot.style.opacity = '1';
    if (s.kind === 'svg') slot.innerHTML = s.svg; else slot.textContent = s.ch;
  });
}

function updateHint() {
  const n = Object.keys(state.days).filter(hasContent).length;
  const t = state.todo.filter((i) => !i.done).length;
  const g = state.grocery.filter((i) => !i.done).length;
  /* Texto corto a propósito: comparte línea con los controles del mes y la
     tipografía, y si se alargara se recortaría con puntos suspensivos.
     El detalle completo queda en el tooltip. */
  const largo = n + ' días con anotaciones · ' + t + ' tareas pendientes · ' +
    g + ' productos por comprar';
  const hint = $('#nav-hint');
  hint.title = largo;
  hint.textContent = n + ' día(s) · ' + t + ' tareas · ' + g + ' productos';
}

/* ---------- panel de edición de un día ---------- */
let editing = null;

function cellOf(k) { return $('.cell[data-day="' + k + '"]'); }

function placePopover() {
  const pop = $('#day-editor');
  if (!editing || pop.hidden) return;
  const cell = cellOf(editing);
  if (!cell) { closeEditor(); return; }
  const r = cell.getBoundingClientRect();
  const pw = pop.offsetWidth || 296;
  const ph = pop.offsetHeight || 300;
  const margin = 8;
  let left = r.left;
  let top = r.bottom + 6;
  if (top + ph > window.innerHeight - margin) {
    const above = r.top - ph - 6;
    top = above > margin ? above : Math.max(margin, window.innerHeight - ph - margin);
  }
  left = Math.min(Math.max(margin, left), window.innerWidth - pw - margin);
  pop.style.left = Math.round(left) + 'px';
  pop.style.top = Math.round(top) + 'px';
}

function openEditor(k, focusInput) {
  editing = k;
  const d = dateOfKey(k);
  $('#day-editor-title').textContent =
    DAY_ES[d.getDay()].charAt(0).toUpperCase() + DAY_ES[d.getDay()].slice(1) +
    ' ' + d.getDate() + ' de ' + MONTH_ES[d.getMonth()];
  renderEditor();
  const pop = $('#day-editor');
  pop.hidden = false;
  placePopover();
  if (focusInput) $('#day-new-text').focus();
}

function closeEditor() {
  if (!editing) return;
  editing = null;
  $('#day-editor').hidden = true;
}

function renderEditor() {
  if (!editing) return;
  const host = $('#day-items');
  host.textContent = '';
  const rec = state.days[editing];
  const items = rec && rec.items ? rec.items : [];
  if (!items.length) {
    host.append(el('p', 'hint', 'Este día está vacío. Escribe abajo o pon un icono.'));
  }
  items.forEach((it) => {
    const chip = buildChip(it, editing, true);
    const st = chip.querySelector('.st');
    if (st) st.dataset.act = 'icon';
    host.append(chip);
  });
  if (rec && rec.stickers && rec.stickers.length) {
    host.append(el('p', 'hint',
      rec.stickers.length + ' icono(s) colocado(s) aquí: muévelos y agrándalos arrastrándolos en la casilla.'));
  }
  const slot = $('#day-pick-icon .ico-slot');
  slot.textContent = '☺';
  slot.style.opacity = '.55';
  $('#day-draw').textContent = drawDay === editing ? '✓ Terminar dibujo' : '✏️ Dibujar';
  $('#day-clear-ink').disabled = !(rec && rec.ink);
}

function addDayItem(k, patch) {
  const rec = dayRecord(k, true);
  const item = Object.assign({ id: uid(), text: '', icon: null }, patch || {});
  rec.items.push(item);
  save();
  updateHint();
  return item;
}

/* ---------- modo dibujo ---------- */
function ensureDrawbar() {
  let bar = $('#drawbar');
  if (bar) return bar;
  bar = el('div', 'drawbar');
  bar.id = 'drawbar';
  bar.hidden = true;
  bar.append(el('span', 'drawbar-txt'));
  const color = el('input', 'drawbar-color');
  color.type = 'color';
  color.title = 'Color del rotulador';
  color.id = 'drawbar-color';
  const clear = el('button', 'btn btn-mini', 'Borrar trazo');
  clear.type = 'button';
  clear.dataset.act = 'clear-ink';
  const done = el('button', 'btn btn-mini btn-primary', 'Listo');
  done.type = 'button';
  done.dataset.act = 'stop-draw';
  bar.append(color, clear, done);
  document.body.append(bar);

  color.addEventListener('input', () => {
    state.settings.ink = color.value;
    const mainColor = $('#ink-color');
    if (mainColor) mainColor.value = color.value;
    save();
  });
  bar.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]');
    if (!act) return;
    if (act.dataset.act === 'clear-ink') { clearInk(drawDay); }
    if (act.dataset.act === 'stop-draw') { stopDraw(); }
  });
  return bar;
}

function startDraw(k) {
  closeEditor();
  clearSelection();
  drawDay = k;
  const bar = ensureDrawbar();
  const d = dateOfKey(k);
  bar.querySelector('.drawbar-txt').textContent =
    'Dibujando el ' + d.getDate() + ' de ' + MONTH_ES[d.getMonth()] + ' — traza con el ratón o el dedo';
  bar.querySelector('.drawbar-color').value = state.settings.ink;
  bar.hidden = false;
  document.body.classList.add('draw-mode');
  const cell = cellOf(k);
  if (cell) cell.classList.add('drawing');
  toast('Modo dibujo activado');
}

function stopDraw() {
  if (drawDay) {
    const cell = cellOf(drawDay);
    if (cell) cell.classList.remove('drawing');
  }
  drawDay = null;
  document.body.classList.remove('draw-mode');
  const bar = $('#drawbar');
  if (bar) bar.hidden = true;
}

function clearInk(k) {
  if (!k) return;
  const rec = state.days[k];
  if (rec) {
    rec.ink = null;
    if (dayEmpty(rec)) delete state.days[k];
  }
  const cv = cellOf(k) && cellOf(k).querySelector('.ink');
  if (cv) {
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
  }
  save();
  updateHint();
  renderEditor();
  toast('Dibujo borrado');
}

/* ---------- buscador de iconos ---------- */
let pickTarget = null;
let activeTab = '__recent';
let lastResults = [];

function openPicker(target) {
  pickTarget = target || null;
  const p = $('#picker');
  $('#picker-q').value = '';
  activeTab = '__recent';
  p.hidden = false;
  fillTabs();
  renderPicker();
  setTimeout(() => $('#picker-q').focus(), 30);
}

function closePicker() {
  $('#picker').hidden = true;
  pickTarget = null;
  if (drawDay) return;
}

function fillTabs() {
  const host = $('#picker-tabs');
  host.textContent = '';
  const tabs = [{ id: '__recent', label: 'Recientes' }, { id: '__all', label: 'Todo' }]
    .concat(CAT_ORDER.map((c) => ({ id: c, label: c })));
  tabs.forEach((t) => {
    const b = el('button', 'tab' + (t.id === activeTab ? ' on' : ''), t.label);
    b.type = 'button';
    b.dataset.tab = t.id;
    b.setAttribute('role', 'tab');
    host.append(b);
  });
}

function search(q) {
  const nq = normKey(q);
  if (!nq) return [];
  const terms = nq.split(' ').filter(Boolean);
  const out = [];
  ALL_ICONS.forEach((s) => {
    let score = 0;
    for (let i = 0; i < terms.length; i++) {
      const t = terms[i];
      const nn = normKey(s.name);
      if (nn === t) score += 100;
      else if (nn.indexOf(t) === 0) score += 60;
      else if (nn.indexOf(t) > 0) score += 40;
      else if (s.hay.indexOf(t) >= 0) score += 20;
      else { score = -1; break; }
    }
    if (score > 0) out.push({ s, score });
  });
  out.sort((a, b) => (b.score - a.score) || (a.s.name < b.s.name ? -1 : 1));
  return out.map((o) => o.s);
}

function stCell(s) {
  const c = el('button', 'st-cell' + (s.kind === 'emo' ? ' emo' : ''));
  c.type = 'button';
  c.dataset.key = s.key;
  c.title = s.name + ' · pulsa para usar, arrastra hasta un día para colocarlo';
  c.setAttribute('role', 'option');
  const fig = el('span', 'fig');
  if (s.kind === 'svg') fig.innerHTML = s.svg; else fig.textContent = s.ch;
  c.append(fig, el('span', 'lbl', s.name));
  /* Mantener pulsado y arrastrar: el icono se despega y se suelta en un día. */
  c.addEventListener('pointerdown', (e) => {
    if (typeof e.button === 'number' && e.button !== 0) return;
    swallowClick = false;
    startPickDrag(e, s.key);
  });
  return c;
}

function renderPicker() {
  const q = $('#picker-q').value.trim();
  const grid = $('#picker-grid');
  const empty = $('#picker-empty');
  grid.textContent = '';
  let list = [];

  if (q) {
    list = search(q).slice(0, 160);
    if (list.length) {
      const byCat = [];
      list.forEach((s) => {
        let g = byCat.filter((x) => x.cat === s.cat)[0];
        if (!g) { g = { cat: s.cat, items: [] }; byCat.push(g); }
        g.items.push(s);
      });
      byCat.forEach((g) => {
        grid.append(el('div', 'sec-title', g.cat));
        g.items.forEach((s) => grid.append(stCell(s)));
      });
    }
  } else if (activeTab === '__recent') {
    list = state.recents.map(iconOf).filter(Boolean);
    if (list.length) {
      grid.append(el('div', 'sec-title', 'Usados hace poco'));
      list.forEach((s) => grid.append(stCell(s)));
    }
  } else if (activeTab === '__all') {
    grid.append(el('div', 'sec-title', 'Stickers ilustrados'));
    STICKERS.forEach((s) => grid.append(stCell(s)));
    grid.append(el('div', 'sec-title', 'Emoji del sistema'));
    EMOJI.forEach((s) => grid.append(stCell(s)));
    list = ALL_ICONS;
  } else {
    const svgs = STICKERS.filter((s) => s.cat === activeTab);
    const emos = EMOJI.filter((s) => s.cat === activeTab);
    if (svgs.length) {
      grid.append(el('div', 'sec-title', 'Stickers ilustrados'));
      svgs.forEach((s) => grid.append(stCell(s)));
    }
    if (emos.length) {
      grid.append(el('div', 'sec-title', 'Emoji del sistema'));
      emos.forEach((s) => grid.append(stCell(s)));
    }
    list = svgs.concat(emos);
  }

  lastResults = list;
  empty.hidden = list.length > 0;
  if (!list.length && !q && activeTab === '__recent') {
    empty.textContent = 'Todavía no has usado ningún icono. Explora las categorías o busca por nombre.';
  } else {
    empty.textContent = 'Sin resultados. Prueba otra palabra.';
  }
  $('#picker-count').textContent = q
    ? list.length + ' resultado(s) para «' + q + '»'
    : list.length + ' icono(s) en ' + (activeTab === '__recent' ? 'recientes' : activeTab === '__all' ? 'todo el catálogo' : activeTab);
  $('#picker-clear').hidden = !q;
}

function applyPick(key) {
  const s = iconOf(key);
  if (!s) return;
  pushRecent(key);
  const t = pickTarget;

  if (!t) { closePicker(); return; }

  if (t.type === 'day') {
    addDayItem(t.day, { icon: key });
    renderGrid();
    if (drawDay) { const c = cellOf(drawDay); if (c) c.classList.add('drawing'); }
    toast('«' + s.name + '» añadido');
    save();
  } else if (t.type === 'head') {
    state.settings.headSticker = key;
    renderSheet();
    closePicker();
    save();
  } else if (t.type === 'cheer') {
    state.settings.cheerSticker = key;
    renderSheet();
    closePicker();
    save();
  } else if (t.type === 'pending') {
    pendingIcon[t.list] = key;
    refreshSlots();
    closePicker();
  } else if (t.type === 'row') {
    const it = listOf(t.list).filter((x) => x.id === t.id)[0];
    if (it) { it.icon = key; renderLists(); save(); }
    closePicker();
  } else if (t.type === 'dayitem') {
    const rec = state.days[t.day];
    if (rec) {
      const it = rec.items.filter((x) => x.id === t.id)[0];
      if (it) { it.icon = key; renderGrid(); renderEditor(); save(); }
    }
    closePicker();
  }
  renderPicker();
}

/* ---------- datos: exportar / importar ---------- */
function download(name, text, mime) {
  const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function exportJSON() {
  download('calendario-' + keyOf(new Date()) + '.json',
    JSON.stringify(state, null, 2), 'application/json');
  toast('Copia exportada');
}

function importJSON(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const data = JSON.parse(String(fr.result));
      if (!data || typeof data !== 'object' || !data.days) throw new Error('formato');
      if (!window.confirm('Se reemplazará el calendario actual con el de la copia. ¿Continuar?')) return;
      state = Object.assign(clone(DEF), data);
      state.settings = Object.assign(clone(DEF.settings), data.settings || {});
      state.days = state.days || {};
      state.recents = Array.isArray(state.recents) ? state.recents : [];
      normStickers();
      applyFont(state.settings.font);
      fillFontSelect();
      $('#ink-color').value = state.settings.ink;
      $('#week-start').value = String(state.settings.weekStart);
      save();
      renderSheet();
      updateHint();
      toast('Copia importada');
    } catch (err) {
      toast('Ese archivo no es una copia válida');
      console.warn(err);
    }
  };
  fr.readAsText(file);
}

function pad4(n) { return ('0000' + n).slice(-4); }

function exportICS() {
  const first = new Date(view.y, view.m, 1);
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Calendario borrado en seco//ES',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:' + MONTH_EN[view.m] + ' ' + view.y,
  ];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  for (let d = 1; d <= days; d++) {
    const date = new Date(view.y, view.m, d);
    const k = keyOf(date);
    const rec = state.days[k];
    if (!rec || !rec.items || !rec.items.length) continue;
    const names = rec.items.map((it) => {
      const s = it.icon ? iconOf(it.icon) : null;
      return it.text || (s ? s.name : '');
    });
    (rec.stickers || []).forEach((st) => {
      const s = iconOf(st.icon);
      if (s) names.push(s.name);
    });
    const summary = names.filter(Boolean).join(', ').replace(/([,;\\])/g, '\\$1');
    const ymd = pad4(date.getFullYear()) + pad2(date.getMonth() + 1) + pad2(date.getDate());
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + ymd + '-' + pad2(d) + '@calendario-local');
    lines.push('DTSTAMP:' + stamp);
    lines.push('DTSTART;VALUE=DATE:' + ymd);
    lines.push('DTEND;VALUE=DATE:' + ymd);
    lines.push('SUMMARY:' + summary);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  download('calendario-' + view.y + '-' + pad2(view.m + 1) + '.ics', lines.join('\r\n'), 'text/calendar');
  toast('Mes exportado (.ics)');
}

function exportMD() {
  const out = ['# ' + MONTH_EN[view.m] + ' ' + view.y, ''];
  if (state.settings.goal) out.push('**GOALS:** ' + state.settings.goal, '');
  const days = new Date(view.y, view.m + 1, 0).getDate();
  let any = false;
  for (let d = 1; d <= days; d++) {
    const date = new Date(view.y, view.m, d);
    const k = keyOf(date);
    const rec = state.days[k];
    if (!rec) continue;
    const parts = [];
    if (rec.items) {
      rec.items.forEach((it) => {
        const s = it.icon ? iconOf(it.icon) : null;
        const label = [it.text, s ? s.name : ''].filter(Boolean).join(' ');
        if (label) parts.push(label);
      });
    }
    (rec.stickers || []).forEach((st) => {
      const s = iconOf(st.icon);
      if (s) parts.push('[' + s.name + ']');
    });
    if (rec.ink) parts.push('_(tiene un dibujo a mano)_');
    if (!parts.length) continue;
    any = true;
    out.push('- **' + d + ' ' + MONTH_ES[view.m] + ':** ' + parts.join(' · '));
  }
  if (!any) out.push('_Sin anotaciones este mes._');
  out.push('');
  if (state.settings.note) out.push('## NOTES', '', state.settings.note, '');
  if (state.todo.length) {
    out.push('## To do list', '');
    state.todo.forEach((t) => out.push('- [' + (t.done ? 'x' : ' ') + '] ' + t.text));
    out.push('');
  }
  if (state.grocery.length) {
    out.push('## Grocery', '');
    state.grocery.forEach((g) => out.push('- [' + (g.done ? 'x' : ' ') + '] ' + g.text + (g.qty ? ' *' + g.qty : '')));
    out.push('');
  }
  download('calendario-' + view.y + '-' + pad2(view.m + 1) + '.md', out.join('\n'), 'text/markdown;charset=utf-8');
  toast('Mes exportado (.md)');
}

function storageInfo() {
  let bytes = 0;
  try { bytes = (localStorage.getItem(storeKey(dueno)) || '').length; } catch (e) { /* ignorar */ }
  const kb = (bytes / 1024).toFixed(1);
  $('#storage-info').textContent = 'Ocupa ' + kb + ' KB en este equipo · ' +
    Object.keys(state.days).filter(hasContent).length + ' días con contenido · ' +
    state.todo.length + ' tareas · ' + state.grocery.length + ' productos';
}

function resetAll() {
  if (!window.confirm('Se borrarán TODAS las anotaciones, listas e iconos. ¿Seguro?')) return;
  state = clone(DEF);
  try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignorar */ }
  applyFont(state.settings.font);
  fillFontSelect();
  $('#ink-color').value = state.settings.ink;
  $('#week-start').value = '0';
  renderSheet();
  updateHint();
  storageInfo();
  toast('Calendario vacío');
}

/* ============================================================
   Cuentas, nube, panel oculto y calendarios compartidos
   ============================================================ */
let subidaTimer = 0;
let aplicandoRemoto = false;
let ultimoSubido = 0;
let modoIntro = 'entrar';    // la app abre en la bienvenida y el acceso
let panelFilas = [];

function nubeLista() { return Nube.configurado(); }

/* ---------- pantalla de carga ---------- */
let cargaFuera = 0;
let cargaPct = 0;
/* La barra nunca retrocede: los pasos vienen de sitios distintos y alguno
   avisa con un número menor, así que solo se acepta lo que sube. */
function avisarCarga(pct, txt) {
  const relleno = $('#carga-relleno');
  if (!relleno) return;
  cargaPct = Math.max(cargaPct, Math.max(0, Math.min(100, pct)));
  relleno.style.width = cargaPct + '%';
  const barra = $('#carga-barra');
  if (barra) barra.setAttribute('aria-valuenow', String(Math.round(cargaPct)));
  const p = $('#carga-pct');
  if (p) p.textContent = Math.round(cargaPct) + '%';
  if (txt) { const t = $('#carga-paso'); if (t) t.textContent = txt; }
}
/* Sube hasta el 100 %, deja ver el final y retira la cortina. */
function finCarga() {
  clearTimeout(cargaFuera);
  avisarCarga(100, 'Listo');
  cargaFuera = setTimeout(() => {
    const caja = $('#carga');
    if (!caja) return;
    caja.classList.add('fuera');
    setTimeout(() => {
      caja.hidden = true;
      /* Si la entrada está a la vista, el fondo sigue bloqueado. */
      if ($('#intro').hidden) document.body.classList.remove('intro-abierto');
    }, 260);
  }, 320);
}

function guardarLocal() {
  try { localStorage.setItem(storeKey(dueno), JSON.stringify(state)); } catch (e) { /* nada */ }
}

/* Sube el calendario con un pequeño retraso: escribir rápido no dispara
   una subida por cada tecla. */
function subirNube() {
  if (!nubeLista() || !miUid || soloLectura) return;
  const ajeno = dueno !== miUid;
  if (ajeno && !(mirandoA && mirandoA.rol === 'editar')) return;
  clearTimeout(subidaTimer);
  subidaTimer = setTimeout(() => { subirNubeAhora(); }, Nube.retrasoSubida());
}

async function subirNubeAhora() {
  if (!nubeLista() || !miUid || soloLectura) return false;
  try {
    await Nube.guardarCalendario(dueno, state);
    ultimoSubido = Date.now();
    return true;
  } catch (err) {
    toast('No se pudo subir: ' + Nube.mensaje(err));
    return false;
  }
}

function ponEstadoRemoto(remoto) {
  aplicandoRemoto = true;
  state = remoto;
  guardarLocal();
  aplicandoRemoto = false;
}

function tieneCosas(s) {
  return !!(Object.keys(s.days).length || s.todo.length || s.grocery.length);
}

/* Trae lo que hay en la nube. No se pregunta nada: gana la versión más
   reciente (marca `guardadoEn`), y si la de la nube pisa algo de este
   equipo, se guarda antes una copia aparte por si acaso. */
async function bajarNube(uid) {
  const datos = await Nube.leerCalendario(uid);
  if (!datos || !datos.estado) return false;
  const remoto = normalizar(datos.estado);
  if (!tieneCosas(remoto)) return false;          // la nube está vacía: manda la de aquí
  const tNube = remoto.guardadoEn || datos.actualizado || 0;
  const tLocal = state.guardadoEn || 0;
  /* Se sella con la hora de la nube aunque el documento venga sin marca (las
     copias guardadas antes de que existiera `guardadoEn`), si no la de este
     equipo se quedaría en 0 y la nube ganaría en cada carga. */
  remoto.guardadoEn = tNube;
  if (!tieneCosas(state)) { ponEstadoRemoto(remoto); return true; }
  if (tNube > tLocal) {
    /* Solo se guarda copia si de verdad cambia algo. */
    try {
      if (JSON.stringify(state) !== JSON.stringify(remoto)) {
        localStorage.setItem(storeKey(dueno) + ':copia-local', JSON.stringify(state));
      }
    } catch (e) { /* nada */ }
    ponEstadoRemoto(remoto);
    toast('Abierto el calendario más reciente de tu cuenta');
  } else if (tLocal > tNube) {
    await subirNubeAhora();                      // el de este equipo es más nuevo
  }
  /* Si las dos marcas coinciden, ya está todo sincronizado: no se toca nada. */
  return true;
}

/* ---------- cuenta ---------- */
function pintarCuenta(e) {
  /* Un solo botón para todo lo tuyo: los datos, la cuenta y lo compartido.
     Antes había dos botones (Datos y tu alias) que abrían lo mismo. */
  const btn = $('#btn-data');
  if (e.usuario) {
    btn.textContent = 'Datos · ' + (e.alias || e.correo);
    btn.title = 'Tus datos, tu cuenta (' + e.correo + ') y los calendarios compartidos' +
      (e.esAdmin ? ' · administrador' : '');
  } else {
    btn.textContent = 'Datos';
    btn.title = 'Tus datos y los calendarios compartidos';
  }
  $('#btn-panel').hidden = !(e.usuario && e.esAdmin);
  if (e.usuario) {
    $('#cuenta-linea').textContent = 'Has entrado como «' + (e.alias || e.correo) + '» (' + e.correo + ').';
  } else if (!e.configurado) {
    $('#cuenta-linea').textContent = 'Sin Firebase configurado: el calendario vive solo en este equipo.';
  } else {
    $('#cuenta-linea').textContent = 'Sin cuenta. Entra para guardar tu calendario en la nube y poder compartirlo.';
  }
  const pie = $('.foot-note');
  if (pie) {
    pie.textContent = e.usuario
      ? 'Tu calendario se guarda en este equipo y en tu cuenta (proyecto ' + (e.proyecto || 'Firebase') + ').'
      : 'Todo se guarda en este equipo. No se envía nada a internet.';
  }
}

async function entrarApp(u) {
  miUid = u.uid;
  dueno = u.uid;
  soloLectura = false;
  mirandoA = null;
  document.body.classList.remove('mirando-compartido');
  $('#compartido-banner').hidden = true;
  /* Si venimos del formulario de entrada, la cortina de carga vuelve: iniciar
     sesión tarda y conviene ver que algo avanza, no una pantalla congelada. */
  if (!$('#intro').hidden) {
    const caja = $('#carga');
    caja.hidden = false;
    caja.classList.remove('fuera');
    document.body.classList.add('intro-abierto');
    avisarCarga(40, 'Entrando en tu cuenta…');
  }
  state = load();
  /* Cada paso se anuncia ANTES de su espera: si no, la barra se queda con el
     texto viejo mientras trabaja (la escritura del perfil puede tardar). */
  avisarCarga(78, 'Abriendo tu cuenta…');
  try { await Nube.guardarPerfil({ alias: u.alias || '', correo: u.correo || '' }); } catch (e) { /* nada */ }
  avisarCarga(84, 'Bajando tu calendario…');
  try { await bajarNube(u.uid); } catch (err) { toast(Nube.mensaje(err)); }
  avisarCarga(92, 'Preparando el mes…');
  Nube.escucharCalendario(u.uid, (doc) => {
    if (aplicandoRemoto || !doc || !doc.estado) return;
    if (Date.now() - ultimoSubido < 5000) return;    // es lo que acabamos de subir
    const remoto = normalizar(doc.estado);
    /* Solo se adopta si de verdad es más nuevo: así una copia vieja de la
       nube nunca pisa lo que acabas de escribir aquí. */
    if ((remoto.guardadoEn || doc.actualizado || 0) <= (state.guardadoEn || 0)) return;
    ponEstadoRemoto(remoto);
    renderSheet(); updateHint(); storageInfo();
  });
  $('#intro').hidden = true;
  pintarCuenta(Nube.estado());
  renderSheet(); updateHint(); storageInfo();
  avisarCarga(97, 'Casi listo…');
  finCarga();
}

async function salirApp() {
  clearTimeout(subidaTimer);
  modoIntro = 'entrar';
  await Nube.salir();
  miUid = ''; dueno = 'local'; soloLectura = false; mirandoA = null;
  document.body.classList.remove('mirando-compartido');
  $('#compartido-banner').hidden = true;
  state = load();
  pintarCuenta(Nube.estado());
  renderSheet(); updateHint(); storageInfo();
  abrirIntro();
}

/* ---------- pantalla de entrada ---------- */
function abrirIntro() {
  const e = Nube.estado();
  const registro = modoIntro === 'crear';
  $('#intro-registro').hidden = !registro;
  $('#intro-btn').textContent = registro ? 'Crear cuenta' : 'Entrar';
  /* La línea de abajo del botón: en el acceso ofrece las dos salidas
     (contraseña olvidada · crear cuenta); al inscribirse, volver. */
  $('#intro-olvido').hidden = registro;
  $('#intro-sep-olvido').hidden = registro;
  $('#intro-link-cuenta').textContent = registro ? 'Ya tengo cuenta' : 'Crear cuenta';
  /* El atajo para seguir sin cuenta solo desaparece cuando de verdad se
     puede crear una: con Firebase configurado y entrada obligatoria.
     Si no hay configuración, tiene que estar SIEMPRE: si no, la app
     quedaría cerrada sin manera de entrar. */
  $('#intro-local').hidden = e.configurado && Nube.entradaObligatoria();
  const aviso = $('#intro-aviso');
  if (!e.configurado) {
    aviso.classList.add('info');
    aviso.textContent = 'Falta configurar Firebase: abre js/firebase-config.js y pega los datos de tu proyecto (las instrucciones están ahí mismo).';
  } else {
    aviso.classList.remove('info');
    aviso.textContent = '';
  }
  $('#intro').hidden = false;
  document.body.classList.add('intro-abierto');
}

function validarIntro() {
  const correo = $('#in-correo').value.trim();
  const clave = $('#in-clave').value;
  if (correo.indexOf('@') < 1 || correo.indexOf('.') < 0) return 'Escribe un correo válido.';
  if (clave.length < 6) return 'La contraseña necesita al menos 6 caracteres.';
  if (modoIntro === 'crear') {
    if (!$('#in-alias').value.trim()) return 'Pon un alias: es el nombre con el que te verán los demás.';
    if (!$('#in-nombres').value.trim() || !$('#in-apellidos').value.trim()) return 'Escribe tus nombres y tus apellidos.';
    if ($('#in-telefono').value.trim().length < 6) return 'Escribe un teléfono de contacto.';
  }
  return '';
}

async function enviarIntro(ev) {
  if (ev) ev.preventDefault();
  const aviso = $('#intro-aviso');
  const btn = $('#intro-btn');
  const texto = btn.textContent;
  const fallo = validarIntro();
  if (fallo) { aviso.classList.remove('info'); aviso.textContent = fallo; return; }
  if (!Nube.configurado()) {
    aviso.classList.add('info');
    aviso.textContent = 'Todavía no hay Firebase configurado, así que no se pueden crear cuentas. Rellena js/firebase-config.js.';
    return;
  }
  btn.disabled = true;
  btn.textContent = modoIntro === 'crear' ? 'Creando…' : 'Entrando…';
  aviso.classList.remove('info');
  aviso.textContent = '';
  try {
    if (modoIntro === 'crear') {
      await Nube.registrar({
        alias: $('#in-alias').value.trim(),
        nombres: $('#in-nombres').value.trim(),
        apellidos: $('#in-apellidos').value.trim(),
        telefono: $('#in-telefono').value.trim(),
        correo: $('#in-correo').value.trim(),
        clave: $('#in-clave').value,
      });
      toast('Cuenta creada. ¡Bienvenido!');
    } else {
      await Nube.entrar($('#in-correo').value, $('#in-clave').value);
      toast('Hola otra vez');
    }
    $('#in-clave').value = '';
    await entrarApp(Nube.estado().usuario);
  } catch (err) {
    aviso.textContent = Nube.mensaje(err);
  } finally {
    btn.disabled = false;
    btn.textContent = texto;
  }
}

/* ---------- panel oculto (cinco toques en el logo) ---------- */
function abrirPanel() {
  $('#panel').hidden = false;
  $('#panel-clave').hidden = false;
  $('#panel-datos').hidden = true;
  $('#panel-input').value = '';
  $('#panel-error').textContent = '';
  $('#panel-equipo').textContent = String(Nube.visitasEnEsteEquipo());
  setTimeout(() => $('#panel-input').focus(), 60);
}
function cerrarPanel() { $('#panel').hidden = true; }

function pintarPanel() {
  const cuerpo = $('#panel-lista');
  cuerpo.textContent = '';
  if (!panelFilas.length) {
    const tr = el('tr');
    const td = el('td', null, 'Sin visitas registradas todavía.');
    td.colSpan = 4;
    tr.append(td);
    cuerpo.append(tr);
    return;
  }
  panelFilas.forEach((v) => {
    const tr = el('tr');
    tr.append(el('td', 'ip', v.ip || '—'));
    const lugar = [v.ciudad, v.pais].filter(Boolean).join(', ') || '—';
    tr.append(el('td', null, lugar));
    tr.append(el('td', null, [v.navegador, v.sistema].filter(Boolean).join(' · ') || '—'));
    const cuando = v.fecha ? new Date(v.fecha).toLocaleString() : '—';
    tr.append(el('td', null, cuando));
    cuerpo.append(tr);
  });
}

async function cargarPanel() {
  const aviso = $('#panel-aviso');
  const e = Nube.estado();
  $('#panel-equipo').textContent = String(Nube.visitasEnEsteEquipo());
  if (!e.configurado) {
    panelFilas = [];
    pintarPanel();
    aviso.textContent = 'Sin Firebase configurado solo se puede contar las visitas de este equipo.';
    return;
  }
  if (!e.usuario) {
    panelFilas = [];
    pintarPanel();
    aviso.textContent = 'Entra con tu cuenta para leer los datos de la nube.';
    return;
  }
  $('#panel-visitas').textContent = '…';
  $('#panel-usuarios').textContent = '…';
  try { $('#panel-usuarios').textContent = String(await Nube.contarUsuarios()); }
  catch (err) { $('#panel-usuarios').textContent = '—'; }
  if (!e.esAdmin) {
    $('#panel-visitas').textContent = '—';
    panelFilas = [];
    pintarPanel();
    aviso.textContent = 'La lista de IPs solo la ve la cuenta de administrador. Pon tu correo en PANEL.adminEmail (js/firebase-config.js) y el mismo en firestore.rules.';
    return;
  }
  try {
    $('#panel-visitas').textContent = String(await Nube.contarVisitas());
    panelFilas = await Nube.visitas(PANEL.limite || 60);
    pintarPanel();
    aviso.textContent = panelFilas.length + ' visita(s) en la lista. Las IPs son datos personales: úsalas solo para lo que hayas avisado en la app.';
  } catch (err) {
    $('#panel-visitas').textContent = '—';
    aviso.textContent = Nube.mensaje(err);
  }
}

function csvPanel() {
  if (!panelFilas.length) { toast('No hay nada que descargar'); return; }
  const cab = ['fecha', 'ip', 'pais', 'ciudad', 'region', 'proveedor', 'navegador', 'sistema', 'idioma', 'pantalla', 'zona', 'uid'];
  const lineas = [cab.join(',')];
  panelFilas.forEach((v) => {
    const fila = [
      v.fecha ? new Date(v.fecha).toISOString() : '',
      v.ip || '', v.pais || '', v.ciudad || '', v.region || '', v.proveedor || '',
      v.navegador || '', v.sistema || '', v.idioma || '', v.pantalla || '', v.zona || '', v.uid || '',
    ];
    lineas.push(fila.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(','));
  });
  download('visitas-' + keyOf(new Date()) + '.csv', lineas.join('\r\n'), 'text/csv;charset=utf-8');
  toast('Lista descargada');
}

/* ---------- compartir ---------- */
async function invitarDesdeFormulario() {
  const aviso = $('#inv-aviso');
  const q = $('#inv-buscar').value.trim();
  if (!q) { aviso.textContent = 'Escribe el alias o el correo exacto de la persona.'; return; }
  aviso.textContent = 'Buscando…';
  try {
    const gente = await Nube.buscarUsuario(q);
    if (!gente.length) {
      aviso.textContent = 'No encuentro a nadie con «' + q + '». Esa persona tiene que crear su cuenta primero.';
      return;
    }
    const quien = gente[0];
    const rol = $('#inv-rol').value;
    await Nube.invitar(quien, rol, Nube.estado().alias);
    aviso.textContent = 'Hecho: «' + (quien.alias || quien.correo) + '» ya puede abrir tu calendario (' +
      (rol === 'editar' ? 'puede editar' : 'solo ver') + ').';
    $('#inv-buscar').value = '';
    refrescarCompartidos();
  } catch (err) {
    aviso.textContent = Nube.mensaje(err);
  }
}

async function refrescarCompartidos() {
  if (!Nube.estado().usuario) {
    $('#lista-invitados').textContent = '';
    $('#lista-compartidos').textContent = '';
    $('#inv-aviso').textContent = '';
    $('#comp-aviso').textContent = 'Entra con tu cuenta para compartir tu calendario con otras personas.';
    return;
  }
  try {
    const dados = await Nube.invitadosMios();
    const ul = $('#lista-invitados');
    ul.textContent = '';
    dados.forEach((d) => {
      const li = el('li', 'fila-compartido');
      li.append(el('span', 'quien', (d.alias || d.correo || 'alguien') + ' · ' + (d.correo || '')));
      li.append(el('span', 'rol' + (d.rol === 'editar' ? ' editar' : ''), d.rol === 'editar' ? 'edita' : 'solo ve'));
      const del = el('button', 'btn btn-mini btn-danger', 'Quitar');
      del.type = 'button';
      del.addEventListener('click', async () => {
        try { await Nube.quitarInvitado(d.para); await refrescarCompartidos(); toast('Invitación retirada'); }
        catch (err) { toast(Nube.mensaje(err)); }
      });
      li.append(del);
      ul.append(li);
    });
  } catch (err) {
    $('#inv-aviso').textContent = Nube.mensaje(err);
  }

  try {
    const mios = await Nube.misCompartidos();
    const ul2 = $('#lista-compartidos');
    ul2.textContent = '';
    if (!mios.length) $('#comp-aviso').textContent = 'Nadie te ha compartido un calendario todavía.';
    else $('#comp-aviso').textContent = '';
    mios.forEach((d) => {
      const li = el('li', 'fila-compartido');
      li.append(el('span', 'quien', d.alias || d.correo || 'alguien'));
      li.append(el('span', 'rol' + (d.rol === 'editar' ? ' editar' : ''), d.rol === 'editar' ? 'puedo editar' : 'solo ver'));
      const abrir = el('button', 'btn btn-mini', 'Abrir');
      abrir.type = 'button';
      abrir.addEventListener('click', () => verCalendarioDe(d.de, d.alias || d.correo, d.rol));
      const del = el('button', 'btn btn-mini btn-danger', 'Quitar');
      del.type = 'button';
      del.addEventListener('click', async () => {
        try { await Nube.quitarCompartido(d.de); await refrescarCompartidos(); toast('Calendario quitado'); }
        catch (err) { toast(Nube.mensaje(err)); }
      });
      li.append(abrir, del);
      ul2.append(li);
    });
  } catch (err) {
    $('#comp-aviso').textContent = Nube.mensaje(err);
  }
}

async function verCalendarioDe(uid, alias, rol) {
  try {
    const datos = await Nube.leerCalendario(uid);
    if (!datos || !datos.estado) { toast('Ese calendario todavía está vacío'); return; }
    mirandoA = { uid, alias: alias || 'otra persona', rol: rol === 'editar' ? 'editar' : 'ver' };
    soloLectura = mirandoA.rol !== 'editar';
    dueno = uid;
    state = normalizar(datos.estado);
    guardarLocal();
    $('#data-modal').hidden = true;
    document.body.classList.add('mirando-compartido');
    const ban = $('#compartido-banner');
    ban.hidden = false;
    ban.classList.toggle('solo-ver', soloLectura);
    $('#compartido-txt').textContent = soloLectura
      ? 'Estás viendo el calendario de «' + mirandoA.alias + '» en modo solo lectura.'
      : 'Estás editando el calendario de «' + mirandoA.alias + '». Los cambios los verá esa persona.';
    closeEditor(); stopDraw(); clearSelection();
    renderSheet(); updateHint(); storageInfo();
    toast(soloLectura ? 'Calendario compartido (solo lectura)' : 'Calendario compartido (puedes editar)');
  } catch (err) {
    toast(Nube.mensaje(err));
  }
}

function volverAlMio() {
  mirandoA = null;
  soloLectura = false;
  dueno = miUid || 'local';
  state = load();
  document.body.classList.remove('mirando-compartido');
  $('#compartido-banner').hidden = true;
  closeEditor(); stopDraw(); clearSelection();
  renderSheet(); updateHint(); storageInfo();
  toast('De vuelta a tu calendario');
}

/* Devuelve true (y avisa) cuando el calendario abierto es de otra
   persona y no tenemos permiso de edición. La regla de Firestore es la
   que manda de verdad; esto solo evita que la interfaz lo intente. */
function soloVer() {
  if (!soloLectura) return false;
  toast('Solo lectura: este calendario es de otra persona');
  return true;
}

/* ---------- conexión de eventos ---------- */

function bindEditableHeader(node, field) {
  node.addEventListener('input', () => {
    state.settings[field] = node.innerText.replace(/\n+$/, '');
    save();
  });
  node.addEventListener('blur', () => {
    state.settings[field] = node.innerText.replace(/\n+$/, '');
    save();
    if (field === 'goal' || field === 'note') updateHint();
  });
  node.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); node.blur(); }
  });
}

function isTextNode(node) {
  return node && node.dataset && node.dataset.act === 'text';
}
function wireText(root, onCommit) {
  root.addEventListener('keydown', (e) => {
    if (isTextNode(e.target) && e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
  });
  root.addEventListener('focusout', (e) => {
    if (isTextNode(e.target)) onCommit(e.target);
  });
}

function wireAll() {
  /* --- barra superior --- */
  $('#font-select').addEventListener('change', (e) => {
    state.settings.font = e.target.value;
    applyFont(state.settings.font);
    save();
  });
  $('#btn-print').addEventListener('click', () => {
    closeEditor(); stopDraw();
    $('#picker').hidden = true; $('#data-modal').hidden = true;
    setTimeout(() => window.print(), 60);
  });
  $('#btn-data').addEventListener('click', () => {
    storageInfo();
    $('#data-modal').hidden = false;
    refrescarCompartidos();
  });

  /* --- navegación --- */
  $('#btn-prev').addEventListener('click', () => goto(view.y, view.m - 1));
  $('#btn-next').addEventListener('click', () => goto(view.y, view.m + 1));
  $('#btn-today').addEventListener('click', () => goto(today.getFullYear(), today.getMonth()));
  $('#sel-month').addEventListener('change', (e) => goto(view.y, +e.target.value));
  $('#sel-year').addEventListener('change', (e) => goto(+e.target.value, view.m));

  /* --- cabecera y pie de la hoja --- */
  bindEditableHeader($('#goal'), 'goal');
  bindEditableHeader($('#month-note'), 'note');
  bindEditableHeader($('#cheer'), 'cheer');
  $('#head-sticker').addEventListener('click', () => openPicker({ type: 'head' }));
  $('#cheer-sticker').addEventListener('click', () => openPicker({ type: 'cheer' }));

  /* --- cuadrícula --- */
  $('#grid').addEventListener('pointerdown', (e) => {
    if (drawDay) return;
    if (soloVer()) return;
    const grip = e.target.closest('.sticker-grip');
    if (grip) {
      e.preventDefault();
      e.stopPropagation();
      startStickerResize(e, grip);
      return;
    }
    const node = e.target.closest('.sticker');
    if (!node) return;
    e.preventDefault();
    e.stopPropagation();
    selectSticker(node.dataset.day, node.dataset.id);
    startStickerDrag(e, node);
  });

  /* La rueda del ratón sobre un icono lo agranda o lo reduce. */
  $('#grid').addEventListener('wheel', (e) => {
    const node = e.target.closest('.sticker');
    if (!node || drawDay || soloLectura) return;
    e.preventDefault();
    if (!selected || selected.id !== node.dataset.id || selected.day !== node.dataset.day) {
      selectSticker(node.dataset.day, node.dataset.id);
    }
    const st = getSticker(node.dataset.day, node.dataset.id);
    if (st) setStickerSize(st.s + (e.deltaY < 0 ? 0.2 : -0.2));
  }, { passive: false });

  $('#grid').addEventListener('click', (e) => {
    if (e.target.closest('.sticker')) return;   // los iconos se manejan aparte
    const cell = e.target.closest('.cell');
    if (!cell || drawDay) return;
    if (soloVer()) return;
    const k = cell.dataset.day;
    const chip = e.target.closest('.chip');
    if (chip && e.target.closest('.st')) {
      openPicker({ type: 'dayitem', day: k, id: chip.dataset.item });
      return;
    }
    if (e.target.closest('.txt')) return;
    openEditor(k, !!e.target.closest('.add'));
  });
  wireText($('#grid'), (node) => {
    const chip = node.closest('.chip');
    const cell = node.closest('.cell');
    if (!chip || !cell) return;
    const rec = state.days[cell.dataset.day];
    if (!rec) return;
    const it = rec.items.filter((x) => x.id === chip.dataset.item)[0];
    if (!it) return;
    it.text = node.innerText.replace(/\n+$/, '');
    save();
    updateHint();
  });

  /* --- listas laterales --- */
  function listClick(e) {
    const li = e.target.closest('.row');
    if (!li) return;
    if (soloVer()) return;
    const kind = li.closest('#list-grocery') ? 'grocery' : 'todo';
    const arr = listOf(kind);
    const it = arr.filter((x) => x.id === li.dataset.id)[0];
    if (!it) return;
    const act = e.target.closest('[data-act]');
    if (!act) return;
    const a = act.dataset.act;
    if (a === 'toggle') {
      it.done = !it.done;
      renderLists(); save(); updateHint();
    } else if (a === 'icon') {
      openPicker({ type: 'row', list: kind, id: it.id });
    } else if (a === 'del') {
      arr.splice(arr.indexOf(it), 1);
      renderLists(); save(); updateHint();
    }
  }
  $('#list-todo').addEventListener('click', listClick);
  $('#list-grocery').addEventListener('click', listClick);

  ['#list-todo', '#list-grocery'].forEach((sel) => {
    wireText($(sel), (node) => {
      const li = node.closest('.row');
      const kind = $(sel) === $('#list-grocery') ? 'grocery' : 'todo';
      const it = listOf(kind).filter((x) => x.id === li.dataset.id)[0];
      if (!it) return;
      it.text = node.innerText.replace(/\n+$/, '');
      save();
    });
  });

  $$('.add-row').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (soloVer()) return;
      const kind = form.dataset.add;
      const input = form.querySelector('input[type=text]');
      const qty = form.querySelector('input.qty');
      const text = input.value.trim();
      if (!text && !pendingIcon[kind]) return;
      const item = { id: uid(), text: text, done: false, icon: pendingIcon[kind] || null };
      if (kind === 'grocery' && qty && qty.value) item.qty = qty.value;
      listOf(kind).push(item);
      input.value = '';
      if (qty) qty.value = '';
      pendingIcon[kind] = null;
      renderLists(); save(); updateHint();
      input.focus();
    });
  });

  $$('[data-pick-icon]').forEach((btn) => {
    btn.addEventListener('click', () => openPicker({ type: 'pending', list: btn.dataset.pickIcon }));
  });
  $$('[data-collapse]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.collapse;
      state.settings.collapsed[kind] = !state.settings.collapsed[kind];
      renderLists(); save();
    });
  });

  /* --- panel de día --- */
  $$('#day-editor [data-close-editor]').forEach((b) => b.addEventListener('click', closeEditor));
  $('#day-new-text').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (soloVer()) return;
    const v = e.target.value.trim();
    if (!v || !editing) return;
    e.target.value = '';
    addDayItem(editing, { text: v });
    renderEditor();
    renderGrid();
    if (drawDay) { const c = cellOf(drawDay); if (c) c.classList.add('drawing'); }
  });
  $('#day-pick-icon').addEventListener('click', () => {
    if (editing) openPicker({ type: 'day', day: editing });
  });
  $('#day-draw').addEventListener('click', () => {
    if (!editing) return;
    if (drawDay === editing) { stopDraw(); return; }
    if (soloVer()) return;
    startDraw(editing);
  });
  $('#day-clear-ink').addEventListener('click', () => clearInk(editing));
  $('#day-clear-all').addEventListener('click', () => {
    if (!editing || soloVer()) return;
    if (!window.confirm('Se vaciará este día (textos, iconos y dibujo). ¿Continuar?')) return;
    clearInk(editing);
    delete state.days[editing];
    save();
    renderGrid();
    renderEditor();
    updateHint();
    toast('Día vaciado');
  });
  $('#day-items').addEventListener('click', (e) => {
    if (!editing || soloVer()) return;
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const act = e.target.closest('[data-act]');
    if (act && act.dataset.act === 'del-item') {
      const rec = state.days[editing];
      if (!rec) return;
      const i = rec.items.map((x) => x.id).indexOf(chip.dataset.item);
      if (i >= 0) rec.items.splice(i, 1);
      if (dayEmpty(rec)) delete state.days[editing];
      save(); renderEditor(); renderGrid(); updateHint();
      toast('Quitado');
      return;
    }
    if (e.target.closest('.st')) {
      openPicker({ type: 'dayitem', day: editing, id: chip.dataset.item });
    }
  });
  wireText($('#day-items'), (node) => {
    const chip = node.closest('.chip');
    const rec = state.days[editing];
    if (!chip || !rec) return;
    const it = rec.items.filter((x) => x.id === chip.dataset.item)[0];
    if (!it) return;
    it.text = node.innerText.replace(/\n+$/, '');
    save(); renderGrid();
    if (drawDay) { const c = cellOf(drawDay); if (c) c.classList.add('drawing'); }
  });

  /* --- buscador --- */
  $('#picker-q').addEventListener('input', renderPicker);
  $('#picker-q').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (lastResults.length) applyPick(lastResults[0].key);
    }
  });
  $('#picker-clear').addEventListener('click', () => {
    $('#picker-q').value = '';
    renderPicker();
    $('#picker-q').focus();
  });
  $('#picker-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;
    activeTab = tab.dataset.tab;
    $('#picker-q').value = '';
    $$('#picker-tabs .tab').forEach((b) => b.classList.toggle('on', b === tab));
    renderPicker();
  });
  $('#picker-grid').addEventListener('click', (e) => {
    if (swallowClick) { swallowClick = false; return; }   // venía de un arrastre
    const c = e.target.closest('.st-cell');
    if (c) applyPick(c.dataset.key);
  });
  $$('#picker [data-close-picker]').forEach((b) => b.addEventListener('click', closePicker));
  $('#picker').addEventListener('click', (e) => { if (e.target === $('#picker')) closePicker(); });

  /* --- datos --- */
  function closeData() { $('#data-modal').hidden = true; }
  $$('#data-modal [data-close-data]').forEach((b) => b.addEventListener('click', closeData));
  $('#data-modal').addEventListener('click', (e) => { if (e.target === $('#data-modal')) closeData(); });
  $('#btn-export').addEventListener('click', exportJSON);
  $('#btn-import').addEventListener('click', () => $('#file-import').click());
  $('#file-import').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) importJSON(f);
    e.target.value = '';
  });
  $('#btn-export-ics').addEventListener('click', exportICS);
  $('#btn-export-md').addEventListener('click', exportMD);
  $('#ink-color').addEventListener('input', (e) => {
    state.settings.ink = e.target.value;
    const bc = $('#drawbar-color');
    if (bc) bc.value = e.target.value;
    save();
  });
  $('#week-start').addEventListener('change', (e) => {
    state.settings.weekStart = +e.target.value;
    renderSheet();
    save();
  });
  $('#btn-reset').addEventListener('click', resetAll);

  /* --- instalación --- */
  $('#btn-install').addEventListener('click', function () {
    if (!window.__installPrompt) return;
    window.__installPrompt.prompt();
    window.__installPrompt.userChoice.then(() => {
      window.__installPrompt = null;
      $('#btn-install').hidden = true;
    });
  });

  /* --- atajos globales --- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('#picker').hidden) { closePicker(); return; }
      if (!$('#data-modal').hidden) { $('#data-modal').hidden = true; return; }
      if (!$('#panel').hidden) { cerrarPanel(); return; }
      if (drawDay) { stopDraw(); return; }
      if (editing) { closeEditor(); return; }
      if (selected) { clearSelection(); return; }
      return;
    }
    if (editing || drawDay) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    /* Con un icono elegido: flechas para moverlo, + y − para el tamaño. */
    if (selected) {
      const st = getSticker(selected.day, selected.id);
      if (st) {
        const step = e.shiftKey ? 5 : 1;
        const k = e.key;
        let used = true;
        if (k === 'ArrowLeft')       st.x = clampNum(st.x - step, 4, 96, st.x);
        else if (k === 'ArrowRight') st.x = clampNum(st.x + step, 4, 96, st.x);
        else if (k === 'ArrowUp')    st.y = clampNum(st.y - step, 6, 94, st.y);
        else if (k === 'ArrowDown')  st.y = clampNum(st.y + step, 6, 94, st.y);
        else if (k === '+' || k === '=') setStickerSize(st.s + 0.25);
        else if (k === '-' || k === '_') setStickerSize(st.s - 0.25);
        else if (k === 'Delete' || k === 'Backspace') removeSticker(selected.day, st.id);
        else if (k === '0') moveStickerTo(selected.day, st.id, 50, 50);
        else used = false;
        if (used) {
          e.preventDefault();
          if (k.indexOf('Arrow') === 0) paintStickerPos();
          return;
        }
      }
    }

    if (e.key === 'ArrowLeft') goto(view.y, view.m - 1);
    if (e.key === 'ArrowRight') goto(view.y, view.m + 1);
  });

  /* --- entrada, cuenta, panel y compartir --- */
  $('#intro-link-cuenta').addEventListener('click', () => {
    modoIntro = modoIntro === 'crear' ? 'entrar' : 'crear';
    $('#intro-aviso').textContent = '';
    abrirIntro();
    if (modoIntro === 'crear') setTimeout(() => $('#in-alias').focus(), 40);
  });
  $('#intro-form').addEventListener('submit', enviarIntro);
  $('#intro-olvido').addEventListener('click', async () => {
    const correo = $('#in-correo').value.trim();
    const aviso = $('#intro-aviso');
    if (correo.indexOf('@') < 1) {
      aviso.classList.remove('info');
      aviso.textContent = 'Escribe tu correo arriba y vuelvo a intentarlo.';
      return;
    }
    try {
      await Nube.recuperar(correo);
      aviso.classList.add('info');
      aviso.textContent = 'Te he enviado un correo para cambiar la contraseña.';
    } catch (err) {
      aviso.textContent = Nube.mensaje(err);
    }
  });
  $('#intro-local').addEventListener('click', () => {
    miUid = ''; dueno = 'local'; soloLectura = false; mirandoA = null;
    state = load();
    $('#intro').hidden = true;
    document.body.classList.remove('intro-abierto');
    pintarCuenta(Nube.estado());
    renderSheet(); updateHint(); storageInfo();
    toast('Sin cuenta: el calendario vive solo en este equipo');
  });

  /* Cinco toques seguidos en el logo abren el panel oculto. */
  let toques = 0, toquesTimer = 0;
  $('.brand').addEventListener('click', () => {
    toques++;
    clearTimeout(toquesTimer);
    toquesTimer = setTimeout(() => { toques = 0; }, 2500);
    if (toques >= 5) { toques = 0; abrirPanel(); }
  });
  $('#panel-entrar').addEventListener('click', () => {
    if ($('#panel-input').value !== Nube.clavePanel()) {
      $('#panel-error').textContent = 'Clave incorrecta.';
      return;
    }
    $('#panel-error').textContent = '';
    $('#panel-clave').hidden = true;
    $('#panel-datos').hidden = false;
    cargarPanel();
  });
  $('#panel-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); $('#panel-entrar').click(); }
  });
  $$('#panel [data-close-panel]').forEach((b) => b.addEventListener('click', cerrarPanel));
  $('#panel').addEventListener('click', (e) => { if (e.target === $('#panel')) cerrarPanel(); });
  $('#panel-recargar').addEventListener('click', cargarPanel);
  $('#panel-csv').addEventListener('click', csvPanel);

  $('#btn-salir').addEventListener('click', salirApp);
  $('#btn-panel').addEventListener('click', () => { $('#data-modal').hidden = true; abrirPanel(); });
  $('#inv-btn').addEventListener('click', invitarDesdeFormulario);
  $('#btn-volver-mio').addEventListener('click', volverAlMio);

  document.addEventListener('pointerdown', (e) => {
    /* Un clic fuera de un icono (o de su barra) lo deselecciona. */
    if (selected && e.target.closest &&
        !e.target.closest('.sticker') && !e.target.closest('.sticker-bar') &&
        !e.target.closest('.overlay')) {
      clearSelection();
    }
    if (!editing) return;
    if ($('#day-editor').contains(e.target)) return;
    if (e.target.closest && e.target.closest('.sticker-bar')) return;
    const cell = e.target.closest && e.target.closest('.cell');
    if (cell && cell.dataset.day === editing) return;
    if (e.target.closest && e.target.closest('.overlay')) return;
    closeEditor();
  });
}

/* ---------- instalación PWA ---------- */
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__installPrompt = e;
  $('#btn-install').hidden = false;
});
window.addEventListener('appinstalled', () => {
  $('#btn-install').hidden = true;
  toast('App instalada en este equipo');
});

/* ---------- arranque ---------- */
function init() {
  /* La cortina de carga ya se ve desde el primer pintado; aquí solo se
     bloquea el fondo y se empieza a informar del avance. */
  document.body.classList.add('intro-abierto');
  avisarCarga(8, 'Preparando…');
  applyFont(state.settings.font);
  fillFontSelect();
  fillNav();
  $('#ink-color').value = state.settings.ink;
  $('#week-start').value = String(state.settings.weekStart);
  ensureDrawbar();
  if (!state.recents.length) {
    state.recents = ['svg:fireworks', 'svg:gift', 'svg:cake', 'svg:dog', 'svg:camera'];
  }
  wireAll();
  renderSheet();
  updateHint();
  storageInfo();
  avisarCarga(30, 'Montando el mes…');

  /* --- cuentas y nube --- */
  pintarCuenta(Nube.estado());
  Nube.onCambio((e) => {
    pintarCuenta(e);
    /* En cuanto hay sesión (también al volver a abrir la app con la
       sesión guardada) se carga el calendario de esa cuenta. */
    if (e.usuario && !miUid) entrarApp(e.usuario).catch((err) => toast(Nube.mensaje(err)));
  });
  if (nubeLista()) {
    /* No se decide nada hasta saber si había sesión guardada: así, al
       recargar o al volver a abrir la app, se entra directo al calendario y
       la pantalla de acceso solo sale si de verdad no hay sesión (o si se
       ha pulsado «Cerrar sesión»). */
    /* Lo más lento es bajar el SDK de Firebase desde su CDN, así que ese paso
       se anuncia ANTES de empezar, no después. */
    avisarCarga(40, 'Conectando con la nube…');
    Nube.init()
      .then(async () => {
        avisarCarga(62, 'Comprobando tu sesión…');
        const u = await Nube.esperarSesion(6000);
        if (u) await entrarApp(u);
        else { finCarga(); abrirIntro(); }
      })
      .catch((err) => {
        finCarga();
        abrirIntro();
        toast(Nube.mensaje(err));
      });
  } else {
    avisarCarga(60, 'Modo local');
    finCarga();
    abrirIntro();
  }

  /* Red de seguridad: la cortina de carga no se queda puesta nunca. */
  setTimeout(() => {
    if (!$('#carga').hidden && !miUid && $('#intro').hidden) { finCarga(); abrirIntro(); }
  }, 12000);

  /* Contador de visitas (y la IP, si Firebase está configurado). */
  Nube.registrarVisita('').catch(() => { /* no es crítico */ });

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Sin service worker:', err));
    });
  }
  console.log('%cCalendario listo', 'color:#2e7d4f;font-weight:600',
    '· ' + STICKERS.length + ' stickers ilustrados · ' + EMOJI.length + ' emoji');
}

init();
