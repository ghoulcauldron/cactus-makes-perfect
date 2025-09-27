import { useState } from "react";

export default function RSVP() {
  const [status, setStatus] = useState<"yes" | "no" | "pending">("pending");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const auth_token = localStorage.getItem("auth_token");
    const guest_user_id = localStorage.getItem("guest_user_id");

    try {
      const response = await fetch("/api/v1/rsvps/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: guest_user_id, status }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit RSVP");
      }

      alert("RSVP submitted ✅");
    } catch (error) {
      alert("Error submitting RSVP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cactus-sand relative overflow-hidden">
      {/* risograph grain overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10"></div>

      <div className="z-10 w-full max-w-lg mx-auto text-center px-6 py-12">
        <h1 className="text-4xl font-display text-cactus-green mb-6 drop-shadow-sm">
          RSVP
        </h1>
        <p className="mb-8 text-gray-800">
          Please let us know if you’ll be joining our celebration 🌞
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white/90 rounded-2xl shadow-lg p-8 flex flex-col gap-6"
        >
          {/* RSVP status buttons */}
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => setStatus("yes")}
              className={`px-6 py-3 rounded-xl font-bold shadow-md transition
                ${
                  status === "yes"
                    ? "bg-cactus-green text-white"
                    : "bg-white border-2 border-cactus-green text-cactus-green hover:bg-cactus-green/10"
                }`}
            >
              Yes 🌵
            </button>
            <button
              type="button"
              onClick={() => setStatus("no")}
              className={`px-6 py-3 rounded-xl font-bold shadow-md transition
                ${
                  status === "no"
                    ? "bg-sunset text-white"
                    : "bg-white border-2 border-sunset text-sunset hover:bg-sunset/10"
                }`}
            >
              No 🌵
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-4 rounded-xl bg-sky text-white text-lg font-bold shadow-md hover:bg-sky/80 transition disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Submit RSVP"}
          </button>
        </form>
      </div>

      <footer className="absolute bottom-4 text-sm text-gray-600 font-mono opacity-80">
        🌵 Cactus Makes Perfect • Santa Fe
      </footer>
    </div>
  );
}
