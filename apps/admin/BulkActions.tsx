import React, { useState } from "react";
import SendCommunicationModal from "./components/SendCommunicationModal";

interface BulkActionsProps {
  selectedIds: string[];
  clearSelection: () => void;
  currentGroup?: string | null;
}

type ActionMode = "nudge" | "invite";

export default function BulkActions({
  selectedIds,
  clearSelection,
  currentGroup,
}: BulkActionsProps) {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<ActionMode>("nudge");

  const hasSelection = selectedIds.length > 0;
  const canNudgeGroup = Boolean(currentGroup) && !hasSelection;

  function open(mode: ActionMode) {
    setMode(mode);
    setShowModal(true);
  }

  function close() {
    setShowModal(false);
  }

  function handleSuccess() {
    clearSelection();
    close();
  }

  const targetGuestIds =
    mode === "nudge" && !hasSelection && currentGroup
      ? [`GROUP:${currentGroup}`]
      : selectedIds;

  return (
    <div>
      <div className="flex items-center gap-3 font-mono">
        {canNudgeGroup && (
          <button
            className="px-3 py-1 border border-primary text-primary text-xs uppercase tracking-tighter hover:bg-primary hover:text-surface"
            onClick={() => open("nudge")}
          >
            Nudge Group: {currentGroup}
          </button>
        )}

        {hasSelection && (
          <>
            <button
              className="px-3 py-1 border border-success text-success text-xs uppercase tracking-tighter hover:bg-success hover:text-surface"
              onClick={() => open("nudge")}
            >
              Nudge Selected ({selectedIds.length})
            </button>

            <button
              className="px-3 py-1 border border-warning text-warning text-xs uppercase tracking-tighter hover:bg-warning hover:text-surface"
              onClick={() => open("invite")}
            >
              Send Invite
            </button>
          </>
        )}
      </div>

      {showModal && (
        <SendCommunicationModal
          mode={mode}
          guestIds={targetGuestIds}
          onClose={close}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}