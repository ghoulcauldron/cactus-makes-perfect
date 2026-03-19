import { useNavigate } from "react-router-dom";
import { useState } from "react";
import SurveyModal from "../modals/SurveyModal";

// --- REUSABLE GRAPHIC BUTTON COMPONENT ---
function GraphicButton({ 
  srcUp, 
  srcHover, 
  srcDown, 
  alt, 
  onClick, 
  className 
}: { 
  srcUp: string, srcHover: string, srcDown: string, alt: string, onClick: () => void, className?: string 
}) {
  const [state, setState] = useState<'up' | 'hover' | 'down'>('up');

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setState('hover')}
      onMouseLeave={() => setState('up')}
      onMouseDown={() => setState('down')}
      onMouseUp={() => setState('hover')}
      className={`relative select-none focus:outline-none focus:ring-0 transition-transform active:scale-95 bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent border-none p-0 outline-none ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <img 
        src={state === 'up' ? srcUp : state === 'hover' ? srcHover : srcDown} 
        alt={alt}
        className="w-full h-full object-contain"
      />
    </button>
  );
}

export default function Welcome() {
  console.log("Rendering Welcome.tsx component");
  const navigate = useNavigate();

  const [isSurveyModalOpen, setSurveyModalOpen] = useState(true);
  // Removed activeTab state as it is no longer needed in Welcome.tsx

  // --- ASSETS: SCENE LAYERS ---
  const imgBackground  = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0004_background.png";
  const imgRocksMain   = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0003_rocks_main.png";
  const imgAlienBack   = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_solo_alien.png";
  const imgUFO         = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0005_logo.png";
  const imgRocksFG     = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0000_rocks_fg.png";
  const imgAliensFront = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0000_aliens_cacti_top.png";

  return (
    <div className="h-screen w-full bg-[#90c974] overflow-hidden relative">
      
      {/* LAYER 1: Background (z-0) */}
      <img src={imgBackground} alt="Background" className="absolute inset-0 w-full h-full object-cover object-bottom z-0" />

      {/* LAYER 2: Main Rocks (z-10) */}
      <img src={imgRocksMain} alt="Main Rocks" className="absolute inset-0 w-full h-full object-cover object-bottom z-10" />

      {/* LAYER 3: Alien In Back (z-20) */}
      <img src={imgAlienBack} alt="Alien Back" className="absolute inset-0 w-full h-full object-cover object-bottom z-20" />

      {/* LAYER 5: UFO (z-40) */}
      <img src={imgUFO} alt="UFO" className="absolute inset-0 w-full h-full object-cover object-bottom z-40 animate-pulse-slow" />

      {/* LAYER 6: Foreground Rocks (z-50) */}
      <img src={imgRocksFG} alt="Foreground Rocks" className="absolute inset-0 w-full h-full object-cover object-bottom z-50" />

      {/* LAYER 7: Aliens Front (z-[60]) */}
      <img src={imgAliensFront} alt="Aliens Front" className="absolute inset-0 w-full h-full object-cover object-bottom z-[60] pointer-events-none" />

      {/* --- UI OVERLAYS (z-[70]) --- */}
      <footer className="absolute bottom-6 w-full text-center z-[70] pointer-events-auto">
        <p className="text-[#ffffff] font-mono text-xs font-bold tracking-[0.2em] opacity-100 inline-block px-2 py-1 rounded">
          SANTA FE, NM • AUGUST 2026
        </p>
      </footer>

      {/* MODALS */}
      {isSurveyModalOpen && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0" />
          <SurveyModal
            isOpen={isSurveyModalOpen}
            onClose={() => setSurveyModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
}