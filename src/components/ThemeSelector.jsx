import React from 'react';
import { GentleStar } from './illustrations/MeditoVectors';
import { Sparkles, Check } from 'lucide-react';

export const MEDITO_THEMES = [
  {
    id: 'azul-sereno',
    name: 'Azul Sereno',
    shortName: 'Azul Sereno',
    badge: 'Medito',
    palette: ['#F0F4F8', '#3B82F6', '#1E3A8A'],
    desc: 'Azul papel #F0F4F8 • Cobalto suave #3B82F6 • Profundo #1E3A8A'
  },
  {
    id: 'indigo-noche',
    name: 'Índigo Profundo',
    shortName: 'Índigo',
    badge: 'Noche',
    palette: ['#E8EEF5', '#2563EB', '#1E293B'],
    desc: 'Gris azulado #E8EEF5 • Índigo #2563EB • Marino #1E293B'
  },
  {
    id: 'brisa-celeste',
    name: 'Brisa Celeste',
    shortName: 'Celeste',
    badge: 'Brisa',
    palette: ['#F4F8FB', '#38BDF8', '#2563EB'],
    desc: 'Azul brisa #F4F8FB • Celeste #38BDF8 • Cobalto #2563EB'
  }
];

export default function ThemeSelector({ activeTheme, onSelectTheme }) {
  const current = MEDITO_THEMES.find((t) => t.id === activeTheme) || MEDITO_THEMES[0];

  return (
    <header className="sticky top-0 z-40 bg-[#F0F4F8]/95 backdrop-blur-md px-4 pt-3 pb-2.5 transition-colors border-b border-[#E2E8F0]/70">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-serene-sm">
            <GentleStar className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-widest uppercase text-blue-900/60">
                Estética Medito
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                Ilustrado & Sereno
              </span>
            </div>
            <h1 className="text-sm font-bold text-blue-950 font-theme-title leading-tight">
              {current.name}
            </h1>
          </div>
        </div>

        {/* Muestra de color en cápsula */}
        <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-full border border-blue-100 shadow-serene-sm">
          {current.palette.map((color, i) => (
            <span
              key={i}
              className="w-3 h-3 rounded-full border border-black/5"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Selector de variantes en píldoras suaves */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/80 rounded-full border border-blue-100 shadow-serene-sm">
        {MEDITO_THEMES.map((theme) => {
          const isSelected = activeTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => onSelectTheme(theme.id)}
              type="button"
              className={`relative flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-serene-sm'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-blue-50/60'
              }`}
            >
              <div className="flex items-center gap-0.5">
                {theme.palette.map((c, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : ''}`}
                    style={{ backgroundColor: isSelected ? 'white' : c }}
                  />
                ))}
              </div>
              <span className="leading-none">{theme.shortName}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
