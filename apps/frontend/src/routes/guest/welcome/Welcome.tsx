import { useState, useEffect } from "react";
import SurveyModal from "../modals/SurveyModal";

export default function Welcome() {
  const [isSurveyModalOpen, setSurveyModalOpen] = useState(false);
  const [showScene, setShowScene] = useState(false);

  useEffect(() => {
    setShowScene(true);
    const timer = setTimeout(() => setSurveyModalOpen(true), 1000);
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
    <div className="h-screen w-full bg-[#0a001a] overflow-hidden relative">
      
      {/* CRT SCANLINES */}
      <div className="absolute inset-0 z-[66] pointer-events-none bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15),rgba(0,0,0,0.15)_1px,transparent_1px,transparent_2px)]" />

      {/* SCENE LAYERS - HEAVY INVERSION */}
      <div className={`infected-scene transition-all duration-[2000ms] absolute inset-0 w-full h-full ${showScene ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}>
        <img src={assets.background} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-0" />
        <img src={assets.rocksMain} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-10" />
        <img src={assets.alienBack} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-20" />
        <img src={assets.ufo} alt="UFO" className="absolute inset-0 w-full h-full object-cover object-bottom z-40 animate-pulse" style={{ filter: 'drop-shadow(0 0 20px #00ffff) invert(1)' }} />
        <img src={assets.rocksFG} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-50" />
        <img src={assets.aliensFront} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-[60]" />
      </div>

      {/* FOOTER */}
      <footer className="absolute bottom-6 w-full text-center z-[70]">
        <p className="text-[#39FF14] font-mono text-[10px] tracking-[0.4em] opacity-80 uppercase animate-pulse">
          S-FE // 08-2026 // SIGNAL DETECTED
        </p>
      </footer>

      {isSurveyModalOpen && (
        <SurveyModal isOpen={isSurveyModalOpen} onClose={() => setSurveyModalOpen(false)} />
      )}

      <style>{`
        .infected-scene {
          filter: invert(1) hue-rotate(180deg) contrast(1.2) brightness(0.8);
        }
      `}</style>
    </div>
  );
}