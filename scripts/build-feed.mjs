#!/usr/bin/env node
/**
 * Cocina del feed — Asistente Sevilla (v4 pool 50, sin Tavily, coste 0).
 *
 * Uso:
 *   node scripts/build-feed.mjs --check-sources   # solo prueba lectura (sin clave)
 *   GEMINI_KEY=xxx node scripts/build-feed.mjs     # ejecución completa → feeds/
 *
 * Cada semana: 8 fijas + 12-14 rotativas del pool (grupo por semana ISO).
 * Modelo gratis: gemini-2.5-flash (texto + grounding gratis en free tier).
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
  TASTE_SEED, buildAudiovisualPrompt, buildFoodPrompt,
  normalizeSerie, normalizeMovie, normalizePlace
} from '../src/services/recoService.js';

const GEMINI_KEY = process.env.GEMINI_KEY || '';
// 2.0 jubilado 01/06/2026 · 2.x bloqueado a cuentas nuevas → 3.6-flash (estable).
// Cadena de repuesto: si un modelo muere otro día, se prueba el siguiente solo.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GEMINI_FALLBACKS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];
const CHECK_ONLY = process.argv.includes('--check-sources');
const VALID_DAYS = 8;

const QUOTA_SEVILLA = 15;
const QUOTA_HUELVA_CADIZ = 10;
const QUOTA_RUTAS = 5;
const QUOTA_CATS = { 'Música': 5, 'Teatro y espectáculos': 5, 'Arte': 4, 'Gastronomía': 3 };
const CATEGORIES_CLOSED = ['Rutas y naturaleza', 'Música', 'Teatro y espectáculos', 'Gastronomía', 'Arte', 'Varios', 'Cine'];

// Excluidos siempre (doble barrera: prompt + filtro). Incluye flamenco por dirección.
const EXCLUDED_RE = /deport|futbol|baloncesto|tenis|padel|maraton|media maraton|carrera popular|ciclismo|toros?|taurin|corrida|novillada|rejone|procesion|semana santa|misa|eucaristia|rosario|cofrad|via crucis|triduo|besamanos|flamenco|cante jondo|bailaor|cantaora|bienal de flamenco/i;

// ── 8 fijas (todas las semanas) ─────────────────────────────────
const FRESH_FIXED = [
  { name: 'ICAS Sevilla', url: 'https://icas.sevilla.org/agenda', zona: 'Sevilla' },
  { name: 'Agenda Junta Sevilla', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/sevilla', zona: 'Sevilla' },
  { name: 'Ayto Sevilla agenda', url: 'https://www.sevilla.org/ayuntamiento/alcaldia/comunicacion/calendario/agenda-actividades', zona: 'Sevilla' },
  { name: 'Agenda Junta Huelva', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/huelva', zona: 'Huelva' },
  { name: 'Huelva costa (Ayamonte)', url: 'https://www.ayamonte.es/', zona: 'Huelva' },
  { name: 'Agenda Junta Cádiz', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/cadiz', zona: 'Cádiz' },
  { name: 'Agenda Cádiz capital', url: 'https://institucional.cadiz.es/eventos', zona: 'Cádiz' },
  { name: 'Vías Verdes', url: 'https://www.viasverdes.com/', zona: 'Rutas' },
];

// ── Pool 50 (grupo A/B/C/D, rota por semana ISO)
// Verificado lectura OK el 2026-09-05 salvo marcas (hc = misma web/CMS que su
// matriz verificada; refuerzo = URL de otra semana reutilizada otro día, sin
// choque porque cada ejecución solo lee su grupo + fijas).
const POOL = [
  // SEVILLA A
  { name: 'Lope de Vega', url: 'https://www.sevilla.org/teatro-lope-de-vega/eventos', zona: 'Sevilla', grupo: 'A' },
  { name: 'Sala Cero', url: 'https://www.salacero.com/', zona: 'Sevilla', grupo: 'A' },
  { name: 'ROSS', url: 'https://www.rossevilla.es/', zona: 'Sevilla', grupo: 'A' },
  { name: 'Junta expos Sevilla', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/exposiciones-en-sevilla', zona: 'Sevilla', grupo: 'A' },
  { name: 'Santa Clara', url: 'https://icas.sevilla.org/espacios/espacio-santa-clara', zona: 'Sevilla', grupo: 'A' },
  { name: 'Lebrija', url: 'https://www.lebrija.es/', zona: 'Sevilla', grupo: 'A' },
  { name: 'Visita Sevilla', url: 'https://visitasevilla.es/', zona: 'Sevilla', grupo: 'A' },
  // SEVILLA B
  { name: 'Agenda Sevilla', url: 'https://www.agendadesevilla.com/', zona: 'Sevilla', grupo: 'B' },
  { name: 'Fundación Cajasol', url: 'https://fundacioncajasol.com/', zona: 'Sevilla', grupo: 'B' },
  { name: 'Sala Custom', url: 'https://www.salacustom.com/', zona: 'Sevilla', grupo: 'B' },
  { name: 'Agenda expos', url: 'https://www.agendadesevilla.com/exposiciones/', zona: 'Sevilla', grupo: 'B' },
  { name: 'Atín Aya', url: 'https://icas.sevilla.org/espacios/atin-aya', zona: 'Sevilla', grupo: 'B' },
  { name: 'Teatro Sevilla (agenda)', url: 'https://www.agendadesevilla.com/teatro/', zona: 'Sevilla', grupo: 'B' },
  // SEVILLA C
  { name: 'Teatro Alameda', url: 'https://icas.sevilla.org/espacios/teatro-alameda', zona: 'Sevilla', grupo: 'C' },
  { name: 'Cartuja Center', url: 'https://cartujacenter.com/', zona: 'Sevilla', grupo: 'C' },
  { name: 'Conciertos Sevilla (agenda)', url: 'https://www.agendadesevilla.com/conciertos/', zona: 'Sevilla', grupo: 'C' },
  { name: 'Antiquarium', url: 'https://icas.sevilla.org/espacios/antiquarium', zona: 'Sevilla', grupo: 'C' },
  { name: 'Lonja del Barranco', url: 'https://www.mercadodelbarranco.com/', zona: 'Sevilla', grupo: 'C' },
  { name: 'Santiponce Ayto', url: 'https://www.santiponce.es/', zona: 'Sevilla', grupo: 'C' },
  // SEVILLA D
  { name: 'Maestranza', url: 'https://www.teatrodelamaestranza.es/temporadas/', zona: 'Sevilla', grupo: 'D' },
  { name: 'Espacio Turina', url: 'https://icas.sevilla.org/espacios/espacio-turina', zona: 'Sevilla', grupo: 'D' },
  { name: 'CaixaForum (refuerzo Visita Sevilla)', url: 'https://visitasevilla.es/', zona: 'Sevilla', grupo: 'D' },
  { name: 'Osuna', url: 'https://www.osuna.es/', zona: 'Sevilla', grupo: 'D' },
  { name: 'Cerámica Triana', url: 'https://icas.sevilla.org/espacios/centro-ceramica', zona: 'Sevilla', grupo: 'D' },
  // HUELVA (6 directas + 2 refuerzos documentados)
  { name: 'entradas.huelva.es', url: 'https://entradas.huelva.es/', zona: 'Huelva', grupo: 'A' },
  { name: 'Diputación Huelva', url: 'https://www.diphuelva.es/cultura/', zona: 'Huelva', grupo: 'A' },
  { name: 'Huelva noticias', url: 'https://www.huelva.es/portal/es/noticias', zona: 'Huelva', grupo: 'B' },
  { name: 'Huelva cultura (refuerzo Dipu)', url: 'https://www.diphuelva.es/cultura/', zona: 'Huelva', grupo: 'B' },
  { name: 'Aracena (Junta)', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/aracena', zona: 'Huelva', grupo: 'C' },
  { name: 'Punta Umbría (Junta)', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/punta-umbria', zona: 'Huelva', grupo: 'D' },
  // CÁDIZ (6 directas + 2 refuerzos documentados)
  { name: 'Gran Teatro Falla', url: 'https://laciudad.cadiz.es/programacion-gran-teatro-falla.asp', zona: 'Cádiz', grupo: 'A' },
  { name: 'Cádiz cultura (programación)', url: 'https://institucional.cadiz.es/programacion_cultural', zona: 'Cádiz', grupo: 'A' },
  { name: 'Casa Iberoamérica', url: 'https://institucional.cadiz.es/area/Casa-de-Iberoamerica', zona: 'Cádiz', grupo: 'B' },
  { name: 'Baluarte Candelaria', url: 'https://institucional.cadiz.es/area/Baluarte-de-la-Candelaria', zona: 'Cádiz', grupo: 'C' },
  { name: 'Planeamos Diputación', url: 'https://www.dipucadiz.es/cultura/Varios/planeamos-2026/', zona: 'Cádiz', grupo: 'D' },
  { name: 'Diputación Cádiz', url: 'https://www.dipucadiz.es/', zona: 'Cádiz', grupo: 'D' },
  // RUTAS (8 directas + Vías Verdes en fijas)
  { name: 'Sierra Norte senderos', url: 'https://www.sierranortedesevilla.es/actividades/senderismo/senderos-sierra-norte-de-sevilla.html', zona: 'Rutas', grupo: 'A' },
  { name: 'Castañares Constantina', url: 'https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/los-casta%C3%B1ares/255035', zona: 'Rutas', grupo: 'A' },
  { name: 'Cazalla senderos', url: 'https://www.cazalla.org/senderos/', zona: 'Rutas', grupo: 'B' },
  { name: 'Doñana (Ministerio)', url: 'https://www.miteco.gob.es/es/parques-nacionales-oapn/red-parques-nacionales/parques-nacionales/donana.html', zona: 'Rutas', grupo: 'B' },
  { name: 'Grazalema (Ventana)', url: 'https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/sierra-de-grazalema/255035', zona: 'Rutas', grupo: 'C' },
  { name: 'Doñana itinerarios', url: 'https://www.miteco.gob.es/eu/parques-nacionales-oapn/red-parques-nacionales/parques-nacionales/donana/guia-visitante/itinerarios.html', zona: 'Rutas', grupo: 'C' },
  { name: 'Sierra Norte (Ventana)', url: 'https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/sierra-norte-de-sevilla/255035', zona: 'Rutas', grupo: 'D' },
  { name: 'Santiponce (Junta)', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/santiponce', zona: 'Sevilla', grupo: 'A' },
];

// Cartelera: los 4 cines pedidos (páginas eCartelera verificadas 2026-09-05).
// Las webs oficiales bloquean lectura automática (probado: 403/errores).
const CINE_SOURCES = [
  { cine: 'Yelmo Lagoh (Sevilla)', url: 'https://www.ecartelera.com/cines/yelmo-cines-premium-lagoh/', travelMinutes: 20 },
  { cine: 'Cinesur Nervión (Sevilla)', url: 'https://www.ecartelera.com/cines/446,0,1.html', travelMinutes: 10 },
  { cine: 'Avenida 5 Cines (Sevilla)', url: 'https://www.ecartelera.com/cines/149,0,1.html', travelMinutes: 10 },
  { cine: 'Metromar (Mairena del Aljarafe)', url: 'https://www.ecartelera.com/cines/576,0,1.html', travelMinutes: 25 },
];

function scrapeCineBlocks(rawHtml, src) {
  const items = [];
  // Estrategia 1: cabeceras h2-h4 + horarios cercanos (sobre texto limpio).
  const text = stripTags(rawHtml);
  const blocks = text.split(/<h[234][^>]*>/i).slice(1, 60);
  for (const b of blocks) {
    const title = b.split(/<\/h[234]>/i)[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!title || title.length < 2 || title.length > 80) continue;
    if (/cookies|aviso|menu|cartelera|sesiones|comprar|politica/i.test(title)) continue;
    const times = (b.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g) || []).slice(0, 8);
    if (!times.length) continue;
    items.push({ titulo: title, cine: src.cine, sesiones: times, url: src.url, travelMinutes: src.travelMinutes });
    if (items.length >= 12) return items;
  }
  // Estrategia 2 (eCartelera): enlaces /peliculas/<slug> + sesiones del tramo
  // (se usa el HTML crudo: los horarios fiables van en data-session-time).
  if (items.length < 3) {
    const parts = rawHtml.split(/\/peliculas\/([\w-]+)\//);
    for (let i = 1; i < parts.length; i += 2) {
      const slug = parts[i];
      const seg = parts[i + 1] || '';
      const attrTimes = [...new Set([...seg.matchAll(/data-session-time="([01]?\d:[0-5]\d)"/g)].map((m) => m[1]))].slice(0, 8);
      const anyTimes = [...new Set(seg.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g) || [])].slice(0, 8);
      const times = attrTimes.length > 0 ? attrTimes : anyTimes;
      if (!times.length) continue;
      const titulo = slug.replace(/-\d{4}$/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      if (items.some((x) => normTitle(x.titulo) === normTitle(titulo))) continue;
      items.push({ titulo, cine: src.cine, sesiones: times, url: src.url, travelMinutes: src.travelMinutes });
      if (items.length >= 12) break;
    }
  }
  return items;
}

// ── Utilidades ────────────────────────────────────────────────
function isoWeekNumber(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((t - first) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
}
const GROUP = (process.env.FEED_GROUP && 'ABCD'.includes(process.env.FEED_GROUP))
  ? process.env.FEED_GROUP
  : 'ABCD'[isoWeekNumber() % 4];

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'plan';
}
function md5hex(s) {
  return createHash('md5').update(String(s)).digest('hex');
}
function stableId(p) {
  if (p.id) return String(p.id);
  return 'ev-' + slugify(p.title) + '-' + md5hex([p.sourceUrl || '', p.title || '', p.startsAt || '', p.venue || ''].join('|')).slice(0, 8);
}
function normCat(c) {
  const t = String(c || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/ruta|sender|naturaleza|sierra|parque|excurs|trekking|paseo verde|via verde|embalse|marisma|playa|costa/.test(t)) return 'Rutas y naturaleza';
  if (/musica|concierto|opera|jazz/.test(t)) return 'Música';
  if (/teatro|danza|escena|espectaculo|circo|monologo|comedia|magia|musical/.test(t)) return 'Teatro y espectáculos';
  if (/gastronom|gastro|mercado|restaurante|tapas|cocina|vino|queso/.test(t)) return 'Gastronomía';
  if (/arte|exposici|museo|pintura|fotografia|escultura|galeria|patrimonio|contemporaneo/.test(t)) return 'Arte';
  if (/cine|pelicula|cartelera/.test(t)) return 'Cine';
  return 'Varios';
}
function noAccents(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
// Provincia por municipio (la cocina exige municipios reales; el filtro por
// subcadena solo no basta: "La Rinconada" o "Rota" también cuentan).
const ZONA_MUNICIPIO = {
  Sevilla: ['sevilla', 'rinconada', 'carmona', 'san nicolas', 'osuna', 'lebrija', 'santiponce', 'alcala', 'dos hermanas', 'utrera', 'ecija', 'mairena', 'bormujos', 'tomares', 'coria', 'guadaira', 'aljarafe', 'sierra norte', 'constantina', 'cazalla', 'alanis', 'guadalcanal', 'pedroso'],
  Huelva: ['huelva', 'bollullos', 'moguer', 'aracena', 'ayamonte', 'lepe', 'punta umbria', 'almonte', 'rocio', 'condado', 'odiel', 'colon'],
  Cádiz: ['cadiz', 'rota', 'olvera', 'bosque', 'grazalema', 'ubrique', 'tarifa', 'jerez', 'chiclana', 'puerto real', 'sanlucar', 'arcos', 'falla', 'iberoam'],
};
function zoneOf(municipality) {
  const m = noAccents(municipality).toLowerCase();
  for (const [zona, keys] of Object.entries(ZONA_MUNICIPIO)) {
    if (keys.some((k) => m.includes(k))) return zona;
  }
  return '';
}
function isExcluded(title, summary) { return EXCLUDED_RE.test(noAccents(title + ' | ' + (summary || ''))); }
function ruleTravel(municipality, isRuta) {
  if (isRuta) return 60;
  const m = noAccents(municipality).toLowerCase();
  if (/huelva|cadiz/.test(m)) return 80;
  if (/sevilla/.test(m)) return 15;
  return 35;
}
function coerceTravel(v, municipality, isRuta) {
  const n = Number(v);
  if (Number.isFinite(n) && n >= 5 && n <= 120) return Math.round(n);
  return ruleTravel(municipality, isRuta);
}
function normTitle(s) {
  return noAccents(s).toLowerCase().replace(/\b(3d|2d|4dx|imax|vo|vose|vos|doblada|subtitulada|estreno)\b/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function toIsoMadrid(d) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(d);
  const g = (t) => parts.find((p) => p.type === t).value;
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}:${g('second')}+01:00`;
}

async function fetchText(url, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      signal: ctrl.signal, redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AsistenteSevilla/1.0' },
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return await resp.text();
  } finally { clearTimeout(t); }
}
function stripTags(html) {
  return String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
}
function extractCandidates(html, baseUrl) {
  const items = [];
  const seen = new Set();
  const re = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]{3,120}?)<\/a>/gi;
  let m, count = 0;
  while ((m = re.exec(html)) && count < 400) {
    count++;
    let url = m[1];
    if (!/^https?:\/\//i.test(url)) {
      try { url = new URL(url, baseUrl).toString(); } catch { continue; }
      if (!/^https:\/\//i.test(url)) continue;
    }
    const title = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!title || title.length < 8 || title.length > 120) continue;
    if (/cookies|aviso legal|privacidad|menu|inicio|contacto|suscrib|newsletter|iniciar sesion|login/i.test(title)) continue;
    if (!/^https:\/\//i.test(url)) continue;
    if (seen.has(url + '|' + title)) continue;
    seen.add(url + '|' + title);
    const idx = m.index;
    const around = String(html).slice(Math.max(0, idx - 600), idx + 600).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const dm = around.match(/(\d{1,2}\s+de\s+[a-záéíóúñ]+|\d{1,2}[\/-]\d{1,2}([\/-]\d{2,4})?)/i);
    items.push({ title, url, dateHint: dm ? dm[0] : '', snippet: around.slice(0, 160) });
    if (items.length >= 12) break;
  }
  return items;
}

async function fetchSource(src) {
  const html = stripTags(await fetchText(src.url));
  const cands = extractCandidates(html, src.url);
  if (cands.length === 0) throw new Error('sin candidatos (HTML sin enlaces útiles)');
  return cands.map((c) => `- ${c.title} | ${c.url} | zona:${src.zona}${c.dateHint ? ' | fecha web:' + c.dateHint : ''} | ${c.snippet}`);
}

async function mapLimit(arr, limit, fn) {
  const out = [];
  for (let i = 0; i < arr.length; i += limit) {
    out.push(...await Promise.all(arr.slice(i, i + limit).map(fn)));
  }
  return out;
}

// ── Prueba de lectura ─────────────────────────────────────────
async function checkSources() {
  const rotating = POOL.filter((s) => s.grupo === GROUP);
  const all = [...FRESH_FIXED, ...rotating];
  console.log(`Grupo semanal: ${GROUP} (semana ISO ${isoWeekNumber()}) — ${all.length} fuentes (${FRESH_FIXED.length} fijas + ${rotating.length} rotativas)`);
  const results = await mapLimit(all, 4, async (src) => {
    try {
      const t0 = Date.now();
      const cands = await fetchSource(src);
      return { name: src.name, zona: src.zona, ok: true, ms: Date.now() - t0, n: cands.length };
    } catch (e) {
      return { name: src.name, zona: src.zona, ok: false, error: e.message || String(e) };
    }
  });
  // Cines
  for (const src of CINE_SOURCES) {
    try {
      const t0 = Date.now();
      const html = await fetchText(src.url);
      const allItems = scrapeCineBlocks(html, src);
      const n = allItems.length;
      results.push({ name: src.cine, zona: 'Cine', ok: n >= 3, ms: Date.now() - t0, n, error: n < 3 ? `solo ${n} títulos con horario` : undefined });
    } catch (e) {
      results.push({ name: src.cine, zona: 'Cine', ok: false, error: e.message || String(e) });
    }
  }
  const ok = results.filter((r) => r.ok);
  const bad = results.filter((r) => !r.ok);
  for (const r of results) {
    console.log(`${r.ok ? 'OK  ' : 'FALLO'} [${r.zona}] ${r.name}${r.ok ? ` (${r.n} cand, ${r.ms}ms)` : ` — ${r.error}`}`);
  }
  console.log(`\nResumen: ${ok.length}/${results.length} legibles.`);
  if (bad.length) { console.log('A sustituir: ' + bad.map((r) => r.name).join(', ')); process.exitCode = 2; }
}

// Llama a Gemini con cadena de repuesto. La clave viaja por cabecera
// (nunca en la URL) para que no salga en registros.
let MODEL_USED = '';
const MODEL_ATTEMPTS = [];
async function geminiGenerate(prompt) {
  const models = [GEMINI_MODEL, ...GEMINI_FALLBACKS.filter((m) => m !== GEMINI_MODEL)];
  let lastErr = null;
  for (const model of models) {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (!resp.ok) throw new Error(`Gemini ${model} HTTP ` + resp.status + ': ' + (await resp.text()).slice(0, 300));
      const text = (await resp.json()).candidates[0].content.parts[0].text;
      MODEL_USED = model;
      return { text };
    } catch (e) { lastErr = e; MODEL_ATTEMPTS.push(`${model}: ${(e.message || String(e)).slice(0, 160)}`); console.log('Repuesto: ' + e.message); }
  }
  throw lastErr;
}

// ── Ejecución completa ────────────────────────────────────────
async function fullRun() {
  if (!GEMINI_KEY) throw new Error('Falta GEMINI_KEY en el entorno (Secret del repo).');
  const rotating = POOL.filter((s) => s.grupo === GROUP);
  const all = [...FRESH_FIXED, ...rotating];
  const lines = [];
  const errors = [];
  const settled = await mapLimit(all, 4, async (src) => {
    try { return { src, lines: await fetchSource(src) }; }
    catch (e1) {
      await new Promise((r) => setTimeout(r, 3000));
      try { return { src, lines: await fetchSource(src) }; }
      catch (e2) { return { src, error: (e2.message || String(e2)) + ' (tras reintento)' }; }
    }
  });
  for (const r of settled) {
    if (r.lines) lines.push(...r.lines);
    else errors.push(`${r.src.name}: ${r.error}`);
  }
  const seenU = new Set();
  const deduped = lines.filter((l) => {
    const um = l.match(/https?:\/\/\S+/);
    const k = um ? um[0] : l;
    if (seenU.has(k)) return false;
    seenU.add(k);
    return true;
  });
  const context = deduped.join('\n').slice(0, 18000);

  const prompt = [
    'Actúa como curador de ocio para Sevilla, Huelva y Cádiz (capitales, provincias, costa y sierra).',
    'Devuelve SOLO un JSON válido (sin markdown) con esta forma exacta:',
    '{ "planes": [ {',
    '  "title": "string (obligatorio)",',
    '  "summary": "string (1-2 frases, sin tópicos tipo \'planazo imperdible\')",',
    '  "startsAt": "ISO con hora Europe/Madrid, ej 2026-09-12T20:30:00+02:00. Solo null si es RUTA de senderismo sin fecha",',
    '  "endsAt": "ISO o null",',
    '  "expiresAt": "ISO fin de venta/caducidad o null (rutas: null)",',
    '  "venue": "string (lugar concreto)", "municipality": "string (municipio real: Sevilla, Huelva, Cádiz, pueblo o paraje)",',
    '  "travelMinutes": 15 si Sevilla capital, 35 si provincia Sevilla, 80 si Huelva/Cádiz, 60 si ruta,',
    '  "priceText": "string (precio o \'Consultar\'/\'Gratis\' si lo sabes, nunca inventar)",',
    '  "categories": ["una de: ' + CATEGORIES_CLOSED.join(' | ') + '"],',
    '  "whyMatch": "string (1 frase + al final \'Reserva previa\' si exige reserva/entradas)",',
    '  "sourceUrl": "https://… (obligatorio, usa las URLs del contexto cuando encajen, no inventes enlaces)",',
    '  "sourceName": "string (nombre de la fuente)"',
    '} ] }',
    'REPARTO OBLIGATORIO (30 en total): 15 con municipality en Sevilla (capital/provincia),',
    '10 con municipality en Huelva o Cádiz (5+5 aprox.), y 5 de "Rutas y naturaleza"',
    '(senderismo, vías verdes, marismas, sierra, costa; pueden llevar startsAt null y no caducan).',
    'Dentro de los 25 con fecha, equilibra: mínimo 5 Música, 5 Teatro y espectáculos, 4 Arte, 3 Gastronomía.',
    'Antes de responder, CUENTA tu lista: si alguna cuota no llega al mínimo, añade más planes de esa zona/tipo hasta cumplirlo. Es obligatorio.',
    'PROHIBIDO: deporte, toros/tauro/corrida, actos religiosos (procesión, misa, cofradía) y flamenco.',
    'NO incluyas cine (va aparte). Solo eventos futuros (salvo rutas). Sin inventar precios ni horarios.',
    'CANDIDATOS REALES de las fuentes (úsalos como base, no inventes):',
    context || '(sin contexto: trabaja con tu conocimiento, pero con URLs https reales)',
  ].join('\n');

  const resp = await geminiGenerate(prompt);
  const raw = resp.text.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(raw);

  const planes = (parsed.planes || [])
    .filter((p) => {
      if (!p || !p.title || !p.sourceUrl || !/^https:\/\//i.test(p.sourceUrl)) return false;
      if (isExcluded(p.title, p.summary)) return false;
      const cat0 = normCat((p.categories && p.categories[0]) || '');
      if (cat0 !== 'Rutas y naturaleza' && !p.startsAt) return false;
      return true;
    })
    .map((p) => {
      const cats = (Array.isArray(p.categories) && p.categories.length ? p.categories : ['Varios'])
        .map(normCat).filter((c) => CATEGORIES_CLOSED.includes(c) && c !== 'Cine');
      const isRuta = cats[0] === 'Rutas y naturaleza';
      const withId = {
        ...p, id: stableId(p), categories: cats.length ? cats : ['Varios'],
        municipality: p.municipality || (isRuta ? 'Sierra de Sevilla' : 'Sevilla'),
        travelMinutes: coerceTravel(p.travelMinutes, p.municipality, isRuta),
      };
      if (isRuta) { withId.startsAt = p.startsAt || null; withId.expiresAt = null; }
      else if (!withId.expiresAt) withId.expiresAt = withId.endsAt || withId.startsAt;
      return withId;
    });

  let nSevilla = 0, nHC = 0, nRutas = 0;
  const counts = {};
  for (const p of planes) {
    const cat = normCat(p.categories[0]);
    counts[cat] = (counts[cat] || 0) + 1;
    if (cat === 'Rutas y naturaleza') { nRutas++; continue; }
    const z = zoneOf(p.municipality || '');
    if (z === 'Sevilla') nSevilla++;
    else if (z === 'Huelva' || z === 'Cádiz') nHC++;
  }
  const missing = [];
  if (nSevilla < QUOTA_SEVILLA) missing.push(`Sevilla ${nSevilla}/${QUOTA_SEVILLA}`);
  if (nHC < QUOTA_HUELVA_CADIZ) missing.push(`HuelvaCádiz ${nHC}/${QUOTA_HUELVA_CADIZ}`);
  if (nRutas < QUOTA_RUTAS) missing.push(`Rutas ${nRutas}/${QUOTA_RUTAS}`);
  for (const [c, q] of Object.entries(QUOTA_CATS)) {
    if ((counts[c] || 0) < q) missing.push(`${c} ${counts[c] || 0}/${q}`);
  }

  // Cartelera 4 cines con dedup cruzado
  const cineErrors = [];
  let items = [];
  for (const src of CINE_SOURCES) {
    try {
      items.push(...scrapeCineBlocks(await fetchText(src.url), src));
    } catch (e) { cineErrors.push(`${src.cine}: ${e.message || e}`); }
  }
  const byTitle = {};
  for (const m of items) {
    const key = normTitle(m.titulo);
    if (!key) continue;
    if (!byTitle[key]) byTitle[key] = { titulo: m.titulo, cines: [m.cine], sesiones: [...m.sesiones], url: m.url, travelMinutes: m.travelMinutes };
    else {
      if (!byTitle[key].cines.includes(m.cine)) byTitle[key].cines.push(m.cine);
      byTitle[key].sesiones = [...new Set([...byTitle[key].sesiones, ...m.sesiones])].slice(0, 8);
      byTitle[key].travelMinutes = Math.min(byTitle[key].travelMinutes, m.travelMinutes);
    }
  }
  // ── Series + pelis + sitios (con perfil de gustos + anti-repetición) ──
  // El aprendizaje fino vive en el móvil (reordena por tu perfil local);
  // aquí se garantiza semilla de gustos y no repetir lo ya servido.
  const now = new Date();
  const nowMs = now.getTime();
  const prevTitles = new Set();
  try {
    const prev = JSON.parse(readFileSync('feeds/feed-latest.json', 'utf8'));
    for (const k of ['series', 'movies', 'places']) {
      for (const it of (prev[k] || [])) {
        if (it && it.title) prevTitles.add(String(it.title).toLowerCase().trim());
      }
    }
  } catch { /* primera ejecución: sin anterior */ }
  const notBefore = (arr) => (arr || [])
    .filter((p) => p && p.title && !prevTitles.has(String(p.title).toLowerCase().trim()));

  let series = [], movies = [], places = [];
  const avMissing = [], foodMissing = [];
  try {
    const avRaw = (await geminiGenerate(buildAudiovisualPrompt(TASTE_SEED))).text
      .replace(/```json/g, '').replace(/```/g, '').trim();
    const av = JSON.parse(avRaw);
    const noTerror = (t) => !/terror|reality|telenovela/i.test(`${t.title || ''} ${(t.genres || []).join(' ')}`);
    const rawS = (av.series || []).length, rawM = (av.movies || []).length;
    series = notBefore(av.series).filter((p) => noTerror(p) && p.sourceUrl && /^https:\/\//i.test(p.sourceUrl)).map((p) => normalizeSerie(p, nowMs)).slice(0, 8);
    movies = notBefore(av.movies).filter((p) => p.sourceUrl && /^https:\/\//i.test(p.sourceUrl)).map((p) => normalizeMovie(p, nowMs)).slice(0, 8);
    console.log(`AV embudo: series ${rawS} brutas → ${series.length} válidas · pelis ${rawM} brutas → ${movies.length} válidas.`);
    series.forEach((s, i) => { if (i >= 5) s.reserve = true; });
    movies.forEach((m, i) => { if (i >= 5) m.reserve = true; });
    if (series.length < 8) avMissing.push(`Series ${series.length}/8`);
    if (movies.length < 8) avMissing.push(`Pelis ${movies.length}/8`);
  } catch (e) {
    avMissing.push('Series/pelis: fallo IA (' + String(e.message || e).slice(0, 120) + ')');
  }
  try {
    const foodRaw = (await geminiGenerate(buildFoodPrompt(TASTE_SEED))).text
      .replace(/```json/g, '').replace(/```/g, '').trim();
    const food = JSON.parse(foodRaw);
    const rawP = (food.places || []).length;
    places = notBefore(food.places)
      .filter((p) => p.zone && p.sourceUrl && /^https:\/\//i.test(p.sourceUrl))
      .map((p) => normalizePlace(p, nowMs)).slice(0, 14);
    console.log(`Comer embudo: ${rawP} brutos → ${places.length} válidos.`);
    places.forEach((pl, i) => { if (i >= 10) pl.reserve = true; });
    if (places.length < 14) foodMissing.push(`Comer ${places.length}/14`);
  } catch (e) {
    foodMissing.push('Comer: fallo IA (' + String(e.message || e).slice(0, 120) + ')');
  }

  const cartelera = Object.values(byTitle).map((e) => ({ titulo: e.titulo, cine: e.cines.join(' + '), sesiones: e.sesiones, url: e.url, travelMinutes: e.travelMinutes, seenAt: nowMs }));
  // Unión con lo anterior: lo nuevo manda (actualiza sesiones); lo que ya no
  // sale pero se vio hace menos de 10 días se conserva para no vaciar la
  // cartelera en días flojos de scrapeo. Más viejo se cae solo.
  let carteleraPartial = cartelera.length < 3;
  try {
    const prevRaw = readFileSync('feeds/feed-latest.json', 'utf8');
    const prevCart = (JSON.parse(prevRaw).cartelera || []).filter((m) => m && (m.titulo || m.title));
    const seenKeys = new Set(cartelera.map((m) => normTitle(m.titulo)));
    let kept = 0;
    for (const old of prevCart) {
      const key = normTitle(old.titulo || old.title);
      if (!key || seenKeys.has(key)) continue;
      const seenAt = Number(old.seenAt) || 0;
      if (nowMs - seenAt > 10 * 86400000) continue;
      cartelera.push({ titulo: old.titulo || old.title, cine: old.cine, sesiones: old.sesiones || [], url: old.url, travelMinutes: old.travelMinutes, seenAt });
      kept += 1;
    }
    if (kept > 0) console.log(`Cartelera: ${kept} pelis conservadas de días anteriores.`);
  } catch { /* primera ejecución: sin anterior */ }

  const feed = {
    schemaVersion: 3,
    generatedAt: toIsoMadrid(now),
    validUntil: toIsoMadrid(new Date(now.getTime() + VALID_DAYS * 86400000)),
    status: (missing.length === 0 && !carteleraPartial && deduped.length >= 10 && avMissing.length === 0 && foodMissing.length === 0) ? 'ok' : 'partial',
    quotasMissing: [...missing, ...avMissing, ...foodMissing], cineErrors, searchErrors: errors,
    planes, cartelera, series, movies, places,
  };
  mkdirSync('feeds', { recursive: true });
  const day = now.toISOString().slice(0, 10);
  writeFileSync('feeds/feed-latest.json', JSON.stringify(feed));
  writeFileSync(`feeds/feed-${day}.json`, JSON.stringify(feed));
  // Parte legible del robot (se publica solo; sirve para revisar sin entrar).
  const report = [
    `# Parte ${day} ${now.toISOString().slice(11, 16)} UTC · grupo ${GROUP} · modelo ${MODEL_USED}`,
    ``,
    `- Estado: **${feed.status}** · Planes: **${planes.length}** (Sevilla ${nSevilla} · Huelva/Cádiz ${nHC} · Rutas ${nRutas}) · Pelis: **${cartelera.length}** · Series: **${series.length}** · Cine-casa: **${movies.length}** · Comer: **${places.length}**`,
    `- Cuotas sin cubrir: ${[...missing, ...avMissing, ...foodMissing].length ? [...missing, ...avMissing, ...foodMissing].join(', ') : 'ninguna'}`,
    `- Fuentes con aviso: ${errors.length ? errors.join(' / ') : 'ninguna'}`,
    `- Cines con aviso: ${cineErrors.length ? cineErrors.join(' / ') : 'ninguno'}`,
    `- Válido hasta: ${feed.validUntil}`,
    `- Intentos de modelo: ${MODEL_ATTEMPTS.length ? MODEL_ATTEMPTS.join(' / ') : 'primero OK (' + MODEL_USED + ')'}`,
  ].join('\n');
  writeFileSync('feeds/last-run.md', report);
  console.log(`Feed: ${planes.length} planes + ${cartelera.length} pelis + ${series.length} series + ${movies.length} movies + ${places.length} places. Grupo ${GROUP}. Modelo ${MODEL_USED}.`);
}

if (CHECK_ONLY) await checkSources();
else await fullRun();
