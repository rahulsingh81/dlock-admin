import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginationComponent } from '@/components/PaginationComponent';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Wallet, IndianRupee, CheckCircle2, Clock, XCircle, Search, Loader2, Undo2 } from 'lucide-react';
import { getTransactions, refundTransaction, deleteTransaction, bulkDelete } from '@/services/api';
import { useBulkSelect } from '@/hooks/use-bulk-select';
import { BulkBar, SelectCheck } from '@/components/bulk-bar';
import { useConfirm } from '@/components/confirm-provider';

const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;
const fmt = (d: any) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const statusPill: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  FAILED: 'bg-red-50 text-red-600',
  CANCELLED: 'bg-slate-100 text-slate-600',
  REFUNDED: 'bg-blue-50 text-blue-600',
};

const TONES: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-[#1560BD]' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-500' },
};

const Stat = ({ title, value, icon: Icon, tone }: { title: string; value: string | number; icon: any; tone: keyof typeof TONES }) => {
  const t = TONES[tone];
  return (
    <Card className="card-hover"><CardContent className="flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.bg}`}><Icon className={`h-5 w-5 ${t.text}`} /></div>
      <div className="min-w-0"><div className="text-xl font-bold tabular-nums text-slate-900">{value}</div><div className="truncate text-xs font-medium text-slate-500">{title}</div></div>
    </CardContent></Card>
  );
};

