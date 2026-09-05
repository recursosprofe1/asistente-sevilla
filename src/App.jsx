import React, { useState, useEffect } from "react";
import { db, initializeDatabase } from "./db";
import BottomNavigation from "./components/BottomNavigation";
import HoyTab from "./components/tabs/HoyTab";
import PlanesTab from "./components/tabs/PlanesTab";
import CasaTab from "./components/tabs/CasaTab";
import ComprasTab from "./components/tabs/ComprasTab";
import DecisionesTab from "./components/tabs/DecisionesTab";

// ── Icono de la app: brujula / blob azul ─────────────────────
function AppIcon({ className = "w-8 h-8" }) {
  return (
    <svg className={className} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M26 4C33 6.5 39.5 13 40.5 21C41.5 29 37 38 29 41C21 44 10.5 40 5.5 33C0.5 26 2 14.5 7.5 8.5C13 2.5 19 1.5 26 4Z" fill="#3B82F6"/>
      <circle cx="22" cy="22" r="9" stroke="white" strokeWidth="2"/>
      <path d="M25.5 18.5l-3 6-6 3 3-6 6-3z" fill="white"/>
      <circle cx="22" cy="22" r="1.8" fill="#3B82F6"/>
    </svg>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("hoy");
  const [travelMinutes, setTravelMinutes] = useState(45);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
        const savedTravel = await db.preferences.get("maxTravelMinutes");
        if (savedTravel && savedTravel.value) {
          setTravelMinutes(savedTravel.value);
        }
      } catch (e) {
        console.error("Error inicializando Dexie:", e);
      } finally {
        setIsDbLoaded(true);
      }
    }
    init();
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-theme-body text-slate-900 flex justify-center selection:bg-blue-200">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-[#F0F4F8] relative border-x border-slate-200/60 shadow-2xl shadow-blue-950/5">

        {/* ── Top bar: icono de la app (con safe area top) ──── */}
        <header
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)' }}
          className="flex items-center justify-between px-5 pb-2 flex-shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <AppIcon />
            <div className="leading-none">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Asistente</p>
              <p className="text-base font-black text-slate-900">Sevilla</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <span className="text-xs font-black text-blue-600">S</span>
          </div>
        </header>

        {/* ── Pestañas de Contenido ────────────────────── */}
        <main className="flex-1 px-4 pt-3 pb-8 overflow-y-auto">
          {!isDbLoaded ? (
            <div className="text-center py-16 px-4" role="status" aria-live="polite">
              <p className="text-sm font-semibold text-slate-400">Preparando tu asistente…</p>
              <p className="text-xs text-slate-400 mt-1">Cargando base local</p>
            </div>
          ) : (
            <>
              {activeTab === "hoy" && (
                <HoyTab
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  travelMinutes={travelMinutes}
                />
              )}
              {activeTab === "planes" && (
                <PlanesTab
                  travelMinutes={travelMinutes}
                  setTravelMinutes={setTravelMinutes}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === "casa" && <CasaTab />}
              {activeTab === "compras" && <ComprasTab />}
              {activeTab === "decisiones" && <DecisionesTab />}
            </>
          )}
        </main>

        {/* ── Navegación inferior ───────────────────────── */}
        <BottomNavigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
      </div>
    </div>
  );
}
