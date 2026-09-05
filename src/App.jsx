import React, { useState, useEffect } from "react";
import { db, initializeDatabase } from "./db";
import BottomNavigation from "./components/BottomNavigation";
import HoyTab from "./components/tabs/HoyTab";
import PlanesTab from "./components/tabs/PlanesTab";
import CasaTab from "./components/tabs/CasaTab";
import ComprasTab from "./components/tabs/ComprasTab";
import DecisionesTab from "./components/tabs/DecisionesTab";

import { FBadge } from "./components/illustrations/FlatBadges";

// ── Icono de la app: brújula maciza ───────────────────
function AppIcon({ size = 32 }) {
  return <FBadge name="brujula" color="#0E7E8C" size={size} />;
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
    <div className="min-h-screen bg-conn-aqua font-theme-body text-conn-deep flex justify-center selection:bg-conn-mist">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-conn-aqua relative" style={{ boxShadow: '0 0 40px -18px rgba(10, 91, 102, 0.25)' }}>

        {/* ── Top bar ──── */}
        <header
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)' }}
          className="flex items-center justify-between px-5 pb-2 flex-shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <AppIcon />
            <div className="leading-none">
              <p className="text-[9px] font-extrabold text-conn-muted uppercase tracking-widest">Asistente</p>
              <p className="text-base font-black text-conn-deep">Sevilla</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-conn-tealDark text-xs"
            style={{ boxShadow: '0 6px 14px -6px rgba(10, 91, 102, 0.35)' }}>
            S
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
