// feedService.js — sincronización del feed remoto con caché local Dexie.
// El feed puede ser FeedV2 (planes[] + cartelera[]) o el formato legacy
// (planes con category/longDescription + cine.peliculas).

import { normalizeCategory } from '../utils/planCategories';
import { normalizeSerie, normalizeMovie, normalizePlace, syncRecosFromFeed } from './recoService';

// Sugerencias locales de compras (100% local, sin red). Las usa ComprasTab.
const LOCAL_SUGGESTIONS = [
  {
    keywords: ['auricular', 'casco', 'headphone', 'headset', 'inalambric'],
    models: [
      { name: 'Sony WH-1000XM5', price: '199 € – 259 €', note: 'Mejor cancelación de ruido activa del mercado (2024)' },
      { name: 'Soundcore Space Q45', price: '79 € – 119 €', note: 'Mejor relación calidad/precio, 50 h de batería' }
    ]
  },
  {
    keywords: ['cafetera', 'café', 'espresso', 'nespresso', 'dolce'],
    models: [
      { name: "De'Longhi Dedica EC685", price: '139 € – 179 €', note: 'Compacta, robusta y café de barista en casa' },
      { name: 'Nespresso Vertuo Pop', price: '69 € – 99 €', note: 'Comodidad máxima en cápsulas, limpieza fácil' }
    ]
  },
  {
    keywords: ['movil', 'móvil', 'telefono', 'teléfono', 'smartphone', 'iphone', 'android'],
    models: [
      { name: 'Google Pixel 9a', price: '499 € – 549 €', note: 'Mejor cámara gama media, 7 años de actualizaciones' },
      { name: 'Samsung Galaxy Tab S9 FE', price: '299 € – 379 €', note: 'Android versátil con S-Pen incluido' }
    ]
  }
];

const GENERIC_SUGGESTIONS = [
  { name: 'Mejor valorado en su categoría (Amazon)', price: '50 € – 130 €', note: 'Más de 5.000 reseñas verificadas' },
  { name: 'Opción premium duradera', price: '130 € – 250 €', note: 'Materiales de calidad superior, garantía mínima 2 años' }
];

export function getLocalPurchaseSuggestions(desireText) {
  if (!desireText || desireText.trim().length < 2) return GENERIC_SUGGESTIONS;
  const normalized = desireText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const entry of LOCAL_SUGGESTIONS) {
    if (entry.keywords.some((kw) => normalized.includes(kw))) return entry.models;
  }
  return GENERIC_SUGGESTIONS;
}

export const DEFAULT_APPS_SCRIPT_URL = 'https://raw.githubusercontent.com/recursosprofe1/asistente-sevilla/main/feeds/feed-latest.json';

let syncInFlight = null;

function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

export function stablePlanId(p) {
  if (p.id) return String(p.id);
  // Sin índice: el ID no cambia si el feed reordena los planes.
  const base = [p.sourceUrl || '', p.title || '', p.startsAt || '', p.venue || ''].join('|');
  return `remote-plan-${hashString(base)}`;
}

export function feedHashOf(text) {
  return hashString(String(text ?? ''));
}

// Firma de contenido para distinguir "nuevo" de "sin cambios".
// Excluye lastSeenAt/lastSyncedAt y estados locales.
export function planSignature(p) {
  return [
    p.title || '',
    p.venue || '',
    p.municipality || '',
    p.travelMinutes ?? '',
    p.priceText || '',
    p.category || '',
    p.startsAt || '',
    p.endsAt || '',
    p.whyMatch || '',
    p.longDescription || '',
    p.sourceUrl || '',
    p.expiresAt ?? ''
  ].join('|');
}

