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
        throw new Error("Invalid passcode");
        }
        const data = await res.json();
        if (data?.token) {
        try { localStorage.setItem("auth_token", data.token); } catch {}
        }
        window.location.assign("/guest/welcome");
    } catch (err) {
        setShowInvalid(true);
        setSubmitting(false);
    }
    };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cactus-sand relative overflow-hidden">
      {/* risograph grain overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10"></div>

      <div className="z-10 w-full max-w-md mx-auto text-center px-6 py-10">
        <h1 className="text-4xl font-display text-cactus-green drop-shadow-sm mb-2">
          Enter Your Code
        </h1>
        <p className="text-sm text-gray-700 mb-6">
          We sent a code to <span className="font-bold">{email}</span>
        </p>

        {/* code display */}
        <div className="flex justify-center gap-2 mb-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-10 h-14 rounded-md border-2 flex items-center justify-center text-2xl font-mono 
              ${i < code.length ? "bg-sunset border-sunset text-white" : "border-cactus-green bg-white"}`}
            >
              {code[i] || ""}
            </div>
          ))}
        </div>

        {/* existing calculator UI */}
        <InvalidCodeModal show={showInvalid} onClose={() => setShowInvalid(false)} />

        {/* keypad */}
        <div className="grid grid-cols-3 gap-4">
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
  );
}