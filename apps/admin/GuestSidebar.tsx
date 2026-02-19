import React, { useEffect, useState, useMemo } from "react";
import { fetchGuestActivity, apiFetch } from "./api/client"; // Corrected import
import GroupEditModal from "./components/GroupEditModal";
import SendCommunicationModal from "./components/SendCommunicationModal";
import { 
  CheckCircleIcon, 
  PencilSquareIcon, 
  PaperAirplaneIcon, 
  TicketIcon, 
  LockClosedIcon, 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  EnvelopeOpenIcon, 
  CursorArrowRaysIcon,
  UserPlusIcon,
  UserIcon
} from "@heroicons/react/20/solid";

// --- Types ---
type TimelineItem = {
  __rowId: string;
  id?: string;
  kind: string;
  occurred_at: string;
  date: Date;
  Icon: React.ElementType;
  label: string;
  emphasis: boolean;
  meta?: any;
};

type TimelineGroup = {
  dayKey: string;
  dayLabel: string;
  items: TimelineItem[];
  summary: { email_opened: number; email_clicked: number };
};

// --- API Helper ---
async function overrideGuestRSVP(guestId: string, status: string) {
  return apiFetch(`/admin/guest/${guestId}/rsvp-override`, {
    method: "POST",
    body: JSON.stringify({ status }), // Match backend parameter name
  });
}

// --- Icon Mapping ---
const kindMap: Record<string, { Icon: React.ElementType; label: string; emphasis?: boolean }> = {
  rsvp_submitted: { Icon: CheckCircleIcon, label: "RSVP Submitted", emphasis: true },
  rsvp_updated:   { Icon: PencilSquareIcon, label: "RSVP Updated", emphasis: true },
  rsvp_created:   { Icon: CheckCircleIcon, label: "RSVP Created", emphasis: true },
  invite_sent:    { Icon: PaperAirplaneIcon, label: "Invite Sent" },
  invite_resent:  { Icon: PaperAirplaneIcon, label: "Invite Resent" },
  invite_used:    { Icon: TicketIcon, label: "Invite Used", emphasis: true },
  admin_invite_resent: { Icon: PaperAirplaneIcon, label: "Invite Resent (Admin)" },
  auth_success:     { Icon: TicketIcon, label: "Invite Used" },
  admin_nudge_sent: { Icon: ChatBubbleLeftRightIcon, label: "Admin Nudge Sent" },
  group_update:     { Icon: UserGroupIcon, label: "Group Updated", emphasis: true },
  guest_created:    { Icon: UserPlusIcon, label: "Guest Created" },
  email_sent:    { Icon: PaperAirplaneIcon, label: "Email Sent" },
  email_opened:  { Icon: EnvelopeOpenIcon, label: "Email Opened" },
  email_clicked: { Icon: CursorArrowRaysIcon, label: "Link Clicked" },
};

function formatDayLabel(date: Date, today: Date) {
  const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
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
    avatar_url?: string | null;
  };
  onClose: () => void;
  onUpdate?: () => void;
};

