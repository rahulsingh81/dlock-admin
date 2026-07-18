import { useState } from 'react';
import { useBulkSelect } from './use-bulk-select';
import { useConfirm } from '@/components/confirm-provider';
import { useToast } from './use-toast';
import { bulkDelete } from '@/services/api';

/**
 * One-liner bulk delete for tables: wires selection + confirm popup + toast + reload.
 * Usage: const { bulk, deleting, onDelete } = useTableBulk(rows, { noun:'user', deleteOne: deleteUser, reload: load });
 */
export function useTableBulk<T extends { _id: string }>(
  items: T[],
  opts: {
    noun: string;
    deleteOne: (id: string) => Promise<any>;
    reload: () => Promise<any> | void;
    description?: string;
  }
) {
  const bulk = useBulkSelect(items);
  const confirm = useConfirm();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    const ids = bulk.selectedIds;
    if (!ids.length) return;
    const ok = await confirm({
      title: `Delete ${ids.length} ${opts.noun}${ids.length > 1 ? 's' : ''}?`,
      description: opts.description || 'This permanently removes the selected rows. This cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      const { ok: done, failed } = await bulkDelete(ids, opts.deleteOne);
      toast({
        title: `${done} deleted`,
        description: failed ? `${failed} failed` : 'Selected rows removed.',
        variant: failed ? 'destructive' : undefined,
      });
      bulk.clear();
      await opts.reload();
    } finally {
      setDeleting(false);
    }
  };

  return { bulk, deleting, onDelete };
}
