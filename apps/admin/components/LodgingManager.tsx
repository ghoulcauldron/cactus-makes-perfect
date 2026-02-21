import React, { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { PlusIcon, MapPinIcon, HomeIcon, UserPlusIcon, MapIcon, BuildingOfficeIcon, XMarkIcon, PencilSquareIcon } from '@heroicons/react/20/solid';
import HydrateLocationModal from "./HydrateLocationModal";
import AddUnitModal from "./AddUnitModal";
import DeployGuestModal from "./DeployGuestModal";

export default function LodgingManager() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHydrateModal, setShowHydrateModal] = useState(false);
  
  // Modal tracking states
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [activeUnit, setActiveUnit] = useState<{id: string, label: string} | null>(null);

  async function refreshLodging() {
    try {
      const data = await apiFetch("/admin/lodging");
      setLocations(data.locations || []);
    } catch (e) {
      console.error("Lodging sync failed", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshLodging(); }, []);

  if (loading) return <div className="p-12 text-[#45CC2D] font-mono animate-pulse uppercase tracking-widest text-center">Initializing Deployment Grid...</div>;

return (
    <div className="h-full w-full max-w-full flex flex-col bg-black overflow-x-hidden p-4 sm:p-8 space-y-8 font-mono">
      {/* HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#45CC2D]/30 pb-6 shrink-0">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[#45CC2D] tracking-tighter uppercase leading-none truncate">Lodging Deployment</h2>
          <p className="text-[10px] text-[#45CC2D]/60 uppercase font-bold mt-2 tracking-widest">System Grid: Location & Unit Assignment</p>
        </div>
        <button onClick={() => setShowHydrateModal(true)} className="flex items-center gap-2 border border-[#45CC2D] px-4 py-1.5 text-[10px] font-bold uppercase text-[#45CC2D] hover:bg-[#45CC2D] hover:text-black transition-all shadow-[0_0_15px_rgba(69,204,45,0.2)] shrink-0">
          <MapIcon className="h-4 w-4" /> Hydrate Location
        </button>
      </div>

      {/* LOCATION GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
        {locations.length === 0 ? (
          <div className="col-span-full border border-dashed border-[#45CC2D]/20 p-12 text-center text-[#45CC2D]/40 uppercase text-xs">
            No active nodes detected. Scan coordinates to begin.
          </div>
        ) : (
          locations.map((loc) => (
            <div key={loc.id} className="border border-[#45CC2D]/60 bg-neutral-900/10 p-4 space-y-4 overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              {/* CARD HEADER - RESPONSIVE STACKING */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex gap-3 min-w-0 w-full">
                  <MapPinIcon className="h-5 w-5 text-[#45CC2D] shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[#45CC2D] uppercase leading-tight truncate text-lg tracking-tight">{loc.name}</h3>
                    <p className="text-[10px] text-[#45CC2D]/50 mt-1 truncate uppercase">{loc.address}</p>
                  </div>
                </div>

                {/* CONTROL BUTTONS - FORCED NO-WRAP OR STACK */}
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t border-[#45CC2D]/10 md:border-none pt-3 md:pt-0">
                  <button 
                    onClick={async () => {
                      const newName = window.prompt("RENAME LOCATION:", loc.name);
                      if (newName && newName !== loc.name) {
                        try {
                          await apiFetch(`/admin/lodging/locations/${loc.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ name: newName })
                          });
                          await refreshLodging();
                        } catch (err) { alert("Rename failed."); }
                      }
                    }}
                    className="text-[#45CC2D] hover:bg-[#45CC2D] hover:text-black border border-[#45CC2D]/30 p-1.5 transition-all"
                    title="Rename"
                  >
                    <PencilSquareIcon className="h-3.5 w-3.5" />
                  </button>

                  <button 
                    onClick={async () => {
                      if (window.confirm("DANGER: This will delete this location and all units. Proceed?")) {
                        try {
                          await apiFetch(`/admin/lodging/locations/${loc.id}`, { method: 'DELETE' });
                          await refreshLodging();
                        } catch (err) { alert("Delete failed."); }
                      }
                    }}
                    className="text-red-500 hover:bg-red-500 hover:text-black border border-red-500/30 p-1.5 transition-all"
                    title="Delete"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>

                  <button 
                    onClick={() => setActiveLocationId(loc.id)} 
                    className="text-[9px] font-bold uppercase text-[#45CC2D] border border-[#45CC2D] px-3 py-1.5 hover:bg-[#45CC2D] hover:text-black transition-all whitespace-nowrap"
                  >
                    + Add Unit
                  </button>
                </div>
              </div>

              {/* UNIT LIST - ENSURE INNER WRAPPING */}
              <div className="space-y-2 pt-2 border-t border-[#45CC2D]/20">
                {loc.units?.map((unit: any) => (
                  <div key={unit.id} className="bg-black/40 border border-[#45CC2D]/30 p-3 flex justify-between items-center group hover:border-[#45CC2D] transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <BuildingOfficeIcon className="h-4 w-4 text-[#45CC2D]/40 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#45CC2D] uppercase">{unit.label}</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {unit.guests?.map((g: any) => (
                            <span key={g.id} className="text-[8px] bg-[#45CC2D] text-black px-1.5 py-0.5 font-bold uppercase">
                              {g.first_name} {g.last_name[0]}.
                            </span>
                          ))}
                          {(!unit.guests || unit.guests.length === 0) && (
                            <span className="text-[8px] text-[#45CC2D]/30 italic uppercase">Vacant</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveUnit({id: unit.id, label: unit.label})} 
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1.5 hover:bg-[#45CC2D] hover:text-black text-[#45CC2D] transition-all border border-[#45CC2D]/40 shrink-0 ml-2"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODALS */}
      {showHydrateModal && <HydrateLocationModal onClose={() => setShowHydrateModal(false)} onSuccess={() => { setShowHydrateModal(false); refreshLodging(); }} />}
      {activeLocationId && <AddUnitModal locationId={activeLocationId} onClose={() => setActiveLocationId(null)} onSuccess={() => { setActiveLocationId(null); refreshLodging(); }} />}
      {activeUnit && <DeployGuestModal unitId={activeUnit.id} unitLabel={activeUnit.label} onClose={() => setActiveUnit(null)} onSuccess={() => { setActiveUnit(null); refreshLodging(); }} />}
    </div>
  );
}