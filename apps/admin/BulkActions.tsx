import React, { useState, useMemo } from "react";
import SendCommunicationModal from "./components/SendCommunicationModal";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronDownIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '@heroicons/react/20/solid';

interface BulkActionsProps {
  selectedIds: string[];
  selectedGuests: any[]; // New prop for status awareness
  clearSelection: () => void;
  currentGroup?: string | null;
}

type ActionMode = "nudge" | "invite";

export default function BulkActions({
  selectedIds,
  selectedGuests,
  clearSelection,
  currentGroup,
}: BulkActionsProps) {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<ActionMode>("nudge");
  const [isProcessing, setIsProcessing] = useState(false);

  const hasSelection = selectedIds.length > 0;
  const canNudgeGroup = Boolean(currentGroup) && !hasSelection;
  const showComms = hasSelection || canNudgeGroup;

  // Determine label based on selection
  const inviteLabel = useMemo(() => {
    if (!hasSelection) return "Send Invite";
    // If any selected guest has an invited_at timestamp, use "Resend"
    const hasAlreadyInvited = selectedGuests.some(g => !!g.invited_at);
    return hasAlreadyInvited ? "Resend Invite" : "Send Invite";
  }, [hasSelection, selectedGuests]);

  function close() {
    setShowModal(false);
    setIsProcessing(false);
  }

  function handleSuccess() {
    setIsProcessing(false);
    clearSelection();
    close();
  }

  const handleActionInitiated = (selectedMode: ActionMode) => {
    setIsProcessing(true);
    setMode(selectedMode);
    setShowModal(true);
  };

  const targetGuestIds =
    mode === "nudge" && !hasSelection && currentGroup
      ? [`GROUP:${currentGroup}`]
      : selectedIds;

  if (!showComms) return null;

  return (
    <div>
      <div className="relative w-40 font-mono">
        <Listbox value={undefined} onChange={(val: ActionMode) => handleActionInitiated(val)}>
          <ListboxButton 
            disabled={isProcessing}
            className={`relative w-full cursor-default border border-[#45CC2D] bg-black py-1 pl-2 pr-8 text-left text-[10px] uppercase text-[#45CC2D] transition-all 
              ${isProcessing ? 'opacity-50 cursor-wait' : 'hover:bg-[#9ae68c] hover:text-black'}`}
          >
            <span className="block truncate font-bold">
              {isProcessing ? "Processing..." : "Comms..."}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
              <ChevronDownIcon className="h-4 w-4" />
            </span>
          </ListboxButton>
          
          <ListboxOptions className="absolute right-0 z-50 mt-1 max-h-60 w-56 overflow-auto rounded-md bg-[#0a0a0a] border border-[#45CC2D] py-1 shadow-2xl focus:outline-none">
            <div className="px-3 py-1 text-[10px] text-gray-500 uppercase tracking-widest font-bold border-b border-gray-800/50 mb-1">
              Target: {hasSelection ? `${selectedIds.length} Selected` : `Group ${currentGroup}`}
            </div>
            
            <ListboxOption 
              value="nudge" 
              className={({ active }) => `relative cursor-pointer select-none py-2 pl-4 pr-4 text-[10px] uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-[#45CC2D]"}`}
            >
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-3 w-3" />
                Send Nudge
              </div>
            </ListboxOption>

            <ListboxOption 
              value="invite" 
              className={({ active }) => `relative cursor-pointer select-none py-2 pl-4 pr-4 text-[10px] uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-[#45CC2D]"}`}
            >
              <div className="flex items-center gap-2">
                <PaperAirplaneIcon className="h-3 w-3" />
                {inviteLabel}
              </div>
            </ListboxOption>
          </ListboxOptions>
        </Listbox>
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