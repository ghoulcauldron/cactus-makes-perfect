import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import SurveyModal from "../modals/SurveyModal";

export default function Welcome() {
  const [isSurveyModalOpen, setSurveyModalOpen] = useState(false);
  const [showScene, setShowScene] = useState(false);

  // Delay modal and scene entrance for maximum "impact"
  useEffect(() => {
    setShowScene(true);
    const timer = setTimeout(() => setSurveyModalOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // --- ASSETS ---
  const assets = {
    background: "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0004_background.png",
    rocksMain: "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0003_rocks_main.png",
    alienBack: "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_solo_alien.png",
    ufo: "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0005_logo.png",
    rocksFG: "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0000_rocks_fg.png",
    aliensFront: "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0000_aliens_cacti_top.png"
  };

  // Shared filter for assets to match the modal's "Cyan/Purple" world
  // Adjust brightness/contrast to make the scene feel "night-vision"
  const assetFilter = "hue-rotate-[140deg] saturate-[0.8] brightness-[0.7] contrast-[1.1]";

  return (
    <div className="h-screen w-full bg-[#0a001a] overflow-hidden relative transition-opacity duration-1000">
      
      {/* HUD OVERLAY (Vignette) */}
      <div className="absolute inset-0 z-[65] pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] bg-gradient-to-b from-artifact-void/20 via-transparent to-artifact-void/40" />

      {/* SCENE LAYERS */}
      <div className={`transition-all duration-[2000ms] ${showScene ? 'opacity-100 scale-105' : 'opacity-0 scale-100'} ${assetFilter}`}>
        <img src={assets.background} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-0" />
        <img src={assets.rocksMain} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-10" />
        <img src={assets.alienBack} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-20" />
        
        {/* UFO with specific "Glow" effect */}
        <img src={assets.ufo} alt="UFO" className="absolute inset-0 w-full h-full object-cover object-bottom z-40 animate-pulse-slow drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]" />
        
        <img src={assets.rocksFG} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-50" />
        <img src={assets.aliensFront} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-[60]" />
      </div>

      {/* FOOTER */}
      <footer className="absolute bottom-6 w-full text-center z-[70]">
        <p className="text-artifact-cyan font-segment text-[10px] tracking-[0.4em] opacity-80 uppercase animate-pulse">
          Location: 35.6870° N, 105.9378° W // 08-2026
        </p>
      </footer>

      {/* MODAL WITH TRANSITION */}
      {isSurveyModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center animate-modal-entry">
          <SurveyModal
            isOpen={isSurveyModalOpen}
            onClose={() => setSurveyModalOpen(false)}
          />
        </div>
      )}

      {/* CSS For Entry Animations */}
      <style>{`
        @keyframes modal-entry {
          0% { 
            opacity: 0; 
            transform: scale(0.85); 
            filter: blur(10px) brightness(2);
          }
          100% { 
            opacity: 1; 
            transform: scale(1); 
            filter: blur(0px) brightness(1);
          }
        }
        .animate-modal-entry {
          animation: modal-entry 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}