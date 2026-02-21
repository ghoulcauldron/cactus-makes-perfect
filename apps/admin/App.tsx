import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { verifyAdminToken } from "./api/client";

export default function App() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Perspective: Persist the current path whenever it changes
  useEffect(() => {
    // We only want to save "feature" routes, not login or root
    if (isAuthed && location.pathname !== "/login" && location.pathname !== "/") {
      localStorage.setItem("area51_last_path", location.pathname);
    }
  }, [location, isAuthed]);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setIsAuthed(false);
      navigate("/login");
      return;
    }

    (async () => {
      const valid = await verifyAdminToken(token);
      setIsAuthed(valid);
      
      if (!valid) {
        navigate("/login");
      } else {
        // 2. Perspective: On successful auth, check for a saved route
        const savedPath = localStorage.getItem("area51_last_path");
        
        // Only redirect if we are currently at the root "/"
        if (savedPath && location.pathname === "/") {
          navigate(savedPath);
        }
      }
    })();
  }, []);

  if (isAuthed === null) return (
    <div className="h-screen w-screen bg-black flex items-center justify-center font-mono text-[#45CC2D] animate-pulse uppercase tracking-[0.3em]">
      Verifying Credentials...
    </div>
  );

  return <Outlet />;
}