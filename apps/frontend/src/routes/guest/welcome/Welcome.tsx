import { useNavigate } from "react-router-dom";
import RSVPModal from "../modals/RSVPModal";
import { useState } from "react";

export default function Welcome() {
  console.log("Rendering Welcome.tsx component"); // Debug
  const navigate = useNavigate();

  const [isRSVPModalOpen, setRSVPModalOpen] = useState(false);
  const [isEventInfoModalOpen, setEventInfoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "faqs">("schedule");

  const handleLogout = () => {
    try {
      localStorage.removeItem("auth_token");
    } catch {}
    navigate("/", { replace: true });
  };

  // --- ASSETS (Full Canvas Export) ---
  const imgBackground = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0004_background.png";
  const imgRocksMain  = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0003_rocks_main.png";
  const imgBeam       = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0002_tractor_beam.png";
  const imgUFO        = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0001_ufo.png";
  const imgRocksFG    = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0000_rocks_fg.png";

  return (
    // MAIN WRAPPER
    // h-screen w-full overflow-hidden: Locks the viewport, disables scrolling.
    // bg-[#8DAF7E]: Fills any empty space at the top (on tall mobile screens) with sky color.
    <div className="h-screen w-full bg-[#8DAF7E] overflow-hidden relative">
      
      {/* SCENE CONTAINER (The Stage) 
          - absolute bottom-0: Anchors the bottom of the image to the bottom of the window.
          - w-full: Forces the image to always match the browser width (vw).
      */}
      <div className="absolute bottom-0 w-full left-0 z-0 pointer-events-none">
        <div className="relative w-full h-auto">
          
          {/* Layer 1: Background (The Anchor) 
              - relative, w-full, h-auto: This image defines the height of the container based on the width.
              - block: Removes tiny inline spacing gaps.
          */}
          <img 
            src={imgBackground} 
            alt="Background" 
            className="relative w-full h-auto block z-0"
          />

          {/* LAYERS 2-5: Overlays
              - absolute inset-0: Stretches them to match the Background image exactly.
          */}
          
          {/* Layer 2: Main Rocks */}
          <img 
            src={imgRocksMain} 
            alt="Main Rocks" 
            className="absolute inset-0 w-full h-full z-10"
          />

          {/* Layer 3: Tractor Beam */}
          <img 
            src={imgBeam} 
            alt="Tractor Beam" 
            className="absolute inset-0 w-full h-full z-20 mix-blend-screen opacity-90"
          />

          {/* Layer 4: UFO */}
          <img 
            src={imgUFO} 
            alt="UFO" 
            className="absolute inset-0 w-full h-full z-30"
          />

          {/* Layer 5: Foreground Rocks */}
          <img 
            src={imgRocksFG} 
            alt="Foreground Rocks" 
            className="absolute inset-0 w-full h-full z-40"
          />
        </div>
      </div>

      {/* --- UI OVERLAYS (Buttons/Text) --- */}
      {/* Positioned relative to the SCREEN, not the image */}
      
      {/* Footer - Anchored to screen bottom */}
      <footer className="absolute bottom-3 md:bottom-6 w-full text-center z-50 pointer-events-auto">
        {/* RSVP BUTTON */}
        <div className="mb-4">
           <button 
             onClick={() => setRSVPModalOpen(true)}
             className="bg-[#D96C75] text-[#3E2F55] font-bold py-2 px-8 rounded-full shadow-lg hover:bg-[#C45B64] hover:scale-105 transition-all text-sm md:text-base border-2 border-[#3E2F55]"
           >
             RSVP NOW
           </button>
        </div>

        {/* TEXT */}
        <p className="text-[#3E2F55] font-mono text-[10px] md:text-xs font-bold tracking-[0.2em] opacity-80 bg-[#8DAF7E]/30 inline-block px-3 py-1 rounded backdrop-blur-[2px]">
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