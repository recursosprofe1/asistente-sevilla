import Dexie from 'dexie';
import { getTodayKeyMadrid, getIsoWeekNumber } from '../utils/time';
import { pickRepesca } from '../utils/repesca';

export const db = new Dexie('AsistentePersonalDB');

// v4: separa estado remoto (feedStatus) del estado del usuario (userStatus)
// y añade renovación diaria de Hoy (todaySelectionDate) + expiración.
db.version(3).stores({
  preferences: 'key',
  plans: 'id, travelMinutes, status',
  tasks: 'id, category, active, status, lastDoneAt',
  purchases: 'id, status, reviewDate, createdAt',
  decisions: 'id, status, reviewDate, createdAt'
});

db.version(4)
  .stores({
    preferences: 'key',
    plans: 'id, travelMinutes, status, userStatus, feedStatus, isForToday, todaySelectionDate, expiresAt',
    tasks: 'id, category, active, status, lastDoneAt',
    purchases: 'id, status, reviewDate, createdAt',
    decisions: 'id, status, reviewDate, createdAt',
    feedMeta: 'key'
  })
  .upgrade(async (tx) => {
    const all = await tx.table('plans').toArray();
    for (const p of all) {
      const patch = {};
      // userStatus desde el status antiguo
      if (!p.userStatus) {
        if (p.status === 'interested') patch.userStatus = 'interested';
        else if (p.status === 'discarded') patch.userStatus = 'discarded';
        else patch.userStatus = 'new';
      }
      if (!p.feedStatus) {
        patch.feedStatus = p.status === 'purged' ? 'expired' : 'active';
      }
      // Normaliza categories[] manteniendo category legacy
      if (!p.categories && p.category) patch.categories = [p.category];
      if (p.summary == null && p.longDescription && p.category !== 'Cine') {
        patch.summary = String(p.longDescription).slice(0, 280);
      }
      // Renovación diaria: los isForToday antiguos sin fecha no se
      // muestran hasta que el usuario los vuelva a añadir.
      if (p.isForToday === true && !p.todaySelectionDate) {
        patch.todaySelectionDate = null;
      }
      if (p.lastSeenAt == null) patch.lastSeenAt = Date.now();
      if (Object.keys(patch).length > 0) {
        await tx.table('plans').update(p.id, patch);
      }
    }
  });

// v5: tablas de recomendaciones (series, pelis, sitios para comer) con el
// mismo modelo userStatus/feedStatus que los planes (favorito/papelera).
db.version(5).stores({
  preferences: 'key',
  plans: 'id, travelMinutes, status, userStatus, feedStatus, isForToday, todaySelectionDate, expiresAt',
  tasks: 'id, category, active, status, lastDoneAt',
  purchases: 'id, status, reviewDate, createdAt',
  decisions: 'id, status, reviewDate, createdAt',
  feedMeta: 'key',
  series: 'id, status, userStatus, feedStatus',
  movies: 'id, status, userStatus, feedStatus',
  places: 'id, status, userStatus, feedStatus'
});

// ─────────────────────────────────────────────────────────────────────────────
// RECOMENDACIONES: helpers genéricos (series / movies / places)
// ─────────────────────────────────────────────────────────────────────────────
const RECO_TABLES = ['series', 'movies', 'places'];

export async function getVisibleRecos(table) {
  const all = await db.table(table).toArray();
  return all.filter((r) => {
    if (!r) return false;
    if (r.reserve === true) return false; // reservas ocultas hasta promocionar
    if (r.seenAt) return false; // consumida y guardada: sale de la lista (vuelve por repesca)
    if (r.userStatus === 'discarded' || r.status === 'discarded') return false;
    if (r.feedStatus === 'expired' || r.feedStatus === 'removed') return false;
    return true;
  });
}

