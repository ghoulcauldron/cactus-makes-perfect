import React, { useEffect, useState, useMemo } from "react";
import { fetchAdminGuests, createAdminGuest, sendAdminInvite, updateGuestGroup } from "./api/client";
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
  ChatBubbleLeftRightIcon
} from '@heroicons/react/20/solid';
import AddGuestModal from "./components/AddGuestModal";
import AddGuestSuccessModal from "./components/AddGuestSuccessModal";

// --- 1. Icon Mapping (Heroicons + #9ae68c) ---
const kindMap: Record<string, { Icon: React.ElementType; label: string }> = {
  // RSVP Actions
  rsvp_submitted: { Icon: CheckCircleIcon, label: "RSVP Received" },
  rsvp_updated:   { Icon: PencilSquareIcon, label: "RSVP Updated" },
  rsvp_created:   { Icon: CheckCircleIcon, label: "RSVP Created" },
  
  // Invite Lifecycle
  invite_sent:    { Icon: PaperAirplaneIcon, label: "Invite Sent" },
  invite_resent:  { Icon: PaperAirplaneIcon, label: "Invite Resent" },
  invite_used:    { Icon: TicketIcon, label: "Invite Used" },
  auth_success:   { Icon: TicketIcon, label: "Invite Used" },
  
  // Admin/System
  group_update:   { Icon: UserGroupIcon, label: "Group Updated" },
  guest_created:  { Icon: UserPlusIcon, label: "Guest Added" },
  
  // Email Telemetry
  email_sent:     { Icon: PaperAirplaneIcon, label: "Email Sent" },
  email_opened:   { Icon: EnvelopeOpenIcon, label: "Email Opened" },
  email_clicked:  { Icon: CursorArrowRaysIcon, label: "Link Clicked" },
  
  // Fallback
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

// --- 2. Smart Status Inference (Fixed) ---
function inferActivityDisplay(g: any) {
  // RULE 1: RSVP Priority (Highest)
  // If the guest has ANY RSVP status, show that. This prevents "Invite Used"
  // from overriding the fact that they are Attending.
  if (g.rsvps?.status) {
    const statusLabel = g.rsvps.status.charAt(0).toUpperCase() + g.rsvps.status.slice(1);
    return { Icon: CheckCircleIcon, label: `RSVP: ${statusLabel}` };
  }

  // RULE 2: Explicit DB Status (Source of Truth)
  // If the database explicitly tells us what happened, believe it.
  if (g.last_activity_kind && kindMap[g.last_activity_kind]) {
    return kindMap[g.last_activity_kind];
  }

  // RULE 3: Fallback Timestamp Inference
  // If the DB view returns null/unknown kind, we guess based on timestamps.
  const lastTime = new Date(g.last_activity_at || 0).getTime();
  const invitedTime = g.invited_at ? new Date(g.invited_at).getTime() : 0;
  const createdTime = g.created_at ? new Date(g.created_at).getTime() : 0;

  const EPSILON = 5000; // 5s buffer for clock drift/async execution

  // Invite Check: If activity is > 10s after invite, assume they clicked the link.
  // (We use 10s instead of 60s to catch quick testers, but > EPSILON to avoid race conditions)
  if (invitedTime) {
    if (lastTime > (invitedTime + 10000)) {
       return { Icon: TicketIcon, label: "Invite Used" };
    }
    if (Math.abs(lastTime - invitedTime) < EPSILON) {
      return { Icon: PaperAirplaneIcon, label: "Invite Sent" };
    }
  }

  // Creation Check
  if (!g.last_activity_at || Math.abs(lastTime - createdTime) < EPSILON) {
    return { Icon: UserPlusIcon, label: "Guest Added" };
  }

  // Generic Fallback
  return { 
    Icon: CursorArrowRaysIcon, 
    label: g.last_activity_kind?.replace(/_/g, ' ') || "Activity" 
  };
}

type SortField = "name" | "group" | "rsvp" | "activity";
type SortDirection = "asc" | "desc";

export default function AdminDashboard() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
  const [filter, setFilter] = useState<"all" | "not_responded" | "responded" | "group">("all");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showAddSuccessModal, setShowAddSuccessModal] = useState(false);
  const [addSummary, setAddSummary] = useState<{ created: number; existing: number; invitesAttempted: boolean; } | null>(null);

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
    let createdCount = 0;
    let existingCount = 0;

    const optimisticRows = guestsToAdd.map((g) => ({
      id: `optimistic-${Math.random()}`,
      email: g.email,
      first_name: g.first_name,
      last_name: g.last_name,
      group_label: g.group_label || null,
      rsvps: null,
      last_activity_at: "just now",
      last_activity_kind: "guest_created"
    }));

    setGuests((prev) => [...optimisticRows, ...prev]);

    for (const guest of guestsToAdd) {
      try {
        const created = await createAdminGuest({
          email: guest.email,
          first_name: guest.first_name,
          last_name: guest.last_name,
          group_label: guest.group_label,
        });
        createdCount++;
        if (options.sendInvite) {
          await sendAdminInvite(created.id, options.inviteTemplate);
        }
      } catch (err: any) {
        if (err?.message?.includes("409")) {
          existingCount++;
          continue;
        }
        console.error("Add guest failed:", err);
      }
    }
    await refreshGuests();
    setShowAddGuestModal(false);
    setAddSummary({ created: createdCount, existing: existingCount, invitesAttempted: options.sendInvite });
    setShowAddSuccessModal(true);
  }

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      if (filter === "responded") return g.rsvps?.status;
      if (filter === "not_responded") return !g.rsvps?.status;
      if (filter === "group") return canonicalizeGroupLabel(g.group_label) === selectedGroup;
      return true;
    });
  }, [guests, filter, selectedGroup]);

  const sortedGuests = useMemo(() => {
    if (!sortField) return filteredGuests;
    return [...filteredGuests].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";
      switch (sortField) {
        case "name":
          valA = `${a.last_name} ${a.first_name}`.toLowerCase();
          valB = `${b.last_name} ${b.first_name}`.toLowerCase();
          break;
        case "group":
          valA = (a.group_label || "").toLowerCase();
          valB = (b.group_label || "").toLowerCase();
          break;
        case "rsvp":
          valA = (a.rsvps?.status || "").toLowerCase();
          valB = (b.rsvps?.status || "").toLowerCase();
          break;
        case "activity":
          valA = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
          valB = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
          break;
      }
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredGuests, sortField, sortDirection]);

  const selection = useSelection({
    items: sortedGuests,
    getGroupId: (g) => canonicalizeGroupLabel(g.group_label),
  });
  const currentGroup = filter === "group" ? selectedGroup : null;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleRowClick = (e: React.MouseEvent, guestId: string, index: number) => {
    e.stopPropagation();
    if (e.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const idsToSelect = sortedGuests.slice(start, end + 1).map(g => g.id);
      selection.selectMany(idsToSelect);
    } else {
      selection.toggle(guestId);
    }
    setLastSelectedIndex(index);
  };

  const handleBulkGroupAssign = async (groupLabel: string) => {
    if (selection.selectedIds.length === 0) return;
    if (!window.confirm(`Assign ${selection.selectedIds.length} guests to "${groupLabel}"?`)) return;

    try {
      await fetch('/api/v1/admin/group/bulk', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ guest_ids: selection.selectedIds, group_label: groupLabel })
      });
      await refreshGuests();
      selection.clear();
    } catch (e) {
      console.error("Bulk group update failed", e);
      alert("Failed to update groups");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUpDownIcon className="h-4 w-4 opacity-30" />;
    return sortDirection === "asc" ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />;
  };

  const availableGroups = useMemo(() => {
    const raw = Array.from(new Set(guests.map(g => canonicalizeGroupLabel(g.group_label))));
    return raw.filter(g => g !== "—").sort();
  }, [guests]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        const ids = sortedGuests.map((g) => g.id);
        if (selection.isAllSelected(ids)) selection.deselectMany(ids);
        else selection.selectMany(ids);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        selection.clear();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [sortedGuests, selection]);

  if (loading) return <div className="p-8 text-primary font-mono">Loading…</div>;

  return (
    <>
      <div className="flex flex-col h-screen sm:h-dvh bg-surface text-primary font-mono border-4 border-primary">
        <div className="shrink-0 px-3 py-1 border-b border-primary bg-surface uppercase tracking-widest text-sm w-full z-30">
          <div className="flex items-center justify-between w-full">
            <span className="truncate mr-2">CACTUS MAKES PERFECT - AREA 51</span>
            <button
              className="shrink-0 px-2 py-0.5 border border-primary text-primary hover:bg-[#9ae68c] hover:text-surface transition-colors text-xs"
              onClick={() => { localStorage.removeItem("admin_token"); window.location.href = "/login"; }}
            >
              LOGOUT
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          <div className={`flex flex-col flex-1 h-full bg-surface ${selectedGuest ? "hidden lg:flex" : "flex"}`}>
            
            {/* Toolbar */}
            <div className="shrink-0 p-3 sm:p-4 border-b border-primary bg-surface z-20 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                  <div className="flex flex-wrap gap-2">
                    {["all", "responded", "not_responded"].map((f) => (
                      <button
                        key={f}
                        className={`px-2 py-1 border border-primary text-xs sm:text-sm hover:bg-[#9ae68c] hover:text-surface transition-colors ${
                          filter === f ? "bg-[#45CC2D] text-black" : ""
                        }`}
                        onClick={() => setFilter(f as any)}
                      >
                        {f.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full sm:w-64 z-40">
                    <Listbox value={selectedGroup ?? undefined} onChange={(val) => {
                      if (!val) { setFilter("all"); setSelectedGroup(null); } 
                      else { setFilter("group"); setSelectedGroup(val); }
                    }}>
                      <ListboxButton className="relative w-full cursor-default border py-1 pl-3 pr-10 text-left text-sm uppercase tracking-tighter transition-all bg-black text-[#45CC2D] border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] focus:outline-none hover:bg-[#9ae68c]">
                        <span className="block truncate">{filter === "group" && selectedGroup ? selectedGroup : "All Groups"}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-4 w-4 text-[#45CC2D]" aria-hidden="true" />
                        </span>
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
                <div className="flex items-center gap-2">
                  {selection.selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 mr-2">
                      <div className="relative w-40">
                        <Listbox onChange={handleBulkGroupAssign}>
                          <ListboxButton className="relative w-full cursor-default border border-[#45CC2D] bg-black py-1 pl-2 pr-8 text-left text-xs uppercase text-[#45CC2D] hover:bg-[#9ae68c] hover:text-black">
                            <span className="block truncate">Assign Group...</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1"><ChevronUpDownIcon className="h-3 w-3" /></span>
                          </ListboxButton>
                          <ListboxOptions className="absolute right-0 z-50 mt-1 max-h-60 w-64 overflow-auto rounded-md bg-[#0a0a0a] border border-[#45CC2D] py-1 shadow-2xl focus:outline-none">
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
                    <tr className="text-left border-b border-primary uppercase text-sm sticky top-0 bg-surface z-10 shadow-sm">
                      <th className="p-2 w-10 bg-surface">
                        {sortedGuests.length > 0 && (
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded bg-black border-[#45CC2D] text-[#45CC2D] focus:ring-[#45CC2D] focus:ring-offset-black"
                            checked={sortedGuests.length > 0 && sortedGuests.every(g => selection.isSelected(g.id))}
                            ref={el => { if (el) { const selectedCount = sortedGuests.filter(g => selection.isSelected(g.id)).length; el.indeterminate = selectedCount > 0 && selectedCount < sortedGuests.length; } }}
                            onChange={() => { const ids = sortedGuests.map((g) => g.id); if (selection.isAllSelected(ids)) selection.deselectMany(ids); else selection.selectMany(ids); }}
                          />
                        )}
                      </th>
                      <th className="p-2 cursor-pointer hover:bg-primary/20 select-none group bg-surface" onClick={() => handleSort("name")}>
                        <div className="flex items-center gap-1">Name <SortIcon field="name" /></div>
                      </th>
                      <th className="p-2 hidden md:table-cell bg-surface">Email</th>
                      <th className="p-2 hidden md:table-cell cursor-pointer hover:bg-primary/20 select-none group bg-surface" onClick={() => handleSort("group")}>
                        <div className="flex items-center gap-1">Group <SortIcon field="group" /></div>
                      </th>
                      <th className="p-2 cursor-pointer hover:bg-primary/20 select-none group bg-surface" onClick={() => handleSort("rsvp")}>
                        <div className="flex items-center gap-1">RSVP <SortIcon field="rsvp" /></div>
                      </th>
                      <th className="p-2 hidden lg:table-cell cursor-pointer hover:bg-primary/20 select-none group bg-surface" onClick={() => handleSort("activity")}>
                        <div className="flex items-center gap-1">Last Activity <SortIcon field="activity" /></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedGuests.map((g, index) => {
                      const { Icon, label } = inferActivityDisplay(g); 
                      return (
                        <tr
                          key={g.id}
                          className={`border-b border-primary cursor-pointer hover:bg-neutral-800 ${selection.isSelected(g.id) ? "bg-primary text-surface" : ""}`}
                          onClick={() => setSelectedGuest(g)}
                        >
                          <td onClick={(e) => handleRowClick(e, g.id, index)} className="p-2 align-top sm:align-middle">
                            <input
                              type="checkbox"
                              className="h-5 w-5 rounded bg-black border-[#45CC2D] text-[#45CC2D] focus:ring-[#45CC2D] focus:ring-offset-black"
                              checked={selection.isSelected(g.id)}
                              onChange={() => {}}
                            />
                          </td>
                          <td className="p-2 align-top sm:align-middle">
                            <div className="flex items-center gap-2">
                              <div className="font-bold sm:font-normal">{g.first_name} {g.last_name}</div>
                              {/* Small Paper Airplane if Invited */}
                              {g.invited_at && (
                                <div title={`Invite sent: ${new Date(g.invited_at).toLocaleDateString()}`}>
                                  <PaperAirplaneIcon className={`h-3 w-3 ${selection.isSelected(g.id) ? "text-black" : "text-[#45CC2D]"}`} />
                                </div>
                              )}
                            </div>
                            <div className="md:hidden flex flex-col gap-0.5 mt-1">
                              <span className={`text-xs truncate max-w-[150px] ${selection.isSelected(g.id) ? "text-black/70" : "text-gray-400"}`}>{g.email}</span>
                              <span className={`text-[10px] uppercase tracking-wider ${selection.isSelected(g.id) ? "text-black/60" : "text-[#45CC2D]"}`}>{canonicalizeGroupLabel(g.group_label)}</span>
                            </div>
                          </td>
                          <td className="p-2 hidden md:table-cell whitespace-nowrap">{g.email}</td>
                          <td className="p-2 hidden md:table-cell whitespace-nowrap">{canonicalizeGroupLabel(g.group_label)}</td>
                          <td className="p-2 align-top sm:align-middle whitespace-nowrap">
                            {g.rsvps?.status ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${g.rsvps.status === 'attending' ? (selection.isSelected(g.id) ? 'bg-black text-[#45CC2D] border border-black' : 'bg-[#45CC2D] text-black') : (selection.isSelected(g.id) ? 'bg-black/20 text-black border border-black' : 'bg-neutral-800 text-gray-300 border border-gray-700')}`}>
                                {g.rsvps.status}
                              </span>
                            ) : (<span className="text-gray-500 text-xs">—</span>)}
                          </td>
                          <td className="p-2 hidden lg:table-cell whitespace-nowrap text-xs">
                            <div className="flex items-center gap-2">
                              {/* Strict color enforcement: text-[#9ae68c] */}
                              <Icon className="h-5 w-5 text-[#9ae68c]" />
                              <div className="flex flex-col">
                                <span className="font-bold">{label}</span>
                                <span className={selection.isSelected(g.id) ? "text-black/60" : "text-gray-500"}>
                                  {formatActivityDate(g.last_activity_at)}
                                </span>
                              </div>
                            </div>
                          </td>
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
      {showAddGuestModal && <AddGuestModal onClose={() => setShowAddGuestModal(false)} onConfirm={handleAddGuests} />}
      {showAddSuccessModal && addSummary && <AddGuestSuccessModal created={addSummary.created} existing={addSummary.existing} invitesAttempted={addSummary.invitesAttempted} onClose={() => { setShowAddSuccessModal(false); setAddSummary(null); }} />}
    </>
  );
}