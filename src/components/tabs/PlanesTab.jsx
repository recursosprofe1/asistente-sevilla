import React, { useState, useEffect, useRef } from "react";
import {
  ConnCorazon, ConnOjoOff, ConnRestaurar, ConnCheck, ConnSync, ConnSol,
  ConnPapelera, ConnPin, ConnReloj, ConnChevron, ConnBrujula,
} from "../illustrations/ConnIcons";
import { ConnCategoryIcon, ConnCategoryGlyph } from "../illustrations/ConnIcons";
import { db, discardPlan, restorePlan, getFeedMeta } from "../../db";
import { syncPlansFromCloud } from "../../services/feedService";
import {
  UNLIMITED_TRAVEL,
  getVisiblePlans,
  getStalePlans,
  filterPlansByTravel,
  partitionUnknownDistance,
  rankPlans,
  withNormalizedCategory,
  toggleInterest,
  addPlanToToday,
  removePlanFromToday
} from "../../services/planRepository";
import { sortCategories } from "../../utils/planCategories";
import { CineMovies, PlanWhy, PlanSourceLink, FeedStatusLine } from "../plans/shared";
import { getTodayKeyMadrid } from "../../utils/time";

export const TRAVEL_OPTIONS = [
  { value: 30, label: "30 min", sub: "Cercano" },
  { value: 45, label: "45 min", sub: "Metro" },
  { value: 60, label: "1 hora", sub: "Provincia" },
  { value: UNLIMITED_TRAVEL, label: "Todo", sub: "Sin límite" }
];

const FILTER_MODES = [
  { value: 'all', label: 'Todos' },
  { value: 'favorites', label: 'Favoritos' },
  { value: 'today', label: 'En Hoy' }
];

function diasRestantesEnPapelera(plan) {
  if (!plan.discardedAt) return 7;
  const diff = Date.now() - plan.discardedAt;
  return Math.max(0, 7 - Math.floor(diff / (1000 * 60 * 60 * 24)));
}

