import React, { useState, useEffect, useRef } from "react";
import {
  Heart, EyeOff, RotateCcw, Check, RefreshCw, Sun,
  Trash2, Sparkles, MapPin, Clock, ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";
import { SereneCompass } from "../illustrations/MeditoVectors";
import { PlanCategoryIcon } from "../illustrations/PlanCategoryIcons";
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
  { value: 45, label: "45 min", sub: "Metropolitano" },
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
    <article
      className={`bg-white rounded-3xl overflow-hidden shadow-sm border transition-all ${
        isInterested && !showDiscarded ? "border-blue-200" : "border-slate-100"
      }`}
    >
      {/* Cabecera siempre visible */}
      <button
        type="button"
        onClick={() => onToggle(plan.id)}
        aria-expanded={isExpanded}
        aria-controls={`plan-detalle-${plan.id}`}
        aria-label={`${isExpanded ? 'Ocultar' : 'Ver'} detalle de ${plan.title}`}
        className="w-full text-left focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        <div className="flex items-center gap-3 p-4">
          <PlanCategoryIcon category={category} size="sm" />

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
              {plan.title}
            </h3>
            {(plan.summary || (plan.longDescription && category !== 'Cine')) && (
              <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mt-1">
                {plan.summary || String(plan.longDescription).slice(0, 140)}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{plan.venue}{plan.municipality ? ` · ${plan.municipality}` : ""}</span>
            </div>
            {!showDiscarded && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {isInterested && (
                  <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    Favorito
                  </span>
                )}
                {isForToday && (
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    En Hoy
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {showDiscarded ? (
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {diasRestantes === 0 ? "Hoy" : `${diasRestantes}d`}
              </span>
            ) : (
              <>
                {plan.travelMinutes != null ? (
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {plan.travelMinutes} min
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    Distancia por calcular
                  </span>
                )}
              </>
            )}
            {isExpanded
              ? <ChevronUp className="w-3.5 h-3.5 text-slate-300" />
              : <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
            }
          </div>
        </div>

        {plan.priceText && (
          <div className="px-4 pb-3 -mt-1">
            <span className="text-[11px] font-semibold text-slate-400">{plan.priceText}</span>
          </div>
        )}

        {Array.isArray(plan.sesiones) && plan.sesiones.length > 0 && (
          <div className="px-4 pb-3 -mt-1 flex items-center gap-1.5 flex-wrap" aria-label={`Sesiones de ${plan.title}`}>
            {plan.sesiones.slice(0, 4).map((s, i) => (
              <span key={i} className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
            {plan.sesiones.length > 4 && (
              <span className="text-[10px] font-semibold text-slate-400">+{plan.sesiones.length - 4}</span>
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
            <Heart className={`w-4 h-4 ${isInterested ? "fill-red-500 text-red-500" : "text-slate-300"}`} />
          </button>
          <button
            onClick={(e) => onToggleForToday(e, plan)}
            type="button"
            aria-label={isForToday ? `Quitar ${plan.title} de Hoy` : `Añadir ${plan.title} a Hoy`}
            aria-pressed={isForToday}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 min-h-[44px] ${
              isForToday
                ? "bg-orange-100 text-orange-700 border border-orange-200"
                : "bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-700"
            }`}
          >
            <Sun className={`w-3.5 h-3.5 ${isForToday ? "text-orange-500" : ""}`} />
            {isForToday ? "En Hoy" : "Añadir a Hoy"}
          </button>
        </div>
      )}

      {/* Detalle expandido */}
      {isExpanded && (
        <div id={`plan-detalle-${plan.id}`} className="border-t border-slate-50 px-4 py-3 space-y-3">
          {plan.startsAt && (
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-400" />
              {plan.startsAt}
            </p>
          )}

          {plan.longDescription && (
            category === "Cine" ? (
              <CineMovies longDescription={plan.longDescription} />
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">{plan.longDescription}</p>
            )
          )}

          <PlanWhy text={plan.whyMatch} tone="blue" />
          <PlanSourceLink url={plan.sourceUrl} />

          <div className="flex items-center justify-between pt-1 border-t border-slate-50">
            {showDiscarded ? (
              <button onClick={(e) => onRestore(e, plan.id)} type="button"
                aria-label={`Restaurar ${plan.title}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-blue-600 text-white active:scale-95 mx-auto min-h-[44px]">
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar
              </button>
            ) : (
              <button onClick={(e) => onDiscard(e, plan.id)} type="button"
                aria-label={`Descartar ${plan.title}`}
                className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors min-h-[44px]">
                <EyeOff className="w-3.5 h-3.5" />
                Descartar
              </button>
            )}
          </div>
        </div>
      )}
    </article>
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
      <div className="px-1 pt-1">
        <h2 className="text-xl font-bold text-slate-900 leading-tight">Planes</h2>
        <p className="text-xs text-slate-500 mt-1" role="status">
          {showDiscarded
            ? `${discardedPlans.length} en papelera · se purgan a los 7 días`
            : `${sourceList.length} sugerencias · ~20 planes por categorías`}
        </p>
        <FeedStatusLine lastSyncedAt={feedMeta?.lastSyncedAt} stale={feedStale} />
        {feedStale && (
          <p className="text-[11px] text-amber-600 font-semibold mt-1" role="status">
            El feed puede estar desactualizado. Sincroniza cuando tengas conexión.
          </p>
        )}
        <details className="mt-2 bg-white rounded-2xl border border-slate-100 px-3 py-2">
          <summary className="text-[11px] font-bold text-slate-500 cursor-pointer min-h-[44px] flex items-center">
            Diagnóstico: {totalCount} en base · {plans.length} visibles · {discardedPlans.length} en papelera
          </summary>
          <div className="text-[11px] text-slate-500 space-y-1 pb-2 pt-1" role="status">
            <p>Retirados del feed (ocultos): {staleCount}</p>
            <p>Última sincronización: {feedMeta?.lastSyncedAt ? new Date(feedMeta.lastSyncedAt).toLocaleString('es-ES') : 'nunca'}</p>
            <p>Generado por el feed: {feedMeta?.generatedAt || 'sin dato'}</p>
            <p>Válido hasta: {feedMeta?.validUntil || 'sin dato'}</p>
            <p>Hash del feed: {feedMeta?.feedHash ? String(feedMeta.feedHash).slice(0, 12) : 'sin dato'}</p>
            <p>Versión de esquema: {feedMeta?.schemaVersion ?? 'sin dato'}</p>
          </div>
        </details>
      </div>

      {/* Control de tiempo */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            Selecciona el tiempo máximo que estás dispuesto a viajar.
          </p>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={handleClearRemoteCache}
              type="button"
              title="Borrar caché remota (conserva favoritos, Hoy y papelera)"
              aria-label="Borrar caché remota, conserva favoritos, Hoy y papelera"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleSyncCloud}
              disabled={isSyncing}
              title="Sincronizar planes"
              aria-label="Sincronizar planes"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm active:scale-95 transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2" role="group" aria-label="Tiempo máximo de desplazamiento">
          {TRAVEL_OPTIONS.map((opt) => {
            const isSelected = travelMinutes === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleTimeChange(opt.value)}
                type="button"
                aria-pressed={isSelected}
                className={`flex flex-col items-center py-2.5 rounded-2xl text-center transition-all duration-200 active:scale-95 min-h-[44px] ${
                  isSelected ? "bg-blue-600 text-white shadow-sm scale-105" : "bg-slate-50 text-slate-500 border border-slate-200"
                }`}
              >
                <span className="text-xs font-bold leading-none">{opt.label}</span>
                <span className={`text-[9px] mt-1 leading-none font-medium ${isSelected ? "text-blue-200" : "text-slate-400"}`}>
                  {opt.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filtros de vista */}
        <div className="flex items-center gap-2 mt-3 flex-wrap" role="group" aria-label="Filtrar planes">
          {FILTER_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => { setFilterMode(m.value); setShowDiscarded(false); }}
              aria-pressed={filterMode === m.value && !showDiscarded}
              className={`px-3 py-2 rounded-full text-[11px] font-bold min-h-[44px] ${
                filterMode === m.value && !showDiscarded
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Filtro por categoría */}
        {availableCategories.length > 1 && (
          <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por categoría">
            {['Todas', ...availableCategories].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCategory(c)}
                aria-pressed={activeCategory === c}
                className={`px-3 py-2 rounded-full text-[11px] font-semibold whitespace-nowrap min-h-[44px] ${
                  activeCategory === c ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {discardedPlans.length > 0 && (
          <button onClick={() => setShowDiscarded(!showDiscarded)} type="button"
            className="mt-3 w-full text-center text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors min-h-[44px]">
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
            className="mt-2 w-full text-center text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors min-h-[44px]"
          >
            {showPrevious ? "Ocultar anteriores" : `Mostrar anteriores retirados del feed (${staleCount})`}
          </button>
        )}

        <button
          onClick={handleResetAllForTesting}
          type="button"
          aria-label="Reset total de pruebas, borra todos los planes"
          className="mt-2 w-full text-center text-[11px] font-semibold text-red-300 hover:text-red-500 transition-colors min-h-[44px]"
        >
          Reset total de pruebas (borra todo)
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite" className="bg-slate-900 text-white text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-fadeIn mx-1">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {loadError && (
        <div className="text-center py-8 px-4">
          <p className="text-sm font-semibold text-slate-500 mb-1">No se pudieron cargar los planes</p>
          <p className="text-xs text-slate-400 mb-4">{loadError}</p>
          <button onClick={loadPlansFromDb} type="button" className="px-5 py-2 rounded-full text-xs font-semibold bg-blue-600 text-white min-h-[44px]">
            Reintentar
          </button>
        </div>
      )}

      {/* Lista agrupada por categoría */}
      {!loadError && (sourceList.length === 0 ? (
        <div className="text-center py-12 px-4">
          <SereneCompass className="w-10 h-10 mx-auto text-slate-200 mb-3" />
          <p className="text-sm font-semibold text-slate-400 mb-1">
            {showDiscarded ? "La papelera está vacía" : "No hay planes para este filtro"}
          </p>
          <p className="text-xs text-slate-400 mb-4">
            {!showDiscarded ? "Prueba con otro radio, categoría o sincroniza el feed." : "Los descartados se purgan a los 7 días."}
          </p>
          {!showDiscarded && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => { setActiveCategory('Todas'); setFilterMode('all'); handleTimeChange(UNLIMITED_TRAVEL); }}
                type="button"
                className="mt-2 px-5 py-2 rounded-full text-xs font-semibold bg-blue-600 text-white min-h-[44px]">
                Ver todos
              </button>
              <button onClick={handleSyncCloud} type="button" className="mt-2 px-5 py-2 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 min-h-[44px]">
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
                <PlanCategoryIcon category={cat} size="sm" />
                <div>
                  <p className="text-sm font-black text-slate-800">{cat}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {grouped[cat].length} plan{grouped[cat].length === 1 ? "" : "es"}
                  </p>
                </div>
                <div className="flex-1 h-px bg-slate-200/80 ml-1" />
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
                <PlanCategoryIcon category="Cine" size="sm" />
                <div>
                  <p className="text-sm font-black text-slate-800">Cartelera de cine de Sevilla</p>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {cineVisible.length} peli{cineVisible.length === 1 ? "" : "s"}{activeCine !== 'Todos' ? ` en ${activeCine}` : ""}
                  </p>
                </div>
                <div className="flex-1 h-px bg-slate-200/80 ml-1" />
              </div>

              {cineNames.length > 1 && (
                <div className="flex items-center gap-2 mb-2.5 overflow-x-auto pb-1" role="group" aria-label="Filtrar por cine">
                  {['Todos', ...cineNames].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActiveCine(c)}
                      aria-pressed={activeCine === c}
                      className={`px-3 py-2 rounded-full text-[11px] font-semibold whitespace-nowrap min-h-[44px] ${
                        activeCine === c ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {c}
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
                  <p className="text-sm font-black text-slate-800">Distancia por calcular</p>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {unknown.length} plan{unknown.length === 1 ? "" : "es"} sin desplazamiento estimado
                  </p>
                </div>
                <div className="flex-1 h-px bg-slate-200/80 ml-1" />
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
