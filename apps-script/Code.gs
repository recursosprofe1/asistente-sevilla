/**
 * Asistente Sevilla — Backend Apps Script (FeedV2) — v4 cocina simple.
 *
 * CÓMO USARLO:
 * 1. Abre script.google.com → tu proyecto "Asistente_Personal_Backend".
 * 2. Sustituye TODO el contenido por este archivo.
 * 3. Clave: propiedad del script GEMINI_KEY (Engranaje → Propiedades del
 *    script). Opcional: GEMINI_MODEL (por defecto gemini-2.5-flash, gratis).
 *    Ya NO hace falta TAVILY_KEY (se quitó para simplificar y coste 0).
 *    NOTA: gemini-2.0-flash murió el 01/06/2026. No lo uses.
 * 4. Ejecuta `ejecutarActualizacionSemanal()` una vez para validar y autorizar.
 * 5. Desplegar → Gestionar despliegues → lápiz → Nueva versión.
 *    (Sin nueva versión, la app sigue recibiendo el JSON viejo.)
 * 6. En la app web, pulsa sincronizar: el toast dice
 *    "X nuevos · Y actualizados · Z sin cambios" y el panel Diagnóstico
 *    muestra Generado / Válido hasta / Hash.
 *
 * v4 (2026-09-05, plan cocina v2):
 * - SIN Tavily. Lectura directa de 8 fuentes fijas (coste 0) + Gemini
 *   2.5-flash (gratis) que solo ordena y normaliza, no inventa.
 * - Objetivo 30: 15 Sevilla + 10 Huelva/Cádiz + 5 rutas evergreen.
 * - Excluidos: deporte, toros, religioso (doble barrera: prompt + filtro).
 * - Cine: 4 cines (Lagoh, Nervión, Metromar, Avenida) con dedup por título.
 * - Rutas: sin fecha, no caducan (startsAt/expiresAt null).
 * - travelMinutes simple por regla (solo sirve al filtro de la app).
 * - Si una fuente falla, se registra en searchErrors y se sigue con el resto.
 */

// ── Configuración ─────────────────────────────────────────────
function getGeminiKey_() {
  try {
    var fromProps = PropertiesService.getScriptProperties().getProperty('GEMINI_KEY');
    if (fromProps && fromProps.trim()) return fromProps.trim();
  } catch (e) { /* sin propiedades: sigue al fallback */ }
  if (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY && GEMINI_API_KEY !== 'TU_API_KEY_AQUÍ') return GEMINI_API_KEY;
  throw new Error('Falta la clave de Gemini: define la propiedad GEMINI_KEY.');
}
var GEMINI_API_KEY = 'TU_API_KEY_AQUÍ'; // fallback si no hay propiedad GEMINI_KEY

function getGeminiModel_() {
  try {
    var fromProps = PropertiesService.getScriptProperties().getProperty('GEMINI_MODEL');
    if (fromProps && fromProps.trim()) return fromProps.trim();
  } catch (e) { /* sin propiedades: sigue al fallback */ }
  return GEMINI_MODEL_FALLBACK;
}
// gemini-2.0-flash APAGADO por Google el 01/06/2026 y la familia 2.x
// bloqueada a cuentas nuevas. 3.6-flash es el estable actual (gratis en texto).
var GEMINI_MODEL_FALLBACK = 'gemini-3.6-flash';

var SHEET_FEED = 'published_feed';
var SPREADSHEET_ID = ''; // vacío = hoja vinculada al proyecto
var VALID_DAYS = 8; // el feed vale una semana + margen

function openDb_() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create('Asistente_Personal_DB');
}

// Cuotas de zonas (decisión dirección 2026-09-05): 15 + 10 + 5 = 30.
// Se aplican sobre frescos (con fecha) por municipio, más rutas aparte.
var QUOTA_SEVILLA = 15;
var QUOTA_HUELVA_CADIZ = 10;
var QUOTA_RUTAS = 5;
// Equilibrio por gustos dentro de los frescos (mínimos, el resto libre).
var QUOTA_CATS = {
  'Música': 5,
  'Teatro y espectáculos': 5,
  'Arte': 4,
  'Gastronomía': 3
};
var CATEGORIES_CLOSED = ['Rutas y naturaleza', 'Música', 'Teatro y espectáculos', 'Gastronomía', 'Arte', 'Varios', 'Cine'];

// Excluidos siempre (doble barrera: se pide en el prompt Y se filtra aquí).
var EXCLUDED_RE = /deport|futbol|baloncesto|tenis|padel|maraton|media maraton|carrera popular|ciclismo|toros?|taurin|corrida|novillada|rejone|procesion|semana santa|misa|eucaristia|rosario|cofrad|via crucis|triduo|besamanos/i;

