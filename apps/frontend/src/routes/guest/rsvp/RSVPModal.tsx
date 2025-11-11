import React, { useState, useEffect } from "react";
import Modal from "../../../components/Modal";

interface RSVPModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RSVPModal: React.FC<RSVPModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState("pending");
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchSavedRSVP = async () => {
      if (!isOpen) return;
      const guestId = localStorage.getItem("guest_user_id");
      if (!guestId) return;
      try {
        const res = await fetch(`/api/v1/rsvps/me/${guestId}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.rsvp?.status) {
            setSavedStatus(data.rsvp.status);
            setStatus(data.rsvp.status);
          }
        }
      } catch (err) {
        console.error("Failed to fetch saved RSVP", err);
      }
    };
    fetchSavedRSVP();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const guestId = localStorage.getItem("guest_user_id");
    console.log("Submitting RSVP for", guestId, status);
    try {
      const res = await fetch("/api/v1/rsvps/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_id: guestId, status }),
      });
      if (!res.ok) throw new Error("Failed to submit RSVP");
      setSubmitted(true);
      setSavedStatus(status);
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      alert("Error submitting RSVP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="RSVP">
      <form onSubmit={handleSubmit} className="space-y-4">
        {savedStatus && !submitted && (
          <p className="text-sm text-gray-600 italic">
            Your current response: <span className="font-medium">{savedStatus}</span>
          </p>
        )}
        <label className="block text-gray-700 font-medium">
          Will you attend?
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-2 w-full border border-gray-300 rounded-md p-2"
          >
            <option value="yes">Yes, I’ll be there!</option>
            <option value="no">No, I can’t make it</option>
            <option value="pending">Maybe / Not sure yet</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-cactus-green text-white py-3 rounded-md hover:bg-cactus-green-dark transition"
        >
          {submitting ? "Submitting..." : "Submit RSVP"}
        </button>

        {submitted && (
          <p className="text-center text-green-600 font-semibold mt-3">
            ✅ RSVP saved. You can update your response anytime.
          </p>
        )}
      </form>
    </Modal>
  );
};

export default RSVPModal;
