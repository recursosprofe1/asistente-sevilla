// recoService.js — recomendaciones (series, pelis, sitios) sin dependencias.
// Lo usan la app (navegador) y la cocina (Node): nada de Dexie aquí,
// la base llega como parámetro. Coste 0, 100% local el perfil.

export const TASTE_SEED = {
  series: {
    genres: ['Drama', 'Comedia', 'Crimen', 'Ciencia ficción', 'Documental'],
    avoid: ['Terror', 'Realities', 'Telenovelas'],
    finishedFirst: true,
    episodeLength: 'indiferente',
    audio: 'VOSE',
    pace: 'mezcla',
    refs: ['True Detective', 'Severance'],
    platforms: ['Netflix', 'Prime Video', 'Filmin', 'Stremio']
  },
  movies: {
    genres: ['Drama', 'Thriller', 'Ciencia ficción'],
    spanish: 'algo',
    era: 'Últimos 10 años',
    maxDuration: 'indiferente',
    company: 'Pareja',
    horror: true,
    refs: ['Origen'],
    platforms: ['Netflix', 'Prime Video', 'Filmin', 'Stremio']
  },
  food: {
    cuisines: ['Andaluza', 'Tradicional', 'Italiana', 'Asiática'],
    price: 'de todo',
    zones: ['Sevilla capital', 'Área metropolitana'],
    diet: 'ninguna',
    moments: ['Tapeo', 'Comidas', 'Cenas'],
    chains: true
  }
};

