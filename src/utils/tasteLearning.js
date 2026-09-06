// Aprendizaje con memoria que se desvanece, nunca borrosa:
// · Decisión de los últimos FULL_WEIGHT_DAYS (6 meses): peso 1.
// · Más antigua: decaimiento exponencial con vida media HALF_LIFE_DAYS.
// · Suelo MIN_WEIGHT: nada se olvida del todo (el terror descartado hace
//   dos años sigue contando, poco; si vuelve a pasar algo, revive rápido).

export const FULL_WEIGHT_DAYS = 180;
export const HALF_LIFE_DAYS = 180;
export const MIN_WEIGHT = 0.15;
const DIA_MS = 86400000;

export function decayWeight(ageDays) {
  if (!(ageDays >= 0)) return 0;
  if (ageDays <= FULL_WEIGHT_DAYS) return 1;
  return Math.max(MIN_WEIGHT, Math.pow(0.5, (ageDays - FULL_WEIGHT_DAYS) / HALF_LIFE_DAYS));
}

// Momento de la última decisión útil de un registro (tocar manda sobre ver).
export function decisionTimeMs(r) {
  if (!r) return null;
  const ts = [r.interestedAt, r.seenAt, r.discardedAt, r.lastSeenAt]
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);
  return ts.length ? Math.max(...ts) : null;
}

// Etiquetas más determinantes, ponderadas por cercanía en el tiempo.
// Devuelve [{ tag, score }] con score redondeado a 1 decimal (sin ceros).
export function weightedTopTags(items, key, nowMs = Date.now(), limit = 6) {
  const counts = new Map();
  for (const it of items || []) {
    const vals = it[key] || it.tags || [];
    const at = decisionTimeMs(it);
    const ageDays = at ? Math.max(0, (nowMs - at) / DIA_MS) : 3650;
    const w = decayWeight(ageDays);
    for (const v of Array.isArray(vals) ? vals : [vals]) {
      if (!v) continue;
      counts.set(v, (counts.get(v) || 0) + w);
    }
  }
  return [...counts.entries()]
    .map(([tag, score]) => ({ tag, score: Math.round(score * 10) / 10 }))
    .sort((a, b) => b.score - a.score || a.tag.localeCompare(b.tag, 'es'))
    .slice(0, limit);
}

// Formato para el prompt y la transparencia: "Ciencia ficción x4" / "x1.5".
export function formatTagScore(t) {
  return `${t.tag} x${String(t.score).replace(/\.0$/, '')}`;
}

export function parseTagScore(s) {
  const m = String(s || '').match(/^(.*) x([\d.]+)$/);
  return m ? { tag: m[1], score: Number(m[2]) } : { tag: String(s || ''), score: 1 };
}
