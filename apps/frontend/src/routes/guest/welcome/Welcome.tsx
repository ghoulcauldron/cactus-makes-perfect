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

  // --- NEW ASSETS (Z-Index Order: Bottom to Top) ---
  const imgLayerBase     = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0007_bg_green_color.png";
  const imgLayerMountains= "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0004_mountains.png";
  const imgLayerRocksMain= "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0003_rocks_main.png";
  const imgLayerBeam     = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0002_tractor_beam.png";
  const imgLayerUFO      = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0001_ufo.png";
  const imgLayerRocksFG  = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/welcome/CMP_v2_0000_rocks_fg.png";

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black flex flex-col items-center justify-center">
      
      {/* --- SCENE LAYERS --- */}

      {/* Layer 1 (Bottom): Background Color */}
      <div className="absolute inset-0 z-0">
        <img 
          src={imgLayerBase} 
          alt="Background Base" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Layer 2: Mountains */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <img 
          src={imgLayerMountains} 
          alt="Mountains" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Layer 3: Main Rocks */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <img 
          src={imgLayerRocksMain} 
          alt="Main Rocks" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Layer 4: Tractor Beam */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        <img 
          src={imgLayerBeam} 
          alt="Tractor Beam" 
          className="w-full h-full object-cover mix-blend-screen opacity-90"
        />
      </div>

      {/* Layer 5: UFO */}
      <div className="absolute inset-0 z-40 pointer-events-none">
        <img 
          src={imgLayerUFO} 
          alt="UFO" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Layer 6 (Top): Foreground Rocks */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        <img 
          src={imgLayerRocksFG} 
          alt="Foreground Rocks" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* --- UI / OVERLAYS (z-60+) --- */}
      
      {/* Footer */}
      <footer className="absolute bottom-4 text-sm text-white/80 font-mono z-[60] text-shadow-sm">
        🌞 Santa Fe, NM • August 2026
      </footer>

      {/* MODALS (Unchanged logic) */}
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