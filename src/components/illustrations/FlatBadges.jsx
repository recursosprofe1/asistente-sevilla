import React, { useId } from "react";

// ═══════════════════════════════════════════════════════════════
//  FLAT BADGES — juego sólido estilo lámina del director:
//  disco de color + glifo macizo crema + sombra larga diagonal.
//  Glifos dibujados a mano en cuadrícula 64 (centro 32,32).
// ═══════════════════════════════════════════════════════════════

export const CREAM = "#FFF6E9";
const SHADOW = "rgba(0,0,0,0.20)";

function Disc({ color, size, children }) {
  const cid = `fb${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className="flex-shrink-0" aria-hidden="true">
      <defs>
        <clipPath id={cid}><circle cx="32" cy="32" r="30" /></clipPath>
      </defs>
      <circle cx="32" cy="32" r="30" fill={color} />
      <g clipPath={`url(#${cid})`}>
        <g transform="translate(11,13)" color={SHADOW} fill="currentColor" stroke="currentColor">{children}</g>
      </g>
      <g color={CREAM} fill="currentColor" stroke="currentColor">{children}</g>
    </svg>
  );
}

// ── Glifos (usan currentColor; detalles internos en negro translúcido) ──
const D = "rgba(0,0,0,0.28)";

const GLYPHS = {
  rutas: (<><polygon points="13,45 25,25 32,36 36.5,30 51,45" /><circle cx="45" cy="20" r="4.5" /></>),
  musica: (<><ellipse cx="23" cy="46" rx="6.5" ry="5" /><ellipse cx="43" cy="43" rx="6.5" ry="5" /><rect x="27.5" y="15" width="5" height="30" rx="2.5" /><rect x="41.5" y="13" width="5" height="28" rx="2.5" /><rect x="27" y="11" width="21" height="5.5" rx="2.7" transform="rotate(-7 37 14)" /></>),
  teatro: (<><path d="M18 21h28v11c0 12-6.5 19-14 19S18 44 18 32V21z" /><circle cx="26" cy="32" r="2.4" fill={D} stroke="none" /><circle cx="38" cy="32" r="2.4" fill={D} stroke="none" /><path d="M25 40c2 2.4 4.4 3.6 7 3.6s5-1.2 7-3.6" fill="none" stroke={D} strokeWidth="3" strokeLinecap="round" /></>),
  gastro: (<><path d="M14 38a18 18 0 0 1 36 0v2H14v-2z" /><rect x="10" y="38" width="44" height="4" rx="2" /><circle cx="32" cy="15" r="2.6" /><rect x="24" y="46" width="16" height="4" rx="2" /></>),
  arte: (<><rect x="15" y="16" width="34" height="32" rx="6" /><polygon points="15,40 26,29 33,36 38,31 49,41 49,48 15,48" fill={D} stroke="none" /><circle cx="24" cy="25" r="3" fill={D} stroke="none" /></>),
  cine: (<><circle cx="32" cy="33" r="16" /><g fill={D} stroke="none"><circle cx="32" cy="22" r="3.4" /><circle cx="42" cy="27.5" r="3.4" /><circle cx="42" cy="38.5" r="3.4" /><circle cx="32" cy="44" r="3.4" /><circle cx="22" cy="38.5" r="3.4" /><circle cx="22" cy="27.5" r="3.4" /><circle cx="32" cy="33" r="4.4" /></g></>),
  varios: (<><circle cx="32" cy="32" r="15" /><circle cx="32" cy="32" r="11.5" fill={D} stroke="none" /><polygon points="37.5,24.5 34,34 29.5,37.5 33,28" fill={CREAM} stroke="none" /><circle cx="32" cy="32" r="2.4" fill={CREAM} stroke="none" /></>),
  sol: (<><circle cx="32" cy="32" r="9" /><g strokeWidth="4.5" strokeLinecap="round"><path d="M32 12v6M32 46v6M12 32h6M46 32h6M18 18l4.2 4.2M41.8 41.8L46 46M46 18l-4.2 4.2M22.2 41.8L18 46" /></g></>),
  brujula: (<><circle cx="32" cy="32" r="15" fill="none" strokeWidth="5" /><polygon points="38,24 34.5,34.5 24,38 27.5,27.5" /><circle cx="32" cy="32" r="2.6" fill={CREAM} stroke="none" /></>),
  casa: (<><polygon points="14,33 32,17 50,33 46.5,33 46.5,49 17.5,49 17.5,33" /><rect x="28" y="38" width="8" height="11" fill={D} stroke="none" /></>),
  bolsa: (<><path d="M20 24h24l-2.4 25H22.4L20 24z" /><path d="M25 24v-2a7 7 0 0 1 14 0v2" fill="none" strokeWidth="4.5" strokeLinecap="round" /></>),
  balanza: (<><rect x="30" y="12" width="4" height="34" rx="2" /><rect x="16" y="16" width="32" height="4" rx="2" /><path d="M16 20l-6 12a7 7 0 0 0 12 0l-6-12zM48 20l-6 12a7 7 0 0 0 12 0l-6-12z" /><rect x="24" y="46" width="16" height="4" rx="2" /></>),
  corazon: (<><path d="M32 50S17 40.5 17 29.5C17 23.5 21 20 25.5 20c2.8 0 5.2 1.6 6.5 4 1.3-2.4 3.7-4 6.5-4C43 20 47 23.5 47 29.5 47 40.5 32 50 32 50z" /></>),
  ojo: (<><path d="M12 32c4-7 11-11 20-11 4.5 0 8.5 1.5 12 4-4 7-11 11-20 11-4.5 0-8.5-1.5-12-4z" /><circle cx="32" cy="29" r="4.5" fill={D} stroke="none" /><rect x="12" y="28" width="42" height="6" rx="3" transform="rotate(-32 32 32)" /></>),
  sync: (<><path d="M50 32a18 18 0 0 1-31 12" fill="none" strokeWidth="6" strokeLinecap="round" /><path d="M14 32a18 18 0 0 1 31-12" fill="none" strokeWidth="6" strokeLinecap="round" /><polygon points="12,36 20,44 22,32" /><polygon points="52,28 44,20 42,32" /></>),
  papelera: (<><rect x="16" y="14" width="32" height="5" rx="2.5" /><path d="M26 14v-3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" fill="none" strokeWidth="4" /><path d="M20 19l2.5 27h19L44 19H20z" /><path d="M28 26v14M36 26v14" stroke={D} strokeWidth="3.4" strokeLinecap="round" /></>),
  check: (<><path d="M20 33.5l9 9L45 24" fill="none" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></>),
  reloj: (<><circle cx="32" cy="32" r="15" fill="none" strokeWidth="5.5" /><path d="M32 24v9l6.5 4" fill="none" strokeWidth="5" strokeLinecap="round" /><circle cx="32" cy="32" r="2.6" /></>),
  pin: (<><path d="M32 52S18 38.5 18 27a14 14 0 0 1 28 0c0 11.5-14 25-14 25z" /><circle cx="32" cy="27" r="5" fill={D} stroke="none" /></>),
  calendario: (<><rect x="16" y="18" width="32" height="30" rx="6" /><rect x="16" y="18" width="32" height="9" rx="4" fill={D} stroke="none" /><rect x="23" y="12" width="4.5" height="10" rx="2.2" /><rect x="36.5" y="12" width="4.5" height="10" rx="2.2" /></>),
  externo: (<><path d="M36 14h14v14" fill="none" strokeWidth="5" strokeLinecap="round" /><path d="M48 14L28 34" fill="none" strokeWidth="5" strokeLinecap="round" /><path d="M44 30v14a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V22a2 2 0 0 1 2-2h12" fill="none" strokeWidth="5" strokeLinecap="round" /></>),
  spark: (<><polygon points="32,13 35.5,28.5 51,32 35.5,35.5 32,51 28.5,35.5 13,32 28.5,28.5" /><polygon points="47,42 48.4,46.6 53,48 48.4,49.4 47,54 45.6,49.4 41,48 45.6,46.6" /></>),
  chevronDown: (<><path d="M20 27l12 12 12-12" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></>),
  chevronUp: (<><path d="M20 37l12-12 12 12" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></>),
  restaurar: (<><path d="M15 30a17 17 0 1 1-4 11" fill="none" strokeWidth="6" strokeLinecap="round" /><polygon points="8,24 22,26 16,38" /></>),
  plus: (<><rect x="28" y="16" width="8" height="32" rx="4" /><rect x="16" y="28" width="32" height="8" rx="4" /></>),
  archivo: (<><rect x="15" y="18" width="34" height="30" rx="5" /><rect x="15" y="28" width="34" height="4" fill={D} stroke="none" /><rect x="28" y="36" width="8" height="4" rx="2" fill={D} stroke="none" /></>),
  lupa: (<><circle cx="29" cy="29" r="12" fill="none" strokeWidth="6" /><rect x="37" y="37" width="14" height="6" rx="3" transform="rotate(45 44 40)" /></>),
  x: (<><rect x="18" y="29" width="28" height="6" rx="3" transform="rotate(45 32 32)" /><rect x="18" y="29" width="28" height="6" rx="3" transform="rotate(-45 32 32)" /></>),
  hoja: (<><path d="M32 50C20 42 16 30 18 16c14-2 26 2 30 16 3 10-4 20-16 18z" /><path d="M24 44C28 36 34 30 42 26" fill="none" stroke={D} strokeWidth="3" strokeLinecap="round" /></>),
  escudo: (<><path d="M32 13l15 6v12c0 11-6.5 18-15 21-8.5-3-15-10-15-21V19l15-6z" /><path d="M26 32l4.5 4.5L39 27" fill="none" stroke={D} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></>),
  gota: (<><path d="M32 13s13 15 13 26a13 13 0 0 1-26 0c0-11 13-26 13-26z" /></>),
  fuego: (<><path d="M32 13c3 7 10 11 10 20a10 10 0 0 1-20 0c0-4 2-7 4-9 .5 2.5 2 4 4 5-.5-6 0-11 2-16z" /></>),
  cama: (<><rect x="13" y="30" width="38" height="12" rx="4" /><rect x="13" y="20" width="6" height="22" rx="3" /><rect x="17" y="27" width="10" height="7" rx="3" fill={D} stroke="none" /><rect x="15" y="42" width="4" height="8" rx="2" /><rect x="45" y="42" width="4" height="8" rx="2" /></>),
  cruz: (<><rect x="16" y="16" width="32" height="32" rx="9" /><rect x="29" y="24" width="6" height="16" rx="3" fill={D} stroke="none" /><rect x="24" y="29" width="16" height="6" rx="3" fill={D} stroke="none" /></>),
  capas: (<><polygon points="32,15 49,24 32,33 15,24" /><polygon points="32,27 49,36 32,45 15,36" opacity="0.75" /><polygon points="32,39 49,48 32,55 15,48" opacity="0.5" /></>),
  doc: (<><path d="M20 14h16l8 8v26H20V14z" /><polygon points="36,14 44,22 36,22" fill={D} stroke="none" /><path d="M25 32h14M25 38h14M25 44h9" stroke={D} strokeWidth="3" strokeLinecap="round" /></>),
  brillo: (<><polygon points="32,14 35,29 50,32 35,35 32,50 29,35 14,32 29,29" /><polygon points="47,44 48.2,48.8 53,50 48.2,51.2 47,56 45.8,51.2 41,50 45.8,48.8" /></>),
  viento: (<><path d="M12 26h24a6 6 0 1 0-6-6" fill="none" strokeWidth="5" strokeLinecap="round" /><path d="M12 34h32a6 6 0 1 1-6 6" fill="none" strokeWidth="5" strokeLinecap="round" /><path d="M12 42h16" fill="none" strokeWidth="5" strokeLinecap="round" /></>),
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
  hoy: { glyph: "sol", color: "#F5A623" },
  planes: { glyph: "brujula", color: "#0B3B42" },
  casa: { glyph: "casa", color: "#3A9E70" },
  compras: { glyph: "bolsa", color: "#E07040" },
  decisiones: { glyph: "balanza", color: "#4A6FCC" },
};

/** Insignia completa: disco + sombra larga + glifo macizo. */
export function FBadge({ name, color = "#12A5B5", size = 52 }) {
  const glyph = GLYPHS[name] || GLYPHS.varios;
  return (
    <Disc color={color} size={size}>
      {glyph}
    </Disc>
  );
}

/** Insignia de categoría (color propio). */
export function CategoryBadge({ category, size = 52 }) {
  return <FBadge name={CATEGORY_GLYPH[category] || "varios"} color={CATEGORY_COLORS[category] || "#12A5B5"} size={size} />;
}

/** Insignia de pestaña de navegación. */
export function NavBadge({ tab, size = 44 }) {
  const s = NAV_STYLE[tab] || NAV_STYLE.planes;
  return <FBadge name={s.glyph} color={s.color} size={size} />;
}

/** Glifo suelto (sin disco) para interiores de botones ya coloreados. */
export function FGlyph({ name, size = 16, color = "#FFFFFF" }) {
  const glyph = GLYPHS[name] || GLYPHS.varios;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className="flex-shrink-0" aria-hidden="true" color={color} fill="currentColor" stroke="currentColor">
      {glyph}
    </svg>
  );
}

export default FBadge;
