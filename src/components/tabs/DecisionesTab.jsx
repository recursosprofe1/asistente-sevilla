import React, { useState, useEffect } from 'react';
import { FBadge, FGlyph } from '../illustrations/FlatBadges';
import { db, addDeferredDecision, updateDecisionStatus } from '../../db';

export default function DecisionesTab() {
  const [decisions, setDecisions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    reason: '',
    criteria: '',
    days: 30
  });
  const [filterMode, setFilterMode] = useState('pending'); // 'pending' | 'deferred' | 'decided'
  const [message, setMessage] = useState('');

  const loadDecisionsFromDb = async () => {
    try {
      const all = await db.decisions.toArray();
      setDecisions(all.filter((d) => d.status !== 'discarded'));
    } catch (e) {
      console.error('Error cargando decisiones de Dexie:', e);
    }
  };

  useEffect(() => {
    loadDecisionsFromDb();
  }, []);

  const handleCreateDecision = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      await addDeferredDecision({
        title: formData.title.trim(),
        reason: formData.reason.trim() || 'Pausa consciente',
        criteria: formData.criteria.trim() || 'Evaluar conveniencia',
        days: Number(formData.days) || 30
      });

      setFormData({ title: '', reason: '', criteria: '', days: 30 });
      setShowAddForm(false);
      await loadDecisionsFromDb();
      setMessage('Decisión aplazada registrada');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecideNow = async (id) => {
    await updateDecisionStatus(id, 'decided');
    await loadDecisionsFromDb();
    setMessage('Decisión marcada como resuelta');
    setTimeout(() => setMessage(''), 3000);
  };

  const handlePostpone = async (id) => {
    await updateDecisionStatus(id, 'deferred');
    await loadDecisionsFromDb();
    setMessage('Movida a pospuestas y extendida 1 mes');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDiscard = async (id) => {
    await updateDecisionStatus(id, 'discarded');
    await loadDecisionsFromDb();
    setMessage('Decisión descartada');
    setTimeout(() => setMessage(''), 3000);
  };

  const displayedDecisions = decisions.filter((d) => {
    if (filterMode === 'pending') return d.status === 'pending';
    if (filterMode === 'deferred') return d.status === 'deferred';
    if (filterMode === 'decided') return d.status === 'decided';
    return true;
  });

  const counts = {
    pending: decisions.filter(d => d.status === 'pending').length,
    deferred: decisions.filter(d => d.status === 'deferred').length,
    decided: decisions.filter(d => d.status === 'decided').length
  };

  return (
    <div className="space-y-3 pb-28 pt-1">
      {/* Cabecera */}
      <div className="conn-hero px-5 pt-5 pb-4 text-white">
        <div className="flex items-center gap-3">
          <FBadge name="balanza" color="#FFFFFF" size={44} />
          <div>
            <h2 className="font-theme-title text-[20px] font-black leading-tight">
              Decisiones
            </h2>
            <p className="text-[11px] font-bold text-white/85">Pausa consciente</p>
          </div>
        </div>

        <p className="text-xs font-semibold text-white/85 mt-3 leading-relaxed">
          Al posponer una decisión, pasa a <span className="font-black">Pospuestas</span> para liberar carga mental.
        </p>

        <div className="pt-3 mt-1">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs font-black bg-white text-conn-deep transition-all active:scale-95 min-h-[44px]"
          >
            <FGlyph name="plus" size={16} color="#0B3B42" />
            <span>{showAddForm ? 'Cancelar' : 'Añadir decisión aplazada'}</span>
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleCreateDecision} className="mt-3 p-3.5 bg-white rounded-3xl space-y-2.5 animate-fadeIn">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-conn-muted mb-1">Asunto</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Ej. Renovar seguro..." className="w-full px-3 py-2 bg-conn-aqua rounded-xl text-xs font-bold text-conn-deep placeholder:text-conn-muted/70 placeholder:font-semibold focus:ring-2 focus:ring-conn-teal outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-conn-muted mb-1">Motivo pausa</label>
              <input type="text" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} placeholder="Ej. Esperar facturas" className="w-full px-3 py-2 bg-conn-aqua rounded-xl text-xs font-bold text-conn-deep placeholder:text-conn-muted/70 placeholder:font-semibold focus:ring-2 focus:ring-conn-teal outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-conn-muted mb-1">Criterio</label>
              <input type="text" value={formData.criteria} onChange={(e) => setFormData({...formData, criteria: e.target.value})} placeholder="Ej. Si sube >5%, cancelar" className="w-full px-3 py-2 bg-conn-aqua rounded-xl text-xs font-bold text-conn-deep placeholder:text-conn-muted/70 placeholder:font-semibold focus:ring-2 focus:ring-conn-teal outline-none" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-conn-muted">Plazo:</span>
                {[15, 30, 60].map((d) => (
                  <button type="button" key={d} onClick={() => setFormData({...formData, days: d})} className={`px-2.5 py-1 rounded-full text-[10px] font-black min-h-[32px] ${formData.days === d ? 'bg-conn-teal text-white' : 'bg-conn-aqua text-conn-muted'}`}>{d}d</button>
                ))}
              </div>
              <button type="submit" className="px-4 py-1.5 rounded-full text-xs font-black bg-conn-teal text-white min-h-[36px]">Guardar</button>
            </div>
          </form>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-1.5 pt-3 mt-1">
          <button onClick={() => setFilterMode('pending')} className={`px-3 py-1.5 rounded-full text-[11px] font-black min-h-[36px] transition-all ${filterMode === 'pending' ? 'bg-white text-conn-deep' : 'bg-white/20 text-white'}`}>
            Pendientes ({counts.pending})
          </button>
          <button onClick={() => setFilterMode('deferred')} className={`px-3 py-1.5 rounded-full text-[11px] font-black min-h-[36px] transition-all ${filterMode === 'deferred' ? 'bg-white text-conn-deep' : 'bg-white/20 text-white'}`}>
            Pospuestas ({counts.deferred})
          </button>
          <button onClick={() => setFilterMode('decided')} className={`px-3 py-1.5 rounded-full text-[11px] font-black min-h-[36px] transition-all ${filterMode === 'decided' ? 'bg-white text-conn-deep' : 'bg-white/20 text-white'}`}>
            Resueltas ({counts.decided})
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-conn-deep text-white text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-fadeIn mx-1">
          <FBadge name="check" color="#3A9E70" size={20} />
          <span>{message}</span>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2.5">
        {displayedDecisions.map((dec) => {
          const isDecided = dec.status === 'decided';
          const isDeferred = dec.status === 'deferred';

          return (
            <article key={dec.id} className="conn-card p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full ${
                  isDecided ? 'text-conn-deep bg-conn-mist' :
                  isDeferred ? 'text-conn-deep bg-conn-amberSoft' :
                  'text-conn-tealDark bg-conn-mist'
                }`}>
                  <FBadge name={isDecided ? 'check' : isDeferred ? 'reloj' : 'calendario'} color={isDecided ? '#3A9E70' : isDeferred ? '#D4860A' : '#0E7E8C'} size={18} />
                  {isDecided ? 'Resuelta' : isDeferred ? `Pospuesta al: ${dec.reviewDate}` : `Revisión: ${dec.reviewDate}`}
                </span>
                <span className="text-[10px] font-bold text-conn-muted">{new Date(dec.createdAt).toLocaleDateString()}</span>
              </div>

              <h3 className="font-theme-title text-[15px] font-black text-conn-deep mb-2.5 leading-snug">{dec.title}</h3>

              <div className="bg-conn-aqua p-3 rounded-2xl mb-3 space-y-2 text-xs">
                <div>
                  <span className="font-black text-conn-muted text-[10px] uppercase tracking-wider block mb-0.5">Motivo pausa</span>
                  <p className="font-semibold text-conn-deep/80 leading-relaxed">{dec.reason}</p>
                </div>
                <div className="pt-2 border-t border-white">
                  <span className="font-black text-conn-tealDark text-[10px] uppercase tracking-wider block mb-0.5">Criterio</span>
                  <p className="text-conn-deep font-black leading-relaxed">{dec.criteria}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-conn-aqua">
                <button onClick={() => handleDiscard(dec.id)} className="text-xs font-bold text-conn-muted py-2 px-2 rounded-full bg-conn-aqua min-h-[40px] transition-colors">
                  Descartar
                </button>

                {!isDecided ? (
                  <>
                    <button onClick={() => handlePostpone(dec.id)} className="text-xs font-black text-conn-deep py-2 px-2 rounded-full bg-conn-amberSoft min-h-[40px] transition-colors">
                      Posponer 1m
                    </button>
                    <button onClick={() => handleDecideNow(dec.id)} className="text-xs font-black text-white py-2 px-2 rounded-full bg-conn-teal min-h-[40px] transition-all">
                      Decidir hoy
                    </button>
                  </>
                ) : (
                  <div className="col-span-2 flex justify-end items-center text-xs text-conn-tealDark font-black pr-2">
                    ✓ Resuelto y archivado
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {displayedDecisions.length === 0 && (
          <div className="conn-card text-center py-10 px-6">
            <FBadge name="archivo" color="#4A6FCC" size={56} />
            <p className="font-theme-title text-[15px] font-black text-conn-deep mt-3">Nada que mostrar aquí</p>
          </div>
        )}
      </div>
    </div>
  );
}
