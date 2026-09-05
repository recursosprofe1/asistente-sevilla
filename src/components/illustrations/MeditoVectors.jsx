import React from 'react';

/**
 * Colección de iconos vectoriales integrados y formas orgánicas estilo Medito.
 * Suaves, planas, limpias y adaptadas a la paleta azul serena.
 */

// 1. Estrella zen de 4 puntas
export function GentleStar({ className = "w-4 h-4 text-blue-500" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" />
    </svg>
  );
}

// 2. Gota orgánica suave (Hogar / Hábitos)
export function SereneDrop({ className = "w-5 h-5 text-blue-500" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.5C12 2.5 5 11 5 16C5 19.866 8.134 23 12 23C15.866 23 19 19.866 19 16C19 11 12 2.5 12 2.5ZM10.5 14C9.67 14 9 14.67 9 15.5C9 16.33 9.67 17 10.5 17C11.33 17 12 16.33 12 15.5C12 14.67 11.33 14 10.5 14Z" />
    </svg>
  );
}

// 3. Piedras Zen apiladas en equilibrio (Compras No Impulsivas / Pausa)
export function ZenStones({ className = "w-5 h-5 text-blue-500" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      {/* Piedra base */}
      <ellipse cx="12" cy="19.5" rx="8" ry="2.8" opacity="0.85" />
      {/* Piedra media */}
      <ellipse cx="12" cy="14" rx="5.8" ry="2.2" opacity="0.95" />
      {/* Piedra superior */}
      <ellipse cx="12" cy="9" rx="3.8" ry="1.8" />
      {/* Resplandor zen */}
      <circle cx="12" cy="4" r="1.5" opacity="0.75" />
    </svg>
  );
}

// 4. Balanza serena de juicio claro (Decisiones aplazadas)
export function SereneScale({ className = "w-5 h-5 text-blue-500" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3v18" />
      <path d="M4 7h16" />
      <path d="m4 7 3 7h-6l3-7" />
      <path d="m20 7 3 7h-6l3-7" />
      <circle cx="12" cy="4" r="1.5" fill="currentColor" />
    </svg>
  );
}

// 5. Olas suaves (Divisor decorativo)
export function CalmWaves({ className = "w-full h-4 text-blue-200" }) {
  return (
    <svg viewBox="0 0 100 12" fill="currentColor" preserveAspectRatio="none" className={className}>
      <path d="M0 6C20 2 35 10 50 6C65 2 80 10 100 6V12H0V6Z" opacity="0.6" />
      <path d="M0 8C25 4 40 11 60 7C75 4 85 10 100 8V12H0V8Z" />
    </svg>
  );
}

// 6. Mancha orgánica de fondo (Blob)
export function OrganicBlob({ className = "w-8 h-8", color = "#DBEAFE" }) {
  return (
    <svg viewBox="0 0 100 100" fill={color} className={className}>
      <path d="M38.5,-63.4C50.2,-57.8,60.1,-48.3,67.6,-36.8C75,-25.2,80.1,-11.7,78.8,1.3C77.4,14.3,69.7,26.8,60.8,37.3C52,47.9,42.1,56.5,30.8,61.9C19.4,67.3,6.7,69.5,-6.1,68.4C-18.9,67.3,-31.7,62.8,-42.6,55.1C-53.5,47.3,-62.4,36.2,-67.2,23.5C-72,10.7,-72.6,-3.8,-68.8,-17.1C-64.9,-30.3,-56.6,-42.4,-45.5,-48.5C-34.4,-54.7,-20.5,-55,-7,-55.8C6.5,-56.6,26.8,-69,38.5,-63.4Z" transform="translate(50 50)" />
    </svg>
  );
}

// 7. Brújula serena (Planes / Caminatas)
export function SereneCompass({ className = "w-5 h-5 text-blue-500" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}
