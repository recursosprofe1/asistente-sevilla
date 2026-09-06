import React, { useState, useEffect, useRef } from "react";
import { FBadge, FGlyph, CategoryBadge, SyncGlyph } from "../illustrations/NotoBadges";
import { db, getVisibleRecos, getSeenFavoriteRecos, getRepescaReco, toggleRecoInterest, feedbackReco, restoreReco, toggleRecoForToday, markRecoSeenFavorite } from "../../db";
import { getTasteProfile } from "../../services/recoService";
import { syncPlansFromCloud } from "../../services/feedService";
import { PlanCard, shortCineName } from "./PlanesTab";
import SeenChoiceDialog from "../reco/SeenChoiceDialog";
import {
  toggleInterest, addPlanToToday, removePlanFromToday, discardPlan, restorePlan
} from "../../services/planRepository";
import { PlanWhy, PlanSourceLink } from "../plans/shared";
import { getTodayKeyMadrid } from "../../utils/time";

const SUBS = [
  { value: 'cartelera', label: 'Cartelera' },
  { value: 'series', label: 'Series' },
  { value: 'movies', label: 'Películas' },
];

const FILTER_MODES = [
  { value: 'all', label: 'Todos' },
  { value: 'favorites', label: 'Favoritos' },
  { value: 'today', label: 'En Hoy' },
];

// Cines de una tarjeta de cartelera como pastillas cortas.
// La cocina agrupa por peli y junta los cines en "A + B": aquí se separan.
function cineChipsOf(plan) {
  return String(plan?.venue || "")
    .split("+")
    .map((s) => shortCineName(s.trim()))
    .filter(Boolean);
}

const isFavItem = (p) => p.userStatus === "interested" || p.status === "interested";

function scoreByProfile(item, profile, kind) {
  const likes = (profile[kind]?.learnedLikes || []).map((s) => s.replace(/ x\d+$/, '').toLowerCase());
  const avoid = (profile[kind]?.learnedAvoid || []).map((s) => s.replace(/ x\d+$/, '').toLowerCase());
  const tags = [...(item.genres || []), ...(item.platforms || [])].map((s) => String(s).toLowerCase());
  let score = 0;
  for (const t of tags) {
    if (likes.some((l) => l && (t.includes(l) || l.includes(t)))) score += 2;
    if (avoid.some((a) => a && (t.includes(a) || a.includes(t)))) score -= 3;
  }
  if (item.userStatus === 'interested' || item.status === 'interested') score += 100;
  return score;
}

