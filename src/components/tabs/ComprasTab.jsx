import React, { useState, useEffect } from 'react';
import { FBadge, FGlyph } from '../illustrations/NotoBadges';
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
    <div className="space-y-3 pb-28 pt-1">

      {/* ── CABECERA ───────────────────────────────────────────────────── */}
      <div className="conn-hero px-5 pt-5 pb-4 text-white">
        <div className="flex items-center gap-3">
          <FBadge name="bolsa" color="#FFFFFF" size={44} />
          <div>
            <h2 className="font-theme-title text-[20px] font-black leading-tight">
              Compras
            </h2>
            <p className="text-[11px] font-bold text-white/85">30 días sin impulsividad</p>
          </div>
        </div>

        <p className="text-xs font-semibold text-white/85 mt-3 leading-relaxed">
          Escribe un producto. Se guardará con modelos orientativos y cuenta atrás.
          Todo funciona <span className="font-black">sin conexión</span>.
        </p>

        {/* ── Formulario de entrada ────────────────────────────────────── */}
        <form onSubmit={handleAddDesire} className="space-y-2 mt-3">
          <div className="relative flex items-center">
            <span className="absolute left-3 pointer-events-none">
              <FGlyph name="lupa" size={16} color="#5E8B91" />
            </span>
            <input
              type="text"
              value={newDesire}
              onChange={(e) => setNewDesire(e.target.value)}
              placeholder="Ej. Auriculares, Cafetera, Tablet..."
              className="w-full pl-9 pr-28 py-2.5 bg-white border-0 rounded-full text-xs font-bold text-conn-deep placeholder:text-conn-muted/70 placeholder:font-semibold focus:outline-none focus:ring-2 focus:ring-white/60 transition-all"
            />
            {newDesire && (
              <button
                type="button"
                onClick={() => { setNewDesire(''); setLiveHints([]); }}
                className="absolute right-[90px]"
                aria-label="Limpiar búsqueda"
              >
                <FGlyph name="x" size={14} color="#5E8B91" />
              </button>
            )}
            <button
              type="submit"
              disabled={!newDesire.trim()}
              className="absolute right-1 px-3.5 py-1.5 rounded-full text-xs font-black bg-conn-deep text-white disabled:opacity-40 transition-all active:scale-95 flex items-center gap-1"
            >
              <FGlyph name="plus" size={14} color="#FFFFFF" />
              <span>Observar</span>
            </button>
          </div>

          {/* Sugerencias locales en tiempo real (sin llamada API) */}
          {liveHints.length > 0 && (
            <div className="bg-white rounded-3xl p-3.5 space-y-1.5 animate-fadeIn">
              <p className="text-[10px] font-black uppercase tracking-wider text-conn-tealDark flex items-center gap-1.5">
                <FBadge name="spark" color="#0E7E8C" size={20} />
                Modelos que se guardarán:
              </p>
              {liveHints.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-conn-aqua last:border-0">
                  <div>
                    <span className="font-black text-conn-deep">{m.name}</span>
                    <p className="text-[10px] font-semibold text-conn-muted">{m.note}</p>
                  </div>
                  <span className="font-black text-conn-deep ml-2 flex-shrink-0 text-[11px]">{m.price}</span>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* ── Filtros ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 pt-3 mt-1">
          {[
            { mode: 'watching', label: `En observación (${watchingCount})` },
            { mode: 'bought',   label: `Comprados (${boughtCount})` },
            { mode: 'all',      label: `Todos (${purchases.length})` }
          ].map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black min-h-[36px] transition-all ${
                filterMode === mode
                  ? 'bg-white text-conn-deep'
                  : 'bg-white/20 text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {notification && (
        <div className="bg-conn-deep text-white text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-fadeIn mx-1">
          <FBadge name="check" color="#3A9E70" size={20} />
          <span>{notification}</span>
        </div>
      )}

      {/* ── Lista de tarjetas de Compras ──────────────────────────────── */}
      <div className="space-y-2.5">
        {displayedPurchases.map((item) => {
          const daysLeft = calculateDaysLeft(item.reviewDate);
          const isBought = item.status === 'bought';

          return (
            <article key={item.id} className="conn-card p-4">
              {/* Badge de estado */}
              <div className="flex items-start justify-between gap-2 mb-2">
                {isBought ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-conn-deep bg-conn-mist px-3 py-1 rounded-full">
                    <FBadge name="check" color="#3A9E70" size={18} /> Comprado
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full ${
                    daysLeft === 0 ? 'text-conn-deep bg-conn-amberSoft' : 'text-conn-tealDark bg-conn-mist'
                  }`}>
                    <FBadge name="reloj" color="#0E7E8C" size={18} />
                    {daysLeft > 0 ? `${daysLeft} días de reflexión` : '¡Plazo cumplido! — hora de decidir'}
                  </span>
                )}
                <span className="text-[10px] font-bold text-conn-muted">
                  {new Date(item.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </span>
              </div>

              <h3 className="font-theme-title text-[15px] font-black text-conn-deep mb-2.5 leading-snug">
                {item.desireTitle}
              </h3>

              {/* Modelos sugeridos locales */}
              {item.models && item.models.length > 0 && (
                <div className="bg-conn-aqua p-3 rounded-2xl mb-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-conn-tealDark flex items-center gap-1.5 mb-2">
                    <FBadge name="spark" color="#0E7E8C" size={18} />
                    Modelos seleccionados para ti
                  </p>
                  {item.models.map((m, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs py-1.5 border-b border-white last:border-0">
                      <div className="pr-3">
                        <span className="font-black text-conn-deep">{m.name}</span>
                        <p className="text-[10px] font-semibold text-conn-muted">{m.note}</p>
                      </div>
                      <span className="font-black text-conn-deep flex-shrink-0">{m.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Barra de progreso visual de los 30 días */}
              {!isBought && (
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] font-bold text-conn-muted mb-1">
                    <span>Progreso reflexión</span>
                    <span>{30 - daysLeft}/30 días</span>
                  </div>
                  <div className="h-2 bg-conn-mist rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((30 - daysLeft) / 30) * 100)}%`, background: 'linear-gradient(90deg,#12A5B5,#0E7E8C)' }}
                    />
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-conn-aqua">
                <button
                  onClick={() => handleDiscard(item.id)}
                  className="text-xs font-bold text-conn-muted py-2 px-2 rounded-full bg-conn-aqua min-h-[40px] transition-colors text-center"
                >
                  Descartar
                </button>

                {!isBought ? (
                  <>
                    <button
                      onClick={() => handlePostpone(item.id)}
                      className="text-xs font-black text-conn-tealDark py-2 px-2 rounded-full bg-conn-mist min-h-[40px] transition-colors text-center"
                    >
                      +30 días
                    </button>
                    <button
                      onClick={() => handleMarkBought(item.id)}
                      className="text-xs font-black text-white py-2 px-2 rounded-full bg-conn-teal min-h-[40px] transition-all text-center"
                    >
                      Comprado ✓
                    </button>
                  </>
                ) : (
                  <div className="col-span-2 flex justify-end items-center text-xs text-conn-tealDark font-black pr-2">
                    Archivado en tu historial
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {displayedPurchases.length === 0 && (
          <div className="conn-card text-center py-10 px-6">
            <FBadge name="bolsa" color="#D4860A" size={56} />
            <p className="font-theme-title text-[15px] font-black text-conn-deep mb-1 mt-3">Sin entradas en esta vista</p>
            <p className="text-xs font-semibold text-conn-muted">
              Escribe un producto arriba para añadirlo a la lista de observación.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
