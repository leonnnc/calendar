/* ============================================================
   firebase.js — cuentas y nube del Calendario

   Sigue el mismo patrón que Servitech (js/cloud.js):
     · Cuentas con correo y contraseña (las gestiona Firebase; la
       app NUNCA guarda contraseñas).
     · Un documento de perfil por usuario:
         users/{uid}                     alias, nombres, correo…
         usuarios_publicos/{uid}         solo alias y correo (para
                                         poder invitar a alguien)
         users/{uid}/calendario/main     el calendario completo
         compartidos/{uid}/{dueno}       calendarios que te comparten
         users/{uid}/invitados/{otro}    a quién se lo compartes tú
         visitas/{auto}                  contador de visitas + IP
     · Caché local de Firestore: si no hay señal, encola los cambios.
     · Escucha en tiempo real, para ver el mismo calendario en dos
       equipos a la vez.

   Sin `apiKey` real en firebase-config.js todo esto queda apagado y
   la app trabaja solo en el navegador.
   ============================================================ */

import { FIREBASE_CONFIG, PANEL, AJUSTES } from './firebase-config.js';

const CDN = 'https://www.gstatic.com/firebasejs/10.12.2/';
const LS_VISITAS = 'calendario-visitas-v1';
const LS_ULTIMA = 'calendario-visita-enviada-v1';

let fb = { app: null, auth: null, db: null, mod: null };
let initP = null;
let escucha = null;
const oyentes = [];

const st = {
  listo: false,
  cargando: false,
  usuario: null,      // { uid, correo, alias }
  error: '',
  codigo: '',
};

/* ---------- configuración ---------- */

export function configurado() {
  return !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.apiKey.indexOf('PEGA_AQUI') !== 0 &&
    FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.projectId.indexOf('tu-proyecto') !== 0);
}

export function clavePanel() { return String(PANEL.clave || ''); }
export function esCorreoAdmin(correo) {
  const a = String(PANEL.adminEmail || '').trim().toLowerCase();
  return !!a && a === String(correo || '').trim().toLowerCase();
}
export function retrasoSubida() { return Math.max(600, Number(AJUSTES.retrasoSubida) || 2500); }
export function entradaObligatoria() { return !!AJUSTES.entradaObligatoria; }

/* ---------- estado hacia la interfaz ---------- */

export function estado() {
  return {
    configurado: configurado(),
    listo: st.listo,
    cargando: st.cargando,
    usuario: st.usuario,
    correo: st.usuario ? st.usuario.correo : '',
    alias: st.usuario ? st.usuario.alias : '',
    uid: st.usuario ? st.usuario.uid : '',
    esAdmin: st.usuario ? esCorreoAdmin(st.usuario.correo) : false,
    error: st.error,
    codigo: st.codigo,
    proyecto: (FIREBASE_CONFIG || {}).projectId || '',
  };
}
export function onCambio(fn) {
  if (oyentes.indexOf(fn) < 0) oyentes.push(fn);
  return () => {
    const i = oyentes.indexOf(fn);
    if (i >= 0) oyentes.splice(i, 1);
  };
}
function avisar() {
  const e = estado();
  oyentes.forEach((f) => { try { f(e); } catch (err) { /* nada */ } });
}

/* ---------- carga diferida del SDK ---------- */

export function init() {
  if (!configurado()) return Promise.resolve(null);
  if (st.listo) return Promise.resolve(fb);
  if (initP) return initP;

  initP = (async () => {
    st.cargando = true; avisar();
    try {
      const appMod = await import(CDN + 'firebase-app.js');
      const authMod = await import(CDN + 'firebase-auth.js');
      const fsMod = await import(CDN + 'firebase-firestore.js');
      fb.mod = { appMod, authMod, fsMod };
      fb.app = appMod.getApps && appMod.getApps().length
        ? appMod.getApps()[0] : appMod.initializeApp(FIREBASE_CONFIG);
      fb.auth = authMod.getAuth(fb.app);
      try { await authMod.setPersistence(fb.auth, authMod.browserLocalPersistence); } catch (e) { /* nada */ }
      try {
        fb.db = fsMod.initializeFirestore(fb.app, {
          localCache: fsMod.persistentLocalCache({ tabManager: fsMod.persistentMultipleTabManager() }),
        });
      } catch (e) {
        fb.db = fsMod.getFirestore(fb.app);
      }
      st.listo = true; st.cargando = false;
      authMod.onAuthStateChanged(fb.auth, async (u) => {
        st.usuario = u ? { uid: u.uid, correo: u.email || '', alias: u.displayName || '' } : null;
        if (u) { await refrescarToken(); st.error = ''; }
        avisar();
      });
      avisar();
      return fb;
    } catch (err) {
      st.cargando = false;
      st.error = mensaje(err);
      initP = null;
      avisar();
      throw err;
    }
  })();
  return initP;
}

