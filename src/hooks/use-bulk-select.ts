import { useCallback, useMemo, useState } from 'react';

/**
 * Reusable multi-select for tables.
 * Pass the currently-visible rows (any objects with an `_id`); tracks a Set of selected ids.
 */
export function useBulkSelect<T extends { _id: string }>(items: T[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const ids = useMemo(() => items.map((i) => i._id), [items]);
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = ids.some((id) => selected.has(id));

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const allNow = ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allNow) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }, [ids]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  return { selected, selectedIds, count: selected.size, allSelected, someSelected, toggle, toggleAll, clear };
}
