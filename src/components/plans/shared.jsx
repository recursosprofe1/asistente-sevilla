import React from 'react';
import { ConnExtern, ConnSpark } from '../illustrations/ConnIcons';

export function CineMovies({ longDescription }) {
  let peliculas = null;
  try {
    peliculas = JSON.parse(longDescription);
  } catch {
    return <p className="text-xs text-conn-deep/80 leading-relaxed">{longDescription}</p>;
  }
  if (!Array.isArray(peliculas)) return <p className="text-xs text-conn-deep/80 leading-relaxed">{longDescription}</p>;
  return (
    <div className="space-y-2">
      <p className="text-xs font-extrabold text-conn-deep">En cartelera esta semana:</p>
      {peliculas.map((peli, pIdx) => (
        <div key={pIdx} className="bg-conn-aqua rounded-2xl p-3 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-extrabold text-conn-deep leading-snug">{peli.titulo}</span>
            {peli.genero && (
              <span className="text-[10px] font-extrabold bg-conn-mist text-conn-tealDark px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                {peli.genero}
              </span>
            )}
          </div>
          {peli.sinopsis && <p className="text-[11px] text-conn-muted leading-snug">{peli.sinopsis}</p>}
          {peli.url && String(peli.url).startsWith('https://') && (
            <a
              href={peli.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] font-extrabold text-conn-tealDark hover:underline"
            >
              <ConnExtern className="w-2.5 h-2.5" />
              Entradas / Horarios
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

export function PlanWhy({ text, tone = 'amber' }) {
  if (!text) return null;
  const cls =
    tone === 'blue' || tone === 'teal'
      ? 'bg-conn-mist text-conn-deep'
      : 'bg-conn-amberSoft text-conn-deep';
  return (
    <div className={`flex items-start gap-2 rounded-2xl p-3 ${cls}`}>
      <ConnSpark className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-conn-tealDark" />
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
      className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-conn-tealDark hover:underline"
    >
      <ConnExtern className="w-3 h-3" />
      Más información
    </a>
  );
}

export function FeedStatusLine({ lastSyncedAt, stale, light = false }) {
  if (!lastSyncedAt) return null;
  const mins = Math.max(0, Math.round((Date.now() - lastSyncedAt) / 60000));
  const label = mins < 1 ? 'actualizado hace un momento' : mins < 60 ? `actualizado hace ${mins} min` : `actualizado hace ${Math.round(mins / 60)} h`;
  const cls = light
    ? 'text-white/80'
    : (stale ? 'text-conn-amber font-bold' : 'text-conn-muted');
  return (
    <p className={`text-[11px] mt-1 ${cls}`} role="status">
      {label}
      {stale ? ' · usando caché anterior' : ''}
    </p>
  );
}
