import React, { useState } from "react";
import { adminLogin } from "./api/client";

export default function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await adminLogin(password);
      if (!res?.token) {
        setError("ACCESS DENIED: INVALID CREDENTIALS");
        setLoading(false);
        return;
      }

      localStorage.setItem("admin_token", res.token);
      onLoginSuccess();
    } catch (err) {
      console.error(err);
      setError("SYSTEM ERROR: CONNECTION FAILED");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black font-mono p-6">
      {/* THE OUTER BOX - Mimicking the dashboard border style */}
      <div className="w-full max-w-sm border-4 border-[#45CC2D] bg-black shadow-[0_0_20px_rgba(69,204,45,0.2)]">
        
        {/* HEADER BAR */}
        <div className="border-b border-[#45CC2D] px-4 py-2 bg-[#45CC2D]/10">
          <h1 className="text-[#45CC2D] text-sm font-bold uppercase tracking-[0.2em]">
            Secure Terminal - Area 51
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-[#45CC2D] text-xs font-bold uppercase tracking-widest">
                Enter Admin Password
              </label>
              <input
                type="password"
                className="bg-black border-2 border-[#45CC2D]/40 text-[#45CC2D] px-4 py-3 rounded-none focus:border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] outline-none transition-all placeholder:text-[#45CC2D]/20"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="border border-red-900 bg-red-950/20 p-2">
                <p className="text-red-500 text-[10px] font-bold uppercase text-center animate-pulse">
                  {error}
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 font-bold uppercase tracking-[0.3em] transition-all
              ${loading 
                ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                : "bg-[#45CC2D] text-black hover:bg-black hover:text-[#45CC2D] border-2 border-transparent hover:border-[#45CC2D] active:scale-95"}
            `}
          >
            {loading ? "Authorizing..." : "Initialize"}
          </button>

          <div className="pt-4 border-t border-[#45CC2D]/20">
            <p className="text-[9px] text-gray-600 text-center uppercase tracking-tighter">
              Authorized Personnel Only. <br />
              All activity is logged and monitored.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}