export default function GuestSidebar({ guest, onClose, onUpdate }: GuestSidebarProps) {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [isUpdatingRSVP, setIsUpdatingRSVP] = useState(false);

  const handleGroupSuccess = () => {
    if (onUpdate) onUpdate();
    setIsGroupModalOpen(false);
  };

  const currentRSVP = useMemo(() => {
    const latestRsvp = activity.find(a => a.kind === "rsvp_created" || a.kind === "rsvp_submitted");
    return latestRsvp?.meta?.response?.toLowerCase() || "pending";
  }, [activity]);

  const handleOverride = async (status: string) => {
    setIsUpdatingRSVP(true);
    try {
      await overrideGuestRSVP(guest.id, status);
      const data = await fetchGuestActivity(guest.id);
      setActivity(data.activity || []);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("OVERRIDE ERROR: System failed to update manual RSVP.");
    } finally {
      setIsUpdatingRSVP(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await fetchGuestActivity(guest.id);
      if (alive) {
        setActivity(data.activity || []);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [guest.id]);

  const timeline = useMemo(() => {
    if (!activity || activity.length === 0) return [];
    const now = new Date();
    const normalized = activity
      .map((row) => row.payload ?? row)
      .filter((entry) => !!entry.kind)
      .map((entry, idx) => ({
        ...entry,
        __rowId: entry.id ?? `${entry.kind}-${entry.occurred_at || entry.created_at}-${idx}`,
        occurred_at: entry.occurred_at || entry.created_at,
      }));

    const sorted = [...normalized].sort((a, b) => 
      new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
    );

    const groups: Record<string, TimelineGroup> = {};
    sorted.forEach((item) => {
      const date = new Date(item.occurred_at);
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
      const kindInfo = kindMap[item.kind] || { Icon: LockClosedIcon, label: item.kind || "Unknown Activity" };
      groups[dayKey].items.push({ ...item, Icon: kindInfo.Icon, label: kindInfo.label, emphasis: kindInfo.emphasis || false, date });
    });
    return Object.values(groups).sort((a, b) => b.dayKey.localeCompare(a.dayKey));
  }, [activity]);

  return (
    <div className="w-full lg:w-[420px] bg-black text-[#45CC2D] font-mono h-full flex flex-col border-l border-[#45CC2D]">
      <div className="p-4 flex justify-between items-start border-b border-[#45CC2D]">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-[#45CC2D]"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-[#45CC2D]"></div>
            <div className="w-16 h-16 bg-neutral-900 border border-[#45CC2D]/30 overflow-hidden flex items-center justify-center relative">
              {guest.avatar_url ? (
                <img src={guest.avatar_url} alt={guest.first_name} className="w-full h-full object-cover filter grayscale contrast-125" />
              ) : (
                <div className="flex flex-col items-center opacity-40">
                  <UserIcon className="h-6 w-6 mb-0.5" />
                  <span className="text-[8px] tracking-tighter">NO_IMG</span>
                </div>
              )}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#45CC2D]/10 to-transparent h-1/2 w-full animate-scan"></div>
            </div>
          </div>
          <div>
            <h2 className="font-bold text-lg uppercase tracking-wider leading-none">{guest.first_name} {guest.last_name}</h2>
            <p className="text-xs text-[#45CC2D]/70 mt-1">{guest.email}</p>
          </div>
        </div>
        <button className="text-[#45CC2D] hover:bg-[#45CC2D] hover:text-black px-2 py-0.5 border border-transparent hover:border-[#45CC2D] transition-colors" onClick={onClose}>✕</button>
      </div>

      <div className="p-4 flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-2 border-b border-[#45CC2D]/30 pb-1">Invite Status</h3>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${!guest.invited_at ? "text-[#45CC2D]/50" : "text-[#45CC2D]"}`}>
                {!guest.invited_at ? "NOT SENT" : "SENT"}
              </span>
              <button onClick={() => setShowSendModal(true)} className="border border-[#45CC2D] text-[#45CC2D] px-3 py-1 text-xs hover:bg-[#45CC2D] hover:text-black transition-colors uppercase tracking-wider">
                {!guest.invited_at ? "Send Invite" : "Resend Invite"}
              </button>
            </div>
            {guest.invited_at && <p className="text-[10px] text-[#45CC2D]/60 mt-1">LAST SENT: {new Date(guest.invited_at).toLocaleString()}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase opacity-50 tracking-tighter">Manual Override RSVP:</span>
            <div className="grid grid-cols-3 gap-1">
              {['attending', 'declined', 'pending'].map((status) => (
                <button
                  key={status}
                  disabled={isUpdatingRSVP}
                  onClick={() => handleOverride(status)}
                  className={`text-[9px] py-1 border uppercase transition-all ${
                    currentRSVP === status 
                      ? 'bg-[#45CC2D] text-black border-[#45CC2D]' 
                      : 'border-[#45CC2D]/40 text-[#45CC2D] hover:border-[#45CC2D]'
                  } ${isUpdatingRSVP ? 'opacity-30 cursor-wait' : ''}`}
                >
                  {status === 'attending' ? 'YES' : status === 'declined' ? 'NO' : 'MAYBE'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-2 border-b border-[#45CC2D]/30 pb-1">Household Group</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm">{guest.group_label ? guest.group_label.toUpperCase() : "—"}</span>
              <button className="text-xs underline decoration-dashed hover:text-white transition-colors uppercase" onClick={() => setIsGroupModalOpen(true)}>Edit Group</button>
            </div>
          </div>
        </div>

        {isGroupModalOpen && <GroupEditModal guestId={guest.id} currentGroup={guest.group_label ?? null} onClose={handleGroupSuccess} />}

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
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#45CC2D]/20 z-0"></div>
              {timeline.map(({ dayKey, dayLabel, items, summary }) => (
                <div key={dayKey} className="relative z-10">
                  <div className="inline-block bg-black pr-2 mb-2">
                    <span className="text-[10px] border border-[#45CC2D] px-1 py-0.5 text-[#45CC2D]">{dayLabel}</span>
                  </div>
                  <div className="flex flex-col gap-2 pl-4">
                    {(summary.email_opened > 0 || summary.email_clicked > 0) && (
                      <div className="border border-dashed border-[#45CC2D]/40 p-2 text-xs text-[#45CC2D]/70 bg-black/50 flex gap-4">
                        {summary.email_opened > 0 && <div><EnvelopeOpenIcon className="h-3 w-3 inline mr-1"/> {summary.email_opened} opened</div>}
                        {summary.email_clicked > 0 && <div><CursorArrowRaysIcon className="h-3 w-3 inline mr-1"/> {summary.email_clicked} clicked</div>}
                      </div>
                    )}
                    {items.map((item) => (
                      <div key={item.__rowId} className="flex items-start gap-3 p-2 border border-[#45CC2D]/30 bg-black">
                        <div className="pt-0.5"><item.Icon className="h-5 w-5 text-[#9ae68c]" /></div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-tight break-words ${item.emphasis ? "font-bold text-[#45CC2D]" : "text-[#45CC2D]/90"}`}>{item.label}</p>
                          {item.kind.includes("rsvp") && item.meta?.response && (<p className="text-xs text-[#45CC2D] mt-1 pl-2 border-l border-[#45CC2D]/50">STATUS: {item.meta.response.toUpperCase()}</p>)}
                          {item.kind.includes("email") && item.meta?.subject && (<p className="text-xs text-[#45CC2D]/70 mt-1 truncate">"{item.meta.subject}"</p>)}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-[#45CC2D]/50 uppercase">{formatRelativeTime(item.date, new Date())}</span>
                            <span className="text-[10px] text-[#45CC2D]/30">{item.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
      {showSendModal && <SendCommunicationModal mode="invite" guestIds={[guest.id]} onClose={() => setShowSendModal(false)} />}
    </div>
  );
}