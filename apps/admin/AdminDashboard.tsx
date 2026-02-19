import React, { useEffect, useState, useMemo } from "react";
import { fetchAdminGuests, createAdminGuest, sendAdminInvite, bulkUpdateGroup } from "./api/client";
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
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/20/solid';
import AddGuestModal from "./components/AddGuestModal";
import AddGuestSuccessModal from "./components/AddGuestSuccessModal";
import GroupCreateModal from "./components/GroupCreateModal";

// --- 1. Reusable Confirmation Modal ---
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
type FilterState = "all" | "responded_all" | "responded_yes" | "responded_no" | "responded_pending" | "not_responded_all" | "not_responded_invited" | "not_responded_not_invited";

export default function AdminDashboard() {
  const [guests, setGuests] = useState<any[]>([]);
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
  
  const [filter, setFilter] = useState<FilterState>("all");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showAddSuccessModal, setShowAddSuccessModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  
  const [addSummary, setAddSummary] = useState<{ created: number; existing: number; invitesAttempted: boolean; } | null>(null);
  const [pendingBulkAssign, setPendingBulkAssign] = useState<{ groupLabel: string } | null>(null);

  const [sortField, setSortField] = useState<SortField>("rsvp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  async function refreshGuests(silent = false) {
    if (!silent) setIsRefreshing(true);
    try {
      const data = await fetchAdminGuests();
      setGuests(data.guests);
    } catch (e) {
      console.error("Failed to load guests", e);
    } finally {
      setIsRefreshing(false);
      setInitialLoading(false);
    }
  }

  useEffect(() => { refreshGuests(false); }, []);

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
    await refreshGuests(true);
    setShowAddGuestModal(false);
    setAddSummary({ created: createdCount, existing: existingCount, invitesAttempted: options.sendInvite });
    setShowAddSuccessModal(true);
  }

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
      if (selectedGroup && canonicalizeGroupLabel(g.group_label) !== selectedGroup) return false;
      const status = g.rsvps?.status?.toLowerCase(); 
      switch (filter) {
        case "all": return true;
        case "responded_yes": return ['attending', 'accepted', 'yes'].includes(status);
        case "responded_no": return ['declined', 'no'].includes(status);
        case "responded_pending": return ['pending', 'maybe'].includes(status);
        case "not_responded_all": return !status;
        case "not_responded_invited": return !status && g.invited_at;
        case "not_responded_not_invited": return !status && !g.invited_at;
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
  const currentGroup = selectedGroup;

  const handleSort = (field: SortField) => { if (sortField === field) { setSortDirection(prev => prev === "asc" ? "desc" : "asc"); } else { setSortField(field); setSortDirection("asc"); } };
  
  // PATCH: Mutual exclusivity logic in handleRowClick
  const handleRowClick = (e: React.MouseEvent, guestId: string, index: number) => {
    e.stopPropagation();
    // 1. Prevent selecting rows if sidebar is open
    if (selectedGuest) return;

    if (e.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index); const end = Math.max(lastSelectedIndex, index);
      const idsToSelect = sortedGuests.slice(start, end + 1).map(g => g.id); selection.selectMany(idsToSelect);
    } else { selection.toggle(guestId); }
    setLastSelectedIndex(index);
  };

  const initiateBulkAssign = (groupLabel: string) => {
    if (groupLabel === "___CREATE_NEW___") {
      setShowCreateGroupModal(true);
    } else {
      setPendingBulkAssign({ groupLabel });
    }
  };

  const executeBulkAssign = async () => {
    if (!pendingBulkAssign || selection.selectedIds.length === 0) return;
    const { groupLabel } = pendingBulkAssign;
    try {
      await bulkUpdateGroup(groupLabel, selection.selectedIds);
      await refreshGuests(true);
      selection.clear();
    } catch (e) { console.error(e); alert("Failed to update groups"); }
    finally { setPendingBulkAssign(null); }
  };

  const handleCreateGroupAndAssign = async (newLabel: string) => {
    setShowCreateGroupModal(false);
    if (selection.selectedIds.length === 0) return;
    try {
      await bulkUpdateGroup(newLabel, selection.selectedIds);
      await refreshGuests(true);
      selection.clear();
    } catch (e) { console.error(e); alert("Failed to create/assign group"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => { if (sortField !== field) return <ChevronUpDownIcon className="h-4 w-4 opacity-30" />; return sortDirection === "asc" ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />; };
  
  const availableGroups = useMemo(() => {
    const raw = Array.from(new Set(guests.map(g => canonicalizeGroupLabel(g.group_label))));
    return raw.filter(g => g !== "—").sort();
  }, [guests]);

  const visibleGroups = useMemo(() => {
    const raw = Array.from(new Set(sortedGuests.map(g => canonicalizeGroupLabel(g.group_label))));
    return raw.filter(g => g !== "—").sort();
  }, [sortedGuests]);

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
      default: return "FILTER";
    }
  };

  const getStatusColorClass = (status: string, isSelected: boolean) => {
    const s = status.toLowerCase();
    if (['yes', 'attending', 'accepted'].includes(s)) { 
      return isSelected ? 'bg-black text-[#45CC2D] border border-black' : 'bg-[#45CC2D] text-black'; 
    }
    if (['no', 'declined'].includes(s)) {
      return isSelected ? 'bg-red-900 text-white' : 'bg-red-600 text-white';
    }
    // Default for 'Maybe' or others
    return isSelected ? 'bg-black/20 text-black border border-black' : 'bg-neutral-800 text-gray-300 border border-gray-700';
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "a" || e.key === "A") { 
        e.preventDefault(); 
        // PATCH: Prevent Select All shortcut if sidebar is open
        if (selectedGuest) return;
        const ids = sortedGuests.map((g) => g.id); 
        if (selection.isAllSelected(ids)) selection.deselectMany(ids); else selection.selectMany(ids); 
      }
      if (e.key === "Escape") { e.preventDefault(); selection.clear(); setSelectedGuest(null); }
    }
    window.addEventListener("keydown", handleKeyDown); return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [sortedGuests, selection, selectedGuest]);

  if (initialLoading) return <div className="p-8 text-primary font-mono bg-black h-screen">Loading…</div>;

  return (
    <>
      <div className="flex flex-col h-screen sm:h-dvh bg-surface text-primary font-mono border-4 border-primary overflow-hidden">
        <div className="shrink-0 px-3 py-1 border-b border-primary bg-surface uppercase tracking-widest text-sm w-full z-40">
          <div className="flex items-center justify-between w-full">
            <span className="truncate mr-2">CACTUS MAKES PERFECT - AREA 51</span>
            <button className="shrink-0 px-2 py-0.5 border border-primary text-primary hover:bg-[#9ae68c] hover:text-surface transition-colors text-xs" onClick={() => { localStorage.removeItem("admin_token"); window.location.href = "/login"; }}>LOGOUT</button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          <div className={`flex flex-col flex-1 h-full bg-surface min-w-0 transition-all duration-300 ${selectedGuest ? "hidden lg:flex" : "flex"}`}>
            <div className="shrink-0 p-3 sm:p-4 border-b border-primary bg-surface z-20 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                  
                  {/* STATUS FILTER */}
                  <div className="relative w-full sm:w-64 z-40">
                    <Listbox value={filter} onChange={(val) => setFilter(val as FilterState)}>
                      <ListboxButton className="relative w-full cursor-default border py-1 pl-3 pr-10 text-left text-[10px] uppercase tracking-tighter transition-all bg-black text-[#45CC2D] border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] focus:outline-none hover:bg-[#9ae68c] hover:text-black">
                        <span className="block truncate font-bold">{getFilterLabel()}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><ChevronUpDownIcon className="h-4 w-4 text-[#45CC2D]" /></span>
                      </ListboxButton>
                      <ListboxOptions className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md bg-[#0a0a0a] border border-[#45CC2D] py-1 shadow-2xl focus:outline-none">
                        <ListboxOption value="all" className={({ active }) => `relative cursor-default select-none py-2 pl-8 pr-4 text-[10px] uppercase transition-colors font-bold ${active ? "bg-[#45CC2D] text-black" : "text-white"}`}>
                          {({ selected }) => <><span className="block truncate">Show All</span>{selected && <span className="absolute inset-y-0 left-0 flex items-center pl-2"><CheckIcon className="h-4 w-4" /></span>}</>}
                        </ListboxOption>
                        <div className="px-4 py-1 text-[10px] text-gray-500 uppercase tracking-widest font-bold border-t border-gray-800 mt-1">Responded</div>
                        {["responded_all", "responded_yes", "responded_no", "responded_pending"].map(f => (
                          <ListboxOption key={f} value={f} className={({ active }) => `relative cursor-default select-none py-2 pl-8 pr-4 text-[10px] uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}`}>
                            {({ selected }) => <><span className="block truncate">{f.replace(/_/g, ' ')}</span>{selected && <span className="absolute inset-y-0 left-0 flex items-center pl-2"><CheckIcon className="h-4 w-4" /></span>}</>}
                          </ListboxOption>
                        ))}
                        <div className="px-4 py-1 text-[10px] text-gray-500 uppercase tracking-widest font-bold border-t border-gray-800 mt-1">Not Responded</div>
                        {["not_responded_all", "not_responded_invited", "not_responded_not_invited"].map(f => (
                          <ListboxOption key={f} value={f} className={({ active }) => `relative cursor-default select-none py-2 pl-8 pr-4 text-[10px] uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}`}>
                            {({ selected }) => <><span className="block truncate">{f.replace(/_/g, ' ')}</span>{selected && <span className="absolute inset-y-0 left-0 flex items-center pl-2"><CheckIcon className="h-4 w-4" /></span>}</>}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Listbox>
                  </div>

                  {/* GROUP FILTER */}
                  <div className="relative w-full sm:w-64 z-30">
                    <Listbox value={selectedGroup} onChange={setSelectedGroup}>
                      <ListboxButton className="relative w-full cursor-default border py-1 pl-3 pr-10 text-left text-[10px] uppercase tracking-tighter transition-all bg-black text-[#45CC2D] border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] focus:outline-none hover:bg-[#9ae68c] hover:text-black">
                        <span className="block truncate">{selectedGroup ? selectedGroup : "All Groups"}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><ChevronUpDownIcon className="h-4 w-4 text-[#45CC2D]" /></span>
                      </ListboxButton>
                      <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#0a0a0a] border border-[#45CC2D] py-1 shadow-2xl focus:outline-none">
                        <ListboxOption value={null} className={({ active }) => `relative cursor-default select-none py-2 pl-8 pr-4 text-[10px] font-bold uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}`}>
                          {({ selected }) => <><span className="block truncate">All Groups</span>{selected && <span className="absolute inset-y-0 left-0 flex items-center pl-2"><CheckIcon className="h-4 w-4" /></span>}</>}
                        </ListboxOption>
                        {availableGroups.map((g) => (
                          <ListboxOption key={g} value={g} className={({ active }) => `relative cursor-default select-none py-2 pl-8 pr-4 text-[10px] uppercase transition-colors ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}`}>
                            {({ selected }) => (
                              <><span className={`block truncate ${selected ? "font-bold" : "font-normal"}`}>{g}</span>{selected && <span className="absolute inset-y-0 left-0 flex items-center pl-2"><CheckIcon className="h-4 w-4" /></span>}</>
                            )}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Listbox>
                  </div>

                  {/* SELECT ACTION DROPDOWN */}
                  <div className="relative w-full sm:w-48 z-20">
                    <Listbox value={null} onChange={(val: any) => {
                      // PATCH: Prevent selecting via dropdown if sidebar is open
                      if (selectedGuest) return;
                      if (val === "CLEAR") selection.clear();
                      else if (val === "VISIBLE") selection.selectMany(sortedGuests.map(g => g.id));
                      else if (val === "NOT_INVITED") selection.selectMany(sortedGuests.filter(g => !g.invited_at).map(g => g.id));
                      else if (val.startsWith("G:")) selection.selectMany(sortedGuests.filter(g => canonicalizeGroupLabel(g.group_label) === val.split(":")[1]).map(g => g.id));
                    }}>
                      <ListboxButton className="relative w-full cursor-default border py-1 pl-3 pr-10 text-left text-[10px] uppercase tracking-tighter transition-all bg-[#45CC2D] text-black border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] focus:outline-none hover:bg-[#9ae68c]">
                        <span className="block truncate font-bold">
                          {selection.selectedIds.length > 0 ? `(${selection.selectedIds.length}) SELECTED` : "SELECT..."}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><ChevronDownIcon className="h-4 w-4" /></span>
                      </ListboxButton>
                      <ListboxOptions className="absolute z-50 mt-1 max-h-80 w-64 overflow-auto rounded-md bg-[#0a0a0a] border border-[#45CC2D] py-1 shadow-2xl focus:outline-none">
                        <ListboxOption value="VISIBLE" className={({ active }) => `relative cursor-pointer select-none py-2 px-4 text-[10px] uppercase font-bold ${active ? "bg-[#45CC2D] text-black" : "text-white"}`}>Select All Visible ({sortedGuests.length})</ListboxOption>
                        <ListboxOption value="NOT_INVITED" className={({ active }) => `relative cursor-pointer select-none py-2 px-4 text-[10px] uppercase font-bold ${active ? "bg-[#45CC2D] text-black" : "text-[#45CC2D]"}`}>Select Not Invited (Visible)</ListboxOption>
                        <ListboxOption value="CLEAR" className={({ active }) => `relative cursor-pointer select-none py-2 px-4 text-[10px] uppercase font-bold border-b border-gray-800 ${active ? "bg-red-500 text-white" : "text-red-500"}`}>Deselect All</ListboxOption>
                        <div className="px-4 py-1 text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-2">Visible Groups</div>
                        {visibleGroups.map(g => (
                          <ListboxOption key={g} value={`G:${g}`} className={({ active }) => `relative cursor-pointer select-none py-2 pl-6 pr-4 text-[10px] uppercase ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}`}>Group: {g}</ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Listbox>
                  </div>

                  {(filter !== "all" || selectedGroup) && (
                    <button onClick={() => { setFilter("all"); setSelectedGroup(null); }} className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors">
                      <XMarkIcon className="h-3 w-3" /> Clear Filters
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden xl:flex items-center gap-3 text-[10px] uppercase tracking-wider text-gray-400 border-r border-gray-800 pr-4 mr-2">
                    <span className="font-bold text-[#45CC2D]">{stats.invited}/{stats.total} INVITED</span>
                    {stats.yes > 0 && <span>YES: <span className="text-white">{stats.yes}</span></span>}
                    {stats.no > 0 && <span>NO: <span className="text-white">{stats.no}</span></span>}
                    {stats.pending > 0 && <span>PENDING: <span className="text-white">{stats.pending}</span></span>}
                  </div>

                  {selection.selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 mr-2">
                      <div className="relative w-40">
                        <Listbox onChange={initiateBulkAssign}>
                          <ListboxButton className="relative w-full cursor-default border border-[#45CC2D] bg-black py-1 pl-2 pr-8 text-left text-[10px] uppercase text-[#45CC2D] hover:bg-[#9ae68c] hover:text-black">
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
                      <BulkActions selectedIds={selection.selectedIds} selectedGuests={guests.filter(g => selection.isSelected(g.id))} clearSelection={selection.clear} currentGroup={currentGroup} />
                    </div>
                  )}
                  <button className="px-2 py-1 border border-primary text-xs hover:bg-[#45CC2D] hover:text-black transition-colors whitespace-nowrap" onClick={() => setShowAddGuestModal(true)}>+ ADD GUESTS</button>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto p-3 sm:p-6 z-10 relative">
              {isRefreshing && (
                <div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-wait">
                  <div className="bg-black border border-[#45CC2D] px-6 py-3 flex items-center gap-3 shadow-2xl">
                    <div className="h-4 w-4 border-2 border-[#45CC2D] border-t-transparent animate-spin rounded-full" />
                    <span className="text-[#45CC2D] text-xs font-bold uppercase tracking-[0.2em]">Synchronizing...</span>
                  </div>
                </div>
              )}
              <div className="w-full border border-primary">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left border-b border-primary uppercase text-sm">
                      <th className="p-2 w-10 bg-surface">
                        {sortedGuests.length > 0 && (
                          <input 
                            type="checkbox" 
                            // PATCH: Disable header checkbox if sidebar is open
                            disabled={!!selectedGuest}
                            className={`h-5 w-5 rounded bg-black border-[#45CC2D] text-[#45CC2D] focus:ring-[#45CC2D] focus:ring-offset-black ${selectedGuest ? "opacity-30 cursor-not-allowed" : ""}`} 
                            checked={sortedGuests.length > 0 && sortedGuests.every(g => selection.isSelected(g.id))} 
                            onChange={() => { const ids = sortedGuests.map((g) => g.id); if (selection.isAllSelected(ids)) selection.deselectMany(ids); else selection.selectMany(ids); }} 
                            ref={el => { if (el) { const selectedCount = sortedGuests.filter(g => selection.isSelected(g.id)).length; el.indeterminate = selectedCount > 0 && selectedCount < sortedGuests.length; } }} 
                          />
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
                        <tr key={g.id} className={`border-b border-primary cursor-pointer hover:bg-neutral-800 ${selection.isSelected(g.id) ? "bg-primary text-surface" : ""} ${selectedGuest?.id === g.id ? "bg-neutral-700" : ""}`} 
                            onClick={(e) => {
                              // PATCH: Block opening sidebar if multiple guests are already selected
                              if (selection.selectedIds.length > 0) return;
                              setSelectedGuest(g);
                            }}
                        >
                          <td onClick={(e) => handleRowClick(e, g.id, index)} className="p-2 align-top sm:align-middle">
                            <input 
                              type="checkbox" 
                              // PATCH: Disable row checkbox if sidebar is open
                              disabled={!!selectedGuest}
                              className={`h-5 w-5 rounded bg-black border-[#45CC2D] text-[#45CC2D] focus:ring-[#45CC2D] focus:ring-offset-black ${selectedGuest ? "opacity-30 cursor-not-allowed" : ""}`} 
                              checked={selection.isSelected(g.id)} 
                              onChange={() => {}} 
                            />
                          </td>
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
          
          {/* Sidebar - Solid Black Background Added */}
          {selectedGuest && (
            <div className="absolute inset-y-0 right-0 z-50 flex justify-end w-full lg:static lg:w-auto lg:h-full lg:z-auto bg-black/40 lg:bg-black transition-all duration-300">
              <div className="absolute inset-0 lg:hidden" onClick={() => setSelectedGuest(null)} />
              <div className="relative w-full max-w-[420px] h-full bg-black shadow-2xl lg:shadow-none lg:border-l lg:border-[#45CC2D] overflow-hidden">
                <GuestSidebar 
                  guest={selectedGuest} 
                  onClose={() => setSelectedGuest(null)} 
                  onUpdate={() => refreshGuests(true)} 
                />
              </div>
            </div>
          )}
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