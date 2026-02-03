import React from "react";
import Modal from "../../../components/Modal";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="MISSION BRIEFING">
      <div className="font-mono text-[#45CC2D] bg-black p-1 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
        
        {/* --- HEADER --- */}
        <div className="border-b border-[#45CC2D]/30 pb-4 text-center">
          <h2 className="text-xl font-bold tracking-[0.2em] uppercase animate-pulse">
            Operation: 20 Year Dare
          </h2>
          <p className="text-[10px] text-[#45CC2D]/70 mt-1 uppercase">
            Clearance Level: Top Secret // Eyes Only
          </p>
        </div>

        {/* --- CONTENT BLOCKS --- */}
        <div className="space-y-6 text-sm">
          
          {/* WHERE */}
          <div className="border-l-2 border-[#45CC2D] pl-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#45CC2D]/60 mb-1">
              Target Coordinates
            </h3>
            <p className="font-bold text-lg">SANTA FE, NEW MEXICO</p>
            <p className="text-xs opacity-80">Sector 505 // High Desert Plain</p>
          </div>

          {/* WHEN */}
          <div className="border-l-2 border-[#45CC2D] pl-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#45CC2D]/60 mb-1">
              Temporal Window
            </h3>
            <p className="font-bold text-lg">AUGUST 27 - 31, 2026</p>
            <p className="text-xs opacity-80">Synchronize Watches.</p>
          </div>

          {/* HOW (Transit) */}
          <div className="bg-[#45CC2D]/10 p-4 border border-[#45CC2D]/30 rounded-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#45CC2D] mb-2 border-b border-[#45CC2D]/30 pb-1">
              Infiltration Vectors
            </h3>
            
            <div className="space-y-4">
              <div>
                <strong className="block text-xs uppercase mb-1"> Primary Drop Zone:</strong>
                <p className="opacity-90">Fly into <strong>ALBUQUERQUE (ABQ)</strong>.</p>
              </div>

              <div>
                <strong className="block text-xs uppercase mb-1"> Ground Transport:</strong>
                <p className="opacity-90 mb-2">
                  Secure a rental unit or proceed to the rail station for the <span className="text-white bg-[#45CC2D]/20 px-1 font-bold">$9 RAILRUNNER</span> transport. 
                  (Uber/Shuttle required for final leg).
                </p>
                <p className="text-xs italic opacity-70">
                  ** TACTICAL ADVICE: Refuel at "Duran's Pharmacy" before departure.
                </p>
              </div>
            </div>
          </div>

          {/* DRIVERS */}
          <div className="space-y-3">
             <h3 className="text-xs font-bold uppercase tracking-widest text-[#45CC2D]/60 mb-1">
              Navigation Routes
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Route A */}
              <div className="border border-[#45CC2D]/40 p-3 hover:bg-[#45CC2D]/5 transition-colors">
                <h4 className="font-bold text-xs uppercase text-white mb-1">Route Alpha (Direct)</h4>
                <p className="text-xs opacity-80">Via HWY 25.</p>
                <p className="text-xs opacity-60">ETA: ~60 Minutes.</p>
              </div>

              {/* Route B */}
              <div className="border border-[#45CC2D]/40 p-3 hover:bg-[#45CC2D]/5 transition-colors">
                 <h4 className="font-bold text-xs uppercase text-white mb-1">Route Beta (Scenic)</h4>
                <p className="text-xs opacity-80">Via The Turquoise Trail (Madrid).</p>
                <p className="text-xs opacity-60 mt-1">
                  Warning: Distractions include desert artifacts, crystals, and rogue performers.
                </p>
              </div>
            </div>
          </div>

          {/* WHAT ELSE */}
          <div className="pt-4 border-t border-[#45CC2D]/30 text-center">
            <p className="text-xs uppercase tracking-widest mb-2">Further Intelligence</p>
            <p className="opacity-80 italic">
              "Additional data packets will be decrypted once headcounts are locked."
            </p>
          </div>

        </div>

        {/* --- FOOTER --- */}
        <div className="text-[9px] text-center text-[#45CC2D]/40 uppercase pt-4 border-t border-[#45CC2D]/20">
          Transmission End // Stand By
        </div>
      </div>
    </Modal>
  );
};

export default InfoModal;