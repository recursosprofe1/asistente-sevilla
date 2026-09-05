import React, { useState, useEffect } from 'react';
import { 
  Wind, 
  Sparkles, 
  Flame, 
  BedDouble, 
  FileCheck, 
  HeartPulse, 
  Wrench,
  Layers,
  Check,
  Plus,
  ChevronDown
} from 'lucide-react';
import { SereneDrop } from '../illustrations/MeditoVectors';
import { HeaderVectorCasa } from '../illustrations/AreaHeaderVectors';
import { db, toggleTaskActive, markTaskDone } from '../../db';

const ICON_MAP = {
  'task-filtros-clima': Wind,
  'task-electrodomesticos': Sparkles,
  'task-radiadores': Flame,
  'task-colchones': BedDouble,
  'task-botiquin': HeartPulse,
  'task-ventanas-burletes': Layers,
  'task-contratos-luz': FileCheck
};

const CATEGORIES = [
  { id: 'estacional', title: 'Mantenimiento Estacional', desc: 'Clima, ventanas y tareas por temporada', icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'limpieza', title: 'Limpieza Profunda', desc: 'Electrodomésticos, desagües y juntas', icon: Sparkles, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'seguridad', title: 'Seguridad y Revisiones', desc: 'Suministros, botiquín y prevención', icon: FileCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

export default function CasaTab() {
  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'active'
  const [expandedCats, setExpandedCats] = useState({
    estacional: true,
    limpieza: true,
    seguridad: true
  });
  const [toast, setToast] = useState('');

  // Cargar tareas desde Dexie
  const loadTasksFromDb = async () => {
    try {
      const stored = await db.tasks.toArray();
      setTasks(stored);
    } catch (e) {
      console.error('Error cargando tareas de Dexie:', e);
    }
  };

  useEffect(() => {
    loadTasksFromDb();
  }, []);

  const toggleCategory = (catId) => {
    setExpandedCats((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleToggleTask = async (task) => {
    const updatedState = await toggleTaskActive(task.id);
    await loadTasksFromDb();

    const msg = updatedState
      ? `"${task.title}" activada en tu plan`
      : `"${task.title}" pausada`;
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleMarkDone = async (task) => {
    await markTaskDone(task.id);
    await loadTasksFromDb();
    setToast(`"${task.title}" completada`);
    setTimeout(() => setToast(''), 2500);
  };

  const activeTasks = tasks.filter((t) => t.active);
  const tasksToDisplay = viewMode === 'active' ? activeTasks : tasks;

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Cabecera Sereno */}
      <div className="bg-white rounded-3xl p-4.5 shadow-serene border border-blue-100/80 transition-all relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-serene-sm">
              <SereneDrop className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-blue-950 font-theme-title leading-tight">
                Módulo Hogar
              </h2>
              <p className="text-[11px] text-slate-500">Catálogo preconfigurado</p>
            </div>
          </div>
          <HeaderVectorCasa className="w-20 h-14 opacity-95 flex-shrink-0" />
        </div>

        <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
          Haz clic en <span className="font-bold text-blue-700">'Activar en mi plan'</span> en las tareas domésticas que apliquen a tu vivienda para crear tu propia rutina.
        </p>

        {/* Filtros */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                viewMode === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Catálogo completo ({tasks.length})
            </button>
            <button
              onClick={() => setViewMode('active')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                viewMode === 'active'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Mi plan activo ({activeTasks.length})
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="bg-blue-900 text-white text-xs px-4 py-2 rounded-full flex items-center justify-between shadow-serene-lg animate-fadeIn">
          <span>{toast}</span>
          <Check className="w-3.5 h-3.5 text-blue-300 ml-2" />
        </div>
      )}

      {/* Categorías y Tareas */}
      <div className="space-y-3.5">
        {CATEGORIES.map((cat) => {
          const catTasks = tasksToDisplay.filter((t) => t.category === cat.id);
          const isExpanded = !!expandedCats[cat.id];
          const activeInCat = tasks.filter((t) => t.category === cat.id && t.active).length;
          const totalInCat = tasks.filter((t) => t.category === cat.id).length;
          const CatIcon = cat.icon;

          if (catTasks.length === 0 && viewMode === 'active') return null;

          return (
            <section
              key={cat.id}
              className="bg-white rounded-3xl shadow-serene border border-blue-100/80 overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-blue-50/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl ${cat.bg} flex items-center justify-center ${cat.color}`}>
                    <CatIcon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-blue-950 font-theme-title leading-tight">
                      {cat.title}
                    </h3>
                    <p className="text-[10px] text-slate-400">{cat.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {activeInCat} / {totalInCat} activas
                  </span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-slate-400 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180 text-blue-600 bg-blue-50' : ''
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 pt-1 space-y-3 border-t border-slate-100 bg-[#FBFDFF]">
                  {catTasks.map((task) => {
                    const TaskIcon = ICON_MAP[task.id] || SereneDrop;
                    const isDoneToday = task.lastDoneAt && (
                      new Date(task.lastDoneAt).toDateString() === new Date().toDateString()
                    );

                    return (
                      <article
                        key={task.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          task.active
                            ? 'bg-white border-blue-300 shadow-serene-sm ring-1 ring-blue-100'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 mb-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            task.active ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-400'
                          }`}>
                            <TaskIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-blue-950 leading-snug">
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                {task.season}
                              </span>
                              <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {task.frequency}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed mb-3 pl-9.5">
                          {task.description}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs pl-2">
                          <span className="text-[10px] text-slate-400">
                            ~{task.estimatedMinutes} min
                          </span>
                          <div className="flex items-center gap-2">
                            {task.active && (
                              <button
                                onClick={() => handleMarkDone(task)}
                                className={`text-[11px] px-3 py-1 rounded-full font-medium transition-all ${
                                  isDoneToday
                                    ? 'bg-emerald-100 text-emerald-800 font-semibold'
                                    : 'text-slate-600 bg-slate-100 hover:bg-blue-50'
                                }`}
                              >
                                {isDoneToday ? 'Hecho hoy ✓' : 'Marcar hecho'}
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleTask(task)}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                                task.active
                                  ? 'bg-blue-600 text-white shadow-serene-sm'
                                  : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 shadow-sm'
                              }`}
                            >
                              {task.active ? (
                                <>
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  <span>En mi plan</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3 stroke-[2.5]" />
                                  <span>Activar en mi plan</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
