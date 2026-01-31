import { useNavigate } from "react-router-dom";
import RSVPModal from "../modals/RSVPModal";
import { useState } from "react";

export default function Welcome() {
  console.log("Rendering Welcome.tsx component");
  const navigate = useNavigate();

  const [isRSVPModalOpen, setRSVPModalOpen] = useState(false);
  const [isEventInfoModalOpen, setEventInfoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "faqs">("schedule");

  // Assets
  const imgLayerBase      = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0007_bg_green_color.png";
  const imgLayerMountains = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0004_mountains.png";
  const imgLayerRocksMain = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0003_rocks_main.png";
  const imgLayerBeam      = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0002_tractor_beam.png";
  const imgLayerUFO       = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0001_ufo.png";
  const imgLayerRocksFG   = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0000_rocks_fg.png";

  return (
    // 1. STAGE: Locks the viewport. 'relative' establishes the anchor point.
    <div className="h-screen w-full bg-[#8DAF7E] overflow-hidden relative flex items-end justify-center">
      
      {/* 2. BACKGROUND ANCHOR (Layer 1)
          We let this image determine the size of the "scene". 
          We use object-cover to ensure the green background always fills the screen without stretching.
      */}
      <div className="absolute inset-0 z-0">
        <img 
          src={imgLayerBase} 
          alt="Background Color" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* 3. SCENE CONTAINER 
          This wrapper holds all the "Object" layers.
          We align it to the bottom (flex items-end on parent) so elements sit on the "floor".
          w-full ensures it spans the width.
      */}
      <div className="absolute bottom-0 w-full h-full z-10 pointer-events-none flex items-end justify-center">
        
        {/* Layer 2: Mountains
            - w-full: Spans width
            - h-auto: Preserves aspect ratio (prevents stretching)
            - mb-[20%]: Moves it UP from the bottom (Tune this to match reference)
        */}
        <img 
          src={imgLayerMountains} 
          alt="Mountains" 
          className="absolute w-full h-auto bottom-0 mb-[10%] md:mb-[5%] scale-110 origin-bottom" 
        />

        {/* Layer 3: Main Rocks (The Arches) 
            - These need to be prominent.
        */}
        <img 
          src={imgLayerRocksMain} 
          alt="Main Rocks" 
          className="absolute w-full h-auto bottom-0 z-20 scale-105 origin-bottom"
        />

        {/* Layer 4: Tractor Beam 
            - Needs to be behind the UFO but in front of mountains.
            - We use 'left-1/2 -translate-x-1/2' to perfectly center it horizontally.
            - 'bottom-[15%]' lifts it up to sit in the sky.
        */}
        <img 
          src={imgLayerBeam} 
          alt="Beam" 
          className="absolute h-[60vh] w-auto bottom-[15%] left-1/2 -translate-x-1/2 z-30 mix-blend-screen opacity-80"
        />

        {/* Layer 5: UFO 
            - Centered horizontally.
            - Positioned relative to the beam.
        */}
        <img 
          src={imgLayerUFO} 
          alt="UFO" 
          className="absolute w-[40%] md:w-[25%] h-auto bottom-[45%] left-1/2 -translate-x-1/2 z-40 animate-pulse-slow"
        />

        {/* Layer 6: Foreground Rocks (The Floor) 
            - Strictly anchored to bottom-0.
            - 'scale-110' ensures no gaps on the sides if screen is wide.
        */}
        <img 
          src={imgLayerRocksFG} 
          alt="Foreground" 
          className="absolute w-full h-auto bottom-0 z-50 scale-105 origin-bottom"
        />

      </div>

      {/* --- UI OVERLAYS --- */}
      <footer className="absolute bottom-6 w-full text-center z-[60] pointer-events-auto">
        <div className="mb-4">
           <button 
             onClick={() => setRSVPModalOpen(true)}
             className="bg-[#D96C75] text-[#3E2F55] font-bold py-3 px-10 rounded-full shadow-xl border-2 border-[#3E2F55] hover:scale-105 transition-transform"
           >
             RSVP NOW
           </button>
        </div>
        <p className="text-[#3E2F55] font-mono text-xs font-bold tracking-[0.2em] opacity-80">
          SANTA FE, NM • AUGUST 2026
        </p>
      </footer>

      {/* MODALS */}
      {isRSVPModalOpen && (
        <RSVPModal isOpen={isRSVPModalOpen} onClose={() => setRSVPModalOpen(false)} />
      )}
      
      {isEventInfoModalOpen && (
        // ... (Keep existing modal code)
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
           {/* ... Modal Content ... */}
           <button onClick={() => setEventInfoModalOpen(false)}>Close</button>
        </div>
      )}
    </div>
  );
}