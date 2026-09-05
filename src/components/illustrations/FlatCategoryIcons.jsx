import React from "react";

// ═══════════════════════════════════════════════════════════════
//  FLAT CATEGORY ICONS
//  Estilo: círculo plano + sombra larga diagonal + glifo sólido
//  (estética referencia del usuario — flat badge con long shadow)
//  viewBox 0 0 100 100 · círculo r48 · glifo crema · sombra recortada
// ═══════════════════════════════════════════════════════════════

const CREAM = "#F7F1E3";
const SHADOW_DX = 9;
const SHADOW_DY = 11;

// ── CINE · bobina de película · terracota ──────────────────────
const CINE_BG = "#C9503B";
const CINE_SHADE = "#9E3A28";

function CineSilhouette({ c }) {
  return (
    <g fill={c}>
      <circle cx="50" cy="52" r="20" />
    </g>
  );
}

function FlatCine() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="flat-clip-cine">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="48" fill={CINE_BG} />
      <g clipPath="url(#flat-clip-cine)">
        <g transform={`translate(${SHADOW_DX},${SHADOW_DY})`}>
          <CineSilhouette c={CINE_SHADE} />
        </g>
      </g>
      <CineSilhouette c={CREAM} />
      {/* agujeros de la bobina */}
      <g fill={CINE_BG}>
        <circle cx="50" cy="41" r="4" />
        <circle cx="59.5" cy="46.5" r="4" />
        <circle cx="59.5" cy="57.5" r="4" />
        <circle cx="50" cy="63" r="4" />
        <circle cx="40.5" cy="57.5" r="4" />
        <circle cx="40.5" cy="46.5" r="4" />
        <circle cx="50" cy="52" r="5" />
      </g>
    </svg>
  );
}

// ── NATURALEZA · hoja · verde ──────────────────────────────────
const NAT_BG = "#63A34E";
const NAT_SHADE = "#497C38";

function NatSilhouette({ c }) {
  return (
    <g fill={c}>
      <path d="M50 24C72 36 76 62 50 80C24 62 28 36 50 24Z" />
    </g>
  );
}

function FlatNaturaleza() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="flat-clip-nat">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="48" fill={NAT_BG} />
      <g clipPath="url(#flat-clip-nat)">
        <g transform={`translate(${SHADOW_DX},${SHADOW_DY})`}>
          <NatSilhouette c={NAT_SHADE} />
        </g>
      </g>
      <NatSilhouette c={CREAM} />
      {/* nervadura */}
      <g stroke={NAT_BG} strokeLinecap="round" fill="none">
        <path d="M50 34V72" strokeWidth="3" />
        <path d="M50 46l10-6M50 46l-10-6" strokeWidth="2.5" />
        <path d="M50 58l12-7M50 58l-12-7" strokeWidth="2.5" />
      </g>
    </svg>
  );
}

// ── ARTE · paleta de pintor · ocre ─────────────────────────────
const ARTE_BG = "#D9992C";
const ARTE_SHADE = "#A97820";

function ArteSilhouette({ c }) {
  return (
    <g fill={c}>
      <circle cx="45" cy="55" r="18" />
      <circle cx="62" cy="63" r="8" />
    </g>
  );
}

function FlatArte() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="flat-clip-arte">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="48" fill={ARTE_BG} />
      <g clipPath="url(#flat-clip-arte)">
        <g transform={`translate(${SHADOW_DX},${SHADOW_DY})`}>
          <ArteSilhouette c={ARTE_SHADE} />
        </g>
      </g>
      <ArteSilhouette c={CREAM} />
      {/* agujero del pulgar */}
      <circle cx="59" cy="59" r="4.5" fill={ARTE_BG} />
      {/* gotas de pintura */}
      <circle cx="36" cy="47" r="3.2" fill="#C9503B" />
      <circle cx="45" cy="41" r="3.2" fill="#2E7D6E" />
      <circle cx="54" cy="44" r="3.2" fill="#4A6FCC" />
      <circle cx="38" cy="58" r="3.2" fill="#7A4A2B" />
    </svg>
  );
}

// ── GASTRO · campana de servicio · siena ───────────────────────
const GASTRO_BG = "#B26A35";
const GASTRO_SHADE = "#8A4F26";

function GastroSilhouette({ c }) {
  return (
    <g fill={c}>
      <path d="M28 62A22 22 0 0 1 72 62Z" />
      <circle cx="50" cy="35" r="4.5" />
      <rect x="24" y="63" width="52" height="6" rx="3" />
    </g>
  );
}

function FlatGastro() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="flat-clip-gastro">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="48" fill={GASTRO_BG} />
      <g clipPath="url(#flat-clip-gastro)">
        <g transform={`translate(${SHADOW_DX},${SHADOW_DY})`}>
          <GastroSilhouette c={GASTRO_SHADE} />
        </g>
      </g>
      <GastroSilhouette c={CREAM} />
      {/* brillo de la campana */}
      <path d="M36 57A14 14 0 0 1 44 47" stroke={GASTRO_BG} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ── Mapa + wrapper (misma API que PlanCategoryIcon) ────────────
const FLAT_CONFIG = {
  cine: FlatCine,
  naturaleza: FlatNaturaleza,
  arte: FlatArte,
  gastro: FlatGastro,
  gastronomia: FlatGastro,
};

function matchFlat(category) {
  if (!category) return null;
  const raw = category.toLowerCase();
  if (raw.includes("cine") || raw.includes("película") || raw.includes("pelicula") || raw.includes("film")) return "cine";
  if (raw.includes("naturaleza") || raw.includes("senderismo") || raw.includes("parque") || raw.includes("ruta")) return "naturaleza";
  if (raw.includes("arte") || raw.includes("exposici") || raw.includes("museo") || raw.includes("pintura")) return "arte";
  if (raw.includes("gastro") || raw.includes("restaurante") || raw.includes("tapas") || raw.includes("mercado")) return "gastro";
  return null;
}

/**
 * Icono flat con long shadow.
 * size: "sm" = 44px | "md" = 56px (default)
 * Devuelve null si la categoría no es una de las 4.
 */
export function FlatCategoryIcon({ category, size = "md" }) {
  const key = matchFlat(category);
  if (!key) return null;
  const Ico = FLAT_CONFIG[key];
  const outer = size === "sm" ? "w-11 h-11" : "w-14 h-14";

  return (
    <div className={`relative ${outer} flex-shrink-0`}>
      <Ico />
    </div>
  );
}

export { FlatCine, FlatNaturaleza, FlatArte, FlatGastro };
export default FlatCategoryIcon;
