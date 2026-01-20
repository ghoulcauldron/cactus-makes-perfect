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
  const [isPreview, setIsPreview] = useState(false); // New state for toggle
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
      resetForm();
    } catch (e) {
      alert("Failed to send nudge.");
    } finally {
      setSending(false);
    }
  }

  function resetForm() {
    setShowNudge(false);
    setIsPreview(false);
    setSubject("");
    setText("");
    setHtml("");
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[600px] rounded-lg bg-black shadow-2xl border border-[#45CC2D]/30 text-white flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-white uppercase tracking-tight">
                  {isPreview ? "🔍 Previewing Nudge" : "📧 Compose Nudge"}
                </h2>
                <p className="text-[11px] text-gray-500 uppercase">
                  Subject: <span className="text-gray-300">{subject || "(No Subject)"}</span>
                </p>
              </div>
              <button 
                className="text-gray-500 hover:text-white transition-colors text-xl" 
                onClick={resetForm}
              >✕</button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 overflow-y-auto flex-1 custom-scrollbar">
              {isPreview ? (
                /* PREVIEW MODE */
                <div className="space-y-4">
                  <div className="border border-gray-800 rounded bg-white overflow-hidden h-[400px]">
                    <iframe
                      title="Email Preview"
                      srcDoc={html || `<div style="font-family:sans-serif;padding:20px;color:#666;">No HTML content provided. Only plain text will be sent.</div>`}
                      className="w-full h-full border-none"
                    />
                  </div>
                  <div className="bg-neutral-900 p-3 rounded border border-gray-800">
                    <label className="text-[10px] uppercase text-gray-500 block mb-1">Plain Text Fallback</label>
                    <p className="text-xs text-gray-300 whitespace-pre-wrap">{text || "(Empty)"}</p>
                  </div>
                </div>
              ) : (
                /* EDIT MODE */
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Subject Line</label>
                    <input
                      className="w-full bg-black border border-gray-800 text-white p-2 rounded text-sm focus:border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] outline-none transition-all"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Plain Text Version</label>
                    <textarea
                      className="w-full bg-black border border-gray-800 text-white p-2 rounded text-sm h-[80px] focus:border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] outline-none transition-all resize-none"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">HTML Template</label>
                    <textarea
                      className="w-full bg-black border border-gray-800 text-[#45CC2D] p-2 rounded text-sm h-[180px] focus:border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] outline-none transition-all font-mono resize-none"
                      value={html}
                      onChange={(e) => setHtml(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800 bg-neutral-900/30">
              <button
                type="button"
                className="text-xs font-bold uppercase text-[#45CC2D] hover:underline"
                onClick={() => setIsPreview(!isPreview)}
              >
                {isPreview ? "← Back to Editor" : "👁 Preview HTML"}
              </button>
              
              <div className="flex items-center gap-3">
                <button 
                  className="text-xs text-gray-500 hover:text-white transition-colors uppercase font-bold" 
                  onClick={resetForm}
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
                  {sending ? "Sending..." : "Confirm Dispatch"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}