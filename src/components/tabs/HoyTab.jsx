import React, { useState, useEffect, useRef } from "react";
import { FBadge, FGlyph, CategoryBadge } from "../illustrations/NotoBadges";
import { getTodayRecos, removeRecoFromToday, feedbackReco } from "../../db";
import { getTodayPlans, discardPlan, togglePlanForToday } from "../../services/planRepository";
import { getTodayKeyMadrid, formatLongDateMadrid, getGreetingMadrid } from "../../utils/time";
import { CineMovies, PlanWhy, PlanSourceLink } from "../plans/shared";
import { withNormalizedCategory } from "../../services/planRepository";

const RECO_LABEL = { series: 'Serie', movies: 'Peli', places: 'Sitio' };

function RecoHoyCard({ item, isExpanded, onToggle, onQuitar, onDescartar }) {
  const kind = RECO_LABEL[item.recoTable] || 'Reco';
  const meta = [
    item.year || null,
    item.recoTable === 'series' && item.seasons != null ? `${item.seasons} temp.` : null,
    item.recoTable === 'movies' && item.durationMin ? `${Math.floor(item.durationMin / 60)}h ${item.durationMin % 60}min` : null,
    item.recoTable === 'places' ? [item.cuisine, item.zone].filter(Boolean).join(' · ') : null,
    (item.platforms || []).slice(0, 2).join(' · ') || null,
  ].filter(Boolean).join(' · ');
  return (
    <article className="conn-card overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        aria-expanded={isExpanded}
        aria-controls={`hoy-reco-detalle-${item.id}`}
        aria-label={`${isExpanded ? 'Ocultar' : 'Ver'} detalle de ${item.title}`}
        className="w-full text-left focus-visible:outline-2 focus-visible:outline-conn-tealDark"
      >
        <div className="flex items-center gap-3 p-4">
          <CategoryBadge category={item.recoTable === 'series' ? 'Varios' : 'Cine'} size={56} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-conn-muted uppercase tracking-widest mb-0.5">{kind}</p>
            <h3 className="font-theme-title text-[15px] font-black text-conn-deep leading-snug line-clamp-2">
              {item.title}
            </h3>
            {meta && <p className="text-xs font-bold text-conn-muted mt-0.5">{meta}</p>}
            {item.summary && (
              <p className="text-xs text-conn-muted leading-snug line-clamp-2 mt-1 font-semibold">{item.summary}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="text-[10px] font-black text-conn-deep bg-conn-amberSoft px-2 py-0.5 rounded-full">
              Selección de hoy
            </span>
          </div>
        </div>
        {(item.genres?.length > 0 || item.priceText) && (
          <div className="px-4 pb-3 -mt-1 flex items-center gap-1.5 flex-wrap">
            {(item.genres || []).slice(0, 3).map((g) => (
              <span key={g} className="text-[10px] font-black text-conn-tealDark bg-conn-mist px-2 py-0.5 rounded-full">{g}</span>
            ))}
            {item.priceText && (
              <span className="text-xs font-bold text-conn-muted">{item.priceText}</span>
            )}
          </div>
        )}
      </button>

      {isExpanded && (
        <div id={`hoy-reco-detalle-${item.id}`} className="border-t border-conn-aqua px-4 py-3 space-y-3">
          <p className="text-xs font-bold text-conn-muted/70 flex items-center gap-1.5">
            <FBadge name="calendario" color="#5E8B91" size={20} />
            Añadida a Hoy hoy · la selección se renueva cada día
          </p>
          <PlanWhy text={item.whyMatch} tone="amber" />
          <PlanSourceLink url={item.sourceUrl} />
          <div className="flex items-center justify-between pt-1 border-t border-conn-aqua">
            <button
              onClick={(e) => onDescartar(e, item)}
              type="button"
              aria-label={`Descartar ${item.title}`}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold text-conn-muted hover:text-red-500 hover:bg-red-50 transition-colors min-h-[44px]"
            >
              <FGlyph name="ojo" size={16} color="#5E8B91" />
              Descartar
            </button>
            <button
              onClick={(e) => onQuitar(e, item)}
              type="button"
              aria-label={`Quitar ${item.title} de Hoy`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-conn-amberSoft text-conn-deep active:scale-95 transition-all min-h-[44px]"
            >
              Quitar de Hoy
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export default function HoyTab({ onNavigateTab }) {
  const [plans, setPlans] = useState([]);
  const [recos, setRecos] = useState([]);
  const [toast, setToast] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const toastTimer = useRef(null);

  const load = async () => {
    try {
      setLoadError("");
      const key = getTodayKeyMadrid();
      const [hoy, recosHoy] = await Promise.all([
        getTodayPlans(key),
        getTodayRecos(key)
      ]);
      setPlans(hoy);
      setRecos(recosHoy);
    } catch (err) {
      console.error("Error cargando la selección de Hoy:", err);
      setLoadError("No se pudo cargar tu selección. Revisa el almacenamiento local.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    document.addEventListener('ajustes:changed', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('ajustes:changed', onVisible);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  };

  const handleQuitarPlan = async (e, plan) => {
    e.stopPropagation();
    // Quitar de Hoy conserva el favorito.
    await togglePlanForToday(plan.id);
    await load();
    showToast("Quitado de Hoy, sigue en favoritos");
  };

  const handleDescartarPlan = async (e, plan) => {
    e.stopPropagation();
    // Descartar saca automáticamente de Hoy.
    await discardPlan(plan.id);
    await load();
    showToast("Plan descartado");
  };

  const handleQuitarReco = async (e, item) => {
    e.stopPropagation();
    await removeRecoFromToday(item.recoTable, item.id);
    await load();
    showToast("Quitado de Hoy, sigue en favoritos");
  };

  const handleDescartarReco = async (e, item) => {
    e.stopPropagation();
    await feedbackReco(item.recoTable, item.id, 'disliked');
    await load();
    showToast(`${RECO_LABEL[item.recoTable] || 'Reco'} descartada — evitaré similares`);
  };

  const toggleExpanded = (id) => setExpandedId(expandedId === id ? null : id);

  const greeting = getGreetingMadrid();
  const longDate = formatLongDateMadrid();
  const total = plans.length + recos.length;

  // Lista mezclada ordenada por cuándo se marcaron (más reciente primero).
  const items = [
    ...plans.map((p) => ({ kind: 'plan', at: p.interestedAt || 0, data: p })),
    ...recos.map((r) => ({ kind: 'reco', at: r.interestedAt || 0, data: r })),
  ].sort((a, b) => b.at - a.at);

  return (
    <div className="space-y-3 pb-28 pt-1">
      {/* -- Hero --------------------------- */}
      <div className="conn-hero px-5 pt-5 pb-5 text-white">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/80 mb-1">
          {greeting}
        </p>
        <h2 className="font-theme-title text-[22px] font-black leading-tight capitalize">
          {longDate}
        </h2>
        <p className="text-xs font-bold text-white/85 mt-2">
          {total === 0
            ? "Tu selección de hoy · se renueva cada día"
            : `${total} ${total === 1 ? "selección" : "selecciones"} para hoy${
                plans.length > 0 && recos.length > 0
                  ? ` (${plans.length} planes · ${recos.length} recos)`
                  : ""
              }`}
        </p>
      </div>

      {/* -- Toast ----------------------------------------- */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="bg-conn-deep text-white text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-fadeIn mx-1"
        >
          <FBadge name="check" color="#3A9E70" size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* -- Lista de tarjetas (sin límite) ------------------------------ */}
      <div className="space-y-2.5">
        {isLoading && (
          <div className="text-center py-12 px-4" role="status" aria-live="polite">
            <p className="text-sm font-bold text-conn-muted">Cargando tu selección…</p>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="text-center py-12 px-4">
            <p className="text-sm font-extrabold text-conn-deep mb-1">No se pudo cargar Hoy</p>
            <p className="text-xs text-conn-muted mb-4">{loadError}</p>
            <button
              onClick={() => {
                setIsLoading(true);
                load();
              }}
              type="button"
              className="px-5 py-2 rounded-full text-xs font-extrabold bg-conn-teal text-white min-h-[44px]"
            >
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !loadError && items.map(({ kind, data }) => (
          kind === 'reco' ? (
            <RecoHoyCard
              key={`reco-${data.id}`}
              item={data}
              isExpanded={expandedId === data.id}
              onToggle={toggleExpanded}
              onQuitar={handleQuitarReco}
              onDescartar={handleDescartarReco}
            />
          ) : (
            <article key={`plan-${data.id}`} className="conn-card overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleExpanded(data.id)}
                aria-expanded={expandedId === data.id}
                aria-controls={`hoy-detalle-${data.id}`}
                aria-label={`${expandedId === data.id ? 'Ocultar' : 'Ver'} detalle de ${data.title}`}
                className="w-full text-left focus-visible:outline-2 focus-visible:outline-conn-tealDark"
              >
                <div className="flex items-center gap-3 p-4">
                  <CategoryBadge category={withNormalizedCategory(data)} size={56} />

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-conn-muted uppercase tracking-widest mb-0.5">
                      {withNormalizedCategory(data)}
                    </p>
                    <h3 className="font-theme-title text-[15px] font-black text-conn-deep leading-snug line-clamp-2">
                      {data.title}
                    </h3>
                    {(data.summary || data.longDescription) && withNormalizedCategory(data) !== 'Cine' && (
                      <p className="text-xs text-conn-muted leading-snug line-clamp-2 mt-1 font-semibold">
                        {data.summary || String(data.longDescription).slice(0, 140)}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold text-conn-muted">
                      <FBadge name="pin" color="#0E7E8C" size={20} />
                      <span className="truncate">{data.venue}{data.municipality ? ` · ${data.municipality}` : ""}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {data.travelMinutes != null ? (
                      <span className="text-xs font-black text-conn-tealDark bg-conn-mist px-2 py-0.5 rounded-full">
                        {data.travelMinutes} min
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-conn-muted bg-conn-aqua px-2 py-0.5 rounded-full">
                        Sin distancia
                      </span>
                    )}
                    <span className="text-[10px] font-black text-conn-deep bg-conn-amberSoft px-2 py-0.5 rounded-full">
                      Selección de hoy
                    </span>
                  </div>
                </div>

                {data.priceText && (
                  <div className="px-4 pb-3 -mt-1">
                    <span className="text-xs font-bold text-conn-muted">{data.priceText}</span>
                  </div>
                )}
              </button>

              {/* -- Detalle expandido ----------------------- */}
              {expandedId === data.id && (
                <div id={`hoy-detalle-${data.id}`} className="border-t border-conn-aqua px-4 py-3 space-y-3">
                  {data.startsAt && (
                    <p className="text-xs font-bold text-conn-muted flex items-center gap-1.5">
                      <FBadge name="reloj" color="#0E7E8C" size={20} />
                      Fecha del evento: {data.startsAt}
                    </p>
                  )}
                  <p className="text-xs font-bold text-conn-muted/70 flex items-center gap-1.5">
                    <FBadge name="calendario" color="#5E8B91" size={20} />
                    Añadido a Hoy hoy · la selección se renueva cada día
                  </p>

                  {data.longDescription && (
                    withNormalizedCategory(data) === "Cine" ? (
                      <CineMovies longDescription={data.longDescription} />
                    ) : (
                      <p className="text-xs text-conn-deep/80 leading-relaxed">{data.longDescription}</p>
                    )
                  )}

                  <PlanWhy text={data.whyMatch} tone="amber" />
                  <PlanSourceLink url={data.sourceUrl} />

                  {/* Acciones */}
                  <div className="flex items-center justify-between pt-1 border-t border-conn-aqua">
                    <button
                      onClick={(e) => handleDescartarPlan(e, data)}
                      type="button"
                      aria-label={`Descartar ${data.title}`}
                      className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold text-conn-muted hover:text-red-500 hover:bg-red-50 transition-colors min-h-[44px]"
                    >
                      <FGlyph name="ojo" size={16} color="#5E8B91" />
                      Descartar
                    </button>
                    <button
                      onClick={(e) => handleQuitarPlan(e, data)}
                      type="button"
                      aria-label={`Quitar ${data.title} de Hoy`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-conn-amberSoft text-conn-deep active:scale-95 transition-all min-h-[44px]"
                    >
                      Quitar de Hoy
                    </button>
                  </div>
                </div>
              )}
            </article>
          )
        ))}

        {/* Estado vacío */}
        {!isLoading && !loadError && items.length === 0 && (
          <div className="conn-card text-center py-12 px-6">
            <FBadge name="brujula" color="#0E7E8C" size={56} />
            <p className="font-theme-title text-[15px] font-black text-conn-deep mb-1 mt-3">Nada seleccionado para hoy</p>
            <p className="text-xs font-semibold text-conn-muted mb-4">
              En Planes o Cine, toca &quot;Añadir a Hoy&quot; con un plan, serie o peli. La selección se renueva cada día.
            </p>
            <button
              onClick={() => onNavigateTab("planes")}
              type="button"
              className="px-5 py-2 rounded-full text-xs font-black bg-conn-teal text-white min-h-[44px]"
            >
              Explorar planes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
