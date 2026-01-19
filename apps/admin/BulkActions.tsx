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

  const hasSelection = selectedIds.length > 0;
  const canNudgeGroup = Boolean(currentGroup) && !hasSelection;

  async function sendNudgeNow() {
    if (selectedIds.length === 0) return;

    await sendAdminNudge(selectedIds, subject, html, text);
    clearSelection();
    setShowNudge(false);
    alert("Nudge emails sent!");
  }

  async function sendGroupNudge() {
    if (!currentGroup) return;
    await sendAdminNudge(["GROUP:" + currentGroup], subject, html, text);
    setShowNudge(false);
    alert("Group nudge sent!");
  }

  return (
    <div className="flex items-center gap-3">

      {canNudgeGroup && (
        <button
          className="px-3 py-1 border rounded bg-blue-50"
          onClick={() => setShowNudge(true)}
        >
          Nudge Entire Group: {currentGroup}
        </button>
      )}

      {hasSelection && (
        <button
          className="px-3 py-1 border rounded"
          onClick={() => setShowNudge(true)}
        >
          Nudge Selected Guests ({selectedIds.length})
        </button>
      )}

      {showNudge && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-xl w-[420px]">
            <h2 className="font-semibold text-lg mb-4">Send Nudge</h2>

            <input
              className="w-full border p-2 rounded mb-3"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <textarea
              className="w-full border p-2 rounded mb-3 h-[80px]"
              placeholder="Plain text version"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <textarea
              className="w-full border p-2 rounded mb-4 h-[120px]"
              placeholder="HTML version"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setShowNudge(false)}
              >
                Cancel
              </button>

              {currentGroup && !hasSelection && (
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={sendGroupNudge}
                >
                  Send to Group
                </button>
              )}

              <button
                className="px-3 py-1 bg-black text-white rounded"
                onClick={sendNudgeNow}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}