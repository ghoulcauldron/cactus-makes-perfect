import { useState } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { sendAdminInvite, sendAdminNudge } from "../api/client";
import { renderInviteTemplate } from "../utils/renderInviteTemplate";

type Mode = "invite" | "nudge";
type InviteTemplate = "default" | "friendly";
type NudgeStyle = "area51" | "custom";

type Props = {
  mode: Mode;
  guestIds: string[];
  onClose: () => void;
  onSuccess?: () => void;
};

// --- Styles for Area 51 Nudge Generation ---
const A51_STYLES = {
  container: "background-color: #000000; color: #45CC2D; font-family: 'Courier New', Courier, monospace; padding: 40px 20px; text-align: center;",
  card: "max-width: 600px; margin: 0 auto; border: 2px solid #45CC2D; background-color: #0a0a0a; text-align: left;",
  header: "background-color: #45CC2D; color: #000000; padding: 10px 20px; font-weight: bold; text-transform: uppercase; font-size: 14px; letter-spacing: 2px;",
  body: "padding: 30px; font-size: 14px; line-height: 1.6;",
  footer: "border-top: 1px solid #45CC2D; padding: 10px 20px; font-size: 10px; text-transform: uppercase; color: #45CC2D; opacity: 0.7;"
};

function generateArea51Html(content: string) {
  const formattedContent = content.replace(/\n/g, "<br/>");

  return `
    <div style="${A51_STYLES.container}">
      <div style="${A51_STYLES.card}">
        <div style="${A51_STYLES.header}">
          /// INCOMING TRANSMISSION ///
        </div>
        <div style="${A51_STYLES.body}">
          ${formattedContent}
        </div>
        <div style="${A51_STYLES.footer}">
          SECURE LINE: ENCRYPTED
        </div>
      </div>
    </div>
  `;
}

// --- Dropdown Options Definitions ---
const INVITE_OPTIONS: { id: InviteTemplate; label: string }[] = [
  { id: 'default', label: 'Standard Invite (Area 51)' },
  { id: 'friendly', label: 'Friendly Reminder' },
];

const NUDGE_OPTIONS: { id: NudgeStyle; label: string }[] = [
  { id: 'area51', label: 'Area 51 Transmission (Templated)' },
  { id: 'custom', label: 'Custom HTML (Raw)' },
];