// ── Tarjeta individual ──────────────────────────
function PlanCard({
  plan, showDiscarded, isExpanded, onToggle,
  onToggleInterest, onToggleForToday, onDiscard, onRestore, todayKey
}) {
  const isInterested = plan.userStatus === "interested" || plan.status === "interested";
  const isForToday = plan.isForToday === true && plan.todaySelectionDate === todayKey;
  const diasRestantes = showDiscarded ? diasRestantesEnPapelera(plan) : null;
  const category = withNormalizedCategory(plan);

  return (
    <article className="conn-card overflow-hidden transition-all">
      {/* Cabecera siempre visible */}
      <button
        type="button"
        onClick={() => onToggle(plan.id)}
        aria-expanded={isExpanded}
        aria-controls={`plan-detalle-${plan.id}`}
        aria-label={`${isExpanded ? 'Ocultar' : 'Ver'} detalle de ${plan.title}`}
        className="w-full text-left focus-visible:outline-2 focus-visible:outline-conn-tealDark"
      >
        <div className="flex items-center gap-3 p-4">
          <ConnCategoryIcon category={category} size="sm" />

          <div className="flex-1 min-w-0">
            <h3 className="font-theme-title text-[15px] font-black text-conn-deep leading-snug line-clamp-2">
              {plan.title}
            </h3>
            {(plan.summary || (plan.longDescription && category !== 'Cine')) && (
              <p className="text-[11px] font-semibold text-conn-muted leading-snug line-clamp-2 mt-1">
                {plan.summary || String(plan.longDescription).slice(0, 140)}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1.5 text-[11px] font-bold text-conn-muted">
              <ConnPin className="w-3 h-3" />
              <span className="truncate">{plan.venue}{plan.municipality ? ` · ${plan.municipality}` : ""}</span>
            </div>
            {!showDiscarded && (isInterested || isForToday) && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {isInterested && (
                  <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    Favorito
                  </span>
                )}
                {isForToday && (
                  <span className="text-[10px] font-black text-conn-deep bg-conn-amberSoft px-2 py-0.5 rounded-full">
                    En Hoy
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {showDiscarded ? (
              <span className="text-[10px] font-bold text-conn-muted bg-conn-aqua px-2 py-0.5 rounded-full">
                {diasRestantes === 0 ? "Hoy" : `${diasRestantes}d`}
              </span>
            ) : (
              plan.travelMinutes != null ? (
                <span className="text-[11px] font-black text-conn-tealDark bg-conn-mist px-2 py-0.5 rounded-full">
                  {plan.travelMinutes} min
                </span>
              ) : (
                <span className="text-[10px] font-bold text-conn-muted bg-conn-aqua px-2 py-0.5 rounded-full">
                  Sin distancia
                </span>
              )
            )}
            <ConnChevron arriba={isExpanded} className="w-3.5 h-3.5 text-conn-muted/60" />
          </div>
        </div>

        {plan.priceText && (
          <div className="px-4 pb-3 -mt-1">
            <span className="text-[11px] font-bold text-conn-muted">{plan.priceText}</span>
          </div>
        )}

        {Array.isArray(plan.sesiones) && plan.sesiones.length > 0 && (
          <div className="px-4 pb-3 -mt-1 flex items-center gap-1.5 flex-wrap" aria-label={`Sesiones de ${plan.title}`}>
            {plan.sesiones.slice(0, 4).map((s, i) => (
              <span key={i} className="text-[11px] font-black text-conn-tealDark bg-conn-mist px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
            {plan.sesiones.length > 4 && (
              <span className="text-[10px] font-bold text-conn-muted">+{plan.sesiones.length - 4}</span>
            )}
          </div>
        )}
      </button>

      {!showDiscarded && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <button
            onClick={(e) => onToggleInterest(e, plan)}
            type="button"
            aria-label={isInterested ? `Quitar ${plan.title} de favoritos` : `Marcar ${plan.title} como favorito`}
            aria-pressed={isInterested}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-red-50 active:scale-90 transition-all"
          >
            <ConnCorazon lleno={isInterested} className={`w-5 h-5 ${isInterested ? "text-red-500" : "text-conn-muted/50"}`} />
          </button>
          <button
            onClick={(e) => onToggleForToday(e, plan)}
            type="button"
            aria-label={isForToday ? `Quitar ${plan.title} de Hoy` : `Añadir ${plan.title} a Hoy`}
            aria-pressed={isForToday}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 min-h-[44px] ${
              isForToday
                ? "bg-conn-amberSoft text-conn-deep"
                : "bg-conn-mist text-conn-tealDark"
            }`}
          >
            <ConnSol className="w-3.5 h-3.5" />
            {isForToday ? "En Hoy" : "Añadir a Hoy"}
          </button>
        </div>
      )}

      {/* Detalle expandido */}
      {isExpanded && (
        <div id={`plan-detalle-${plan.id}`} className="border-t border-conn-aqua px-4 py-3 space-y-3">
          {plan.startsAt && (
            <p className="text-[11px] font-bold text-conn-muted flex items-center gap-1.5">
              <ConnReloj className="w-3 h-3" />
              {plan.startsAt}
            </p>
          )}

          {plan.longDescription && (
            category === "Cine" ? (
              <CineMovies longDescription={plan.longDescription} />
            ) : (
              <p className="text-xs text-conn-deep/80 leading-relaxed">{plan.longDescription}</p>
            )
          )}

          <PlanWhy text={plan.whyMatch} tone="teal" />
          <PlanSourceLink url={plan.sourceUrl} />

          <div className="flex items-center justify-between pt-1 border-t border-conn-aqua">
            {showDiscarded ? (
              <button onClick={(e) => onRestore(e, plan.id)} type="button"
                aria-label={`Restaurar ${plan.title}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-conn-teal text-white active:scale-95 mx-auto min-h-[44px]">
                <ConnRestaurar className="w-3.5 h-3.5" />
                Restaurar
              </button>
            ) : (
              <button onClick={(e) => onDiscard(e, plan.id)} type="button"
                aria-label={`Descartar ${plan.title}`}
                className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold text-conn-muted hover:text-red-500 hover:bg-red-50 transition-colors min-h-[44px]">
                <ConnOjoOff className="w-3.5 h-3.5" />
                Descartar
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

// ── Botón circular de categoría (estilo ejemplos) ──
function CategoryCircle({ label, active, onClick, category }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="conn-circle-btn">
      <span className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
        active ? 'bg-conn-teal text-white scale-105' : 'bg-white text-conn-tealDark'
      }`}
        style={{ boxShadow: active
          ? '0 8px 18px -6px rgba(18, 165, 181, 0.55)'
          : '0 6px 14px -8px rgba(10, 91, 102, 0.30)' }}>
        <ConnCategoryGlyph category={category} className="w-6 h-6" />
      </span>
      <span className={`text-[9px] leading-tight text-center font-black max-w-[64px] truncate ${active ? 'text-conn-deep' : 'text-conn-muted'}`}>
        {label}
      </span>
    </button>
  );
}

// ── Tab principal ─────────────────────────────────────────────
export default function PlanesTab({ travelMinutes, setTravelMinutes }) {
  const [plans, setPlans] = useState([]);
  const [discardedPlans, setDiscardedPlans] = useState([]);
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [filterMode, setFilterMode] = useState('all');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [activeCine, setActiveCine] = useState('Todos');
  const [toast, setToast] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedMeta, setFeedMeta] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [showPrevious, setShowPrevious] = useState(false);
  const [staleCount, setStaleCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const toastTimer = useRef(null);
  const todayKey = getTodayKeyMadrid();

  const loadPlansFromDb = async (includeStale = showPrevious) => {
    try {
      setLoadError("");
      const visible = await getVisiblePlans({ includeStale });
      setPlans(rankPlans(visible));
      const all = await db.plans.toArray();
      setTotalCount(all.length);
      setDiscardedPlans(
        all
          .filter((p) => p.userStatus === 'discarded' || p.status === 'discarded')
          .sort((a, b) => (b.discardedAt || 0) - (a.discardedAt || 0))
      );
      setStaleCount((await getStalePlans()).length);
      setFeedMeta(await getFeedMeta());
    } catch (e) {
      console.error("Error cargando planes:", e);
      setLoadError("No se pudieron cargar los planes locales.");
    }
  };

  useEffect(() => {
    loadPlansFromDb();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  };

  const handleTimeChange = async (val) => {
    setTravelMinutes(val);
    await db.preferences.put({ key: "maxTravelMinutes", value: val });
  };

  const handleToggleInterest = async (e, plan) => {
    e.stopPropagation();
    const nowFav = await toggleInterest(plan.id);
    await loadPlansFromDb();
    showToast(nowFav ? "Guardado en favoritos" : "Desmarcado (también sale de Hoy)");
  };

  const handleToggleForToday = async (e, plan) => {
    e.stopPropagation();
    const isForToday = plan.isForToday === true && plan.todaySelectionDate === todayKey;
    if (isForToday) {
      await removePlanFromToday(plan.id);
      showToast("Quitado de Hoy, sigue en favoritos");
    } else {
      await addPlanToToday(plan.id);
      showToast("Añadido a Hoy");
    }
    await loadPlansFromDb();
  };

  const handleSyncCloud = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    showToast("Sincronizando feed… puede tardar unos segundos");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    try {
      const result = await syncPlansFromCloud(db, { signal: controller.signal });
      if (result.success) {
        const parts = [`${result.added} nuevos`, `${result.updated} actualizados`, `${result.unchanged} sin cambios`];
        if (result.stale > 0) parts.push(`${result.stale} retirados del feed`);
        if (result.expired > 0) parts.push(`${result.expired} caducados`);
        showToast(parts.join(' · '));
      } else {
        showToast(`No se pudo actualizar: ${result.error}`);
      }
      await loadPlansFromDb();
    } catch (err) {
      showToast(err.name === "AbortError" ? "Tiempo agotado (>90s), se conserva la caché" : `Error: ${err.message}`);
    } finally {
      clearTimeout(timer);
      setIsSyncing(false);
    }
  };

  // Borra solo la caché remota: preserva favoritos, Hoy y papelera.
  const handleClearRemoteCache = async () => {
    if (!window.confirm("¿Borrar la caché remota? Se conservan tus favoritos, tu selección de Hoy y la papelera.")) return;
    const all = await db.plans.toArray();
    const removable = all
      .filter((p) => {
        const fav = p.userStatus === 'interested' || p.status === 'interested';
        const inToday = p.isForToday === true;
        const inTrash = p.userStatus === 'discarded' || p.status === 'discarded';
        return !fav && !inToday && !inTrash && (p.userStatus === 'new' || !p.userStatus);
      })
      .map((p) => p.id);
    if (removable.length > 0) await db.plans.bulkDelete(removable);
    await loadPlansFromDb();
    showToast(`Caché borrada (${removable.length}). Favoritos, Hoy y papelera intactos.`);
  };

  // Reset total solo para pruebas: borra TODO incluido favoritos y Hoy.
  const handleResetAllForTesting = async () => {
    if (!window.confirm("RESET DE PRUEBAS: ¿borrar TODOS los planes (incluidos favoritos y Hoy)?")) return;
    if (!window.confirm("Confirma de nuevo: esta acción no se puede deshacer.")) return;
    await db.plans.clear();
    try {
      await db.table('feedMeta').delete('plans');
    } catch {
      // Sin tabla en instalaciones antiguas: ignorar.
    }
    setShowPrevious(false);
    await loadPlansFromDb(false);
    showToast("Reset completo: base de planes vacía. Sincroniza para verificar.");
  };

  const handleDiscardPlan = async (e, id) => {
    e.stopPropagation();
    await discardPlan(id);
    await loadPlansFromDb();
    showToast("Plan descartado");
  };

  const handleRestorePlan = async (e, id) => {
    e.stopPropagation();
    await restorePlan(id);
    await loadPlansFromDb();
    showToast("Plan restaurado (no vuelve a Hoy automáticamente)");
  };

  const toggleExpanded = (id) => setExpandedId(expandedId === id ? null : id);

  // Filtros: modo + distancia + categoría
  let base = showDiscarded ? discardedPlans : plans;
  if (!showDiscarded) {
    if (filterMode === 'favorites') base = base.filter((p) => p.userStatus === 'interested' || p.status === 'interested');
    if (filterMode === 'today') base = base.filter((p) => p.isForToday === true && p.todaySelectionDate === todayKey);
  }
  const { known, unknown } = partitionUnknownDistance(base);
  const traveled = showDiscarded ? base : filterPlansByTravel(known, travelMinutes);
  const withUnknown = travelMinutes === UNLIMITED_TRAVEL && !showDiscarded ? [...traveled, ...unknown] : traveled;
  const byCategory = activeCategory === 'Todas' ? withUnknown : withUnknown.filter((p) => withNormalizedCategory(p) === activeCategory);

  const sourceList = byCategory;
  const grouped = sourceList.reduce((acc, plan) => {
    const cat = withNormalizedCategory(plan);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(plan);
    return acc;
  }, {});
  // Cartelera estructurada (una tarjeta por película+cine) en sección propia.
  // La tarjeta agregada legacy (plan-cine-sevilla) sigue en el grupo Cine normal.
  const cineStructuredAll = (grouped['Cine'] || []).filter((p) => String(p.id).startsWith('cine-'));
  if (cineStructuredAll.length > 0) {
    grouped['Cine'] = (grouped['Cine'] || []).filter((p) => !String(p.id).startsWith('cine-'));
    if (grouped['Cine'].length === 0) delete grouped['Cine'];
  }
  const categories = sortCategories(Object.keys(grouped).filter((c) => (grouped[c] || []).length > 0));
  const availableCategories = sortCategories([...new Set(base.map(withNormalizedCategory))]);

  const cineNames = [...new Set(cineStructuredAll.map((p) => p.venue || 'Cines de Sevilla'))].sort((a, b) => a.localeCompare(b, 'es'));
  const cineVisible = activeCine === 'Todos' ? cineStructuredAll : cineStructuredAll.filter((p) => (p.venue || 'Cines de Sevilla') === activeCine);
  const showCineSection = cineStructuredAll.length > 0 && (activeCategory === 'Todas' || activeCategory === 'Cine') && !showDiscarded;

  const feedStale = feedMeta?.validUntil ? Date.parse(feedMeta.validUntil) < Date.now() : false;

  return (
    <div className="space-y-3 pb-28 pt-1">
      {/* Cabecera de estado */}
      <div className="conn-hero px-5 pt-5 pb-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-theme-title text-[22px] font-black leading-tight">Planes</h2>
            <p className="text-[11px] font-bold text-white/85 mt-1" role="status">
              {showDiscarded
                ? `${discardedPlans.length} en papelera · se purgan a los 7 días`
                : `${sourceList.length} sugerencias cerca de ti`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleClearRemoteCache}
              type="button"
              title="Borrar caché remota (conserva favoritos, Hoy y papelera)"
              aria-label="Borrar caché remota, conserva favoritos, Hoy y papelera"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 text-white active:scale-95 transition-all"
            >
              <ConnPapelera className="w-4 h-4" />
            </button>
            <button
              onClick={handleSyncCloud}
              disabled={isSyncing}
              title="Sincronizar planes"
              aria-label="Sincronizar planes"
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white text-conn-tealDark active:scale-95 transition-all disabled:opacity-60"
              style={{ boxShadow: '0 8px 18px -6px rgba(0, 0, 0, 0.30)' }}
            >
              <ConnSync className={`w-5 h-5 ${isSyncing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <FeedStatusLine lastSyncedAt={feedMeta?.lastSyncedAt} stale={feedStale} light />
        {feedStale && (
          <p className="text-[11px] text-conn-amber font-black mt-1" role="status">
            El feed puede estar desactualizado. Sincroniza cuando tengas conexión.
          </p>
        )}
      </div>

      <details className="bg-white rounded-3xl px-4 py-2.5 mx-1" style={{ boxShadow: '0 8px 20px -12px rgba(10, 91, 102, 0.25)' }}>
        <summary className="text-[11px] font-black text-conn-muted cursor-pointer min-h-[40px] flex items-center">
          Diagnóstico: {totalCount} en base · {plans.length} visibles · {discardedPlans.length} en papelera
        </summary>
        <div className="text-[11px] font-semibold text-conn-muted space-y-1 pb-2 pt-1" role="status">
          <p>Retirados del feed (ocultos): {staleCount}</p>
          <p>Última sincronización: {feedMeta?.lastSyncedAt ? new Date(feedMeta.lastSyncedAt).toLocaleString('es-ES') : 'nunca'}</p>
          <p>Generado por el feed: {feedMeta?.generatedAt || 'sin dato'}</p>
          <p>Válido hasta: {feedMeta?.validUntil || 'sin dato'}</p>
          <p>Hash del feed: {feedMeta?.feedHash ? String(feedMeta.feedHash).slice(0, 12) : 'sin dato'}</p>
          <p>Versión de esquema: {feedMeta?.schemaVersion ?? 'sin dato'}</p>
        </div>
      </details>

      {/* Control de tiempo + filtros */}
      <div className="conn-card p-4">
        <p className="text-[11px] font-bold text-conn-muted leading-relaxed mb-2.5">
          ¿Hasta dónde viajas hoy?
        </p>

        <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Tiempo máximo de desplazamiento">
          {TRAVEL_OPTIONS.map((opt) => {
            const isSelected = travelMinutes === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleTimeChange(opt.value)}
                type="button"
                aria-pressed={isSelected}
                className={`flex flex-col items-center py-2 rounded-2xl text-center transition-all duration-200 active:scale-95 min-h-[44px] justify-center ${
                  isSelected ? "bg-conn-teal text-white" : "bg-conn-aqua text-conn-muted"
                }`}
                style={isSelected ? { boxShadow: '0 8px 16px -8px rgba(18, 165, 181, 0.7)' } : undefined}
              >
                <span className="text-[11px] font-black leading-none">{opt.label}</span>
                <span className={`text-[8px] mt-0.5 leading-none font-bold ${isSelected ? "text-white/85" : "text-conn-muted/70"}`}>
                  {opt.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filtros de vista compactos */}
        <div className="flex items-center gap-1.5 mt-2.5" role="group" aria-label="Filtrar planes">
          {FILTER_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => { setFilterMode(m.value); setShowDiscarded(false); }}
              aria-pressed={filterMode === m.value && !showDiscarded}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black min-h-[36px] ${
                filterMode === m.value && !showDiscarded
                  ? 'bg-conn-deep text-white'
                  : 'bg-conn-aqua text-conn-muted'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Filtro por categoría: círculos con icono */}
        {availableCategories.length > 1 && (
          <div className="flex items-start gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1" role="group" aria-label="Filtrar por categoría">
            <CategoryCircle
              label="Todas"
              category="Varios"
              active={activeCategory === 'Todas'}
              onClick={() => setActiveCategory('Todas')}
            />
            {availableCategories.map((c) => (
              <CategoryCircle
                key={c}
                label={c.split(' ')[0]}
                category={c}
                active={activeCategory === c}
                onClick={() => setActiveCategory(c)}
              />
            ))}
          </div>
        )}

        {discardedPlans.length > 0 && (
          <button onClick={() => setShowDiscarded(!showDiscarded)} type="button"
            className="mt-2.5 w-full text-center text-[11px] font-bold text-conn-muted min-h-[36px]">
            {showDiscarded ? "Ver planes activos" : `Ver papelera (${discardedPlans.length})`}
          </button>
        )}

        {!showDiscarded && staleCount > 0 && (
          <button
            onClick={async () => {
              const next = !showPrevious;
              setShowPrevious(next);
              await loadPlansFromDb(next);
            }}
            type="button"
            aria-pressed={showPrevious}
            className="mt-1 w-full text-center text-[11px] font-bold text-conn-muted min-h-[36px]"
          >
            {showPrevious ? "Ocultar anteriores" : `Anteriores retirados (${staleCount})`}
          </button>
        )}

        <button
          onClick={handleResetAllForTesting}
          type="button"
          aria-label="Reset total de pruebas, borra todos los planes"
          className="mt-1 w-full text-center text-[11px] font-bold text-red-300 min-h-[36px]"
        >
          Reset total de pruebas (borra todo)
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite" className="bg-conn-deep text-white text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-fadeIn mx-1">
          <ConnCheck className="w-3 h-3 text-conn-amber" />
          <span>{toast}</span>
        </div>
      )}

      {loadError && (
        <div className="text-center py-8 px-4">
          <p className="text-sm font-black text-conn-deep mb-1">No se pudieron cargar los planes</p>
          <p className="text-xs font-semibold text-conn-muted mb-4">{loadError}</p>
          <button onClick={loadPlansFromDb} type="button" className="px-5 py-2 rounded-full text-xs font-black bg-conn-teal text-white min-h-[44px]">
            Reintentar
          </button>
        </div>
      )}

      {/* Lista agrupada por categoría */}
      {!loadError && (sourceList.length === 0 ? (
        <div className="text-center py-12 px-4">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-conn-mist text-conn-tealDark mb-3">
            <ConnBrujula className="w-7 h-7" />
          </span>
          <p className="font-theme-title text-[15px] font-black text-conn-deep mb-1">
            {showDiscarded ? "La papelera está vacía" : "No hay planes para este filtro"}
          </p>
          <p className="text-xs font-semibold text-conn-muted mb-4">
            {!showDiscarded ? "Prueba con otro radio, categoría o sincroniza el feed." : "Los descartados se purgan a los 7 días."}
          </p>
          {!showDiscarded && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => { setActiveCategory('Todas'); setFilterMode('all'); handleTimeChange(UNLIMITED_TRAVEL); }}
                type="button"
                className="mt-2 px-5 py-2 rounded-full text-xs font-black bg-conn-teal text-white min-h-[44px]">
                Ver todos
              </button>
              <button onClick={handleSyncCloud} type="button" className="mt-2 px-5 py-2 rounded-full text-xs font-black bg-conn-mist text-conn-tealDark min-h-[44px]">
                Sincronizar
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {categories.map((cat) => (
            <section key={cat} aria-label={`Categoría ${cat}`}>
              {/* Cabecera de categoria */}
              <div className="flex items-center gap-2.5 mb-2.5 px-1">
                <ConnCategoryIcon category={cat} size="sm" />
                <div>
                  <p className="font-theme-title text-[15px] font-black text-conn-deep">{cat}</p>
                  <p className="text-[10px] text-conn-muted font-bold">
                    {grouped[cat].length} plan{grouped[cat].length === 1 ? "" : "es"}
                  </p>
                </div>
                <div className="flex-1 h-px bg-conn-tealDark/15 ml-1" />
              </div>

              {/* Tarjetas de esta categoria */}
              <div className="space-y-2.5">
                {grouped[cat].map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    showDiscarded={showDiscarded}
                    isExpanded={expandedId === plan.id}
                    onToggle={toggleExpanded}
                    onToggleInterest={handleToggleInterest}
                    onToggleForToday={handleToggleForToday}
                    onDiscard={handleDiscardPlan}
                    onRestore={handleRestorePlan}
                    todayKey={todayKey}
                  />
                ))}
              </div>
            </section>
          ))}

          {showCineSection && (
            <section aria-label="Cartelera de cine de Sevilla">
              <div className="flex items-center gap-2.5 mb-2.5 px-1">
                <ConnCategoryIcon category="Cine" size="sm" />
                <div>
                  <p className="font-theme-title text-[15px] font-black text-conn-deep">Cartelera de cine</p>
                  <p className="text-[10px] text-conn-muted font-bold">
                    {cineVisible.length} peli{cineVisible.length === 1 ? "" : "s"}{activeCine !== 'Todos' ? ` en ${activeCine}` : ""}
                  </p>
                </div>
                <div className="flex-1 h-px bg-conn-tealDark/15 ml-1" />
              </div>

              {cineNames.length > 1 && (
                <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-1" role="group" aria-label="Filtrar por cine">
                  {['Todos', ...cineNames].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActiveCine(c)}
                      aria-pressed={activeCine === c}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap min-h-[36px] ${
                        activeCine === c ? 'bg-conn-teal text-white' : 'bg-conn-mist text-conn-tealDark'
                      }`}
                    >
                      {c.length > 18 ? c.slice(0, 17) + '…' : c}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2.5">
                {cineVisible.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    showDiscarded={false}
                    isExpanded={expandedId === plan.id}
                    onToggle={toggleExpanded}
                    onToggleInterest={handleToggleInterest}
                    onToggleForToday={handleToggleForToday}
                    onDiscard={handleDiscardPlan}
                    onRestore={handleRestorePlan}
                    todayKey={todayKey}
                  />
                ))}
              </div>
            </section>
          )}

          {travelMinutes !== UNLIMITED_TRAVEL && unknown.length > 0 && !showDiscarded && activeCategory === 'Todas' && (
            <section aria-label="Distancia por calcular">
              <div className="flex items-center gap-2.5 mb-2.5 px-1">
                <div>
                  <p className="font-theme-title text-[15px] font-black text-conn-deep">Distancia por calcular</p>
                  <p className="text-[10px] text-conn-muted font-bold">
                    {unknown.length} plan{unknown.length === 1 ? "" : "es"} sin desplazamiento estimado
                  </p>
                </div>
                <div className="flex-1 h-px bg-conn-tealDark/15 ml-1" />
              </div>
              <div className="space-y-2.5">
                {unknown.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    showDiscarded={false}
                    isExpanded={expandedId === plan.id}
                    onToggle={toggleExpanded}
                    onToggleInterest={handleToggleInterest}
                    onToggleForToday={handleToggleForToday}
                    onDiscard={handleDiscardPlan}
                    onRestore={handleRestorePlan}
                    todayKey={todayKey}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      ))}
    </div>
  );
}
