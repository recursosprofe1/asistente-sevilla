import React from 'react';
import { Sun, Compass, Home, ShoppingBag, Scale } from 'lucide-react';
import { 
  SereneCompass, 
  SereneDrop, 
  ZenStones, 
  SereneScale, 
  GentleStar 
} from './illustrations/MeditoVectors';

export const TABS = [
  { id: 'hoy', label: 'Hoy', icon: Sun },
  { id: 'planes', label: 'Planes', icon: Compass },
  { id: 'casa', label: 'Casa', icon: Home, disabled: true },
  { id: 'compras', label: 'Compras', icon: ShoppingBag, disabled: true },
  { id: 'decisiones', label: 'Decisiones', icon: Scale, disabled: true },
];

export default function BottomNavigation({ activeTab, onSelectTab }) {
  return (
    <nav
      aria-label="Navegación principal"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto px-3 pt-1 pointer-events-none"
    >
      <div className="pointer-events-auto bg-white/95 backdrop-blur-lg border border-blue-100/90 rounded-full shadow-serene-lg px-2 py-1.5 transition-all">
        <div className="grid grid-cols-5 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
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
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'text-blue-600 font-bold'
                    : isDisabled 
                      ? 'text-slate-300 cursor-not-allowed grayscale opacity-50'
                      : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                    isActive ? 'bg-blue-600 text-white shadow-serene-sm scale-105' : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-200 stroke-[2.2]`} />
                </div>
                <span className={`text-[10px] mt-0.5 tracking-tight transition-colors ${isActive ? 'font-bold text-blue-900' : 'font-medium'}`}>
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
