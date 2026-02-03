import React, { useState, useEffect } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import Modal from "../../../components/Modal";

// --- FIX: TYPE WORKAROUNDS ---
// 1. Cast Icons to any to fix "bigint not assignable to ReactNode"
const ChevronIcon = ChevronUpDownIcon as any;
const CheckTickIcon = CheckIcon as any;

// 2. Cast Headless UI components to any to fix "children not assignable to never"
const ListboxAny = Listbox as any;
const ListboxButtonAny = ListboxButton as any;
const ListboxOptionAny = ListboxOption as any;
const ListboxOptionsAny = ListboxOptions as any;

interface RSVPModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- CONFIG: RSVP OPTIONS ---
const RSVP_OPTIONS = [
  { id: 'yes', label: 'AFFIRMATIVE // ATTENDANCE CONFIRMED' },
  { id: 'no', label: 'NEGATIVE // MISSION ABORT' },
  { id: 'pending', label: 'PENDING // CALCULATING TRAJECTORY' },
];

const RSVPModal: React.FC<RSVPModalProps> = ({ isOpen, onClose }) => {
  // State
  const [status, setStatus] = useState("pending");
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Logic
  useEffect(() => {
    const fetchSavedRSVP = async () => {
      if (!isOpen) return;
      setLoading(true);
      const guestId = localStorage.getItem("guest_user_id");
      if (!guestId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/v1/rsvps/me/${guestId}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.rsvp?.status) {
            setSavedStatus(data.rsvp.status);
            setStatus(data.rsvp.status);
            setEditing(false);
          } else {
            setEditing(true); // No previous RSVP, go straight to edit
          }
        }
      } catch (err) {
        console.error("Failed to fetch saved RSVP", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSavedRSVP();
  }, [isOpen]);

  // Submit Logic
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    
    const guestId = localStorage.getItem("guest_user_id");
    
    try {
      const res = await fetch("/api/v1/rsvps/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_id: guestId, status }),
      });
      if (!res.ok) throw new Error("Failed to submit RSVP");
      
      setSubmitted(true);
      setSavedStatus(status);
      setEditing(false);
      
      // Reset success message after delay
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      alert("Error submitting RSVP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to format status label
  const getStatusLabel = (s: string) => {
    return RSVP_OPTIONS.find((o) => o.id === s)?.label || s.toUpperCase();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SECURE TERMINAL">
      <div className="font-mono text-[#45CC2D] bg-black p-1">
        
        {/* LOADING STATE */}
        {loading ? (
          <div className="py-12 text-center animate-pulse space-y-2">
            <p className="text-lg tracking-widest">/// ESTABLISHING CONNECTION ///</p>
            <p className="text-xs opacity-70">DECRYPTING USER DATA...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* --- HEADER --- */}
            <div className="border-b border-[#45CC2D]/30 pb-4 text-center">
              <h2 className="text-xl font-bold tracking-[0.2em] uppercase">
                Protocol: RSVP
              </h2>
              <p className="text-[10px] text-[#45CC2D]/70 mt-1">
                PLEASE CONFIRM TRAJECTORY DATA FOR AUGUST 2026
              </p>
            </div>

            {/* --- VIEW STATE (READ ONLY) --- */}
            {!editing && savedStatus ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border border-[#45CC2D] bg-[#0a0a0a] p-6 text-center shadow-[0_0_15px_rgba(69,204,45,0.1)]">
                  <p className="text-[10px] uppercase tracking-widest text-[#45CC2D]/60 mb-2">
                    Current Status Record
                  </p>
                  <p className="text-lg font-bold tracking-tight">
                    {getStatusLabel(savedStatus)}
                  </p>
                  {submitted && (
                    <p className="text-xs mt-3 text-white bg-[#45CC2D]/20 inline-block px-2 py-1 rounded">
                      ✓ DATA UPLOADED SUCCESSFULLY
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setEditing(true)}
                  className="w-full border border-[#45CC2D] bg-transparent text-[#45CC2D] py-3 text-sm font-bold uppercase tracking-widest hover:bg-[#45CC2D] hover:text-black transition-all"
                >
                  Modify Data
                </button>
              </div>
            ) : (
              /* --- EDIT STATE (FORM) --- */
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* SELECTOR */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#45CC2D]/80">
                    Select Trajectory
                  </label>
                  
                  <div className="relative">
                    {/* Use ListboxAny to bypass Type Errors */}
                    <ListboxAny value={status} onChange={(val: string) => setStatus(val)}>
                      <ListboxButtonAny className="relative w-full cursor-pointer border border-[#45CC2D] bg-black py-3 pl-4 pr-10 text-left text-sm text-[#45CC2D] focus:outline-none focus:ring-1 focus:ring-[#45CC2D] focus:shadow-[0_0_10px_rgba(69,204,45,0.3)] transition-all">
                        <span className="block truncate font-bold">
                          {getStatusLabel(status)}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronIcon className="h-5 w-5 text-[#45CC2D]" aria-hidden="true" />
                        </span>
                      </ListboxButtonAny>

                      <ListboxOptionsAny className="absolute z-50 mt-1 max-h-60 w-full overflow-auto border border-[#45CC2D] bg-black py-1 text-base shadow-2xl focus:outline-none sm:text-sm">
                        {RSVP_OPTIONS.map((option) => (
                          <ListboxOptionAny
                            key={option.id}
                            value={option.id}
                            className={({ active }: any) => `
                              relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors
                              ${active ? 'bg-[#45CC2D] text-black' : 'text-[#45CC2D]'}
                            `}
                          >
                            {({ selected }: any) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>
                                  {option.label}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <CheckTickIcon className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                )}
                              </>
                            )}
                          </ListboxOptionAny>
                        ))}
                      </ListboxOptionsAny>
                    </ListboxAny>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="pt-4 space-y-3">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`w-full py-3 text-sm font-bold uppercase tracking-widest transition-all border
                      ${submitting 
                        ? "bg-[#45CC2D]/20 border-[#45CC2D] text-[#45CC2D] cursor-wait" 
                        : "bg-[#45CC2D] border-[#45CC2D] text-black hover:bg-[#3bb026] hover:scale-[1.02]"
                      }`}
                  >
                    {submitting ? "TRANSMITTING..." : "TRANSMIT DATA"}
                  </button>

                  {savedStatus && (
                    <button
                      onClick={() => {
                        setEditing(false);
                        setStatus(savedStatus); // Reset to saved status on cancel
                      }}
                      disabled={submitting}
                      className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-[#45CC2D]/60 hover:text-[#45CC2D] transition-colors"
                    >
                      [ CANCEL UPDATE ]
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* FOOTER */}
            <div className="text-[9px] text-center text-[#45CC2D]/40 uppercase pt-4 border-t border-[#45CC2D]/20">
              Session ID: {localStorage.getItem("guest_user_id")?.split('-')[0] || "UNKNOWN"}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RSVPModal;