function topTags(items, key, limit = 6) {
  const counts = {};
  for (const it of items) {
    const vals = it[key] || it.tags || [];
    for (const v of (Array.isArray(vals) ? vals : [vals])) {
      if (!v) continue;
      counts[v] = (counts[v] || 0) + 1;
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([v, n]) => `${v} x${n}`);
}

// Perfil efectivo = semilla del cuestionario + favoritos (gusta) y papelera (evitar).
export async function getTasteProfile(db) {
  const profile = JSON.parse(JSON.stringify(TASTE_SEED));
  try {
    for (const table of ['series', 'movies', 'places']) {
      const all = await db.table(table).toArray();
      const liked = all.filter((r) => r.userStatus === 'interested' || r.status === 'interested');
      const disliked = all.filter((r) => r.userStatus === 'discarded' || r.status === 'discarded');
      if (liked.length > 0 || disliked.length > 0) {
        const key = table === 'series' ? 'series' : table === 'movies' ? 'movies' : 'food';
        profile[key].learnedLikes = topTags(liked, table === 'places' ? 'cuisine' : 'genres');
        profile[key].learnedAvoid = topTags(disliked, table === 'places' ? 'cuisine' : 'genres');
        if (table === 'places') {
          const zones = topTags(liked, 'zone', 4).map((s) => s.replace(/ x\d+$/, ''));
          if (zones.length > 0) profile.food.learnedZones = zones;
        }
      }
    }
  } catch {
    // Sin tablas aún: vale la semilla.
  }
  return profile;
}

// ── IDs estables (sin índice: no cambian si se reordena) ──
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

function stableRecoId(prefix, p) {
  if (p.id) return String(p.id);
  const base = [prefix, p.title || '', p.venue || '', p.year || ''].join('|');
  return `${prefix}-${hashString(base)}`;
}

function cleanUrl(u) {
  if (!u) return '';
  const s = String(u).trim();
  if (/^https:\/\//i.test(s)) return s;
  return '';
}

export function normalizeSerie(p, now) {
  return {
    id: stableRecoId('serie', p),
    title: p.title || 'Serie sugerida',
    year: p.year || null,
    seasons: p.seasons ?? null,
    finished: p.finished !== false,
    genres: Array.isArray(p.genres) ? p.genres.map(String) : [],
    platforms: Array.isArray(p.platforms) ? p.platforms.map(String) : [],
    summary: p.summary || '',
    whyMatch: p.whyMatch || 'Elegida según tus gustos.',
    sourceUrl: cleanUrl(p.sourceUrl),
    lastSeenAt: now,
    lastSyncedAt: now,
    feedStatus: 'active'
  };
}

export function normalizeMovie(p, now) {
  return {
    id: stableRecoId('movie', p),
    title: p.title || 'Película sugerida',
    year: p.year || null,
    durationMin: p.durationMin ?? null,
    genres: Array.isArray(p.genres) ? p.genres.map(String) : [],
    platforms: Array.isArray(p.platforms) ? p.platforms.map(String) : [],
    summary: p.summary || '',
    whyMatch: p.whyMatch || 'Elegida según tus gustos.',
    sourceUrl: cleanUrl(p.sourceUrl),
    lastSeenAt: now,
    lastSyncedAt: now,
    feedStatus: 'active'
  };
}

export function normalizePlace(p, now) {
  return {
    id: stableRecoId('place', p),
    title: p.title || p.name || 'Sitio sugerido',
    cuisine: p.cuisine || 'Varia',
    zone: p.zone || 'Sevilla',
    priceText: p.priceText || 'Consultar',
    famousDish: p.famousDish || '',
    moments: Array.isArray(p.moments) ? p.moments.map(String) : [],
    summary: p.summary || '',
    whyMatch: p.whyMatch || 'Elegido según tus gustos.',
    sourceUrl: cleanUrl(p.sourceUrl),
    lastSeenAt: now,
    lastSyncedAt: now,
    feedStatus: 'active'
  };
}

// ── Prompts de la cocina (con perfil de gustos) ──
export function buildAudiovisualPrompt(profile) {
  const s = profile.series, m = profile.movies;
  return [
    'Actúa como programador personal de series y cine para una persona en Sevilla.',
    'Devuelve SOLO un JSON válido (sin markdown) con esta forma exacta:',
    '{ "series": [ { "title": "string", "year": 2020, "seasons": 3, "finished": true,',
    '  "genres": ["Drama"], "platforms": ["Netflix"],',
    '  "summary": "1-2 frases sin destripes",',
    '  "whyMatch": "1 frase + plataformas donde verla",',
    '  "sourceUrl": "https://… (ficha real: filmaffinity, TMDB o similar)" } ],',
    '  "movies": [ { "title": "string", "year": 2022, "durationMin": 130,',
    '  "genres": ["Thriller"], "platforms": ["Prime Video"],',
    '  "summary": "1-2 frases sin destripes", "whyMatch": "1 frase",',
    '  "sourceUrl": "https://… (ficha real)" } ] }',
    'REPARTO OBLIGATORIO: 5 series + 5 películas.',
    `SERIES (gustos: ${s.genres.join(', ')}; evitar: ${s.avoid.join(', ')}; preferencia TERMINADAS (${s.finishedFirst ? 'prioriza terminadas, valen en curso' : 'indiferente'}); audio ${s.audio}; ritmo ${s.pace}; le marcaron: ${s.refs.join(', ')}; ve en: ${s.platforms.join(', ')}.`,
    s.learnedLikes?.length ? `Aprendido que le gusta: ${s.learnedLikes.join(', ')}.` : '',
    s.learnedAvoid?.length ? `Aprendido que evita: ${s.learnedAvoid.join(', ')}.` : '',
    `PELIS (gustos: ${m.genres.join(', ')}; cine español: ${m.spanish}; época: ${m.era}; terror: ${m.horror ? 'sí vale' : 'no'}; la ve en: ${m.company}; le marcó: ${m.refs.join(', ')}; plataformas: ${m.platforms.join(', ')}.`,
    m.learnedLikes?.length ? `Aprendido que le gusta: ${m.learnedLikes.join(', ')}.` : '',
    m.learnedAvoid?.length ? `Aprendido que evita: ${m.learnedAvoid.join(', ')}.` : '',
    'Prohibido inventar plataformas: si no sabes dónde está, pon "Consultar". Solo títulos reales y conocidos.'
  ].filter(Boolean).join('\n');
}

export function buildFoodPrompt(profile) {
  const f = profile.food;
  return [
    'Actúa como guía gastronómico local de Sevilla capital y área metropolitana.',
    'Devuelve SOLO un JSON válido (sin markdown) con esta forma exacta:',
    '{ "places": [ { "title": "nombre del sitio (obligatorio, real y existente)",',
    '  "cuisine": "Andaluza | Tradicional | Italiana | Asiática | ...",',
    '  "zone": "barrio o municipio (obligatorio)",',
    '  "priceText": "rango por persona, ej 15-25 € (obligatorio aproximar, nunca inventar de más)",',
    '  "famousDish": "su plato famoso (obligatorio)",',
    '  "moments": ["Tapeo", "Comidas", "Cenas"],',
    '  "summary": "1 frase del sitio",',
    '  "whyMatch": "1 frase por qué le pega",',
    '  "sourceUrl": "https://… (Google Maps o web real del sitio)" } ] }',
    'REPARTO OBLIGATORIO: 10 sitios, variando cocinas y barrios (no repetir los de semanas anteriores si los conoces por el contexto).',
    `GUSTOS: cocinas ${f.cuisines.join(', ')}; precio ${f.price}; dieta: ${f.diet}; momentos: ${f.moments.join(', ')}; cadenas: ${f.chains ? 'valen' : 'solo locales'}.`,
    f.learnedLikes?.length ? `Aprendido que le gusta: ${f.learnedLikes.join(', ')}.` : '',
    f.learnedAvoid?.length ? `Aprendido que evita: ${f.learnedAvoid.join(', ')}.` : '',
    f.learnedZones?.length ? `Zonas que frecuenta: ${f.learnedZones.join(', ')}.` : '',
    'Solo sitios reales de Sevilla capital o área metropolitana (Dos Hermanas, Alcalá, Mairena, Bormujos, Camas, etc.). Si no conoces el plato famoso o el precio, pon "Consultar" antes que inventar.'
  ].filter(Boolean).join('\n');
}

// ── Sincronización genérica: preserva favorito/papelera del usuario ──
export async function syncRecosFromFeed(db, table, normalize, incomingRaw) {
  const now = Date.now();
  const incoming = (Array.isArray(incomingRaw) ? incomingRaw : [])
    .map((p) => normalize(p, now))
    .filter((p) => p.title);
  const existing = await db.table(table).toArray();
  const existingMap = new Map(existing.map((p) => [p.id, p]));
  const incomingIds = new Set(incoming.map((p) => p.id));

  let added = 0;
  const toPut = incoming.map((p) => {
    const prev = existingMap.get(p.id);
    if (!prev) {
      added += 1;
      return { ...p, status: 'available', userStatus: 'new', interestedAt: null, discardedAt: null };
    }
    return {
      ...p,
      status: prev.status ?? 'available',
      userStatus: prev.userStatus ?? 'new',
      interestedAt: prev.interestedAt ?? null,
      discardedAt: prev.discardedAt ?? null
    };
  });

  // Los que ya no vienen: favoritos se conservan visibles; el resto pasa a stale.
  let stale = 0;
  for (const prev of existing) {
    if (incomingIds.has(prev.id)) continue;
    const fav = prev.userStatus === 'interested' || prev.status === 'interested';
    if (fav) {
      toPut.push({ ...prev, lastSyncedAt: now });
    } else if (prev.feedStatus === 'active' || !prev.feedStatus) {
      stale += 1;
      toPut.push({ ...prev, feedStatus: 'stale', lastSyncedAt: now });
    }
  }

  await db.table(table).bulkPut(toPut);
  return { added, total: toPut.length, stale };
}
