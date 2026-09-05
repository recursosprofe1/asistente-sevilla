import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Plus, Check, ChevronDown, Clock, Archive } from 'lucide-react';
import { SereneScale } from '../illustrations/MeditoVectors';
import { HeaderVectorDecisiones } from '../illustrations/AreaHeaderVectors';
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
    <div className="space-y-4 pb-28 pt-1">
      {/* Cabecera */}
      <div className="bg-white rounded-3xl p-4.5 shadow-serene border border-blue-100/80 overflow-hidden relative">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-serene-sm">
              <SereneScale className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-blue-950 font-theme-title leading-tight">
                Módulo Decisiones
              </h2>
              <p className="text-[11px] text-slate-500">Pausa consciente</p>
            </div>
          </div>
          <HeaderVectorDecisiones className="w-20 h-14 opacity-95 flex-shrink-0" />
        </div>

        <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
          Al posponer una decisión, esta desaparecerá de la vista principal hacia la pestaña de <span className="font-bold text-blue-700">Pospuestas</span> para liberar carga mental.
        </p>

        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-200 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancelar' : 'Añadir nueva decisión aplazada'}</span>
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleCreateDecision} className="mt-3.5 p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-2.5 animate-fadeIn">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Asunto</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Ej. Renovar seguro..." className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-blue-400 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Motivo pausa</label>
              <input type="text" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} placeholder="Ej. Esperar facturas" className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-blue-400 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Criterio</label>
              <input type="text" value={formData.criteria} onChange={(e) => setFormData({...formData, criteria: e.target.value})} placeholder="Ej. Si sube >5%, cancelar" className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-blue-400 outline-none" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-500">Plazo:</span>
                {[15, 30, 60].map((d) => (
                  <button type="button" key={d} onClick={() => setFormData({...formData, days: d})} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${formData.days === d ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'}`}>{d}d</button>
                ))}
              </div>
              <button type="submit" className="px-4 py-1.5 rounded-full text-xs font-bold bg-blue-600 text-white hover:bg-blue-700">Guardar</button>
            </div>
          </form>
        )}

        {/* Filtros */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
            <button onClick={() => setFilterMode('pending')} className={`px-3 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 transition-all ${filterMode === 'pending' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              Pendientes ({counts.pending})
            </button>
            <button onClick={() => setFilterMode('deferred')} className={`px-3 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 transition-all ${filterMode === 'deferred' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
              Pospuestas ({counts.deferred})
            </button>
            <button onClick={() => setFilterMode('decided')} className={`px-3 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 transition-all ${filterMode === 'decided' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              Resueltas ({counts.decided})
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-blue-900 text-white text-xs px-4 py-2 rounded-full flex items-center justify-between shadow-serene-lg animate-fadeIn">
          <span>{message}</span>
          <Check className="w-3.5 h-3.5 text-blue-300 ml-2" />
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3.5">
        {displayedDecisions.map((dec) => {
          const isDecided = dec.status === 'decided';
          const isDeferred = dec.status === 'deferred';

          return (
            <article key={dec.id} className={`bg-white rounded-3xl p-4.5 shadow-serene border transition-all ${
              isDecided ? 'border-emerald-200 bg-emerald-50/20' : 
              isDeferred ? 'border-amber-200 bg-amber-50/20' : 
              'border-blue-100/80 hover:shadow-serene-lg'
            }`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full ${
                  isDecided ? 'text-emerald-800 bg-emerald-100' : 
                  isDeferred ? 'text-amber-800 bg-amber-100' : 
                  'text-blue-800 bg-blue-50 border border-blue-100'
                }`}>
                  {isDecided ? <CheckCircle2 className="w-3 h-3" /> : 
                   isDeferred ? <Clock className="w-3 h-3" /> : 
                   <Calendar className="w-3 h-3" />}
                  {isDecided ? 'Resuelta' : isDeferred ? `Pospuesta al: ${dec.reviewDate}` : `Revisión: ${dec.reviewDate}`}
                </span>
                <span className="text-[10px] text-slate-400">{new Date(dec.createdAt).toLocaleDateString()}</span>
              </div>

              <h3 className="text-sm font-bold text-blue-950 font-theme-title mb-2.5 leading-snug">{dec.title}</h3>

              <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/60 mb-3 space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">Motivo pausa</span>
                  <p className="text-slate-700 leading-relaxed">{dec.reason}</p>
                </div>
                <div className="pt-2 border-t border-blue-100/60">
                  <span className="font-bold text-blue-700 text-[10px] uppercase tracking-wider block mb-0.5">Criterio</span>
                  <p className="text-blue-950 font-semibold leading-relaxed">{dec.criteria}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => handleDiscard(dec.id)} className="text-xs font-medium text-slate-500 hover:text-red-600 py-2 px-2.5 rounded-full bg-slate-50 transition-colors">
                  Descartar
                </button>

                {!isDecided ? (
                  <>
                    <button onClick={() => handlePostpone(dec.id)} className="text-xs font-semibold text-slate-700 py-2 px-2.5 rounded-full bg-slate-100 hover:bg-amber-100 hover:text-amber-800 transition-colors">
                      Posponer 1m
                    </button>
                    <button onClick={() => handleDecideNow(dec.id)} className="text-xs font-semibold text-white py-2 px-2.5 rounded-full bg-blue-600 hover:bg-blue-700 shadow-serene-sm transition-all">
                      Decidir hoy
                    </button>
                  </>
                ) : (
                  <div className="col-span-2 flex justify-end items-center text-xs text-emerald-700 font-semibold pr-2">
                    ✓ Resuelto y archivado
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {displayedDecisions.length === 0 && (
          <div className="text-center py-10 px-4 bg-white rounded-3xl border border-blue-100 shadow-serene">
            <Archive className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-500">Nada que mostrar aquí</p>
          </div>
        )}
      </div>
    </div>
  );
}
