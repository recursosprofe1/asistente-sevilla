// Repesca de favoritos consumidos: un sitio/serie/peli marcado como
// "Ya fui/Vista → se queda en favoritos" sale de la lista principal y, al
// cabo de REPESCA_AFTER_MS, puede volver a proponerse. Regla pactada:
// MÁXIMO UNA repesca por semana (rota de forma determinista por número ISO,
// empezando por la más antigua).

export const REPESCA_AFTER_MS = 30 * 86400000;

export function isRepescable(candidate, nowMs) {
  return Boolean(candidate && candidate.seenAt && nowMs - Number(candidate.seenAt) >= REPESCA_AFTER_MS);
}

// candidates: objetos con { seenAt } de cualquier familia. Devuelve uno o null.
export function pickRepesca(candidates, weekNumber, nowMs = Date.now()) {
  const eligible = (candidates || [])
    .filter((c) => isRepescable(c, nowMs))
    .sort((a, b) => Number(a.seenAt) - Number(b.seenAt));
  if (eligible.length === 0) return null;
  return eligible[weekNumber % eligible.length];
}
