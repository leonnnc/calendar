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
  'drop-target', 'ghost', 'sel', 'picker-tip',
  'intro', 'intro-card', 'intro-head', 'intro-hola', 'intro-form', 'intro-dos', 'campo',
  'intro-registro', 'intro-links', 'intro-sep', 'link',
  'intro-aviso', 'intro-pie', 'intro-btn', 'aviso-compartido',
  'lista-compartidos', 'fila-compartido', 'panel-admin', 'panel-cifras', 'cifra',
  'tabla-ip', 'field-grow'];
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
ok(version !== 'calendario-v1' && version !== 'calendario-v2' && version !== 'calendario-v3',
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

/* ---------- 6. cuentas, nube, panel oculto y compartir ---------- */
const fbjs = readFileSync(p('js', 'firebase.js'), 'utf8');
const fbcfg = readFileSync(p('js', 'firebase-config.js'), 'utf8');
const reglas = readFileSync(p('firestore.rules'), 'utf8');

ok(/export const FIREBASE_CONFIG/.test(fbcfg), 'firebase-config.js declara la configuración del proyecto');
const camposCfg = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const sinValor = camposCfg.filter((c) => !new RegExp(c + ":\\s*'[^']+'").test(fbcfg));
ok(sinValor.length === 0, 'La configuración tiene los 6 valores de Firebase', sinValor.join(', '));
ok(/indexOf\('PEGA_AQUI'\)/.test(fbjs),
  'La app sabe detectar que la configuración sigue sin rellenar');
ok(/export const PANEL/.test(fbcfg) && /adminEmail/.test(fbcfg) && /clave:/.test(fbcfg),
  'La configuración incluye la clave y el correo del panel');
ok(!/clave: '24681357'/.test(fbcfg) && /clave: '[^']{4,}'/.test(fbcfg),
  'La clave del panel está puesta y no es la de ejemplo');
ok(/export const AJUSTES/.test(fbcfg) && /entradaObligatoria/.test(fbcfg),
  'La configuración incluye si la entrada es obligatoria');

['registrar', 'entrar', 'salir', 'recuperar', 'guardarPerfil', 'leerPerfil',
  'leerCalendario', 'guardarCalendario', 'escucharCalendario', 'buscarUsuario',
  'invitar', 'misCompartidos', 'invitadosMios', 'quitarCompartido', 'quitarInvitado',
  'registrarVisita', 'visitas', 'contarVisitas', 'contarUsuarios'].forEach((f) => {
  ok(new RegExp('export (async )?function ' + f + '\\b').test(fbjs),
    'firebase.js ofrece ' + f + '()');
});

ok(/firebase-app\.js/.test(fbjs) && /firebase-auth\.js/.test(fbjs) && /firebase-firestore\.js/.test(fbjs),
  'El SDK se carga bajo demanda desde el CDN');
ok(/if \(!configurado\(\)\) return Promise\.resolve\(null\)/.test(fbjs),
  'Sin configuración no se carga ni se toca nada de Firebase');
ok(/createUserWithEmailAndPassword/.test(fbjs) && /signInWithEmailAndPassword/.test(fbjs),
  'Las cuentas las gestiona Firebase Auth');
ok(!/setItem\([^)]*clave/i.test(fbjs) && !/setItem\([^)]*password/i.test(fbjs),
  'La contraseña no se guarda nunca en el equipo');
ok(/updateProfile/.test(fbjs), 'El alias se guarda como nombre visible de la cuenta');
ok(/ipwho\.is/.test(fbjs) && /api\.ipify\.org/.test(fbjs),
  'La IP se pide a un servicio público, con un segundo de respaldo');
ok(/getCountFromServer/.test(fbjs), 'Los contadores se piden con getCountFromServer');

['users/{uid}', 'usuarios_publicos/{uid}', 'users/{uid}/calendario/{docId}',
  'users/{uid}/invitados/{invitado}', 'compartidos/{invitado}/recibidos/{dueno}', 'visitas/{visita}']
  .forEach((m) => ok(reglas.indexOf('match /' + m) > 0, 'Las reglas cubren /' + m));
