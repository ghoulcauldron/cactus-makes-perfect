// apps/admin/components/HydrateLocationModal.tsx
import React, { useState } from "react";
import { apiFetch } from "../api/client";
import { XMarkIcon, GlobeAltIcon } from '@heroicons/react/20/solid';

export default function HydrateLocationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleHydrate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/admin/lodging/hydrate", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
      onSuccess();
    } catch (err) {
      alert("HYDRATION ERROR: System could not resolve coordinates.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg border-2 border-[#45CC2D] bg-black shadow-2xl overflow-hidden font-mono">
        <div className="bg-[#45CC2D] px-4 py-2 flex justify-between items-center">
          <h2 className="text-black font-bold uppercase tracking-widest text-sm">Hydrate New Location</h2>
          <button onClick={onClose} className="text-black hover:bg-black/20 p-0.5"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        
        <form onSubmit={handleHydrate} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-[#45CC2D] uppercase font-bold tracking-tighter">Google Maps Intelligence Link</label>
            <div className="relative">
              <input 
                autoFocus
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.google.com/maps/place/..."
                className="w-full bg-neutral-900 border border-[#45CC2D]/40 text-[#45CC2D] p-3 text-xs focus:ring-1 focus:ring-[#45CC2D] outline-none placeholder:opacity-30"
              />
              <GlobeAltIcon className="absolute right-3 top-3 h-4 w-4 text-[#45CC2D]/30" />
            </div>
          </div>

          <div className="bg-[#45CC2D]/5 border border-dashed border-[#45CC2D]/30 p-4 text-[10px] text-[#45CC2D]/70 leading-relaxed">
            SYSTEM DIRECTIVE: Paste the direct URL from your browser or a "Share" link. 
            The system will automatically parse metadata and synchronize with global positioning coordinates.
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="text-[10px] font-bold text-gray-500 uppercase hover:text-white">Cancel</button>
            <button 
              type="submit" 
              disabled={loading}
              className={`bg-[#45CC2D] text-black px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${loading ? 'opacity-50 cursor-wait' : 'hover:bg-[#3bb325]'}`}
            >
              {loading ? "HYDRATING..." : "EXECUTE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}