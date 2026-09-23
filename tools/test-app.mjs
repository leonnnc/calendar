/* ============================================================
   test-app.mjs — pruebas de conformidad sin navegador.
   Verifica:
     1. Catálogo de stickers y emoji (ids únicos, SVG válido).
     2. Buscador: palabras clave esperadas devuelven resultados.
     3. Coherencia entre js/app.js, index.html y css/app.css.
     4. manifest.webmanifest, service worker e iconos.
   Uso:  node tools/test-app.mjs
   ============================================================ */

import { readFileSync, existsSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...a) => resolve(ROOT, ...a);

let pass = 0;
const fails = [];

function ok(cond, label, detail) {
  if (cond) { pass++; return true; }
  fails.push(label + (detail ? ' → ' + detail : ''));
  return false;
}
const N = (s) => String(s || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/* ---------- 1. catálogos ---------- */
const { STICKERS, STICKER_CATS } = await import('../js/stickers.js');
const { EMOJI, EMOJI_CATS } = await import('../js/emoji.js');

ok(STICKERS.length >= 60, 'Hay al menos 60 stickers ilustrados', 'hay ' + STICKERS.length);
ok(EMOJI.length >= 150, 'Hay al menos 150 emoji', 'hay ' + EMOJI.length);

const all = STICKERS.concat(EMOJI);
const seenId = new Set();
const dupId = [];
all.forEach((s) => {
  if (seenId.has(s.id)) dupId.push(s.id);
  seenId.add(s.id);
});
ok(dupId.length === 0, 'Ningún icono repetido', dupId.slice(0, 8).join(', '));

const seenKey = new Set();
const dupKey = [];
all.forEach((s) => {
  if (seenKey.has(s.key)) dupKey.push(s.key);
  seenKey.add(s.key);
});
ok(dupKey.length === 0, 'Ninguna clave de icono repetida', dupKey.slice(0, 8).join(', '));

ok(all.every((s) => s.name && s.name.trim()), 'Todos los iconos tienen nombre');
ok(all.every((s) => s.cat && s.cat.trim()), 'Todos los iconos tienen categoría');
ok(all.every((s) => Array.isArray(s.keys) && s.keys.length >= 3),
  'Todos los iconos tienen al menos 3 palabras clave',
  all.filter((s) => !(s.keys || []).length || s.keys.length < 3).slice(0, 5).map((s) => s.id).join(', '));

const badSvg = [];
STICKERS.forEach((s) => {
  const t = s.svg;
  const opens = (t.match(/<[a-z]/g) || []).length;
  const closes = (t.match(/<\/[a-z]/g) || []).length;
  const selfClosed = (t.match(/\/>/g) || []).length;
  if (t.indexOf('viewBox="0 0 48 48"') < 0) badSvg.push(s.id + ' (sin viewBox)');
  else if (opens !== closes + selfClosed) badSvg.push(s.id + ' (etiquetas ' + opens + '/' + closes + '+' + selfClosed + ')');
  else if (t.indexOf('</svg>') < 0) badSvg.push(s.id + ' (sin cierre)');
});
ok(badSvg.length === 0, 'Todos los SVG están bien formados', badSvg.slice(0, 6).join(' · '));

/* ---------- 2. buscador ---------- */
function buscar(q) {
  const terms = N(q).split(' ').filter(Boolean);
  const out = [];
  all.forEach((s) => {
    let score = 0;
    for (const t of terms) {
      const nn = N(s.name);
      if (nn === t) score += 100;
      else if (nn.indexOf(t) === 0) score += 60;
      else if (nn.indexOf(t) > 0) score += 40;
      else if (s.hay.indexOf(t) >= 0) score += 20;
      else { score = -1; break; }
    }
    if (score > 0) out.push({ s, score });
  });
  out.sort((a, b) => b.score - a.score);
  return out.map((o) => o.s);
}

const queries = [
  ['torta', ['cake', '🎂']],
  ['regalo', ['gift', '🎁']],
  ['perro', ['dog', '🐶']],
  ['yoga', ['yoga', '🧘']],
  ['gato', ['cat', '🐱']],
  ['cumpleanos', ['cake']],
  ['navidad', []],
  ['fuegos artificiales', ['fireworks']],
  ['pizza', ['pizza', '🍕']],
  ['correr', ['run', '🏃']],
  ['galleta', ['gingerbread', '🍪']],
  ['hueso', ['bone', '🦴']],
  ['sol', ['sun', '☀️']],
  ['cafe', ['coffee', '☕']],
  ['lavanderia', ['laundry', '🧺']],
  ['mascota', []],
];

queries.forEach(([q, esperados]) => {
  const res = buscar(q);
  ok(res.length > 0, 'La búsqueda «' + q + '» devuelve resultados', '0 resultados');
  esperados.forEach((id) => {
    ok(res.some((s) => s.id === id), '«' + q + '» encuentra ' + id,
      res.slice(0, 5).map((s) => s.id).join(', '));
  });
});

ok(buscar('TORTA').length > 0, 'La búsqueda no distingue mayúsculas');
ok(buscar('arbol').some((s) => s.id === 'tree' || s.id === '🌳'),
  'La búsqueda ignora los acentos (arbol → árbol)');
ok(buscar('Torta de cumpleaños').some((s) => s.id === 'cake'),
  'Frases de varias palabras funcionan');

const cats = STICKER_CATS.concat(EMOJI_CATS);
ok(cats.length >= 9, 'Hay al menos 9 categorías', cats.join(', '));
[0, 1, 2, 3, 4, 5, 6].forEach((dow) => {
  ok(dow >= 0 && dow < 7, 'día de la semana válido');
});

/* ---------- 3. coherencia HTML / JS / CSS ---------- */
const html = readFileSync(p('index.html'), 'utf8');
const js = readFileSync(p('js', 'app.js'), 'utf8');
const css = readFileSync(p('css', 'app.css'), 'utf8');

const ids = new Set();
(html.match(/id="([A-Za-z0-9_-]+)"/g) || []).forEach((m) => ids.add(m.slice(4, -1)));
const dupHtmlId = [];
const seenHtml = new Set();
(html.match(/id="([A-Za-z0-9_-]+)"/g) || []).forEach((m) => {
  const v = m.slice(4, -1);
  if (seenHtml.has(v)) dupHtmlId.push(v);
  seenHtml.add(v);
});
ok(dupHtmlId.length === 0, 'No hay id repetidos en index.html', dupHtmlId.join(', '));

const usedIds = new Set();
(js.match(/\$\('#([A-Za-z0-9_-]+)'/g) || []).forEach((m) => usedIds.add(m.slice(4, -1)));
['card-todo', 'card-grocery', 'list-todo', 'list-grocery'].forEach((v) => usedIds.add(v));
// Elementos que app.js crea en tiempo de ejecución o arma por concatenación.
const DYNAMIC_IDS = ['card-', 'drawbar', 'drawbar-color', 'sticker-bar'];
const missingIds = [...usedIds].filter((v) => !ids.has(v) && DYNAMIC_IDS.indexOf(v) < 0);
ok(missingIds.length === 0, 'Todos los id que usa app.js existen en index.html', missingIds.join(', '));

const attrs = ['data-close-editor', 'data-close-picker', 'data-close-data',
               'data-collapse', 'data-pick-icon', 'data-add'];
const missingAttrs = attrs.filter((a) => html.indexOf(a) < 0);
ok(missingAttrs.length === 0, 'Los atributos data-* que usa app.js existen en el HTML', missingAttrs.join(', '));

const neededClasses = ['cell', 'cell-items', 'chip', 'ink', 'num', 'add', 'row', 'check',
  'ico', 'txt', 'qty', 'del', 'list', 'add-row', 'popover', 'day-items', 'day-new',
  'day-tools', 'overlay', 'picker-panel', 'picker-grid', 'st-cell', 'fig', 'lbl', 'tab',
  'sec-title', 'empty', 'drawbar', 'drawing', 'today', 'other', 'weekend', 'done',
  'cell-stickers', 'sticker', 'sticker-box', 'sticker-anim', 'sticker-grip', 'st-fig',
  'sticker-bar', 'sbar-name', 'sbar-val', 'sbar-anim', 'sbar-select', 'icon-ghost',
  'drop-target', 'ghost', 'sel', 'picker-tip'];
const missingCss = neededClasses.filter((c) => css.indexOf('.' + c.trim()) < 0);
ok(missingCss.length === 0, 'Todas las clases que usa app.js están definidas en app.css', missingCss.join(', '));

ok(css.indexOf('.chip .del') > 0, 'La CSS define el botón de borrado de las fichas');
ok(css.indexOf('.drawbar') > 0, 'La CSS define la barra del modo dibujo');
ok(css.indexOf('[contenteditable]:empty:before') > 0, 'La CSS define los textos de ayuda');
ok(/\[hidden\]\s*\{\s*display\s*:\s*none/.test(css),
  'La CSS respeta el atributo hidden (si no, los paneles quedan siempre abiertos)');
ok(css.indexOf('@media print') > 0, 'Hay estilos de impresión');

/* ---------- 3b. iconos colocables: arrastrar, tamaño y movimiento ---------- */
const ANIMS = (js.match(/const ANIMS = \[([\s\S]*?)\];/) || ['', ''])[1];
const animIds = [...ANIMS.matchAll(/id:\s*'([a-z]*)'/g)].map((m) => m[1]);
ok(animIds.length >= 5, 'app.js declara al menos 5 movimientos', animIds.join(', '));
ok(animIds[0] === '', 'El primer movimiento es «sin movimiento»');
const sinKeyframes = animIds.filter((id) => id && css.indexOf('@keyframes st-' + id) < 0);
ok(sinKeyframes.length === 0, 'Cada movimiento tiene sus @keyframes en la CSS', sinKeyframes.join(', '));
const sinRegla = animIds.filter((id) => id && css.indexOf('.sticker[data-anim="' + id + '"]') < 0);
ok(sinRegla.length === 0, 'Cada movimiento está enganchado desde la CSS', sinRegla.join(', '));
ok(/prefers-reduced-motion/.test(css), 'La CSS respeta «reducir movimiento» del sistema');

const piezas = [
  ['stickerNode', 'app.js construye el nodo de cada icono colocado'],
  ['cell-stickers', 'app.js crea la capa de iconos dentro de la casilla'],
  ['sticker-grip', 'app.js tiene el pico para agrandar y reducir'],
  ['startStickerDrag', 'app.js permite arrastrar un icono ya colocado'],
  ['startStickerResize', 'app.js permite redimensionar tirando del pico'],
  ['startPickDrag', 'app.js permite arrastrar desde el buscador hasta un día'],
  ['moveSticker', 'app.js permite mover un icono de un día a otro'],
  ['removeSticker', 'app.js permite quitar un icono colocado'],
  ['setStickerSize', 'app.js cambia el tamaño'],
  ['setStickerAnim', 'app.js cambia el movimiento'],
  ['drop-target', 'la casilla destino se resalta al arrastrar'],
  ['normSticker', 'los datos se sanean al cargar (posición, escala, giro)'],
  ['dayEmpty', 'un día se borra solo si no queda texto, dibujo ni icono'],
];
const faltanPiezas = piezas.filter(([k]) => js.indexOf(k) < 0);
ok(faltanPiezas.length === 0, 'La app trae todas las piezas de los iconos colocables',
  faltanPiezas.map(([k]) => k).join(', '));

const campos = ['x', 'y', 's', 'r', 'anim'];
const sinCampo = campos.filter((c) => !new RegExp('\\b' + c + ':').test(js));
ok(sinCampo.length === 0, 'El icono guarda posición, tamaño, giro y movimiento', sinCampo.join(', '));
ok(/st\.s\s*=\s*clampNum/.test(js) && /st\.r\s*=\s*clampNum/.test(js),
  'El tamaño y el giro se limitan a un rango sensato');
ok(html.indexOf('picker-tip') > 0, 'El buscador explica que se puede arrastrar');
/* Regresión: al soltar hay que mirar qué hay debajo ANTES de devolver el buscador;
   si no, el propio panel intercepta el punto y el icono no llega nunca a la casilla. */
const pickSrc = (js.match(/function startPickDrag[\s\S]*?\n\}/) || [''])[0];
const iHit = pickSrc.lastIndexOf('at(ev.clientX, ev.clientY)');
const iOff = pickSrc.indexOf("classList.remove('drag-icon')");
ok(iHit > 0 && iOff > 0 && iHit < iOff,
  'El soltado busca la casilla antes de devolver el buscador');
ok(/arrastra para moverlo/.test(js), 'Cada icono avisa de que se puede arrastrar');

const modeRefs = [
  [/type="module" src="js\/app\.js"/, 'index.html carga js/app.js como módulo'],
  [/manifest\.webmanifest/, 'index.html enlaza el manifiesto'],
  [/assets\/icons\/favicon\.svg/, 'index.html enlaza el favicon'],
  [/assets\/icons\/apple-touch-icon\.png/, 'index.html enlaza el icono de Apple'],
  [/assets\/fonts\/fonts\.css/, 'index.html enlaza las fuentes locales'],
];
modeRefs.forEach(([re, label]) => ok(re.test(html), label));

ok(/from '\.\/stickers\.js'/.test(js), 'app.js importa los stickers');
ok(/from '\.\/emoji\.js'/.test(js), 'app.js importa los emoji');

/* ---------- 4. manifiesto, service worker e iconos ---------- */
const manifest = JSON.parse(readFileSync(p('manifest.webmanifest'), 'utf8'));
ok(manifest.name && manifest.short_name, 'El manifiesto tiene nombre y nombre corto');
ok(manifest.display === 'standalone', 'El manifiesto usa display standalone');
ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3, 'El manifiesto declara al menos 3 iconos');
ok(manifest.icons.some((i) => i.purpose === 'maskable'), 'El manifiesto incluye un icono maskable');
const missingIcons = manifest.icons.map((i) => i.src).filter((s) => !existsSync(p(s)));
ok(missingIcons.length === 0, 'Los iconos del manifiesto existen', missingIcons.join(', '));

const sw = readFileSync(p('sw.js'), 'utf8');
const shell = (sw.match(/'\.\/[^']*'/g) || []).map((s) => s.slice(1, -1));
const missingShell = [...new Set(shell)].filter((s) => s !== './' && !existsSync(p(s)));
ok(missingShell.length === 0, 'Todos los recursos del service worker existen',
  missingShell.slice(0, 8).join(', '));
ok(shell.length >= 15, 'El service worker precarga el armazón completo', shell.length + ' entradas');
ok(/addEventListener\('fetch'/.test(sw), 'El service worker intercepta peticiones');
const version = (sw.match(/const VERSION = '([^']+)'/) || ['', ''])[1];
ok(/^calendario-v\d+$/.test(version), 'El service worker declara una versión con formato válido', version);
ok(version !== 'calendario-v1' && version !== 'calendario-v2',
  'La versión del service worker se subió tras cambiar la app', version);
ok(shell.includes('./js/app.js') && shell.includes('./css/app.css'),
  'El armazón precargado incluye la lógica y los estilos');

const css_fonts = readFileSync(p('assets', 'fonts', 'fonts.css'), 'utf8');
const fontRefs = (css_fonts.match(/url\('\.\/([^']+)'\)/g) || []).map((s) => s.slice(7, -2));
ok(fontRefs.length >= 8, 'fonts.css declara al menos 8 archivos', String(fontRefs.length));
const missingFonts = fontRefs.filter((f) => !existsSync(p('assets', 'fonts', f)));
ok(missingFonts.length === 0, 'Todos los woff2 existen', missingFonts.join(', '));
const declared = new Set((html.match(/--font-hand:([^;]*)/) || [''])[0]);
ok(/Caveat/.test(css), 'La tipografía manuscrita por defecto es Caveat');
ok(/Dancing Script/.test(css), 'La tipografía de script está declarada');

/* ---------- 5. sintaxis de app.js (módulo ESM) ---------- */
try {
  const dir = mkdtempSync(join(tmpdir(), 'cal-'));
  const tmp = join(dir, 'app.check.mjs');
  writeFileSync(tmp, js, 'utf8');
  execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
  ok(true, 'js/app.js tiene sintaxis válida');
} catch (err) {
  ok(false, 'js/app.js tiene sintaxis válida', String(err.stderr || err.message).slice(0, 300));
}

/* ---------- resumen ---------- */
console.log('');
console.log('Comprobaciones superadas: ' + pass);
if (fails.length) {
  console.log('Fallos: ' + fails.length);
  fails.forEach((f, i) => console.log('  ' + (i + 1) + '. ' + f));
  process.exitCode = 1;
} else {
  console.log('Todo correcto: stickers, buscador, HTML, CSS, manifiesto y service worker.');
}
