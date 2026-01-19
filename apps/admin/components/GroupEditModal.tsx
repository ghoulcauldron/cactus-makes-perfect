// apps/admin/components/GroupEditModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchGroups, updateGuestGroup } from "../api/client";

type Mode = "idle" | "existing" | "new";

type GroupSummary = {
  group_label: string;     // canonical value (stored)
  member_count: number;    // count
};

type GroupEditModalProps = {
  guestId: string;
  currentGroup: string | null;
  onClose: () => void;
  onUpdated?: () => void;
};

// Display helper (canonical -> human readable)
function formatGroupLabel(label: string) {
  return label
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// Canonicalize user input (human -> canonical)
// Mirrors backend intent: trim + lowercase; also normalizes whitespace to "-"
function canonicalizeGroupLabelInput(input: string) {
  const trimmed = (input || "").trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed
    .replace(/[^a-z0-9\s-]/g, "")   // drop punctuation (safe-ish)
    .replace(/\s+/g, "-")          // spaces -> hyphen
    .replace(/-+/g, "-");          // collapse hyphens
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

  // Load group list once on open (and whenever modal re-mounts)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingGroups(true);
        setLoadError(null);

        const resp = await fetchGroups();
        const raw = (resp?.groups || []) as GroupSummary[];

        // Defensive: filter out null/empty labels
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

    return () => {
      alive = false;
    };
  }, []);

  // If currentGroup changes while open (rare), keep state consistent
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroup]);

  const canonicalNewGroup = useMemo(() => {
    return canonicalizeGroupLabelInput(newGroupInput);
  }, [newGroupInput]);

  const selectedGroupDisplay = useMemo(() => {
    if (!selectedGroup) return null;
    return formatGroupLabel(selectedGroup);
  }, [selectedGroup]);

  // UI Actions
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

    if (mode === "idle") {
      // allow submit if guest currently has a group OR they intentionally cleared (idle always valid)
      return true;
    }

    if (mode === "existing") {
      return !!selectedGroup;
    }

    // mode === "new"
    return !!canonicalNewGroup;
  }, [mode, selectedGroup, canonicalNewGroup, saving]);

  async function onSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    setSaveError(null);

    try {
      let group_label: string | null = null;

      if (mode === "existing") {
        group_label = selectedGroup || null;
      } else if (mode === "new") {
        group_label = canonicalNewGroup; // already canonicalized
      } else {
        group_label = null; // idle = clear
      }

      await updateGuestGroup(guestId, group_label);

      onUpdated?.();
      onClose();
    } catch (e: any) {
      setSaveError(e?.message || "Failed to update group");
    } finally {
      setSaving(false);
    }
  }

  // Simple keyboard affordance: Enter submits (unless typing new group with empty)
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onKeyDown={onKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-[520px] rounded-lg bg-white shadow-xl border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Edit household group</h2>
            <p className="text-sm text-gray-500">
              Assign this guest to an existing household group, create a new one, or clear it.
            </p>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Current */}
          <div className="rounded-md border bg-gray-50 p-3">
            <div className="text-xs text-gray-500 mb-1">Current</div>
            <div className="text-sm font-medium text-gray-800">
              {currentGroup ? formatGroupLabel(currentGroup) : "—"}
              {currentGroup ? (
                <span className="text-xs text-gray-500 font-normal">
                  {" "}
                  ({currentGroup})
                </span>
              ) : null}
            </div>
          </div>

          {/* Existing groups */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Assign to existing group
            </label>

            <div className="flex items-center gap-2">
              <select
                className={`w-full border rounded px-3 py-2 text-sm ${
                  mode === "new" ? "bg-gray-100 text-gray-500" : "bg-white"
                }`}
                value={selectedGroup ?? ""}
                onChange={(e) => onSelectExisting(e.target.value)}
                disabled={mode === "new" || loadingGroups}
              >
                <option value="" disabled>
                  {loadingGroups ? "Loading groups…" : "Select a group…"}
                </option>

                {groups.map((g) => (
                  <option key={g.group_label} value={g.group_label}>
                    {formatGroupLabel(g.group_label)} ({g.member_count})
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="text-sm text-gray-700 underline whitespace-nowrap disabled:text-gray-400"
                onClick={() => {
                  setMode("existing");
                  setSaveError(null);
                }}
                disabled={mode === "existing"}
                title="Use the dropdown"
              >
                Use
              </button>
            </div>

            {loadError ? (
              <p className="text-xs text-red-600 mt-1">{loadError}</p>
            ) : null}

            {mode === "existing" && selectedGroupDisplay ? (
              <p className="text-xs text-gray-500 mt-1">
                Selected: <span className="font-medium">{selectedGroupDisplay}</span>
              </p>
            ) : null}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <div className="text-xs text-gray-400 uppercase tracking-wide">or</div>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* New group */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Create new group
            </label>

            <div className="flex items-center gap-2">
              <input
                className={`w-full border rounded px-3 py-2 text-sm ${
                  mode === "existing" ? "bg-gray-100 text-gray-500" : "bg-white"
                }`}
                placeholder="e.g. Smith Family"
                value={newGroupInput}
                onChange={(e) => onTypeNew(e.target.value)}
                disabled={mode === "existing"}
              />

              <button
                type="button"
                className="text-sm text-gray-700 underline whitespace-nowrap disabled:text-gray-400"
                onClick={() => {
                  setMode("new");
                  setSelectedGroup(null);
                  setSaveError(null);
                }}
                disabled={mode === "new"}
                title="Use the input"
              >
                Use
              </button>
            </div>

            <div className="mt-1 text-xs text-gray-500">
              Canonical value:{" "}
              <span className="font-mono">
                {canonicalNewGroup ? canonicalNewGroup : "—"}
              </span>
            </div>

            {mode === "new" && !canonicalNewGroup && newGroupInput.trim() ? (
              <p className="text-xs text-red-600 mt-1">
                Please enter a valid group name (letters/numbers).
              </p>
            ) : null}
          </div>

          {/* Clear */}
          <div className="pt-2">
            <button
              type="button"
              className="text-sm text-red-600 underline"
              onClick={onClearGroup}
            >
              Clear group
            </button>
            <p className="text-xs text-gray-500 mt-1">
              This removes the household assignment for this guest.
            </p>
          </div>

          {/* Errors */}
          {saveError ? (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {saveError}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t bg-white">
          <div className="text-xs text-gray-500">
            {mode === "existing" && selectedGroup
              ? `Will assign to: ${formatGroupLabel(selectedGroup)}`
              : mode === "new" && canonicalNewGroup
              ? `Will create/assign: ${formatGroupLabel(canonicalNewGroup)}`
              : "Will clear group"}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-2 text-sm rounded border hover:bg-gray-50"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`px-3 py-2 text-sm rounded text-white ${
                canSubmit ? "bg-black hover:bg-gray-800" : "bg-gray-400"
              }`}
              onClick={onSubmit}
              disabled={!canSubmit}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}