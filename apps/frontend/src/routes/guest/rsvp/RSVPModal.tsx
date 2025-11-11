
// File: apps/frontend/src/routes/guest/rsvp/RSVPModal.tsx
import React, { useState } from "react";
import Modal from "../../../components/Modal";

interface RSVPModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RSVPModal: React.FC<RSVPModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState("pending");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const guestId = localStorage.getItem("guest_user_id");
    try {
      const res = await fetch("/api/v1/rsvps/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_id: guestId, status }),
      });
      if (!res.ok) throw new Error("Failed to submit RSVP");
      alert("RSVP submitted ✅");
      onClose();
    } catch (err) {
      alert("Error submitting RSVP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="RSVP">
      <form onSubmit={handleSubmit} className="space-y-4">
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
      </form>
    </Modal>
  );
};

export default RSVPModal;
