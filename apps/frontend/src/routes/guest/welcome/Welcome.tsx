import { useNavigate } from "react-router-dom";
import RSVPModal from "../modals/RSVPModal";
import { useState } from "react";

export default function Welcome() {
  console.log("Rendering Welcome.tsx component"); // Debug
  const showReset = import.meta.env.VITE_SHOW_RESET_BUTTON === "true";
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

  // Asset URLs
  const bgDesktop = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/bg_rays_1920x1080.png";
  const bgMobile = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/bg_rays_492x1080.png";
  const imgWindow = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/picture_window.png";
  const imgCactusTitle = "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/cactus_2.png";

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-cactus-sand flex flex-col items-center justify-center">
      
      {/* --- LAYER 1: RESPONSIVE BACKGROUND --- */}
      <div className="absolute inset-0 z-0">
        <picture>
          {/* Use mobile image for screens smaller than 768px */}
          <source media="(max-width: 767px)" srcSet={bgMobile} />
          {/* Default to desktop image */}
          <img 
            src={bgDesktop} 
            alt="Background Rays" 
            className="w-full h-full object-cover"
          />
        </picture>
      </div>

      {/* --- LAYER 2: PICTURE WINDOW (Centered) --- */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <img 
          src={imgWindow} 
          alt="Decorative Window" 
          className="max-w-[90%] max-h-[90%] object-contain opacity-90"
        />
      </div>

      {/* --- LAYER 3: CACTUS TITLE (Top Center) --- */}
      {/* Adjust 'top-10' or 'mt-10' to play with vertical positioning */}
      <div className="absolute top-20 z-20 w-full flex justify-center pt-12 md:pt-16 pointer-events-none">
        <img 
          src={imgCactusTitle} 
          alt="Cactus Title" 
          className="w-48 md:w-64 object-contain drop-shadow-md"
        />
      </div>

      {/* MODALS (Unchanged logic) */}
      {isRSVPModalOpen && (
        <RSVPModal
          isOpen={isRSVPModalOpen}
          onClose={() => setRSVPModalOpen(false)}
        />
      )}

      {isEventInfoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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

      {/* Footer */}
      <footer className="absolute bottom-4 text-sm text-gray-600 font-mono opacity-80 z-20">
        🌞 Santa Fe, NM • August 2026
      </footer>
    </div>
  );
}