export default function TransactionsPage() {
  const { toast } = useToast();
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ paid: 0, pending: 0, failed: 0, revenue: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const loadTxns = async () => {
    try {
      setLoading(true);
      const res: any = await getTransactions({ page, limit: 10, status: statusFilter !== 'all' ? statusFilter : undefined, search: search || undefined });
      setTxns(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalItems(res.total || 0);
      setStats(res.stats || { paid: 0, pending: 0, failed: 0, revenue: 0 });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load transactions', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const [refundTxn, setRefundTxn] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNote, setRefundNote] = useState('');
  const [refunding, setRefunding] = useState(false);

  const confirm = useConfirm();
  const bulk = useBulkSelect(txns);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const handleBulkDelete = async () => {
    const ids = bulk.selectedIds;
    if (!ids.length) return;
    const ok = await confirm({
      title: `Delete ${ids.length} transaction(s)?`,
      description: '⚠️ These are financial records. Deleting is permanent and they will no longer appear in reports/CA exports.',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    setBulkDeleting(true);
    try {
      const { ok: done, failed } = await bulkDelete(ids, deleteTransaction);
      toast({ title: `${done} deleted`, description: failed ? `${failed} failed` : 'Selected transactions removed.', variant: failed ? 'destructive' : undefined });
      bulk.clear();
      await loadTxns();
    } finally { setBulkDeleting(false); }
  };

  useEffect(() => { loadTxns(); /* eslint-disable-next-line */ }, [page, statusFilter, search]);

  const openRefund = (t: any) => {
    setRefundTxn(t);
    setRefundAmount(String(t.amount || 0));
    setRefundNote('');
  };
  const confirmRefund = async () => {
    if (!refundTxn) return;
    const amt = Number(refundAmount);
    if (!amt || amt <= 0 || amt > Number(refundTxn.amount)) {
      toast({ title: 'Invalid amount', description: `Enter an amount between ₹1 and ₹${refundTxn.amount}`, variant: 'destructive' });
      return;
    }
    setRefunding(true);
    try {
      const res: any = await refundTransaction(refundTxn._id, amt, refundNote);
      toast({ title: 'Refund initiated', description: res.message || 'The customer has been refunded.' });
      setRefundTxn(null);
      loadTxns();
    } catch (err: any) {
      toast({ title: 'Refund failed', description: err.message || 'Could not process refund', variant: 'destructive' });
    } finally { setRefunding(false); }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat title="Revenue (Paid)" value={inr(stats.revenue)} icon={IndianRupee} tone="emerald" />
        <Stat title="Paid" value={stats.paid} icon={CheckCircle2} tone="emerald" />
        <Stat title="Pending" value={stats.pending} icon={Clock} tone="amber" />
        <Stat title="Failed" value={stats.failed} icon={XCircle} tone="rose" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search order id, customer, email..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v); }}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      <BulkBar count={bulk.count} onClear={bulk.clear} onDelete={handleBulkDelete} deleting={bulkDeleting} noun="transaction" />

      {/* Table */}
      <Card>
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full">
            <thead className="bg-slate-50"><tr>
              <th className="px-4 py-3.5 w-10"><SelectCheck ariaLabel="Select all transactions" checked={bulk.allSelected} indeterminate={bulk.someSelected} onChange={bulk.toggleAll} /></th>
              {['Order ID', 'Customer', 'Amount', 'Status', 'Gateway', 'Date', 'Action'].map((h) => (
                <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-300" /></td></tr>
              ) : txns.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-500">No transactions yet</td></tr>
              ) : txns.map((t) => (
                <tr key={t._id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-4"><SelectCheck ariaLabel="Select transaction" checked={bulk.selected.has(t._id)} onChange={() => bulk.toggle(t._id)} /></td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-700">
                    <div className="font-semibold text-slate-800">{t.orderId}</div>
                    {(t.cfPaymentId || t.providerPaymentId) && <div className="text-[11px] text-slate-400">Pay ID: {t.cfPaymentId || t.providerPaymentId}</div>}
                    {(t.cfOrderId || t.providerOrderId) && <div className="text-[11px] text-slate-400">{t.gateway === 'phonepe' ? 'PP' : 'CF'}: {t.cfOrderId || t.providerOrderId}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{t.customerName || '—'}</div>
                    <div className="text-xs text-slate-500">{t.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold tabular-nums text-slate-900">{inr(t.amount)}</td>
                  <td className="px-6 py-4"><span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', statusPill[t.status] || statusPill.PENDING)}>{t.status}</span></td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600"><Wallet className="h-3.5 w-3.5" /> {t.gateway}<span className="ml-1 rounded bg-slate-100 px-1 text-[10px] uppercase">{t.mode}</span></span>
                    {t.paymentMethod && (
                      <div className="mt-1"><span className="inline-flex rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#1560BD]">{String(t.paymentMethod).replace(/_/g, ' ')}</span></div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{fmt(t.createdAt)}</td>
                  <td className="px-6 py-4">
                    {t.status === 'PAID' ? (
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-rose-600 hover:bg-rose-50" onClick={() => openRefund(t)}>
                        <Undo2 className="h-3.5 w-3.5" /> Refund
                      </Button>
                    ) : t.status === 'REFUNDED' ? (
                      <span className="text-xs font-medium text-slate-400">Refunded</span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationComponent currentPage={page} totalPages={totalPages} totalItems={totalItems} itemsPerPage={10} onPageChange={setPage} itemType="transactions" />
      </Card>

      {/* Refund confirmation dialog */}
      <Dialog open={!!refundTxn} onOpenChange={(o) => { if (!o) setRefundTxn(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Undo2 className="h-5 w-5 text-rose-600" /> Refund payment</DialogTitle>
            <DialogDescription>
              This will refund the customer via {refundTxn?.gateway === 'phonepe' ? 'PhonePe' : 'Cashfree'}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {refundTxn && (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Order</span><span className="font-mono text-slate-800">{refundTxn.orderId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="text-slate-800">{refundTxn.customerName || refundTxn.customerEmail}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="font-semibold text-slate-900">{inr(refundTxn.amount)}</span></div>
              </div>
              <div>
                <Label>Refund amount (₹)</Label>
                <Input
                  type="number"
                  min={1}
                  max={refundTxn.amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
                <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                  <span>Max ₹{Number(refundTxn.amount).toLocaleString('en-IN')} (full refund)</span>
                  <button type="button" className="font-medium text-[#1560BD] hover:underline" onClick={() => setRefundAmount(String(refundTxn.amount))}>Full amount</button>
                </div>
              </div>
              <div>
                <Label>Note (optional)</Label>
                <Input value={refundNote} onChange={(e) => setRefundNote(e.target.value)} placeholder="Reason for refund" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRefundTxn(null)} disabled={refunding}>Cancel</Button>
            <Button className="bg-rose-600 text-white hover:bg-rose-700" onClick={confirmRefund} disabled={refunding}>
              {refunding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Undo2 className="mr-2 h-4 w-4" />}
              Confirm Refund {refundAmount ? `₹${Number(refundAmount).toLocaleString('en-IN')}` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
