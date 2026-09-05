import React, { useState, useEffect } from 'react';
import { FBadge, FGlyph } from '../illustrations/FlatBadges';
import { db, toggleTaskActive, markTaskDone } from '../../db';

const TASK_GLYPH = {
  'task-filtros-clima': 'viento',
  'task-electrodomesticos': 'brillo',
  'task-radiadores': 'fuego',
  'task-colchones': 'cama',
  'task-botiquin': 'cruz',
  'task-ventanas-burletes': 'capas',
  'task-contratos-luz': 'doc'
};

const CATEGORIES = [
  { id: 'estacional', title: 'Mantenimiento Estacional', desc: 'Clima, ventanas y tareas por temporada', glyph: 'hoja', color: '#3A9E70' },
  { id: 'limpieza', title: 'Limpieza Profunda', desc: 'Electrodomésticos, desagües y juntas', glyph: 'brillo', color: '#12A5B5' },
  { id: 'seguridad', title: 'Seguridad y Revisiones', desc: 'Suministros, botiquín y prevención', glyph: 'escudo', color: '#D4860A' },
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
    <div className="space-y-3 pb-28 pt-1">
      {/* Cabecera */}
      <div className="conn-hero px-5 pt-5 pb-4 text-white">
        <div className="flex items-center gap-3">
          <FBadge name="casa" color="#FFFFFF" size={44} />
          <div>
            <h2 className="font-theme-title text-[20px] font-black leading-tight">
              Hogar
            </h2>
            <p className="text-[11px] font-bold text-white/85">Catálogo preconfigurado</p>
          </div>
        </div>
        <p className="text-xs font-semibold text-white/85 mt-3 leading-relaxed">
          Activa las tareas que apliquen a tu vivienda para crear tu propia rutina.
        </p>

        {/* Filtros */}
        <div className="flex items-center gap-1.5 mt-3">
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black min-h-[36px] transition-all ${
              viewMode === 'all' ? 'bg-white text-conn-deep' : 'bg-white/20 text-white'
            }`}
          >
            Catálogo ({tasks.length})
          </button>
          <button
            onClick={() => setViewMode('active')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black min-h-[36px] transition-all ${
              viewMode === 'active' ? 'bg-white text-conn-deep' : 'bg-white/20 text-white'
            }`}
          >
            Mi plan ({activeTasks.length})
          </button>
        </div>
      </div>

      {toast && (
        <div className="bg-conn-deep text-white text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-fadeIn mx-1">
          <FBadge name="check" color="#3A9E70" size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* Categorías y Tareas */}
      <div className="space-y-3">
        {CATEGORIES.map((cat) => {
          const catTasks = tasksToDisplay.filter((t) => t.category === cat.id);
          const isExpanded = !!expandedCats[cat.id];
          const activeInCat = tasks.filter((t) => t.category === cat.id && t.active).length;
          const totalInCat = tasks.filter((t) => t.category === cat.id).length;

          if (catTasks.length === 0 && viewMode === 'active') return null;

          return (
            <section key={cat.id} className="conn-card overflow-hidden transition-all">
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <FBadge name={cat.glyph} color={cat.color} size={40} />
                  <div>
                    <h3 className="font-theme-title text-[15px] font-black text-conn-deep leading-tight">
                      {cat.title}
                    </h3>
                    <p className="text-[10px] font-bold text-conn-muted">{cat.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-conn-mist text-conn-tealDark">
                    {activeInCat}/{totalInCat}
                  </span>
                  <FGlyph name={isExpanded ? "chevronUp" : "chevronDown"} size={14} color="#5E8B91" />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-conn-aqua">
                  {catTasks.map((task) => {
                    const glyph = TASK_GLYPH[task.id] || 'brillo';
                    const isDoneToday = task.lastDoneAt && (
                      new Date(task.lastDoneAt).toDateString() === new Date().toDateString()
                    );

                    return (
                      <article
                        key={task.id}
                        className="p-3.5 rounded-3xl bg-white border border-conn-aqua transition-all"
                        style={{ boxShadow: task.active ? '0 8px 20px -12px rgba(10, 91, 102, 0.30)' : 'none' }}
                      >
                        <div className="flex items-start gap-2.5 mb-2">
                          <FBadge name={glyph} color={task.active ? cat.color : '#CBD5E1'} size={32} />
                          <div className="flex-1">
                            <h4 className="text-xs font-black text-conn-deep leading-snug">
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                              <span className="font-black text-conn-tealDark bg-conn-mist px-2 py-0.5 rounded-full">
                                {task.season}
                              </span>
                              <span className="font-bold text-conn-muted bg-conn-aqua px-2 py-0.5 rounded-full">
                                {task.frequency}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] font-semibold text-conn-muted leading-relaxed mb-3">
                          {task.description}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-conn-aqua text-xs">
                          <span className="text-[10px] font-bold text-conn-muted">
                            ~{task.estimatedMinutes} min
                          </span>
                          <div className="flex items-center gap-2">
                            {task.active && (
                              <button
                                onClick={() => handleMarkDone(task)}
                                className={`text-[11px] px-3 py-1.5 rounded-full font-black transition-all min-h-[36px] ${
                                  isDoneToday
                                    ? 'bg-conn-amberSoft text-conn-deep'
                                    : 'text-conn-tealDark bg-conn-mist'
                                }`}
                              >
                                {isDoneToday ? 'Hecho hoy ✓' : 'Marcar hecho'}
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleTask(task)}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 min-h-[36px] ${
                                task.active
                                  ? 'bg-conn-teal text-white'
                                  : 'bg-conn-amberSoft text-conn-deep'
                              }`}
                            >
                              {task.active ? (
                                <><FGlyph name="check" size={14} color="#FFFFFF" /><span>En mi plan</span></>
                              ) : (
                                <><FGlyph name="plus" size={14} color="#0B3B42" /><span>Activar</span></>
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