/* Sin esto, la primera lectura puede salir antes de que el token de
   sesión llegue a Firestore y responder «permiso denegado» aunque las
   reglas estén bien. */
async function refrescarToken() {
  try {
    const { authMod } = fb.mod;
    if (fb.auth && authMod && authMod.getIdToken && fb.auth.currentUser) {
      await authMod.getIdToken(fb.auth.currentUser, true);
    }
  } catch (e) { /* nada */ }
}

async function fs() {
  await init();
  if (!fb.mod || !fb.db) throw new Error('nube-no-configurada');
  return fb.mod.fsMod;
}

/* ---------- cuentas ---------- */

export async function registrar(datos) {
  await init();
  const { authMod } = fb.mod;
  const alias = (datos.alias || '').trim();
  const r = await authMod.createUserWithEmailAndPassword(fb.auth, datos.correo.trim(), datos.clave);
  try { await authMod.updateProfile(r.user, { displayName: alias }); } catch (e) { /* nada */ }
  await refrescarToken();
  st.usuario = { uid: r.user.uid, correo: r.user.email || datos.correo, alias };
  avisar();
  await guardarPerfil({
    alias,
    nombres: (datos.nombres || '').trim(),
    apellidos: (datos.apellidos || '').trim(),
    correo: r.user.email || datos.correo.trim(),
    telefono: (datos.telefono || '').trim(),
    creado: Date.now(),
  });
  return st.usuario;
}

export async function entrar(correo, clave) {
  await init();
  const { authMod } = fb.mod;
  const r = await authMod.signInWithEmailAndPassword(fb.auth, String(correo).trim(), clave);
  await refrescarToken();
  st.usuario = {
    uid: r.user.uid,
    correo: r.user.email || '',
    alias: r.user.displayName || '',
  };
  st.error = ''; st.codigo = '';
  avisar();
  return st.usuario;
}

export async function salir() {
  try { await init(); if (fb.auth) await fb.mod.authMod.signOut(fb.auth); } catch (e) { /* nada */ }
  dejarDeEscuchar();
  st.usuario = null; st.error = ''; st.codigo = '';
  avisar();
}

export async function recuperar(correo) {
  await init();
  await fb.mod.authMod.sendPasswordResetEmail(fb.auth, String(correo).trim());
  return true;
}

/* ---------- perfil ---------- */

/* Guarda el perfil. Solo toca los campos que se le pasan: entrar en la
   app no debe borrar los apellidos ni el teléfono del registro. */
export async function guardarPerfil(perfil) {
  if (!st.usuario) throw new Error('sin-sesion');
  const fsMod = await fs();
  await refrescarToken();
  const uid = st.usuario.uid;
  const ahora = Date.now();

  const doc = { uid, actualizado: ahora };
  ['alias', 'nombres', 'apellidos', 'telefono'].forEach((k) => {
    if (typeof perfil[k] === 'string' && perfil[k].trim()) doc[k] = perfil[k].trim();
  });
  if (typeof perfil.correo === 'string') doc.correo = perfil.correo.trim().toLowerCase();
  if (perfil.creado) doc.creado = perfil.creado;
  await fsMod.setDoc(fsMod.doc(fb.db, 'users', uid), doc, { merge: true });

  /* Copia pública: SOLO alias y correo. El teléfono y los apellidos
     nunca salen de tu documento privado. */
  if (doc.alias || doc.correo) {
    const pub = { uid, actualizado: ahora };
    if (doc.alias) pub.alias = doc.alias;
    if (doc.correo) pub.correo = doc.correo;
    await fsMod.setDoc(fsMod.doc(fb.db, 'usuarios_publicos', uid), pub, { merge: true });
  }
  return true;
}

