// apps/admin/components/HydrateLocationModal.tsx
import React, { useState } from "react";
import { apiFetch } from "../api/client";
import { XMarkIcon, CheckIcon, PencilSquareIcon } from '@heroicons/react/20/solid';

export default function HydrateLocationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const startManualEntry = () => {
    setPreview({ name: "", address: "", google_maps_url: "", place_id: "manual" });
  };

  const handleFetchPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch("/admin/lodging/hydrate", { // Removed ?preview=true as backend is now preview-only
        method: "POST",
        body: JSON.stringify({ url }),
      });
      setPreview(data.location);
    } catch (err) {
      alert("Hydration failed. Try Manual Entry.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    setLoading(true);
    try {
      await apiFetch("/admin/lodging/locations", {
        method: "POST",
        body: JSON.stringify(preview),
      });
      onSuccess();
    } catch (err) {
      alert("Save failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="w-full max-w-lg border-2 border-[#45CC2D] bg-black shadow-2xl overflow-hidden">
        <div className="bg-[#45CC2D] px-4 py-2 flex justify-between items-center text-black font-bold uppercase text-xs">
          <span>{preview ? "Finalize Location Data" : "Location Intelligence"}</span>
          <button onClick={onClose}><XMarkIcon className="h-5 w-5" /></button>
        </div>
        
        {!preview ? (
          <form onSubmit={handleFetchPreview} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-[#45CC2D] uppercase font-bold">Google Maps URL</label>
              <input required autoFocus type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste link..." className="w-full bg-neutral-900 border border-[#45CC2D]/40 text-[#45CC2D] p-3 text-xs outline-none" />
            </div>
            <div className="flex gap-4">
              <button disabled={loading} type="submit" className="flex-1 bg-[#45CC2D] text-black py-2 text-xs font-bold uppercase">{loading ? "SCANNING..." : "SCAN LINK"}</button>
              <button type="button" onClick={startManualEntry} className="px-4 border border-[#45CC2D] text-[#45CC2D] text-[10px] font-bold uppercase hover:bg-[#45CC2D]/10">Manual</button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="space-y-4 bg-neutral-900/50 p-4 border border-[#45CC2D]/20">
              <div>
                <label className="text-[9px] text-[#45CC2D]/60 uppercase font-bold">Location Name (Editable)</label>
                <input 
                  value={preview.name} 
                  onChange={e => setPreview({...preview, name: e.target.value})}
                  className="w-full bg-black border-b border-[#45CC2D]/40 text-[#45CC2D] p-1 text-sm outline-none focus:border-[#45CC2D]"
                />
              </div>
              <div>
                <label className="text-[9px] text-[#45CC2D]/60 uppercase font-bold">Physical Address</label>
                <textarea 
                  value={preview.address} 
                  onChange={e => setPreview({...preview, address: e.target.value})}
                  className="w-full bg-black border-b border-[#45CC2D]/40 text-white p-1 text-xs outline-none h-16 resize-none focus:border-[#45CC2D]"
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <button onClick={() => setPreview(null)} className="text-[10px] text-gray-500 uppercase font-bold hover:text-white">Cancel</button>
              <button onClick={handleConfirmSave} disabled={loading} className="bg-[#45CC2D] text-black px-6 py-2 text-xs font-bold uppercase flex items-center gap-2">
                <CheckIcon className="h-4 w-4" /> Save Location
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}