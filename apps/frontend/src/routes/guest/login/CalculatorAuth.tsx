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
    <div className="min-h-screen flex items-center justify-center bg-graphite relative overflow-hidden">
      <div className="rounded-3xl bg-graphite p-8 shadow-lg">
        <div className="rounded-2xl bg-pewter p-6 flex flex-col items-center space-y-6">
          <div className="w-full rounded-lg bg-black/90 px-6 py-4 font-segment text-5xl text-neon glow-neon text-center select-none">
            {code || "58008"}
          </div>
          <div className="grid grid-cols-3 gap-4 w-[350px]">
            {DIGITS.map((d) => {
              const isDelete = d === "←";
              const isSubmit = d === "✓";
              const baseClasses = "aspect-square flex items-center justify-center text-3xl font-bold rounded-2xl shadow-[inset_0_-6px_0_rgba(0,0,0,0.25)] transition-transform transform active:translate-y-[2px] select-none";
              let classes = "";
              if (isSubmit) {
                classes = "bg-neon text-white";
              } else if (isDelete) {
                classes = "bg-neon/90 text-white";
              } else {
                classes = "bg-tangerine text-black";
              }
              return (
                <button
                  key={d}
                  disabled={submitting}
                  onClick={() => press(d)}
                  className={`${baseClasses} ${classes}`}
                  type="button"
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {showInvalid && <InvalidCodeModal show={showInvalid} onClose={() => setShowInvalid(false)} />}
    </div>
  );
}