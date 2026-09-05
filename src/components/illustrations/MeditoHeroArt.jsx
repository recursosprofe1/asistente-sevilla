import React from 'react';

/**
 * Ilustración plana y serena de fondo inspirada en la app Medito:
 * Capas de colinas/olas onduladas, luna pacífica, aura suave y estrellas minimalistas.
 */
export default function MeditoHeroArt({ className = "w-full h-36" }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl ${className}`}>
      <svg
        viewBox="0 0 400 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover select-none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Degradado sereno del cielo */}
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EBF4FD" />
            <stop offset="100%" stopColor="#D9EAFD" />
          </linearGradient>

          {/* Degradado luna / astro sereno */}
          <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E0F2FE" />
          </linearGradient>

          {/* Filtro de resplandor suave */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Fondo del cielo */}
        <rect width="400" height="160" fill="url(#skyGrad)" />

        {/* Círculo aura zen concéntrico */}
        <circle cx="320" cy="45" r="46" fill="#BFDBFE" fillOpacity="0.35" />
        <circle cx="320" cy="45" r="30" fill="#93C5FD" fillOpacity="0.45" />

        {/* Astro / Luna creciente serena */}
        <circle cx="320" cy="45" r="18" fill="url(#moonGrad)" filter="url(#softGlow)" />
        <path
          d="M328 32C324 35 322 40 322 45C322 51 325 56 329 59C324 60 318 57 315 52C312 47 312 40 316 35C319 32 324 31 328 32Z"
          fill="#3B82F6"
          fillOpacity="0.15"
        />

        {/* Estrellas serenas de 4 puntas estilo Medito */}
        {/* Estrella 1 */}
        <path
          d="M60 28C60 33 55 35 50 35C55 35 60 37 60 42C60 37 65 35 70 35C65 35 60 33 60 28Z"
          fill="#3B82F6"
          fillOpacity="0.5"
        />
        {/* Estrella 2 */}
        <path
          d="M140 18C140 21 137 22 134 22C137 22 140 23 140 26C140 23 143 22 146 22C143 22 140 21 140 18Z"
          fill="#60A5FA"
          fillOpacity="0.6"
        />
        {/* Estrella 3 */}
        <path
          d="M230 35C230 38 227 40 224 40C227 40 230 42 230 45C230 42 233 40 236 40C233 40 230 38 230 35Z"
          fill="#93C5FD"
          fillOpacity="0.8"
        />
        {/* Partículas de calma */}
        <circle cx="95" cy="50" r="2" fill="#93C5FD" fillOpacity="0.7" />
        <circle cx="180" cy="25" r="1.5" fill="#60A5FA" fillOpacity="0.6" />
        <circle cx="260" cy="20" r="2.5" fill="#BFDBFE" fillOpacity="0.8" />

        {/* Capa 1 de Colina / Ola Suave Posterior (Celeste suave) */}
        <path
          d="M0 110C60 90 120 120 200 95C280 70 340 105 400 90V160H0V110Z"
          fill="#BFDBFE"
          fillOpacity="0.65"
        />

        {/* Capa 2 de Colina / Ola Suave Intermedia (Azul pastel) */}
        <path
          d="M0 125C80 105 160 140 250 115C320 95 365 120 400 110V160H0V125Z"
          fill="#93C5FD"
          fillOpacity="0.8"
        />

        {/* Capa 3 de Colina / Ola Frontal (Azul Medito suave) */}
        <path
          d="M0 140C90 120 180 150 270 130C340 115 375 135 400 128V160H0V140Z"
          fill="#60A5FA"
          fillOpacity="0.7"
        />

        {/* Base frontal en azul cobalto profundo suave */}
        <path
          d="M0 152C110 142 220 158 310 146C360 140 385 148 400 145V160H0V152Z"
          fill="#3B82F6"
          fillOpacity="0.4"
        />
      </svg>
    </div>
  );
}
