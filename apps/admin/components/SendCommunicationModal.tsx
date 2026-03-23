import { useState } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { sendAdminSurvey, sendAdminNudge } from "../api/client";
import { renderSurveyTemplate } from "../utils/renderSurveyTemplate";

type Mode = "invite" | "nudge";
type NudgeStyle = "area51" | "custom";

type Props = {
  mode: Mode;
  guestIds: string[];
  onClose: () => void;
  onSuccess?: () => void;
};

// --- Styles for Synaptic Email Generation (Used for actual email HTML) ---
const SYNAPTIC_STYLES = {
  container: "background-color: #020617; color: #cf4aff; font-family: 'Courier New', Courier, monospace; padding: 40px 20px; text-align: center;",
  card: "max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.2); background-color: #000000; border-radius: 40px; text-align: left; overflow: hidden;",
  header: "background-color: rgba(0,255,255,0.1); color: #00ffff; padding: 15px 20px; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 4px; border-bottom: 1px solid rgba(0,255,255,0.2);",
  body: "padding: 40px 30px; font-size: 14px; line-height: 1.6;",
};

function generateSynapticHtml(content: string) {
  const formattedContent = content.replace(/\n/g, "<br/>");
  return `
    <div style="${SYNAPTIC_STYLES.container}">
      <div style="${SYNAPTIC_STYLES.card}">
        <div style="${SYNAPTIC_STYLES.header}">/// TRANSMISSION_INBOUND ///</div>
        <div style="${SYNAPTIC_STYLES.body}">${formattedContent}</div>
      </div>
    </div>
  `;
}

const NUDGE_OPTIONS: { id: NudgeStyle; label: string }[] = [
  { id: 'area51', label: 'Synaptic Transmission (Templated)' },
  { id: 'custom', label: 'Custom HTML (Raw)' },
];

export default function SendCommunicationModal({
  mode,
  guestIds,
  onClose,
  onSuccess,
}: Props) {
  const [subject, setSubject] = useState("");
  const [nudgeStyle, setNudgeStyle] = useState<NudgeStyle>("area51");
  const [nudgeMessage, setNudgeMessage] = useState(""); 
  const [customHtml, setCustomHtml] = useState("");     
  const [customText, setCustomText] = useState("");     

  const [isPreview, setIsPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit = mode === "invite"
    ? guestIds.length > 0
    : nudgeStyle === "area51"
      ? subject.trim().length > 0 && nudgeMessage.trim().length > 0
      : subject.trim().length > 0 && guestIds.length > 0;

  async function handleSend() {
    if (!canSubmit || sending) return;
    setSending(true);

    try {
      for (const guestId of guestIds) {
        if (mode === "invite") {
          // Survey mode uses 'default' template ID but backend is patched for Survey
          await sendAdminSurvey(guestId); 
        } else {
          let finalHtml = nudgeStyle === "area51" ? generateSynapticHtml(nudgeMessage) : customHtml;
          let finalText = nudgeMessage || customText;

          await sendAdminNudge({
            guestId,
            subject,
            html: finalHtml,
            text: finalText,
          });
        }
      }
      setSent(true);
      onSuccess?.();
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error("Send failed", err);
      alert("Failed to send.");
    } finally {
      setSending(false);
    }
  }

  function getPreviewHtml() {
    if (mode === "invite") {
      return renderSurveyTemplate("123456", "#");
    }
    if (nudgeStyle === "area51") {
      return generateSynapticHtml(nudgeMessage || "(No message content entered...)");
    }
    return customHtml || `<div style="padding:20px;color:#666;">No HTML provided.</div>`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Container retains AREA 51 Green styling */}
      <div className="w-full max-w-[600px] rounded-lg bg-black shadow-2xl border border-[#45CC2D]/30 text-white flex flex-col max-h-[90vh]">

        {/* Header (Green) */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold uppercase tracking-tight text-[#45CC2D]">
              {mode === "invite" ? "Broadcast Survey" : "Neural Nudge"}
            </h2>
          </div>
          <button className="text-gray-500 hover:text-white transition-colors text-xl" onClick={onClose}>✕</button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 custom-scrollbar">
          {!isPreview && (
            <div className="space-y-4 mb-6">
              {/* NUDGE STYLE SELECTOR (Green) */}
              {mode === "nudge" && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Nudge Style</label>
                  <Listbox value={nudgeStyle} onChange={setNudgeStyle}>
                    <ListboxButton className="relative w-full rounded border border-[#45CC2D] bg-black py-2 pl-3 pr-10 text-left text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#45CC2D]">
                      <span className="block truncate">{NUDGE_OPTIONS.find(o => o.id === nudgeStyle)?.label}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                      </span>
                    </ListboxButton>
                    <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#0a0a0a] border border-[#45CC2D] py-1 shadow-2xl focus:outline-none">
                      {NUDGE_OPTIONS.map((option) => (
                        <ListboxOption key={option.id} value={option.id} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 text-sm transition-colors ${active ? 'bg-[#45CC2D] text-black' : 'text-gray-300'}`}>
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>{option.label}</span>
                              {selected && <span className="absolute inset-y-0 left-0 flex items-center pl-3"><CheckIcon className="h-4 w-4" /></span>}
                            </>
                          )}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Listbox>
                </div>
              )}

              {/* Subject Input (Green Focus) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Subject Line</label>
                <input
                  className="w-full bg-black border border-gray-800 text-white p-2 rounded text-sm focus:border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] outline-none"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={mode === 'invite' ? "NEURAL_IMPRINT_REQUIRED..." : "INCOMING TRANSMISSION..."}
                />
              </div>

              {/* Message Content (Green Border) */}
              {mode === "nudge" && nudgeStyle === "area51" && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Message Data</label>
                  <textarea
                    className="w-full bg-black border border-gray-800 text-[#45CC2D] p-3 rounded text-sm h-[200px] font-mono resize-none focus:border-[#45CC2D] outline-none"
                    value={nudgeMessage}
                    onChange={(e) => setNudgeMessage(e.target.value)}
                  />
                </div>
              )}

              {mode === "invite" && (
                <p className="text-xs text-gray-400 border border-gray-800 p-3 rounded bg-neutral-900/50">
                  Ready to broadcast survey link to <span className="text-[#45CC2D] font-bold">{guestIds.length}</span> recipient{guestIds.length !== 1 ? "s" : ""}.
                </p>
              )}
            </div>
          )}

          {isPreview && (
            <div className="border border-gray-800 rounded bg-white overflow-hidden h-[400px]">
              <iframe title="Email Preview" srcDoc={getPreviewHtml()} className="w-full h-full border-none" />
            </div>
          )}
        </div>

        {/* Footer (Green Actions) */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800 bg-neutral-900/30">
          <button type="button" className="text-xs font-bold uppercase text-[#45CC2D] hover:underline" onClick={() => setIsPreview(!isPreview)}>
            {isPreview ? "← Back to Editor" : "👁 Preview Transmission"}
          </button>

          <div className="flex items-center gap-3">
            <button className="text-xs text-gray-500 hover:text-white uppercase font-bold" onClick={onClose} disabled={sending}>Abort</button>
            <button
              className={`px-6 py-2 text-sm font-bold uppercase rounded transition-all ${canSubmit && !sending ? "bg-[#45CC2D] text-black hover:scale-105" : "bg-gray-800 text-gray-500 cursor-not-allowed"}`}
              onClick={handleSend}
              disabled={!canSubmit || sending}
            >
              {sending ? "Transmitting..." : sent ? "✓ Sent" : "Confirm Dispatch"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}