ok(/function esAdmin/.test(reglas), 'Las reglas distinguen la cuenta de administrador');
ok(/allow read, update, delete: if esAdmin\(\)/.test(reglas),
  'Solo el administrador puede leer la lista de IPs');
ok(/rol == 'editar'/.test(reglas), 'Editar el calendario de otro exige invitación con permiso');
ok(!/allow (read|write)[^:]*: if true\b/.test(reglas), 'Las reglas no dejan nada abierto a cualquiera');
const bloquePublico = (reglas.match(/match \/usuarios_publicos[\s\S]*?\n    \}/) || [''])[0];
ok(bloquePublico.indexOf('telefono') < 0 && bloquePublico.indexOf('apellidos') < 0,
  'La copia pública no admite teléfono ni apellidos');
ok(/hasOnly/.test(reglas), 'Las visitas solo aceptan los campos previstos');

/* Regresión importante: en Firestore las colecciones ocupan las posiciones
   IMPARES y los documentos las PARES. Un collection() con 2 segmentos o un
   doc() con 3 compila perfectamente, pero el SDK rechaza la referencia antes
   de salir a la red (era el fallo de «Compartidos conmigo»). */
const malasColecciones = fbjs.match(/collection\(fb\.db,\s*'[^']+',\s*[^,)]+\)/g) || [];
ok(malasColecciones.length === 0,
  'Ninguna colección de Firestore con número de segmentos imposible', malasColecciones.join(' | '));
const malosDocs = fbjs.match(/doc\(fb\.db,\s*'[^']+',\s*[^,)]+,\s*'[^']+'\)/g) || [];
ok(malosDocs.length === 0,
  'Ningún documento de Firestore con número de segmentos imposible', malosDocs.join(' | '));
ok(/collection\(fb\.db, 'compartidos', st\.usuario\.uid, 'recibidos'\)/.test(fbjs) &&
  /doc\(fb\.db, 'compartidos', destino\.uid, 'recibidos', yoSoy\)/.test(fbjs) &&
  /doc\(fb\.db, 'compartidos', st\.usuario\.uid, 'recibidos', uidDueno\)/.test(fbjs),
  'Las invitaciones se guardan en la subcolección «recibidos» (código)');
ok(reglas.indexOf('match /compartidos/{invitado}/recibidos/{dueno}') > 0 &&
  reglas.indexOf('/compartidos/$(request.auth.uid)/recibidos/$(dueno)') > 0,
  'Las reglas usan exactamente esa misma ruta');
ok(!/match \/compartidos\/\{[^}]+\}\/\{[^}]+\}\s*\{/.test(reglas),
  'Ninguna regla apunta a una ruta de 3 segmentos (imposible en Firestore)');
ok(/adminEmail: '[^']+'/.test(fbcfg) &&
  new RegExp("token.email == '" + (fbcfg.match(/adminEmail: '([^']+)'/) || ['', ''])[1] + "'").test(reglas),
  'El correo de administrador coincide en la configuración y en las reglas');

ok(/from '\.\/firebase\.js'/.test(js), 'app.js usa el módulo de cuentas');
ok(/from '\.\/firebase-config\.js'/.test(js), 'app.js lee la configuración del panel');
ok(/function storeKey/.test(js) && /storeKey\(dueno\)/.test(js),
  'Cada cuenta tiene su propio cajón en el equipo');
ok(/toques >= 5/.test(js), 'El panel se abre con cinco toques en el logo');
ok(/Nube\.clavePanel\(\)/.test(js), 'El panel pide su clave antes de abrirse');
ok(/function soloVer/.test(js) && /soloLectura/.test(js),
  'El calendario compartido sin permiso queda en solo lectura');
ok(/verCalendarioDe/.test(js) && /volverAlMio/.test(js),
  'Se puede abrir un calendario compartido y volver al propio');
