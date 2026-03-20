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
      
      {/* 1. CRT SCANLINES - Lower opacity so they don't 'flood' the green */}
      <div className="absolute inset-0 z-[66] pointer-events-none bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.1),rgba(0,0,0,0.1)_1px,transparent_1px,transparent_3px)] opacity-40" />

      {/* 2. VIGNETTE - Adds depth and stops the edges from being 'full green' */}
      <div className="absolute inset-0 z-[61] pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />

      {/* SCENE LAYERS */}
      <div className={`infected-scene transition-all duration-[2000ms] absolute inset-0 w-full h-full ${showScene ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}>
        <img src={assets.background} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-0" />
        <img src={assets.rocksMain} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-10" />
        <img src={assets.alienBack} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-20" />
        
        {/* UFO - Removed individual invert(1) since the parent container is already inverting everything */}
        <img
          src={assets.ufo}
          alt="UFO"
          className="absolute inset-0 w-full h-full object-cover object-bottom z-40 animate-pulse"
          style={{ filter: 'drop-shadow(0 0 25px #00ffff)' }}
        />
        
        <img src={assets.rocksFG} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-50" />
        <img src={assets.aliensFront} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom z-[60]" />
      </div>

      {/* FOOTER */}
      <footer className="absolute bottom-6 w-full text-center z-[70]">
        <p className="text-[#39FF14] font-mono text-[10px] tracking-[0.4em] opacity-80 uppercase animate-pulse drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">
          S-FE // 08-2026 // SIGNAL DETECTED
        </p>
      </footer>

      {!isSurveyModalOpen && (
        <button
          type="button"
          aria-label="Open mission briefing"
          className="absolute inset-0 z-[75] cursor-pointer bg-transparent"
          onClick={() => setSurveyModalOpen(true)}
        />
      )}

      {isSurveyModalOpen && (
        <SurveyModal isOpen={isSurveyModalOpen} onClose={() => setSurveyModalOpen(false)} />
      )}

      <style>{`
        .infected-scene {
          /* TWEAKED: Slightly less contrast, deeper blacks */
          filter: invert(1) hue-rotate(195deg) contrast(1.1) brightness(0.7) saturate(1.2);
        }
      `}</style>
    </div>
  );
}