import { useNavigate } from "react-router-dom";
import RSVPModal from "../modals/RSVPModal";
import { useState } from "react";

export default function Welcome() {
  console.log("Rendering Welcome.tsx component"); // Debug
  const showReset = import.meta.env.VITE_SHOW_RESET_BUTTON === "true";
  const navigate = useNavigate();
  const videoUrl = import.meta.env.VITE_WELCOME_VIDEO_URL || "https://nuocergcapwdrngodpip.supabase.co/storage/v1/object/public/media/CMPComixLoop.mp4";
  console.log("Background media URL:", videoUrl); // ✅ Debug log
  const [isRSVPModalOpen, setRSVPModalOpen] = useState(false);
  const [isEventInfoModalOpen, setEventInfoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "faqs">("schedule");

  const handleLogout = () => {
    try {
      localStorage.removeItem("auth_token"); // match CalculatorAuth
    } catch {}
    navigate("/", { replace: true }); // ✅ clean redirect back to CalculatorAuth
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-cactus-sand">
      {/* background video */}
      {videoUrl && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      )}

      {/* optional overlay tint for readability */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* risograph grain overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10 z-10"></div>

      {/* content */}
      <div className="relative z-20 w-full max-w-2xl mx-auto text-center px-6 py-16">
        <h1 className="text-5xl font-display text-cactus-green drop-shadow-sm mb-6">
          Welcome to <br />
          <span className="text-sunset">Cactus Makes Perfect</span>
        </h1>

        <p className="text-lg text-gray-800 mb-8 leading-relaxed">
          We’re so glad you’re here. 🌵✨  
          This portal is your guide to our 20th Anniversary Celebration in Santa Fe.  
          Find RSVP details, schedules, and updates as we get closer to the big day.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="px-6 py-4 rounded-xl bg-cactus-green text-white text-lg font-bold shadow-md hover:bg-cactus-green/80 transition"
            onClick={() => setRSVPModalOpen(true)}
          >
            RSVP Now
          </button>
          <button
            className="px-6 py-4 rounded-xl bg-sunset text-white text-lg font-bold shadow-md hover:bg-sunset/80 transition"
            onClick={() => {
              setActiveTab("schedule");
              setEventInfoModalOpen(true);
            }}
          >
            Event Info
          </button>
        </div>

        {/* 🔑 Dev-only reset button */}
        {showReset && (
          <button
            onClick={handleLogout}
            className="mt-6 px-6 py-2 rounded-lg bg-red-500 text-white font-bold shadow-md hover:bg-red-600 transition"
          >
            🔑 Log out / Reset auth
          </button>
        )}
      </div>

      {isRSVPModalOpen && (
        <RSVPModal
          isOpen={isRSVPModalOpen}
          onClose={() => setRSVPModalOpen(false)}
        />
      )}

      {isEventInfoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 p-6 relative shadow-lg">
            <button
              onClick={() => setEventInfoModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
              aria-label="Close modal"
            >
              &times;
            </button>
            <div className="mb-4 border-b border-gray-300 flex space-x-4">
              <button
                onClick={() => setActiveTab("schedule")}
                className={`py-2 px-4 font-semibold border-b-2 ${
                  activeTab === "schedule"
                    ? "border-sunset text-sunset"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Schedule
              </button>
              <button
                onClick={() => setActiveTab("faqs")}
                className={`py-2 px-4 font-semibold border-b-2 ${
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
                  <h2 className="text-2xl font-bold mb-4">Event Schedule</h2>
                  <p className="mb-2">Details about the event schedule will go here.</p>
                  {/* Replace with actual schedule content */}
                </div>
              )}
              {activeTab === "faqs" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
                  <p className="mb-2">Answers to common questions will go here.</p>
                  {/* Replace with actual FAQs content */}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* playful desert footer */}
      <footer className="absolute bottom-4 text-sm text-gray-600 font-mono opacity-80 z-20">
        🌞 Santa Fe, NM • August 2026
      </footer>
    </div>
      
  );
}
