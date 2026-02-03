import React, { useEffect, useState, useMemo, useRef } from "react";
import { fetchGuestActivity } from "./api/client";
import GroupEditModal from "./components/GroupEditModal";
import SendCommunicationModal from "./components/SendCommunicationModal";

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
  if (diff === 0) return "TODAY";
  if (diff === 1) return "YESTERDAY";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase();
}

function formatRelativeTime(date: Date, now: Date) {
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}S AGO`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}M AGO`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}H AGO`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}D AGO`;
}

type GuestSidebarProps = {
  guest: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    group_label?: string | null;
    invited_at?: string | null;
  };
  onClose: () => void;
};

export default function GuestSidebar({ guest, onClose }: GuestSidebarProps) {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [denseMode, setDenseMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSendModal, setShowSendModal] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await fetchGuestActivity(guest.id);
      setActivity(data.activity || []);
      setLoading(false);
    })();
  }, [guest.id]);

  function useActivityTimeline(rawActivity: any[]) {
    return useMemo(() => {
      if (!rawActivity || rawActivity.length === 0) return [];

      const now = new Date();

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

      const sorted = [...normalized].sort((a, b) => {
        const aDate = new Date(a.occurred_at || a.created_at);
        const bDate = new Date(b.occurred_at || b.created_at);
        return bDate.getTime() - aDate.getTime();
      });

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
        
        if (item.kind === "email_opened") {
          groups[dayKey].summary.email_opened++;
          return;
        }
        if (item.kind === "email_clicked") {
          groups[dayKey].summary.email_clicked++;
          return;
        }
        
        const kindInfo = kindMap[item.kind] || {
          icon: "❗",
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

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    // Changed: Applied font-mono, bg-black, and text/border colors to match dashboard
    <div className="w-full lg:w-[420px] bg-black text-[#45CC2D] font-mono h-full flex flex-col border-l border-[#45CC2D]">
      
      {/* Header */}
      <div className="p-4 flex justify-between items-start border-b border-[#45CC2D]">
        <div>
          <h2 className="font-bold text-lg uppercase tracking-wider leading-none">
            {guest.first_name} {guest.last_name}
          </h2>
          <p className="text-xs text-[#45CC2D]/70 mt-1">{guest.email}</p>
        </div>
        <button 
          className="text-[#45CC2D] hover:bg-[#45CC2D] hover:text-black px-2 py-0.5 border border-transparent hover:border-[#45CC2D] transition-colors" 
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="p-4 flex-1 overflow-auto">
        
        {/* Actions Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div
            onClick={(e) => e.stopPropagation()}
          >
          {/* Invite Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-2 border-b border-[#45CC2D]/30 pb-1">
              Invite Status
            </h3>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${!guest.invited_at ? "text-[#45CC2D]/50" : "text-[#45CC2D]"}`}>
                {!guest.invited_at ? "NOT SENT" : "SENT"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSendModal(true);
                }}
                className="border border-[#45CC2D] text-[#45CC2D] px-3 py-1 text-xs hover:bg-[#45CC2D] hover:text-black transition-colors uppercase tracking-wider"
              >
                {!guest.invited_at ? "Send Invite" : "Resend Invite"}
              </button>
            </div>
            {guest.invited_at && (
              <p className="text-[10px] text-[#45CC2D]/60 mt-1">
                LAST SENT: {new Date(guest.invited_at).toLocaleString()}
              </p>
            )}
          </div>
          </div>

          {/* Household Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-2 border-b border-[#45CC2D]/30 pb-1">
              Household Group
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {guest.group_label
                  ? guest.group_label.toUpperCase()
                  : "—"}
              </span>
              <button
                className="text-xs underline decoration-dashed hover:text-white transition-colors uppercase"
                onClick={() => setIsGroupModalOpen(true)}
              >
                Edit Group
              </button>
            </div>
          </div>
        </div>

        {isGroupModalOpen && (
          <GroupEditModal
            guestId={guest.id}
            currentGroup={guest.group_label ?? null}
            onClose={() => setIsGroupModalOpen(false)}
            onUpdated={() => {}}
          />
        )}

        {/* Activity Feed */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 border-b border-[#45CC2D]/30 pb-1 flex justify-between items-center">
            <span>Activity Log</span>
            <span className="text-[10px] opacity-50">{activity.length} EVENTS</span>
          </h3>

          {loading ? (
            <p className="text-[#45CC2D] animate-pulse">LOADING STREAM…</p>
          ) : timeline.length === 0 ? (
            <p className="text-[#45CC2D]/50 italic text-sm">No activity recorded.</p>
          ) : (
            <div className="flex flex-col gap-6 relative">
              {/* Vertical line connecting days */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#45CC2D]/20 z-0"></div>

              {timeline.map(({ dayKey, dayLabel, items, summary }) => (
                <div key={dayKey} className="relative z-10">
                  <div className="inline-block bg-black pr-2 mb-2">
                    <span className="text-[10px] border border-[#45CC2D] px-1 py-0.5 text-[#45CC2D]">
                      {dayLabel}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2 pl-4">
                    {/* Summary (Email Opens/Clicks) */}
                    {(summary.email_opened > 0 || summary.email_clicked > 0) && (
                      <div className="border border-dashed border-[#45CC2D]/40 p-2 text-xs text-[#45CC2D]/70 bg-black/50">
                        {summary.email_opened > 0 && (
                          <div className="flex items-center gap-2">
                            <span>📬</span>
                            <span>{summary.email_opened} email opened</span>
                          </div>
                        )}
                        {summary.email_clicked > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <span>🔗</span>
                            <span>{summary.email_clicked} link clicked</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timeline Items */}
                    {items.map((item) => (
                      <div
                        key={item.__rowId}
                        className={`
                          group flex items-start gap-3 p-2 border border-[#45CC2D]/30 hover:border-[#45CC2D] transition-colors
                          ${selectedIds.has(item.__rowId) ? "bg-[#45CC2D]/10 border-[#45CC2D]" : "bg-black"}
                        `}
                      >
                         {/* Selection Checkbox */}
                        {item.id && (
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded-none bg-black border border-[#45CC2D] text-[#45CC2D] focus:ring-0 focus:ring-offset-0 checked:bg-[#45CC2D] checked:border-[#45CC2D]"
                            checked={selectedIds.has(item.__rowId)}
                            onChange={() => toggleItem(item.__rowId)}
                          />
                        )}

                        <div className="text-lg leading-none pt-0.5 grayscale group-hover:grayscale-0 transition-all">{item.icon}</div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-tight break-words ${item.emphasis ? "font-bold text-[#45CC2D]" : "text-[#45CC2D]/90"}`}>
                            {item.label}
                          </p>
                          
                          {item.kind === "rsvp" && item.meta?.response && (
                            <p className="text-xs text-[#45CC2D] mt-1 pl-2 border-l border-[#45CC2D]/50">
                              STATUS: {item.meta.response.toUpperCase()}
                            </p>
                          )}
                          
                          {item.kind === "email_sent" && item.meta?.subject && (
                            <p className="text-xs text-[#45CC2D]/70 mt-1 truncate">
                              "{item.meta.subject}"
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-[#45CC2D]/50 uppercase">
                              {formatRelativeTime(item.date, new Date())}
                            </span>
                            <span className="text-[10px] text-[#45CC2D]/30">
                              {item.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
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
      {showSendModal && (
        <SendCommunicationModal
          mode="invite"
          guestIds={[guest.id]}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </div>
  );
}