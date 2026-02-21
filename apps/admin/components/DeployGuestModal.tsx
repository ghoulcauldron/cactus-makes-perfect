import React, { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';

export default function DeployGuestModal({ unitId, unitLabel, onClose, onSuccess }: any) {
  const [guests, setGuests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await apiFetch("/admin/lodging/eligible-guests");
      setGuests(data.guests || []);
      setLoading(false);
    })();
  }, []);

  const handleDeploy = async (guestId: string) => {
    try {
      await apiFetch("/admin/lodging/assign", {
        method: "PATCH",
        body: JSON.stringify({ guest_ids: [guestId], unit_id: unitId }),
      });
      onSuccess();
    } catch (err) {
      alert("DEPLOYMENT FAILED");
    }
  };

  const filtered = guests.filter(g => 
    `${g.first_name} ${g.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="w-full max-w-md border-2 border-[#45CC2D] bg-black shadow-2xl overflow-hidden h-[500px] flex flex-col">
        <div className="bg-[#45CC2D] px-4 py-2 flex justify-between items-center text-black font-bold uppercase text-xs">
          <span>Deploy to: {unitLabel}</span>
          <button onClick={onClose}><XMarkIcon className="h-4 w-4" /></button>
        </div>
        <div className="p-4 border-b border-[#45CC2D]/20">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-[#45CC2D]/40" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-neutral-900 border border-[#45CC2D]/40 text-[#45CC2D] pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-[#45CC2D] outline-none" placeholder="SEARCH ELIGIBLE GUESTS..." />
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {loading ? (
            <div className="text-center p-8 text-[#45CC2D] animate-pulse text-xs uppercase">Scanning database...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-8 text-[#45CC2D]/40 text-xs uppercase">No unassigned guests detected</div>
          ) : (
            filtered.map(g => (
              <div key={g.id} className="p-3 border border-[#45CC2D]/20 mb-2 flex justify-between items-center hover:bg-[#45CC2D]/5 transition-colors">
                <div>
                  <div className="text-xs font-bold text-[#45CC2D] uppercase">{g.first_name} {g.last_name}</div>
                  <div className="text-[10px] text-[#45CC2D]/50 uppercase">{g.rsvp_status}</div>
                </div>
                <button onClick={() => handleDeploy(g.id)} className="border border-[#45CC2D] text-[#45CC2D] px-3 py-1 text-[10px] font-bold uppercase hover:bg-[#45CC2D] hover:text-black">Assign</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}