// Favoritas consumidas ("Vista/Ya fui → se queda"): fuera de la lista
// principal, visibles solo bajo el filtro Favoritos y vía repesca.
export async function getSeenFavoriteRecos(table) {
  const all = await db.table(table).toArray();
  return all.filter((r) =>
    r && r.seenAt && r.userStatus === 'interested' &&
    r.feedStatus !== 'expired' && r.feedStatus !== 'removed' &&
    r.userStatus !== 'discarded' && r.status !== 'discarded'
  );
}

// "Vista / Ya fui" con intención de quedarse: favorito consumido. No libera
// reserva (sigue ocupando su hueco visual en Favoritos).
export async function markRecoSeenFavorite(table, id) {
  await db.table(table).update(id, {
    userStatus: 'interested', status: 'interested',
    seenAt: Date.now(), lastSeenAt: Date.now()
  });
}

// La repesca de la semana (UNA sola en toda la app, rota por semana ISO):
// pendiente de consumir y más antigua de 30 días.
export async function getRepescaReco(now = new Date()) {
  const nowMs = now.getTime();
  const candidates = [];
  for (const table of RECO_TABLES) {
    try {
      const seen = await getSeenFavoriteRecos(table);
      for (const r of seen) candidates.push({ ...r, recoTable: table });
    } catch { /* tabla aún sin migrar */ }
  }
  const picked = pickRepesca(candidates, getIsoWeekNumber(now), nowMs);
  return picked ? { ...picked, repesca: true } : null;
}

export async function toggleRecoInterest(table, id) {
  const rec = await db.table(table).get(id);
  if (!rec) return false;
  const interested = rec.userStatus === 'interested' || (!rec.userStatus && rec.status === 'interested');
  if (interested) {
    // Desmarcar favorito saca también de Hoy (misma regla cerrada que planes)
    // y de "consumida": vuelve a la lista normal.
    await db.table(table).update(id, {
      userStatus: 'new', status: 'available', interestedAt: null, seenAt: null,
      isForToday: false, todaySelectionDate: null
    });
    return false;
  }
  await db.table(table).update(id, { userStatus: 'interested', status: 'interested', interestedAt: Date.now(), lastSeenAt: Date.now() });
  return true;
}

export async function discardReco(table, id) {
  await db.table(table).update(id, {
    userStatus: 'discarded', status: 'discarded', discardedAt: Date.now(),
    discardReason: 'disliked', isForToday: false, todaySelectionDate: null
  });
  return promoteReserve(table);
}

// Motivo del descarte: 'seen' (vista/ya fui: gusta + pide repuesto) o
// 'disliked' (no me gusta: evita similares). Libera una reserva si queda.
export async function feedbackReco(table, id, kind) {
  const reason = kind === 'seen' ? 'seen' : 'disliked';
  await db.table(table).update(id, {
    userStatus: 'discarded', status: 'discarded', discardedAt: Date.now(),
    discardReason: reason, isForToday: false, todaySelectionDate: null
  });
  return promoteReserve(table);
}

// Pasa a visible la reserva más antigua. Devuelve el item o null.
export async function promoteReserve(table) {
  const reserves = (await db.table(table).toArray())
    .filter((r) => r && r.reserve === true)
    .sort((a, b) => (a.lastSeenAt || 0) - (b.lastSeenAt || 0));
  if (reserves.length === 0) return null;
  const next = reserves[0];
  await db.table(table).update(next.id, { reserve: false });
  return next;
}