// ── Fuentes fijas (lectura directa gratis, sin Tavily) ────────
// Cada semana se leen TODAS (Sevilla + Huelva/Cádiz + rutas + cine).
// Si una falla o cambia su HTML, se registra en searchErrors y el resto sigue.
// Para corregir una URL: abre la página en el navegador, copia su dirección
// y pégala aquí en `url`. No toques nada más.
var FRESH_SOURCES = [
  { name: 'ICAS Sevilla', url: 'https://icas.sevilla.org/agenda', zona: 'Sevilla' },
  { name: 'Agenda Junta Sevilla', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/sevilla', zona: 'Sevilla' },
  { name: 'Ayto Sevilla agenda', url: 'https://www.sevilla.org/ayuntamiento/alcaldia/comunicacion/calendario/agenda-actividades', zona: 'Sevilla' },
  { name: 'Agenda Junta Huelva', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/huelva', zona: 'Huelva' },
  { name: 'Agenda Huelva capital', url: 'https://www.huelva.es/agenda', zona: 'Huelva' },
  { name: 'Agenda Junta Cádiz', url: 'https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/cadiz', zona: 'Cádiz' },
  { name: 'Agenda Cádiz + Planeamos', url: 'https://institucional.cadiz.es/eventos', zona: 'Cádiz' },
  { name: 'Wikiloc Sevilla (rutas)', url: 'https://es.wikiloc.com/rutas/senderismo/espana/andalucia/sevilla', zona: 'Rutas' }
];

// Cines pedidos por dirección (2026-09-05). Si una URL falla (HTTP distinto
// de 200 o HTML sin horarios), el error queda en cineErrors y se conserva la
// cartelera anterior como respaldo. Corrige la URL igual que arriba.
var CINE_SOURCES = [
  { cine: 'Yelmo Lagoh (Sevilla)', url: 'https://www.yelmocines.es/cartelera/sevilla/lagoh', travelMinutes: 20 },
  { cine: 'Mk2 Nervión Plaza (Sevilla)', url: 'https://www.mk2cinesur.com/cines/cinesur-nervion-plaza', travelMinutes: 10 },
  { cine: 'Metromar (Mairena del Aljarafe)', url: 'https://www.cinesmetromar.es/', travelMinutes: 25 },
  { cine: 'Avenida 5 Cines (Sevilla)', url: 'https://www.avenida5cines.com/', travelMinutes: 10 }
];

// ── Utilidades ────────────────────────────────────────────────
function slugify_(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'plan';
}

function md5hex_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(s))
    .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function stableId_(p) {
  if (p.id) return String(p.id);
  var base = [p.sourceUrl || '', p.title || '', p.startsAt || '', p.venue || ''].join('|');
  return 'ev-' + slugify_(p.title) + '-' + md5hex_(base).slice(0, 8);
}

function toIsoMadrid_(d) {
  return Utilities.formatDate(d, 'Europe/Madrid', "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function normCat_(c) {
  var t = String(c || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/ruta|sender|naturaleza|sierra|parque|excurs|trekking|paseo verde|via verde|embalse|marisma|playa|costa/.test(t)) return 'Rutas y naturaleza';
  if (/musica|concierto|flamenco|opera|jazz/.test(t)) return 'Música';
  if (/teatro|danza|escena|espectaculo|circo|monologo|comedia|magia|musical/.test(t)) return 'Teatro y espectáculos';
  if (/gastronom|gastro|mercado|restaurante|tapas|cocina|vino|queso/.test(t)) return 'Gastronomía';
  if (/arte|exposici|museo|pintura|fotografia|escultura|galeria|patrimonio|contemporaneo/.test(t)) return 'Arte';
  if (/cine|pelicula|cartelera/.test(t)) return 'Cine';
  return 'Varios';
}

function isExcluded_(title, summary) {
  var t = String(title || '') + ' | ' + String(summary || '');
  return EXCLUDED_RE.test(t.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
}

// travelMinutes solo alimenta el filtro de la app (dirección: no complicarse).
// Sevilla capital 15 · provincia 35 · Huelva/Cádiz 80 (>60) · rutas 60.
function ruleTravel_(municipality, isRuta) {
  if (isRuta) return 60;
  var m = String(municipality || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/huelva|cadiz/.test(m)) return 80;
  if (m.trim() === 'sevilla') return 15;
  if (/sevilla/.test(m)) return 15;
  return 35;
}

function coerceTravel_(v, municipality, isRuta) {
  var n = Number(v);
  if (isFinite(n) && n >= 5 && n <= 120) return Math.round(n);
  return ruleTravel_(municipality, isRuta);
}

// Título normalizado para quitar duplicados de cine entre salas
// ("Dune 2", "Dune: Parte 2 3D", "DUNE (VOSE)" → misma clave).
function normTitle_(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(3d|2d|4dx|imax|vo|vose|vos|doblada|subtitulada|estreno)\b/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Lectura directa de fuentes (sin Tavily, coste 0) ──────────
function stripTags_(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
}

function extractCandidates_(html, src) {
  var items = [];
  var seen = {};
  var re = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]{3,120}?)<\/a>/gi;
  var m;
  var count = 0;
  while ((m = re.exec(html)) && count < 400) {
    count++;
    var url = m[1];
    var title = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!title || title.length < 8 || title.length > 120) continue;
    if (/cookies|aviso legal|privacidad|menu|inicio|contacto|suscrib|newsletter|iniciar sesion|login/i.test(title)) continue;
    if (!/^https:\/\//i.test(url)) continue;
    if (seen[url + '|' + title]) continue;
    seen[url + '|' + title] = true;
    // Pista de fecha/hora cercana al enlace (si la hay).
    var idx = m.index;
    var around = String(html).slice(Math.max(0, idx - 600), idx + 600).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    var dateHint = '';
    var dm = around.match(/(\d{1,2}\s+de\s+[a-záéíóúñ]+|\d{1,2}[\/-]\d{1,2}([\/-]\d{2,4})?|\b(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\.?\s+\d{1,2})/i);
    if (dm) dateHint = dm[0];
    items.push({ title: title, url: url, dateHint: dateHint, snippet: around.slice(0, 160) });
    if (items.length >= 12) break;
  }
  return items;
}

function fetchFreshContext_() {
  var lines = [];
  var errors = [];
  for (var i = 0; i < FRESH_SOURCES.length; i++) {
    var src = FRESH_SOURCES[i];
    try {
      var resp = UrlFetchApp.fetch(src.url, { muteHttpExceptions: true, followRedirects: true });
      if (resp.getResponseCode() !== 200) throw new Error('HTTP ' + resp.getResponseCode());
      var html = stripTags_(resp.getContentText());
      var cands = extractCandidates_(html, src);
      if (cands.length === 0) {
        errors.push(src.name + ': sin candidatos (HTML sin enlaces útiles)');
        continue;
      }
      cands.forEach(function (c) {
        lines.push('- ' + c.title + ' | ' + c.url + ' | zona:' + src.zona +
          (c.dateHint ? ' | fecha web:' + c.dateHint : '') + ' | ' + c.snippet);
      });
    } catch (e) {
      errors.push(src.name + ': ' + e.message);
    }
  }
  // Dedup por URL y tope para no saturar el prompt (≈18k caracteres).
  var seenU = {};
  var deduped = [];
  for (var j = 0; j < lines.length; j++) {
    var um = lines[j].match(/https?:\/\/\S+/);
    var k = um ? um[0] : lines[j];
    if (seenU[k]) continue;
    seenU[k] = true;
    deduped.push(lines[j]);
  }
  var context = deduped.join('\n').slice(0, 18000);
  return { context: context, partial: deduped.length < 10, errors: errors, count: deduped.length };
}

// ── Cartelera: scraping defensivo (4 cines, dedup cruzado) ─────
function scrapeCineSource_(src) {
  var resp = UrlFetchApp.fetch(src.url, { muteHttpExceptions: true, followRedirects: true });
  if (resp.getResponseCode() !== 200) throw new Error(src.cine + ' HTTP ' + resp.getResponseCode());
  var html = stripTags_(resp.getContentText());
  var items = [];
  var blocks = html.split(/<h[23][^>]*>/i).slice(1, 40);
  for (var i = 0; i < blocks.length; i++) {
    var title = blocks[i].split(/<\/h[23]>/i)[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!title || title.length < 2 || title.length > 80) continue;
    if (/cookies|aviso|menu|cartelera|sesiones|comprar|politica/i.test(title)) continue;
    var times = (blocks[i].match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g) || []).slice(0, 8);
    if (times.length === 0) continue;
    items.push({ titulo: title, cine: src.cine, sesiones: times, url: src.url, travelMinutes: src.travelMinutes });
    if (items.length >= 12) break;
  }
  return items;
}

function scrapeCartelera_(previous) {
  var items = [];
  var errors = [];
  for (var i = 0; i < CINE_SOURCES.length; i++) {
    try {
      items = items.concat(scrapeCineSource_(CINE_SOURCES[i]));
    } catch (e) {
      errors.push(CINE_SOURCES[i].cine + ': ' + e.message);
    }
  }
  // Dedup cruzado por título normalizado: la misma peli en varios cines
  // sale UNA vez, indicando en qué cines está (decisión dirección).
  var byTitle = {};
  items.forEach(function (m) {
    var key = normTitle_(m.titulo);
    if (!key) return;
    if (!byTitle[key]) {
      byTitle[key] = { titulo: m.titulo, cines: [m.cine], sesiones: m.sesiones.slice(), url: m.url, travelMinutes: m.travelMinutes };
    } else {
      if (byTitle[key].cines.indexOf(m.cine) < 0) byTitle[key].cines.push(m.cine);
      var merged = byTitle[key].sesiones.concat(m.sesiones).filter(function (t, ix, arr) { return arr.indexOf(t) === ix; });
      byTitle[key].sesiones = merged.slice(0, 8);
      byTitle[key].travelMinutes = Math.min(byTitle[key].travelMinutes, m.travelMinutes);
    }
  });
  var cartelera = Object.keys(byTitle).map(function (k) {
    var e = byTitle[k];
    return { titulo: e.titulo, cine: e.cines.join(' + '), sesiones: e.sesiones, url: e.url, travelMinutes: e.travelMinutes };
  });
  if (cartelera.length < 3 && previous && previous.length >= 3) {
    Logger.log('Scrape pobre (' + cartelera.length + '), se conserva la cartelera anterior.');
    return { cartelera: previous, partial: true, errors: errors };
  }
  return { cartelera: cartelera, partial: cartelera.length < 3, errors: errors };
}

// ── Diagnóstico de Gemini ─────────────────────────────────────
function diagnosticarGemini() {
  var key = getGeminiKey_();
  Logger.log('Modelo configurado: ' + getGeminiModel_());
  try {
    var list = UrlFetchApp.fetch(
      'https://generativelanguage.googleapis.com/v1beta/models?key=' + key,
      { muteHttpExceptions: true });
    Logger.log('Lista de modelos HTTP ' + list.getResponseCode());
    if (list.getResponseCode() === 200) {
      var names = JSON.parse(list.getContentText()).models.map(function (m) { return m.name; });
      Logger.log('Modelos flash: ' + names.filter(function (n) { return /flash/i.test(n); }).join(', '));
    } else {
      Logger.log('Error listando modelos: ' + list.getContentText().slice(0, 500));
    }
  } catch (e) {
    Logger.log('Fallo listando modelos: ' + e.message);
  }
  try {
    var resp = UrlFetchApp.fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + getGeminiModel_() + ':generateContent?key=' + key,
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ contents: [{ parts: [{ text: 'Responde solo: OK' }] }] }),
        muteHttpExceptions: true
      });
    Logger.log('Prueba mínima HTTP ' + resp.getResponseCode() + ': ' + resp.getContentText().slice(0, 500));
  } catch (e) {
    Logger.log('Fallo en prueba mínima: ' + e.message);
  }
}

