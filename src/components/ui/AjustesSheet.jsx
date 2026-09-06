import React, { useState, useEffect } from 'react';
import { FGlyph } from '../illustrations/NotoBadges';
import { db } from '../../db';
import { getTasteProfile } from '../../services/recoService';
import { quizáSubirPerfil } from '../../services/profileSync';

const FAMILIAS = [
  { key: 'series', label: 'Series' },
  { key: 'movies', label: 'Películas' },
  { key: 'food', label: 'Para comer' }
];

function TagRow({ label, tags, tone }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex items-start gap-2 flex-wrap">
      <span className={`text-[10px] font-black uppercase tracking-wider mt-1 w-16 flex-shrink-0 ${tone === 'avoid' ? 'text-conn-muted/70' : 'text-conn-tealDark'}`}>
        {label}
      </span>
      <div className="flex gap-1 flex-wrap">
        {tags.map((t) => (
          <span key={t} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tone === 'avoid' ? 'bg-conn-aqua text-conn-muted line-through decoration-conn-muted/40' : 'bg-conn-mist text-conn-tealDark'}`}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// Ajustes: qué ha aprendido la app, y activación del envío automático
// del perfil a la cocina (token pegado una vez; luego todo solo).
export default function AjustesSheet({ open, onClose }) {
  const [profile, setProfile] = useState(null);
  const [meta, setMeta] = useState(null);
  const [hasToken, setHasToken] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [p, tok, sync] = await Promise.all([
      getTasteProfile(db),
      db.preferences.get('ghToken'),
      db.preferences.get('profileSync')
    ]);
    setProfile(p);
    setHasToken(Boolean(tok?.value));
    setMeta(sync?.value || null);
  };

  useEffect(() => {
    if (open) { setMsg(''); load(); }
  }, [open]);

  if (!open) return null;

  const guardarYProbar = async () => {
    const t = tokenInput.trim();
    if (!t) return;
    setBusy(true);
    setMsg('');
    await db.preferences.put({ key: 'ghToken', value: t });
    setHasToken(true);
    const res = await quizáSubirPerfil(db, { force: true }).catch(() => ({ ok: false, error: 'error de red' }));
    setBusy(false);
    setTokenInput('');
    setMsg(res.ok ? 'Perfil subido: la próxima generación ya lo usará' : `No funcionó: ${res.error || res.skipped || 'razón desconocida'}`);
    load();
  };

  const borrarToken = async () => {
    await db.preferences.delete('ghToken');
    await db.preferences.delete('profileSync');
    setHasToken(false);
    setMsg('Token borrado: la app deja de subir nada (el aprendizaje local sigue igual)');
    load();
  };

  const haceUnEnvio = meta?.lastAt
    ? ` · último envío: ${new Date(meta.lastAt).toLocaleDateString('es-ES')}${meta.lastOk ? ' ✓' : ` ✗ (${meta.error || 'error'})`}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Ajustes" onClick={onClose}>
      <div className="absolute inset-0 bg-conn-deep/50" />
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 space-y-4"
        style={{ boxShadow: '0 -10px 40px -12px rgba(11, 59, 66, 0.45)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-theme-title text-[17px] font-black text-conn-deep">Ajustes</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar ajustes" className="w-10 h-10 rounded-full bg-conn-aqua flex items-center justify-center active:scale-90">
            <FGlyph name="x" size={18} />
          </button>
        </div>

        <section className="space-y-2">
          <p className="text-xs font-black text-conn-deep">Lo que he aprendido de ti</p>
          <p className="text-[11px] font-semibold text-conn-muted leading-relaxed">
            Se recalcula solo, con tus toques de esta semana y los de siempre (lo antiguo pesa menos, pero nunca se olvida del todo).
          </p>
          {!profile && <p className="text-xs text-conn-muted">Cargando…</p>}
          {profile && FAMILIAS.map((f) => (
            <div key={f.key} className="bg-conn-aqua/50 rounded-2xl p-3 space-y-1.5">
              <p className="text-[11px] font-black text-conn-deep">{f.label}</p>
              <TagRow label="Gusta" tags={profile[f.key]?.learnedLikes} />
              <TagRow label="Evita" tags={profile[f.key]?.learnedAvoid} tone="avoid" />
              {f.key === 'food' && profile.food?.learnedZones?.length > 0 && (
                <TagRow label="Zonas" tags={profile.food.learnedZones} />
              )}
              {!profile[f.key]?.learnedLikes?.length && !profile[f.key]?.learnedAvoid?.length && (
                <p className="text-[11px] text-conn-muted/80">Aún sin señales: marca corazones, "Ya fui" o "No me gusta" y aquí aparecerán.</p>
              )}
            </div>
          ))}
        </section>

        <section className="space-y-2">
          <p className="text-xs font-black text-conn-deep">Compartir mis gustos con la cocina</p>
          <p className="text-[11px] font-semibold text-conn-muted leading-relaxed">
            Si activas el envío, tras sincronizar la app sube sola <b>solo estas etiquetas</b> (nunca títulos concretos de tus descartes)
            a un fichero del repositorio para que la IA las use al generar el feed. Un token de GitHub con permiso mínimo, pegado una vez.
          </p>
          {hasToken && (
            <p className="text-[11px] font-bold text-conn-tealDark">Envío automático: ACTIVO{haceUnEnvio}</p>
          )}
          {!hasToken && tokenInput === '' && (
            <p className="text-[11px] font-bold text-conn-muted">Envío automático: desactivado (todo sigue aprendiendo en tu móvil)</p>
          )}
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder={hasToken ? 'Nuevo token (opcional)' : 'Pega tu token fine-grained (Contents:RW)'}
              className="flex-1 min-w-0 text-xs font-semibold border-2 border-conn-aqua rounded-full px-3 py-2.5 focus:outline-none focus:border-conn-teal bg-white text-conn-deep min-h-[44px]"
              autoComplete="off"
              aria-label="Token de GitHub"
            />
            <button
              type="button"
              onClick={guardarYProbar}
              disabled={busy || !tokenInput.trim()}
              className="px-4 py-2.5 rounded-full text-xs font-black bg-conn-teal text-white min-h-[44px] active:scale-95 disabled:opacity-50"
            >
              {busy ? 'Enviando…' : 'Probar'}
            </button>
          </div>
          {hasToken && (
            <button type="button" onClick={borrarToken} className="text-[11px] font-bold text-conn-muted hover:text-red-500 min-h-[36px]">
              Desactivar y borrar token
            </button>
          )}
          {msg && <p className="text-[11px] font-bold text-conn-deep" role="status">{msg}</p>}
        </section>
      </div>
    </div>
  );
}
