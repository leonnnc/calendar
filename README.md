# Calendario — planificador de borrado en seco

App de calendario mensual con **tipografía manuscrita**, **stickers ilustrados** y
**buscador de iconos**, inspirada en los calendarios magnéticos de pared.
Funciona en macOS y Windows como **PWA instalable** y guarda todo **en tu equipo**
(no hay servidor, no hay cuentas, no se envía nada a internet).

```
index.html               · la app completa (armazón de la interfaz)
manifest.webmanifest     · datos de instalación (PWA)
sw.js                    · service worker: funciona sin conexión
firestore.rules          · reglas de seguridad de la base de datos (¡publicar!)
css/app.css              · todos los estilos, incluido el modo impresión
js/app.js                · lógica: mes, días, listas, dibujo, cuentas y datos
js/firebase.js           · cuentas, nube, visitas y calendarios compartidos
js/firebase-config.js    · TUS datos de Firebase (lo único que hay que rellenar)
js/stickers.js           · set propio de stickers ilustrados (SVG)
js/emoji.js              · catálogo de emoji con nombres en español
assets/fonts/            · 6 tipografías manuscritas autoalojadas (.woff2)
assets/icons/            · favicon e iconos de la app
tools/fetch-fonts.mjs    · descarga/recorta las fuentes (solo si hace falta)
tools/make-icons.mjs     · genera los iconos PNG sin dependencias
tools/test-app.mjs       · pruebas automáticas de conformidad
```

## Cómo usarla

**En el ordenador (recomendado).** Desde esta carpeta:
```bash
python -m http.server 8777 --bind 127.0.0.1
```
Abre <http://127.0.0.1:8777/> en Chrome, Edge o Safari. Aparecerá el botón
**Instalar app** en la barra superior: al pulsarlo se instala como aplicación
de escritorio, con su icono y ventana propia, y ya funciona sin conexión.

> Hace falta servirlo por `http://` (no abrir el archivo con doble clic): el
> service worker y la instalación lo requieren. Cualquier servidor estático vale.

## Poner en marcha la base de datos (una sola vez)

Mientras no hagas esto, la app funciona igual pero **en local**: sin cuentas,
sin nube y sin compartir. La pantalla de entrada lo avisa.

1. Crea el proyecto en <https://console.firebase.google.com> (sin necesidad de
   Google Analytics).
2. **Authentication** → Comenzar → *Sign-in method* → habilita
   **Correo electrónico/contraseña**.
3. **Firestore Database** → Crear base de datos → modo **producción**.
4. Rueda dentada → *Configuración del proyecto* → **Tus apps** → `</>` (Web) →
   registra la app y copia el bloque `firebaseConfig`.
5. Pega ese bloque en [js/firebase-config.js](js/firebase-config.js) (arriba del
   todo) y cambia también `PANEL.clave` y `PANEL.adminEmail`.
6. Copia [firestore.rules](firestore.rules), pégalo en **Firestore → Reglas** y
   pulsa **Publicar** (cambia antes `tu-correo@ejemplo.com` por tu correo).
7. Recarga la app y crea tu cuenta. Si algo falla, el mensaje de la pantalla de
   entrada dice exactamente qué falta (casi siempre, habilitar Authentication
   o publicar las reglas).

## Cuentas: entrada, nube y compartir

La app abre con una **pantalla de entrada** minimalista (misma tipografía y
misma paleta que el calendario) con dos pestañas:

- **Crear cuenta:** alias, nombres, apellidos, correo, teléfono y contraseña.
- **Entrar:** correo y contraseña, con «Olvidé la contraseña».

La contraseña **la gestiona Firebase**: la app no la guarda en ningún sitio
(ni en el equipo ni en la base de datos). Del perfil se guardan dos copias
distintas, a propósito:

| Documento | Qué tiene | Quién lo ve |
|---|---|---|
| `users/{uid}` | alias, nombres, apellidos, correo, **teléfono** | solo tú |
| `usuarios_publicos/{uid}` | **solo** alias y correo | cualquiera con sesión |

Así tus apellidos y tu teléfono no quedan visibles para nadie. Con sesión
iniciada, tu calendario se guarda en tu cuenta y se sincroniza solo (con
escucha en tiempo real, para verlo igual en dos equipos).

