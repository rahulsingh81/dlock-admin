import { Loader2, Trash2, X } from 'lucide-react';

/**
 * Floating action bar shown when one or more table rows are selected.
 * Renders nothing when count === 0.
 */
export function BulkBar({
  count,
  onDelete,
  onClear,
  deleting = false,
  noun = 'item',
}: {
  count: number;
  onDelete: () => void;
  onClear: () => void;
  deleting?: boolean;
  /** singular noun, e.g. "order", "user" */
  noun?: string;
}) {
  if (!count) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1560BD]/25 bg-blue-50/70 px-4 py-2.5 shadow-sm">
      <span className="text-sm font-semibold text-[#0d3a73]">
        {count} {noun}{count > 1 ? 's' : ''} selected
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onClear}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete selected
        </button>
      </div>
    </div>
  );
}

/** Checkbox styled consistently for table select-all / row select. */
export function SelectCheck({
  checked,
  onChange,
  indeterminate = false,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  indeterminate?: boolean;
  ariaLabel?: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked}
      ref={(el) => { if (el) el.indeterminate = indeterminate && !checked; }}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#1560BD] focus:ring-[#1560BD]"
    />
  );
}
