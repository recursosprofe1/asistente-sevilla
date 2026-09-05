import React from 'react';
import {
  ConnSol, ConnBrujula, ConnCasa, ConnBolsa, ConnBalanza,
} from './illustrations/ConnIcons';

export const TABS = [
  { id: 'hoy', label: 'Hoy', Icon: ConnSol },
  { id: 'planes', label: 'Planes', Icon: ConnBrujula },
  { id: 'casa', label: 'Casa', Icon: ConnCasa, disabled: true },
  { id: 'compras', label: 'Compras', Icon: ConnBolsa, disabled: true },
  { id: 'decisiones', label: 'Decisiones', Icon: ConnBalanza, disabled: true },
];

export default function BottomNavigation({ activeTab, onSelectTab }) {
  return (
    <nav
      aria-label="Navegación principal"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto px-4 pt-1 pointer-events-none"
    >
      <div className="pointer-events-auto bg-white/95 backdrop-blur-lg rounded-[28px] px-3 py-2 transition-all"
        style={{ boxShadow: '0 14px 30px -10px rgba(10, 91, 102, 0.30)' }}>
        <div className="grid grid-cols-5 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.Icon;
            const isActive = activeTab === tab.id;
            const isDisabled = !!tab.disabled;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (!isDisabled) onSelectTab(tab.id);
                }}
                disabled={isDisabled}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Ir a ${tab.label}`}
                className="flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200"
              >
                <div
                  className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-conn-teal text-white scale-105'
                      : isDisabled
                        ? 'bg-slate-100 text-slate-300'
                        : 'bg-conn-mist text-conn-tealDark'
                  }`}
                  style={isActive ? { boxShadow: '0 8px 18px -6px rgba(18, 165, 181, 0.55)' } : undefined}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-black text-conn-deep' : 'font-bold text-conn-muted'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
