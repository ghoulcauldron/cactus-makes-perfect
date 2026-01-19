import { useCallback, useMemo, useState } from "react";

type SelectionMode = "single" | "multiple";

interface UseSelectionOptions<T extends { id: string }> {
  items: T[];
  mode?: SelectionMode;
  getGroupId?: (item: T) => string | null;
}

export function useSelection<T extends { id: string }>({
  items,
  mode = "multiple",
  getGroupId,
}: UseSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Ensure we never keep IDs that no longer exist in items
  const itemIdSet = useMemo(
    () => new Set(items.map((i) => i.id)),
    [items]
  );

  const sanitizedSelectedIds = useMemo(
    () => selectedIds.filter((id) => itemIdSet.has(id)),
    [selectedIds, itemIdSet]
  );

  // ---- Core helpers ----

  const isSelected = useCallback(
    (id: string) => sanitizedSelectedIds.includes(id),
    [sanitizedSelectedIds]
  );

  const toggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (mode === "single") {
          return prev.includes(id) ? [] : [id];
        }

        return prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id];
      });
    },
    [mode]
  );

  const selectMany = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      ids.forEach((id) => set.add(id));
      return Array.from(set);
    });
  }, []);

  const deselectMany = useCallback((ids: string[]) => {
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
  }, []);

  const clear = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isAllSelected = useCallback(
    (ids: string[]) =>
      ids.length > 0 && ids.every((id) => sanitizedSelectedIds.includes(id)),
    [sanitizedSelectedIds]
  );

  // ---- Keyboard accessibility ----

  const onCheckboxKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggle(id);
      }

      if (e.key === "Escape") {
        clear();
      }
    },
    [toggle, clear]
  );

  const selectAllInGroup = useCallback(
    (groupId: string) => {
      if (!getGroupId) return;

      const idsInGroup = items
        .filter((item) => getGroupId(item) === groupId)
        .map((item) => item.id);

      if (idsInGroup.length === 0) return;

      setSelectedIds((prev) => {
        const allSelected =
          idsInGroup.length > 0 &&
          idsInGroup.every((id) => prev.includes(id));

        if (allSelected) {
          return prev.filter((id) => !idsInGroup.includes(id));
        }

        const next = new Set(prev);
        idsInGroup.forEach((id) => next.add(id));
        return Array.from(next);
      });
    },
    [items, getGroupId]
  );

  return {
    selectedIds: sanitizedSelectedIds,
    isSelected,
    isAllSelected,
    toggle,
    selectMany,
    deselectMany,
    clear,
    onCheckboxKeyDown,
    selectAllInGroup,
  };
}