**Compartir.** En **Datos → Compartir mi calendario con…** se escribe el alias
o el correo exacto de otra persona registrada y se elige el permiso:

- **Solo ver** → la abre en modo solo lectura (la interfaz lo bloquea y, sobre
  todo, lo impiden las reglas de Firestore).
- **Puede editar** → puede añadir días, iconos y notas en tu calendario.

En **Compartidos conmigo** aparece lo que te han compartido, con un botón
**Abrir** (y un aviso en la parte superior para volver a tu calendario) y otro
para quitarlo.

## Panel oculto

Dale **cinco toques seguidos al logotipo** de la cabecera (dentro de 2,5
segundos): se abre un panel que pide una clave y muestra

- el **contador de visitas** registradas,
- las **visitas de este equipo**,
- los **usuarios registrados**,
- y la **lista de IPs** con lugar, navegador y fecha, descargable en `.csv`.

Dos cosas importantes y honestas:

1. La clave del panel está en `js/firebase-config.js` y **se ve en el código**:
   es una puerta discreta, no seguridad. Lo que protege de verdad son las
   reglas de Firestore y la cuenta de administrador (`PANEL.adminEmail`), que
   es la única que puede leer la lista de IPs.
2. Para conocer la IP de quien visita una web estática hay que preguntársela a
   un servicio externo: la app usa `ipwho.is` (con `api.ipify.org` de
   respaldo). Eso significa que **la IP de tus visitantes pasa por ese
   servicio**. Una IP es un dato personal: avísalo en tu web y úsala solo para
   lo que hayas contado.

## Qué hace

**La hoja del mes.** Cabecera `Month:` (script) + `GOALS` en rojo, tira de días
`SUNDAY…SATURDAY`, cuadrícula, zona `NOTES` y cierre `Have A Good Day!`. La
cabecera y el pie aceptan un adorno: haz clic en el hueco del adorno para
elegirlo del buscador.

**Cada día.** Clic en la celda (o en el `+`) abre el panel del día:
- escribe texto y pulsa Enter para añadir líneas;
- el botón ☺ abre el buscador para pegar un icono;
- **✏️ Dibujar** activa el trazo a mano alzada: aparece una barra con el color
  del rotulador, «Borrar trazo» y «Listo»;
- **Vaciar día** borra el día completo.

**Iconos sueltos: arrastrar, colocar y animar.** Además de pegar un icono en una
línea, puedes convertirlo en un imán que se queda donde lo sueltes:

- **arrastrar hasta una fecha**: en el buscador, mantén pulsado un icono y
  llévalo hasta una casilla (el buscador se aparta solo y la casilla se resalta
  en verde); al soltarlo queda colocado justo en ese punto del día;
- **mover**: arrastra el icono dentro de la casilla o hasta **otro día**;
  también con las flechas del teclado (`Shift` para pasos largos) y el botón
  **Centrar**;
- **agrandar y reducir**: tira del **pico** de la esquina, usa la **rueda del
  ratón** encima del icono, los botones **−** / **+** (del 50 % al 350 %) o las
  teclas `+` / `-`;
- **girar**: botones **⟲** / **⟳** (15° por pulsación);
- **movimiento**: el desplegable de la barra ofrece *Flotar*, *Latir*, *Vaivén*,
  *Botar*, *Girar* y *Zigzag*. Se respeta la preferencia del sistema
  «reducir movimiento»;
- **quitar**: botón **Quitar**, la tecla `Supr`, o arrastrarlo fuera de cualquier
  casilla (vuelve a su sitio).

Cada icono guarda su posición, tamaño, giro y movimiento, así que se ve igual al
volver a abrir la app.

**Listas.** `To do list` y `Grocery` a la derecha, con casilla que marca con un
check verde y tacha el texto. Grocery admite cantidad (`×`). Cada línea puede
llevar su icono (el botón ☺ junto al campo de añadir).

**Buscador de iconos.** Un solo panel con:
- **Recientes**, **Todo** y una pestaña por categoría (Fiesta, Comida, Mascotas,
  Naturaleza, Deporte, Casa, Estudio, Compras, Viaje, Ánimo);
- búsqueda por nombre y palabras clave, **sin distinguir mayúsculas ni acentos**
  («arbol» encuentra «Árbol», «cumpleanos» encuentra «Torta de cumpleaños»);
