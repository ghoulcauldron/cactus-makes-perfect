import { useState } from "react";
import { sendAdminInvite, sendAdminNudge } from "../api/client";
import { renderInviteTemplate } from "../utils/renderInviteTemplate";

type Mode = "invite" | "nudge";
type InviteTemplate = "default" | "friendly";

type Props = {
  mode: Mode;
  guestIds: string[];
  onClose: () => void;
  onSuccess?: () => void;
};

export default function SendCommunicationModal({
  mode,
  guestIds,
  onClose,
  onSuccess,
}: Props) {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [inviteTemplate, setInviteTemplate] =
    useState<InviteTemplate>("default");

  const [isPreview, setIsPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit =
    mode === "invite"
      ? guestIds.length > 0
      : subject.trim().length > 0 && guestIds.length > 0;

  async function handleSend() {
    if (!canSubmit || sending) return;

    setSending(true);

    try {
      for (const guestId of guestIds) {
        if (mode === "invite") {
          await sendAdminInvite(guestId, inviteTemplate);
        } else {
          await sendAdminNudge({
            guestId,
            subject,
            html,
            text,
          });
        }
      }

      setSent(true);

      onSuccess?.();

      // brief success state, then close
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[600px] rounded-lg bg-black shadow-2xl border border-[#45CC2D]/30 text-white flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold uppercase tracking-tight">
              {mode === "invite" ? "Send Invite" : "Compose Nudge"}
            </h2>

            {mode === "nudge" && (
              <p className="text-[11px] text-gray-500 uppercase">
                Subject:{" "}
                <span className="text-gray-300">
                  {subject || "(No Subject)"}
                </span>
              </p>
            )}
          </div>

          <button
            className="text-gray-500 hover:text-white transition-colors text-xl"
            onClick={resetAndClose}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1 custom-scrollbar">

          {/* Invite-only controls */}
          {mode === "invite" && !isPreview && (
            <div className="space-y-1 mb-4">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Invite Template
              </label>
              <select
                value={inviteTemplate}
                onChange={(e) =>
                  setInviteTemplate(e.target.value as InviteTemplate)
                }
                className="w-full bg-black border border-gray-800 text-white p-2 text-sm"
              >
                <option value="default">Standard Invite</option>
                <option value="friendly">Friendly Reminder</option>
              </select>
            </div>
          )}

          {isPreview ? (
            /* PREVIEW MODE */
            <div className="space-y-4">
              <div className="border border-gray-800 rounded bg-white overflow-hidden h-[400px]">
                <iframe
                  title="Email Preview"
                  srcDoc={
                    mode === "invite"
                      ? renderInviteTemplate(
                          inviteTemplate,
                          subject,
                          html,
                          text
                        )
                      : html ||
                        `<div style="font-family:sans-serif;padding:20px;color:#666;">No HTML content provided.</div>`
                  }
                  className="w-full h-full border-none"
                />
              </div>

              {mode === "nudge" && (
                <div className="bg-neutral-900 p-3 rounded border border-gray-800">
                  <label className="text-[10px] uppercase text-gray-500 block mb-1">
                    Plain Text Fallback
                  </label>
                  <p className="text-xs text-gray-300 whitespace-pre-wrap">
                    {text || "(Empty)"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* EDIT MODE */
            <div className="space-y-4">

              {mode === "nudge" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                      Subject Line
                    </label>
                    <input
                      className="w-full bg-black border border-gray-800 text-white p-2 rounded text-sm focus:border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] outline-none"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                      Plain Text Version
                    </label>
                    <textarea
                      className="w-full bg-black border border-gray-800 text-white p-2 rounded text-sm h-[80px] resize-none"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                      HTML Template
                    </label>
                    <textarea
                      className="w-full bg-black border border-gray-800 text-[#45CC2D] p-2 rounded text-sm h-[180px] font-mono resize-none"
                      value={html}
                      onChange={(e) => setHtml(e.target.value)}
                    />
                  </div>
                </>
              )}

              {mode === "invite" && (
                <p className="text-xs text-gray-400">
                  This will send an invite to{" "}
                  <span className="text-white font-semibold">
                    {guestIds.length}
                  </span>{" "}
                  guest{guestIds.length !== 1 ? "s" : ""}.
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
              {sending
                ? "Sending..."
                : sent
                ? "✓ Sent"
                : "Confirm Dispatch"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}