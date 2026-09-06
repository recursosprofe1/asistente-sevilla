import React from 'react';
import { FGlyph, SyncGlyph } from '../illustrations/NotoBadges';

// ═══════════════════════════════════════════════════════════════
// TabChrome — patrón común de las pestañas (Hoy aparte, es special).
// Reglas de diseño pactadas:
//  · Hero teal SOLO con título, línea de estado y botón de sync
//    (mismo tamaño/posición en todas). Acciones extra van en `right`.
//  · Toda botonera (subs, filtros, radios) va en una tarjeta blanca
//    DEBAJO del hero, con el mismo estilo de pastilla:
//    activo = deep sobre blanco, inactivo = aqua.
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

export function PillGroup({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`px-3 py-1.5 rounded-full text-xs font-black min-h-[36px] transition-all active:scale-95 ${
            value === o.value ? 'bg-conn-deep text-white' : 'bg-conn-aqua text-conn-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
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