- admite frases de varias palabras;
- Enter elige el primer resultado;
- un icono se puede **pulsar** (se pega en el día, como antes) o **arrastrar
  hasta una fecha** (queda suelto, para moverlo y agrandarlo).

El catálogo mezcla dos familias: **74 stickers ilustrados** dibujados en SVG
(acuarela, mismo aspecto en Windows y macOS) y **429 emoji del sistema**, en 10
categorías cada una: **503 iconos** en total.

**Datos.** El botón **Datos** permite exportar/importar una copia `.json`,
exportar el mes a `.ics` (para Google Calendar, Outlook, Apple Calendario) o a
`.md`, elegir el **color del rotulador**, poner el **lunes como primer día** y
borrar todo. También indica cuánto ocupa.

**Imprimir.** Genera una hoja A4 horizontal solo con el calendario, sin la
interfaz, lista para imprimir o guardar en PDF.

## Atajos

| Tecla | Acción |
|---|---|
| `←` / `→` | mes anterior / siguiente |
| `Enter` | en el buscador: elige el primer resultado |
| `Enter` | en una línea: guarda |
| `Esc` | cierra buscador, panel o modo dibujo; quita la selección de un icono |
| `←` `→` `↑` `↓` | con un icono elegido: lo mueve (con `Shift`, pasos de 5 %) |
| `+` / `-` | con un icono elegido: lo agranda o lo reduce |
| `0` | con un icono elegido: lo vuelve a centrar en el día |
| `Supr` | con un icono elegido: lo quita |

## Comprobar que todo está bien

```bash
node tools/test-app.mjs
```
Son **172 comprobaciones**: el catálogo de iconos y sus SVG, el buscador, que
todos los `id` y clases que usa el JavaScript existan en el HTML y el CSS, que
cada movimiento tenga sus `@keyframes`, el manifiesto, el service worker, las
fuentes, la sintaxis del módulo principal, y que las piezas de cuentas, panel y
compartir estén todas (incluida la de que **la contraseña no se guarda nunca**).
No necesita navegador.

Si tocas cualquier archivo de la app, sube `VERSION` en `sw.js`
(`calendario-v5` → `calendario-v6`): así los navegadores que ya la visitaron
descartan la copia antigua en caché. La excepción es
`js/firebase-config.js`, que el service worker sirve siempre fresco a propósito:
si se cacheara, pegar tus datos de Firebase no surtiría efecto y parecería roto.

## Detalles técnicos

- HTML, CSS y JavaScript sin dependencias ni paso de compilación.
- Persistencia en `localStorage` (clave `calendario-borrado-v1`), con guardado
  diferido de 180 ms.
- Fuentes manuscritas autoalojadas (238 KB, subconjunto `latin`, que cubre
  acentos, `ñ` y `¿¡`) para que se vean idénticas sin conexión y en ambos
  sistemas: Caveat, Dancing Script, Gochi Hand, Kalam, Patrick Hand y
  Shadows Into Light. El selector **Letra** cambia la tipografía de escritura;
  la script de la cabecera se mantiene.
- El dibujo a mano se guarda como PNG por día dentro del propio almacén local.
- Cada icono colocado se guarda con su posición en porcentaje de la casilla (no
  en píxeles, así el mes se adapta al tamaño de la pantalla), su escala, su giro
  y su movimiento. El arrastre usa Pointer Events, de modo que funciona igual con
  ratón, dedo o lápiz.
- Con cuentas, cada persona tiene **su propio cajón** en el equipo: la clave del
  almacén local es `calendario-borrado-v1:<uid>` (`…:local` para quien usa la app
  sin cuenta). Al entrar con tu cuenta se carga el cajón de tu uid y se
  sincroniza con `users/{uid}/calendario/main`.
- Si los dos lados (nube y equipo) tienen contenido, la app **pregunta** cuál
  conservar y guarda el otro como copia: nunca pisa un calendario en silencio.
- El SDK de Firebase no se carga hasta que hace falta y solo si hay
  configuración: sin `apiKey` no se pide nada a la red (ni las IPs).
- Los iconos `assets/icons/*.png` se generan por código con
  `node tools/make-icons.mjs` (codificador PNG propio, sin dependencias).