export async function restoreReco(table, id) {
  await db.table(table).update(id, {
    userStatus: 'new', status: 'available', discardedAt: null, feedStatus: 'active', seenAt: null
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HOY PARA RECOS (series / movies / places): espejo exacto de la regla de
// planes — selección manual con renovación diaria; desmarcar favorito saca
// de Hoy, quitar de Hoy conserva el favorito.
// ─────────────────────────────────────────────────────────────────────────────
export async function addRecoToToday(table, id) {
  const rec = await db.table(table).get(id);
  if (!rec) return false;
  // Añadir a Hoy marca automáticamente como interesante para reducir pasos.
  await db.table(table).update(id, {
    isForToday: true,
    todaySelectionDate: getTodayKeyMadrid(),
    userStatus: 'interested',
    status: 'interested',
    interestedAt: rec.interestedAt || Date.now()
  });
  return true;
}

export async function removeRecoFromToday(table, id) {
  // Quitar de Hoy conserva el favorito.
  await db.table(table).update(id, { isForToday: false, todaySelectionDate: null });
}

export async function toggleRecoForToday(table, id) {
  const rec = await db.table(table).get(id);
  if (!rec) return false;
  if (rec.isForToday === true && rec.todaySelectionDate === getTodayKeyMadrid()) {
    await removeRecoFromToday(table, id);
    return false;
  }
  await addRecoToToday(table, id);
  return true;
}

// Recos seleccionados para hoy (de las tres tablas), sin reservas ni papelera.
export async function getTodayRecos(todayKey = getTodayKeyMadrid()) {
  const out = [];
  for (const table of RECO_TABLES) {
    const all = await db.table(table).toArray();
    for (const r of all) {
      if (!r || r.reserve === true) continue;
      if (r.seenAt) continue; // consumida: ya no es selección pendiente
      if (r.isForToday !== true || r.todaySelectionDate !== todayKey) continue;
      if (r.userStatus === 'discarded' || r.status === 'discarded') continue;
      if (r.feedStatus === 'expired' || r.feedStatus === 'removed') continue;
      out.push({ ...r, recoTable: table });
    }
  }
  return out.sort((a, b) => (b.interestedAt || 0) - (a.interestedAt || 0));
}

// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGO LOCAL ESTÁTICO DE TAREAS DOMÉSTICAS (17 tareas en 3 categorías)
// ─────────────────────────────────────────────────────────────────────────────
export const INITIAL_TASKS = [
  // ── MANTENIMIENTO ESTACIONAL ──────────────────────────────────────────────
  {
    id: 'task-filtros-clima',
    title: 'Limpiar filtros del aire acondicionado',
    category: 'estacional',
    season: 'Primavera / Otoño',
    frequency: 'Semestral',
    description: 'Retirar los filtros del split, lavar con agua templada, dejar secar y reinsertar. Aplicar espray antibacteriano.',
    active: true,
    estimatedMinutes: 20,
    lastDoneAt: null
  },
  {
    id: 'task-radiadores',
    title: 'Purgar radiadores y revisar presión de caldera',
    category: 'estacional',
    season: 'Otoño',
    frequency: 'Anual',
    description: 'Purgar el aire del circuito de radiadores con la llave de sangrado. Comprobar manómetro entre 1,2 y 1,5 bar.',
    active: false,
    estimatedMinutes: 25,
    lastDoneAt: null
  },
  {
    id: 'task-ventanas-burletes',
    title: 'Revisar sellado de ventanas y burletes',
    category: 'estacional',
    season: 'Otoño',
    frequency: 'Anual',
    description: 'Comprobar que las gomas cierran sin holguras. Reemplazar burletes desgastados para evitar fugas térmicas.',
    active: false,
    estimatedMinutes: 20,
    lastDoneAt: null
  },
  {
    id: 'task-canalones',
    title: 'Limpiar canalones y desagüe de terraza',
    category: 'estacional',
    season: 'Otoño',
    frequency: 'Anual',
    description: 'Retirar hojas, polvo y restos vegetales acumulados en canalones para prevenir atascos con las primeras lluvias.',
    active: false,
    estimatedMinutes: 30,
    lastDoneAt: null
  },
  {
    id: 'task-colchones',
    title: 'Volteo de colchones y cambio de textil',
    category: 'estacional',
    season: 'Cambio de estación',
    frequency: 'Semestral',
    description: 'Rotar 180° el colchón, airear almohadas. Cambiar edredón, fundam y ropa de cama por la de la temporada.',
    active: false,
    estimatedMinutes: 20,
    lastDoneAt: null
  },
  // ── LIMPIEZA PROFUNDA ─────────────────────────────────────────────────────
  {
    id: 'task-electrodomesticos',
    title: 'Descalcificar cafetera y lavavajillas',
    category: 'limpieza',
    season: 'Continuo',
    frequency: 'Trimestral',
    description: 'Pasar ciclo de vinagre blanco o pastilla antical en cafetera, hervidor y lavavajillas.',
    active: false,
    estimatedMinutes: 30,
    lastDoneAt: null
  },
  {
    id: 'task-juntas-silicona',
    title: 'Revisar juntas de silicona en baños y cocina',
    category: 'limpieza',
    season: 'Continuo',
    frequency: 'Semestral',
    description: 'Aplicar fungicida antimoho o renovar el cordón de silicona si aparece ennegrecido o despegado.',
    active: false,
    estimatedMinutes: 45,
    lastDoneAt: null
  },
  {
    id: 'task-filtros-campana',
    title: 'Desengrasar filtros de campana extractora',
    category: 'limpieza',
    season: 'Continuo',
    frequency: 'Bimensual',
    description: 'Dejar los filtros metálicos en remojo con antigrasa 30 min o lavarlos directamente en el lavavajillas.',
    active: false,
    estimatedMinutes: 20,
    lastDoneAt: null
  },
  {
    id: 'task-nevera-trasera',
    title: 'Limpiar rejilla trasera del frigorífico',
    category: 'limpieza',
    season: 'Continuo',
    frequency: 'Anual',
    description: 'Aspirar el polvo del serpentín trasero. Mejora la eficiencia y reduce el consumo energético notablemente.',
    active: false,
    estimatedMinutes: 15,
    lastDoneAt: null
  },
  {
    id: 'task-desagues',
    title: 'Tratamiento preventivo de desagües',
    category: 'limpieza',
    season: 'Continuo',
    frequency: 'Trimestral',
    description: 'Verter bicarbonato + vinagre blanco en lavabos, duchas y bañera. Esperar 15 min y aclarar con agua hirviendo.',
    active: false,
    estimatedMinutes: 15,
    lastDoneAt: null
  },
  {
    id: 'task-lavadora-goma',
    title: 'Limpiar goma, tambor y filtro de lavadora',
    category: 'limpieza',
    season: 'Continuo',
    frequency: 'Trimestral',
    description: 'Limpiar la goma de la puerta con vinagre, pasar ciclo de limpieza de tambor y vaciar el filtro inferior.',
    active: false,
    estimatedMinutes: 20,
    lastDoneAt: null
  },
  // ── SEGURIDAD Y REVISIONES ────────────────────────────────────────────────
  {
    id: 'task-botiquin',
    title: 'Revisar caducidad del botiquín',
    category: 'seguridad',
    season: 'Continuo',
    frequency: 'Semestral',
    description: 'Llevar medicamentos caducados al punto SIGRE más cercano. Reponer gasas, tiritas, desinfectante y paracetamol.',
    active: false,
    estimatedMinutes: 15,
    lastDoneAt: null
  },
  {
    id: 'task-detectores-humo',
    title: 'Testear detectores de humo y CO',
    category: 'seguridad',
    season: 'Continuo',
    frequency: 'Semestral',
    description: 'Pulsar el botón de prueba de cada detector. Si pita débil, cambiar pilas (recomendado cada 2 años).',
    active: false,
    estimatedMinutes: 10,
    lastDoneAt: null
  },
  {
    id: 'task-llaves-paso',
    title: 'Maniobrar llaves de paso de agua',
    category: 'seguridad',
    season: 'Continuo',
    frequency: 'Anual',
    description: 'Cerrar y abrir lentamente las llaves de escuadra de WC, lavabos y lavadora para evitar que se agarroten.',
    active: false,
    estimatedMinutes: 10,
    lastDoneAt: null
  },
  {
    id: 'task-contratos-luz',
    title: 'Revisar tarifas de luz y gas',
    category: 'seguridad',
    season: 'Continuo',
    frequency: 'Anual',
    description: 'Comparar el precio del kWh en la última factura con los comparadores del mercado. Considerar PVPC o tarifa indexada.',
    active: false,
    estimatedMinutes: 30,
    lastDoneAt: null
  },
  {
    id: 'task-seguro-hogar',
    title: 'Revisar póliza de seguro del hogar',
    category: 'seguridad',
    season: 'Continuo',
    frequency: 'Anual',
    description: 'Actualizar los capitales de continente y contenido. Comparar coberturas con otras compañías al renovar.',
    active: false,
    estimatedMinutes: 20,
    lastDoneAt: null
  },
  {
    id: 'task-extintor',
    title: 'Revisar manómetro del extintor',
    category: 'seguridad',
    season: 'Continuo',
    frequency: 'Anual',
    description: 'Verificar que la aguja del manómetro está en zona verde. Retimbrar o sustituir si tiene más de 5 años.',
    active: false,
    estimatedMinutes: 5,
    lastDoneAt: null
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGO LOCAL ESTÁTICO DE PLANES (12 planes, 15–90 min de desplazamiento)
// ─────────────────────────────────────────────────────────────────────────────
export const INITIAL_PLANES = [];

// ─────────────────────────────────────────────────────────────────────────────
// INICIALIZACIÓN DE LA BASE DE DATOS LOCAL
// ─────────────────────────────────────────────────────────────────────────────
export async function initializeDatabase() {
  try {
    // TAREAS: Seed inicial + garantizar que el catálogo nunca quede vacío
    const taskCount = await db.tasks.count();
    if (taskCount === 0) {
      // bulkPut (no bulkAdd): idempotente ante el doble montaje de StrictMode en dev.
      await db.tasks.bulkPut(INITIAL_TASKS);
    } else if (taskCount < 15) {
      // Re-seed parcial: añadir solo las tareas que falten
      const existing = await db.tasks.toArray();
      const existingIds = new Set(existing.map((t) => t.id));
      const missing = INITIAL_TASKS.filter((t) => !existingIds.has(t.id));
      if (missing.length > 0) await db.tasks.bulkPut(missing);
    }

    // PLANES: Ya no sembramos planes locales por defecto.
    // Solo borramos los antiguos mock de 'plan-local-' para limpiar la BD.
    const currentPlans = await db.plans.toArray();
    const mockIds = currentPlans.map(p => p.id).filter(id => id.startsWith('plan-local-'));
    if (mockIds.length > 0) {
      await db.plans.bulkDelete(mockIds);
    }

    // PAPELERA DE PLANES: purgar descartados con más de 7 días
    await purgeExpiredDiscards();
    await expireOldPlans();
    // HOY: renovación diaria — limpiar selecciones de ayer.
    await clearStaleTodayFlags();

    // PREFERENCIAS por defecto
    const themePref = await db.preferences.get('theme');
    if (!themePref) {
      await db.preferences.put({ key: 'theme', value: 'azul-sereno' });
    }
    const travelPref = await db.preferences.get('maxTravelMinutes');
    if (!travelPref) {
      await db.preferences.put({ key: 'maxTravelMinutes', value: 45 });
    }
  } catch (error) {
    console.error('Error al inicializar Dexie.js:', error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD HELPERS (sin dependencias externas)
// ─────────────────────────────────────────────────────────────────────────────
// PLANES: las mutaciones (favorito / Hoy / papelera) viven en
// src/services/planRepository.js. Aquí solo limpieza y utilidades de bajo nivel.

// Limpia selecciones de Hoy de días anteriores (renovación diaria): marca
// isForToday=false cuando todaySelectionDate ya no es hoy. Devuelve cuántos.
export async function clearStaleTodayFlags(now = new Date()) {
  const todayKey = getTodayKeyMadrid(now);
  let count = 0;
  const tables = ['plans', ...RECO_TABLES];
  for (const table of tables) {
    try {
      const rows = await db.table(table).toArray();
      const stale = rows.filter((r) => r && r.isForToday === true && r.todaySelectionDate !== todayKey);
      for (const r of stale) {
        await db.table(table).update(r.id, { isForToday: false, todaySelectionDate: null });
        count += 1;
      }
    } catch {
      // Tabla indisponible (instalación sin migrar): nada que limpiar.
    }
  }
  return count;
}

// Borra (marca como 'purged') los planes descartados hace más de 7 días.
// No se eliminan físicamente para no interferir con el re-seed del catálogo.
export async function purgeExpiredDiscards() {
  const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;
  const ahora = Date.now();

  const descartados = await db.plans.where('status').equals('discarded').toArray();
  const expirados = descartados.filter(
    (p) => p.discardedAt && ahora - p.discardedAt > SIETE_DIAS_MS
  );

  for (const p of expirados) {
    await db.plans.update(p.id, { status: 'purged', feedStatus: 'expired' });
  }
  return expirados.length;
}

// Marca como expirados los planes con expiresAt pasado (no se borran,
// solo dejan de mostrarse como recomendación actual).
export async function expireOldPlans(now = Date.now()) {
  const all = await db.plans.toArray();
  let count = 0;
  for (const p of all) {
    if (p.expiresAt && Number(p.expiresAt) < now && p.feedStatus !== 'expired') {
      await db.plans.update(p.id, { feedStatus: 'expired', isForToday: false, todaySelectionDate: null });
      count += 1;
    }
  }
  return count;
}

// Metadatos del feed (última sincronización). Tabla feedMeta creada en v4.
export async function getFeedMeta() {
  try {
    return await db.table('feedMeta').get('plans');
  } catch {
    return null;
  }
}

export async function setFeedMeta(patch) {
  try {
    const prev = (await db.table('feedMeta').get('plans')) || { key: 'plans' };
    await db.table('feedMeta').put({ ...prev, key: 'plans', ...patch });
  } catch {
    // Tabla inexistente en instalaciones muy antiguas hasta migrar: ignorar.
  }
}

// TAREAS
export async function toggleTaskActive(id) {
  const task = await db.tasks.get(id);
  if (!task) return false;
  const newActive = !task.active;
  await db.tasks.update(id, { active: newActive });
  return newActive;
}

export async function markTaskDone(id) {
  const nowStr = new Date().toISOString();
  await db.tasks.update(id, { lastDoneAt: nowStr });
  return nowStr;
}

// COMPRAS
export async function addPurchaseDesire(desireText, models = []) {
  const id = `pur-${Date.now()}`;
  const reviewDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const record = {
    id,
    desireTitle: desireText,
    category: 'Necesidad personal',
    reviewDate,
    createdAt: new Date().toISOString(),
    status: 'watching',
    models
  };
  await db.purchases.put(record);
  return record;
}

export async function updatePurchaseStatus(id, status) {
  if (status === 'deferred') {
    // Posponer: ampliar 30 días, mantener estado 'watching'
    const newDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    return await db.purchases.update(id, { status: 'watching', reviewDate: newDate });
  }
  return await db.purchases.update(id, { status });
}

// DECISIONES
export async function addDeferredDecision({ title, reason, criteria, days = 30 }) {
  const id = `dec-${Date.now()}`;
  const reviewDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const record = {
    id,
    title,
    reason,
    criteria,
    reviewDate,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  await db.decisions.put(record);
  return record;
}

export async function updateDecisionStatus(id, status) {
  if (status === 'deferred') {
    // Posponer: cambia el estado a 'deferred' para que salga de la vista 'pending'
    const newDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    return await db.decisions.update(id, { status: 'deferred', reviewDate: newDate });
  }
  return await db.decisions.update(id, { status });
}
