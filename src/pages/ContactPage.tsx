import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { PaginationComponent } from '@/components/PaginationComponent';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Mail, Search, Inbox, MailOpen, CheckCircle2, Trash2, Loader2, Reply, Send } from 'lucide-react';
import { getContacts, updateContactStatus, replyContact, deleteContact } from '@/services/api';
import { useTableBulk } from '@/hooks/use-table-bulk';
import { BulkBar, SelectCheck } from '@/components/bulk-bar';

const fmt = (d: string) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const TONE: Record<string, string> = {
  new: 'bg-blue-50 text-[#1560BD]',
  read: 'bg-slate-100 text-slate-600',
  replied: 'bg-emerald-50 text-emerald-700',
};

export default function ContactPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, newCount: 0, repliedCount: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [confirmDel, setConfirmDel] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res: any = await getContacts({
        page, limit: 10,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setItems(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
      setStats({ total: res.total || 0, newCount: res.newCount || 0, repliedCount: res.repliedCount || 0 });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load enquiries', variant: 'destructive' });
    } finally { setLoading(false); }
  };
  const { bulk, deleting, onDelete } = useTableBulk(items, { noun: 'enquiry', deleteOne: deleteContact, reload: load });
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, search, statusFilter]);

  const openView = async (c: any) => {
    setSelected(c);
    setReplyText('');
    if (c.status === 'new') {
      try { await updateContactStatus(c._id, 'read'); load(); } catch { /* ignore */ }
    }
  };

  const sendReply = async () => {
    if (!selected || !replyText.trim()) { toast({ title: 'Write a reply first', variant: 'destructive' }); return; }
    setSending(true);
    try {
      await replyContact(selected._id, replyText.trim());
      toast({ title: 'Reply sent', description: `Email sent to ${selected.email}` });
      setReplyText('');
      setSelected((s: any) => s ? { ...s, status: 'replied' } : s);
      load();
    } catch (err: any) {
      toast({ title: 'Failed to send', description: err.message || 'Check SMTP settings', variant: 'destructive' });
    } finally { setSending(false); }
  };

  const setStatus = async (c: any, status: string) => {
    try { await updateContactStatus(c._id, status); toast({ title: 'Updated' }); load(); setSelected((s: any) => s && s._id === c._id ? { ...s, status } : s); }
    catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const doDelete = async () => {
    if (!confirmDel) return;
    try { await deleteContact(confirmDel._id); toast({ title: 'Deleted' }); setConfirmDel(null); setSelected(null); load(); }
    catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };


  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="card-hover"><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1560BD]"><Inbox className="h-5 w-5" /></div><div><div className="text-xl font-bold tabular-nums text-slate-900">{stats.total}</div><div className="text-xs font-medium text-slate-500">Total Enquiries</div></div></CardContent></Card>
        <Card className="card-hover"><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Mail className="h-5 w-5" /></div><div><div className="text-xl font-bold tabular-nums text-slate-900">{stats.newCount}</div><div className="text-xs font-medium text-slate-500">New / Unread</div></div></CardContent></Card>
        <Card className="card-hover"><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div><div><div className="text-xl font-bold tabular-nums text-slate-900">{stats.repliedCount}</div><div className="text-xs font-medium text-slate-500">Replied</div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search by name, email, subject..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v); }}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      <BulkBar count={bulk.count} onClear={bulk.clear} onDelete={onDelete} deleting={deleting} noun="enquiry" />

      {/* List */}
      <Card>
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full">
            <thead className="bg-slate-50"><tr>
              <th className="px-4 py-3.5 w-10"><SelectCheck ariaLabel="Select all enquiries" checked={bulk.allSelected} indeterminate={bulk.someSelected} onChange={bulk.toggleAll} /></th>
              {['From', 'Subject', 'Received', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-300" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500">No enquiries found</td></tr>
              ) : items.map((c) => (
                <tr key={c._id} className={cn('border-t border-slate-100 transition-colors hover:bg-slate-50/60', c.status === 'new' && 'bg-blue-50/30')}>
                  <td className="px-4 py-4"><SelectCheck ariaLabel="Select enquiry" checked={bulk.selected.has(c._id)} onChange={() => bulk.toggle(c._id)} /></td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.email}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="truncate text-sm text-slate-700">{c.subject || '—'}</div>
                    <div className="truncate text-xs text-slate-400">{c.message}</div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{fmt(c.createdAt)}</td>
                  <td className="px-6 py-4"><span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize', TONE[c.status])}>{c.status}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openView(c)} title="View & Reply" className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-white text-[#1560BD] hover:bg-blue-50"><Reply className="h-4 w-4" /></button>
                      <button onClick={() => setConfirmDel(c)} title="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationComponent currentPage={page} totalPages={totalPages} totalItems={total} itemsPerPage={10} onPageChange={setPage} itemType="enquiries" />
      </Card>

      {/* View drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2"><MailOpen className="h-5 w-5" /> Enquiry</SheetTitle>
                <SheetDescription>{fmt(selected.createdAt)}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{selected.name}</p>
                      <a href={`mailto:${selected.email}`} className="text-sm text-[#1560BD] hover:underline">{selected.email}</a>
                      {selected.phone && <p className="text-sm text-slate-500">{selected.phone}</p>}
                    </div>
                    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize', TONE[selected.status])}>{selected.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subject</p>
                  <p className="mt-1 font-medium text-slate-900">{selected.subject || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Message</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selected.message}</p>
                </div>

                {/* Inline reply — sent from our SMTP */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <Send className="h-4 w-4 text-[#1560BD]" /> Reply to {selected.name}
                  </Label>
                  <Textarea
                    rows={5}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Type your reply to ${selected.email}...`}
                    className="mt-2 bg-white"
                  />
                  <p className="mt-1 text-xs text-slate-400">Sent directly to the customer&apos;s email from your SMTP (info@dlockservices.com).</p>
                  <Button
                    className="mt-3 w-full bg-[#1560BD] text-white hover:bg-[#124f9c]"
                    onClick={sendReply}
                    disabled={sending}
                  >
                    {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : <><Send className="mr-2 h-4 w-4" /> Send Reply</>}
                  </Button>
                </div>
              </div>
              <SheetFooter className="mt-6 gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setStatus(selected, 'replied')}>Mark as Replied</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <Sheet open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <SheetContent side="right" className="w-full p-6 sm:max-w-sm">
          <SheetHeader><SheetTitle>Delete enquiry</SheetTitle><SheetDescription>This cannot be undone.</SheetDescription></SheetHeader>
          {confirmDel && <p className="mt-4 text-sm text-slate-600">Delete the enquiry from <span className="font-semibold">{confirmDel.name}</span>?</p>}
          <SheetFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={() => setConfirmDel(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doDelete}>Delete</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
