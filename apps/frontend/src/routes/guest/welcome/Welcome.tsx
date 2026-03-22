import { useState, useEffect } from "react";
import SurveyModal from "../modals/SurveyModal";

export default function Welcome() {
  const [isSurveyModalOpen, setSurveyModalOpen] = useState(false);
  const [showScene, setShowScene] = useState(false);

  useEffect(() => {
      setShowScene(true);
      // Increased gate: 3 second pause before modal loads
      const timer = setTimeout(() => setSurveyModalOpen(true), 3000);
      return () => clearTimeout(timer);
    }, []);

  const assets = {
    background: "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0004_background.png",
    rocksMain: "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0003_rocks_main.png",
    alienBack: "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_solo_alien.png",
    ufo: "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0005_logo.png",
    rocksFG: "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0000_rocks_fg.png",
    aliensFront: "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0000_aliens_cacti_top.png"
  };

  return (
    /* Force the wrapper to be black to prevent background bleed */
    <div className="h-screen w-full bg-black overflow-hidden relative">
      
      {/* CRT SCANLINES - z-index high to sit over everything */}
      <div className="absolute inset-0 z-[80] pointer-events-none bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.2),rgba(0,0,0,0.2)_1px,transparent_1px,transparent_2px)] opacity-50" />

      {/* SCENE LAYERS */}
      <div className={`infected-scene transition-all duration-[2000ms] absolute inset-0 w-full h-full ${showScene ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}>
        <img src={assets.background} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-0" />
        <img src={assets.rocksMain} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-10" />
        <img src={assets.alienBack} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-20" />
        
        {/* UFO - Removed the nested invert(1) here */}
        <img
          src={assets.ufo}
          alt="UFO"
          className="absolute inset-0 w-full h-full object-cover object-bottom z-40 animate-pulse"
          style={{ filter: 'hue-rotate(180deg) saturate(1.5) drop-shadow(0 0 25px #00ffff)' }}
        />
        
        <img src={assets.rocksFG} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-50" style={{ filter: 'hue-rotate(180deg) saturate(1.5)' }}/>
        <img src={assets.aliensFront} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-[60]" />
      </div>

      {/* FOOTER */}
      <footer className="absolute bottom-6 w-full text-center z-[90]">
        <p className="text-[#39FF14] font-mono text-[10px] tracking-[0.4em] opacity-80 uppercase animate-pulse">
          S-FE // 08-2026 // SIGNAL DETECTED
        </p>
      </footer>

      {/* INVISIBLE TRIGGER BUTTON - Explicitly kill all hover states */}
      {!isSurveyModalOpen && (
        <button
          type="button"
          aria-label="Open survey"
          className="absolute inset-0 z-[100] cursor-pointer bg-transparent border-none outline-none ring-0 hover:bg-transparent active:bg-transparent focus:outline-none"
          onClick={() => setSurveyModalOpen(true)}
        />
      )}

      {isSurveyModalOpen && (
        <SurveyModal isOpen={isSurveyModalOpen} onClose={() => setSurveyModalOpen(false)} />
      )}

      <style>{`
      .infected-scene {
        /* Restores the requested invert effect while shifting the resulting tones */
        filter: invert(1) hue-rotate(30deg) contrast(1.4) brightness(0.7);
        /* hue-rotate(30deg) after invert(1) pushes the resulting palette into deep indigo */
      }
        /* REFINED GROW ANIMATION */
        @keyframes modal-entry {
          0% { 
            opacity: 0; 
            transform: scale(0); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        .animate-modal-entry { 
          animation: modal-entry 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; 
        }
      `}</style>
    </div>
  );
}