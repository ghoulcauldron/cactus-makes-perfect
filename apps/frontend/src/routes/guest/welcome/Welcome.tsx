import { useNavigate } from "react-router-dom";
import RSVPModal from "../modals/RSVPModal";
import { useState } from "react";

export default function Welcome() {
  console.log("Rendering Welcome.tsx component");
  const navigate = useNavigate();

  const [isRSVPModalOpen, setRSVPModalOpen] = useState(false);
  const [isEventInfoModalOpen, setEventInfoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "faqs">("schedule");

  // --- UPDATED ASSETS (Correct URLs) ---
  const imgLayerBase      = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0004_background.png";
  const imgLayerRocksMain = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0003_rocks_main.png";
  const imgLayerBeam      = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0002_tractor_beam.png";
  const imgLayerUFO       = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0001_ufo.png";
  const imgLayerRocksFG   = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0000_rocks_fg.png";

  return (
    // 1. MAIN WRAPPER:
    //    - 'bg-[#8DAF7E]' provides the sky color for letterboxing on tall screens.
    //    - 'flex items-end justify-center' anchors the artboard to the bottom-center.
    <div className="h-screen w-full bg-[#8DAF7E] overflow-hidden relative flex items-end justify-center">
      
      {/* 2. SCENE CONTAINER (The "Artboard"):
          - 'w-full': Fills width up to...
          - 'max-w-[177.78vh]': ...a 16:9 ratio limit relative to height. 
             This prevents the image from getting wider than the screen can show vertically.
          - 'aspect-video': Locks the container to 16:9 so layers inside scale perfectly together.
      */}
      <div className="relative w-full max-w-[177.78vh] aspect-video">
        
        {/* Layer 1: Background (Base) */}
        <div className="absolute inset-0 z-0">
          <img 
            src={imgLayerBase} 
            alt="Background" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Layer 2: Main Rocks */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <img 
            src={imgLayerRocksMain} 
            alt="Main Rocks" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Layer 3: Tractor Beam */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <img 
            src={imgLayerBeam} 
            alt="Beam" 
            className="w-full h-full object-cover mix-blend-screen opacity-90"
          />
        </div>

        {/* Layer 4: UFO */}
        <div className="absolute inset-0 z-30 pointer-events-none">
          <img 
            src={imgLayerUFO} 
            alt="UFO" 
            className="w-full h-full object-cover animate-pulse-slow"
          />
        </div>

        {/* Layer 5: Foreground Rocks */}
        <div className="absolute inset-0 z-40 pointer-events-none">
          <img 
            src={imgLayerRocksFG} 
            alt="Foreground Rocks" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* --- UI OVERLAYS (Inside the container so they stick to the art) --- */}
        <footer className="absolute bottom-[5%] w-full text-center z-50 pointer-events-auto">
          <div className="mb-[2%]">
             <button 
               onClick={() => setRSVPModalOpen(true)}
               className="bg-[#D96C75] text-[#3E2F55] font-bold py-2 px-6 md:py-3 md:px-10 rounded-full shadow-xl border-2 border-[#3E2F55] hover:scale-105 transition-transform text-sm md:text-base"
             >
               RSVP NOW
             </button>
          </div>
          <p className="text-[#3E2F55] font-mono text-[10px] md:text-xs font-bold tracking-[0.2em] opacity-80">
            SANTA FE, NM • AUGUST 2026
          </p>
        </footer>

      </div>

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