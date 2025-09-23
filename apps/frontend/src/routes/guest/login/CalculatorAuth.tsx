import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InvalidCodeModal from "./InvalidCodeModal";

const DIGITS = ["1","2","3","4","5","6","7","8","9","←","0","✓"];

export default function CalculatorAuth() {
  const url = new URL(window.location.href);
  const email = url.searchParams.get("email") || "your email";

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const press = (d: string) => {
    if (d === "←") return setCode(code.slice(0, -1));
    if (d === "✓") return submit();
    if (/\d/.test(d) && code.length < 6) setCode(code + d);
  };

    const [showInvalid, setShowInvalid] = useState(false);

    const submit = async () => {
    if (code.length < 4) return;
    setSubmitting(true);

    try {
        const token = url.searchParams.get("token") || "";
        const res = await fetch("/api/v1/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, code }),
        });

        if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || `Request failed: ${res.status}`);
        }

        const data = await res.json();

        // Persist any backend token (optional)
        if (data?.token) {
        try {
            localStorage.setItem("auth_token", data.token);
        } catch {}
        }

        // ✅ Mark successful one-time auth
        try {
        localStorage.setItem("auth_ok", "true");
        } catch {}

        // ✅ Replace history so Back doesn't return to calculator/root
        window.location.replace("/guest/welcome");
    } catch (err: any) {
        // ❌ Instead of alert, show the whimsical modal
        setShowInvalid(true);
        setSubmitting(false);
    }
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cactus-sand relative overflow-hidden">
      {/* risograph grain overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10"></div>

      <div className="relative z-10 w-[350px] rounded-3xl bg-cactus-green/10 backdrop-blur-sm shadow-2xl">
        <div className="border-8 border-cactus-green rounded-3xl p-6">
          <div className="bg-cactus-green rounded-2xl p-8 flex flex-col items-center">
            <div className="w-full mb-6">
              <div className="flex justify-center gap-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-12 h-16 rounded-lg border-4 flex items-center justify-center text-3xl font-mono 
                      ${i < code.length ? "bg-sunset border-sunset text-white" : "border-cactus-green bg-white"}`}
                  >
                    {code[i] || ""}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-sm text-cactus-green/80">
                Code sent to <span className="font-semibold">{email}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full">
              {DIGITS.map((d) => (
                <button
                  key={d}
                  disabled={submitting}
                  onClick={() => press(d)}
                  className={`aspect-square flex items-center justify-center text-3xl font-bold rounded-2xl shadow-md 
                    transition-transform transform active:scale-95
                    ${
                      d === "✓"
                        ? "bg-cactus-green text-white hover:bg-cactus-green/80"
                        : d === "←"
                        ? "bg-sky text-white hover:bg-sky/80"
                        : "bg-sunset text-white hover:bg-sunset/80"
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showInvalid && <InvalidCodeModal show={showInvalid} onClose={() => setShowInvalid(false)} />}
    </div>
  );
}