// ── Actualización semanal (manual en pruebas) ─────────────────
function ejecutarActualizacionSemanal() {
  var fresh = fetchFreshContext_();
  Logger.log('Fuentes: ' + fresh.count + ' candidatos.' + (fresh.errors.length ? ' Avisos: ' + fresh.errors.join(' / ') : ''));

  var prompt = [
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
    'PROHIBIDO: deporte, toros/tauro/corrida, actos religiosos (procesión, misa, cofradía).',
    'NO incluyas cine (va aparte). Solo eventos futuros (salvo rutas). Sin inventar precios ni horarios.',
    'CANDIDATOS REALES de las fuentes (úsalos como base, no inventes):',
    fresh.context || '(sin contexto: trabaja con tu conocimiento, pero con URLs https reales)'
  ].join('\n');

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + getGeminiModel_() + ':generateContent?key=' + getGeminiKey_();
  var resp = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    muteHttpExceptions: true
  });
  if (resp.getResponseCode() !== 200) {
    throw new Error('Gemini HTTP ' + resp.getResponseCode() + ': ' + resp.getContentText().slice(0, 500));
  }

  var raw = JSON.parse(resp.getContentText()).candidates[0].content.parts[0].text
    .replace(/```json/g, '').replace(/```/g, '').trim();
  var parsed = JSON.parse(raw);

  var planes = (parsed.planes || [])
    .filter(function (p) {
      if (!p || !p.title || !p.sourceUrl || !/^https:\/\//i.test(p.sourceUrl)) return false;
      if (isExcluded_(p.title, p.summary)) return false; // 2ª barrera anti tópicos/excluidos
      var cat0 = normCat_((p.categories && p.categories[0]) || '');
      var isRuta = (cat0 === 'Rutas y naturaleza');
      if (!isRuta && !p.startsAt) return false; // frescos exigen fecha
      return true;
    })
    .map(function (p) {
      var cats = (Array.isArray(p.categories) && p.categories.length ? p.categories : ['Varios'])
        .map(normCat_)
        .filter(function (c) { return CATEGORIES_CLOSED.indexOf(c) >= 0 && c !== 'Cine'; });
      var isRuta = cats[0] === 'Rutas y naturaleza';
      var withId = Object.assign({}, p, {
        id: stableId_(p),
        categories: cats.length ? cats : ['Varios'],
        municipality: p.municipality || (isRuta ? 'Sierra de Sevilla' : 'Sevilla'),
        travelMinutes: coerceTravel_(p.travelMinutes, p.municipality, isRuta)
      });
      if (isRuta) {
        withId.startsAt = p.startsAt || null;
        withId.expiresAt = null; // las rutas no caducan (decisión dirección)
      } else {
        if (!withId.expiresAt) withId.expiresAt = withId.endsAt || withId.startsAt;
      }
      return withId;
    });

  // Verifica cuotas de zonas y equilibrio.
  var nSevilla = 0, nHC = 0, nRutas = 0;
  var counts = {};
  planes.forEach(function (p) {
    var cat = normCat_(p.categories[0]);
    counts[cat] = (counts[cat] || 0) + 1;
    if (cat === 'Rutas y naturaleza') { nRutas++; return; }
    var m = String(p.municipality || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/sevilla/.test(m)) nSevilla++;
    else if (/huelva|cadiz|gadiz/.test(m)) nHC++;
  });
  var missing = [];
  if (nSevilla < QUOTA_SEVILLA) missing.push('Sevilla ' + nSevilla + '/' + QUOTA_SEVILLA);
  if (nHC < QUOTA_HUELVA_CADIZ) missing.push('HuelvaCádiz ' + nHC + '/' + QUOTA_HUELVA_CADIZ);
  if (nRutas < QUOTA_RUTAS) missing.push('Rutas ' + nRutas + '/' + QUOTA_RUTAS);
  Object.keys(QUOTA_CATS).forEach(function (c) {
    if ((counts[c] || 0) < QUOTA_CATS[c]) missing.push(c + ' ' + (counts[c] || 0) + '/' + QUOTA_CATS[c]);
  });

  // Cartelera con fallback a la publicada antes.
  var ss = openDb_();
  var sheet = ss.getSheetByName(SHEET_FEED);
  var prevCartelera = [];
  try {
    var prev = sheet ? JSON.parse(sheet.getRange('A1').getValue() || '{}') : {};
    if (Array.isArray(prev.cartelera)) prevCartelera = prev.cartelera;
  } catch (e) { /* primera ejecución: sin anterior */ }
  var cine = scrapeCartelera_(prevCartelera);

  var now = new Date();
  var feed = {
    schemaVersion: 2,
    generatedAt: toIsoMadrid_(now),
    validUntil: toIsoMadrid_(new Date(now.getTime() + VALID_DAYS * 24 * 3600 * 1000)),
    status: (missing.length === 0 && !cine.partial && !fresh.partial) ? 'ok' : 'partial',
    quotasMissing: missing,
    cineErrors: cine.errors,
    searchErrors: fresh.errors,
    planes: planes,
    cartelera: cine.cartelera
  };

  if (!sheet) sheet = ss.insertSheet(SHEET_FEED);
  sheet.clear();
  sheet.getRange('A1').setValue(JSON.stringify(feed));
  Logger.log('Feed: ' + planes.length + ' planes (Sev ' + nSevilla + ' HC ' + nHC + ' Rutas ' + nRutas + ') + ' +
    cine.cartelera.length + ' pelis. Sin cubrir: ' + JSON.stringify(missing) + '. Válido hasta ' + feed.validUntil);
}

// ── Servir el feed ────────────────────────────────────────────
function doGet() {
  var ss = openDb_();
  var sheet = ss ? ss.getSheetByName(SHEET_FEED) : null;
  var data = sheet ? sheet.getRange('A1').getValue() : '{}';
  return ContentService.createTextOutput(data).setMimeType(ContentService.MimeType.JSON);
}
