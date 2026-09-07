// Generador del icono de Android (launcher). Herramienta de dev (npm run gen:icono):
// NO se empaqueta en la app. Dibuja las máscaras Noto (🎭) como protagonista
// + guitarra (🎸) en mini-esfera, respeta la zona segura del icono adaptativo
// (66 %) y escribe todos los mipmaps + el fondo teal de values.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Resvg } = require('@resvg/resvg-js');

const TEAL = '#0E7E8C';
const NOTO = 'src/components/illustrations/noto';

const renderGlyphPng = (file, px) => {
  const svg = readFileSync(`${NOTO}/${file}.svg`, 'utf8');
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: px } });
  return r.render().asPng().toString('base64');
};

// Composición sobre lienzo S x S. `bg` puede ser 'transparent' | 'square' | 'circle'.
// Zona segura del adaptativo: círculo central de radio 0.33*S.
function compose({ size, bg, maskPct, guitarPct, offsetPct, glyphPct }) {
  const S = size;
  const maskPx = Math.round(S * maskPct);
  const gDisc = Math.round(S * guitarPct);
  const off = Math.round(S * offsetPct);
  const maskB64 = renderGlyphPng('1f3ad', maskPx);
  const guitarB64 = renderGlyphPng('1f3b8', Math.round(gDisc * 0.62));
  const cx = S / 2; const cy = S / 2;
  // La máscara sube un pelín para ceder la esquina inferior-derecha a la guitarra:
  const maskX = cx - maskPx / 2 - Math.round(S * 0.04);
  const maskY = cy - maskPx / 2 - Math.round(S * (glyphPct ?? 0.04));
  const gX = cx + off - gDisc / 2 + Math.round(S * 0.08);
  const gY = cy + off - gDisc / 2 + Math.round(S * 0.08);
  const bgShape =
    bg === 'square' ? `<rect width="${S}" height="${S}" fill="${TEAL}"/>`
    : bg === 'circle' ? `<circle cx="${cx}" cy="${cy}" r="${cx}" fill="${TEAL}"/>`
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  ${bgShape}
  <image href="data:image/png;base64,${maskB64}" x="${maskX}" y="${maskY}" width="${maskPx}" height="${maskPx}"/>
  <circle cx="${gX + gDisc / 2}" cy="${gY + gDisc / 2}" r="${Math.round(gDisc / 2)}" fill="#ffffff"/>
  <image href="data:image/png;base64,${guitarB64}" x="${gX + Math.round(gDisc * 0.19)}" y="${gY + Math.round(gDisc * 0.19)}" width="${Math.round(gDisc * 0.62)}" height="${Math.round(gDisc * 0.62)}"/>
</svg>`;
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: S } });
  return r.render().asPng();
}

const RES = 'android/app/src/main/res';
const buckets = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
// Foreground adaptativo: lienzo 108dp por bucket.
const fgSizes = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

let n = 0;
for (const [dpi, legacy] of Object.entries(buckets)) {
  const dir = `${RES}/mipmap-${dpi}`;
  mkdirSync(dir, { recursive: true });
  // Legacy: fondo teal completo (cuadrado y redondo).
  writeFileSync(`${dir}/ic_launcher.png`, compose({ size: legacy, bg: 'square', maskPct: 0.8, guitarPct: 0.34, offsetPct: 0.14 }));
  writeFileSync(`${dir}/ic_launcher_round.png`, compose({ size: legacy, bg: 'circle', maskPct: 0.74, guitarPct: 0.32, offsetPct: 0.13 }));
  // Foreground adaptativo: transparente, dentro del círculo seguro (66 %).
  writeFileSync(`${dir}/ic_launcher_foreground.png`, compose({ size: fgSizes[dpi], bg: 'transparent', maskPct: 0.44, guitarPct: 0.185, offsetPct: 0.05, glyphPct: 0.035 }));
  n += 3;
  console.log(`${dpi}: legacy ${legacy}px + fg ${fgSizes[dpi]}px`);
}
console.log(`Escritos ${n} PNG. Ahora el fondo adaptativo -> ${TEAL}`);
