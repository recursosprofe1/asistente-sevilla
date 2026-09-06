// profileSync.js — sube el perfil aprendido a GitHub para que la cocina lo
// use en la siguiente generación. Automático tras cada sync, con token que
// el usuario pega UNA sola vez en Ajustes (fine-grained PAT, Contents:RW y
// rama main, de este repo). Coste 0.
//
// Privacidad (opción A pactada): solo viajan etiquetas agregadas con su
// puntuación ("Ciencia ficción x4"); NUNCA títulos concretos, favoritos ni
// descartes: el veto de títulos lo aplica la app en local por IDs estables.

import { getTasteProfile } from './recoService.js';

export const GH_OWNER = 'recursosprofe1';
export const GH_REPO = 'asistente-sevilla';
export const GH_PROFILE_PATH = 'perfil.json';
const UN_DIA_MS = 86400000;

// Payload mínimo y estable: solo lo aprendido.
export function buildProfilePayload(profile, now = new Date()) {
  const pick = (o) => ({
    learnedLikes: o?.learnedLikes || [],
    learnedAvoid: o?.learnedAvoid || [],
    ...(o?.learnedZones ? { learnedZones: o.learnedZones } : {})
  });
  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    series: pick(profile.series),
    movies: pick(profile.movies),
    food: pick(profile.food)
  };
}

function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// Hash del contenido SIN la marca de tiempo: si los gustos no cambian, no subimos.
export function profileHash(payload) {
  const { generatedAt, ...rest } = payload;
  void generatedAt;
  return djb2(JSON.stringify(rest));
}

export function encodeB64(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export async function uploadProfile({ token, payload, owner = GH_OWNER, repo = GH_REPO, fetchImpl = fetch }) {
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${GH_PROFILE_PATH}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  try {
    let sha = null;
    const cur = await fetchImpl(api + '?ref=main', { headers });
    if (cur.status === 200) {
      sha = (await cur.json())?.sha || null;
    } else if (cur.status !== 404) {
      throw new Error(`GitHub respondió ${cur.status} al leer perfil.json`);
    }
    const body = {
      message: `Perfil de gustos ${new Date().toISOString().slice(0, 10)} [skip ci]`,
      content: encodeB64(payload),
      branch: 'main',
      ...(sha ? { sha } : {})
    };
    const put = await fetchImpl(api, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (!put.ok) {
      const t = await put.text().catch(() => '');
      throw new Error(`GitHub respondió ${put.status}: ${t.slice(0, 160)}`);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

// Llamada tras un sync OK: silenciosa, como mucho 1 envío/día, solo si el
// contenido del perfil cambió. Sin token, no hace nada (fases futuras: Ajustes).
export async function quizáSubirPerfil(db, { force = false, now = new Date(), fetchImpl } = {}) {
  try {
    const tokenPref = await db.preferences.get('ghToken');
    const token = tokenPref?.value;
    if (!token) return { skipped: 'sin-token' };

    const profile = await getTasteProfile(db, now.getTime());
    const payload = buildProfilePayload(profile, now);
    const hash = profileHash(payload);

    const metaPref = (await db.preferences.get('profileSync'))?.value || {};
    if (!force && metaPref.lastHash === hash) return { skipped: 'sin-cambios' };
    if (!force && metaPref.lastAt && now.getTime() - metaPref.lastAt < UN_DIA_MS) return { skipped: 'throttle' };

    const res = await uploadProfile({ token, payload, fetchImpl });
    await db.preferences.put({
      key: 'profileSync',
      value: {
        ...metaPref,
        lastAt: now.getTime(),
        lastHash: res.ok ? hash : metaPref.lastHash || null,
        lastOk: res.ok,
        error: res.ok ? null : res.error || 'fallo desconocido'
      }
    });
    return res;
  } catch {
    // El perfil es lo último que puede romper un sync: silencio absoluto.
    return { skipped: 'error' };
  }
}