function RecoCard({ item, kindLabel, meta, onFav, onToggleToday, onSeen, onFeedback, onRestore, isExpanded, onToggle, discarded, todayKey }) {
  const isInterested = item.userStatus === "interested" || item.status === "interested";
  const isForToday = item.isForToday === true && item.todaySelectionDate === todayKey;
  return (
    <article className="conn-card overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        aria-expanded={isExpanded}
        className="w-full text-left focus-visible:outline-2 focus-visible:outline-conn-tealDark"
      >
        <div className="flex items-center gap-3 p-4">
          <CategoryBadge category={kindLabel === 'Serie' ? 'Varios' : 'Cine'} size={44} />
          <div className="flex-1 min-w-0">
            <h3 className="font-theme-title text-[15px] font-black text-conn-deep leading-snug line-clamp-2">
              {item.title}
            </h3>
            <p className="text-xs font-bold text-conn-muted mt-0.5">{meta}</p>
            {item.summary && (
              <p className="text-xs font-semibold text-conn-muted leading-snug line-clamp-2 mt-1">
                {item.summary}
              </p>
            )}
            {(item.genres?.length > 0 || item.platforms?.length > 0) && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {(item.genres || []).slice(0, 3).map((g) => (
                  <span key={g} className="text-[10px] font-black text-conn-tealDark bg-conn-mist px-2 py-0.5 rounded-full">{g}</span>
                ))}
                {(item.platforms || []).slice(0, 3).map((pl) => (
                  <span key={pl} className="text-[10px] font-bold text-conn-muted bg-conn-aqua px-2 py-0.5 rounded-full">{pl}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {item.repesca && (
              <span className="text-[10px] font-black text-conn-deep bg-conn-amberSoft px-2 py-0.5 rounded-full">¿Repetimos?</span>
            )}
            {item.seenAt && !item.repesca && (
              <span className="text-[10px] font-black text-conn-muted bg-conn-aqua px-2 py-0.5 rounded-full">Vista</span>
            )}
            {isInterested && !item.seenAt && (
              <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Favorito</span>
            )}
            <FGlyph name="chevronDown" size={14} color="#5E8B91" />
          </div>
        </div>
      </button>

      {!discarded && (
          <div className="flex-1 flex items-center gap-1.5 flex-wrap">
            <button
              onClick={(e) => onFav(e, item)}
              type="button"
              aria-pressed={isInterested}
              aria-label={isInterested ? `Quitar ${item.title} de favoritos` : `Guardar ${item.title} en favoritos`}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-red-50 active:scale-90 transition-all"
            >
              <FBadge name="corazon" color={isInterested ? "#E5484D" : "#CBD5E1"} size={40} />
            </button>
            <button
              onClick={(e) => onToggleToday(e, item)}
              type="button"
              aria-pressed={isForToday}
              aria-label={isForToday ? `Quitar ${item.title} de Hoy` : `Añadir ${item.title} a Hoy`}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 min-h-[44px] ${
                isForToday ? 'bg-conn-amberSoft text-conn-deep' : 'bg-conn-mist text-conn-tealDark'
              }`}
            >
              <FBadge name="calendario-add" color="#F5A623" size={22} />
              {isForToday ? 'En Hoy' : 'Añadir a Hoy'}
            </button>
            <button
              onClick={(e) => onSeen(e, item)}
              type="button"
              aria-label={`Marcar ${item.title} como vista`}
              className="px-3 py-2 rounded-full text-xs font-black bg-conn-mist text-conn-tealDark min-h-[44px] transition-all active:scale-95"
            >
              Vista ✓
            </button>
            <button
              onClick={(e) => onFeedback(e, item, 'disliked')}
              type="button"
              aria-label={`No me gusta ${item.title}`}
              className="px-3 py-2 rounded-full text-xs font-bold text-conn-muted bg-conn-aqua hover:text-red-500 hover:bg-red-50 min-h-[44px] transition-colors"
            >
              No me gusta
            </button>
          </div>
      )}

      {isExpanded && (
        <div className="border-t border-conn-aqua px-4 py-3 space-y-3">
          {item.longDescription && item.longDescription !== item.summary && (
            <p className="text-xs text-conn-deep/80 leading-relaxed">{item.longDescription}</p>
          )}
          <PlanWhy text={item.whyMatch} tone="teal" />
          <PlanSourceLink url={item.sourceUrl} />
          {discarded && (
            <button onClick={(e) => onRestore(e, item)} type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-conn-teal text-white active:scale-95 mx-auto min-h-[44px]">
              <FGlyph name="restaurar" size={16} color="#FFFFFF" />
              Restaurar
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export default function CineTab() {
  const [sub, setSub] = useState('cartelera');
  const [filterMode, setFilterMode] = useState('all');
  const [cine, setCine] = useState([]);
  const [series, setSeries] = useState([]);
  const [movies, setMovies] = useState([]);
  const [seenRecos, setSeenRecos] = useState({ series: [], movies: [] });
  const [seenFor, setSeenFor] = useState(null);
  const [discarded, setDiscarded] = useState([]);
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [toast, setToast] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tuned, setTuned] = useState(false);
  const toastTimer = useRef(null);
  const [todayKey, setTodayKey] = useState(getTodayKeyMadrid);

  const load = async () => {
    const [allPlans, s, m, seenS, seenM, profile, rep] = await Promise.all([
      db.plans.toArray(),
      getVisibleRecos('series'),
      getVisibleRecos('movies'),
      getSeenFavoriteRecos('series'),
      getSeenFavoriteRecos('movies'),
      getTasteProfile(db),
      getRepescaReco(),
    ]);
    // La repesca (solo una en toda la app) se suma a su lista si procede.
    const withRep = (arr, kind) =>
      rep && rep.recoTable === kind && !arr.some((x) => x.id === rep.id) ? [...arr, rep] : arr;
    const isCinePlan = (p) => {
      const cats = p.categories || (p.category ? [p.category] : []);
      return cats.includes('Cine') || String(p.id).startsWith('cine-') || p.id === 'plan-cine-sevilla';
    };
    const cinePlans = allPlans.filter((p) => {
      if (!isCinePlan(p)) return false;
      if (p.userStatus === 'discarded' || p.status === 'discarded' || p.status === 'purged') return false;
      if (p.feedStatus === 'expired' || p.feedStatus === 'removed') return false;
      return true;
    });
    const rank = (arr, kind) => [...arr].sort((a, b) => scoreByProfile(b, profile, kind) - scoreByProfile(a, profile, kind));
    setCine(cinePlans.sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0)));
    setSeries(rank(withRep(s, 'series'), 'series'));
    setMovies(rank(withRep(m, 'movies'), 'movies'));
    setSeenRecos({ series: seenS, movies: seenM });
    setTuned(Boolean(
      (profile.series.learnedLikes?.length || profile.series.learnedAvoid?.length) ||
      (profile.movies.learnedLikes?.length || profile.movies.learnedAvoid?.length)
    ));
    const trash = [];
    for (const t of ['series', 'movies']) {
      const arr = await db.table(t).toArray();
      trash.push(...arr.filter((r) => r.userStatus === 'discarded' || r.status === 'discarded'));
    }
    const cineTrash = allPlans.filter((p) => isCinePlan(p) && (p.userStatus === 'discarded' || p.status === 'discarded'));
    setDiscarded([...trash, ...cineTrash].sort((a, b) => (b.discardedAt || 0) - (a.discardedAt || 0)));
  };

  useEffect(() => {
    load();
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      // Cambio de día: caduca la selección de Hoy al cruzar medianoche.
      setTodayKey(getTodayKeyMadrid());
      load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
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
      showToast(result.success
        ? (result.skipped ? 'Ya estás al día' : `Actualizado${result.recoSummary ? ' · ' + result.recoSummary : ''}`)
        : `No se pudo actualizar: ${result.error}`);
      await load();
    } finally {
      setIsSyncing(false);
    }
  };

  // Cartelera usa las mismas acciones que en Planes.
  const onToggleInterest = async (e, plan) => {
    e.stopPropagation();
    const nowFav = await toggleInterest(plan.id);
    await load();
    showToast(nowFav ? "Guardado en favoritos" : "Desmarcado");
  };
  const onToggleForToday = async (e, plan) => {
    e.stopPropagation();
    const isForToday = plan.isForToday === true && plan.todaySelectionDate === todayKey;
    if (isForToday) { await removePlanFromToday(plan.id); showToast("Quitado de Hoy"); }
    else { await addPlanToToday(plan.id); showToast("Añadido a Hoy"); }
    await load();
  };
  const onDiscardPlan = async (e, id) => { e.stopPropagation(); await discardPlan(id); await load(); showToast("Plan descartado"); };
  const onRestorePlan = async (e, id) => { e.stopPropagation(); await restorePlan(id); await load(); showToast("Plan restaurado"); };

  const onFavReco = (table) => async (e, item) => {
    e.stopPropagation();
    const nowFav = await toggleRecoInterest(table, item.id);
    await load();
    showToast(nowFav ? "Guardado en favoritos (afina tus gustos)" : "Desmarcado");
  };
  const onFeedbackReco = (table) => async (e, item) => {
    e.stopPropagation();
    const promoted = await feedbackReco(table, item.id, 'disliked');
    await load();
    showToast(promoted ? `Descartada — entra en su lugar: ${promoted.title}` : "Descartada — evitaré similares");
  };
  const onSeenReco = (table) => (e, item) => {
    e.stopPropagation();
    setSeenFor({ table, item });
  };
  const onSeenKeep = async () => {
    const { table, item } = seenFor;
    await markRecoSeenFavorite(table, item.id);
    setSeenFor(null);
    await load();
    showToast('Guardada en favoritos · dentro de un mes te preguntamos si repites');
  };
  const onSeenPapelera = async () => {
    const { table, item } = seenFor;
    const promoted = await feedbackReco(table, item.id, 'seen');
    setSeenFor(null);
    await load();
    showToast(promoted ? `A la papelera — entra en su lugar: ${promoted.title}` : 'A la papelera: no volverá a proponérsela');
  };
  const onToggleTodayReco = (table) => async (e, item) => {
    e.stopPropagation();
    const on = await toggleRecoForToday(table, item.id);
    await load();
    showToast(on ? "Añadido a Hoy" : "Quitado de Hoy, sigue en favoritos");
  };
  const onRestoreReco = (table) => async (e, item) => {
    e.stopPropagation();
    await restoreReco(table, item.id);
    await load();
    showToast("Restaurado");
  };

  const counts = { cartelera: cine.length, series: series.length, movies: movies.length };
  const unfiltered = sub === 'cartelera' ? cine : sub === 'series' ? series : movies;
  const table = sub === 'series' ? 'series' : sub === 'movies' ? 'movies' : null;
  let list = unfiltered;
  // Favoritos incluye también las consumidas ("Vista/Ya fui → se queda").
  if (!showDiscarded && filterMode === 'favorites') {
    list = [...list, ...((table && seenRecos[table]) || [])].filter(isFavItem);
  }
  // "En Hoy" funciona igual en cartelera, series y películas (misma regla diaria).
  if (!showDiscarded && filterMode === 'today') {
    list = list.filter((p) => p.isForToday === true && p.todaySelectionDate === todayKey);
  }

  const serieMeta = (s) => [
    s.year || null,
    s.seasons != null ? `${s.seasons} temp.` : null,
    s.finished ? 'Terminada' : 'En curso',
    (s.platforms || []).slice(0, 2).join(' · ') || null,
  ].filter(Boolean).join(' · ');
  const movieMeta = (m) => [
    m.year || null,
    m.durationMin ? `${Math.floor(m.durationMin / 60)}h ${m.durationMin % 60}min` : null,
    (m.platforms || []).slice(0, 2).join(' · ') || null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="space-y-3 pb-28 pt-1">
      <div className="conn-hero px-5 pt-5 pb-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-theme-title text-[22px] font-black leading-tight">Cine y series</h2>
            <p className="text-xs font-bold text-white/85 mt-1" role="status">
              {counts.cartelera} en cartelera · {counts.series} series · {counts.movies} pelis
              {tuned ? ' · afinado a ti' : ''}
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            aria-label="Sincronizar"
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white text-conn-tealDark active:scale-95 transition-all disabled:opacity-60 flex-shrink-0"
            >
              <SyncGlyph size={22} spin={isSyncing} />
            </button>
        </div>
        <div className="flex items-center gap-1.5 mt-3" role="group" aria-label="Sección de cine">
          {SUBS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => { setSub(s.value); setShowDiscarded(false); setFilterMode('all'); }}
              aria-pressed={sub === s.value}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black min-h-[36px] transition-all ${
                sub === s.value ? 'bg-white text-conn-deep' : 'bg-white/20 text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5" role="group" aria-label="Filtrar por interés">
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
        {(showDiscarded ? discarded.filter((d) => {
          if (sub === 'cartelera') return String(d.id).startsWith('cine-') || d.id === 'plan-cine-sevilla' || (d.categories || []).includes('Cine');
          if (sub === 'series') return String(d.id).startsWith('serie-');
          return String(d.id).startsWith('movie-');
        }) : []).map((item) => (
          sub === 'cartelera' ? (
            <PlanCard
              key={item.id} plan={item} showDiscarded
              isExpanded={expandedId === item.id} onToggle={toggleExpanded}
              onToggleInterest={onToggleInterest} onToggleForToday={onToggleForToday}
              onDiscard={onDiscardPlan} onRestore={onRestorePlan} todayKey={todayKey}
              venueChips={cineChipsOf(item)}
            />
          ) : (
            <RecoCard
              key={item.id} item={item} kindLabel={sub === 'series' ? 'Serie' : 'Peli'}
              meta={sub === 'series' ? serieMeta(item) : movieMeta(item)}
              onFav={onFavReco(table)} onToggleToday={onToggleTodayReco(table)} onSeen={onSeenReco(table)} onFeedback={onFeedbackReco(table)} onRestore={onRestoreReco(table)}
              isExpanded={expandedId === item.id} onToggle={toggleExpanded} discarded
              todayKey={todayKey}
            />
          )
        ))}

        {!showDiscarded && sub === 'cartelera' && list.map((plan) => (
          <PlanCard
            key={plan.id} plan={plan} showDiscarded={false}
            isExpanded={expandedId === plan.id} onToggle={toggleExpanded}
            onToggleInterest={onToggleInterest} onToggleForToday={onToggleForToday}
            onDiscard={onDiscardPlan} onRestore={onRestorePlan} todayKey={todayKey}
            venueChips={cineChipsOf(plan)}
          />
        ))}

        {!showDiscarded && table && list.map((item) => (
          <RecoCard
            key={item.id} item={item} kindLabel={sub === 'series' ? 'Serie' : 'Peli'}
            meta={sub === 'series' ? serieMeta(item) : movieMeta(item)}
            onFav={onFavReco(table)} onToggleToday={onToggleTodayReco(table)} onSeen={onSeenReco(table)} onFeedback={onFeedbackReco(table)} onRestore={onRestoreReco(table)}
            isExpanded={expandedId === item.id} onToggle={toggleExpanded} discarded={false}
            todayKey={todayKey}
          />
        ))}

        {!showDiscarded && list.length === 0 && (
          <div className="conn-card text-center py-12 px-6">
            <FBadge name={sub === 'cartelera' ? 'cine' : sub === 'series' ? 'varios' : 'cine'} color={sub === 'cartelera' ? '#4A6FCC' : '#12A5B5'} size={56} />
            <p className="font-theme-title text-[15px] font-black text-conn-deep mb-1 mt-3">
              {filterMode === 'favorites'
                ? 'Sin favoritos aquí todavía'
                : filterMode === 'today'
                  ? 'Nada en Hoy en esta sección'
                  : 'Nada por aquí todavía'}
            </p>
            <p className="text-xs font-semibold text-conn-muted">
              {filterMode === 'all'
                ? 'Sincroniza para traer las novedades de la semana.'
                : 'Marca el corazón o "Añadir a Hoy" en una tarjeta para verla aquí.'}
            </p>
          </div>
        )}
      </div>

      {seenFor && (
        <SeenChoiceDialog
          title={seenFor.item.title}
          verb="Has visto esta recomendación"
          onKeep={onSeenKeep}
          onDiscard={onSeenPapelera}
          onClose={() => setSeenFor(null)}
        />
      )}
    </div>
  );
}
