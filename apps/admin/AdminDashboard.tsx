import React, { useEffect, useState, useMemo } from "react";
import { fetchAdminGuests, createAdminGuest, sendAdminInvite } from "./api/client";
import GuestSidebar from "./GuestSidebar";
import BulkActions from "./BulkActions";
import { useSelection } from "./hooks/useSelection";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { 
  ChevronUpDownIcon, 
  CheckIcon, 
  ChevronUpIcon, 
  ChevronDownIcon, 
  PaperAirplaneIcon,
  TicketIcon,
  UserPlusIcon,
  CursorArrowRaysIcon,
  EnvelopeOpenIcon,
  UserGroupIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon
} from '@heroicons/react/20/solid';
import AddGuestModal from "./components/AddGuestModal";
import AddGuestSuccessModal from "./components/AddGuestSuccessModal";
import GroupCreateModal from "./components/GroupCreateModal";

// --- 1. NEW: Reusable Confirmation Modal ---
function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmLabel = "Confirm", 
  isDangerous = false 
}: { 
  isOpen: boolean; 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void; 
  confirmLabel?: string; 
  isDangerous?: boolean; 
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[400px] rounded-lg bg-black shadow-2xl border border-[#45CC2D] text-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#45CC2D]/30 bg-neutral-900/50">
          <h2 className="text-lg font-bold uppercase tracking-wider text-[#45CC2D]">{title}</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-300">{message}</p>
        </div>
        <div className="px-5 py-3 border-t border-gray-800 bg-neutral-900/30 flex justify-end gap-3">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-white uppercase tracking-wider transition-colors">
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all text-black ${isDangerous ? 'bg-red-500 hover:bg-red-400' : 'bg-[#45CC2D] hover:bg-[#3bb325]'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 2. Icon Mapping ---
const kindMap: Record<string, { Icon: React.ElementType; label: string }> = {
  rsvp_submitted: { Icon: CheckCircleIcon, label: "RSVP Received" },
  rsvp_updated:   { Icon: PencilSquareIcon, label: "RSVP Updated" },
  rsvp_created:   { Icon: CheckCircleIcon, label: "RSVP Created" },
  invite_sent:    { Icon: PaperAirplaneIcon, label: "Invite Sent" },
  invite_resent:  { Icon: PaperAirplaneIcon, label: "Invite Resent" },
  invite_used:    { Icon: TicketIcon, label: "Invite Used" },
  auth_success:   { Icon: TicketIcon, label: "Invite Used" },
  group_update:   { Icon: UserGroupIcon, label: "Group Updated" },
  guest_created:  { Icon: UserPlusIcon, label: "Guest Added" },
  email_sent:     { Icon: PaperAirplaneIcon, label: "Email Sent" },
  email_opened:   { Icon: EnvelopeOpenIcon, label: "Email Opened" },
  email_clicked:  { Icon: CursorArrowRaysIcon, label: "Link Clicked" },
  admin_nudge_sent: { Icon: ChatBubbleLeftRightIcon, label: "Nudge Sent" }
};

function canonicalizeGroupLabel(label: string | null | undefined): string {
  if (!label) return "—";
  return label.trim().toLowerCase().replace(/\s+/g, "-");
}

function formatActivityDate(dateStr: string | null) {
  if (!dateStr) return "—";
  if (dateStr === "just now") return "Just now";
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

function inferActivityDisplay(g: any) {
  if (g.rsvps?.status) {
    const statusLabel = g.rsvps.status.charAt(0).toUpperCase() + g.rsvps.status.slice(1);
    return { Icon: CheckCircleIcon, label: `RSVP: ${statusLabel}` };
  }
  if (g.last_activity_kind && kindMap[g.last_activity_kind]) {
    return kindMap[g.last_activity_kind];
  }
  const lastTime = new Date(g.last_activity_at || 0).getTime();
  const invitedTime = g.invited_at ? new Date(g.invited_at).getTime() : 0;
  const createdTime = g.created_at ? new Date(g.created_at).getTime() : 0;
  const EPSILON = 5000; 

  if (invitedTime) {
    if (lastTime > (invitedTime + 10000)) return { Icon: TicketIcon, label: "Invite Used" };
    if (Math.abs(lastTime - invitedTime) < EPSILON) return { Icon: PaperAirplaneIcon, label: "Invite Sent" };
  }
  if (!g.last_activity_at || Math.abs(lastTime - createdTime) < EPSILON) {
    return { Icon: UserPlusIcon, label: "Guest Added" };
  }
  return { Icon: CursorArrowRaysIcon, label: g.last_activity_kind?.replace(/_/g, ' ') || "Activity" };
}

type SortField = "name" | "group" | "rsvp" | "activity";
type SortDirection = "asc" | "desc";
type FilterState = "all" | "group" | "responded_all" | "responded_yes" | "responded_no" | "responded_pending" | "not_responded_all" | "not_responded_invited" | "not_responded_not_invited";

export default function AdminDashboard() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
  
  const [filter, setFilter] = useState<FilterState>("all");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  // Modals
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showAddSuccessModal, setShowAddSuccessModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [addSummary, setAddSummary] = useState<{ created: number; existing: number; invitesAttempted: boolean; } | null>(null);

  // Bulk Assign Confirmation State
  const [pendingBulkAssign, setPendingBulkAssign] = useState<{ groupLabel: string } | null>(null);

  const [sortField, setSortField] = useState<SortField>("rsvp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  async function refreshGuests() {
    setLoading(true);
    const data = await fetchAdminGuests();
    setGuests(data.guests);
    setLoading(false);
  }

  useEffect(() => { refreshGuests(); }, []);

  async function handleAddGuests(guestsToAdd: any[], options: { sendInvite: boolean; inviteTemplate: "default" | "friendly"; subscribed: boolean; }) {
    let createdCount = 0; let existingCount = 0;
    const optimisticRows = guestsToAdd.map((g) => ({ id: `optimistic-${Math.random()}`, email: g.email, first_name: g.first_name, last_name: g.last_name, group_label: g.group_label || null, rsvps: null, last_activity_at: "just now", last_activity_kind: "guest_created" }));
    setGuests((prev) => [...optimisticRows, ...prev]);
    for (const guest of guestsToAdd) {
      try {
        const created = await createAdminGuest({ email: guest.email, first_name: guest.first_name, last_name: guest.last_name, group_label: guest.group_label });
        createdCount++;
        if (options.sendInvite) await sendAdminInvite(created.id, options.inviteTemplate);
      } catch (err: any) { if (err?.message?.includes("409")) { existingCount++; continue; } console.error(err); }
    }
    await refreshGuests();
    setShowAddGuestModal(false);
    setAddSummary({ created: createdCount, existing: existingCount, invitesAttempted: options.sendInvite });
    setShowAddSuccessModal(true);
  }

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    let yes = 0, no = 0, pending = 0, invited = 0;
    guests.forEach(g => {
      if (g.invited_at) invited++;
      const status = g.rsvps?.status?.toLowerCase();
      if (status === 'attending' || status === 'accepted' || status === 'yes') yes++;
      else if (status === 'declined' || status === 'no') no++;
      else if (status === 'pending') pending++;
    });
    return { yes, no, pending, invited, total: guests.length };
  }, [guests]);

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      if (filter === "group") return canonicalizeGroupLabel(g.group_label) === selectedGroup;
      const hasResponse = !!g.rsvps?.status;
      const status = g.rsvps?.status?.toLowerCase(); 
      switch (filter) {
        case "all": return true;
        case "responded_all": return hasResponse;
        case "responded_yes": return status === 'attending' || status === 'accepted' || status === 'yes';
        case "responded_no": return status === 'declined' || status === 'no';
        case "responded_pending": return status === 'pending';
        case "not_responded_all": return !hasResponse;
        case "not_responded_invited": return !hasResponse && g.invited_at;
        case "not_responded_not_invited": return !hasResponse && !g.invited_at;
        default: return true;
      }
    });
  }, [guests, filter, selectedGroup]);

  const sortedGuests = useMemo(() => {
    if (!sortField) return filteredGuests;
    return [...filteredGuests].sort((a, b) => {
      let valA: any = ""; let valB: any = "";
      switch (sortField) {
        case "name": valA = `${a.last_name} ${a.first_name}`.toLowerCase(); valB = `${b.last_name} ${b.first_name}`.toLowerCase(); break;
        case "group": valA = (a.group_label || "").toLowerCase(); valB = (b.group_label || "").toLowerCase(); break;
        case "rsvp": valA = (a.rsvps?.status || "").toLowerCase(); valB = (b.rsvps?.status || "").toLowerCase(); break;
        case "activity": valA = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0; valB = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0; break;
      }
      if (valA < valB) return sortDirection === "asc" ? -1 : 1; if (valA > valB) return sortDirection === "asc" ? 1 : -1; return 0;
    });
  }, [filteredGuests, sortField, sortDirection]);

  const selection = useSelection({ items: sortedGuests, getGroupId: (g) => canonicalizeGroupLabel(g.group_label) });
  const currentGroup = filter === "group" ? selectedGroup : null;

  const handleSort = (field: SortField) => { if (sortField === field) { setSortDirection(prev => prev === "asc" ? "desc" : "asc"); } else { setSortField(field); setSortDirection("asc"); } };
  
  const handleRowClick = (e: React.MouseEvent, guestId: string, index: number) => {
    e.stopPropagation();
    if (e.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index); const end = Math.max(lastSelectedIndex, index);
      const idsToSelect = sortedGuests.slice(start, end + 1).map(g => g.id); selection.selectMany(idsToSelect);
    } else { selection.toggle(guestId); }
    setLastSelectedIndex(index);
  };

  // --- BULK ASSIGN LOGIC ---
  // Step 1: User selects a group from dropdown. 
  // If it's "___CREATE_NEW___", we open the create modal.
  // Otherwise, we open the confirmation modal for the selected group.
  const initiateBulkAssign = (groupLabel: string) => {
    if (groupLabel === "___CREATE_NEW___") {
      setShowCreateGroupModal(true);
    } else {
      setPendingBulkAssign({ groupLabel });
    }
  };

  // Step 2: Confirmation modal executes this function.
  const executeBulkAssign = async () => {
    if (!pendingBulkAssign || selection.selectedIds.length === 0) return;
    const { groupLabel } = pendingBulkAssign;
    
    try {
      await fetch('/api/v1/admin/group/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
        body: JSON.stringify({ guest_ids: selection.selectedIds, group_label: groupLabel })
      });
      await refreshGuests();
      selection.clear();
    } catch (e) { console.error(e); alert("Failed to update groups"); }
    finally { setPendingBulkAssign(null); }
  };

  // Step 3: Handle Creating a Group from Modal
  const handleCreateGroupAndAssign = async (newLabel: string) => {
    setShowCreateGroupModal(false);
    if (selection.selectedIds.length > 0) {
      // Bypasses confirmation since they just typed it in the modal
      setPendingBulkAssign({ groupLabel: newLabel });
      // We manually call execute here because state updates might be async/batched 
      // but simpler to reuse logic or just duplicate for speed:
      try {
        await fetch('/api/v1/admin/group/bulk', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
          body: JSON.stringify({ guest_ids: selection.selectedIds, group_label: newLabel })
        });
        await refreshGuests();
        selection.clear();
      } catch (e) { console.error(e); alert("Failed to create/assign group"); }
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => { if (sortField !== field) return <ChevronUpDownIcon className="h-4 w-4 opacity-30" />; return sortDirection === "asc" ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />; };
  
  const availableGroups = useMemo(() => {
    const raw = Array.from(new Set(guests.map(g => canonicalizeGroupLabel(g.group_label))));
    return raw.filter(g => g !== "—").sort();
  }, [guests]);

  const getFilterLabel = () => {
    switch (filter) {
      case "all": return "ALL GUESTS";
      case "responded_all": return "RESPONDED: ALL";
      case "responded_yes": return "RESPONDED: YES";
      case "responded_no": return "RESPONDED: NO";
      case "responded_pending": return "RESPONDED: PENDING";
      case "not_responded_all": return "NOT RESPONDED: ALL";
      case "not_responded_invited": return "NOT RESPONDED: INVITED";
      case "not_responded_not_invited": return "NOT RESPONDED: NOT INVITED";
      case "group": return "GROUP FILTER"; 
      default: return "FILTER";
    }
  };

  const getStatusColorClass = (status: string, isSelected: boolean) => {
    const s = status.toLowerCase();
    if (s === 'attending' || s === 'accepted' || s === 'yes') { return isSelected ? 'bg-black text-[#45CC2D] border border-black' : 'bg-[#45CC2D] text-black'; }
    return isSelected ? 'bg-black/20 text-black border border-black' : 'bg-neutral-800 text-gray-300 border border-gray-700';
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "a" || e.key === "A") { e.preventDefault(); const ids = sortedGuests.map((g) => g.id); if (selection.isAllSelected(ids)) selection.deselectMany(ids); else selection.selectMany(ids); }
      if (e.key === "Escape") { e.preventDefault(); selection.clear(); }
    }
    window.addEventListener("keydown", handleKeyDown); return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [sortedGuests, selection]);

  if (loading) return <div className="p-8 text-primary font-mono">Loading…</div>;

  return (
    <>
      <div className="flex flex-col h-screen sm:h-dvh bg-surface text-primary font-mono border-4 border-primary">
        <div className="shrink-0 px-3 py-1 border-b border-primary bg-surface uppercase tracking-widest text-sm w-full z-30">
          <div className="flex items-center justify-between w-full">
            <span className="truncate mr-2">CACTUS MAKES PERFECT - AREA 51</span>
            <button className="shrink-0 px-2 py-0.5 border border-primary text-primary hover:bg-[#9ae68c] hover:text-surface transition-colors text-xs" onClick={() => { localStorage.removeItem("admin_token"); window.location.href = "/login"; }}>LOGOUT</button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          <div className={`flex flex-col flex-1 h-full bg-surface ${selectedGuest ? "hidden lg:flex" : "flex"}`}>
            <div className="shrink-0 p-3 sm:p-4 border-b border-primary bg-surface z-20 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                  
                  {/* STATUS FILTER */}
                  <div className="relative w-full sm:w-64 z-40">
                    <Listbox value={filter} onChange={(val) => { setFilter(val as FilterState); setSelectedGroup(null); }}>
                      <ListboxButton className="relative w-full cursor-default border py-1 pl-3 pr-10 text-left text-sm uppercase tracking-tighter transition-all bg-black text-[#45CC2D] border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] focus:outline-none hover:bg-[#9ae68c] hover:text-black">
                        <span className="block truncate font-bold">{getFilterLabel()}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><ChevronUpDownIcon className="h-4 w-4 text-[#45CC2D]" /></span>
                      </ListboxButton>
                      <ListboxOptions className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md bg-[#0a0a0a] border border-[#45CC2D] py-1 shadow-2xl focus:outline-none">
                        <ListboxOption value="all" className={({ active }) => `relative cursor-default select-none py-2 pl-4 pr-4 text-[10px] uppercase transition-colors font-bold ${active ? "bg-[#45CC2D] text-black" : "text-white"}`}>Show All</ListboxOption>
                        <div className="px-4 py-1 text-[10px] text-gray-500 uppercase tracking-widest font-bold border-t border-gray-800 mt-1">Responded</div>
                        <ListboxOption value="responded_all" className={({ active }) => `relative cursor-default select-none py-2 pl-8 pr-4 text-[10px] uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}`}>All Responded</ListboxOption>
                        <ListboxOption value="responded_yes" className={({ active }) => `relative cursor-default select-none py-2 pl-8 pr-4 text-[10px] uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}`}>Yes (Attending)</ListboxOption>
                        <ListboxOption value="responded_no" className={({ active }) => `relative cursor-default select-none py-2 pl-8 pr-4 text-[10px] uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}`}>No (Declined)</ListboxOption>
                        <ListboxOption value="responded_pending" className={({ active }) => `relative cursor-default select-none py-2 pl-8 pr-4 text-[10px] uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}`}>Pending</ListboxOption>
                        <div className="px-4 py-1 text-[10px] text-gray-500 uppercase tracking-widest font-bold border-t border-gray-800 mt-1">Not Responded</div>
                        <ListboxOption value="not_responded_all" className={({ active }) => `relative cursor-default select-none py-2 pl-8 pr-4 text-[10px] uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}`}>All Not Responded</ListboxOption>
                        <ListboxOption value="not_responded_invited" className={({ active }) => `relative cursor-default select-none py-2 pl-8 pr-4 text-[10px] uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}`}>Invited</ListboxOption>
                        <ListboxOption value="not_responded_not_invited" className={({ active }) => `relative cursor-default select-none py-2 pl-8 pr-4 text-[10px] uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}`}>Not Yet Invited</ListboxOption>
                      </ListboxOptions>
                    </Listbox>
                  </div>

                  {/* GROUP FILTER (Pure Filter) */}
                  <div className="relative w-full sm:w-64 z-30">
                    <Listbox value={selectedGroup ?? undefined} onChange={(val) => {
                      if (!val) { setFilter("all"); setSelectedGroup(null); } 
                      else { setFilter("group"); setSelectedGroup(val); }
                    }}>
                      <ListboxButton className="relative w-full cursor-default border py-1 pl-3 pr-10 text-left text-sm uppercase tracking-tighter transition-all bg-black text-[#45CC2D] border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] focus:outline-none hover:bg-[#9ae68c] hover:text-black">
                        <span className="block truncate">{filter === "group" && selectedGroup ? selectedGroup : "All Groups"}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><ChevronUpDownIcon className="h-4 w-4 text-[#45CC2D]" /></span>
                      </ListboxButton>
                      <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#0a0a0a] border border-[#45CC2D] py-1 shadow-2xl focus:outline-none">
                        <ListboxOption value="" className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 text-[10px] font-bold uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}`}>All Groups</ListboxOption>
                        {availableGroups.map((g) => (
                          <ListboxOption key={g} value={g} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 text-[10px] uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}`}>
                            {({ selected }) => (
                              <><span className={`block truncate ${selected ? "font-bold" : "font-normal"}`}>{g}</span>{selected && <span className="absolute inset-y-0 left-0 flex items-center pl-3"><CheckIcon className="h-4 w-4" /></span>}</>
                            )}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Listbox>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* --- STATS --- */}
                  <div className="hidden xl:flex items-center gap-3 text-[10px] uppercase tracking-wider text-gray-400 border-r border-gray-800 pr-4 mr-2">
                    <span className="font-bold text-[#45CC2D]">{stats.invited}/{stats.total} INVITED</span>
                    {stats.yes > 0 && <span>YES: <span className="text-white">{stats.yes}</span></span>}
                    {stats.no > 0 && <span>NO: <span className="text-white">{stats.no}</span></span>}
                    {stats.pending > 0 && <span>PENDING: <span className="text-white">{stats.pending}</span></span>}
                  </div>

                  {/* BULK ACTIONS (With Create New) */}
                  {selection.selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 mr-2">
                      <div className="relative w-40">
                        <Listbox onChange={initiateBulkAssign}>
                          <ListboxButton className="relative w-full cursor-default border border-[#45CC2D] bg-black py-1 pl-2 pr-8 text-left text-xs uppercase text-[#45CC2D] hover:bg-[#9ae68c] hover:text-black">
                            <span className="block truncate">Assign Group...</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1"><ChevronUpDownIcon className="h-3 w-3" /></span>
                          </ListboxButton>
                          <ListboxOptions className="absolute right-0 z-50 mt-1 max-h-60 w-64 overflow-auto rounded-md bg-[#0a0a0a] border border-[#45CC2D] py-1 shadow-2xl focus:outline-none">
                            <ListboxOption value="___CREATE_NEW___" className={({ active }) => `relative cursor-pointer select-none py-2 pl-4 pr-4 text-[10px] font-bold uppercase transition-colors border-b border-gray-800 mb-1 ${active ? "bg-[#45CC2D] text-black" : "text-[#45CC2D]"}`}>
                              <div className="flex items-center gap-2"><PlusIcon className="h-3 w-3" /> Create New...</div>
                            </ListboxOption>
                            <div className="px-3 py-1 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Assign selection to:</div>
                            {availableGroups.map((g) => (
                              <ListboxOption key={g} value={g} className={({ active }) => `relative cursor-default select-none py-2 pl-4 pr-4 text-[10px] uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}`}>{g}</ListboxOption>
                            ))}
                          </ListboxOptions>
                        </Listbox>
                      </div>
                      <BulkActions selectedIds={selection.selectedIds} clearSelection={selection.clear} currentGroup={currentGroup} />
                    </div>
                  )}
                  <button className="px-2 py-1 border border-primary text-xs hover:bg-[#45CC2D] hover:text-black transition-colors whitespace-nowrap" onClick={() => setShowAddGuestModal(true)}>+ ADD GUESTS</button>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto p-3 sm:p-6 z-10">
              <div className="w-full border border-primary">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left border-b border-primary uppercase text-sm">
                      <th className="p-2 w-10 bg-surface">
                        {sortedGuests.length > 0 && (
                          <input type="checkbox" className="h-5 w-5 rounded bg-black border-[#45CC2D] text-[#45CC2D] focus:ring-[#45CC2D] focus:ring-offset-black" checked={sortedGuests.length > 0 && sortedGuests.every(g => selection.isSelected(g.id))} onChange={() => { const ids = sortedGuests.map((g) => g.id); if (selection.isAllSelected(ids)) selection.deselectMany(ids); else selection.selectMany(ids); }} ref={el => { if (el) { const selectedCount = sortedGuests.filter(g => selection.isSelected(g.id)).length; el.indeterminate = selectedCount > 0 && selectedCount < sortedGuests.length; } }} />
                        )}
                      </th>
                      <th className="p-2 cursor-pointer hover:bg-primary/20 select-none group bg-surface" onClick={() => handleSort("name")}><div className="flex items-center gap-1">Name <SortIcon field="name" /></div></th>
                      <th className="p-2 hidden md:table-cell bg-surface">Email</th>
                      <th className="p-2 hidden md:table-cell cursor-pointer hover:bg-primary/20 select-none group bg-surface" onClick={() => handleSort("group")}><div className="flex items-center gap-1">Group <SortIcon field="group" /></div></th>
                      <th className="p-2 cursor-pointer hover:bg-primary/20 select-none group bg-surface" onClick={() => handleSort("rsvp")}><div className="flex items-center gap-1">RSVP <SortIcon field="rsvp" /></div></th>
                      <th className="p-2 hidden lg:table-cell cursor-pointer hover:bg-primary/20 select-none group bg-surface" onClick={() => handleSort("activity")}><div className="flex items-center gap-1">Last Activity <SortIcon field="activity" /></div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedGuests.map((g, index) => {
                      const { Icon, label } = inferActivityDisplay(g); 
                      return (
                        <tr key={g.id} className={`border-b border-primary cursor-pointer hover:bg-neutral-800 ${selection.isSelected(g.id) ? "bg-primary text-surface" : ""}`} onClick={() => setSelectedGuest(g)}>
                          <td onClick={(e) => handleRowClick(e, g.id, index)} className="p-2 align-top sm:align-middle"><input type="checkbox" className="h-5 w-5 rounded bg-black border-[#45CC2D] text-[#45CC2D] focus:ring-[#45CC2D] focus:ring-offset-black" checked={selection.isSelected(g.id)} onChange={() => {}} /></td>
                          <td className="p-2 align-top sm:align-middle">
                            <div className="flex items-center gap-2"><div className="font-bold sm:font-normal">{g.first_name} {g.last_name}</div>{g.invited_at && (<div title={`Invite sent: ${new Date(g.invited_at).toLocaleDateString()}`}><PaperAirplaneIcon className={`h-3 w-3 ${selection.isSelected(g.id) ? "text-black" : "text-[#45CC2D]"}`} /></div>)}</div>
                            <div className="md:hidden flex flex-col gap-0.5 mt-1"><span className={`text-xs truncate max-w-[150px] ${selection.isSelected(g.id) ? "text-black/70" : "text-gray-400"}`}>{g.email}</span><span className={`text-[10px] uppercase tracking-wider ${selection.isSelected(g.id) ? "text-black/60" : "text-[#45CC2D]"}`}>{canonicalizeGroupLabel(g.group_label)}</span></div>
                          </td>
                          <td className="p-2 hidden md:table-cell whitespace-nowrap">{g.email}</td>
                          <td className="p-2 hidden md:table-cell whitespace-nowrap">{canonicalizeGroupLabel(g.group_label)}</td>
                          <td className="p-2 align-top sm:align-middle whitespace-nowrap">{g.rsvps?.status ? (<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${getStatusColorClass(g.rsvps.status, selection.isSelected(g.id))}`}>{g.rsvps.status}</span>) : (<span className="text-gray-500 text-xs">—</span>)}</td>
                          <td className="p-2 hidden lg:table-cell whitespace-nowrap text-xs"><div className="flex items-center gap-2"><Icon className="h-5 w-5 text-[#9ae68c]" /><div className="flex flex-col"><span className="font-bold">{label}</span><span className={selection.isSelected(g.id) ? "text-black/60" : "text-gray-500"}>{formatActivityDate(g.last_activity_at)}</span></div></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {selectedGuest && <div className="absolute inset-0 z-50 w-full h-full bg-surface overflow-auto lg:static lg:w-auto lg:border-l lg:border-primary lg:z-auto"><GuestSidebar guest={selectedGuest} onClose={() => setSelectedGuest(null)} /></div>}
        </div>
      </div>
      
      {/* MODALS */}
      {showAddGuestModal && <AddGuestModal onClose={() => setShowAddGuestModal(false)} onConfirm={handleAddGuests} />}
      {showAddSuccessModal && addSummary && <AddGuestSuccessModal created={addSummary.created} existing={addSummary.existing} invitesAttempted={addSummary.invitesAttempted} onClose={() => { setShowAddSuccessModal(false); setAddSummary(null); }} />}
      {showCreateGroupModal && <GroupCreateModal onClose={() => setShowCreateGroupModal(false)} onConfirm={handleCreateGroupAndAssign} />}
      
      {/* CONFIRMATION MODAL */}
      <ConfirmationModal 
        isOpen={!!pendingBulkAssign} 
        title="Assign Group" 
        message={`Are you sure you want to assign ${selection.selectedIds.length} selected guests to "${pendingBulkAssign?.groupLabel}"?`} 
        onConfirm={executeBulkAssign} 
        onCancel={() => setPendingBulkAssign(null)} 
      />
    </>
  );
}