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

  // --- NEW ASSETS (Full Canvas Export) ---
  // Layer Order: Bottom (Background) -> Top (Foreground Rocks)
  const imgBackground = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0004_background.png";
  const imgRocksMain  = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0003_rocks_main.png";
  const imgBeam       = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0002_tractor_beam.png";
  const imgUFO        = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0001_ufo.png";
  const imgRocksFG    = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0000_rocks_fg.png";

  return (
    // MAIN WRAPPER
    // bg-[#8DAF7E] is a placeholder green typical of the art style, used for the letterbox bars
    <div className="min-h-screen w-full bg-[#8DAF7E] flex items-center justify-center overflow-hidden p-4 md:p-8">
      
      {/* SCENE CONTAINER 
          Since all images share the same canvas size, we stack them here.
          'aspect-video' forces a standard 16:9 ratio which is typical for screen exports.
          If your art is 4:3, change 'aspect-video' to 'aspect-[4/3]'.
      */}
      <div className="relative w-full max-w-7xl aspect-video shadow-2xl bg-black/10 rounded-lg overflow-hidden">
        
        {/* Layer 1: Background (Bottom) */}
        <div className="absolute inset-0 z-0">
          <img 
            src={imgBackground} 
            alt="Background" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Layer 2: Main Rocks */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <img 
            src={imgRocksMain} 
            alt="Main Rocks" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Layer 3: Tractor Beam */}
        {/* Added mix-blend-screen for a glowing light effect */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <img 
            src={imgBeam} 
            alt="Tractor Beam" 
            className="w-full h-full object-contain mix-blend-screen opacity-90"
          />
        </div>

        {/* Layer 4: UFO */}
        <div className="absolute inset-0 z-30 pointer-events-none">
          <img 
            src={imgUFO} 
            alt="UFO" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Layer 5: Foreground Rocks (Top) */}
        <div className="absolute inset-0 z-40 pointer-events-none">
          <img 
            src={imgRocksFG} 
            alt="Foreground Rocks" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* --- UI OVERLAYS --- */}
        {/* Placed at z-50 to sit on top of the art */}
        <footer className="absolute bottom-3 md:bottom-6 w-full text-center z-50">
          <p className="text-[#3E2F55] font-mono text-xs md:text-sm font-bold tracking-widest opacity-90 bg-white/20 inline-block px-4 py-1 rounded backdrop-blur-sm">
            🌞 Santa Fe, NM • August 2026
          </p>
        </footer>

      </div>

      {/* MODALS (Unchanged) */}
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