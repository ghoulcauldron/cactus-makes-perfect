// apps/admin/components/ManageUnitModal.tsx
import React, { useState } from "react";
import { apiFetch } from "../api/client";
import { XMarkIcon, UserMinusIcon, CheckIcon } from '@heroicons/react/20/solid';

// --- Helper: Styled Confirmation Modal ---
function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = "Confirm", isDangerous = false }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
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

export default function ManageUnitModal({ unit, onClose, onSuccess }: { unit: any; onClose: () => void; onSuccess: () => void }) {
  const [label, setLabel] = useState(unit.label);
  const [capacity, setCapacity] = useState(unit.capacity || 2);
  const [loading, setLoading] = useState(false);
  
  // Track guest pending unassignment
  const [pendingUnassign, setPendingUnassign] = useState<any | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch(`/admin/lodging/units/${unit.id}`, {
        method: "PATCH",
        body: JSON.stringify({ label, capacity }),
      });
      onSuccess();
    } catch (err) { alert("Update failed."); }
    finally { setLoading(false); }
  };

  const executeUnassign = async () => {
    if (!pendingUnassign) return;
    try {
      await apiFetch("/admin/lodging/assign", {
        method: "PATCH",
        body: JSON.stringify({ guest_ids: [pendingUnassign.id], unit_id: null }),
      });
      setPendingUnassign(null);
      onSuccess();
    } catch (err) { 
      alert("Unassign failed."); 
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono text-[#45CC2D]">
      <div className="w-full max-w-md border-2 border-[#45CC2D] bg-black shadow-2xl overflow-hidden">
        <div className="bg-[#45CC2D] px-4 py-2 flex justify-between items-center text-black font-bold uppercase text-xs">
          <span>Manage Unit: {unit.label}</span>
          <button onClick={onClose}><XMarkIcon className="h-5 w-5" /></button>
        </div>
        
        <form onSubmit={handleUpdate} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] uppercase font-bold opacity-60">Unit Label</label>
              <input value={label} onChange={e => setLabel(e.target.value)} className="w-full bg-neutral-900 border border-[#45CC2D]/30 p-2 text-xs outline-none focus:border-[#45CC2D]" />
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold opacity-60">Capacity</label>
              <input type="number" value={capacity} onChange={e => setCapacity(parseInt(e.target.value))} className="w-full bg-neutral-900 border border-[#45CC2D]/30 p-2 text-xs outline-none focus:border-[#45CC2D]" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] uppercase font-bold opacity-60">Deployed Hardware ({unit.guests?.length || 0})</label>
            <div className="space-y-1">
              {unit.guests?.map((g: any) => (
                <div key={g.id} className="flex justify-between items-center bg-neutral-900 p-2 border border-[#45CC2D]/10">
                  <span className="text-[10px] font-bold">{g.first_name} {g.last_name}</span>
                  <button 
                    type="button" 
                    onClick={() => setPendingUnassign(g)} 
                    className="text-red-500 hover:bg-red-500 hover:text-black p-1 transition-all border border-red-500/20"
                  >
                    <UserMinusIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {(!unit.guests || unit.guests.length === 0) && <div className="text-[10px] opacity-30 italic">No guests deployed to this unit.</div>}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#45CC2D]/20">
            <button type="button" onClick={onClose} className="text-[10px] font-bold uppercase opacity-50 hover:opacity-100">Cancel</button>
            <button disabled={loading} type="submit" className="bg-[#45CC2D] text-black px-6 py-2 text-xs font-bold uppercase flex items-center gap-2">
              <CheckIcon className="h-4 w-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* UNASSIGNMENT CONFIRMATION */}
      <ConfirmationModal 
        isOpen={!!pendingUnassign}
        title="Sever Assignment"
        message={`Confirming removal of "${pendingUnassign?.first_name} ${pendingUnassign?.last_name}" from ${unit.label}. Guest hardware will be returned to unassigned inventory.`}
        confirmLabel="Sever Link"
        isDangerous={true}
        onCancel={() => setPendingUnassign(null)}
        onConfirm={executeUnassign}
      />
    </div>
  );
}