export async function leerPerfil(uid) {
  const fsMod = await fs();
  await refrescarToken();
  const snap = await fsMod.getDoc(fsMod.doc(fb.db, 'users', uid || st.usuario.uid));
  return snap.exists() ? snap.data() : null;
}

/* ---------- calendario ---------- */

export async function leerCalendario(uid) {
  const fsMod = await fs();
  await refrescarToken();
  const snap = await fsMod.getDoc(fsMod.doc(fb.db, 'users', uid, 'calendario', 'main'));
  return snap.exists() ? snap.data() : null;
}

export async function guardarCalendario(uid, datos) {
  if (!st.usuario) throw new Error('sin-sesion');
  const fsMod = await fs();
  await refrescarToken();
  const ahora = Date.now();
  await fsMod.setDoc(fsMod.doc(fb.db, 'users', uid, 'calendario', 'main'), {
    estado: datos,
    actualizado: ahora,
    por: st.usuario.uid,
  });
  return ahora;
}

export function escucharCalendario(uid, cb) {
  dejarDeEscuchar();
  if (!st.usuario || !fb.db) return;
  const fsMod = fb.mod.fsMod;
  escucha = fsMod.onSnapshot(fsMod.doc(fb.db, 'users', uid, 'calendario', 'main'), (snap) => {
    if (snap.metadata && snap.metadata.hasPendingWrites) return;   // lo nuestro, aún en cola
    cb(snap.exists() ? snap.data() : null);
  }, (err) => {
    st.error = mensaje(err); avisar();
  });
}
export function dejarDeEscuchar() {
  if (escucha) { try { escucha(); } catch (e) { /* nada */ } escucha = null; }
}

/* ---------- compartir ---------- */

/* Busca a quién invitar por alias o por correo exacto. Solo mira la
   copia pública (alias + correo): nunca el teléfono de nadie. */
export async function buscarUsuario(texto) {
  const q = String(texto || '').trim();
  if (!q) return [];
  const fsMod = await fs();
  await refrescarToken();
  const col = fsMod.collection(fb.db, 'usuarios_publicos');
  const porCorreo = await fsMod.getDocs(fsMod.query(col, fsMod.where('correo', '==', q.toLowerCase()), fsMod.limit(5)));
  const salida = [];
  porCorreo.forEach((d) => salida.push(d.data()));
  if (!salida.length) {
    const porAlias = await fsMod.getDocs(
      fsMod.query(col, fsMod.where('alias', '>=', q), fsMod.where('alias', '<=', q + '\uf8ff'), fsMod.limit(5)));
    porAlias.forEach((d) => salida.push(d.data()));
  }
  return salida.filter((u) => u && u.uid && u.uid !== st.usuario.uid);
}

export async function invitar(destino, rol, aliasMio) {
  if (!st.usuario) throw new Error('sin-sesion');
  if (!destino || !destino.uid) throw new Error('destino-invalido');
  const fsMod = await fs();
  await refrescarToken();
  const ahora = Date.now();
  const yoSoy = st.usuario.uid;
  const datos = {
    de: yoSoy, para: destino.uid, correo: destino.correo || '',
    alias: aliasMio || st.usuario.alias || st.usuario.correo,
    rol: rol === 'editar' ? 'editar' : 'ver', desde: ahora,
  };
  /* Dos copias a propósito: el invitado lee la suya
     (compartidos/{su uid}/recibidos/{yo}) y yo veo la mía
     (users/{yo}/invitados). Las reglas lo permiten así.
     OJO con la forma de las rutas: en Firestore las colecciones van en
     posición impar y los documentos en par. 'compartidos', uid, 'recibidos',
     uid son 4 segmentos = un documento. Sin el 'recibidos' serían 3 y el
     SDK rechaza la referencia antes de salir a la red. */
  await fsMod.setDoc(fsMod.doc(fb.db, 'compartidos', destino.uid, 'recibidos', yoSoy), datos);
  await fsMod.setDoc(fsMod.doc(fb.db, 'users', yoSoy, 'invitados', destino.uid), datos);
  return datos;
}

export async function misCompartidos() {
  if (!st.usuario) return [];
  const fsMod = await fs();
  await refrescarToken();
  const snap = await fsMod.getDocs(fsMod.collection(fb.db, 'compartidos', st.usuario.uid, 'recibidos'));
  const salida = [];
  snap.forEach((d) => salida.push(d.data()));
  return salida;
}

