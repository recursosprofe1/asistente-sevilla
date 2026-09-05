import React from 'react';

/**
 * Ilustraciones vectoriales personalizadas y compactas para las cabeceras de cada área.
 * Estilo Medito: líneas limpias, formas orgánicas suaves y tonos azulados.
 */

// 1. Cabecera HOY: Forma orgánica azulada tipo ola suave con un sol o astro plano
export function HeaderVectorHoy({ className = "w-24 h-16" }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      {/* Resplandor del astro */}
      <circle cx="60" cy="34" r="22" fill="#DBEAFE" fillOpacity="0.7" />
      {/* Sol / Astro plano sereno */}
      <circle cx="60" cy="34" r="14" fill="url(#sunGrad)" />
      {/* Olas orgánicas suaves superpuestas */}
      <path
        d="M0 58C25 48 45 66 70 54C90 44 105 58 120 52V80H0V58Z"
        fill="#93C5FD"
        fillOpacity="0.6"
      />
      <path
        d="M0 64C30 54 60 70 85 60C100 54 112 62 120 58V80H0V64Z"
        fill="#3B82F6"
        fillOpacity="0.85"
      />
      {/* Pequeño destello de calma */}
      <circle cx="95" cy="22" r="1.5" fill="#3B82F6" />
      <circle cx="28" cy="28" r="2" fill="#93C5FD" />
    </svg>
  );
}

// 2. Cabecera PLANES: Mapa minimalista vectorizado con ondas de radio / cercanía
export function HeaderVectorPlanes({ className = "w-24 h-16" }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Ondas concéntricas de radio de desplazamiento */}
      <circle cx="60" cy="46" r="32" stroke="#DBEAFE" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="60" cy="46" r="22" stroke="#93C5FD" strokeWidth="1.5" />
      <circle cx="60" cy="46" r="12" fill="#EBF2FA" stroke="#60A5FA" strokeWidth="1.5" />
      
      {/* Pliegues de mapa estilizado en la base */}
      <path
        d="M20 52L45 42L75 50L100 40V68L75 74L45 66L20 72V52Z"
        fill="#EFF6FF"
        stroke="#BFDBFE"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      
      {/* Punto de origen / Pin sereno */}
      <circle cx="60" cy="46" r="4.5" fill="#2563EB" />
      <circle cx="60" cy="46" r="2" fill="#FFFFFF" />
      
      {/* Brújula / Destello sutil */}
      <path d="M60 14L62 20L68 22L62 24L60 30L58 24L52 22L58 20L60 14Z" fill="#3B82F6" />
    </svg>
  );
}

// 3. Cabecera CASA: Silueta plana y estilizada de una casa con líneas suaves y curvas
export function HeaderVectorCasa({ className = "w-24 h-16" }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Aura de hogar */}
      <ellipse cx="60" cy="48" rx="34" ry="24" fill="#EFF6FF" />
      
      {/* Chimenea estilizada con nube suave */}
      <path d="M74 28V38H80V28H74Z" fill="#93C5FD" />
      <circle cx="77" cy="22" r="3" fill="#DBEAFE" />
      <circle cx="81" cy="16" r="2" fill="#E0F2FE" />
      
      {/* Tejado suave redondeado */}
      <path
        d="M34 40C34 40 45 28 60 28C75 28 86 40 86 40L82 44C82 44 73 34 60 34C47 34 38 44 38 44L34 40Z"
        fill="#2563EB"
      />
      
      {/* Estructura de la casa */}
      <rect x="42" y="42" width="36" height="26" rx="6" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.5" />
      
      {/* Puerta en arco suave */}
      <path d="M54 68V54C54 51.5 56.5 49 60 49C63.5 49 66 51.5 66 54V68H54Z" fill="#3B82F6" />
      
      {/* Pequeña ventana circular acogedora */}
      <circle cx="60" cy="41" r="3" fill="#DBEAFE" />
      
      {/* Hoja / Planta orgánica suave al lado */}
      <path d="M88 68C88 62 93 58 97 58C97 64 92 68 88 68Z" fill="#60A5FA" />
      <path d="M26 68C26 63 30 60 34 60C34 65 30 68 26 68Z" fill="#93C5FD" />
    </svg>
  );
}

// 4. Cabecera COMPRAS: Bolsa o etiqueta minimalista vectorizada con curvas suaves
export function HeaderVectorCompras({ className = "w-24 h-16" }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Resplandor de pausa */}
      <circle cx="60" cy="44" r="26" fill="#EFF6FF" />
      
      {/* Asa suave de la bolsa */}
      <path
        d="M50 36V28C50 22.5 54.5 18 60 18C65.5 18 70 22.5 70 28V36"
        stroke="#2563EB"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Cuerpo de la bolsa minimalista redondeada */}
      <rect x="42" y="34" width="36" height="34" rx="8" fill="#FFFFFF" stroke="#60A5FA" strokeWidth="1.5" />
      
      {/* Pliegue decorativo y etiqueta de enfriamiento */}
      <line x1="42" y1="42" x2="78" y2="42" stroke="#DBEAFE" strokeWidth="1.5" />
      
      {/* Etiqueta / Tag colgante zen */}
      <rect x="68" y="44" width="14" height="18" rx="3" fill="#3B82F6" transform="rotate(12 68 44)" />
      <circle cx="71" cy="47" r="1.5" fill="#FFFFFF" />
      
      {/* Reloj de arena / Destello de pausa */}
      <path d="M58 50L62 50L60 54L62 58L58 58L60 54L58 50Z" fill="#93C5FD" />
    </svg>
  );
}

// 5. Cabecera DECISIONES: Balanza o bifurcación de caminos suave y circular
export function HeaderVectorDecisiones({ className = "w-24 h-16" }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Círculo zen contenedor */}
      <circle cx="60" cy="40" r="28" fill="#EFF6FF" stroke="#DBEAFE" strokeWidth="1" />
      
      {/* Bifurcación de caminos suaves que nacen de un sendero común */}
      <path
        d="M60 68V50C60 42 42 38 42 26"
        stroke="#3B82F6"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M60 50C60 42 78 38 78 26"
        stroke="#60A5FA"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Destinos en círculos suaves (opciones armónicas) */}
      <circle cx="42" cy="24" r="6" fill="#2563EB" />
      <circle cx="42" cy="24" r="2.5" fill="#FFFFFF" />
      
      <circle cx="78" cy="24" r="6" fill="#93C5FD" />
      <circle cx="78" cy="24" r="2.5" fill="#FFFFFF" />
      
      {/* Astro guía superior */}
      <circle cx="60" cy="18" r="3" fill="#3B82F6" fillOpacity="0.8" />
    </svg>
  );
}
