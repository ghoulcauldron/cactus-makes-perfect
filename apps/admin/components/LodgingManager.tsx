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
    <div className="h-full flex flex-col bg-black overflow-auto p-4 sm:p-8 space-y-8">
      {/* HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#45CC2D]/30 pb-6">
        <div>
          <h2 className="text-xl font-bold text-[#45CC2D] tracking-tighter uppercase leading-none">Lodging Deployment</h2>
          <p className="text-[10px] text-[#45CC2D]/60 uppercase font-bold mt-2">Hardware location & unit assignment</p>
        </div>
        <button onClick={() => setShowHydrateModal(true)} className="flex items-center gap-2 border border-[#45CC2D] px-4 py-1.5 text-[10px] font-bold uppercase text-[#45CC2D] hover:bg-[#45CC2D] hover:text-black transition-all shadow-[0_0_15px_rgba(69,204,45,0.2)]">
          <MapIcon className="h-4 w-4" /> Hydrate Location
        </button>
      </div>

      {/* LOCATION GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {locations.length === 0 ? (
          <div className="col-span-full border border-dashed border-[#45CC2D]/20 p-12 text-center text-[#45CC2D]/40 uppercase text-xs">
            No locations detected. Paste your Google Maps link to begin hydration.
          </div>
        ) : (
          locations.map((loc) => (
            <div key={loc.id} className="border border-[#45CC2D] bg-neutral-900/20 p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <MapPinIcon className="h-5 w-5 text-[#45CC2D]" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#45CC2D] uppercase leading-tight truncate text-lg tracking-tight">{loc.name}</h3>
                    <p className="text-[10px] text-[#45CC2D]/50 mt-1 truncate uppercase font-mono">{loc.address}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    {/* EDIT BUTTON */}
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
                              } catch (err) {
                                alert("Rename failed. Check server logs.");
                              }
                            }
                          }}
                          className="text-[#45CC2D] hover:bg-[#45CC2D] hover:text-black border border-[#45CC2D]/30 p-1 transition-all"
                          title="Rename Location"
                        >
                          <PencilSquareIcon className="h-3 w-3" />
                        </button>

                    {/* DELETE LOCATION */}
                    <button 
                      onClick={async () => {
                        if (window.confirm("DANGER: This will delete this location and all assigned units. Proceed?")) {
                          try {
                            await apiFetch(`/admin/lodging/locations/${loc.id}`, { method: 'DELETE' });
                            await refreshLodging(); // Sync the UI
                          } catch (err) {
                            console.error("Delete failed:", err);
                            alert("Delete failed. Check server logs.");
                          }
                        }
                      }}
                      className="text-red-500 hover:bg-red-500 hover:text-black border border-red-500/30 p-1 transition-all"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                <button onClick={() => setActiveLocationId(loc.id)} className="text-[9px] font-bold uppercase text-[#45CC2D] border border-[#45CC2D]/30 px-2 py-1 hover:bg-[#45CC2D] hover:text-black transition-all">
                  + Add Unit
                </button>
              </div>
              </div>
            </div>

              {/* UNIT LIST */}
              <div className="space-y-2 pt-4">
                {loc.units?.map((unit: any) => (
                  <div key={unit.id} className="bg-black border border-[#45CC2D]/30 p-3 flex justify-between items-center group hover:border-[#45CC2D] transition-colors shadow-sm">
                    <div className="flex items-center gap-4">
                      <BuildingOfficeIcon className="h-4 w-4 text-[#45CC2D]/50" />
                      <div>
                        <span className="text-xs font-bold text-[#45CC2D]">{unit.label}</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {unit.guests?.map((g: any) => (
                            <span key={g.id} className="text-[9px] bg-[#45CC2D] text-black px-1.5 py-0.5 font-bold uppercase shadow-sm">
                              {g.first_name} {g.last_name[0]}.
                            </span>
                          ))}
                          {(!unit.guests || unit.guests.length === 0) && (
                            <span className="text-[9px] text-[#45CC2D]/30 italic uppercase">Vacant</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setActiveUnit({id: unit.id, label: unit.label})} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#45CC2D] hover:text-black text-[#45CC2D] transition-all border border-[#45CC2D]/50">
                      <UserPlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {(!loc.units || loc.units.length === 0) && (
                  <div className="text-center p-4 text-[9px] text-[#45CC2D]/30 uppercase border border-dashed border-[#45CC2D]/10">No units registered for this location</div>
                )}
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