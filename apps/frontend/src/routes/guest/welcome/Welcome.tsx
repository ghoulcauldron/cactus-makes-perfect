import { useNavigate } from "react-router-dom";
import RSVPModal from "../modals/RSVPModal";
import { useState } from "react";

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
      // Added 'bg-transparent' and removed any default borders/padding to fix green background issue
      className={`relative select-none focus:outline-none transition-transform active:scale-95 bg-transparent border-none p-0 ${className}`}
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

  const [isRSVPModalOpen, setRSVPModalOpen] = useState(false);
  const [isEventInfoModalOpen, setEventInfoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "faqs">("schedule");

  // --- ASSETS: SCENE LAYERS ---
  const imgBackground  = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0004_background.png";
  const imgRocksMain   = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0003_rocks_main.png";
  const imgAlienBack   = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_solo_alien.png";
  const imgUFO         = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0005_logo.png";
  const imgRocksFG     = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0000_rocks_fg.png";
  const imgAliensFront = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0000_aliens_cacti_top.png";

  // --- ASSETS: BUTTONS ---
  const btnRsvpUp    = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/buttons/RSVP_button_up.png";
  const btnRsvpHover = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/buttons/RSVP_button_hover.png";
  const btnRsvpDown  = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/buttons/RSVP_button_down.png";

  const btnInfoUp    = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/buttons/INFO_button_up.png";
  const btnInfoHover = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/buttons/INFO_button_hover.png";
  const btnInfoDown  = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/buttons/INFO_button_down.png";

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

      {/* --- BUTTONS LAYER (z-[80] - Topmost) --- */}
      <div className="absolute inset-0 z-[80] flex items-center justify-center pointer-events-none">
        
        {/* Container for the button group */}
        <div className="relative w-[300px] h-[400px] mt-[10vh] pointer-events-auto">
          
          {/* RSVP Button */}
          <div className={`
            absolute left-1/2 -translate-x-1/2 
            
            /* Mobile: Scale down, move left 50px, move down 100px */
            w-[160px] h-auto -ml-[50px] top-[100px]
            
            /* Desktop: Original size, centered top */
            md:w-[225px] md:h-[206px] md:ml-0 md:top-0
          `}>
            <GraphicButton 
              srcUp={btnRsvpUp} 
              srcHover={btnRsvpHover} 
              srcDown={btnRsvpDown} 
              alt="RSVP" 
              onClick={() => setRSVPModalOpen(true)}
            />
          </div>

          {/* INFO Button */}
          <div className={`
            absolute left-1/2 
            
            /* Mobile: Scale down, move left 30px (relative to center), move down 100px (relative to desktop pos) */
            w-[160px] h-auto -ml-[40px] top-[250px] translate-x-0

            /* Desktop: Original size, original position (150px down, slightly shifted left) */
            md:w-[238px] md:h-[162px] md:ml-0 md:top-[150px] md:translate-x-[-10px]
          `}>
            <GraphicButton 
              srcUp={btnInfoUp} 
              srcHover={btnInfoHover} 
              srcDown={btnInfoDown} 
              alt="Info" 
              onClick={() => setEventInfoModalOpen(true)}
            />
          </div>

        </div>
      </div>

      {/* --- UI OVERLAYS (z-[70]) --- */}
      <footer className="absolute bottom-6 w-full text-center z-[70] pointer-events-auto">
        <p className="text-[#3E2F55] font-mono text-xs font-bold tracking-[0.2em] opacity-80 inline-block px-2 py-1 rounded">
          SANTA FE, NM • AUGUST 2026
        </p>
      </footer>

      {/* MODALS */}
      {isRSVPModalOpen && (
        <RSVPModal isOpen={isRSVPModalOpen} onClose={() => setRSVPModalOpen(false)} />
      )}

      {isEventInfoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setEventInfoModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold transition"
              aria-label="Close modal"
            >
              &times;
            </button>
            <div className="mb-4 border-b border-gray-300 flex space-x-4">
              <button
                onClick={() => setActiveTab("schedule")}
                className={`py-2 px-4 font-semibold border-b-2 transition ${
                  activeTab === "schedule"
                    ? "border-sunset text-sunset"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Schedule
              </button>
              <button
                onClick={() => setActiveTab("faqs")}
                className={`py-2 px-4 font-semibold border-b-2 transition ${
                  activeTab === "faqs"
                    ? "border-sunset text-sunset"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                FAQs
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {activeTab === "schedule" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-cactus-green">Event Schedule</h2>
                  <p className="mb-2 text-gray-700">Details about the event schedule will go here.</p>
                </div>
              )}
              {activeTab === "faqs" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-sunset">Frequently Asked Questions</h2>
                  <p className="mb-2 text-gray-700">Answers to common questions will go here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}