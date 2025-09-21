import { useNavigate } from "react-router-dom";

export default function Welcome() {
  console.log("Rendering Welcome.tsx component"); // Debug
  const showReset = import.meta.env.VITE_SHOW_RESET_BUTTON === "true";
  const navigate = useNavigate();
  const videoUrl = import.meta.env.VITE_WELCOME_VIDEO_URL;
  console.log("Background media URL:", videoUrl); // ✅ Debug log

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
        <img
            src={videoUrl}
            alt="Background animation"
            className="absolute inset-0 w-full h-full object-cover z-0"
        />
        )}

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
          <button className="px-6 py-4 rounded-xl bg-cactus-green text-white text-lg font-bold shadow-md hover:bg-cactus-green/80 transition">
            RSVP Now
          </button>
          <button className="px-6 py-4 rounded-xl bg-sunset text-white text-lg font-bold shadow-md hover:bg-sunset/80 transition">
            View Schedule
          </button>
          <button className="px-6 py-4 rounded-xl bg-sky text-white text-lg font-bold shadow-md hover:bg-sky/80 transition">
            FAQs
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

      {/* playful desert footer */}
      <footer className="absolute bottom-4 text-sm text-gray-600 font-mono opacity-80 z-20">
        🌞 Santa Fe, NM • August 2026
      </footer>
    </div>
  );
}