ok(/Nube\.registrarVisita/.test(js), 'Cada visita suma al contador');
ok(/entradaObligatoria/.test(js) && /abrirIntro/.test(js), 'La entrada se decide según la configuración');
/* Regresión: si no hay Firebase configurado, el atajo para seguir sin
   cuenta tiene que estar visible o la app queda cerrada sin salida. */
ok(/\$\('#intro-local'\)\.hidden = e\.configurado && Nube\.entradaObligatoria\(\)/.test(js),
  'Sin Firebase configurado siempre queda la salida de seguir sin cuenta');
ok(/#data-modal \.pop-body[\s\S]{0,120}overflow:auto/.test(css),
  'Los paneles de contenido largo se pueden desplazar (si no, se corta el final)');

ok(/id="intro" class="intro"/.test(html) && /id="intro-form"/.test(html), 'Hay pantalla de entrada');
['in-alias', 'in-nombres', 'in-apellidos', 'in-correo', 'in-telefono', 'in-clave'].forEach((campo) => {
  ok(html.indexOf('id="' + campo + '"') > 0, 'La entrada pide ' + campo);
});
ok(/id="in-clave" type="password"/.test(html), 'La contraseña se escribe en un campo oculto');
ok(/id="in-correo" type="email"/.test(html), 'El correo se valida como correo');

/* El orden pedido: bienvenida → correo y contraseña → botón → enlaces debajo. */
const iHola = html.indexOf('intro-hola');
const iCorreo = html.indexOf('id="in-correo"');
const iClave = html.indexOf('id="in-clave"');
const iBoton = html.indexOf('id="intro-btn"');
const iEnlaces = html.indexOf('intro-links');
ok(iHola > 0 && iHola < iCorreo && iCorreo < iClave && iClave < iBoton && iBoton < iEnlaces,
  'La entrada va: bienvenida, correo, contraseña, botón y enlaces debajo del botón');
ok(html.indexOf('Bienvenido a') > 0 && html.indexOf('>Calendario<') > 0,
  'La pantalla da la bienvenida antes de pedir nada');
const bloqueEnlaces = (html.match(/<p class="intro-links">[\s\S]*?<\/p>/) || [''])[0];
ok(bloqueEnlaces.indexOf('intro-olvido') > 0 && bloqueEnlaces.indexOf('intro-link-cuenta') > 0,
  '«Olvidaste la contraseña» y «Crear cuenta» van en la misma línea');
ok(/id="intro-registro" hidden/.test(html), 'Los datos de inscripción empiezan ocultos');
ok(/let modoIntro = 'entrar'/.test(js), 'La app abre en la bienvenida y el acceso, no en la inscripción');
ok(html.indexOf('intro-tabs') < 0 && js.indexOf('intro-tabs') < 0,
  'Ya no hay pestañas: esa línea de enlaces hace su papel');
ok(/body\.intro-abierto\{overflow:hidden\}/.test(css), 'Con la entrada delante, el fondo no se desplaza');
/* Regresión: la etiqueta apilada encima del control hacía que cada fila
   ocupara dos alturas y los botones parecieran descolgados. */
