// Descarga los woff2 de Google Fonts (subsets latin / latin-ext) y arma assets/fonts/fonts.css
// Uso:  node tools/fetch-fonts.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'assets', 'fonts');
const css = fs.readFileSync(path.join(dir, 'google.css'), 'utf8');

const parts = css.split(/\/\*\s*([a-z0-9-]+)\s*\*\//i).slice(1);
const out = [];
const byUrl = new Map(); // una fuente variable sirve el mismo binario para 400 y 700
let n = 0;
let bytes = 0;

for (let i = 0; i < parts.length; i += 2) {
  const subset = parts[i].trim();
  const block = parts[i + 1] || '';
  // Solo 'latin': cubre acentos, ñ y ¿¡ del español. 'latin-ext' duplicaría el peso sin aportar.
  if (subset !== 'latin') continue;

  const fam = /font-family:\s*'([^']+)'/.exec(block)?.[1];
  const weight = /font-weight:\s*([^;]+);/.exec(block)?.[1]?.trim();
  const style = /font-style:\s*([^;]+);/.exec(block)?.[1]?.trim();
  const url = /url\((https:[^)]+)\)/.exec(block)?.[1];
  const range = /unicode-range:\s*([^;]+);/.exec(block)?.[1]?.trim();
  if (!fam || !url) continue;

  let fname;
  if (byUrl.has(url)) {
    fname = byUrl.get(url);
  } else {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('FALLO', url, res.status);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fname = `${fam.replace(/\s+/g, '-').toLowerCase()}-${style}-${weight.replace(/\s+/g, '_')}-${subset}.woff2`;
    fs.writeFileSync(path.join(dir, fname), buf);
    byUrl.set(url, fname);
    bytes += buf.length;
    n++;
  }
  out.push(
    `@font-face{font-family:'${fam}';font-style:${style};font-weight:${weight};font-display:swap;` +
      `src:url('./${fname}') format('woff2');unicode-range:${range};}`
  );
}

fs.writeFileSync(path.join(dir, 'fonts.css'), out.join('\n') + '\n');
console.log(`OK: ${n} archivos woff2, ${(bytes / 1024).toFixed(1)} KB -> assets/fonts/fonts.css`);
