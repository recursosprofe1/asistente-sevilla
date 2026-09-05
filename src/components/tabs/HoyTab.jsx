import React, { useState, useEffect, useRef } from "react";
import {
  ConnCheck, ConnOjoOff, ConnPin, ConnReloj, ConnCalendario, ConnBrujula,
} from "../illustrations/ConnIcons";
import { ConnCategoryIcon } from "../illustrations/ConnIcons";
import { db, discardPlan, togglePlanForToday } from "../../db";
import { getTodayPlans } from "../../services/planRepository";
import { getTodayKeyMadrid, formatLongDateMadrid, getGreetingMadrid } from "../../utils/time";
import { CineMovies, PlanWhy, PlanSourceLink } from "../plans/shared";
import { withNormalizedCategory } from "../../services/planRepository";

export default function HoyTab({ onNavigateTab }) {
  const [plans, setPlans] = useState([]);
  const [toast, setToast] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const toastTimer = useRef(null);
  const todayKey = getTodayKeyMadrid();

  const load = async () => {
    try {
      setLoadError("");
      const hoy = await getTodayPlans(todayKey);
      setPlans(hoy);
    } catch (err) {
      console.error("Error cargando planes de Hoy:", err);
      setLoadError("No se pudo cargar tu selección. Revisa el almacenamiento local.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    load();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  };

  const handleQuitar = async (e, plan) => {
    e.stopPropagation();
    // Quitar de Hoy conserva el favorito.
    await togglePlanForToday(plan.id);
    await load();
    showToast("Quitado de Hoy, sigue en favoritos");
  };

  const handleDescartar = async (e, plan) => {
    e.stopPropagation();
    // Descartar saca automáticamente de Hoy.
    await discardPlan(plan.id);
    await load();
    showToast("Plan descartado");
  };

  const toggleExpanded = (id) => setExpandedId(expandedId === id ? null : id);

  const greeting = getGreetingMadrid();
  const longDate = formatLongDateMadrid();

  return (
    <div className="space-y-3 pb-28 pt-1">
      {/* ── Hero ─────────────────────────── */}
      <div className="conn-hero px-5 pt-5 pb-5 text-white">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/80 mb-1">
          {greeting}
        </p>
        <h2 className="font-theme-title text-[22px] font-black leading-tight capitalize">
          {longDate}
        </h2>
        <p className="text-xs font-bold text-white/85 mt-2">
          {plans.length === 0
            ? "Tu selección de hoy · se renueva cada día"
            : `${plans.length} plan${plans.length === 1 ? " seleccionado" : "es seleccionados"} para hoy`}
        </p>
      </div>

      {/* ── Toast ───────────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="bg-conn-deep text-white text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-fadeIn mx-1"
        >
          <ConnCheck className="w-3 h-3 text-conn-amber" />
          <span>{toast}</span>
        </div>
      )}

      {/* ── Lista de tarjetas (sin límite) ────────────────────────────── */}
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

        {!isLoading &&
          !loadError &&
          plans.map((plan) => {
            const isExpanded = expandedId === plan.id;
            const category = withNormalizedCategory(plan);
            const selectedToday = plan.todaySelectionDate === todayKey;
            return (
              <article key={plan.id} className="conn-card overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => toggleExpanded(plan.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`hoy-detalle-${plan.id}`}
                  aria-label={`${isExpanded ? 'Ocultar' : 'Ver'} detalle de ${plan.title}`}
                  className="w-full text-left focus-visible:outline-2 focus-visible:outline-conn-tealDark"
                >
                  <div className="flex items-center gap-3 p-4">
                    <ConnCategoryIcon category={category} />

                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-conn-muted uppercase tracking-widest mb-0.5">
                        {category}
                      </p>
                      <h3 className="font-theme-title text-[15px] font-black text-conn-deep leading-snug line-clamp-2">
                        {plan.title}
                      </h3>
                      {(plan.summary || plan.longDescription) && category !== 'Cine' && (
                        <p className="text-[11px] text-conn-muted leading-snug line-clamp-2 mt-1 font-semibold">
                          {plan.summary || String(plan.longDescription).slice(0, 140)}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1.5 text-[11px] font-bold text-conn-muted">
                        <ConnPin className="w-3 h-3" />
                        <span className="truncate">{plan.venue}{plan.municipality ? ` · ${plan.municipality}` : ""}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      {plan.travelMinutes != null ? (
                        <span className="text-[11px] font-black text-conn-tealDark bg-conn-mist px-2 py-0.5 rounded-full">
                          {plan.travelMinutes} min
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-conn-muted bg-conn-aqua px-2 py-0.5 rounded-full">
                          Sin distancia
                        </span>
                      )}
                      <span className="text-[10px] font-black text-conn-deep bg-conn-amberSoft px-2 py-0.5 rounded-full">
                        {selectedToday ? 'Selección de hoy' : 'En Hoy'}
                      </span>
                    </div>
                  </div>

                  {plan.priceText && (
                    <div className="px-4 pb-3 -mt-1">
                      <span className="text-[11px] font-bold text-conn-muted">{plan.priceText}</span>
                    </div>
                  )}
                </button>

                {/* ── Detalle expandido ─────────────────────── */}
                {isExpanded && (
                  <div id={`hoy-detalle-${plan.id}`} className="border-t border-conn-aqua px-4 py-3 space-y-3">
                    {plan.startsAt && (
                      <p className="text-[11px] font-bold text-conn-muted flex items-center gap-1.5">
                        <ConnReloj className="w-3 h-3" />
                        Fecha del evento: {plan.startsAt}
                      </p>
                    )}
                    <p className="text-[11px] font-bold text-conn-muted/70 flex items-center gap-1.5">
                      <ConnCalendario className="w-3 h-3" />
                      Añadido a Hoy hoy · la selección se renueva cada día
                    </p>

                    {plan.longDescription && (
                      category === "Cine" ? (
                        <CineMovies longDescription={plan.longDescription} />
                      ) : (
                        <p className="text-xs text-conn-deep/80 leading-relaxed">{plan.longDescription}</p>
                      )
                    )}

                    <PlanWhy text={plan.whyMatch} tone="amber" />
                    <PlanSourceLink url={plan.sourceUrl} />

                    {/* Acciones */}
                    <div className="flex items-center justify-between pt-1 border-t border-conn-aqua">
                      <button
                        onClick={(e) => handleDescartar(e, plan)}
                        type="button"
                        aria-label={`Descartar ${plan.title}`}
                        className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold text-conn-muted hover:text-red-500 hover:bg-red-50 transition-colors min-h-[44px]"
                      >
                        <ConnOjoOff className="w-3.5 h-3.5" />
                        Descartar
                      </button>
                      <button
                        onClick={(e) => handleQuitar(e, plan)}
                        type="button"
                        aria-label={`Quitar ${plan.title} de Hoy`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-conn-amberSoft text-conn-deep active:scale-95 transition-all min-h-[44px]"
                      >
                        Quitar de Hoy
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}

        {/* Estado vacío */}
        {!isLoading && !loadError && plans.length === 0 && (
          <div className="conn-card text-center py-12 px-6">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-conn-mist text-conn-tealDark mb-3">
              <ConnBrujula className="w-7 h-7" />
            </span>
            <p className="font-theme-title text-[15px] font-black text-conn-deep mb-1">Nada seleccionado para hoy</p>
            <p className="text-xs font-semibold text-conn-muted mb-4">
              En Planes, elige un plan y toca &quot;Añadir a Hoy&quot;. La selección se renueva cada día.
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
      {/* Para evitar warning de variable no usada en builds estrictos */}
      <span className="hidden">{typeof db !== 'undefined' ? '' : ''}</span>
    </div>
  );
}
