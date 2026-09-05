import React from "react";

// ═══════════════════════════════════════════════════════════════
//  PLAN CATEGORY ICONS
//  Estilo: blob orgánico de color + icono blanco centrado
//  Inspiración: Headspace — formas fluidas, colores cálidos saturados
// ═══════════════════════════════════════════════════════════════

// ── Blob SVG reutilizable (forma orgánica irregular) ──────────
function Blob({ color, className = "w-full h-full" }) {
  return (
    <svg className={className} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M48.5 8.5C57 11 66 19 69.5 28.5C73 38 71 50 65 58.5C59 67 49.5 71.5 39.5 71C29.5 70.5 18.5 65.5 13.5 57C8.5 48.5 9.5 36.5 14 27.5C18.5 18.5 27 10 36.5 8C46 6 48.5 8.5 48.5 8.5Z"
        fill={color}
      />
    </svg>
  );
}

// ── Iconos SVG en blanco (trazo fino, 22×22 viewBox) ─────────

function IcoMusica() {
  return (
    <svg viewBox="0 0 22 22" fill="none" className="w-6 h-6">
      <path d="M8 17V5.5L18 4v12" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="5.5" cy="17" r="2.5" stroke="white" strokeWidth="1.7"/>
      <circle cx="15.5" cy="16" r="2.5" stroke="white" strokeWidth="1.7"/>
    </svg>
  );
}

