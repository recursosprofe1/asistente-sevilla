import React from 'react';
import { FGlyph, SyncGlyph } from '../illustrations/NotoBadges';

// ═══════════════════════════════════════════════════════════════
//  TabChrome — patrón común de las pestañas (Hoy aparte, es special).
//  Reglas de diseño pactadas:
//  · Hero teal SOLO con título, línea de estado y botón de sync
//    (mismo tamaño/posición en todas).
//  · Toda botonera va DEBAJO del hero, en tarjeta blanca: empieza con
//    una frase y a la derecha el trío papelera/lupa/corazón
//    (ControlsHeader, un solo estado 'view' en las tres pestañas).
//  · Secciones (Cine) como pastillas con glifo+texto (SectionPill).
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

// Toggle circular de puro icono (papelera/lupa/corazón): anillo cuando está activo.
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

// Cabecera común de la caja de control: frase a la izquierda y el trío
// papelera/lupa/corazón a la derecha. `view` es un único estado:
// 'trash' | 'all' | 'favorites' (las tres pestañas, misma semántica).
export function ControlsHeader({ question, view, onView, trashCount = 0 }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-bold text-conn-muted leading-relaxed">{question}</p>
      <div className="flex items-center gap-1.5 flex-shrink-0" role="group" aria-label="Vista">
        <IconToggle
          icon="papelera"
          label={trashCount > 0 ? `Papelera (${trashCount})` : 'Papelera (vacía)'}
          active={view === 'trash'}
          onClick={() => onView('trash')}
        />
        <IconToggle
          icon="lupa"
          label="Todos"
          active={view === 'all'}
          onClick={() => onView('all')}
        />
        <IconToggle
          icon="corazon"
          label="Favoritos"
          active={view === 'favorites'}
          onClick={() => onView('favorites')}
        />
      </div>
    </div>
  );
}
