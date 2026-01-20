// apps/admin/components/GroupEditModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchGroups, updateGuestGroup } from "../api/client";
// 1. Import Headless UI components
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';

type Mode = "idle" | "existing" | "new";

type GroupSummary = {
  group_label: string;
  member_count: number;
};

type GroupEditModalProps = {
  guestId: string;
  currentGroup: string | null;
  onClose: () => void;
  onUpdated?: () => void;
};

function formatGroupLabel(label: string) {
  return label
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function canonicalizeGroupLabelInput(input: string) {
  const trimmed = (input || "").trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function GroupEditModal({
  guestId,
  currentGroup,
  onClose,
  onUpdated,
}: GroupEditModalProps) {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>(currentGroup ? "existing" : "idle");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(
    currentGroup ?? null
  );
  const [newGroupInput, setNewGroupInput] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingGroups(true);
        const resp = await fetchGroups();
        const raw = (resp?.groups || []) as GroupSummary[];
        const cleaned = raw
          .filter((g) => !!g?.group_label)
          .map((g) => ({
            group_label: g.group_label,
            member_count: Number(g.member_count || 0),
          }))
          .sort((a, b) => a.group_label.localeCompare(b.group_label));
        if (!alive) return;
        setGroups(cleaned);
      } catch (e: any) {
        if (!alive) return;
        setLoadError(e?.message || "Failed to load groups");
      } finally {
        if (!alive) return;
        setLoadingGroups(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (currentGroup) {
      setMode("existing");
      setSelectedGroup(currentGroup);
      setNewGroupInput("");
    } else {
      setMode("idle");
      setSelectedGroup(null);
      setNewGroupInput("");
    }
  }, [currentGroup]);

  const canonicalNewGroup = useMemo(() => canonicalizeGroupLabelInput(newGroupInput), [newGroupInput]);

  function onSelectExisting(value: string) {
    setMode("existing");
    setSelectedGroup(value);
    setNewGroupInput("");
    setSaveError(null);
  }

  function onTypeNew(value: string) {
    setMode("new");
    setNewGroupInput(value);
    setSelectedGroup(null);
    setSaveError(null);
  }

  function onClearGroup() {
    setMode("idle");
    setSelectedGroup(null);
    setNewGroupInput("");
    setSaveError(null);
  }

  const canSubmit = useMemo(() => {
    if (saving) return false;
    if (mode === "idle") return true;
    if (mode === "existing") return !!selectedGroup;
    return !!canonicalNewGroup;
  }, [mode, selectedGroup, canonicalNewGroup, saving]);

  async function onSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    setSaveError(null);
    try {
      let group_label = mode === "existing" ? selectedGroup : mode === "new" ? canonicalNewGroup : null;
      await updateGuestGroup(guestId, group_label);
      onUpdated?.();
      onClose();
    } catch (e: any) {
      setSaveError(e?.message || "Failed to update group");
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && mode !== "new") {
      e.preventDefault();
      onSubmit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onKeyDown={onKeyDown} role="dialog" aria-modal="true">
      {/* Container Border color updated to #45CC2D */}
      <div className="w-[520px] rounded-lg bg-black shadow-2xl border border-[#45CC2D]/30 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit household group</h2>
            <p className="text-sm text-gray-500 text-balance">Assign this guest to an existing group, create a new one, or clear it.</p>
          </div>
          <button className="text-gray-500 hover:text-white transition-colors" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">
          {/* Current Group Box */}
          <div className="rounded-md border border-gray-800 bg-neutral-900/50 p-3">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Current Household</div>
            <div className="text-sm font-medium text-[#45CC2D]">
              {currentGroup ? formatGroupLabel(currentGroup) : "No Group Assigned"}
            </div>
          </div>

          {/* Path B: Headless UI Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-tight">Assign to existing</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                  <Listbox 
                    value={selectedGroup ?? undefined} // Fixes the null vs undefined error
                    onChange={onSelectExisting} 
                    disabled={mode === "new" || loadingGroups}
                  >
                  <ListboxButton className={`
                    relative w-full cursor-default rounded border py-2 pl-3 pr-10 text-left text-sm transition-all
                    ${mode === "new" || loadingGroups 
                      ? "bg-black text-gray-600 border-gray-800 opacity-50" 
                      : "bg-black text-white border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D]"}
                  `}>
                    <span className="block truncate">
                      {loadingGroups ? "Loading..." : selectedGroup ? formatGroupLabel(selectedGroup) : "Select a group..."}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-4 w-4 text-gray-500" />
                    </span>
                  </ListboxButton>

                  <ListboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#0a0a0a] border border-[#45CC2D] py-1 shadow-2xl focus:outline-none">
                    {groups.map((g) => (
                      <ListboxOption
                        key={g.group_label}
                        value={g.group_label}
                        className={({ active }) => `
                          relative cursor-default select-none py-2 pl-10 pr-4 text-sm transition-colors
                          ${active ? 'bg-[#45CC2D] text-black' : 'text-gray-300'}
                        `}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>
                              {formatGroupLabel(g.group_label)} <span className="text-[10px] opacity-60 ml-1">({g.member_count})</span>
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <CheckIcon className="h-4 w-4" />
                              </span>
                            )}
                          </>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Listbox>
              </div>

              <button
                type="button"
                className={`text-xs font-bold uppercase transition-colors ${
                  mode === "existing" 
                    ? "text-[#45CC2D] cursor-default" // Active state: Green, no underline
                    : "text-gray-500 hover:text-[#45CC2D] disable:no-underline cursor-pointer" // Inactive state: Gray
                }`}
                onClick={() => setMode("existing")}
              >
                {mode === "existing" ? "●" : "●"}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-800" />
            <div className="text-[10px] text-gray-600 uppercase font-bold">OR</div>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          {/* New Group Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-tight">Create New</label>
            <div className="flex items-center gap-2">
              <input
                className={`w-full border rounded px-3 py-2 text-sm transition-all focus:outline-none focus:ring-1
                  ${mode === "existing" 
                    ? "bg-black text-gray-600 border-gray-800" 
                    : "bg-black text-white border-[#45CC2D] focus:ring-[#45CC2D]"}
                `}
                placeholder="e.g. Smith-Jones"
                value={newGroupInput}
                onChange={(e) => onTypeNew(e.target.value)}
                disabled={mode === "existing"}
              />
              <button
                type="button"
                className={`text-xs font-bold uppercase transition-colors ${
                  mode === "new" 
                    ? "text-[#45CC2D] cursor-default" // Active: Green
                    : "text-gray-500 hover:text-[#45CC2D] disable:no-underline cursor-pointer" // Inactive: Gray
                }`}
                onClick={() => {
                  setMode("new");
                  setSelectedGroup(null);
                  setSaveError(null);
                }}
              >
                {mode === "new" ? "●" : "●"}
              </button>
            </div>
            {mode === "new" && (
              <div className="text-[10px] text-gray-500 font-mono">
                Canonical: <span className={canonicalNewGroup ? "text-[#45CC2D]" : ""}>{canonicalNewGroup || "—"}</span>
              </div>
            )}
          </div>

          {/* Clear Button */}
          <button type="button" className="text-xs text-red-500/80 hover:text-red-500 underline uppercase font-bold tracking-tighter transition-colors" onClick={onClearGroup}>
            Clear household assignment
          </button>

          {/* Error Message */}
          {saveError && (
            <div className="rounded border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">
              {saveError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800 bg-neutral-900/30">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {mode === "existing" && selectedGroup ? "Updating Group" : mode === "new" ? "Creating New" : "Clearing"}
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm text-gray-400 hover:text-white transition-colors" onClick={onClose} disabled={saving}>
              ABORT
            </button>
            <button
              className={`px-6 py-2 text-sm font-bold rounded transition-all
                ${canSubmit 
                  ? "bg-[#45CC2D] text-black hover:scale-105 active:scale-95" 
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"}
              `}
              onClick={onSubmit}
              disabled={!canSubmit}
            >
              {saving ? "SAVING..." : "SAVE CHANGES"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}