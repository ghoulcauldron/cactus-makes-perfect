import React, { useState } from "react";
import GuestList from "./components/GuestList";

// Placeholder for future Lodging logic
function LodgingManager() {
  return (
    <div className="p-12 text-primary font-mono flex flex-col items-center justify-center h-full space-y-4 opacity-60">
      <div className="text-2xl tracking-[0.2em] uppercase animate-pulse text-[#45CC2D]">Scanning Lodging Coordinates...</div>
      <div className="text-[10px] border border-[#45CC2D]/40 px-4 py-1 uppercase tracking-widest bg-black text-[#45CC2D]">
        Phase: Deployment Grid Alpha // awaiting AVATAR hydration
      </div>
    </div>
  );
}

type Tab = "GUESTS" | "LODGING";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("GUESTS");

  return (
    <div className="flex flex-col h-screen sm:h-dvh bg-surface text-primary font-mono border-4 border-primary overflow-hidden relative">
      {/* GLOBAL HEADER */}
      <div className="shrink-0 px-3 py-1 border-b border-primary bg-surface uppercase tracking-widest text-sm w-full z-40">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-8">
            <span className="truncate mr-2 font-bold text-[#45CC2D]">CACTUS MAKES PERFECT - AREA 51</span>
            
            {/* TAB NAVIGATOR */}
            <nav className="flex gap-4">
              {(["GUESTS", "LODGING"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-0.5 text-[10px] font-bold border transition-all ${
                    activeTab === tab 
                      ? "bg-[#45CC2D] text-black border-[#45CC2D]" 
                      : "text-[#45CC2D]/40 border-transparent hover:border-[#45CC2D]/40 hover:text-[#45CC2D]"
                  }`}
                >
                  {tab === "GUESTS" ? "GUEST LIST" : "LODGING MGMT"}
                </button>
              ))}
            </nav>
          </div>

          <button 
            className="shrink-0 px-2 py-0.5 border border-primary text-primary hover:bg-[#9ae68c] hover:text-surface transition-colors text-xs" 
            onClick={() => { localStorage.removeItem("admin_token"); window.location.href = "/login"; }}
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* VIEW CONTROLLER */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "GUESTS" && <GuestList />}
        {activeTab === "LODGING" && <LodgingManager />}
      </div>
    </div>
  );
}