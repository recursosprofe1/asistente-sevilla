import React, { useState, useEffect, useRef } from "react";
import { FBadge, FGlyph } from "../illustrations/NotoBadges";
import { db, getVisibleRecos, toggleRecoInterest, feedbackReco, restoreReco } from "../../db";
import { getTasteProfile } from "../../services/recoService";
import { syncPlansFromCloud } from "../../services/feedService";
import { PlanWhy, PlanSourceLink } from "../plans/shared";

const FILTER_MODES = [
  { value: 'all', label: 'Todos' },
  { value: 'favorites', label: 'Favoritos' },
];

const isFavPlace = (p) => p.userStatus === "interested" || p.status === "interested";

function scorePlace(p, profile) {
  const likes = (profile.food?.learnedLikes || []).map((s) => s.replace(/ x\d+$/, '').toLowerCase());
  const avoid = (profile.food?.learnedAvoid || []).map((s) => s.replace(/ x\d+$/, '').toLowerCase());
  const zones = (profile.food?.learnedZones || []).map((s) => String(s).toLowerCase());
  const tags = [p.cuisine, p.zone, ...(p.moments || [])].map((s) => String(s || '').toLowerCase());
  let score = 0;
  for (const t of tags) {
    if (!t) continue;
    if (likes.some((l) => l && (t.includes(l) || l.includes(t)))) score += 2;
    if (avoid.some((a) => a && (t.includes(a) || a.includes(t)))) score -= 3;
  }
  if (zones.some((z) => z && String(p.zone || '').toLowerCase().includes(z))) score += 1;
  if (p.userStatus === 'interested' || p.status === 'interested') score += 100;
  return score;
}