export async function invitadosMios() {
  if (!st.usuario) return [];
  const fsMod = await fs();
  await refrescarToken();
  const snap = await fsMod.getDocs(fsMod.collection(fb.db, 'users', st.usuario.uid, 'invitados'));
  const salida = [];
  snap.forEach((d) => salida.push(d.data()));
  return salida;
}

/* Retiro una invitación que yo di: borra mi copia y la suya. */
export async function quitarInvitado(uidInvitado) {
  if (!st.usuario || !uidInvitado) throw new Error('sin-sesion');
  const fsMod = await fs();
  await refrescarToken();
  await fsMod.deleteDoc(fsMod.doc(fb.db, 'users', st.usuario.uid, 'invitados', uidInvitado));
  try { await fsMod.deleteDoc(fsMod.doc(fb.db, 'compartidos', uidInvitado, 'recibidos', st.usuario.uid)); } catch (e) { /* nada */ }
  return true;
}

/* Quitar: borra la copia del invitado y la mía. */
export async function quitarCompartido(uidDueno) {
  if (!st.usuario) throw new Error('sin-sesion');
  const fsMod = await fs();
  await refrescarToken();
  await fsMod.deleteDoc(fsMod.doc(fb.db, 'compartidos', st.usuario.uid, 'recibidos', uidDueno));
  try { await fsMod.deleteDoc(fsMod.doc(fb.db, 'users', uidDueno, 'invitados', st.usuario.uid)); } catch (e) { /* nada */ }
  return true;
}

/* ---------- contador de visitas y IP ---------- */

function visitasLocales() {
  let n = 0;
  try { n = Number(localStorage.getItem(LS_VISITAS) || 0) || 0; } catch (e) { /* nada */ }
  n += 1;
  try { localStorage.setItem(LS_VISITAS, String(n)); } catch (e) { /* nada */ }
  return n;
}

export function visitasEnEsteEquipo() {
  try { return Number(localStorage.getItem(LS_VISITAS) || 0) || 0; } catch (e) { return 0; }
}

