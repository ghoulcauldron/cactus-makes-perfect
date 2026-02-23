// apps/admin/components/LodgingManager.tsx
import React, { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../api/client";
import { 
  PlusIcon, MapPinIcon, HomeIcon, UserPlusIcon, MapIcon, 
  BuildingOfficeIcon, XMarkIcon, PencilSquareIcon, UserGroupIcon,
  MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon, UserMinusIcon,
  ArchiveBoxIcon // Added for mobile toggle visual
} from '@heroicons/react/20/solid';
import HydrateLocationModal from "./HydrateLocationModal";
import AddUnitModal from "./AddUnitModal";
import DeployGuestModal from "./DeployGuestModal";
import AssignToUnitModal from "./AssignToUnitModal";
import ManageUnitModal from "./ManageUnitModal";

// --- 1. Reusable Confirmation Modal (Preserved exactly) ---
function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = "Confirm", isDangerous = false }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm border-2 border-[#45CC2D] bg-black shadow-2xl overflow-hidden font-mono">
        <div className="px-5 py-4 border-b border-[#45CC2D]/30 bg-neutral-900/50">
          <h2 className={`text-sm font-bold uppercase tracking-wider ${isDangerous ? 'text-red-500' : 'text-[#45CC2D]'}`}>{title}</h2>
        </div>
        <div className="p-6">
          <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-tight">{message}</p>
        </div>
        <div className="px-5 py-4 border-t border-gray-900 bg-neutral-900/30 flex justify-end gap-4">
          <button onClick={onCancel} className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Abort</button>
          <button 
            onClick={onConfirm} 
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all text-black ${isDangerous ? 'bg-red-500 hover:bg-red-400' : 'bg-[#45CC2D] hover:bg-[#3bb325]'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LodgingManager() {
  const [locations, setLocations] = useState<any[]>([]);
  const [eligibleGuests, setEligibleGuests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New: Mobile Sidebar Toggle
  
  // Modals / Selection States (Preserved)
  const [showHydrateModal, setShowHydrateModal] = useState(false);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [activeUnit, setActiveUnit] = useState<{id: string, label: string} | null>(null);
  const [activeGuest, setActiveGuest] = useState<any | null>(null);
  const [manageUnit, setManageUnit] = useState<any | null>(null);
  const [unassignedCollapsed, setUnassignedCollapsed] = useState(false);
  const [assignedCollapsed, setAssignedCollapsed] = useState(false);
  const [pendingDeleteLocation, setPendingDeleteLocation] = useState<any | null>(null);

  async function refreshData() {
    try {
      const [lodgingData, guestData] = await Promise.all([
        apiFetch("/admin/lodging"),
        apiFetch("/admin/lodging/eligible-guests")
      ]);
      setLocations(lodgingData.locations || []);
      setEligibleGuests(guestData.guests || []);
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshData(); }, []);

  // -- Data Processing Memos (Preserved) --
  const filteredEligibleGuests = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return eligibleGuests;
    return eligibleGuests.filter(g => 
      g.first_name?.toLowerCase().includes(query) || 
      g.last_name?.toLowerCase().includes(query) ||
      g.email?.toLowerCase().includes(query)
    );
  }, [eligibleGuests, searchQuery]);

  const assignedGuests = useMemo(() => {
    const list: any[] = [];
    locations.forEach(loc => {
      loc.units?.forEach((unit: any) => {
        unit.guests?.forEach((g: any) => {
          list.push({ ...g, unit_label: unit.label, unit_id: unit.id, location_name: loc.name });
        });
      });
    });
    return list;
  }, [locations]);

  const filteredAssignedGuests = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return assignedGuests;
    return assignedGuests.filter(g => 
      g.first_name?.toLowerCase().includes(query) || 
      g.last_name?.toLowerCase().includes(query)
    );
  }, [assignedGuests, searchQuery]);

  if (loading) return <div className="p-12 text-[#45CC2D] font-mono animate-pulse uppercase tracking-widest text-center">Initializing Deployment Grid...</div>;

  return (
    <div className="h-full w-full max-w-full flex bg-black overflow-hidden font-mono text-[#45CC2D] relative">
      
      {/* MAIN GRID AREA - Responsive padding and scroll behavior */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 space-y-8 scrollbar-hide">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#45CC2D]/30 pb-6 shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tighter uppercase leading-none truncate">Lodging Deployment</h2>
            <p className="text-[10px] opacity-60 uppercase font-bold mt-2 tracking-widest">System Grid: Assignment Matrix</p>
          </div>
          <button onClick={() => setShowHydrateModal(true)} className="flex items-center gap-2 border border-[#45CC2D] px-4 py-1.5 text-[10px] font-bold uppercase hover:bg-[#45CC2D] hover:text-black transition-all shadow-[0_0_15px_rgba(69,204,45,0.2)] shrink-0">
            <MapIcon className="h-4 w-4" /> Hydrate Location
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
          {locations.map((loc) => (
            <div key={loc.id} className="border border-[#45CC2D]/60 bg-neutral-900/10 p-4 space-y-4 overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex gap-3 min-w-0 w-full">
                  <MapPinIcon className="h-5 w-5 text-[#45CC2D] shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[#45CC2D] uppercase leading-tight truncate text-lg tracking-tight">{loc.name}</h3>
                    <p className="text-[10px] text-[#45CC2D]/50 mt-1 truncate uppercase">{loc.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t border-[#45CC2D]/10 md:border-none pt-3 md:pt-0">
                  <button onClick={async (e) => { e.stopPropagation(); const newName = window.prompt("RENAME LOCATION:", loc.name); if (newName && newName !== loc.name) { await apiFetch(`/admin/lodging/locations/${loc.id}`, { method: 'PATCH', body: JSON.stringify({ name: newName }) }); refreshData(); } }} className="text-[#45CC2D] hover:bg-[#45CC2D] hover:text-black border border-[#45CC2D]/30 p-1.5 transition-all"><PencilSquareIcon className="h-3.5 w-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setPendingDeleteLocation(loc); }} className="text-red-500 hover:bg-red-500 hover:text-black border border-red-500/30 p-1.5 transition-all"><XMarkIcon className="h-3.5 w-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setActiveLocationId(loc.id); }} className="text-[9px] font-bold uppercase text-[#45CC2D] border border-[#45CC2D] px-3 py-1.5 hover:bg-[#45CC2D] hover:text-black transition-all whitespace-nowrap">+ Add Unit</button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#45CC2D]/20">
                {loc.units?.map((unit: any) => (
                  <div key={unit.id} className="bg-black/40 border border-[#45CC2D]/30 p-3 flex justify-between items-center group hover:border-[#45CC2D] transition-all cursor-pointer" onClick={() => setManageUnit(unit)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <BuildingOfficeIcon className="h-4 w-4 opacity-40 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold uppercase">{unit.label}</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {unit.guests?.map((g: any) => (
                            <span key={g.id} className="text-[8px] bg-[#45CC2D] text-black px-1.5 py-0.5 font-bold uppercase">{g.first_name} {g.last_name[0]}.</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] opacity-40 font-bold">{unit.guests?.length || 0}/{unit.capacity}</span>
                      <button onClick={(e) => { e.stopPropagation(); setActiveUnit({id: unit.id, label: unit.label}); }} className="p-1.5 hover:bg-[#45CC2D] hover:text-black border border-[#45CC2D]/40 transition-all shadow-sm"><UserPlusIcon className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]" onClick={() => setIsSidebarOpen(false)} />}

      {/* RESPONSIVE SIDEBAR */}
      <div className={`fixed inset-y-0 right-0 z-[60] w-[85vw] sm:w-[400px] lg:static lg:w-80 lg:z-auto transform transition-transform duration-300 ease-in-out bg-black border-l border-[#45CC2D]/30 flex flex-col shrink-0 ${isSidebarOpen ? 'translate-x-0 shadow-[-20px_0_40px_rgba(0,0,0,0.8)]' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-[#45CC2D]/30 bg-[#45CC2D] text-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Inventory</span>
          </div>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}><XMarkIcon className="h-5 w-5" /></button>
        </div>

        <div className="p-2 bg-black/40 border-b border-[#45CC2D]/20 shrink-0">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#45CC2D]/40" />
            <input type="text" placeholder="FILTER..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-neutral-900/50 border border-[#45CC2D]/30 pl-8 pr-8 py-2 text-[10px] text-[#45CC2D] outline-none uppercase tracking-widest transition-all" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="border-b border-[#45CC2D]/10">
            <button onClick={() => setUnassignedCollapsed(!unassignedCollapsed)} className="w-full p-3 bg-black/20 flex items-center justify-between hover:bg-[#45CC2D]/5 transition-colors">
              <div className="flex items-center gap-2">{unassignedCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}<span className="text-[10px] font-bold uppercase tracking-widest">Unassigned ({eligibleGuests.length})</span></div>
            </button>
            {!unassignedCollapsed && (
              <div className="p-2 space-y-2">
                {filteredEligibleGuests.map(g => (
                  <div key={g.id} onClick={() => { setActiveGuest(g); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className="p-3 border border-[#45CC2D]/20 bg-black/40 hover:border-[#45CC2D] transition-all group cursor-pointer">
                    <div className="flex justify-between items-start"><div className="text-xs font-bold uppercase">{g.first_name} {g.last_name}</div><UserPlusIcon className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                    <div className="text-[8px] border border-[#45CC2D]/30 inline-block px-1.5 py-0.5 mt-2 uppercase tracking-widest opacity-40">Ready</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-b border-[#45CC2D]/10">
            <button onClick={() => setAssignedCollapsed(!assignedCollapsed)} className="w-full p-3 bg-black/20 flex items-center justify-between hover:bg-[#45CC2D]/5 transition-colors">
              <div className="flex items-center gap-2">{assignedCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}<span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Deployed ({assignedGuests.length})</span></div>
            </button>
            {!assignedCollapsed && (
              <div className="p-2 space-y-2 bg-[#45CC2D]/5">
                {filteredAssignedGuests.map(g => (
                  <div key={g.id} onClick={() => { setActiveGuest(g); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className="p-3 border border-[#45CC2D]/10 bg-black/60 hover:border-[#45CC2D] transition-all group cursor-pointer">
                    <div className="flex justify-between items-start"><div className="text-xs font-bold uppercase text-white/90">{g.first_name} {g.last_name}</div><PencilSquareIcon className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                    <div className="text-[8px] mt-1 uppercase opacity-50 font-bold truncate">{g.location_name} // {g.unit_label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING ACTION BUTTON */}
      <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden fixed bottom-6 right-6 z-[40] bg-[#45CC2D] text-black p-4 rounded-full shadow-[0_0_20px_rgba(69,204,45,0.4)] active:scale-95 transition-all">
        <UserGroupIcon className="h-6 w-6" />
        {eligibleGuests.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">{eligibleGuests.length}</span>}
      </button>

      {/* MODAL MATRIX (Preserved exactly as working version) */}
      {showHydrateModal && <HydrateLocationModal onClose={() => setShowHydrateModal(false)} onSuccess={() => { setShowHydrateModal(false); refreshData(); }} />}
      {activeLocationId && <AddUnitModal locationId={activeLocationId} onClose={() => setActiveLocationId(null)} onSuccess={() => { setActiveLocationId(null); refreshData(); }} />}
      {activeUnit && <DeployGuestModal unitId={activeUnit.id} unitLabel={activeUnit.label} onClose={() => setActiveUnit(null)} onSuccess={() => { setActiveUnit(null); refreshData(); }} />}
      {activeGuest && <AssignToUnitModal guest={activeGuest} locations={locations} onClose={() => setActiveGuest(null)} onSuccess={() => { setActiveGuest(null); refreshData(); }} />}
      {manageUnit && <ManageUnitModal unit={manageUnit} onClose={() => setManageUnit(null)} onSuccess={() => { setManageUnit(null); refreshData(); }} />}
      <ConfirmationModal 
        isOpen={!!pendingDeleteLocation}
        title="Purge Location"
        message={`DANGER: You are about to permanently delete "${pendingDeleteLocation?.name}" and all associated units. This action cannot be reversed.`}
        confirmLabel="Purge Node"
        isDangerous={true}
        onCancel={() => setPendingDeleteLocation(null)}
        onConfirm={async () => { try { await apiFetch(`/admin/lodging/locations/${pendingDeleteLocation.id}`, { method: 'DELETE' }); setPendingDeleteLocation(null); await refreshData(); } catch (err) { alert("Delete failed."); } }}
      />
    </div>
  );
}