export default function ComerTab() {
  const [places, setPlaces] = useState([]);
  const [filterMode, setFilterMode] = useState('all');
  const [discarded, setDiscarded] = useState([]);
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [toast, setToast] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tuned, setTuned] = useState(false);
  const toastTimer = useRef(null);

  const load = async () => {
    const [all, profile] = await Promise.all([
      getVisibleRecos('places'),
      getTasteProfile(db),
    ]);
    setPlaces([...all].sort((a, b) => scorePlace(b, profile) - scorePlace(a, profile)));
    setTuned(Boolean(profile.food?.learnedLikes?.length || profile.food?.learnedAvoid?.length));
    const trash = (await db.table('places').toArray())
      .filter((r) => r.userStatus === 'discarded' || r.status === 'discarded')
      .sort((a, b) => (b.discardedAt || 0) - (a.discardedAt || 0));
    setDiscarded(trash);
  };

  useEffect(() => {
    load();
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  };

  const toggleExpanded = (id) => setExpandedId(expandedId === id ? null : id);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncPlansFromCloud(db, {});
      showToast(result.success ? `Actualizado${result.recoSummary ? ' · ' + result.recoSummary : ''}` : `No se pudo actualizar: ${result.error}`);
      await load();
    } finally {
      setIsSyncing(false);
    }
  };

  const onFav = async (e, item) => {
    e.stopPropagation();
    const nowFav = await toggleRecoInterest('places', item.id);
    await load();
    showToast(nowFav ? "Guardado en favoritos (afina tus gustos)" : "Desmarcado");
  };
  const onFeedback = async (e, item, kind) => {
    e.stopPropagation();
    const promoted = await feedbackReco('places', item.id);
    await load();
    showToast(kind === 'seen'
      ? (promoted ? `Ya fui — entra en su lugar: ${promoted.title}` : "Ya fui — afinará tus gustos")
      : (promoted ? `Descartado — entra en su lugar: ${promoted.title}` : "Descartado — evitaré similares"));
  };
  const onRestore = async (e, item) => {
    e.stopPropagation();
    await restoreReco('places', item.id);
    await load();
    showToast("Restaurado");
  };

  const list = showDiscarded
    ? discarded
    : filterMode === 'favorites'
      ? places.filter(isFavPlace)
      : places;

  return (
    <div className="space-y-3 pb-28 pt-1">
      <div className="conn-hero px-5 pt-5 pb-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-theme-title text-[22px] font-black leading-tight">Comer</h2>
            <p className="text-xs font-bold text-white/85 mt-1" role="status">
              {places.length} sitios en Sevilla y alrededores{tuned ? ' · afinado a ti' : ''}
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            aria-label="Sincronizar"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white text-conn-tealDark active:scale-95 transition-all disabled:opacity-60 flex-shrink-0"
          >
            <span className={isSyncing ? "animate-spin inline-flex" : "inline-flex"}>
              <FBadge name="sync" color="#0E7E8C" size={44} />
            </span>
          </button>
        </div>
        <p className="text-[11px] font-bold text-white/80 mt-2">
          10 sitios por semana · con cocina, precio y plato famoso
        </p>
        <div className="flex items-center gap-1.5 mt-2.5" role="group" aria-label="Filtrar por interés">
          {FILTER_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => { setFilterMode(m.value); setShowDiscarded(false); }}
              aria-pressed={filterMode === m.value && !showDiscarded}
              className={`px-3 py-1 rounded-full text-[11px] font-black min-h-[32px] transition-all ${
                filterMode === m.value && !showDiscarded ? 'bg-conn-amberSoft text-conn-deep' : 'bg-white/20 text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {discarded.length > 0 && (
        <button onClick={() => setShowDiscarded(!showDiscarded)} type="button"
          className="w-full text-center text-xs font-bold text-conn-muted min-h-[36px]">
          {showDiscarded ? "Ver activos" : `Ver papelera (${discarded.length})`}
        </button>
      )}

      {toast && (
        <div role="status" aria-live="polite" className="bg-conn-deep text-white text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-fadeIn mx-1">
          <FBadge name="check" color="#3A9E70" size={20} />
          <span>{toast}</span>
        </div>
      )}

      <div className="space-y-2.5">
        {list.map((place) => {
          const isExpanded = expandedId === place.id;
          const isInterested = place.userStatus === "interested" || place.status === "interested";
          return (
            <article key={place.id} className="conn-card overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleExpanded(place.id)}
                aria-expanded={isExpanded}
                className="w-full text-left focus-visible:outline-2 focus-visible:outline-conn-tealDark"
              >
                <div className="flex items-center gap-3 p-4">
                  <FBadge name="gastro" color="#E07040" size={44} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-theme-title text-[15px] font-black text-conn-deep leading-snug line-clamp-2">
                      {place.title}
                    </h3>
                    <p className="text-xs font-bold text-conn-muted mt-0.5">
                      {place.cuisine}{place.zone ? ` · ${place.zone}` : ""}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {place.priceText && (
                        <span className="text-[10px] font-black text-conn-tealDark bg-conn-mist px-2 py-0.5 rounded-full">
                          {place.priceText}
                        </span>
                      )}
                      {place.famousDish && (
                        <span className="text-[10px] font-black text-conn-deep bg-conn-amberSoft px-2 py-0.5 rounded-full">
                          ★ {place.famousDish}
                        </span>
                      )}
                      {isInterested && (
                        <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                          Favorito
                        </span>
                      )}
                    </div>
                  </div>
                  <FGlyph name="chevronDown" size={14} color="#5E8B91" />
                </div>
              </button>

              {!showDiscarded && (
                <div className="px-4 pb-3 flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={(e) => onFav(e, place)}
                    type="button"
                    aria-pressed={isInterested}
                    aria-label={isInterested ? `Quitar ${place.title} de favoritos` : `Guardar ${place.title} en favoritos`}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-red-50 active:scale-90 transition-all"
                  >
                    <FBadge name="corazon" color={isInterested ? "#E5484D" : "#CBD5E1"} size={40} />
                  </button>
                  <button
                    onClick={(e) => onFeedback(e, place, 'seen')}
                    type="button"
                    aria-label={`Ya fui a ${place.title}`}
                    className="px-3 py-2 rounded-full text-xs font-black bg-conn-mist text-conn-tealDark min-h-[44px] transition-all active:scale-95"
                  >
                    Ya fui ✓
                  </button>
                  <button
                    onClick={(e) => onFeedback(e, place, 'disliked')}
                    type="button"
                    aria-label={`No me gusta ${place.title}`}
                    className="px-3 py-2 rounded-full text-xs font-bold text-conn-muted bg-conn-aqua hover:text-red-500 hover:bg-red-50 min-h-[44px] transition-colors"
                  >
                    No me gusta
                  </button>
                </div>
              )}

              {isExpanded && (
                <div className="border-t border-conn-aqua px-4 py-3 space-y-3">
                  {(place.moments?.length > 0) && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {place.moments.map((mm) => (
                        <span key={mm} className="text-[10px] font-bold text-conn-muted bg-conn-aqua px-2 py-0.5 rounded-full">{mm}</span>
                      ))}
                    </div>
                  )}
                  {place.summary && (
                    <p className="text-xs text-conn-deep/80 leading-relaxed">{place.summary}</p>
                  )}
                  <PlanWhy text={place.whyMatch} tone="teal" />
                  <PlanSourceLink url={place.sourceUrl} />
                  {showDiscarded && (
                    <button onClick={(e) => onRestore(e, place)} type="button"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-conn-teal text-white active:scale-95 mx-auto min-h-[44px]">
                      <FGlyph name="restaurar" size={16} color="#FFFFFF" />
                      Restaurar
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {list.length === 0 && (
          <div className="conn-card text-center py-12 px-6">
            <FBadge name="gastro" color="#E07040" size={56} />
            <p className="font-theme-title text-[15px] font-black text-conn-deep mb-1 mt-3">
              {showDiscarded
                ? "La papelera está vacía"
                : filterMode === 'favorites'
                  ? "Sin favoritos aquí todavía"
                  : "Nada por aquí todavía"}
            </p>
            <p className="text-xs font-semibold text-conn-muted">
              {showDiscarded
                ? ""
                : filterMode === 'favorites'
                  ? "Marca el corazón en un sitio para verlo aquí."
                  : "Sincroniza para traer los sitios de la semana."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
