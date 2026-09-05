import React, { useId } from "react";

// ═══════════════════════════════════════════════════════════════
//  CONN ICONS — juego propio dibujado a mano (trazo fino redondeado)

function Base({ children, className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function ConnRutas({ className }) {
  return (
    <Base className={className}>
      <circle cx="17.5" cy="6" r="2" />
      <path d="M3 19l6-9 4 5.5L15.5 12 21 19H3z" />
    </Base>
  );
}

export function ConnMusica({ className }) {
  return (
    <Base className={className}>
      <path d="M9.5 17.5V6l10-2v11" />
      <circle cx="6.5" cy="17.5" r="3" />
      <circle cx="16.5" cy="15" r="3" />
    </Base>
  );
}

export function ConnTeatro({ className }) {
  return (
    <Base className={className}>
      <path d="M4 5.5h16V12c0 4.5-3.6 7.5-8 7.5S4 16.5 4 12V5.5z" />
      <circle cx="9" cy="10.5" r="0.6" fill="currentColor" />
      <circle cx="15" cy="10.5" r="0.6" fill="currentColor" />
      <path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" />
    </Base>
  );
}

export function ConnGastro({ className }) {
  return (
    <Base className={className}>
      <path d="M4 16.5a8 8 0 0 1 16 0" />
      <path d="M2.5 16.5h19" />
      <circle cx="12" cy="6" r="1" />
      <path d="M12 7v1.5" />
      <path d="M9 20h6" />
    </Base>
  );
}

export function ConnArte({ className }) {
  return (
    <Base className={className}>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M4 16.5l5-4.5 3.5 3 3-2.5 4.5 3.5" />
    </Base>
  );
}

export function ConnCine({ className }) {
  return (
    <Base className={className}>
      <path d="M9.5 8L6.5 3.5M14.5 8l3-4.5" />
      <rect x="3" y="8" width="18" height="11" rx="3" />
      <path d="M10.5 11.5l4.5 2.5-4.5 2.5v-5z" fill="currentColor" stroke="none" />
      <path d="M7 19.5l-1 2M17 19.5l1 2" />
    </Base>
  );
}

export function ConnBrujula({ className }) {
  return (
    <Base className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.5 8.5l-2.2 5.8-5.8 2.2 2.2-5.8 5.8-2.2z" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </Base>
  );
}

export function ConnSol({ className }) {
  return (
    <Base className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5 5l1.8 1.8M17.2 17.2L19 19M19 5l-1.8 1.8M6.8 17.2L5 19" />
    </Base>
  );
}

export function ConnCasa({ className }) {
  return (
    <Base className={className}>
      <path d="M4 12l8-7 8 7" />
      <path d="M6 10.5V20h12v-9.5" />
      <path d="M10.5 20v-5h3v5" />
    </Base>
  );
}

export function ConnBolsa({ className }) {
  return (
    <Base className={className}>
      <path d="M6 8.5h12l-1 11h-10l-1-11z" />
      <path d="M9 8.5a3 3 0 0 1 6 0" />
    </Base>
  );
}

export function ConnBalanza({ className }) {
  return (
    <Base className={className}>
      <path d="M12 4v16M8.5 20h7" />
      <path d="M5 7h14" />
      <path d="M5 7l-2.5 6a2.8 2.8 0 0 0 5 0L5 7zM19 7l-2.5 6a2.8 2.8 0 0 0 5 0L19 7z" />
    </Base>
  );
}

export function ConnCorazon({ className, lleno = false }) {
  return (
    <Base className={className}>
      <path
        d="M12 20s-7.5-4.7-7.5-10.5C4.5 6.5 6.5 5 8.5 5c1.5 0 2.8.9 3.5 2.2C12.7 5.9 14 5 15.5 5c2 0 4 1.5 4 4.5C19.5 15.3 12 20 12 20z"
        fill={lleno ? "currentColor" : "none"}
      />
    </Base>
  );
}

export function ConnCheck({ className }) {
  return (
    <Base className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Base>
  );
}

export function ConnReloj({ className }) {
  return (
    <Base className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Base>
  );
}

export function ConnPin({ className }) {
  return (
    <Base className={className}>
      <path d="M12 21s-6.5-5.7-6.5-10.5A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.5C18.5 15.3 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2" />
    </Base>
  );
}

export function ConnExtern({ className }) {
  return (
    <Base className={className}>
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M19 13.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5.5" />
    </Base>
  );
}

export function ConnSpark({ className }) {
  return (
    <Base className={className}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />
    </Base>
  );
}

export function ConnOjoOff({ className }) {
  return (
    <Base className={className}>
      <path d="M4 4l16 16" />
      <path d="M10 6.2A9 9 0 0 1 12 6c4 0 7.5 3.5 9 6-.4.7-1 1.5-1.8 2.3M6 8C4.4 9.3 3.3 11 3 12c1.5 2.5 5 6 9 6 1.4 0 2.7-.4 3.9-1" />
    </Base>
  );
}

export function ConnSync({ className }) {
  return (
    <Base className={className}>
      <path d="M20 12a8 8 0 0 1-14.2 5M4 12a8 8 0 0 1 14.2-5" />
      <path d="M18.5 3.5v4h-4M5.5 20.5v-4h4" />
    </Base>
  );
}

export function ConnPapelera({ className }) {
  return (
    <Base className={className}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
      <path d="M6.5 7l1 13h9l1-13" />
      <path d="M10 11v6M14 11v6" />
    </Base>
  );
}

export function ConnChevron({ className, arriba = false }) {
  return (
    <Base className={className}>
      {arriba ? <path d="M6 14.5l6-6 6 6" /> : <path d="M6 9.5l6 6 6-6" />}
    </Base>
  );
}

export function ConnAtras({ className }) {
  return (
    <Base className={className}>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </Base>
  );
}

export function ConnCalendario({ className }) {
  return (
    <Base className={className}>
      <rect x="4" y="6" width="16" height="14" rx="3" />
      <path d="M4 10.5h16M8.5 3.5V7M15.5 3.5V7" />
    </Base>
  );
}

export function ConnRestaurar({ className }) {
  return (
    <Base className={className}>
      <path d="M4.5 9a8 8 0 1 1-1 6" />
      <path d="M4.5 4.5V9H9" />
    </Base>
  );
}

// ── Medallón de categoría (círculo + icono teal, estilo ejemplos) ──
const CATEGORY_ICON = {
  "Rutas y naturaleza": ConnRutas,
  "Música": ConnMusica,
  "Teatro y espectáculos": ConnTeatro,
  "Gastronomía": ConnGastro,
  "Arte": ConnArte,
  "Cine": ConnCine,
  "Varios": ConnBrujula,
};

const CATEGORY_COLOR = {
  "Rutas y naturaleza": "#3A9E70",
  "Música": "#9C6FDE",
  "Teatro y espectáculos": "#E8644A",
  "Gastronomía": "#E07040",
  "Arte": "#D4860A",
  "Cine": "#4A6FCC",
  "Varios": "#12A5B5",
};

// Trazos internos reutilizables para la insignia con sombra larga.
function GlyphPaths({ category }) {
  switch (category) {
    case "Rutas y naturaleza":
      return (<><circle cx="17.5" cy="6" r="2" /><path d="M3 19l6-9 4 5.5L15.5 12 21 19H3z" /></>);
    case "Música":
      return (<><path d="M9.5 17.5V6l10-2v11" /><circle cx="6.5" cy="17.5" r="3" /><circle cx="16.5" cy="15" r="3" /></>);
    case "Teatro y espectáculos":
      return (<><path d="M4 5.5h16V12c0 4.5-3.6 7.5-8 7.5S4 16.5 4 12V5.5z" /><path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" /></>);
    case "Gastronomía":
      return (<><path d="M4 16.5a8 8 0 0 1 16 0" /><path d="M2.5 16.5h19" /><circle cx="12" cy="6" r="1" /><path d="M9 20h6" /></>);
    case "Arte":
      return (<><rect x="4" y="5" width="16" height="14" rx="3" /><circle cx="9" cy="10" r="1.5" /><path d="M4 16.5l5-4.5 3.5 3 3-2.5 4.5 3.5" /></>);
    case "Cine":
      return (<><path d="M9.5 8L6.5 3.5M14.5 8l3-4.5" /><rect x="3" y="8" width="18" height="11" rx="3" /><path d="M10.5 11.5l4.5 2.5-4.5 2.5v-5z" fill="currentColor" stroke="none" /></>);
    default:
      return (<><circle cx="12" cy="12" r="8.5" /><path d="M15.5 8.5l-2.2 5.8-5.8 2.2 2.2-5.8 5.8-2.2z" /></>);
  }
}

/**
 * Insignia estilo ejemplo: disco de color + glifo blanco con SOMBRA LARGA
 * real (silueta desplazada recortada al disco).
 */
export function ConnBadge({ category, size = 52, className = "" }) {
  const color = CATEGORY_COLOR[category] || "#12A5B5";
  const cid = `connb${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={`flex-shrink-0 ${className}`}>
      <defs>
        <clipPath id={cid}><circle cx="32" cy="32" r="30" /></clipPath>
      </defs>
      <circle cx="32" cy="32" r="30" fill={color} />
      <g clipPath={`url(#${cid})`}>
        <g transform="translate(30,31)" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <GlyphPaths category={category} />
        </g>
      </g>
      <g transform="translate(19,19)" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <GlyphPaths category={category} />
      </g>
    </svg>
  );
}

export function ConnCategoryGlyph({ category, className = "w-6 h-6" }) {
  const Ico = CATEGORY_ICON[category] || ConnBrujula;
  return <Ico className={className} />;
}

export function ConnCategoryIcon({ category, size = "md", className = "" }) {
  const outer = size === "sm" ? "w-11 h-11" : "w-14 h-14";
  const ico = size === "sm" ? "w-[22px] h-[22px]" : "w-7 h-7";
  return (
    <div className={`relative ${outer} flex-shrink-0 rounded-full bg-conn-mist flex items-center justify-center text-conn-tealDark ${className}`}>
      <ConnCategoryGlyph category={category} className={ico} />
    </div>
  );
}

export default ConnCategoryIcon;
