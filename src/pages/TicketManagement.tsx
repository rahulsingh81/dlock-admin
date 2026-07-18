import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { PaginationComponent } from '@/components/PaginationComponent';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  LifeBuoy, Search, Plus, Eye, Edit, Trash2, Loader2, Send, MessageSquare,
  Clock, CheckCircle2, CircleDot, Archive,
} from 'lucide-react';
import {
  fetchTickets, fetchTicketStats, fetchSingleTicket, createNewTicket,
  updateExistingTicket, removeTicket, addReplyToTicket, changeTicketStatus,
} from '@/services/api';

const TONES: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-[#1560BD]' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-500' },
};

const statusPill: Record<string, string> = {
  open: 'bg-blue-50 text-[#1560BD]',
  in_progress: 'bg-amber-50 text-amber-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
};
const statusLabel: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
};
const priorityPill: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-[#1560BD]',
  high: 'bg-amber-50 text-amber-700',
  urgent: 'bg-rose-50 text-rose-600',
};

const fmtDateTime = (d: any) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const StatsCard = ({ title, value, icon: Icon, tone = 'blue' }: { title: string; value: number; icon: any; tone?: keyof typeof TONES }) => {
  const t = TONES[tone] || TONES.blue;
  return (
    <Card className="card-hover">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.bg}`}>
          <Icon className={`h-5 w-5 ${t.text}`} />
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold leading-tight tabular-nums text-slate-900">{value}</div>
          <div className="truncate text-xs font-medium text-slate-500">{title}</div>
        </div>
      </CardContent>
    </Card>
  );
};

const emptyForm = { title: '', description: '', customer_name: '', customer_email: '', priority: 'medium', status: 'open' };

export default function TicketManagement() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [modalType, setModalType] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const loadStats = async () => {
    try { setStats(await fetchTicketStats()); } catch { /* ignore */ }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res: any = await fetchTickets({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchTerm || undefined,
      });
      setTickets(res.tickets || []);
      setTotalPages(res.totalPages || 1);
      setTotalItems(res.totalTickets || 0);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load tickets', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); loadStats(); /* eslint-disable-next-line */ }, [currentPage, statusFilter, priorityFilter, searchTerm, itemsPerPage]);

  const openModal = async (type: string, ticket?: any) => {
    setModalType(type);
    setReplyText('');
    if (type === 'add') {
      setForm(emptyForm);
      setSelected(null);
    } else if (ticket) {
      setSelected(ticket);
      if (type === 'edit') {
        setForm({
          title: ticket.title || '', description: ticket.description || '',
          customer_name: ticket.customer_name || '', customer_email: ticket.customer_email || '',
          priority: ticket.priority || 'medium', status: ticket.status || 'open',
        });
      }
      if (type === 'view') {
        try { setSelected(await fetchSingleTicket(ticket._id || ticket.id)); } catch { /* keep list row */ }
      }
    }
  };

  const closeModal = () => { setModalType(null); setSelected(null); setForm(emptyForm); setReplyText(''); };

  const handleSave = async () => {
    if (!form.title || !form.customer_name || !form.customer_email) {
      toast({ title: 'Missing fields', description: 'Title, customer name and email are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (modalType === 'add') {
        await createNewTicket(form);
        toast({ title: 'Success', description: 'Ticket created' });
      } else if (modalType === 'edit' && selected) {
        await updateExistingTicket(selected._id || selected.id, form);
        toast({ title: 'Success', description: 'Ticket updated' });
      }
      loadTickets(); loadStats(); closeModal();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save ticket', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await removeTicket(selected._id || selected.id);
      toast({ title: 'Deleted', description: 'Ticket removed' });
      loadTickets(); loadStats(); closeModal();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    setReplying(true);
    try {
      const updated = await addReplyToTicket(selected._id || selected.id, { message: replyText.trim() });
      setSelected(updated);
      setReplyText('');
      loadTickets();
      toast({ title: 'Reply sent' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to send reply', variant: 'destructive' });
    } finally { setReplying(false); }
  };

  const handleStatusChange = async (status: string) => {
    if (!selected) return;
    try {
      const updated = await changeTicketStatus(selected._id || selected.id, status);
      setSelected(updated);
      loadTickets(); loadStats();
      toast({ title: 'Status updated', description: statusLabel[status] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update status', variant: 'destructive' });
    }
  };

  const replies = selected?.replies || [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatsCard title="Total Tickets" value={stats.total} icon={LifeBuoy} tone="blue" />
        <StatsCard title="Open" value={stats.open} icon={CircleDot} tone="blue" />
        <StatsCard title="In Progress" value={stats.in_progress} icon={Clock} tone="amber" />
        <StatsCard title="Resolved" value={stats.resolved} icon={CheckCircle2} tone="emerald" />
        <StatsCard title="Closed" value={stats.closed} icon={Archive} tone="slate" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search tickets..." value={searchTerm} onChange={(e) => { setCurrentPage(1); setSearchTerm(e.target.value); }} className="pl-10" />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">Rows</span>
            <Select value={String(itemsPerPage)} onValueChange={(v) => { setCurrentPage(1); setItemsPerPage(Number(v)); }}>
              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setCurrentPage(1); setStatusFilter(v); }}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => { setCurrentPage(1); setPriorityFilter(v); }}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={() => openModal('add')}>
            <Plus className="mr-2 h-4 w-4" /> New Ticket
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {['Ticket', 'Customer', 'Priority', 'Status', 'Replies', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-300" /></td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">No tickets found</td></tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t._id || t.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate font-medium text-slate-900">{t.title}</div>
                      <div className="font-mono text-[11px] text-slate-400">#{String(t._id || t.id).slice(-8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{t.customer_name}</div>
                      <div className="text-xs text-slate-500">{t.customer_email}</div>
                    </td>
                    <td className="px-6 py-4"><span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize', priorityPill[t.priority] || priorityPill.medium)}>{t.priority}</span></td>
                    <td className="px-6 py-4"><span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', statusPill[t.status] || statusPill.open)}>{statusLabel[t.status] || t.status}</span></td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600"><MessageSquare className="h-3.5 w-3.5" />{t.replies?.length || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{fmtDateTime(t.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openModal('view', t)} title="View & Reply" className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-white text-[#1560BD] hover:bg-blue-50"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => openModal('edit', t)} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => openModal('delete', t)} title="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationComponent currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} itemType="tickets" />
      </Card>

      {/* Drawer */}
      <Sheet open={modalType !== null} onOpenChange={closeModal}>
        <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              {modalType === 'view' && 'Ticket Details'}
              {modalType === 'add' && 'New Ticket'}
              {modalType === 'edit' && 'Edit Ticket'}
              {modalType === 'delete' && 'Delete Ticket'}
            </SheetTitle>
            <SheetDescription>
              {modalType === 'view' && 'Conversation & reply'}
              {modalType === 'add' && 'Raise a support ticket for a customer'}
              {modalType === 'edit' && 'Update ticket information'}
              {modalType === 'delete' && 'This action cannot be undone.'}
            </SheetDescription>
          </SheetHeader>

          {/* VIEW + REPLY */}
          {modalType === 'view' && selected && (
            <div className="mt-4 space-y-5">
              <div className="rounded-xl bg-gradient-to-br from-[#1560BD] to-[#0d3a73] p-4 text-white">
                <div className="text-lg font-semibold">{selected.title}</div>
                <div className="text-xs text-blue-100">{selected.customer_name} · {selected.customer_email}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold capitalize', priorityPill[selected.priority])}>{selected.priority}</span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">{statusLabel[selected.status]}</span>
                </div>
              </div>

              {selected.description && (
                <div className="rounded-xl border border-slate-200 p-3 text-sm text-slate-700">{selected.description}</div>
              )}

              {/* Status changer */}
              <div className="flex items-center gap-2">
                <Label className="text-sm text-slate-600">Change status:</Label>
                <Select value={selected.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conversation */}
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-800">Conversation ({replies.length})</div>
                <div className="space-y-3">
                  {replies.length === 0 && <p className="text-sm text-slate-400">No replies yet.</p>}
                  {replies.map((r: any, i: number) => (
                    <div key={r.id || i} className={cn('flex', r.sender === 'admin' ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-[80%] rounded-2xl px-4 py-2 text-sm', r.sender === 'admin' ? 'bg-[#1560BD] text-white' : 'bg-slate-100 text-slate-800')}>
                        <div>{r.message}</div>
                        <div className={cn('mt-1 text-[10px]', r.sender === 'admin' ? 'text-blue-100' : 'text-slate-400')}>
                          {r.sender === 'admin' ? 'You' : selected.customer_name} · {fmtDateTime(r.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply box */}
              <div className="rounded-xl border border-slate-200 p-3">
                <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply..." rows={3} />
                <div className="mt-2 flex justify-end">
                  <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={handleReply} disabled={replying || !replyText.trim()}>
                    {replying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Send Reply
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ADD / EDIT */}
          {(modalType === 'add' || modalType === 'edit') && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Issue title" />
              </div>
              <div>
                <Label>Customer Name *</Label>
                <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Full name" />
              </div>
              <div>
                <Label>Customer Email *</Label>
                <Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {modalType === 'edit' && (
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Describe the issue..." />
              </div>
            </div>
          )}

          {/* DELETE */}
          {modalType === 'delete' && selected && (
            <div className="mt-4 py-4 text-center">
              <p>Are you sure you want to delete this ticket?</p>
              <p className="mt-2 font-semibold">{selected.title}</p>
            </div>
          )}

          <SheetFooter className="mt-6 gap-2 border-t pt-4">
            {modalType === 'view' && <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={closeModal}>Close</Button>}
            {(modalType === 'add' || modalType === 'edit') && (
              <>
                <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
                <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {modalType === 'add' ? 'Create Ticket' : 'Update Ticket'}
                </Button>
              </>
            )}
            {modalType === 'delete' && (
              <>
                <Button variant="outline" onClick={closeModal}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete Ticket</Button>
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
