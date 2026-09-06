import React from "react";

// ═══════════════════════════════════════════════════════════════
//  NOTO BADGES — set B (Noto Emoji, Google, Apache 2.0) montado en
//  nuestros discos de color. Misma API que el juego anterior para
//  no tocar las pantallas (solo cambia este import).
//  Crédito legal en Diagnóstico + NOTICE en la raíz.
// ═══════════════════════════════════════════════════════════════

const mods = import.meta.glob('./noto/*.svg', { eager: true, query: '?url', import: 'default' });
const URLS = Object.fromEntries(
  Object.entries(mods).map(([p, u]) => [p.split('/').pop().replace('.svg', ''), u])
);

// nombre interno -> { code, color por defecto }
const MAP = {
  rutas:      { code: '26f0', color: '#3A9E70' },
  musica:     { code: '1f3b8', color: '#9C6FDE' },
  teatro:     { code: '1f3ad', color: '#E8644A' },
  gastro:     { code: '1f374', color: '#E07040' },
  arte:       { code: '1f3a8', color: '#D4860A' },
  cine:       { code: '1f3ac', color: '#4A6FCC' },
  varios:     { code: '1f9ed', color: '#12A5B5' },
  sol:        { code: '2600', color: '#F5A623' },
  brujula:    { code: '1f9ed', color: '#0B3B42' },
  casa:       { code: '1f3e0', color: '#3A9E70' },
  bolsa:      { code: '1f45c', color: '#E07040' },
  balanza:    { code: '2696', color: '#4A6FCC' },
  corazon:    { code: '2764', color: '#E5484D' },
  ojo:        { code: '1f441', color: '#5E8B91' },
  sync:       { code: '1f501', color: '#0E7E8C' },
  papelera:   { code: '1f5d1', color: '#64748B' },
  check:      { code: '2714', color: '#3A9E70' },
  reloj:      { code: '23f0', color: '#0E7E8C' },
  pin:        { code: '1f4cd', color: '#0E7E8C' },
  calendario: { code: '1f5d3', color: '#0E7E8C' },
  externo:    { code: '1f517', color: '#0E7E8C' },
  spark:      { code: '2728', color: '#0E7E8C' },
  chevronDown:{ code: '1f53d', color: '#5E8B91' },
  chevronUp:  { code: '1f53c', color: '#5E8B91' },
  restaurar:  { code: '1f519', color: '#0E7E8C' },
  plus:       { code: '2795', color: '#0E7E8C' },
  archivo:    { code: '1f5c4', color: '#4A6FCC' },
  lupa:       { code: '1f50d', color: '#5E8B91' },
  x:          { code: '2716', color: '#5E8B91' },
  hoja:       { code: '1f33f', color: '#3A9E70' },
  escudo:     { code: '1f6e1', color: '#D4860A' },
  gota:       { code: '1f32c', color: '#0E7E8C' },
  brillo:     { code: '2728', color: '#0E7E8C' },
  fuego:      { code: '1f525', color: '#E8644A' },
  cama:       { code: '1f6cf', color: '#4A6FCC' },
  cruz:       { code: '2795', color: '#3A9E70' },
  capas:      { code: '1fa9f', color: '#0E7E8C' },
  doc:        { code: '1f4c4', color: '#5E8B91' },
  viento:     { code: '1f32c', color: '#0E7E8C' },
};

export const CATEGORY_COLORS = {
  "Rutas y naturaleza": "#3A9E70",
  "Música": "#9C6FDE",
  "Teatro y espectáculos": "#E8644A",
  "Gastronomía": "#E07040",
  "Arte": "#D4860A",
  "Cine": "#4A6FCC",
  "Varios": "#12A5B5",
};

const CATEGORY_GLYPH = {
  "Rutas y naturaleza": "rutas",
  "Música": "musica",
  "Teatro y espectáculos": "teatro",
  "Gastronomía": "gastro",
  "Arte": "arte",
  "Cine": "cine",
  "Varios": "varios",
};

const NAV_STYLE = {
  hoy: 'sol',
  planes: 'brujula',
  casa: 'casa',
  compras: 'bolsa',
  decisiones: 'balanza',
  cine: 'cine',
  comer: 'gastro',
};

const NAV_COLOR = {
  hoy: "#F5A623",
  planes: "#0B3B42",
  casa: "#3A9E70",
  compras: "#E07040",
  decisiones: "#4A6FCC",
  cine: "#4A6FCC",
  comer: "#E07040",
};

function Disc({ color, size, children }) {
  const s = Number(size) || 52;
  return (
    <span
      className="flex-shrink-0 inline-flex items-center justify-center rounded-full overflow-hidden"
      style={{ width: s, height: s, background: color, boxShadow: '0 8px 16px -8px rgba(11,59,66,0.35)' }}
    >
      {children}
    </span>
  );
}

/** Insignia completa: disco de color + glifo Noto. */
export function FBadge({ name, color, size = 52 }) {
  const m = MAP[name] || MAP.varios;
  const s = Number(size) || 52;
  const glyph = Math.round(s * 0.68);
  // Añadir a Hoy: calendario con mini "más" encima.
  if (name === 'calendario-add') {
    return (
      <span className="flex-shrink-0 inline-block relative" style={{ width: s, height: s }}>
        <Disc color={color || '#0E7E8C'} size={s}>
          <img src={URLS['1f5d3']} alt="" width={glyph} height={glyph} draggable={false} />
        </Disc>
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center"
          style={{ width: Math.round(s * 0.42), height: Math.round(s * 0.42), background: '#0B3B42', border: '2px solid #fff' }}>
          <img src={URLS['2795']} alt="" width={Math.round(s * 0.24)} height={Math.round(s * 0.24)} draggable={false} style={{ filter: 'brightness(0) invert(1)' }} />
        </span>
      </span>
    );
  }
  return (
    <Disc color={color || m.color} size={s}>
      <img src={URLS[m.code]} alt="" width={glyph} height={glyph} draggable={false} />
    </Disc>
  );
}

/** Insignia de categoría (color propio). */
export function CategoryBadge({ category, size = 52 }) {
  const key = CATEGORY_GLYPH[category] || 'varios';
  const m = MAP[key];
  return <FBadge name={key} color={m.color} size={size} />;
}

/** Insignia de pestaña de navegación. */
export function NavBadge({ tab, size = 44 }) {
  const key = NAV_STYLE[tab] || 'brujula';
  return <FBadge name={key} color={NAV_COLOR[tab] || '#0E7E8C'} size={size} />;
}

/** Glifo suelto (sin disco) para interiores ya coloreados. */
export function FGlyph({ name, size = 16, color }) {
  void color;
  const m = MAP[name] || MAP.varios;
  const s = Number(size) || 16;
  return <img src={URLS[m.code]} alt="" width={s} height={s} className="flex-shrink-0" draggable={false} />;
}

export default FBadge;
