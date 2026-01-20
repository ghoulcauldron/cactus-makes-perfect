import React, { useEffect, useState } from "react";
import { fetchAdminGuests } from "./api/client";
import GuestSidebar from "./GuestSidebar";
import BulkActions from "./BulkActions";
import { useSelection } from "./hooks/useSelection";
// 1. Import Headless UI components
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';

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

  useEffect(() => {
    (async () => {
      const data = await fetchAdminGuests();
      setGuests(data.guests);
      setLoading(false);
    })();
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
      // Ignore typing inside inputs / textareas
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      // A = select all (group-aware)
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

      // Esc = clear selection
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

  if (loading) {
    return <div className="p-8 text-primary font-mono">Loading…</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-surface text-primary font-mono border-4 border-primary">
      <div className="px-3 py-1 border-b border-primary bg-surface uppercase tracking-widest text-sm self-start mb-2">
                <div className="flex items-center justify-between w-full">
          <span>CACTUS MAKES PERFECT - AREA 51</span>
          <button
            className="ml-4 px-2 py-0.5 border border-primary text-primary hover:bg-[#9ae68c] hover:text-surface transition-colors text-xs"
            onClick={() => {
              localStorage.removeItem("admin_token");
              window.location.href = "/login";
            }}
          >
            LOGOUT
          </button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
      {/* LEFT PANEL */}
      <div className="flex-1 p-6 overflow-auto bg-surface">

        {/* Filters + Bulk */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              className={`px-2 py-1 border border-primary text-sm hover:bg-[#9ae68c] hover:text-surface transition-colors ${filter === "all" ? "bg-[#45CC2D] text-black" : ""}`}
              onClick={() => setFilter("all")}
            >
              ALL
            </button>
            <button
              className={`px-2 py-1 border border-primary text-sm hover:bg-[#9ae68c] hover:text-surface transition-colors ${filter === "responded" ? "bg-[#45CC2D] text-black" : ""}`}
              onClick={() => setFilter("responded")}
            >
              RESPONDED
            </button>
            <button
              className={`px-2 py-1 border border-primary text-sm hover:bg-[#9ae68c] hover:text-surface transition-colors ${filter === "not_responded" ? "bg-[#45CC2D] text-black" : ""}`}
              onClick={() => setFilter("not_responded")}
            >
              NOT RESPONDED
            </button>

            {/* HEADLESS UI GROUP FILTER */}
            <div className="relative ml-4 w-64">
              <Listbox
                value={selectedGroup ?? undefined} // Consistent with your modal fix
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
                {/* Updated to match modal focus and border behavior */}
                <ListboxButton className={`
                  relative w-full cursor-default border py-1 pl-3 pr-10 text-left text-sm uppercase tracking-tighter transition-all
                  bg-black text-[#45CC2D] border-[#45CC2D] focus:ring-1 focus:ring-[#45CC2D] focus:outline-none hover:bg-[#9ae68c]
                `}>
                  <span className="block truncate">
                    {filter === "group" && selectedGroup ? selectedGroup : "All Groups"}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-4 w-4 text-[#45CC2D]" aria-hidden="true" />
                  </span>
                </ListboxButton>

                {/* Updated to match modal's #0a0a0a background and rounded-md style */}
                <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#0a0a0a] border border-[#45CC2D] py-1 shadow-2xl focus:outline-none">
                  {/* Default "All Groups" Option */}
                  <ListboxOption
                    value=""
                    className={({ active }) => `
                      relative cursor-default select-none py-2 pl-10 pr-4 text-[10px] font-bold uppercase transition-colors
                      ${active ? 'bg-[#45CC2D] text-black' : 'text-gray-300'}
                    `}
                  >
                    All Groups
                  </ListboxOption>

                  {/* Dynamic Groups */}
                  {Array.from(new Set(guests.map((g) => canonicalizeGroupLabel(g.group_label))))
                    .filter((x) => x && x !== "—")
                    .map((g) => (
                      <ListboxOption
                        key={g}
                        value={g}
                        className={({ active }) => `
                          relative cursor-default select-none py-2 pl-10 pr-4 text-[10px] uppercase transition-colors
                          ${active ? 'bg-[#45CC2D] text-black' : 'text-gray-300'}
                        `}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>
                              {g}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <CheckIcon className="h-4 w-4" aria-hidden="true" />
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

          <BulkActions
            selectedIds={selection.selectedIds}
            clearSelection={selection.clear}
            currentGroup={currentGroup}
          />
        </div>


        {currentGroup && (
          <div className="mb-3 flex items-center justify-between border border-primary bg-surface px-3 py-2">
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
                onChange={() => {
                  selection.selectAllInGroup(currentGroup);
                }}
                aria-label={`Select all guests in group ${currentGroup}`}
              />

              <div className="text-sm">
                <span className="font-semibold">Group:</span>{" "}
                <span className="font-mono">{currentGroup}</span>{" "}
                <span className="text-gray-500">
                  ({filteredGuests.length} guests)
                </span>
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

        {/* GUEST TABLE */}
        <table className="w-full border-collapse border border-primary">
          <thead>
            <tr className="text-left border-b border-primary uppercase text-sm">
              <th className="p-2">
                {filteredGuests.length > 0 && (
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded bg-black border-[#45CC2D] text-[#45CC2D] focus:ring-[#45CC2D] focus:ring-offset-black"
                    ref={(el) => {
                      if (!el) return;
                      const ids = filteredGuests.map((g) => g.id);
                      const selectedCount = ids.filter((id) =>
                        selection.isSelected(id)
                      ).length;

                      // ONLY indeterminate when all selected
                      el.indeterminate = selectedCount === ids.length && ids.length > 0;
                    }}
                    checked={
                      filteredGuests.length > 0 &&
                      filteredGuests.some((g) => selection.isSelected(g.id))
                    }
                    onChange={() => {
                      const ids = filteredGuests.map((g) => g.id);
                      if (selection.isAllSelected(ids)) {
                        selection.deselectMany(ids);   // all → none
                      } else {
                        selection.selectMany(ids);     // none or some → all
                      }
                    }}
                    aria-label="Select all guests"
                  />
                )}
              </th>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Group</th>
              <th className="p-2">RSVP</th>
              <th className="p-2">Last Activity</th>
            </tr>
          </thead>

          <tbody>
            {filteredGuests.map((g) => (
              <tr
                key={g.id}
                className={`border-b border-primary cursor-pointer hover:bg-neutral-800 ${selection.isSelected(g.id) ? "bg-primary text-surface" : ""}`}
                onClick={() => setSelectedGuest(g)}
              >
                <td
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="p-2"
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded bg-black border-[#45CC2D] text-[#45CC2D] focus:ring-[#45CC2D] focus:ring-offset-black"
                    checked={selection.isSelected(g.id)}
                    onChange={() => selection.toggle(g.id)}
                    onKeyDown={(e) => selection.onCheckboxKeyDown(e, g.id)}
                  />
                </td>

                <td className="p-2">{g.first_name} {g.last_name}</td>
                <td className="p-2">{g.email}</td>
                <td className="p-2">{canonicalizeGroupLabel(g.group_label)}</td>
                <td className="p-2">{g.rsvps?.status || "—"}</td>
                <td className="p-2">{g.last_activity_at || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RIGHT SIDEBAR */}
      {selectedGuest && (
        <GuestSidebar
          guest={selectedGuest}
          onClose={() => setSelectedGuest(null)}
        />
      )}
      </div>
    </div>
  );
}