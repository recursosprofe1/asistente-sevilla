import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sparkles,
  Plus,
  Check,
  Search,
  ShoppingBag,
  X
} from 'lucide-react';
import { ZenStones } from '../illustrations/MeditoVectors';
import { HeaderVectorCompras } from '../illustrations/AreaHeaderVectors';
import { db, addPurchaseDesire, updatePurchaseStatus } from '../../db';
import { getLocalPurchaseSuggestions } from '../../services/feedService';

export default function ComprasTab() {
  const [purchases, setPurchases] = useState([]);
  const [newDesire, setNewDesire] = useState('');
  const [filterMode, setFilterMode] = useState('watching');
  const [notification, setNotification] = useState('');

  // Sugerencias locales en tiempo real (sin API externa)
  const [liveHints, setLiveHints] = useState([]);

  const loadPurchasesFromDb = async () => {
    try {
      const all = await db.purchases.toArray();
      setPurchases(all.filter((p) => p.status !== 'discarded'));
    } catch (e) {
      console.error('Error cargando compras de Dexie:', e);
    }
  };

  useEffect(() => {
    loadPurchasesFromDb();
  }, []);

  // Actualizar sugerencias locales mientras el usuario escribe (sin API)
  useEffect(() => {
    if (newDesire.trim().length >= 3) {
      setLiveHints(getLocalPurchaseSuggestions(newDesire));
    } else {
      setLiveHints([]);
    }
  }, [newDesire]);

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleAddDesire = async (e) => {
    e.preventDefault();
    const text = newDesire.trim();
    if (!text) return;

    // Las sugerencias ya están calculadas localmente: las adjuntamos directamente
    const models = getLocalPurchaseSuggestions(text);
    await addPurchaseDesire(text, models);
    setNewDesire('');
    setLiveHints([]);
    await loadPurchasesFromDb();
    notify(`"${text}" guardada en observación — revisión en 30 días`);
  };

  const handlePostpone = async (id) => {
    await updatePurchaseStatus(id, 'deferred');
    await loadPurchasesFromDb();
    notify('Observación extendida 30 días más');
  };

  const handleMarkBought = async (id) => {
    await updatePurchaseStatus(id, 'bought');
    await loadPurchasesFromDb();
    notify('Marcado como comprado y archivado');
  };

  const handleDiscard = async (id) => {
    await updatePurchaseStatus(id, 'discarded');
    await loadPurchasesFromDb();
    notify('Deseo descartado');
  };

  const calculateDaysLeft = (reviewDateStr) => {
    if (!reviewDateStr) return 30;
    const diff = new Date(reviewDateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const displayedPurchases = purchases.filter((p) => {
    if (filterMode === 'watching') return p.status === 'watching';
    if (filterMode === 'bought') return p.status === 'bought';
    return true;
  });

  const watchingCount = purchases.filter((p) => p.status === 'watching').length;
  const boughtCount = purchases.filter((p) => p.status === 'bought').length;

  return (
    <div className="space-y-4 pb-28 pt-1">

      {/* ── CABECERA ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-4.5 shadow-serene border border-blue-100/80 relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-100 flex items-center justify-center shadow-serene-sm">
              <ZenStones className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-blue-950 font-theme-title leading-tight">
                Módulo Compras
              </h2>
              <p className="text-[11px] text-slate-500">Regla de enfriamiento — 30 días sin impulsividad</p>
            </div>
          </div>
          <HeaderVectorCompras className="w-20 h-14 opacity-95 flex-shrink-0" />
        </div>

        <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
          Escribe un producto. Se guardará con{' '}
          <span className="font-bold text-blue-700">sugerencias de modelos reales</span> y una cuenta atrás
          de 30 días para frenar compras impulsivas. Todo funciona{' '}
          <span className="font-semibold text-blue-800">sin conexión</span>.
        </p>

        {/* ── Formulario de entrada ────────────────────────────────────── */}
        <form onSubmit={handleAddDesire} className="space-y-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={newDesire}
              onChange={(e) => setNewDesire(e.target.value)}
              placeholder="Ej. Auriculares inalámbricos, Cafetera, Tablet..."
              className="w-full pl-9 pr-28 py-2.5 bg-blue-50/50 border border-blue-200 rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
            />
            {newDesire && (
              <button
                type="button"
                onClick={() => { setNewDesire(''); setLiveHints([]); }}
                className="absolute right-[90px] text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={!newDesire.trim()}
              className="absolute right-1 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-all shadow-serene-sm active:scale-95 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Observar</span>
            </button>
          </div>

          {/* Sugerencias locales en tiempo real (sin llamada API) */}
          {liveHints.length > 0 && (
            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3 space-y-1.5 animate-fadeIn">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Modelos que se guardarán con tu deseo:
              </p>
              {liveHints.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-blue-100/60 last:border-0">
                  <div>
                    <span className="font-semibold text-blue-950">{m.name}</span>
                    <p className="text-[10px] text-slate-500">{m.note}</p>
                  </div>
                  <span className="font-bold text-blue-900 ml-2 flex-shrink-0 text-[11px]">{m.price}</span>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* ── Filtros ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 pt-3 mt-1 border-t border-slate-100 overflow-x-auto hide-scrollbar">
          {[
            { mode: 'watching', label: `En observación (${watchingCount})` },
            { mode: 'bought',   label: `Comprados (${boughtCount})` },
            { mode: 'all',      label: `Todos (${purchases.length})` }
          ].map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 transition-all ${
                filterMode === mode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {notification && (
        <div className="bg-blue-900 text-white text-xs px-4 py-2 rounded-full flex items-center justify-between shadow-serene-lg animate-fadeIn">
          <span>{notification}</span>
          <Check className="w-3.5 h-3.5 text-blue-300 ml-2" />
        </div>
      )}

      {/* ── Lista de tarjetas de Compras ──────────────────────────────── */}
      <div className="space-y-3.5">
        {displayedPurchases.map((item) => {
          const daysLeft = calculateDaysLeft(item.reviewDate);
          const isBought = item.status === 'bought';

          return (
            <article
              key={item.id}
              className={`bg-white rounded-3xl p-4.5 shadow-serene border transition-all hover:shadow-serene-lg ${
                isBought ? 'border-emerald-200 bg-emerald-50/20' : 'border-blue-100/80'
              }`}
            >
              {/* Badge de estado */}
              <div className="flex items-start justify-between gap-2 mb-2">
                {isBought ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                    <Check className="w-3 h-3 stroke-[3]" /> Comprado
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${
                    daysLeft === 0
                      ? 'text-amber-800 bg-amber-100 border-amber-200'
                      : 'text-blue-800 bg-blue-50 border-blue-100'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {daysLeft > 0 ? `${daysLeft} días de reflexión` : '¡Plazo cumplido! — hora de decidir'}
                  </span>
                )}
                <span className="text-[10px] text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </span>
              </div>

              <h3 className="text-sm font-bold text-blue-950 font-theme-title mb-2.5 leading-snug">
                {item.desireTitle}
              </h3>

              {/* Modelos sugeridos locales */}
              {item.models && item.models.length > 0 && (
                <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100/70 mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3 h-3" />
                    Modelos seleccionados para ti
                  </p>
                  {item.models.map((m, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs py-1.5 border-b border-blue-100/50 last:border-0">
                      <div className="pr-3">
                        <span className="font-semibold text-blue-950">{m.name}</span>
                        <p className="text-[10px] text-slate-500">{m.note}</p>
                      </div>
                      <span className="font-bold text-blue-900 flex-shrink-0">{m.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Barra de progreso visual de los 30 días */}
              {!isBought && (
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Progreso reflexión</span>
                    <span>{30 - daysLeft}/30 días</span>
                  </div>
                  <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((30 - daysLeft) / 30) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleDiscard(item.id)}
                  className="text-xs font-medium text-slate-500 hover:text-red-600 py-2 px-2.5 rounded-full bg-slate-50 hover:bg-red-50/60 transition-colors text-center"
                >
                  Descartar
                </button>

                {!isBought ? (
                  <>
                    <button
                      onClick={() => handlePostpone(item.id)}
                      className="text-xs font-semibold text-blue-700 py-2 px-2.5 rounded-full bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors text-center"
                    >
                      +30 días
                    </button>
                    <button
                      onClick={() => handleMarkBought(item.id)}
                      className="text-xs font-semibold text-white py-2 px-2.5 rounded-full bg-blue-600 hover:bg-blue-700 shadow-serene-sm transition-all text-center"
                    >
                      Comprado ✓
                    </button>
                  </>
                ) : (
                  <div className="col-span-2 flex justify-end items-center text-xs text-emerald-700 font-semibold pr-2">
                    Archivado en tu historial
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {displayedPurchases.length === 0 && (
          <div className="text-center py-10 px-4 bg-white rounded-3xl border border-blue-100 shadow-serene">
            <ShoppingBag className="w-10 h-10 mx-auto text-blue-200 mb-3" />
            <p className="text-sm font-bold text-blue-950 mb-1">Sin entradas en esta vista</p>
            <p className="text-xs text-slate-500">
              Escribe un producto arriba para añadirlo a la lista de observación.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
