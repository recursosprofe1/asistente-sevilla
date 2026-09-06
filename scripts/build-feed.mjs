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
import { pathToFileURL } from 'node:url';
import { mkdirSync, appendFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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
// En Planes no hay pastilla Varios: la IA debe encajar todo en las otras.
const CATEGORIES_PLANES = CATEGORIES_CLOSED.filter((c) => c !== 'Varios' && c !== 'Cine');

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
  { name: 'Sala Cero', url: 'https://salacero.com/programacion-salacero/', zona: 'Sevilla', grupo: 'A' },
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
  { name: 'Patronato Turismo Huelva', url: 'https://www.turismohuelva.org/', zona: 'Huelva', grupo: 'A' },
  { name: 'Moguer (Junta)', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/moguer', zona: 'Huelva', grupo: 'B' },
  { name: 'Almonte (Junta)', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/almonte', zona: 'Huelva', grupo: 'B' },
  { name: 'Aracena (Junta)', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/aracena', zona: 'Huelva', grupo: 'C' },
  { name: 'Punta Umbría (Junta)', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/punta-umbria', zona: 'Huelva', grupo: 'D' },
  // CÁDIZ (6 directas + 2 refuerzos documentados)
  { name: 'Gran Teatro Falla', url: 'https://laciudad.cadiz.es/programacion-gran-teatro-falla.asp', zona: 'Cádiz', grupo: 'A' },
  { name: 'Cádiz cultura (programación)', url: 'https://institucional.cadiz.es/programacion_cultural', zona: 'Cádiz', grupo: 'A' },
  { name: 'Casa Iberoamérica', url: 'https://institucional.cadiz.es/area/Casa-de-Iberoamerica', zona: 'Cádiz', grupo: 'B' },
  { name: 'Jerez (Junta)', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/jerez-de-la-frontera', zona: 'Cádiz', grupo: 'B' },
  { name: 'Baluarte Candelaria', url: 'https://institucional.cadiz.es/area/Baluarte-de-la-Candelaria', zona: 'Cádiz', grupo: 'C' },
  { name: 'Planeamos Diputación', url: 'https://www.dipucadiz.es/cultura/Varios/planeamos-2026/', zona: 'Cádiz', grupo: 'D' },
  { name: 'Diputación Cádiz', url: 'https://www.dipucadiz.es/', zona: 'Cádiz', grupo: 'D' },
  { name: 'Rota (Junta)', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/rota', zona: 'Cádiz', grupo: 'D' },
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
function normCat(c, hint = '') {
  // En Planes no hay pastilla Varios: todo cae en alguna de las otras.
  // 1ª pasada por la etiqueta de la IA, 2ª por título+resumen, si no: Arte.
  const clean = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const byText = (t) => {
    if (/ruta|sender|naturaleza|sierra|parque|excurs|trekking|paseo verde|via verde|embalse|marisma|playa|costa/.test(t)) return 'Rutas y naturaleza';
    if (/musica|concierto|opera|jazz/.test(t)) return 'Música';
    if (/teatro|danza|escena|espectaculo|circo|monologo|comedia|magia|musical/.test(t)) return 'Teatro y espectáculos';
    if (/gastronom|gastro|mercado|restaurante|tapas|cocina|vino|queso/.test(t)) return 'Gastronomía';
    if (/arte|exposici|museo|pintura|fotografia|escultura|galeria|patrimonio|contemporaneo|artesania|alfareria|ceramica|taller|tradicion|forja|canteria|esparto/.test(t)) return 'Arte';
    if (/cine|pelicula|cartelera/.test(t)) return 'Cine';
    return '';
  };
  return byText(clean(c)) || byText(clean(hint)) || 'Arte';
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
function cleanJson(t) { return String(t || '').replace(/```json/g, '').replace(/```/g, '').trim(); }
const nowIso = (d = new Date()) => d.toISOString();

// ── Fuentes autónomas: salud, jubilación y recambios ─────────────────
// feeds/fuentes-estado.json es el censo del pool: cada fuente tiene estado
// ('activa' | 'ensayo' | 'baja'), rachas de aciertos/errores y una cola de
// alternativas. Reglas duras, sin IA:
//  · 'activa' con 2 fallos seguidos    -> se jubila ('baja').
//  · 'ensayo' con 2 lecturas OK        -> se promociona a 'activa'.
//  · 'ensayo' con 3 fallos             -> se jubila.
// Cuando un hueco queda vacante, la cocina intenta sus alternativas validadas
// y, si se agotan, pide candidatas a Gemini (1 llamada gratis) y solo entra
// lo que SUPERA la validación de lectura (fetchText + >=6 candidatos reales).
// Una URL inventada no puede colarse: no pasa el filtro del robot.
const ESTADO_PATH = 'feeds/fuentes-estado.json';
const normZona = (z) => noAccents(String(z || '')).toLowerCase().trim();

function seedEstado() {
  const sources = {};
  for (const f of FRESH_FIXED) {
    sources[f.url] = { name: f.name, zona: f.zona, grupo: 'fija', state: 'activa', okStreak: 0, failStreak: 0, alta: nowIso(), alternativas: [], lastError: null, reemplazadoPor: null };
  }
  for (const p of POOL) {
    sources[p.url] = { name: p.name, zona: p.zona, grupo: p.grupo, state: 'activa', okStreak: 0, failStreak: 0, alta: nowIso(), alternativas: [], lastError: null, reemplazadoPor: null };
  }
  return { version: 1, updated: null, sources };
}

function cargarEstado(path = ESTADO_PATH) {
  try {
    const e = JSON.parse(readFileSync(path, 'utf8'));
    if (e && e.version === 1 && e.sources) {
      const seed = seedEstado();
      for (const [u, m] of Object.entries(seed.sources)) if (!e.sources[u]) e.sources[u] = m;
      return e;
    }
  } catch { /* primera ejecución o formato viejo: semilla del código */ }
  return seedEstado();
}

function guardarEstado(estado, path = ESTADO_PATH) {
  try { mkdirSync('feeds', { recursive: true }); writeFileSync(path, JSON.stringify(estado, null, 1)); } catch { /* que no rompa el run */ }
}

function fuentesActivas(estado, group) {
  const fijas = [];
  const rotativas = [];
  for (const [url, m] of Object.entries(estado.sources)) {
    if (m.state === 'baja') continue;
    const src = { name: m.name, url, zona: m.zona };
    if (m.grupo === 'fija') fijas.push(src);
    else if (m.grupo === group) rotativas.push(src);
  }
  return { fijas, rotativas };
}

// Aplica el resultado de una lectura. Devuelve la acción de vida ocurrida.
function aplicarResultado(estado, url, ok, errText) {
  const m = estado.sources[url];
  if (!m) return null;
  if (ok) { m.okStreak = (m.okStreak || 0) + 1; m.failStreak = 0; m.lastError = null; }
  else { m.failStreak = (m.failStreak || 0) + 1; m.okStreak = 0; m.lastError = String(errText || '').slice(0, 160); }
  if (m.state === 'ensayo' && m.okStreak >= 2) { m.state = 'activa'; return 'promocion'; }
  const limite = m.state === 'ensayo' ? 3 : 2;
  if (m.state !== 'baja' && m.failStreak >= limite) { m.state = 'baja'; return 'jubilacion'; }
  return null;
}

function huecosVacantes(estado) {
  return Object.entries(estado.sources).filter(([, m]) => m.state === 'baja' && !m.reemplazadoPor && m.zona !== 'Cine');
}

function parseCandidatos(text) {
  try {
    const obj = JSON.parse(cleanJson(text));
    const out = [];
    for (const c of (Array.isArray(obj?.candidatos) ? obj.candidatos : [])) {
      if (!c || !c.nombre || !c.url || !c.zona) continue;
      const u = String(c.url).trim();
      if (!/^https:\/\//i.test(u)) continue;
      out.push({ nombre: String(c.nombre).slice(0, 60), url: u, zona: String(c.zona).trim() });
    }
    return out;
  } catch { return []; }
}

async function validarFuente(src) {
  try {
    const lines = await fetchSource(src);
    return lines.length >= 6;
  } catch { return false; }
}

function darDeAlta(estado, bajaUrl, bajaM, c, altas) {
  estado.sources[c.url] = {
    name: c.nombre, zona: bajaM.zona, grupo: bajaM.grupo, state: 'ensayo',
    okStreak: 1, failStreak: 0, alta: nowIso(), alternativas: [], lastError: null, reemplazadoPor: null
  };
  estado.sources[bajaUrl].reemplazadoPor = c.url;
  altas.push(c.nombre);
}

function promptRecambio(vacantes) {
  return [
    'Necesito sustituir fuentes de agenda cultural de Sevilla/Huelva/Cadiz que han muerto o bloquean al robot.',
    'Huecos a cubrir (nombre y zona): ' + vacantes.map((m) => `${m.name} [${m.zona}]`).join('; ') + '.',
    'Devuelve SOLO un JSON valido, sin markdown, con esta forma exacta:',
    '{ "candidatos": [ { "nombre": "Fuente (organizacion)", "url": "https://...", "zona": "Sevilla|Huelva|Cadiz|Rutas" } ] }',
    '4 candidatos por hueco, con la ZONA exacta del hueco.',
    'Requisitos: webs que existan de verdad hoy; portada o pagina de agenda con listado publico de eventos (ayuntamientos, diputaciones, patronatos de turismo, teatros publicos, recintos culturales, festivales);',
    'HTML normal con enlaces visibles a los eventos (no apps de un solo enlace "cargar mas", ni muro de cookies), https.',
    'Prohibido: deporte, taurino, religioso, flamenco monografico, agregadores que copian de otras agendas.',
    'No inventes URLs: si dudas de una, omite esa.'
  ].join('\n');
}

// Busca recambio para todos los huecos vacantes. Primero la cola de
// alternativas (barato), luego UNA sola llamada IA para lo que falte.
async function buscarReemplazos(estado) {
  const altas = [];
  let aviso = null;
  let pendientes = huecosVacantes(estado);
  if (!pendientes.length) return { altas, aviso };

  for (const [url, m] of pendientes) {
    while (m.alternativas?.length) {
      const alt = m.alternativas.shift();
      const ok = await validarFuente({ name: m.name, url: alt, zona: m.zona });
      if (ok) { darDeAlta(estado, url, m, { nombre: `${m.name} (recambio)`, url: alt, zona: m.zona }, altas); break; }
    }
  }

  pendientes = huecosVacantes(estado);
  if (!pendientes.length) return { altas, aviso };

  let candidatos = [];
  try {
    const resp = await geminiGenerate(promptRecambio(pendientes.map(([, m]) => m)));
    candidatos = parseCandidatos(resp.text);
  } catch (e) {
    return { altas, aviso: 'busqueda de recambios falló: ' + String(e.message || e).slice(0, 140) };
  }

  const conocidas = new Set(Object.keys(estado.sources));
  const validadas = [];
  for (const c of candidatos.slice(0, 10)) {
    if (conocidas.has(c.url)) continue;
    const ok = await validarFuente({ name: c.nombre, url: c.url, zona: c.zona });
    if (ok) { validadas.push(c); conocidas.add(c.url); }
  }

  for (const [url, m] of pendientes) {
    if (m.reemplazadoPor) continue;
    const idx = validadas.findIndex((c) => normZona(c.zona) === normZona(m.zona));
    if (idx === -1) { aviso = `sin recambio validado para ${m.name} (${m.zona})`; continue; }
    const [c] = validadas.splice(idx, 1);
    darDeAlta(estado, url, m, c, altas);
    const restoIdx = validadas.map((v, i) => [v, i]).filter(([v]) => normZona(v.zona) === normZona(m.zona)).map(([, i]) => i);
    const restoUrls = restoIdx.map((i) => validadas[i].url);
    if (restoUrls.length) {
      estado.sources[c.url].alternativas = restoUrls;
      for (const i of [...restoIdx].reverse()) validadas.splice(i, 1);
    }
  }
  return { altas, aviso };
}
function toIsoMadrid(d) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZoneName: 'longOffset' }).formatToParts(d);
  const g = (t) => parts.find((p) => p.type === t).value;
  // "GMT+02:00" en verano, "GMT+01:00" en invierno, "GMT" si coincidió.
  const raw = g('timeZoneName');
  const offset = raw === 'GMT' ? '+00:00' : raw.replace('GMT', '');
  const hour = String(Number(g('hour')) % 24).padStart(2, '0'); // evita "24" en medianoche
  return `${g('year')}-${g('month')}-${g('day')}T${hour}:${g('minute')}:${g('second')}${offset}`;
}

// WAFs de algunos ayuntamientos castigan intermitentemente la IP del runner:
// reintentos con backoff, segundo UA tipo navegador real y, si la ruta con
// barra final da 404, se prueba su canónica .../index.html (OpenCMS).
const UA_MAIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AsistenteSevilla/1.0';
const UA_BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOnce(url, ua, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      signal: ctrl.signal, redirect: 'follow',
      headers: { 'User-Agent': ua, 'Accept-Language': 'es-ES,es;q=0.9' },
    });
    if (!resp.ok) { const err = new Error('HTTP ' + resp.status); err.httpStatus = resp.status; throw err; }
    return await resp.text();
  } finally { clearTimeout(t); }
}

async function fetchText(url, timeoutMs = 20000) {
  const tries = [
    () => fetchOnce(url, UA_MAIN, timeoutMs),
    async () => { await sleep(2000); return fetchOnce(url, UA_BROWSER, timeoutMs); },
    async () => { await sleep(4000); return fetchOnce(url, UA_BROWSER, timeoutMs); },
    async () => { await sleep(4000); return fetchOnce(url.replace(/\/$/, '') + '/index.html', UA_BROWSER, timeoutMs); }
  ];
  let lastErr = null;
  for (const [i, attempt] of tries.entries()) {
    try { return await attempt(); }
    catch (e) {
      lastErr = e;
      // El fallback index.html solo tiene sentido si hubo 404 o rechazo previo.
      if (i === 2 && !(e.httpStatus === 404 || e.httpStatus === 403)) break;
    }
  }
  throw lastErr;
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
    const dm = around.match(/(\d{1,2}\s+de\s+[a-záéíóúñ]+|\d{1,2}[-/]\d{1,2}([-/]\d{2,4})?)/i);
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

// ── Ventana anti-repetición y archivo de feeds (recos) ─────────────
// Regla pactada: no repetir lo servido en los últimos NO_REPEAT_DAYS;
// a partir de la 3ª semana la repetición es válida (y sirve de relleno).
const NO_REPEAT_DAYS = 14;
const AV_TARGET = 8, AV_MIN = 5, FOOD_TARGET = 14, FOOD_MIN = 8;

function loadDatedFeeds(dir = 'feeds') {
  const out = [];
  let names = [];
  try { names = readdirSync(dir); } catch { return out; }
  for (const n of names) {
    const m = n.match(/^feed-(\d{4}-\d{2}-\d{2})\.json$/);
    if (!m) continue;
    try { out.push({ day: m[1], data: JSON.parse(readFileSync(`${dir}/${n}`, 'utf8')) }); } catch { /* corrupto: se ignora */ }
  }
  return out.sort((a, b) => a.day.localeCompare(b.day));
}

function feedDayMs(day) { return Date.parse(day + 'T12:00:00Z'); }

// Perfil del usuario subido por la app (perfil.json en la raíz del repo).
// Solo etiquetas agregadas ("Ciencia ficción x4"): la fusión pisa los
// learned* de la semilla; si no hay fichero, todo sigue con el cuestionario.
function loadUserPerfil(file = 'perfil.json') {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}
function effectiveProfile(userPerfil) {
  const p = JSON.parse(JSON.stringify(TASTE_SEED));
  if (!userPerfil || userPerfil.schemaVersion !== 1) return { profile: p, applied: false };
  let touched = false;
  for (const k of ['series', 'movies', 'food']) {
    const u = userPerfil[k];
    if (!u) continue;
    if (Array.isArray(u.learnedLikes) && u.learnedLikes.length) { p[k].learnedLikes = u.learnedLikes.map(String); touched = true; }
    if (Array.isArray(u.learnedAvoid) && u.learnedAvoid.length) { p[k].learnedAvoid = u.learnedAvoid.map(String); touched = true; }
    if (k === 'food' && Array.isArray(u.learnedZones) && u.learnedZones.length) { p[k].learnedZones = u.learnedZones.map(String); touched = true; }
  }
  return { profile: p, applied: touched };
}

// Títulos (minúsculas, sin espacios sobrantes) servidos dentro de la ventana.
function recentFeedTitles(feeds, nowMs, windowDays = NO_REPEAT_DAYS) {
  const cutoff = nowMs - windowDays * 86400000;
  const sets = { series: new Set(), movies: new Set(), places: new Set() };
  for (const f of feeds) {
    if (!(feedDayMs(f.day) >= cutoff)) continue;
    for (const k of Object.keys(sets)) {
      for (const it of (f.data?.[k] || [])) {
        if (it && it.title) sets[k].add(String(it.title).toLowerCase().trim());
      }
    }
  }
  return sets;
}

// Relleno: entradas del archivo fuera de ventana (día más reciente primero),
// sin repetir títulos ya aceptados. Devuelve crudos (el llamar los normaliza).
function backfillFromArchive(feeds, family, bannedTitles, nowMs, limit) {
  if (limit <= 0) return [];
  const cutoff = nowMs - NO_REPEAT_DAYS * 86400000;
  const seen = new Set([...bannedTitles].map((t) => String(t).toLowerCase().trim()));
  const out = [];
  const sorted = [...feeds].sort((a, b) => b.day.localeCompare(a.day));
  for (const f of sorted) {
    if (feedDayMs(f.day) >= cutoff) continue;
    for (const it of (f.data?.[family] || [])) {
      const key = String(it?.title || '').toLowerCase().trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(it);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

// ── Prueba de lectura ─────────────────────────────────────────
async function checkSources() {
  const estado = cargarEstado();
  const { fijas, rotativas } = fuentesActivas(estado, GROUP);
  const all = [...fijas, ...rotativas];
  console.log(`Grupo semanal: ${GROUP} (semana ISO ${isoWeekNumber()}) — ${all.length} fuentes (${fijas.length} fijas + ${rotativas.length} rotativas) segun censo`);
  const results = await mapLimit(all, 4, async (src) => {
    try {
      const t0 = Date.now();
      const cands = await fetchSource(src);
      return { name: src.name, zona: src.zona, ok: true, ms: Date.now() - t0, n: cands.length };
    } catch (e) {
      return { name: src.name, zona: src.zona, ok: false, error: e.message || String(e) };
    }
  });
  // Cines: de madrugada eCartelera lista pocas sesiones (es normal, y la
  // generadora conserva 10 días de cartelera). El umbral de aviso baja a 1
  // entre las 22 y las 8 (Madrid) para que el check no salte en falso.
  const horaMadrid = Number(new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: 'numeric', hour12: false }).format(new Date())) % 24;
  const CINE_MIN = (horaMadrid >= 22 || horaMadrid < 8) ? 1 : 3;
  for (const src of CINE_SOURCES) {
    try {
      const t0 = Date.now();
      const html = await fetchText(src.url);
      const allItems = scrapeCineBlocks(html, src);
      const n = allItems.length;
      results.push({ name: src.cine, zona: 'Cine', ok: n >= CINE_MIN, ms: Date.now() - t0, n, error: n < CINE_MIN ? `solo ${n} títulos con horario` : undefined });
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
  // Resumen público del check (visible en la página del run sin logs).
  if (process.env.GITHUB_STEP_SUMMARY) {
    const md = [
      `## Check de fuentes — grupo ${GROUP} · ${ok.length}/${results.length} legibles`,
      '',
      '| Fuente | Zona | Estado | Detalle |',
      '|---|---|---|---|',
      ...results.map((r) => `| ${r.name} | ${r.zona} | ${r.ok ? 'OK' : '**FALLO**'} | ${r.ok ? `${r.n} cand · ${r.ms} ms` : String(r.error || '').replace(/\|/g, '/')} |`),
      ''
    ].join('\n');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  }
  if (bad.length) {
    console.log('A sustituir: ' + bad.map((r) => r.name).join(', '));
    // Anotaciones visibles en la página del run sin necesidad de abrir logs.
    for (const r of bad) console.log(`::error::[${r.zona}] ${r.name} — ${r.error || 'sin detalle'}`);
    process.exitCode = 2;
  }
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
  const estado = cargarEstado();
  const { fijas, rotativas } = fuentesActivas(estado, GROUP);
  const all = [...fijas, ...rotativas];
  const lines = [];
  const errors = [];
  const bajas = [];
  const promociones = [];
  const settled = await mapLimit(all, 4, async (src) => {
    try { return { src, lines: await fetchSource(src) }; }
    catch {
      await new Promise((r) => setTimeout(r, 3000));
      try { return { src, lines: await fetchSource(src) }; }
      catch (e2) { return { src, error: (e2.message || String(e2)) + ' (tras reintento)' }; }
    }
  });
  for (const r of settled) {
    if (r.lines) {
      lines.push(...r.lines);
      const acc = aplicarResultado(estado, r.src.url, true);
      if (acc === 'promocion') promociones.push(r.src.name);
    } else {
      errors.push(`${r.src.name}: ${r.error}`);
      const acc = aplicarResultado(estado, r.src.url, false, r.error);
      if (acc === 'jubilacion') bajas.push(r.src.name);
    }
  }
  try {
    const reb = await buscarReemplazos(estado);
    if (reb.altas.length) console.log(`Recambios dados de alta (en pruebas): ${reb.altas.join(', ')}.`);
    if (reb.aviso) { console.log('Recambios: ' + reb.aviso); errors.push('recambios: ' + reb.aviso); }
    if (bajas.length) console.log(`Fuentes jubiladas: ${bajas.join(', ')}.`);
    if (promociones.length) console.log(`Fuentes promocionadas (2 lecturas OK en pruebas): ${promociones.join(', ')}.`);
  } catch (e) {
    errors.push('recambios: fallo inesperado (' + String(e.message || e).slice(0, 120) + ')');
  }
  // El censo se guarda SIEMPRE (jubilar/promocionar vale aunque la búsqueda fallen).
  estado.updated = toIsoMadrid(new Date());
  guardarEstado(estado);
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
    '  "categories": ["una de: ' + CATEGORIES_PLANES.join(' | ') + '"],',
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
    'Clasifica cada plan en una de esas categorías (nunca "Varios"): artesanía, alfarería, cerámica, talleres, tradición y patrimonio van en "Arte".',
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
      const cat0 = normCat((p.categories && p.categories[0]) || '', (p.title || '') + ' ' + (p.summary || ''));
      if (cat0 !== 'Rutas y naturaleza' && !p.startsAt) return false;
      return true;
    })
    .map((p) => {
      const cats = (Array.isArray(p.categories) && p.categories.length ? p.categories : ['Varios'])
        .map((c) => normCat(c, (p.title || '') + ' ' + (p.summary || ''))).filter((c) => CATEGORIES_CLOSED.includes(c) && c !== 'Cine');
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
    const cat = normCat(p.categories[0], (p.title || '') + ' ' + (p.summary || ''));
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
  // ── Series + pelis + sitios (perfil de gustos + ventana anti-repetición) ──
  // Regla: no repetir lo servido en los últimos NO_REPEAT_DAYS (repetición
  // permitida a partir de la 3ª semana). Los descartados del usuario tienen
  // veto en el móvil (IDs estables), aquí no hace falta conocerlos.
  // Red de seguridad: si una sección queda corta, 2ª pasada al modelo con el
  // avoid-list ampliado; si sigue por debajo del mínimo, relleno con entradas
  // del archivo ya fuera de ventana. Nunca se publica una sección vacía si el
  // archivo tiene recursos.
  const now = new Date();
  const nowMs = now.getTime();
  const USER_PERFIL = loadUserPerfil();
  const PERFIL = effectiveProfile(USER_PERFIL);
  if (PERFIL.applied) console.log('Perfil del usuario: aplicado (perfil.json).');
  else console.log('Perfil del usuario: sin uso (semilla del cuestionario).');
  const datedFeeds = loadDatedFeeds();
  const avoid = recentFeedTitles(datedFeeds, nowMs);
  const titlesOf = (arr) => arr.map((x) => String(x.title || '').toLowerCase().trim()).filter(Boolean);
  const notBefore = (arr, set) => (arr || []).filter((p) => p && p.title && !set.has(String(p.title).toLowerCase().trim()));
  const mergeCap = (main, extra, cap) => {
    const seen = new Set(titlesOf(main));
    const out = [...main];
    for (const it of extra) {
      if (out.length >= cap) break;
      const key = String(it.title || '').toLowerCase().trim();
      if (!key || seen.has(key)) continue;
      seen.add(key); out.push(it);
    }
    return out;
  };

  let series = [], movies = [], places = [];
  const avMissing = [], foodMissing = [];
  const noTerror = (t) => !/terror|reality|telenovela/i.test(`${t.title || ''} ${(t.genres || []).join(' ')}`);
  const genAV = async (avoidSets) => {
    const avRaw = cleanJson((await geminiGenerate(buildAudiovisualPrompt(PERFIL.profile, {
      series: [...avoidSets.series], movies: [...avoidSets.movies]
    }))).text);
    const av = JSON.parse(avRaw);
    const s = notBefore(av.series, avoidSets.series)
      .filter((p) => noTerror(p) && p.sourceUrl && /^https:\/\//i.test(p.sourceUrl))
      .map((p) => normalizeSerie(p, nowMs)).slice(0, AV_TARGET);
    const m = notBefore(av.movies, avoidSets.movies)
      .filter((p) => p.sourceUrl && /^https:\/\//i.test(p.sourceUrl))
      .map((p) => normalizeMovie(p, nowMs)).slice(0, AV_TARGET);
    return { s, m };
  };
  try {
    const rawP = { s: 0, m: 0 };
    let av = await genAV(avoid);
    series = av.s; movies = av.m;
    rawP.s = series.length; rawP.m = movies.length;
    if (series.length < AV_TARGET || movies.length < AV_TARGET) {
      try {
        const av2 = await genAV({
          series: new Set([...avoid.series, ...titlesOf(series)]),
          movies: new Set([...avoid.movies, ...titlesOf(movies)])
        });
        series = mergeCap(series, av2.s, AV_TARGET);
        movies = mergeCap(movies, av2.m, AV_TARGET);
        console.log(`AV 2ª pasada: series ${series.length}/${AV_TARGET} · pelis ${movies.length}/${AV_TARGET}.`);
      } catch (e2) { console.log('AV 2ª pasada falló: ' + (e2.message || e2)); }
    }
    if (series.length < AV_MIN) {
      const fill = backfillFromArchive(datedFeeds, 'series', new Set([...avoid.series, ...titlesOf(series)]), nowMs, AV_MIN - series.length)
        .map((p) => normalizeSerie({ ...p, reserve: undefined }, nowMs));
      series = mergeCap(series, fill, Math.max(AV_MIN, series.length));
      if (fill.length) console.log(`AV relleno archivo: +${fill.length} series.`);
    }
    if (movies.length < AV_MIN) {
      const fill = backfillFromArchive(datedFeeds, 'movies', new Set([...avoid.movies, ...titlesOf(movies)]), nowMs, AV_MIN - movies.length)
        .map((p) => normalizeMovie({ ...p, reserve: undefined }, nowMs));
      movies = mergeCap(movies, fill, Math.max(AV_MIN, movies.length));
      if (fill.length) console.log(`AV relleno archivo: +${fill.length} pelis.`);
    }
    console.log(`AV embudo: series ${rawP.s} válidas → ${series.length} · pelis ${rawP.m} válidas → ${movies.length}.`);
    series.forEach((s, i) => { s.reserve = i >= 5; });
    movies.forEach((m, i) => { m.reserve = i >= 5; });
    if (series.length < AV_TARGET) avMissing.push(`Series ${series.length}/${AV_TARGET}`);
    if (movies.length < AV_TARGET) avMissing.push(`Pelis ${movies.length}/${AV_TARGET}`);
  } catch (e) {
    avMissing.push('Series/pelis: fallo IA (' + String(e.message || e).slice(0, 120) + ')');
  }
  try {
    const genFood = async (avoidSet) => {
      const foodRaw = cleanJson((await geminiGenerate(buildFoodPrompt(PERFIL.profile, { places: [...avoidSet] }))).text);
      const food = JSON.parse(foodRaw);
      const raw = (food.places || []).length;
      const ok = notBefore(food.places, avoidSet)
        .filter((p) => p.zone && p.sourceUrl && /^https:\/\//i.test(p.sourceUrl))
        .map((p) => normalizePlace(p, nowMs));
      return { ok, raw };
    };
    let first = await genFood(avoid.places);
    places = first.ok.slice(0, FOOD_TARGET);
    if (places.length < FOOD_TARGET) {
      try {
        const second = await genFood(new Set([...avoid.places, ...titlesOf(places)]));
        places = mergeCap(places, second.ok, FOOD_TARGET);
        console.log(`Comer 2ª pasada: ${places.length}/${FOOD_TARGET}.`);
      } catch (e2) { console.log('Comer 2ª pasada falló: ' + (e2.message || e2)); }
    }
    if (places.length < FOOD_MIN) {
      const fill = backfillFromArchive(datedFeeds, 'places', new Set([...avoid.places, ...titlesOf(places)]), nowMs, FOOD_MIN - places.length)
        .map((p) => normalizePlace({ ...p, reserve: undefined }, nowMs));
      places = mergeCap(places, fill, Math.max(FOOD_MIN, places.length));
      if (fill.length) console.log(`Comer relleno archivo: +${fill.length} sitios.`);
    }
    console.log(`Comer embudo: ${first.raw} brutos → ${places.length} válidos.`);
    places.forEach((pl, i) => { pl.reserve = i >= 10; });
    if (places.length < FOOD_TARGET) foodMissing.push(`Comer ${places.length}/${FOOD_TARGET}`);
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
    `- Censo de fuentes: ${Object.values(estado.sources).filter((m) => m.state === 'activa').length} activas · ${Object.values(estado.sources).filter((m) => m.state === 'ensayo').length} en pruebas${bajas.length ? ` · jubiladas HOY: ${bajas.join(', ')}` : ''}${promociones.length ? ` · promocionadas: ${promociones.join(', ')}` : ''}`,
    `- Cines con aviso: ${cineErrors.length ? cineErrors.join(' / ') : 'ninguno'}`,
    `- Válido hasta: ${feed.validUntil}`,
    `- Perfil del usuario: ${PERFIL.applied ? 'aplicado (' + (USER_PERFIL?.generatedAt || 'sin fecha') + ')' : 'semilla del cuestionario'}`,
    `- Intentos de modelo: ${MODEL_ATTEMPTS.length ? MODEL_ATTEMPTS.join(' / ') : 'primero OK (' + MODEL_USED + ')'}`,
  ].join('\n');
  writeFileSync('feeds/last-run.md', report);
  console.log(`Feed: ${planes.length} planes + ${cartelera.length} pelis + ${series.length} series + ${movies.length} movies + ${places.length} places. Grupo ${GROUP}. Modelo ${MODEL_USED}.`);
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  if (CHECK_ONLY) await checkSources();
  else await fullRun();
}

// Exportados para tests (Vitest) sin ejecutar la cocina al importar.
export { normCat, zoneOf, toIsoMadrid, isoWeekNumber, coerceTravel, normTitle, isExcluded, recentFeedTitles, backfillFromArchive, feedDayMs, NO_REPEAT_DAYS, effectiveProfile, loadUserPerfil, seedEstado, cargarEstado, fuentesActivas, aplicarResultado, huecosVacantes, parseCandidatos, darDeAlta };
