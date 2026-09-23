/* ============================================================
   firebase-config.js — aquí van TUS datos de Firebase.

   Cómo conseguirlos (5 minutos):
     1. Entra en https://console.firebase.google.com y pulsa
        «Agregar proyecto» (nombre: calendario). No hace falta
        Google Analytics.
     2. En el menú lateral: Compilación → Authentication →
        «Comenzar» → pestaña «Sign-in method» → habilita
        «Correo electrónico/contraseña».
     3. Compilación → Firestore Database → «Crear base de datos»
        → modo producción → ubicación (por ejemplo nam5 o
        southamerica-east1).
     4. Rueda dentada (arriba a la izquierda) → Configuración del
        proyecto → abajo, «Tus apps» → icono </> (Web) → registra
        la app y copia el bloque `firebaseConfig` que te muestra.
     5. Pégalo abajo, sustituyendo los valores de ejemplo.
     6. Reglas: copia el archivo `firestore.rules` de este mismo
        proyecto y pégalo en Firestore → pestaña «Reglas» →
        Publicar. Ahí también pondrás tu correo de administrador.

   Mientras `apiKey` siga siendo el de ejemplo, la app funciona en
   local (sin cuentas, sin nube) y la pantalla de entrada avisa de
   que falta configurar Firebase.
   ============================================================ */

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBJLtx_tZ1JopnidvgpcbAbpQswpM8LJHo',
  authDomain: 'calendar-f671b.firebaseapp.com',
  projectId: 'calendar-f671b',
  storageBucket: 'calendar-f671b.firebasestorage.app',
  messagingSenderId: '901573738335',
  appId: '1:901573738335:web:6beb3fa188c96efee4c0ea',
};

/* ---------- panel oculto ---------- */
/* Se abre con CINCO toques seguidos en el logo de la cabecera. */
export const PANEL = {
  /* Clave que pide el panel. Cámbiala.
     Ojo: esto es una puerta discreta, no seguridad real (el código
     de una web es público). Lo que protege de verdad son las reglas
     de Firestore y la cuenta de administrador. */
  clave: '24681357',
  /* Correo de la cuenta que puede ver la lista de IPs. Tiene que ser
     EL MISMO que pongas en firestore.rules (función esAdmin). */
  adminEmail: 'leonnnc@gmail.com',
  /* Máximo de visitas que muestra la lista de IPs. */
  limite: 60,
};

/* ---------- comportamiento ---------- */
export const AJUSTES = {
  /* true  → sin cuenta no se entra al calendario (recomendado).
     false → se puede usar en local y la cuenta es opcional. */
  entradaObligatoria: true,
  /* Cada cuánto se sube el calendario a la nube tras un cambio (ms). */
  retrasoSubida: 2500,
};
