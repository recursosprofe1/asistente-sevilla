import { db } from '../db';
import { getTodayKeyMadrid } from '../utils/time';
import { normalizeCategory } from '../utils/planCategories';

// ─────────────────────────────────────────────────────────────
// Repositorio central de planes. Toda la lógica de Hoy/Planes
// pasa por aquí para no duplicar reglas en los componentes.
// ─────────────────────────────────────────────────────────────

export const UNLIMITED_TRAVEL = 999;

export function isPlanVisible(plan, { includeStale = false } = {}) {
  if (!plan) return false;
  if (plan.userStatus === 'discarded') return false;
  if (plan.feedStatus === 'removed') return false;
  if (plan.feedStatus === 'expired') return false;
  // Los planes que ya no vienen en el feed se ocultan por defecto;
  // la UI ofrece "Mostrar anteriores" para ver el histórico.
  if (plan.feedStatus === 'stale' && !includeStale) return false;
  if (plan.status === 'discarded' || plan.status === 'purged') return false;
  return true;
}

export function isPlanForTodayKey(plan, todayKey) {
  if (!plan || plan.isForToday !== true) return false;
  // Renovación diaria: solo vale la selección hecha hoy.
  if (plan.todaySelectionDate && plan.todaySelectionDate !== todayKey) return false;
  // Si es un registro antiguo sin fecha de selección, se trata como
  // selección pendiente de renovar: no se muestra hasta re-añadir.
  if (!plan.todaySelectionDate) return false;
  return isPlanVisible(plan);
}

export async function getAllPlans() {
  return await db.plans.toArray();
}

export async function getVisiblePlans({ includeStale = false } = {}) {
  const all = await getAllPlans();
  return all.filter((p) => isPlanVisible(p, { includeStale }));
}

export async function getStalePlans() {
  const all = await getAllPlans();
  return all.filter((p) => p.feedStatus === 'stale' && p.userStatus !== 'discarded' && p.status !== 'discarded' && p.status !== 'purged');
}

export async function getTodayPlans(todayKey = getTodayKeyMadrid()) {
  const all = await getAllPlans();
  return all
    .filter((p) => isPlanForTodayKey(p, todayKey))
    .sort((a, b) => (b.interestedAt || 0) - (a.interestedAt || 0));
}

export function filterPlansByTravel(plans, maxMinutes) {
  if (maxMinutes === UNLIMITED_TRAVEL) return plans;
  return plans.filter((p) => {
    // Distancia desconocida: no se trata como 0, se excluye del filtro
    // numérico y se agrupa aparte en la UI.
    if (p.travelMinutes == null) return false;
    return Number(p.travelMinutes) <= maxMinutes;
  });
}

export function partitionUnknownDistance(plans) {
  return {
    known: plans.filter((p) => p.travelMinutes != null),
    unknown: plans.filter((p) => p.travelMinutes == null)
  };
}

// Orden estable: interesados primero, luego menor desplazamiento,
// luego más recientes en el feed.
export function rankPlans(plans) {
  return [...plans].sort((a, b) => {
    const ai = a.userStatus === 'interested' || a.status === 'interested' ? 0 : 1;
    const bi = b.userStatus === 'interested' || b.status === 'interested' ? 0 : 1;
    if (ai !== bi) return ai - bi;
    const at = a.travelMinutes ?? 9999;
    const bt = b.travelMinutes ?? 9999;
    if (at !== bt) return at - bt;
    return (b.lastSeenAt || 0) - (a.lastSeenAt || 0);
  });
}

// ── Mutaciones con invariantes ────────────────────────────────

export async function toggleInterest(id) {
  const plan = await db.plans.get(id);
  if (!plan) return false;
  const interested = plan.userStatus === 'interested' || (!plan.userStatus && plan.status === 'interested');
  const todayKey = getTodayKeyMadrid();
  if (interested) {
    // Desmarcar interés saca también de Hoy (decisión cerrada).
    await db.plans.update(id, {
      userStatus: 'new',
      status: 'available',
      interestedAt: null,
      isForToday: false,
      todaySelectionDate: null
    });
    return false;
  }
  await db.plans.update(id, {
    userStatus: 'interested',
    status: 'interested',
    interestedAt: Date.now(),
    lastSeenAt: Date.now()
  });
  void todayKey;
  return true;
}

export async function addPlanToToday(id) {
  const plan = await db.plans.get(id);
  if (!plan) return false;
  // Añadir a Hoy marca automáticamente como interesante para reducir pasos.
  await db.plans.update(id, {
    isForToday: true,
    todaySelectionDate: getTodayKeyMadrid(),
    userStatus: 'interested',
    status: 'interested',
    interestedAt: plan.interestedAt || Date.now()
  });
  return true;
}

export async function removePlanFromToday(id) {
  // Quitar de Hoy conserva el favorito (decisión cerrada).
  await db.plans.update(id, { isForToday: false, todaySelectionDate: null });
}

export async function togglePlanForToday(id) {
  const plan = await db.plans.get(id);
  if (!plan) return false;
  if (plan.isForToday && plan.todaySelectionDate === getTodayKeyMadrid()) {
    await removePlanFromToday(id);
    return false;
  }
  await addPlanToToday(id);
  return true;
}

export async function discardPlan(id) {
  await db.plans.update(id, {
    userStatus: 'discarded',
    status: 'discarded',
    discardedAt: Date.now(),
    isForToday: false,
    todaySelectionDate: null
  });
}

export async function restorePlan(id) {
  // Restaurar vuelve a Planes, pero no a Hoy (decisión cerrada).
  await db.plans.update(id, {
    userStatus: 'new',
    status: 'available',
    discardedAt: null,
    isForToday: false,
    todaySelectionDate: null,
    feedStatus: 'active'
  });
}

export function withNormalizedCategory(plan) {
  const raw = plan.categories ?? plan.category ?? 'Varios';
  const hint = [plan.title, plan.summary, plan.longDescription, plan.venue].filter(Boolean).join(' ');
  return normalizeCategory(raw, hint);
}
