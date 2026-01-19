import React, { useEffect, useState, useMemo, useRef } from "react";
import { fetchGuestActivity } from "./api/client";
import GroupEditModal from "./components/GroupEditModal";

const kindMap: Record<
  string,
  { icon: string; label: string; emphasis?: boolean }
> = {
  // Guest RSVP actions
  rsvp_submitted: { icon: "✅", label: "RSVP submitted", emphasis: true },
  rsvp_updated: { icon: "✏️", label: "RSVP updated", emphasis: true },
  rsvp_created: { icon: "🆕", label: "RSVP created", emphasis: true },

  // Invites
  invite_sent: { icon: "📨", label: "Invite sent" },
  invite_resent: { icon: "🔁", label: "Invite resent" },
  invite_used: { icon: "🎟️", label: "Invite used", emphasis: true },
  admin_invite_resent: { icon: "🔁", label: "Invite resent (admin)" },

  // Authentication
  auth_success: { icon: "🔐", label: "Signed in" },

  // Admin communications
  admin_nudge_sent: { icon: "📣", label: "Admin nudge sent" },

  // Group changes
  group_update: { icon: "👥", label: "Group updated", emphasis: true },

  // Email lifecycle / telemetry
  email_sent: { icon: "✉️", label: "Email sent" },
  email_opened: { icon: "📬", label: "Email opened" },
  email_clicked: { icon: "🔗", label: "Email link clicked" },
};

