// apps/admin/components/AssignToUnitModal.tsx
import React from "react";
import { apiFetch } from "../api/client";
import { XMarkIcon, MapPinIcon, BuildingOfficeIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

// --- Helper: Styled Confirmation Modal ---
function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = "Confirm" }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm border-2 border-[#45CC2D] bg-black shadow-2xl overflow-hidden font-mono">
        <div className="px-5 py-4 border-b border-[#45CC2D]/30 bg-neutral-900/50">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#45CC2D]">{title}</h2>
        </div>
        <div className="p-6">
          <div className="text-xs text-gray-400 leading-relaxed uppercase tracking-tight whitespace-pre-wrap">
            {message}
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-900 bg-neutral-900/30 flex justify-end gap-4">
          <button onClick={onCancel} className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Abort</button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all text-black bg-[#45CC2D] hover:bg-[#3bb325]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssignToUnitModal({ guest, locations, onClose, onSuccess }: { guest: any; locations: any[]; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = React.useState(false);
  const [pendingUnit, setPendingUnit] = React.useState<any | null>(null);

  const handleDeploy = async () => {
    if (!pendingUnit) return;
    setLoading(true);
    try {
      await apiFetch("/admin/lodging/assign", {
        method: "PATCH",
        body: JSON.stringify({ guest_ids: [guest.id], unit_id: pendingUnit.id }),
      });
      onSuccess();
    } catch (err) {
      alert("DEPLOYMENT FAILED: Hardware sync error.");
    } finally {
      setLoading(false);
      setPendingUnit(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono text-[#45CC2D]">
      <div className="w-full max-w-2xl border-2 border-[#45CC2D] bg-black shadow-2xl flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="bg-[#45CC2D] px-4 py-2 flex justify-between items-center text-black font-bold uppercase text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span>Deploy: {guest.first_name} {guest.last_name}</span>
            <span className="text-[10px] bg-black text-[#45CC2D] px-1.5 py-0.5 rounded ml-2">ID: {guest.id.split('-')[0]}</span>
          </div>
          <button onClick={onClose}><XMarkIcon className="h-5 w-5" /></button>
        </div>

        {/* CONTENT */}
        <div className="p-4 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-[#45CC2D]/30">
          {locations.length === 0 ? (
            <div className="text-center py-12 opacity-40 uppercase text-xs">No active nodes detected in deployment grid.</div>
          ) : (
            locations.map((loc) => (
              <div key={loc.id} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[#45CC2D]/20 pb-1">
                  <MapPinIcon className="h-4 w-4 opacity-60" />
                  <span className="text-xs font-bold uppercase tracking-widest">{loc.name}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {loc.units?.map((unit: any) => (
                    <button
                      key={unit.id}
                      disabled={loading}
                      onClick={() => setPendingUnit(unit)} // Trigger Confirmation Modal
                      className="group flex items-center justify-between p-3 border border-[#45CC2D]/20 bg-neutral-900/40 hover:bg-[#45CC2D] hover:text-black transition-all text-left"
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase">{unit.label}</div>
                        <div className="text-[8px] opacity-60 flex items-center gap-1 mt-1">
                          <BuildingOfficeIcon className="h-2.5 w-2.5" />
                          {unit.guests?.length || 0} / {unit.capacity || 2} Occupied
                        </div>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-[#45CC2D]/20 bg-neutral-900/20 text-center shrink-0">
          <button onClick={onClose} className="text-[10px] font-bold uppercase opacity-50 hover:opacity-100 transition-opacity">Abort Deployment</button>
        </div>
      </div>

      {/* STEP 2: REVIEW OCCUPANTS & COMMIT */}
      <ConfirmationModal
        isOpen={!!pendingUnit}
        title="Review Deployment"
        message={`Deploying: ${guest.first_name} ${guest.last_name}\nTarget: ${pendingUnit?.label}\n\nCURRENT OCCUPANTS:\n${pendingUnit?.guests?.map((g: any) => `• ${g.first_name} ${g.last_name}`).join('\n') || 'VACANT'}`}
        onConfirm={handleDeploy}
        onCancel={() => setPendingUnit(null)}
        confirmLabel="Finalize Deployment"
      />
    </div>
  );
}