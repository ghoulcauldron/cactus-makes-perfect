import React, { useEffect, useState } from "react";
import { fetchAdminGuests } from "./api/client";
import GuestSidebar from "./GuestSidebar";
import BulkActions from "./BulkActions";
import { useSelection } from "./hooks/useSelection";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import AddGuestModal from "./components/AddGuestModal";
import AddGuestSuccessModal from "./components/AddGuestSuccessModal";
import { createAdminGuest, sendAdminInvite } from "./api/client";

function canonicalizeGroupLabel(label: string | null | undefined): string {
  if (!label) return "—";
  const cleaned = label.trim().toLowerCase().replace(/\s+/g, "-");
  return cleaned;
}

export default function AdminDashboard() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
  const [filter, setFilter] = useState<"all" | "not_responded" | "responded" | "group">(
    "all"
  );
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showAddSuccessModal, setShowAddSuccessModal] = useState(false);
  const [addSummary, setAddSummary] = useState<{
    count: number;
    invitesSent: boolean;
  } | null>(null);

  async function refreshGuests() {
    setLoading(true);
    const data = await fetchAdminGuests();
    setGuests(data.guests);
    setLoading(false);
  }

  useEffect(() => {
    refreshGuests();
  }, []);

  const filteredGuests = guests.filter((g) => {
    if (filter === "responded") return g.rsvps?.status;
    if (filter === "not_responded") return !g.rsvps?.status;
    if (filter === "group") {
      return canonicalizeGroupLabel(g.group_label) === selectedGroup;
    }
    return true;
  });

  const selection = useSelection({
    items: filteredGuests,
    getGroupId: (g) => canonicalizeGroupLabel(g.group_label),
  });
  const currentGroup = filter === "group" ? selectedGroup : null;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        const ids = filteredGuests.map((g) => g.id);
        if (!ids.length) return;
        if (selection.isAllSelected(ids)) {
          selection.deselectMany(ids);
        } else {
          selection.selectMany(ids);
        }
      }

      if (e.key === "Escape") {
        e.preventDefault();
        selection.clear();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [filteredGuests, selection]);

  async function handleAddGuests(
    guestsToAdd: any[],
    options: {
      sendInvite: boolean;
      inviteTemplate: "default" | "friendly";
      subscribed: boolean;
    }
  ) {
    // Optimistic insert
    const optimisticRows = guestsToAdd.map((g) => ({
      id: `optimistic-${Math.random()}`,
      email: g.email,
      first_name: g.first_name,
      last_name: g.last_name,
      phone: g.phone || null,
      group_label: g.group_label || null,
      subscribed: options.subscribed,
      rsvps: null,
      last_activity_at: "just now",
    }));

    setGuests((prev) => [...optimisticRows, ...prev]);

    for (const guest of guestsToAdd) {
      const created = await createAdminGuest({
        email: guest.email,
        first_name: guest.first_name,
        last_name: guest.last_name,
        phone: guest.phone,
        group_label: guest.group_label,
        subscribed: options.subscribed,
      });

      if (options.sendInvite) {
        await sendAdminInvite(created.id, options.inviteTemplate);
      }
    }

    await refreshGuests();

    setShowAddGuestModal(false);

    setAddSummary({
      count: guestsToAdd.length,
      invitesSent: options.sendInvite,
    });
    setShowAddSuccessModal(true);
  }

  if (loading) {
    return <div className="p-8 text-primary font-mono">Loading…</div>;
  }

  return (
    <>
      <div className="flex flex-col h-screen sm:h-dvh bg-surface text-primary font-mono border-4 border-primary">
        {/* 1. GLOBAL HEADER (Always Pinned) */}
        <div className="shrink-0 px-3 py-1 border-b border-primary bg-surface uppercase tracking-widest text-sm w-full z-30">
          <div className="flex items-center justify-between w-full">
            <span className="truncate mr-2">CACTUS MAKES PERFECT - AREA 51</span>
            <button
              className="shrink-0 px-2 py-0.5 border border-primary text-primary hover:bg-[#9ae68c] hover:text-surface transition-colors text-xs"
              onClick={() => {
                localStorage.removeItem("admin_token");
                window.location.href = "/login";
              }}
            >
              LOGOUT
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* LEFT PANEL WRAPPER */}
          <div
            className={`flex flex-col flex-1 h-full bg-surface ${
              selectedGuest ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* 2. FILTERS & ACTIONS (Pinned) */}
            {/* This block is outside the overflow-auto div below, so it stays fixed */}
            <div className="shrink-0 p-3 sm:p-4 border-b border-primary bg-surface z-20 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                  {/* Filter Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={`px-2 py-1 border border-primary text-xs sm:text-sm hover:bg-[#9ae68c] hover:text-surface transition-colors ${
                        filter === "all" ? "bg-[#45CC2D] text-black" : ""
                      }`}
                      onClick={() => setFilter("all")}
                    >
                      ALL
                    </button>
                    <button
                      className={`px-2 py-1 border border-primary text-xs sm:text-sm hover:bg-[#9ae68c] hover:text-surface transition-colors ${
                        filter === "responded" ? "bg-[#45CC2D] text-black" : ""
                      }`}
                      onClick={() => setFilter("responded")}
                    >
                      RESPONDED
                    </button>
                    <button
                      className={`px-2 py-1 border border-primary text-xs sm:text-sm hover:bg-[#9ae68c] hover:text-surface transition-colors ${
                        filter === "not_responded" ? "bg-[#45CC2D] text-black" : ""
                      }`}
                      onClick={() => setFilter("not_responded")}
                    >
                      NO RSVP
                    </button>
                  </div>

                  {/* Dropdown */}
                  <div className="relative w-full sm:w-64 z-40">
                    <Listbox
                      value={selectedGroup ?? undefined}
                      onChange={(val) => {
                        if (!val) {
                          setFilter("all");
                          setSelectedGroup(null);
                        } else {
                          setFilter("group");
                          setSelectedGroup(val);
                        }
                      }}
                    >
                      <ListboxButton
                        className={`
                      relative w-full cursor-default border py-1 pl-3 pr-10 text-left text-sm uppercase tracking-tighter transition-all
                      bg-black text-[#45CC2D] border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] focus:outline-none hover:bg-[#9ae68c]
                    `}
                      >
                        <span className="block truncate">
                          {filter === "group" && selectedGroup
                            ? selectedGroup
                            : "All Groups"}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon
                            className="h-4 w-4 text-[#45CC2D]"
                            aria-hidden="true"
                          />
                        </span>
                      </ListboxButton>

                      <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#0a0a0a] border border-[#45CC2D] py-1 shadow-2xl focus:outline-none">
                        <ListboxOption
                          value=""
                          className={({ active }) => `
                          relative cursor-default select-none py-2 pl-10 pr-4 text-[10px] font-bold uppercase transition-colors
                          ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}
                        `}
                        >
                          All Groups
                        </ListboxOption>
                        {Array.from(
                          new Set(
                            guests.map((g) => canonicalizeGroupLabel(g.group_label))
                          )
                        )
                          .filter((x) => x && x !== "—")
                          .map((g) => (
                            <ListboxOption
                              key={g}
                              value={g}
                              className={({ active }) => `
                              relative cursor-default select-none py-2 pl-10 pr-4 text-[10px] uppercase transition-colors
                              ${active ? "bg-[#45CC2D] text-black" : "text-gray-300"}
                            `}
                            >
                              {({ selected }) => (
                                <>
                                  <span
                                    className={`block truncate ${
                                      selected ? "font-bold" : "font-normal"
                                    }`}
                                  >
                                    {g}
                                  </span>
                                  {selected && (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                      <CheckIcon
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      />
                                    </span>
                                  )}
                                </>
                              )}
                            </ListboxOption>
                          ))}
                      </ListboxOptions>
                    </Listbox>
                  </div>
                </div>

                {/* Bulk Actions */}
                <BulkActions
                  selectedIds={selection.selectedIds}
                  clearSelection={selection.clear}
                  currentGroup={currentGroup}
                />
                <button
                  className="px-2 py-1 border border-primary text-xs hover:bg-[#45CC2D] hover:text-black transition-colors"
                  onClick={() => setShowAddGuestModal(true)}
                >
                  + ADD GUESTS
                </button>
              </div>
            </div>

            {/* 3. SCROLLABLE CONTENT (Table Area) */}
            <div className="flex-1 overflow-auto p-3 sm:p-6 z-10">
              {/* Group Selection Banner (Scrolls with table) */}
              {currentGroup && (
                <div className="mb-3 flex flex-wrap items-center justify-between border border-primary bg-surface px-3 py-2 gap-2 shadow-md">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded bg-black border-[#45CC2D] text-[#45CC2D] focus:ring-[#45CC2D] focus:ring-offset-black"
                      ref={(el) => {
                        if (!el) return;
                        const groupIds = filteredGuests.map((g) => g.id);
                        const selectedCount = groupIds.filter((id) =>
                          selection.isSelected(id)
                        ).length;
                        el.indeterminate =
                          selectedCount > 0 && selectedCount < groupIds.length;
                      }}
                      checked={
                        filteredGuests.length > 0 &&
                        selection.isAllSelected(filteredGuests.map((g) => g.id))
                      }
                      onChange={() => selection.selectAllInGroup(currentGroup)}
                      aria-label={`Select all guests in group ${currentGroup}`}
                    />
                    <div className="text-sm">
                      <span className="font-semibold">Group:</span>{" "}
                      <span className="font-mono">{currentGroup}</span>{" "}
                      <span className="text-gray-500">({filteredGuests.length})</span>
                    </div>
                  </div>

                  <button
                    className="text-sm border border-primary px-2 py-0.5 hover:bg-primary hover:text-surface"
                    onClick={() => {
                      selection.clear();
                      setFilter("all");
                      setSelectedGroup(null);
                    }}
                  >
                    Clear group ✕
                  </button>
                </div>
              )}

              {/* Table */}
              <div className="w-full border border-primary">
                <table className="w-full border-collapse">
                  <thead>
                    {/* Standard non-sticky row */}
                    <tr className="text-left border-b border-primary uppercase text-sm">
                      <th className="p-2 w-10">
                        {filteredGuests.length > 0 && (
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded bg-black border-[#45CC2D] text-[#45CC2D] focus:ring-[#45CC2D] focus:ring-offset-black"
                            ref={(el) => {
                              if (!el) return;
                              const ids = filteredGuests.map((g) => g.id);
                              const selectedCount = ids.filter((id) => selection.isSelected(id)).length;
                              el.indeterminate = selectedCount === ids.length && ids.length > 0;
                            }}
                            checked={
                              filteredGuests.length > 0 &&
                              filteredGuests.some((g) => selection.isSelected(g.id))
                            }
                            onChange={() => {
                              const ids = filteredGuests.map((g) => g.id);
                              if (selection.isAllSelected(ids)) {
                                selection.deselectMany(ids);
                              } else {
                                selection.selectMany(ids);
                              }
                            }}
                            aria-label="Select all guests"
                          />
                        )}
                      </th>
                      <th className="p-2">Name</th>
                      <th className="p-2 hidden md:table-cell">Email</th>
                      <th className="p-2 hidden md:table-cell">Group</th>
                      <th className="p-2">RSVP</th>
                      <th className="p-2 hidden lg:table-cell">Last Activity</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredGuests.map((g) => (
                      <tr
                        key={g.id}
                        className={`border-b border-primary cursor-pointer hover:bg-neutral-800 ${
                          selection.isSelected(g.id)
                            ? "bg-primary text-surface"
                            : ""
                        }`}
                        onClick={() => setSelectedGuest(g)}
                      >
                        <td
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 align-top sm:align-middle"
                        >
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded bg-black border-[#45CC2D] text-[#45CC2D] focus:ring-[#45CC2D] focus:ring-offset-black"
                            checked={selection.isSelected(g.id)}
                            onChange={() => selection.toggle(g.id)}
                            onKeyDown={(e) => selection.onCheckboxKeyDown(e, g.id)}
                          />
                        </td>

                        <td className="p-2 align-top sm:align-middle">
                          {/* Name (Primary) */}
                          <div className="font-bold sm:font-normal">
                            {g.first_name} {g.last_name}
                          </div>

                          {/* Mobile Only: Stacked Details */}
                          <div className="md:hidden flex flex-col gap-0.5 mt-1">
                            <span
                              className={`text-xs truncate max-w-[150px] ${
                                selection.isSelected(g.id)
                                  ? "text-black/70"
                                  : "text-gray-400"
                              }`}
                            >
                              {g.email}
                            </span>
                            <span
                              className={`text-[10px] uppercase tracking-wider ${
                                selection.isSelected(g.id)
                                  ? "text-black/60"
                                  : "text-[#45CC2D]"
                              }`}
                            >
                              {canonicalizeGroupLabel(g.group_label)}
                            </span>
                          </div>
                        </td>

                        {/* Desktop Columns */}
                        <td className="p-2 hidden md:table-cell whitespace-nowrap">
                          {g.email}
                        </td>
                        <td className="p-2 hidden md:table-cell whitespace-nowrap">
                          {canonicalizeGroupLabel(g.group_label)}
                        </td>

                        <td className="p-2 align-top sm:align-middle whitespace-nowrap">
                          {g.rsvps?.status || "—"}
                        </td>

                        <td className="p-2 hidden lg:table-cell whitespace-nowrap">
                          {g.last_activity_at || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          {selectedGuest && (
            <div className="absolute inset-0 z-50 w-full h-full bg-surface overflow-auto lg:static lg:w-auto lg:border-l lg:border-primary lg:z-auto">
              <GuestSidebar guest={selectedGuest} onClose={() => setSelectedGuest(null)} />
            </div>
          )}
        </div>
      </div>

      {showAddGuestModal && (
        <AddGuestModal
          onClose={() => setShowAddGuestModal(false)}
          onConfirm={handleAddGuests}
        />
      )}

      {showAddSuccessModal && addSummary ? (
        <AddGuestSuccessModal
          count={addSummary.count}
          invitesSent={addSummary.invitesSent}
          onClose={() => {
            setShowAddSuccessModal(false);
            setAddSummary(null);
          }}
        />
      ) : null}
    </>
  );
}