function normalizeTravelMinutes(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function normalizeUrl(u) {
  if (!u) return '';
  const s = String(u).trim();
  // Solo https por seguridad y para evitar deep-links rotos.
  if (/^https:\/\//i.test(s)) return s;
  return '';
}

const MESES_ES = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9,
  noviembre: 10, diciembre: 11
};

function stripAccentsLower(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Parseo defensivo de fechas en español para expiresAt.
// Cubre "Del 2 al 6 de septiembre", "2 de septiembre", "Esta semana".
// Devuelve timestamp (fin de día, Europe/Madrid aprox.) o null.
export function parseSpanishExpiresAt(text, now = Date.now()) {
  const t = stripAccentsLower(text);
  if (!t || t.includes('proximamente') || t.includes('consultar') || t.includes('por confirmar')) return null;
  const ref = new Date(now);
  const year = ref.getFullYear();
  const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x.getTime(); };

  // "del 2 al 6 de septiembre" (con o sin "del")
  let m = t.match(/(\d{1,2})\s+al\s+(\d{1,2})\s+de\s+([a-z]+)/);
  if (m) {
    const month = MESES_ES[m[3]];
    if (month != null) {
      let d = new Date(year, month, Number(m[2]));
      if (d.getTime() < now - 24 * 3600 * 1000) d = new Date(year + 1, month, Number(m[2]));
      return endOfDay(d);
    }
  }
  // "2 de septiembre" / "2 septiembre"
  m = t.match(/(\d{1,2})\s+(?:de\s+)?([a-z]+)/);
  if (m) {
    const month = MESES_ES[m[2]];
    if (month != null) {
      let d = new Date(year, month, Number(m[1]));
      if (d.getTime() < now - 24 * 3600 * 1000) d = new Date(year + 1, month, Number(m[1]));
      return endOfDay(d);
    }
  }
  // "esta semana" -> domingo 23:59
  if (t.includes('esta semana')) {
    const d = new Date(ref);
    const diff = (7 - d.getDay()) % 7;
    d.setDate(d.getDate() + diff);
    return endOfDay(d);
  }
  return null;
}

function toExpiresAt(p, now = Date.now()) {
  for (const k of ['expiresAt', 'endsAt']) {
    const v = p[k];
    if (!v) continue;
    const t = Date.parse(v);
    if (Number.isFinite(t)) return t;
  }
  // startsAt solo si es ISO parseable; el texto bonito español va al
  // parseo defensivo para no caducar todo por NaN.
  if (p.startsAt) {
    const t = Date.parse(p.startsAt);
    if (Number.isFinite(t)) return t;
    const es = parseSpanishExpiresAt(p.startsAt, now);
    if (es) return es;
  }
  return null;
}

function normalizePlan(p, now) {
  const categoriesRaw = p.categories ?? p.category ?? 'Varios';
  const canonical = normalizeCategory(categoriesRaw);
  const isRuta = canonical === 'Rutas y naturaleza';
  return {
    id: stablePlanId(p),
    title: p.title || 'Plan sugerido',
    summary: p.summary || (p.longDescription && canonical !== 'Cine' ? String(p.longDescription).slice(0, 280) : ''),
    venue: p.venue || 'Ubicación desconocida',
    municipality: p.municipality || 'Sevilla',
    travelMinutes: normalizeTravelMinutes(p.travelMinutes),
    priceText: p.priceText || 'Consultar',
    category: canonical,
    categories: Array.isArray(categoriesRaw) ? categoriesRaw.map(String) : [String(categoriesRaw || 'Varios')],
    startsAt: p.startsAt || (isRuta ? 'Sin fecha fija' : 'Próximamente'),
    endsAt: p.endsAt || null,
    whyMatch: p.whyMatch || 'Sugerido por el asistente.',
    longDescription: p.longDescription || p.summary || '',
    sourceUrl: normalizeUrl(p.sourceUrl),
    expiresAt: toExpiresAt(p, now),
    sourceName: p.sourceName || '',
    verifiedAt: p.verifiedAt || null,
    lastSeenAt: now,
    lastSyncedAt: now,
    feedStatus: 'active'
  };
}

function normalizeLegacyCine(data, now) {
  const cine = data.cine;
  if (!cine || !Array.isArray(cine.peliculas) || cine.peliculas.length === 0) return null;
  return {
    id: 'plan-cine-sevilla',
    title: cine.title || 'Cartelera de cine en Sevilla',
    venue: cine.venue || 'Cines de Sevilla',
    municipality: cine.municipality || 'Sevilla',
    travelMinutes: normalizeTravelMinutes(cine.travelMinutes ?? 15),
    priceText: cine.priceText || '~8€',
    category: 'Cine',
    categories: ['Cine'],
    startsAt: 'Esta semana',
    endsAt: null,
    whyMatch: cine.whyMatch || 'Cartelera completa de Sevilla',
    longDescription: JSON.stringify(cine.peliculas),
    sourceUrl: '',
    expiresAt: null,
    lastSeenAt: now,
    lastSyncedAt: now,
    feedStatus: 'active'
  };
}

function normalizeCarteleraItems(cartelera, now) {
  if (!Array.isArray(cartelera)) return [];
  return cartelera
    .filter((m) => m && (m.titulo || m.title))
    .map((m, idx) => {
      const title = m.titulo || m.title;
      const sesiones = Array.isArray(m.sesiones) ? m.sesiones.map(String)
        : Array.isArray(m.horarios) ? m.horarios.map(String) : [];
      const base = {
        title: `Cine: ${title}`,
        venue: m.cine || m.venue || 'Cines de Sevilla',
        municipality: m.municipality || 'Sevilla',
        travelMinutes: normalizeTravelMinutes(m.travelMinutes),
        priceText: m.precio || m.priceText || '~8€',
        category: 'Cine',
        categories: ['Cine'],
        startsAt: m.fecha || m.startsAt || 'Esta semana',
        whyMatch: m.sinopsis || m.whyMatch || 'En cartelera en Sevilla',
        longDescription: m.sinopsis || m.summary || '',
        sourceUrl: normalizeUrl(m.url || m.sourceUrl)
      };
      const plan = { ...normalizePlan(base, now), id: `cine-${hashString(title + '|' + (base.venue || ''))}` };
      if (sesiones.length > 0) plan.sesiones = sesiones;
      void idx;
      return plan;
    });
}

/**
 * Sincroniza el feed remoto en Dexie.
 * - No toca Dexie hasta validar el JSON.
 * - Preserva estados locales (favorito, Hoy, papelera).
 * - Marca como stale los que desaparecen y expired los caducados.
 * - Guarda metadatos de sincronización en feedMeta.
 */
export async function syncPlansFromCloud(db, { signal } = {}) {
  if (syncInFlight) return syncInFlight;
  syncInFlight = (async () => {
    try {
      const response = await fetch(DEFAULT_APPS_SCRIPT_URL, signal ? { signal } : undefined);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const rawText = await response.text();
      const feedHash = feedHashOf(rawText);
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        return { success: false, error: 'El feed devolvió un contenido no JSON. Se conserva la caché anterior.' };
      }
      const now = Date.now();

      const planesRaw = Array.isArray(data?.planes) ? data.planes : null;
      const carteleraRaw = Array.isArray(data?.cartelera) ? data.cartelera : null;
      const legacyCine = data?.cine;
      if (!planesRaw && !carteleraRaw && !legacyCine?.peliculas) {
        return { success: false, error: data?.error || 'El feed devolvió un JSON vacío o inválido. Se conserva la caché anterior.' };
      }

      const normalized = (planesRaw || []).map((p) => normalizePlan(p, now));
      const cineItems = normalizeCarteleraItems(carteleraRaw || [], now);
      const legacy = normalizeLegacyCine(data, now);
      const incoming = [...normalized, ...cineItems, ...(legacy ? [legacy] : [])];

      // Desempata colisiones de ID deterministas (sin índice del feed).
      const seenIds = new Map();
      for (const p of incoming) {
        const n = seenIds.get(p.id) || 0;
        seenIds.set(p.id, n + 1);
        if (n > 0) p.id = `${p.id}-${n}`;
      }

      // Rechaza eventos sin título o sin fuente válida cuando el feed
      // declara ser FeedV2 (en legacy se es más permisivo).
      const isV2 = (data?.schemaVersion ?? 2) >= 2;
      const valid = incoming.filter((p) => {
        if (!p.title) return false;
        if (isV2 && !p.startsAt) return false;
        return true;
      });

      const existing = await db.plans.toArray();
      const existingMap = new Map(existing.map((p) => [p.id, p]));
      const incomingIds = new Set(valid.map((p) => p.id));

      let added = 0;
      let updated = 0;
      let unchanged = 0;
      const toPut = valid.map((p) => {
        const prev = existingMap.get(p.id);
        if (!prev) {
          added += 1;
          return {
            ...p,
            status: 'available',
            userStatus: 'new',
            isForToday: false,
            todaySelectionDate: null,
            interestedAt: null,
            discardedAt: null
          };
        }
        // Compara contenido para no anunciar "actualizados" cuando nada cambió.
        if (planSignature(prev) === planSignature(p)) {
          unchanged += 1;
        } else {
          updated += 1;
        }
        // Preserva decisiones del usuario.
        return {
          ...p,
          status: prev.status ?? 'available',
          userStatus: prev.userStatus ?? (prev.status === 'interested' ? 'interested' : prev.status === 'discarded' ? 'discarded' : 'new'),
          isForToday: prev.isForToday ?? false,
          todaySelectionDate: prev.todaySelectionDate ?? null,
          interestedAt: prev.interestedAt ?? null,
          discardedAt: prev.discardedAt ?? null
        };
      });

      // Reconciliación: los que ya no vienen en el feed pasan a stale
      // (se conservan como histórico, no se borran).
      let stale = 0;
      for (const prev of existing) {
        if (!incomingIds.has(prev.id) && prev.id !== 'plan-cine-sevilla' && !String(prev.id).startsWith('remote-plan-') && !String(prev.id).startsWith('cine-')) {
          continue; // registros locales de otras fuentes: no tocar
        }
        if (!incomingIds.has(prev.id) && (prev.feedStatus === 'active' || !prev.feedStatus)) {
          stale += 1;
          toPut.push({ ...prev, feedStatus: 'stale', lastSyncedAt: now });
        }
      }

      // Expiración por fecha.
      let expired = 0;
      for (const p of toPut) {
        if (p.expiresAt && p.expiresAt < now && p.feedStatus !== 'expired') {
          expired += 1;
          p.feedStatus = 'expired';
          p.isForToday = false;
          p.todaySelectionDate = null;
        }
      }

      await db.plans.bulkPut(toPut);

      // Series, pelis y sitios: mismo cuidado con favorito/papelera.
      let recoSummary = '';
      try {
        const rS = await syncRecosFromFeed(db, 'series', normalizeSerie, data?.series);
        const rM = await syncRecosFromFeed(db, 'movies', normalizeMovie, data?.movies);
        const rP = await syncRecosFromFeed(db, 'places', normalizePlace, data?.places);
        const parts = [];
        if ((rS.added + rM.added + rP.added) > 0) parts.push(`${rS.added + rM.added + rP.added} recos nuevas`);
        recoSummary = parts.join(' · ');
      } catch {
        // Tablas aún sin migrar (v5 pendiente): no bloquea el sync de planes.
      }

      let prevMeta = null;
      try {
        prevMeta = await db.table('feedMeta').get('plans');
      } catch {
        prevMeta = null;
      }
      const meta = {
        key: 'plans',
        lastSyncedAt: now,
        generatedAt: data?.generatedAt || prevMeta?.generatedAt || null,
        validUntil: data?.validUntil || null,
        feedStatus: data?.status || 'ok',
        schemaVersion: data?.schemaVersion ?? 2,
        count: toPut.length,
        feedHash
      };
      try {
        await db.table('feedMeta').put({ ...(prevMeta || {}), ...meta });
      } catch {
        // Instalaciones sin tabla feedMeta hasta migrar: no es crítico.
      }

      return { success: true, count: toPut.length, added, updated, unchanged, stale, expired, feedHash, generatedAt: meta.generatedAt, validUntil: meta.validUntil, recoSummary };
    } catch (err) {
      if (err?.name === 'AbortError') return { success: false, error: 'Tiempo de sincronización agotado. Se conserva la caché anterior.', aborted: true };
      return { success: false, error: err.message || 'Error de red. Se conserva la caché anterior.' };
    } finally {
      syncInFlight = null;
    }
  })();
  return syncInFlight;
}
