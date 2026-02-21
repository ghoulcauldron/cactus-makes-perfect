import React, { useState } from "react";
import { apiFetch } from "../api/client";
import { XMarkIcon } from '@heroicons/react/20/solid';

export default function AddUnitModal({ locationId, onClose, onSuccess }: any) {
  const [label, setLabel] = useState("");
  const [capacity, setCapacity] = useState(2);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/admin/lodging/units", {
        method: "POST",
        body: JSON.stringify({ location_id: locationId, label, capacity }),
      });
      onSuccess();
    } catch (err) {
      alert("SYSTEM ERROR: Failed to register unit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="w-full max-w-sm border-2 border-[#45CC2D] bg-black shadow-2xl overflow-hidden">
        <div className="bg-[#45CC2D] px-4 py-2 flex justify-between items-center text-black font-bold uppercase text-xs">
          <span>Register New Unit</span>
          <button onClick={onClose}><XMarkIcon className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[10px] text-[#45CC2D] uppercase font-bold">Unit/Room Label</label>
            <input required value={label} onChange={e => setLabel(e.target.value)} className="w-full bg-neutral-900 border border-[#45CC2D]/40 text-[#45CC2D] p-2 text-xs focus:ring-1 focus:ring-[#45CC2D] outline-none" placeholder="E.G. UNIT A / ROOM 302" />
          </div>
          <div>
            <label className="text-[10px] text-[#45CC2D] uppercase font-bold">Hardware Capacity</label>
            <input type="number" value={capacity} onChange={e => setCapacity(parseInt(e.target.value))} className="w-full bg-neutral-900 border border-[#45CC2D]/40 text-[#45CC2D] p-2 text-xs focus:ring-1 focus:ring-[#45CC2D] outline-none" />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-[#45CC2D] text-black py-2 text-xs font-bold uppercase hover:bg-[#3bb325]">{loading ? "REGISTERING..." : "CONFIRM DEPLOYMENT"}</button>
        </form>
      </div>
    </div>
  );
}