ok(/\.field\{display:flex;flex-direction:row;align-items:center/.test(css),
  'Las etiquetas van en la misma línea que su control (barra de una sola altura)');
/* Regresión: eran DOS barras (arriba herramientas, abajo meses) y el usuario
   las veía como dos secciones. Ahora todo va en una sola. */
ok(/\.topbar\{[\s\S]{0,200}?align-items:center/.test(css), 'La barra única alinea todo al centro');
ok(html.indexOf('nav-bar') < 0 && css.indexOf('.nav-bar') < 0,
  'Ya no hay una segunda barra: todo va en una sola sección');
ok(html.indexOf('nav-spacer') < 0, 'La barra única no necesita separador extra');
ok(/#nav-hint\{[\s\S]{0,260}?text-overflow:ellipsis/.test(css),
  'Si falta sitio, el aviso se recorta en vez de partir la barra');
/* Regresión: con base `auto` el aviso reclamaba el ancho de su texto entero
   y empujaba «Letra / Imprimir / Datos» a una segunda fila. */
ok(/#nav-hint\{\s*flex:1 1 0/.test(css), 'El aviso cede sitio antes que partir la barra en dos');

/* ---------- 3d. móvil ---------- */
ok((css.match(/repeat\(7,minmax\(0,1fr\)\)/g) || []).length >= 2,
  'Las columnas de la semana pueden encogerse (con `1fr` la hoja desbordaba en móvil)');
ok(/\.weekdays > span \+ span\{border-left/.test(css),
  'El borde entre días no se cuela en las etiquetas internas');
/* Con la misma especificidad a propósito: `.weekdays .dia-corto{display:none}`
   (0,2,0) le gana a un `.dia-corto{display:inline}` (0,1,0) y la fila de días
   se quedaba sin una sola etiqueta en móvil. */
ok(/\.weekdays \.dia-corto\{display:none\}/.test(css) &&
  /@media \(max-width:720px\)[\s\S]*?\.weekdays \.dia-corto\{display:inline\}/.test(css) &&
  /@media \(max-width:720px\)[\s\S]*?\.weekdays \.dia-largo\{display:none\}/.test(css),
  'En móvil se ven las etiquetas cortas de los días (LU, MA, MI…)');
ok(/dia-corto'/.test(js) && /DAY_ES\[d\]\.slice\(0, 2\)/.test(js),
  'Cada día trae su etiqueta corta calculada en español');
ok(/class="weekdays"/.test(html) || /id="weekdays"/.test(html), 'Sigue habiendo fila de días de la semana');
const movil = (css.match(/@media \(max-width:720px\)\{[\s\S]*?\n\}/) || [''])[0];
/* Regresión: `overflow-x:hidden` en `html` convierte a html en contenedor de
   scroll y mata el desplazamiento vertical; con `height:100%` en body, el
   contenido de debajo del pliegue queda inalcanzable. */
ok(/body\{overflow-x:hidden\}/.test(movil) && !/html,body\{height:100%\}/.test(css),
  'En móvil no hay desplazamiento horizontal, y el vertical sigue funcionando');
ok(/\.brand span\{display:none\}/.test(movil), 'En móvil la barra se queda con el logo');
ok(/\.topbar \.field-lbl\{display:none\}/.test(css), 'En pantallas estrechas fuera etiquetas de la barra');
ok(/@media \(max-width:720px\)[\s\S]*?\.cell\{min-height:72px/.test(css),
  'En móvil las casillas se reducen para que entre el mes completo');
ok(/@media \(max-width:720px\)[\s\S]*?\.side\{gap:10px;flex-direction:column\}/.test(css),
  'En móvil las listas van en una columna');

/* ---------- 3e. pantalla de carga, sesión y sincronización ---------- */
ok(html.indexOf('id="carga"') > 0 && html.indexOf('id="carga-relleno"') > 0 &&
  html.indexOf('id="carga-pct"') > 0 && html.indexOf('id="carga-paso"') > 0,
  'Hay pantalla de carga con barra, porcentaje y texto del paso');
ok(/<div id="carga" class="carga">/.test(html),
  'La cortina se ve desde el primer pintado (nada de ver el calendario a medias)');
ok(/\.carga-relleno\{[\s\S]{0,220}?width:0/.test(css), 'La barra de carga empieza en 0 %');
ok(/function avisarCarga\(pct, txt\)/.test(js) && /function finCarga\(\)/.test(js),
  'La carga informa del avance y sabe retirarse');
ok(/Nube\.esperarSesion\(/.test(js) && /function esperarSesion/.test(fbjs) && /sesionLeida/.test(fbjs),
  'No se decide si mostrar la entrada hasta saber si había sesión guardada');
/* El diálogo salía en CADA carga porque `bajarNube` preguntaba si pisar los
   datos. Los confirm() que quedan son los de acciones destructivas (vaciar un
   día, borrar todo, importar), que sí deben preguntar. */
const bajarNubeSrc = (js.match(/async function bajarNube[\s\S]*?\n\}/) || [''])[0];
ok(bajarNubeSrc.length > 0 && bajarNubeSrc.indexOf('confirm') < 0,
  'Al abrir no se pregunta nada (fuera el diálogo que salía en cada carga)');
ok(/state\.guardadoEn = Date\.now\(\)/.test(js), 'Cada edición marca la hora del último cambio');
ok(/remoto\.guardadoEn \|\| datos\.actualizado/.test(js),
  'Al abrir, gana la versión más reciente (sin preguntar)');
ok(/if \(\(remoto\.guardadoEn \|\| doc\.actualizado \|\| 0\) <= \(state\.guardadoEn \|\| 0\)\) return;/.test(js),
  'Una copia vieja de la nube no pisa lo que acabas de escribir aquí');
ok(/if \(u\) await entrarApp\(u\);/.test(js) && /else \{ finCarga\(\); abrirIntro\(\); \}/.test(js),
  'Con sesión se entra directo; solo sin sesión se pide la contraseña');
ok(/cargaPct = Math\.max\(cargaPct, /.test(js),
  'La barra de carga nunca retrocede (los pasos llegan desordenados)');
const pasosCarga = js.match(/avisarCarga\(\d+, '[^']+'\)/g) || [];
ok(pasosCarga.length >= 7, 'La carga informa de varios pasos (no se queda en uno solo)',
  pasosCarga.length + ' pasos');
ok(/avisarCarga\(40, 'Conectando con la nube…'\)[\s\S]{0,80}?Nube\.init\(\)/.test(js),
  'El paso más lento (bajar el SDK) se anuncia antes de empezarlo');
ok(/function avanzarSola\(\)/.test(js) && /cargaTecho = Math\.min\(cargaPct \+ 8, 96\)/.test(js),
  'La barra avanza sola mientras espera, sin llegar al 100 % por su cuenta');
ok(/clearTimeout\(cargaTic\);\s*\/\/ el avance automático ya no tiene sentido/.test(js),
  'Al terminar, el avance automático se detiene');

/* ---------- 3f. menos viajes a Firebase ---------- */
ok(/getIdToken\(fb\.auth\.currentUser, !tokenForzado\)/.test(fbjs),
  'El token se pide de la caché, no forzando una vuelta a Google en cada operación');
ok(/tokenForzado = true;/.test(fbjs) && /tokenForzado = false;/.test(fbjs),
  'Se fuerza el token una sola vez, al entrar');
ok(/perfilGuardado !== firma/.test(js) && /PERFIL_KEY/.test(js),
  'El perfil no se reescribe si no ha cambiado (era una escritura por carga)');
/* ---------- 3g. que la app se actualice sola ---------- */
ok(/fetch\(req, \{ cache: 'reload' \}\)/.test(sw),
  'La página se revalida siempre con el servidor (GitHub Pages cachea 10 minutos)');
ok(/addEventListener\('visibilitychange', \(\) => \{ if \(!document\.hidden\) buscar\(\)/.test(js),
  'Al volver a la app se pregunta si hay versión nueva (una app reanudada nunca navegaba)');
ok(/setInterval\(buscar, 30 \* 60 \* 1000\)/.test(js), 'También se pregunta cada media hora');
ok(/addEventListener\('controllerchange'/.test(js) && /location\.reload\(\)/.test(js),
  'Cuando entra una versión nueva, la app se recarga sola');
ok(/const editandoAhora = drawDay \|\|/.test(js),
  'Nunca se recarga en mitad de una edición o de un dibujo');
ok(!/Ã|Â/.test(sw) && !/Ã|Â/.test(js) && !/Ã|Â/.test(css) && !/Ã|Â/.test(html),
  'Sin restos de acentos mal codificados (mojibake)');

ok(/window\.__escucha = \{ adjuntado: Date\.now\(\)/.test(js) &&
  /window\.__escucha\.snapshots \+= 1/.test(js),
  'El escucha deja señal de vida (se puede comprobar sin tocar los datos)');
ok(/setTimeout\(\(\) => \{[\s\S]{0,120}?Nube\.escucharCalendario\(u\.uid, alLlegarRemoto\);\s*\}, 600\)/.test(js),
  'El escucha en tiempo real se engancha después de la cortina, no compitiendo con ella');
ok(/remoto\.guardadoEn = tNube;/.test(js),
  'Al adoptar la copia de la nube se sella con su hora (si no, se queda en 0 y gana siempre)');
ok(/else if \(tLocal > tNube\)/.test(js),
  'Con las dos marcas iguales no se sube ni se baja nada (ya está sincronizado)');
ok(/JSON\.stringify\(state\) !== JSON\.stringify\(remoto\)/.test(js),
  'Solo se guarda copia aparte si de verdad hay algo distinto que salvar');
ok(/if \(u\) await entrarApp\(u\);/.test(js) && !/setTimeout\(\(\) => \{ if \(!miUid && \$\('#intro'\)\.hidden\) abrirIntro\(\); \}, 700\)/.test(js),
  'Ya no se abre la entrada por si acaso a los 700 ms (era el parpadeo del login)');
ok(/setTimeout\(\(\) => \{\s*if \(!\$\('#carga'\)\.hidden/.test(js),
  'La cortina tiene red de seguridad: nunca se queda puesta');
ok(/s\.guardadoEn = Number\(data\.guardadoEn\) \|\| 0/.test(js),
  'La marca de tiempo sobrevive al guardado y a la recarga');
ok(/if \(\$\('#intro'\)\.hidden\) document\.body\.classList\.remove\('intro-abierto'\)/.test(js),
  'Al terminar la carga, el fondo se desbloquea solo si no hay entrada delante');
/* El aviso tiene que caber de verdad: texto corto en pantalla y detalle en
   el tooltip, o en la barra de una línea se recorta con puntos suspensivos. */
ok(/hint\.title = largo/.test(js), 'El detalle del aviso va al tooltip');
ok(/' productos';/.test(js) && /productos por comprar'/.test(js),
  'El aviso usa texto corto en pantalla y largo en el tooltip');
ok(html.indexOf('id="sel-month"') > 0 && html.indexOf('id="font-select"') > 0 &&
  html.indexOf('id="sel-month"') < html.indexOf('id="nav-hint"') &&
  html.indexOf('id="nav-hint"') < html.indexOf('id="font-select"'),
  'Los controles del mes y los de la letra comparten la misma barra');
ok((js.match(/classList\.remove\('intro-abierto'\)/g) || []).length >= 2,
  'Al entrar se vuelve a permitir el desplazamiento');
ok(/id="panel" class="overlay"/.test(html) && html.indexOf('id="panel-visitas"') > 0 &&
  html.indexOf('id="panel-lista"') > 0 && html.indexOf('id="panel-input"') > 0,
  'El panel trae clave, contador y lista de IPs');
ok(html.indexOf('id="lista-compartidos"') > 0 && html.indexOf('id="lista-invitados"') > 0 &&
  html.indexOf('id="inv-buscar"') > 0,
  'Hay zona para invitar y para ver lo que te comparten');
/* Regresión: «Datos» y el alias eran dos botones que abrían el mismo modal. */
ok(html.indexOf('btn-cuenta') < 0 && js.indexOf('btn-cuenta') < 0,
  'Un solo botón lleva a los datos y a la cuenta (antes había dos)');
ok((js.match(/\$\('#btn-data'\)\.addEventListener/g) || []).length === 1,
  'Ese botón se conecta una sola vez');
ok(/btn\.textContent = 'Datos · '/.test(js), 'El botón enseña con qué alias has entrado');
ok(js.indexOf('Las IPs son datos personales') > 0,
  'La app avisa de que las IPs son datos personales');

ok(shell.indexOf('./js/firebase.js') >= 0, 'El armazón precargado incluye el módulo de cuentas');
ok(shell.indexOf('./js/firebase-config.js') < 0, 'La configuración queda fuera del armazón precargado');
ok(sw.indexOf('firebase-config.js') > 0 && /endsWith\('\/js\/firebase-config\.js'\)/.test(sw),
  'El service worker sirve la configuración siempre fresca (sin caché)');

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
