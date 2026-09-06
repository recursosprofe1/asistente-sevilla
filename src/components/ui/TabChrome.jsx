import React from 'react';
import { FGlyph, SyncGlyph } from '../illustrations/NotoBadges';

// ═══════════════════════════════════════════════════════════════
// TabChrome — patrón común de las pestañas (Hoy aparte, es special).
// Reglas de diseño pactadas:
//  · Hero teal SOLO con título, línea de estado y botón de sync
//    (mismo tamaño/posición en todas). Acciones extra van en `right`.
//  · Toda botonera va DEBAJO del hero, en tarjeta blanca: secciones como
//    pastillas con glifo+texto (SectionPill) y filtros como toggles
//    circulares de puro icono (IconToggle), mismo lenguaje en las tres.
// ═══════════════════════════════════════════════════════════════

export function TabHero({ title, status, onSync, isSyncing, right, children }) {
  return (
    <div className="conn-hero px-5 pt-5 pb-4 text-white">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-theme-title text-[22px] font-black leading-tight">{title}</h2>
          {status && (
            <p className="text-xs font-bold text-white/85 mt-1" role="status">
              {status}
            </p>
          )}
          {children}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {right}
          {onSync && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              type="button"
              title="Sincronizar"
              aria-label="Sincronizar"
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white text-conn-tealDark active:scale-95 transition-all disabled:opacity-60"
              style={{ boxShadow: '0 8px 18px -6px rgba(0, 0, 0, 0.30)' }}
            >
              <SyncGlyph size={22} spin={isSyncing} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Tarjeta blanca bajo el hero que agrupa todas las botoneras.
export function ControlsCard({ children }) {
  return <div className="conn-card p-4 space-y-2.5">{children}</div>;
}

// Pastilla de sección: glifo + texto (activo = teal relleno).
export function SectionPill({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full min-h-[36px] text-xs font-black transition-all active:scale-95 ${
        active ? 'bg-conn-teal text-white' : 'bg-conn-aqua text-conn-muted'
      }`}
      style={active ? { boxShadow: '0 8px 16px -8px rgba(18, 165, 181, 0.7)' } : undefined}
    >
      <FGlyph name={icon} size={18} />
      {label}
    </button>
  );
}

// Toggle circular de puro icono (lupa/corazón): anillo cuando está activo.
export function IconToggle({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      aria-label={label}
      className={`w-10 h-10 rounded-full flex items-center justify-center bg-conn-aqua transition-all active:scale-90 ${
        active ? 'opacity-100' : 'opacity-45'
      }`}
      style={active ? { outline: '2px solid #0B3B42', outlineOffset: 2 } : undefined}
    >
      <FGlyph name={icon} size={20} />
    </button>
  );
}

// Botón redondo menor (papelera y compañía) con el mismo lenguaje que el sync.
export function RoundIconButton({ icon, iconSize = 18, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      type="button"
      title={label}
      aria-label={label}
      className={`w-11 h-11 flex items-center justify-center rounded-full active:scale-95 transition-all ${
        danger ? 'bg-white/20 text-white' : 'bg-white text-conn-tealDark'
      }`}
      style={{ boxShadow: '0 8px 18px -6px rgba(0, 0, 0, 0.30)' }}
    >
      <FGlyph name={icon} size={iconSize} color={danger ? '#FFFFFF' : '#0E7E8C'} />
    </button>
  );
}