function navegador() {
  const u = navigator.userAgent || '';
  if (/Edg\//.test(u)) return 'Edge';
  if (/OPR\//.test(u)) return 'Opera';
  if (/Chrome\//.test(u)) return 'Chrome';
  if (/Firefox\//.test(u)) return 'Firefox';
  if (/Safari\//.test(u)) return 'Safari';
  return 'Otro';
}
function sistema() {
  const u = navigator.userAgent || '';
  if (/Windows/i.test(u)) return 'Windows';
  if (/Android/i.test(u)) return 'Android';
  if (/iPhone|iPad/i.test(u)) return 'iPhone/iPad';
  if (/Macintosh/i.test(u)) return 'Mac';
  if (/Linux/i.test(u)) return 'Linux';
  return 'Otro';
}

/* Pregunta la IP a un servicio público. Es la única forma que tiene
   una web estática de conocer la IP de quien la visita: el navegador
   no se la dice al servidor de la página. */
async function pedirIP() {
  try {
    const r = await fetch('https://ipwho.is/', { cache: 'no-store' });
    const j = await r.json();
    if (j && j.success !== false && j.ip) {
      return {
        ip: j.ip, pais: j.country || '', ciudad: j.city || '',
        region: j.region || '', proveedor: (j.connection && j.connection.isp) || '',
      };
    }
  } catch (e) { /* seguimos con el plan B */ }
  try {
    const r2 = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
    const j2 = await r2.json();
    if (j2 && j2.ip) return { ip: j2.ip, pais: '', ciudad: '', region: '', proveedor: '' };
  } catch (e) { /* sin IP */ }
  return null;
}

/* Registra la visita. Una por sesión de navegador como mucho, para no
   llenar la base de datos de ruido. */
export async function registrarVisita(uid) {
  const locales = visitasLocales();
  const hoy = new Date().toISOString().slice(0, 10);
  try {
    if (sessionStorage.getItem(LS_ULTIMA) === hoy) return { enviada: false, locales };
  } catch (e) { /* nada */ }
  if (!configurado()) return { enviada: false, locales };

  const geo = await pedirIP();
  try {
    const fsMod = await fs();
    const col = fsMod.collection(fb.db, 'visitas');
    const ref = fsMod.doc(col);
    await fsMod.setDoc(ref, {
      ip: (geo && geo.ip) || '',
      pais: (geo && geo.pais) || '',
      ciudad: (geo && geo.ciudad) || '',
      region: (geo && geo.region) || '',
      proveedor: (geo && geo.proveedor) || '',
      navegador: navegador(),
      sistema: sistema(),
      idioma: navigator.language || '',
      pantalla: (window.screen ? window.screen.width + 'x' + window.screen.height : ''),
      zona: (Intl.DateTimeFormat().resolvedOptions().timeZone) || '',
      pagina: location.hash || '#/',
      uid: uid || '',
      fecha: Date.now(),
    });
    try { sessionStorage.setItem(LS_ULTIMA, hoy); } catch (e) { /* nada */ }
    return { enviada: true, locales, geo };
  } catch (e) {
    return { enviada: false, locales, error: mensaje(e) };
  }
}

export async function visitas(limite) {
  const fsMod = await fs();
  await refrescarToken();
  const col = fsMod.collection(fb.db, 'visitas');
  const snap = await fsMod.getDocs(
    fsMod.query(col, fsMod.orderBy('fecha', 'desc'), fsMod.limit(Math.max(1, Number(limite) || 40))));
  const salida = [];
  snap.forEach((d) => salida.push(d.data()));
  return salida;
}

export async function contarVisitas() {
  const fsMod = await fs();
  await refrescarToken();
  const n = await fsMod.getCountFromServer(fsMod.collection(fb.db, 'visitas'));
  return n.data().count;
}

export async function contarUsuarios() {
  const fsMod = await fs();
  await refrescarToken();
  const n = await fsMod.getCountFromServer(fsMod.collection(fb.db, 'usuarios_publicos'));
  return n.data().count;
}

/* ---------- mensajes claros ---------- */

function codigoDe(e) {
  let c = (e && e.code) || '';
  if (!c && e && e.message) {
    const m = String(e.message).match(/\((auth\/[a-z-]+)\)/i);
    if (m) c = m[1];
  }
  return c;
}

export function mensaje(e) {
  const c = codigoDe(e);
  const mapa = {
    'auth/email-already-in-use': 'Ese correo ya tiene cuenta. Usa «Entrar» en vez de «Crear cuenta».',
    'auth/invalid-email': 'El correo no tiene un formato válido.',
    'auth/weak-password': 'La contraseña necesita al menos 6 caracteres.',
    'auth/missing-password': 'Escribe la contraseña.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/invalid-login-credentials': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'Ese correo no tiene cuenta todavía: usa «Crear cuenta».',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/too-many-requests': 'Demasiados intentos seguidos. Espera un momento.',
    'auth/network-request-failed': 'Sin conexión a internet.',
    'auth/operation-not-allowed': 'Falta habilitar «Correo electrónico/contraseña» en Firebase → Authentication → Sign-in method.',
    'auth/configuration-not-found': 'Authentication todavía no está habilitada en el proyecto.',
    'auth/invalid-api-key': 'La apiKey de firebase-config.js no corresponde a este proyecto.',
    'permission-denied': 'Permiso denegado. Revisa que hayas publicado las reglas de firestore.rules en Firebase → Firestore → Reglas.',
    'unavailable': 'Firestore no responde. ¿Creaste la base de datos?',
    'failed-precondition': 'Firestore necesita un índice o no está creada todavía.',
    'not-found': 'No se encontró la base de datos de Firestore.',
  };
  if (mapa[c]) return mapa[c];
  const bruto = (e && (e.message || e.code)) || 'Error desconocido';
  if (/CONFIGURATION_NOT_FOUND/i.test(bruto)) return mapa['auth/configuration-not-found'];
  if (/Missing or insufficient permissions/i.test(bruto)) return mapa['permission-denied'];
  return bruto;
}

export async function diagnostico() {
  const e = estado();
  return {
    configurado: e.configurado,
    proyecto: e.proyecto,
    entrada: e.usuario ? (e.correo || '(sin correo)') : 'sin sesión',
    uid: e.uid,
    esAdmin: e.esAdmin,
    error: e.error,
    visitasEquipo: visitasEnEsteEquipo(),
  };
}
