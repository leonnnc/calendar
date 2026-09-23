# Calendario — planificador de borrado en seco

App de calendario mensual con **tipografía manuscrita**, **stickers ilustrados** y
**buscador de iconos**, inspirada en los calendarios magnéticos de pared.
Funciona en macOS y Windows como **PWA instalable** y guarda todo **en tu equipo**
(no hay servidor, no hay cuentas, no se envía nada a internet).

```
index.html               · la app completa (armazón de la interfaz)
manifest.webmanifest     · datos de instalación (PWA)
sw.js                    · service worker: funciona sin conexión
css/app.css              · todos los estilos, incluido el modo impresión
js/app.js                · lógica: mes, días, listas, dibujo, datos
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

**Listas.** `To do list` y `Grocery` a la derecha, con casilla que marca con un
check verde y tacha el texto. Grocery admite cantidad (`×`). Cada línea puede
llevar su icono (el botón ☺ junto al campo de añadir).

**Buscador de iconos.** Un solo panel con:
- **Recientes**, **Todo** y una pestaña por categoría (Fiesta, Comida, Mascotas,
  Naturaleza, Deporte, Casa, Estudio, Compras, Viaje, Ánimo);
- búsqueda por nombre y palabras clave, **sin distinguir mayúsculas ni acentos**
  («arbol» encuentra «Árbol», «cumpleanos» encuentra «Torta de cumpleaños»);
- admite frases de varias palabras;
- Enter elige el primer resultado.

El catálogo mezcla dos familias: **stickers ilustrados** dibujados en SVG
(acuarela, mismo aspecto en Windows y macOS) y los **emoji del sistema**.

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
| `Esc` | cierra buscador, panel o modo dibujo |

## Comprobar que todo está bien

```bash
node tools/test-app.mjs
```
Valida el catálogo de iconos y sus SVG, el buscador, que todos los `id` y clases
que usa el JavaScript existan en el HTML y el CSS, el manifiesto, el service
worker, las fuentes y la sintaxis del módulo principal. No necesita navegador.

Si tocas cualquier archivo de la app, sube `VERSION` en `sw.js`
(`calendario-v2` → `calendario-v3`): así los navegadores que ya la visitaron
descartan la copia antigua en caché.

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
- Los iconos `assets/icons/*.png` se generan por código con
  `node tools/make-icons.mjs` (codificador PNG propio, sin dependencias).