function formatDayLabel(date: Date, today: Date) {
  const diff = Math.floor(
    (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatRelativeTime(date: Date, now: Date) {
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

type GuestSidebarProps = {
  guest: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    group_label?: string | null;
  };
  onClose: () => void;
};

export default function GuestSidebar({ guest, onClose }: GuestSidebarProps) {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [denseMode, setDenseMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      const data = await fetchGuestActivity(guest.id);
      setActivity(data.activity || []);
      setLoading(false);
    })();
  }, [guest.id]);

  // Replace useActivityTimeline with new logic:
  // Group activities by day, but summarize low-signal (email_opened, email_clicked) counts per day.
  // Return array of groups with items and summary counts.

  function useActivityTimeline(rawActivity: any[]) {
    return useMemo(() => {
      if (!rawActivity || rawActivity.length === 0) return [];

      const now = new Date();

      // Normalize: unwrap payloads, drop envelope rows, only keep objects with a kind
      const normalized = rawActivity
        .map((row) => row.payload ?? row)
        .filter((entry) => !!entry.kind)
        .map((entry, idx) => ({
          ...entry,
          __rowId:
          entry.id ??
          `${entry.kind}-${entry.occurred_at || entry.created_at}-${idx}`,
          occurred_at: entry.occurred_at || entry.created_at,
          source: entry.source || "direct",
        }));

      // Sort descending by occurred_at / created_at
      const sorted = [...normalized].sort((a, b) => {
        const aDate = new Date(a.occurred_at || a.created_at);
        const bDate = new Date(b.occurred_at || b.created_at);
        return bDate.getTime() - aDate.getTime();
      });

      // Group by day string YYYY-MM-DD
      const groups: Record<
        string,
        {
          dayKey: string;
          dayLabel: string;
          items: any[];
          summary: { email_opened: number; email_clicked: number };
        }
      > = {};

      sorted.forEach((item) => {
        const date = new Date(item.occurred_at || item.created_at);
        const dayKey = date.toISOString().slice(0, 10);
        if (!groups[dayKey]) {
          groups[dayKey] = {
            dayKey,
            dayLabel: formatDayLabel(date, now),
            items: [],
            summary: { email_opened: 0, email_clicked: 0 },
          };
        }
        // Summarize low-signal kinds instead of adding as items
        if (item.kind === "email_opened") {
          groups[dayKey].summary.email_opened++;
          return;
        }
        if (item.kind === "email_clicked") {
          groups[dayKey].summary.email_clicked++;
          return;
        }
        // Map kind to icon and label
        const kindInfo = kindMap[item.kind] || {
          icon: "❔",
          label: item.kind || "Unknown",
        };
        groups[dayKey].items.push({
          ...item,
          icon: kindInfo.icon,
          label: kindInfo.label,
          emphasis: kindInfo.emphasis || false,
          date,
        });
      });

      // Return array sorted by day descending
      return Object.entries(groups)
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([, group]) => group);
    }, [rawActivity]);
  }

  const timeline = useActivityTimeline(activity);

  const selectableItemIds = useMemo(() => {
    return timeline.flatMap(group =>
      group.items.map(item => item.__rowId)
    );
  }, [timeline]);

  const noneSelected = selectedIds.size === 0;
  const allSelected =
    selectableItemIds.length > 0 &&
    selectableItemIds.every(id => selectedIds.has(id));
  const someSelected = !noneSelected && !allSelected;

  function toggleHeaderCheckbox() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableItemIds));
    }
  }

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  }

  return (
    <div className="w-[380px] border-l bg-white h-full shadow-xl overflow-auto">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="font-semibold text-lg">
          {guest.first_name} {guest.last_name}
        </h2>
        <button className="text-gray-500" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="p-4">
        <p className="text-sm text-gray-600 mb-4">{guest.email}</p>

        <h3 className="font-semibold mb-1">Household</h3>
        <p className="text-sm text-gray-700 mb-4">
          {guest.group_label
            ? guest.group_label
                .split("-")
                .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" ")
            : "—"}
        </p>
        <button
          className="text-blue-600 text-sm underline mb-4"
          onClick={() => setIsGroupModalOpen(true)}
        >
          Edit Group
        </button>

        {isGroupModalOpen && (
          <GroupEditModal
            guestId={guest.id}
            currentGroup={guest.group_label ?? null}
            onClose={() => setIsGroupModalOpen(false)}
            onUpdated={() => {
              // Refresh group label in sidebar after update
              // This forces a re-render by updating guest.group_label in parent state if provided.
            }}
          />
        )}

        <div className="flex items-center mb-2 space-x-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={!noneSelected}
            ref={headerCheckboxRef}
            onChange={toggleHeaderCheckbox}
            aria-label="Select all activity"
          />
          <h3 className="font-semibold flex-1">Activity</h3>
          <button
            onClick={() => setDenseMode(!denseMode)}
            className="text-xs text-blue-600 underline"
            aria-label="Toggle density mode"
          >
            {denseMode ? "Compact" : "Detailed"}
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : timeline.length === 0 ? (
          <p className="text-gray-500">No activity</p>
        ) : (
          <div className="flex flex-col gap-6">
            {timeline.map(({ dayKey, dayLabel, items, summary }) => (
              <div key={dayKey}>
                <h4 className="font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-3">
                  {dayLabel}
                </h4>
                <div className="flex flex-col gap-3">
                  {denseMode && (summary.email_opened > 0 || summary.email_clicked > 0) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 italic px-3 py-1 rounded bg-gray-100 border border-gray-200">
                      {summary.email_opened > 0 && (
                        <span>
                          📬 {summary.email_opened} email opened
                          {summary.email_opened > 1 ? "s" : ""}
                        </span>
                      )}
                      {summary.email_opened > 0 && summary.email_clicked > 0 && <span>·</span>}
                      {summary.email_clicked > 0 && (
                        <span>
                          🔗 {summary.email_clicked} link clicked
                          {summary.email_clicked > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}
                  {!denseMode && (summary.email_opened > 0 || summary.email_clicked > 0) && (
                    <>
                      {summary.email_opened > 0 && (
                        <div className="flex items-start gap-3 border p-3 rounded bg-gray-50 text-gray-500 text-sm italic">
                          <div className="text-xl pt-1">📬</div>
                          <div>
                            {summary.email_opened} email opened
                            {summary.email_opened > 1 ? "s" : ""}
                          </div>
                        </div>
                      )}
                      {summary.email_clicked > 0 && (
                        <div className="flex items-start gap-3 border p-3 rounded bg-gray-50 text-gray-500 text-sm italic">
                          <div className="text-xl pt-1">🔗</div>
                          <div>
                            {summary.email_clicked} link clicked
                            {summary.email_clicked > 1 ? "s" : ""}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {items.map((item) => (
                    <div
                      key={item.__rowId}
                      className="flex items-start gap-3 border p-3 rounded bg-gray-50"
                    >
                      {item.id && (
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selectedIds.has(item.__rowId)}
                          onChange={() => toggleItem(item.__rowId)}
                          aria-label="Select activity row"
                        />
                      )}
                      <div className="text-xl pt-1">{item.icon}</div>
                      <div className="flex-1">
                        <p
                          className={`${
                            item.emphasis ? "font-bold" : "font-semibold"
                          }`}
                        >
                          {item.label}
                          {/* TODO: Add resend or expand affordances here */}
                        </p>
                        {item.kind === "rsvp" && item.meta?.response && (
                          <p className="text-sm text-gray-700">
                            RSVP: {item.meta.response}
                          </p>
                        )}
                        {item.kind === "email_sent" && item.meta?.subject && (
                          <p className="text-sm text-gray-700">
                            Subject: {item.meta.subject}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(item.date, new Date())} ·{" "}
                          {item.date.toLocaleString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}