function IcoTeatro() {
  return (
    <svg viewBox="0 0 22 22" fill="none" className="w-6 h-6">
      <path d="M2 9C2 5.5 5.5 3 9.5 3S17 5.5 17 9v2c0 4-3.5 7-7.5 7S2 15 2 11V9z" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <circle cx="7" cy="9.5" r="1" fill="white"/>
      <circle cx="12" cy="9.5" r="1" fill="white"/>
      <path d="M7 13c.7 1 1.8 1.7 2.5 1.7s1.8-.7 2.5-1.7" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M13 3.5c1.5.5 3 1.5 4 3" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

function IcoArte() {
  return (
    <svg viewBox="0 0 22 22" fill="none" className="w-6 h-6">
      <circle cx="11" cy="11" r="8.5" stroke="white" strokeWidth="1.7"/>
      <circle cx="8" cy="9.5" r="1.3" fill="white"/>
      <circle cx="12.5" cy="7" r="1.3" fill="white"/>
      <circle cx="15" cy="11.5" r="1.3" fill="white"/>
      <circle cx="13" cy="15.5" r="1.3" fill="white"/>
      <circle cx="8.5" cy="14.5" r="1.3" fill="white"/>
    </svg>
  );
}

function IcoNaturaleza() {
  return (
    <svg viewBox="0 0 22 22" fill="none" className="w-6 h-6">
      <path d="M11 20V11" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M11 11C11 11 6.5 8.5 6.5 5c0-2.5 2-3.5 4.5-3.5S15.5 2.5 15.5 5c0 3.5-4.5 6-4.5 6z" stroke="white" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M3 20h16" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M7.5 15c-1.5 0-2.5-.8-2.5-2.5S6 10 7.5 10c0 1.8 1.5 3.5 3.5 3.5" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

function IcoGastronomia() {
  return (
    <svg viewBox="0 0 22 22" fill="none" className="w-6 h-6">
      <path d="M3 10c0-4 3.6-7.5 8-7.5s8 3.5 8 7.5" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M3 10h16" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M11 10v10M7.5 20h7" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M7 7c.5-1 1.5-2 3-2.5" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

function IcoFamilia() {
  return (
    <svg viewBox="0 0 22 22" fill="none" className="w-6 h-6">
      <circle cx="8.5" cy="5" r="2.5" stroke="white" strokeWidth="1.7"/>
      <circle cx="15" cy="6" r="2" stroke="white" strokeWidth="1.7"/>
      <path d="M2 19c0-3.5 2.9-6.5 6.5-6.5S15 15.5 15 19" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M15 13.5c1.8 0 5 1.5 5 5.5" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

function IcoCine() {
  return (
    <svg viewBox="0 0 22 22" fill="none" className="w-6 h-6">
      <rect x="2" y="7" width="18" height="12" rx="2.5" stroke="white" strokeWidth="1.7"/>
      <path d="M6.5 7V5M11 7V5M15.5 7V5" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M5 5h12" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M9.5 11l4 2.5-4 2.5V11z" fill="white"/>
    </svg>
  );
}

function IcoDeporte() {
  return (
    <svg viewBox="0 0 22 22" fill="none" className="w-6 h-6">
      <circle cx="11" cy="11" r="8.5" stroke="white" strokeWidth="1.7"/>
      <path d="M11 2.5C8.5 5 8.5 8.5 8.5 11s0 6 2.5 8.5" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M11 2.5C13.5 5 13.5 8.5 13.5 11s0 6-2.5 8.5" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M2.5 11h17" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

function IcoOcio() {
  return (
    <svg viewBox="0 0 22 22" fill="none" className="w-6 h-6">
      <path d="M11 2l2.1 6.6H20l-5.5 4 2.1 6.5L11 15.5 6.4 19l2.1-6.5L3 8.6h6.9L11 2z" stroke="white" strokeWidth="1.7" strokeLinejoin="round"/>
    </svg>
  );
}

function IcoBrujula() {
  return (
    <svg viewBox="0 0 22 22" fill="none" className="w-6 h-6">
      <circle cx="11" cy="11" r="8.5" stroke="white" strokeWidth="1.7"/>
      <path d="M14.5 7.5l-2 5.8-5.8 2 2-5.8 5.8-2z" stroke="white" strokeWidth="1.7" strokeLinejoin="round"/>
      <circle cx="11" cy="11" r="1.3" fill="white"/>
    </svg>
  );
}

// ── Paleta de colores por categoría ──────────────────────────
const CATEGORY_CONFIG = {
  "Musica":      { ico: IcoMusica,     color: "#9C6FDE", colorLight: "#C4A8F0" },
  "Teatro":      { ico: IcoTeatro,     color: "#E8644A", colorLight: "#F2957E" },
  "Arte":        { ico: IcoArte,       color: "#D4860A", colorLight: "#F0B647" },
  "Naturaleza":  { ico: IcoNaturaleza, color: "#3A9E70", colorLight: "#6ECBA0" },
  "Gastronomia": { ico: IcoGastronomia,color: "#E07040", colorLight: "#F0A070" },
  "Familia":     { ico: IcoFamilia,    color: "#3A8FD4", colorLight: "#6DBAF0" },
  "Deporte":     { ico: IcoDeporte,    color: "#5A9E30", colorLight: "#8FCC60" },
  "Cine":        { ico: IcoCine,       color: "#4A6FCC", colorLight: "#7A9FF0" },
  "Ocio":        { ico: IcoOcio,       color: "#D4507A", colorLight: "#F080A0" },
  "Varios":      { ico: IcoBrujula,    color: "#5090B8", colorLight: "#80C0E0" },
};

function matchCategory(category) {
  if (!category) return "Varios";
  const raw = category.toLowerCase();
  if (raw.includes("m\u00fasica") || raw.includes("musica") || raw.includes("concierto") || raw.includes("flamenco")) return "Musica";
  if (raw.includes("teatro") || raw.includes("danza") || raw.includes("escena")) return "Teatro";
  if (raw.includes("arte") || raw.includes("exposici") || raw.includes("museo") || raw.includes("pintura")) return "Arte";
  if (raw.includes("naturaleza") || raw.includes("senderismo") || raw.includes("ruta") || raw.includes("parque") || raw.includes("sierra")) return "Naturaleza";
  if (raw.includes("gastronom") || raw.includes("gastro") || raw.includes("mercado") || raw.includes("restaurante") || raw.includes("tapas")) return "Gastronomia";
  if (raw.includes("familia") || raw.includes("infantil") || raw.includes("ni\u00f1")) return "Familia";
  if (raw.includes("deporte") || raw.includes("f\u00fatbol") || raw.includes("tenis") || raw.includes("running")) return "Deporte";
  if (raw.includes("cine") || raw.includes("pel\u00edcula") || raw.includes("film")) return "Cine";
  if (raw.includes("ocio") || raw.includes("feria") || raw.includes("fest") || raw.includes("carnaval")) return "Ocio";
  return "Varios";
}

/**
 * Icono de categoría al estilo Headspace:
 * blob orgánico de color + icono blanco encima.
 *
 * size: "sm" = 44px | "md" = 56px (default)
 */
export function PlanCategoryIcon({ category, size = "md" }) {
  const key = matchCategory(category);
  const { ico: Ico, color } = CATEGORY_CONFIG[key] || CATEGORY_CONFIG["Varios"];

  const outer = size === "sm" ? "w-11 h-11" : "w-14 h-14";

  return (
    <div className={`relative ${outer} flex-shrink-0 flex items-center justify-center`}>
      {/* Blob de color de fondo */}
      <Blob color={color} className="absolute inset-0 w-full h-full" />
      {/* Icono blanco centrado */}
      <div className="relative z-10">
        <Ico />
      </div>
    </div>
  );
}

export default PlanCategoryIcon;
