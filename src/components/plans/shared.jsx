import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';

export function CineMovies({ longDescription }) {
  let peliculas = null;
  try {
    peliculas = JSON.parse(longDescription);
  } catch {
    return <p className="text-xs text-slate-600 leading-relaxed">{longDescription}</p>;
  }
  if (!Array.isArray(peliculas)) return <p className="text-xs text-slate-600 leading-relaxed">{longDescription}</p>;
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-700">En cartelera esta semana:</p>
      {peliculas.map((peli, pIdx) => (
        <div key={pIdx} className="bg-slate-50 rounded-2xl p-3 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 leading-snug">{peli.titulo}</span>
            {peli.genero && (
              <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                {peli.genero}
              </span>
            )}
          </div>
          {peli.sinopsis && <p className="text-[11px] text-slate-500 leading-snug">{peli.sinopsis}</p>}
          {peli.url && String(peli.url).startsWith('https://') && (
            <a
              href={peli.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              Entradas / Horarios
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

export function PlanWhy({ text, tone = 'orange' }) {
  if (!text) return null;
  const cls =
    tone === 'blue'
      ? 'bg-blue-50 text-blue-900'
      : 'bg-orange-50 text-orange-900';
  const iconCls = tone === 'blue' ? 'text-blue-500' : 'text-orange-500';
  return (
    <div className={`flex items-start gap-2 rounded-2xl p-3 ${cls}`}>
      <Sparkles className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${iconCls}`} />
      <p className="text-xs leading-relaxed">{text}</p>
    </div>
  );
}

export function PlanSourceLink({ url }) {
  if (!url || !String(url).startsWith('https://')) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:underline"
    >
      <ExternalLink className="w-3 h-3" />
      Más información
    </a>
  );
}

export function FeedStatusLine({ lastSyncedAt, stale }) {
  if (!lastSyncedAt) return null;
  const mins = Math.max(0, Math.round((Date.now() - lastSyncedAt) / 60000));
  const label = mins < 1 ? 'actualizado hace un momento' : mins < 60 ? `actualizado hace ${mins} min` : `actualizado hace ${Math.round(mins / 60)} h`;
  return (
    <p className={`text-[11px] mt-1 ${stale ? 'text-amber-600 font-semibold' : 'text-slate-400'}`} role="status">
      {label}
      {stale ? ' · usando caché anterior' : ''}
    </p>
  );
}