export default function SendCommunicationModal({
  mode,
  guestIds,
  onClose,
  onSuccess,
}: Props) {
  // Common
  const [subject, setSubject] = useState("");
  
  // Invite Mode State
  const [inviteTemplate, setInviteTemplate] = useState<InviteTemplate>("default");

  // Nudge Mode State
  const [nudgeStyle, setNudgeStyle] = useState<NudgeStyle>("area51");
  const [nudgeMessage, setNudgeMessage] = useState(""); 
  const [customHtml, setCustomHtml] = useState("");     
  const [customText, setCustomText] = useState("");     

  // Modal State
  const [isPreview, setIsPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Validation
  const canSubmit = mode === "invite"
    ? guestIds.length > 0
    : mode === "nudge" && nudgeStyle === "area51"
      ? subject.trim().length > 0 && nudgeMessage.trim().length > 0
      : subject.trim().length > 0 && guestIds.length > 0;

  async function handleSend() {
    if (!canSubmit || sending) return;
    setSending(true);

    try {
      for (const guestId of guestIds) {
        if (mode === "invite") {
          await sendAdminInvite(guestId, inviteTemplate);
        } else {
          // NUDGE LOGIC
          let finalHtml = "";
          let finalText = "";

          if (nudgeStyle === "area51") {
            finalHtml = generateArea51Html(nudgeMessage);
            finalText = nudgeMessage; 
          } else {
            finalHtml = customHtml;
            finalText = customText;
          }

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

      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      console.error("Send failed", err);
      alert("Failed to send. Check console for details.");
    } finally {
      setSending(false);
    }
  }

  function resetAndClose() {
    onClose();
  }

  // --- PREVIEW GENERATION ---
  function getPreviewHtml() {
    if (mode === "invite") {
      return renderInviteTemplate(inviteTemplate, subject, "", "");
    }
    if (nudgeStyle === "area51") {
      return generateArea51Html(nudgeMessage || "(No message content entered...)");
    }
    return customHtml || `<div style="padding:20px;color:#666;font-family:sans-serif;">No HTML content provided.</div>`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[600px] rounded-lg bg-black shadow-2xl border border-[#45CC2D]/30 text-white flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold uppercase tracking-tight text-[#45CC2D]">
              {mode === "invite" ? "Send Invite" : "Compose Nudge"}
            </h2>
            {mode === "nudge" && (
              <p className="text-[11px] text-gray-500 uppercase">
                Subject: <span className="text-gray-300">{subject || "..."}</span>
              </p>
            )}
          </div>
          <button className="text-gray-500 hover:text-white transition-colors text-xl" onClick={resetAndClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1 custom-scrollbar">

          {/* Controls: Template Selectors (Headless UI) */}
          {!isPreview && (
            <div className="space-y-4 mb-6">
              
              {/* INVITE TEMPLATE SELECTOR */}
              {mode === "invite" && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Invite Template</label>
                  <div className="relative">
                    <Listbox value={inviteTemplate} onChange={setInviteTemplate}>
                      <ListboxButton className="relative w-full cursor-default rounded border border-[#45CC2D] bg-black py-2 pl-3 pr-10 text-left text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#45CC2D] transition-all">
                        <span className="block truncate">
                          {INVITE_OPTIONS.find(o => o.id === inviteTemplate)?.label}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                        </span>
                      </ListboxButton>
                      <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#0a0a0a] border border-[#45CC2D] py-1 shadow-2xl focus:outline-none">
                        {INVITE_OPTIONS.map((option) => (
                          <ListboxOption
                            key={option.id}
                            value={option.id}
                            className={({ active }) => `
                              relative cursor-default select-none py-2 pl-10 pr-4 text-sm transition-colors
                              ${active ? 'bg-[#45CC2D] text-black' : 'text-gray-300'}
                            `}
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>
                                  {option.label}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                )}
                              </>
                            )}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Listbox>
                  </div>
                </div>
              )}

              {/* NUDGE STYLE SELECTOR */}
              {mode === "nudge" && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Nudge Style</label>
                  <div className="relative">
                    <Listbox value={nudgeStyle} onChange={setNudgeStyle}>
                      <ListboxButton className="relative w-full cursor-default rounded border border-[#45CC2D] bg-black py-2 pl-3 pr-10 text-left text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#45CC2D] transition-all">
                        <span className="block truncate">
                          {NUDGE_OPTIONS.find(o => o.id === nudgeStyle)?.label}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                        </span>
                      </ListboxButton>
                      <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#0a0a0a] border border-[#45CC2D] py-1 shadow-2xl focus:outline-none">
                        {NUDGE_OPTIONS.map((option) => (
                          <ListboxOption
                            key={option.id}
                            value={option.id}
                            className={({ active }) => `
                              relative cursor-default select-none py-2 pl-10 pr-4 text-sm transition-colors
                              ${active ? 'bg-[#45CC2D] text-black' : 'text-gray-300'}
                            `}
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>
                                  {option.label}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                )}
                              </>
                            )}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Listbox>
                  </div>
                </div>
              )}
            </div>
          )}

          {isPreview ? (
            /* PREVIEW MODE */
            <div className="space-y-4">
              <div className="border border-gray-800 rounded bg-white overflow-hidden h-[400px]">
                <iframe
                  title="Email Preview"
                  srcDoc={getPreviewHtml()}
                  className="w-full h-full border-none"
                />
              </div>
              {mode === "nudge" && nudgeStyle === "custom" && (
                <div className="bg-neutral-900 p-3 rounded border border-gray-800">
                  <label className="text-[10px] uppercase text-gray-500 block mb-1">Plain Text Fallback</label>
                  <p className="text-xs text-gray-300 whitespace-pre-wrap">{customText || "(Empty)"}</p>
                </div>
              )}
            </div>
          ) : (
            /* EDIT MODE */
            <div className="space-y-4">
              {/* Common Subject for Nudges */}
              {mode === "nudge" && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Subject Line</label>
                  <input
                    className="w-full bg-black border border-gray-800 text-white p-2 rounded text-sm focus:border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] outline-none"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={nudgeStyle === 'area51' ? "INCOMING TRANSMISSION..." : ""}
                  />
                </div>
              )}

              {/* Area 51 Simple Editor */}
              {mode === "nudge" && nudgeStyle === "area51" && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Message Content</label>
                  <textarea
                    className="w-full bg-black border border-gray-800 text-[#45CC2D] p-3 rounded text-sm h-[200px] font-mono resize-none focus:border-[#45CC2D] outline-none"
                    value={nudgeMessage}
                    onChange={(e) => setNudgeMessage(e.target.value)}
                    placeholder="Enter your message here. It will be wrapped in the secure transmission styling automatically."
                  />
                  <p className="text-[10px] text-gray-500 pt-1">* Newlines will be converted to breaks.</p>
                </div>
              )}

              {/* Custom HTML Editor */}
              {mode === "nudge" && nudgeStyle === "custom" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Plain Text Version</label>
                    <textarea
                      className="w-full bg-black border border-gray-800 text-white p-2 rounded text-sm h-[80px] resize-none focus:border-[#45CC2D] outline-none"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">HTML Code</label>
                    <textarea
                      className="w-full bg-black border border-gray-800 text-blue-300 p-2 rounded text-sm h-[180px] font-mono resize-none focus:border-[#45CC2D] outline-none"
                      value={customHtml}
                      onChange={(e) => setCustomHtml(e.target.value)}
                    />
                  </div>
                </>
              )}

              {mode === "invite" && (
                <p className="text-xs text-gray-400 border border-gray-800 p-3 rounded bg-neutral-900/50">
                  Ready to broadcast invite coordinates to <span className="text-[#45CC2D] font-bold">{guestIds.length}</span> recipient{guestIds.length !== 1 ? "s" : ""}.
                </p>
              )}
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
            {isPreview ? "← Back to Editor" : "👁 Preview"}
          </button>

          <div className="flex items-center gap-3">
            <button
              className="text-xs text-gray-500 hover:text-white uppercase font-bold"
              onClick={resetAndClose}
              disabled={sending}
            >
              Abort
            </button>

            <button
              className={`px-6 py-2 text-sm font-bold uppercase rounded transition-all
                ${
                  canSubmit && !sending
                    ? "bg-[#45CC2D] text-black hover:scale-105 active:scale-95"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
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