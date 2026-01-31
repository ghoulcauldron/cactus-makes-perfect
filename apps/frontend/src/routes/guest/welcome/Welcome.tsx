import { useNavigate } from "react-router-dom";
import RSVPModal from "../modals/RSVPModal";
import { useState } from "react";

export default function Welcome() {
  console.log("Rendering Welcome.tsx component");
  const navigate = useNavigate();

  const [isRSVPModalOpen, setRSVPModalOpen] = useState(false);
  const [isEventInfoModalOpen, setEventInfoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "faqs">("schedule");

  // --- ASSETS (Corrected 5-Layer Stack) ---
  // Render Order: Bottom (Background) -> Top (Foreground)
  const imgBackground = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0004_background.png";
  const imgRocksMain  = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0003_rocks_main.png";
  const imgBeam       = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0002_tractor_beam.png";
  const imgUFO        = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0001_ufo.png";
  const imgRocksFG    = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0000_rocks_fg.png";

  return (
    // 1. VIEWPORT LOCK
    // h-screen: Locks the height to the window.
    // bg-[#8DAF7E]: Matches the sky color so if the screen is taller than the image (mobile), the top is seamless.
    <div className="h-screen w-full bg-[#8DAF7E] overflow-hidden relative">
      
      {/* 2. THE STACK CONTAINER 
          - absolute bottom-0: Pins the art to the floor.
          - w-full: Forces the art to span the full width of the browser.
          - pointer-events-none: Allows clicks to pass through transparent areas (optional, but good practice).
      */}
      <div className="absolute bottom-0 w-full pointer-events-none select-none">
        
        {/* 3. RELATIVE WRAPPER
            This is the "Canvas". It gets its height from the first image (Background).
        */}
        <div className="relative w-full">
          
          {/* LAYER 1: Background (The Anchor)
              - relative: Occupies actual space in the DOM.
              - w-full h-auto: This is CRITICAL. It ensures the aspect ratio is preserved. No stretching.
          */}
          <img 
            src={imgBackground} 
            alt="Background" 
            className="relative w-full h-auto block z-0"
          />

          {/* LAYERS 2-5: The Overlays
              - absolute inset-0: Stretches them to the exact boundaries of the Background image.
              - Since they are the same canvas size, the transparent pixels align the content perfectly.
          */}
          
          {/* Main Rocks */}
          <img 
            src={imgRocksMain} 
            alt="Main Rocks" 
            className="absolute inset-0 w-full h-full z-10"
          />

          {/* Tractor Beam */}
          <img 
            src={imgBeam} 
            alt="Tractor Beam" 
            className="absolute inset-0 w-full h-full z-20 mix-blend-screen opacity-90"
          />

          {/* UFO */}
          <img 
            src={imgUFO} 
            alt="UFO" 
            className="absolute inset-0 w-full h-full z-30 animate-pulse-slow"
          />

          {/* Foreground Rocks */}
          <img 
            src={imgRocksFG} 
            alt="Foreground Rocks" 
            className="absolute inset-0 w-full h-full z-40"
          />
        </div>
      </div>

      {/* --- UI OVERLAYS --- */}
      {/* Positioned relative to the SCREEN, not the images. z-50 ensures clickable. */}
      <footer className="absolute bottom-6 w-full text-center z-50 pointer-events-auto">
        <div className="mb-4">
           <button 
             onClick={() => setRSVPModalOpen(true)}
             className="bg-[#D96C75] text-[#3E2F55] font-bold py-3 px-10 rounded-full shadow-xl border-2 border-[#3E2F55] hover:scale-105 transition-transform"
           >
             RSVP NOW
           </button>
        </div>
        <p className="text-[#3E2F55] font-mono text-xs font-bold tracking-[0.2em] opacity-80 inline-block px-2 py-1 rounded">
          SANTA FE, NM • AUGUST 2026
        </p>
      </footer>

      {/* MODALS */}
      {isRSVPModalOpen && (
        <RSVPModal
          isOpen={isRSVPModalOpen}
          onClose={() => setRSVPModalOpen(false)}
        />
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