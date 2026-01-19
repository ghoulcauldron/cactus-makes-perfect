import React, { useEffect, useState } from "react";
import { fetchAdminGuests } from "./api/client";
import GuestSidebar from "./GuestSidebar";
import BulkActions from "./BulkActions";
import { useSelection } from "./hooks/useSelection";

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
    return <div className="p-8 text-gray-500">Loading…</div>;
  }

  return (
    <div className="flex h-screen">
      {/* LEFT PANEL */}
      <div className="flex-1 p-6 overflow-auto">

        {/* Filters + Bulk */}
        <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            className={filter === "all" ? "font-bold" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={filter === "responded" ? "font-bold" : ""}
            onClick={() => setFilter("responded")}
          >
            Responded
          </button>
          <button
            className={filter === "not_responded" ? "font-bold" : ""}
            onClick={() => setFilter("not_responded")}
          >
            Not Responded
          </button>
          <select
            className="ml-4 border rounded p-1"
            value={filter === "group" ? selectedGroup || "" : ""}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                setFilter("all");
                setSelectedGroup(null);
              } else {
                setFilter("group");
                setSelectedGroup(val);
              }
            }}
          >
            <option value="">All Groups</option>
            {Array.from(new Set(guests.map((g) => canonicalizeGroupLabel(g.group_label))))
              .filter((x) => x && x !== "—")
              .map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
          </select>
        </div>

          <BulkActions
            selectedIds={selection.selectedIds}
            clearSelection={selection.clear}
            currentGroup={currentGroup}
          />
        </div>


        {currentGroup && (
          <div className="mb-3 flex items-center justify-between rounded border bg-gray-50 px-3 py-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
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
              className="text-sm text-gray-600 hover:text-gray-900"
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
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">
                {filteredGuests.length > 0 && (
                  <input
                    type="checkbox"
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
                className="border-b hover:bg-gray-50 cursor-pointer"
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
  );
}