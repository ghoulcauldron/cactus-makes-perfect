import React, { useState } from "react";
import { sendAdminNudge } from "./api/client";

interface BulkActionsProps {
  selectedIds: string[];
  clearSelection: () => void;
  currentGroup?: string | null;
}

export default function BulkActions({
  selectedIds,
  clearSelection,
  currentGroup,
}: BulkActionsProps) {
  const [showNudge, setShowNudge] = useState(false);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [html, setHtml] = useState("");
  const [sending, setSending] = useState(false);

  const hasSelection = selectedIds.length > 0;
  const canNudgeGroup = Boolean(currentGroup) && !hasSelection;

  const canSubmit = subject.trim() !== "" && (text.trim() !== "" || html.trim() !== "");

  async function handleSend() {
    if (!canSubmit || sending) return;
    setSending(true);
    try {
      if (hasSelection) {
        await sendAdminNudge(selectedIds, subject, html, text);
        clearSelection();
      } else if (currentGroup) {
        await sendAdminNudge(["GROUP:" + currentGroup], subject, html, text);
      }
      setShowNudge(false);
      setSubject("");
      setText("");
      setHtml("");
    } catch (e) {
      alert("Failed to send nudge.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center gap-3 font-mono">
      {canNudgeGroup && (
        <button
          className="px-3 py-1 border border-primary text-primary text-xs uppercase tracking-tighter hover:bg-[#9ae68c] hover:text-surface transition-colors"
          onClick={() => setShowNudge(true)}
        >
          Nudge Group: {currentGroup}
        </button>
      )}

      {hasSelection && (
        <button
          className="px-3 py-1 border border-[#45CC2D] bg-black text-[#45CC2D] text-xs font-bold uppercase tracking-tighter hover:bg-[#9ae68c] hover:text-surface transition-colors"
          onClick={() => setShowNudge(true)}
        >
          Nudge Selected ({selectedIds.length})
        </button>
      )}

      {showNudge && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-[520px] rounded-lg bg-black shadow-2xl border border-[#45CC2D]/30 text-white">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-white uppercase tracking-tight">Send System Nudge</h2>
                <p className="text-sm text-gray-500 text-balance">
                  {hasSelection 
                    ? `Dispatching to ${selectedIds.length} selected recipients.` 
                    : `Dispatching to all members of ${currentGroup}.`}
                </p>
              </div>
              <button 
                className="text-gray-500 hover:text-white transition-colors" 
                onClick={() => setShowNudge(false)}
              >✕</button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Subject Line</label>
                <input
                  className="w-full bg-black border border-gray-800 text-white p-2 rounded text-sm focus:border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] outline-none transition-all"
                  placeholder="Inquiry regarding RSVP status..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Plain Text Content</label>
                <textarea
                  className="w-full bg-black border border-gray-800 text-white p-2 rounded text-sm h-[80px] focus:border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] outline-none transition-all resize-none"
                  placeholder="Standard text version..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">HTML Template</label>
                <textarea
                  className="w-full bg-black border border-gray-800 text-white p-2 rounded text-sm h-[120px] focus:border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] outline-none transition-all font-mono resize-none"
                  placeholder="<html>...</html>"
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800 bg-neutral-900/30">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {sending ? "Transmission in progress" : "Ready for dispatch"}
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  className="text-sm text-gray-400 hover:text-white transition-colors uppercase font-bold" 
                  onClick={() => setShowNudge(false)}
                  disabled={sending}
                >
                  Abort
                </button>
                <button
                  className={`px-6 py-2 text-sm font-bold rounded transition-all uppercase
                    ${canSubmit && !sending
                      ? "bg-[#45CC2D] text-black hover:scale-105 active:scale-95" 
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"}
                  `}
                  onClick={handleSend}
                  disabled={!canSubmit || sending}
                >
                  {sending ? "Sending..." : "Confirm Send"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}