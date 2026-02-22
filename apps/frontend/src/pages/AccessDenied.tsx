// apps/frontend/src/pages/AccessDenied.tsx
import React, { useEffect} from "react";
import { useLocation, Link } from "react-router-dom";
import { ShieldExclamationIcon, ClockIcon, LockClosedIcon } from "@heroicons/react/24/outline";

export default function AccessDenied() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const reason = query.get("reason") || "unauthorized";

  // --- ADD THIS EFFECT ---
  useEffect(() => {
    // If we've reached this page, any existing local session is now 
    // considered structurally out of sync with the portal state.
    localStorage.removeItem("auth_token");
    localStorage.removeItem("guest_user_id");
    localStorage.removeItem("auth_ok");
    console.log("[AccessDenied] Stale session cleared.");
  }, []);

  const errorStates = {
    expired: {
      title: "PORTAL EXPIRED",
      icon: ClockIcon,
      message: "Your temporary access window has closed. The system requires a manual reactivation of your coordinates to proceed.",
      instruction: "Please contact S&G to extend your deployment deadline."
    },
    used: {
      title: "LINK DEACTIVATED",
      icon: LockClosedIcon,
      message: "This specific security token has already been successfully used to bridge a session.",
      instruction: "Please use your existing active session or request a fresh invite if you have been logged out."
    },
    unauthorized: {
      title: "ACCESS DENIED",
      icon: ShieldExclamationIcon,
      message: "The system could not verify your clearance level or the token provided is structurally unsound.",
      instruction: "Verify your link or contact command for assistance."
    }
  };

  const state = errorStates[reason as keyof typeof errorStates] || errorStates.unauthorized;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 font-mono text-[#45CC2D]">
      <div className="w-full max-w-md border-2 border-[#45CC2D] bg-neutral-900/20 p-8 shadow-[0_0_30px_rgba(69,204,45,0.15)] relative overflow-hidden">
        {/* Decorative scan line */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#45CC2D]/5 to-transparent h-1/2 w-full animate-scan"></div>
        
        <div className="flex flex-col items-center text-center space-y-6 relative z-10">
          <state.icon className="h-16 w-16 opacity-80" />
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-[0.2em] uppercase">{state.title}</h1>
            <div className="h-px w-full bg-[#45CC2D]/30"></div>
          </div>

          <p className="text-xs leading-relaxed opacity-80 uppercase tracking-tight">
            {state.message}
          </p>

          <div className="bg-[#45CC2D] text-black p-3 w-full">
            <p className="text-[10px] font-black uppercase tracking-widest">
              {state.instruction}
            </p>
          </div>

          <Link to="/" className="text-[10px] underline hover:text-white transition-colors uppercase tracking-[0.2em]">
            Return to Root
          </Link>
        </div>
      </div>
      
      <div className="mt-8 text-[8px] opacity-30 uppercase tracking-[0.5em]">
        Status Code: {reason === 'expired' ? '410_GONE' : '403_FORBIDDEN'}
      </div>
    </div>
  );
}