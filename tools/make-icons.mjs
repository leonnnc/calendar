/* ============================================================
   make-icons.mjs — genera los PNG de la app sin dependencias.
   Escribe PNG a mano (zlib + CRC32) dibujando el icono por
   código con supermuestreo para bordes suaves.

   Uso:  node tools/make-icons.mjs
   Salida: assets/icons/icon-512.png, icon-192.png, apple-touch-icon.png
   ============================================================ */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '..', 'assets', 'icons');

/* ---------- codificador PNG ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(w, h, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;   // profundidad
  ihdr[9] = 6;   // RGBA
  const stride = w * 4;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filtro none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- lienzo con mezcla alfa ---------- */
class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Float64Array(w * h * 4);
  }
  blend(x, y, col) {
    const a = col[3];
    if (a <= 0) return;
    const i = (y * this.w + x) * 4;
    const da = this.d[i + 3];
    const oa = a + da * (1 - a);
    if (oa <= 0) return;
    this.d[i]     = (col[0] * a + this.d[i]     * da * (1 - a)) / oa;
    this.d[i + 1] = (col[1] * a + this.d[i + 1] * da * (1 - a)) / oa;
    this.d[i + 2] = (col[2] * a + this.d[i + 2] * da * (1 - a)) / oa;
    this.d[i + 3] = oa;
  }
  shape(test, color) {
    const col = rgba(color);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (test(x + 0.5, y + 0.5)) this.blend(x, y, col);
      }
    }
  }
  /** Reduce por promedio en espacio premultiplicado. */
  down(s) {
    const w = this.w / s, h = this.h / s;
    const out = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sr = 0, sg = 0, sb = 0, sa = 0;
        for (let j = 0; j < s; j++) {
          for (let i = 0; i < s; i++) {
            const k = ((y * s + j) * this.w + (x * s + i)) * 4;
            const a = this.d[k + 3];
            sr += this.d[k] * a;
            sg += this.d[k + 1] * a;
            sb += this.d[k + 2] * a;
            sa += a;
          }
        }
        const o = (y * w + x) * 4;
        if (sa > 0) {
          out[o]     = clamp255(sr / sa);
          out[o + 1] = clamp255(sg / sa);
          out[o + 2] = clamp255(sb / sa);
        }
        out[o + 3] = clamp255((sa / (s * s)) * 255);
      }
    }
    return { w, h, data: out };
  }
}

const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));

function rgba(c) {
  if (Array.isArray(c)) return [c[0], c[1], c[2], c.length > 3 ? c[3] : 1];
  return [c >>> 16 & 255, c >>> 8 & 255, c & 255, 1];
}

/* ---------- formas ---------- */
const inRoundRect = (x0, y0, x1, y1, r) => (x, y) => {
  const nx = Math.max(x0 + r - x, 0, x - (x1 - r));
  const ny = Math.max(y0 + r - y, 0, y - (y1 - r));
  return nx * nx + ny * ny <= r * r;
};
const inCircle = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

/* ---------- dibujo del icono ---------- */
const GREEN  = [23, 81, 47];
const GREEN2 = [46, 125, 79];
const GREEN3 = [90, 168, 119];
const WHITE  = [255, 255, 255];
const AMBER  = [242, 201, 76];
const RED    = [224, 74, 63];

function drawIcon(size) {
  const SS = 4;
  const S = size * SS;
  const cv = new Canvas(S, S);
  const u = (v) => v * S; // fracción -> píxeles de trabajo

  // fondo verde a sangre (seguro para iconos maskable)
  cv.shape(() => true, GREEN);
  cv.shape(inRoundRect(u(0.02), u(0.02), u(0.98), u(0.98), u(0.16)), [30, 96, 56]);

  // hoja del calendario
  cv.shape(inRoundRect(u(0.15), u(0.21), u(0.85), u(0.80), u(0.07)), WHITE);
  // cabecera de la hoja
  cv.shape(inRoundRect(u(0.15), u(0.21), u(0.85), u(0.35), u(0.07)), GREEN2);
  // anillos
  cv.shape(inRoundRect(u(0.25), u(0.12), u(0.31), u(0.30), u(0.03)), AMBER);
  cv.shape(inRoundRect(u(0.69), u(0.12), u(0.75), u(0.30), u(0.03)), AMBER);

  // cuadrícula de días
  const cols = [0.21, 0.36, 0.51];
  const rows = [0.44, 0.58];
  const cw = 0.11, ch = 0.085;
  rows.forEach((ry) => {
    cols.forEach((cx) => {
      cv.shape(inRoundRect(u(cx), u(ry), u(cx + cw), u(ry + ch), u(0.022)), GREEN3);
    });
  });
  // día marcado
  cv.shape(inCircle(u(0.71), u(0.645), u(0.055)), RED);

  return cv.down(SS);
}

/* ---------- salida ---------- */
mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { size: 512, file: 'icon-512.png' },
  { size: 192, file: 'icon-192.png' },
  { size: 180, file: 'apple-touch-icon.png' },
];

targets.forEach((t) => {
  const { w, h, data } = drawIcon(t.size);
  const png = encodePNG(w, h, data);
  const path = resolve(OUT_DIR, t.file);
  writeFileSync(path, png);
  console.log('OK ' + t.file + '  ' + w + 'x' + h + '  ' + (png.length / 1024).toFixed(1) + ' KB');
});
