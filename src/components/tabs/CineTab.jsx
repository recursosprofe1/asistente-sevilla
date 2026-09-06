import React, { useState, useEffect, useRef } from "react";
import { FBadge, FGlyph, CategoryBadge } from "../illustrations/NotoBadges";
import { db, getVisibleRecos, toggleRecoInterest, feedbackReco, restoreReco } from "../../db";
import { getTasteProfile } from "../../services/recoService";
import { syncPlansFromCloud } from "../../services/feedService";
import { PlanCard } from "./PlanesTab";
import {
  toggleInterest, addPlanToToday, removePlanFromToday, discardPlanRepo, restorePlanRepo
} from "../../services/planRepository";
import { discardPlan, restorePlan } from "../../db";
import { PlanWhy, PlanSourceLink } from "../plans/shared";
import { getTodayKeyMadrid } from "../../utils/time";

const SUBS = [
  { value: 'cartelera', label: 'Cartelera' },
  { value: 'series', label: 'Series' },
  { value: 'movies', label: 'Películas' },
];

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

function RecoCard({ item, kindLabel, meta, onFav, onFeedback, onRestore, isExpanded, onToggle, discarded }) {
  const isInterested = item.userStatus === "interested" || item.status === "interested";
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
            {isInterested && (
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
              onClick={(e) => onFeedback(e, item, 'seen')}
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
  const [cine, setCine] = useState([]);
  const [series, setSeries] = useState([]);
  const [movies, setMovies] = useState([]);
  const [discarded, setDiscarded] = useState([]);
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [toast, setToast] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tuned, setTuned] = useState(false);
  const toastTimer = useRef(null);
  const todayKey = getTodayKeyMadrid();

  const load = async () => {
    const [cinePlans, s, m, profile] = await Promise.all([
      db.plans.toArray().then((all) => all.filter((p) => {
        if (p.userStatus === 'discarded' || p.status === 'discarded' || p.status === 'purged') return false;
        if (p.feedStatus === 'expired' || p.feedStatus === 'removed') return false;
        const cats = p.categories || (p.category ? [p.category] : []);
        return cats.includes('Cine') || String(p.id).startsWith('cine-') || p.id === 'plan-cine-sevilla';
      })),
      getVisibleRecos('series'),
      getVisibleRecos('movies'),
      getTasteProfile(db),
    ]);
    const rank = (arr, kind) => [...arr].sort((a, b) => scoreByProfile(b, profile, kind) - scoreByProfile(a, profile, kind));
    setCine(cinePlans.sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0)));
    setSeries(rank(s, 'series'));
    setMovies(rank(m, 'movies'));
    setTuned(Boolean(
      (profile.series.learnedLikes?.length || profile.series.learnedAvoid?.length) ||
      (profile.movies.learnedLikes?.length || profile.movies.learnedAvoid?.length)
    ));
    const trash = [];
    for (const t of ['series', 'movies']) {
      const arr = await db.table(t).toArray();
      trash.push(...arr.filter((r) => r.userStatus === 'discarded' || r.status === 'discarded'));
    }
    const cineTrash = (await db.plans.toArray()).filter((p) => {
      const cats = p.categories || (p.category ? [p.category] : []);
      const isCine = cats.includes('Cine') || String(p.id).startsWith('cine-') || p.id === 'plan-cine-sevilla';
      return isCine && (p.userStatus === 'discarded' || p.status === 'discarded');
    });
    setDiscarded([...trash, ...cineTrash].sort((a, b) => (b.discardedAt || 0) - (a.discardedAt || 0)));
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
  const onFeedbackReco = (table, kind) => async (e, item) => {
    e.stopPropagation();
    const promoted = await feedbackReco(table, item.id);
    await load();
    showToast(kind === 'seen'
      ? (promoted ? `Vista — entra en su lugar: ${promoted.title}` : "Vista — afinará tus gustos")
      : (promoted ? `Descartada — entra en su lugar: ${promoted.title}` : "Descartada — evitaré similares"));
  };
  const onRestoreReco = (table) => async (e, item) => {
    e.stopPropagation();
    await restoreReco(table, item.id);
    await load();
    showToast("Restaurado");
  };
  const onDiscardCineTrash = async (e, id) => { e.stopPropagation(); await discardPlanRepo(id); await load(); showToast("Descartado"); };
  const onRestoreCineTrash = async (e, id) => { e.stopPropagation(); await restorePlanRepo(id); await load(); showToast("Restaurado"); };

  const counts = { cartelera: cine.length, series: series.length, movies: movies.length };
  const list = sub === 'cartelera' ? cine : sub === 'series' ? series : movies;
  const table = sub === 'series' ? 'series' : sub === 'movies' ? 'movies' : null;

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
            <span className={isSyncing ? "animate-spin inline-flex" : "inline-flex"}>
              <FBadge name="sync" color="#0E7E8C" size={44} />
            </span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-3" role="group" aria-label="Sección de cine">
          {SUBS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => { setSub(s.value); setShowDiscarded(false); }}
              aria-pressed={sub === s.value}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black min-h-[36px] transition-all ${
                sub === s.value ? 'bg-white text-conn-deep' : 'bg-white/20 text-white'
              }`}
            >
              {s.label}
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
              onDiscard={onDiscardCineTrash} onRestore={onRestoreCineTrash} todayKey={todayKey}
            />
          ) : (
            <RecoCard
              key={item.id} item={item} kindLabel={sub === 'series' ? 'Serie' : 'Peli'}
              meta={sub === 'series' ? serieMeta(item) : movieMeta(item)}
              onFav={onFavReco(table)} onFeedback={onFeedbackReco(table)} onRestore={onRestoreReco(table)}
              isExpanded={expandedId === item.id} onToggle={toggleExpanded} discarded
            />
          )
        ))}

        {!showDiscarded && sub === 'cartelera' && cine.map((plan) => (
          <PlanCard
            key={plan.id} plan={plan} showDiscarded={false}
            isExpanded={expandedId === plan.id} onToggle={toggleExpanded}
            onToggleInterest={onToggleInterest} onToggleForToday={onToggleForToday}
            onDiscard={onDiscardPlan} onRestore={onRestorePlan} todayKey={todayKey}
          />
        ))}

        {!showDiscarded && table && list.map((item) => (
          <RecoCard
            key={item.id} item={item} kindLabel={sub === 'series' ? 'Serie' : 'Peli'}
            meta={sub === 'series' ? serieMeta(item) : movieMeta(item)}
            onFav={onFavReco(table)} onFeedback={onFeedbackReco(table)} onRestore={onRestoreReco(table)}
            isExpanded={expandedId === item.id} onToggle={toggleExpanded} discarded={false}
          />
        ))}

        {!showDiscarded && list.length === 0 && (
          <div className="conn-card text-center py-12 px-6">
            <FBadge name={sub === 'cartelera' ? 'cine' : sub === 'series' ? 'varios' : 'cine'} color={sub === 'cartelera' ? '#4A6FCC' : '#12A5B5'} size={56} />
            <p className="font-theme-title text-[15px] font-black text-conn-deep mb-1 mt-3">Nada por aquí todavía</p>
            <p className="text-xs font-semibold text-conn-muted">Sincroniza para traer las novedades de la semana.</p>
          </div>
        )}
      </div>
    </div>
  );
}
