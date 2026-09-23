/* ============================================================
   app.js — Calendario · planificador de borrado en seco
   Todo vive en localStorage. Sin servidor, sin cuentas.
   ============================================================ */

import { STICKERS, STICKER_CATS, normKey } from './stickers.js';
import { EMOJI, EMOJI_CATS } from './emoji.js';

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

/* ---------- estado ---------- */
const DEF = {
  v: 1,
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

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return clone(DEF);
    const data = JSON.parse(raw);
    const s = clone(DEF);
    s.v = data.v || 1;
    Object.assign(s.settings, data.settings || {});
    s.settings.collapsed = Object.assign({ todo: false, grocery: false }, (data.settings || {}).collapsed || {});
    s.days = data.days || {};
    s.todo = Array.isArray(data.todo) ? data.todo : [];
    s.grocery = Array.isArray(data.grocery) ? data.grocery : [];
    s.recents = Array.isArray(data.recents) ? data.recents : [];
    return s;
  } catch (err) {
    console.warn('No se pudo leer el almacenamiento, se empieza de cero.', err);
    return clone(DEF);
  }
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }

let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (err) {
      toast('No se pudo guardar: almacenamiento lleno');
      console.warn(err);
    }
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
  if (!r && create) { r = { items: [], ink: null }; state.days[k] = r; }
  return r;
}
function hasContent(k) {
  const r = state.days[k];
  if (!r) return false;
  return (r.items && r.items.length > 0) || !!r.ink;
}
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

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
    host.append(el('span', null, DAY_EN[(start + i) % 7]));
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

    cell.append(num, add, cv, box);
    if (drawDay === k) cell.classList.add('drawing');
    grid.append(cell);
  }
  initInk();
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
      if (r.items.length === 0 && !r.ink) delete state.days[k];
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
  resizeTimer = setTimeout(() => { initInk(); placePopover(); }, 220);
});
window.addEventListener('scroll', () => { if (editing) placePopover(); }, { passive: true });

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
  $('#nav-hint').textContent = n + ' día(s) con anotaciones · ' + t + ' tareas pendientes · ' + g + ' productos por comprar';
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
    if (rec.items.length === 0) delete state.days[k];
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
  c.title = s.name;
  c.setAttribute('role', 'option');
  const fig = el('span', 'fig');
  if (s.kind === 'svg') fig.innerHTML = s.svg; else fig.textContent = s.ch;
  c.append(fig, el('span', 'lbl', s.name));
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
    const summary = rec.items.map((it) => {
      const s = it.icon ? iconOf(it.icon) : null;
      const label = it.text || (s ? s.name : '');
      return label;
    }).filter(Boolean).join(', ').replace(/([,;\\])/g, '\\$1');
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
  try { bytes = (localStorage.getItem(STORE_KEY) || '').length; } catch (e) { /* ignorar */ }
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
  $('#grid').addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell || drawDay) return;
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
    if (drawDay === editing) stopDraw(); else startDraw(editing);
  });
  $('#day-clear-ink').addEventListener('click', () => clearInk(editing));
  $('#day-clear-all').addEventListener('click', () => {
    if (!editing) return;
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
    if (!editing) return;
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const act = e.target.closest('[data-act]');
    if (act && act.dataset.act === 'del-item') {
      const rec = state.days[editing];
      if (!rec) return;
      const i = rec.items.map((x) => x.id).indexOf(chip.dataset.item);
      if (i >= 0) rec.items.splice(i, 1);
      if (!rec.items.length && !rec.ink) delete state.days[editing];
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
      if (drawDay) { stopDraw(); return; }
      if (editing) { closeEditor(); return; }
      return;
    }
    if (editing || drawDay) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'ArrowLeft') goto(view.y, view.m - 1);
    if (e.key === 'ArrowRight') goto(view.y, view.m + 1);
  });

  document.addEventListener('pointerdown', (e) => {
    if (!editing) return;
    if ($('#day-editor').contains(e.target)) return;
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

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Sin service worker:', err));
    });
  }
  console.log('%cCalendario listo', 'color:#2e7d4f;font-weight:600',
    '· ' + STICKERS.length + ' stickers ilustrados · ' + EMOJI.length + ' emoji');
}

init();
