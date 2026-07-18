import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PaginationComponent } from '@/components/PaginationComponent';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UserPlus, Package, LifeBuoy, RefreshCw, CreditCard, Info, CheckCheck, Loader2, Bell, Megaphone, Send } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead, sendBroadcast } from '@/services/api';
import { useConfirm } from '@/components/confirm-provider';

const TYPE_ICON: Record<string, any> = { register: UserPlus, order: Package, ticket: LifeBuoy, renew: RefreshCw, payment: CreditCard, system: Info };
const TYPE_TONE: Record<string, string> = {
  register: 'bg-blue-50 text-[#1560BD]', order: 'bg-emerald-50 text-emerald-600',
  ticket: 'bg-amber-50 text-amber-600', renew: 'bg-violet-50 text-violet-600',
  payment: 'bg-emerald-50 text-emerald-600', system: 'bg-slate-100 text-slate-600',
};
const fmt = (d: any) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function NotificationsPage() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);

  const load = async () => {
    try {
      setLoading(true);
      const res: any = await getNotifications(filter, page, 20);
      setItems(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
      setUnread(res.unreadCount || 0);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter, page]);

  const readOne = async (id: string, read: boolean) => { if (read) return; await markNotificationRead(id); load(); };
  const readAll = async () => { await markAllNotificationsRead(); load(); };

  // Broadcast composer
  const [bSubject, setBSubject] = useState('');
  const [bMessage, setBMessage] = useState('');
  const [bSegment, setBSegment] = useState<'all' | 'customers'>('all');
  const [bSending, setBSending] = useState(false);
  const doBroadcast = async () => {
    if (!bSubject.trim() || !bMessage.trim()) { toast({ title: 'Missing info', description: 'Enter subject and message', variant: 'destructive' }); return; }
    const ok = await confirm({
      title: 'Send announcement?',
      description: `This will be sent to ${bSegment === 'customers' ? 'all customers' : 'all users'} — email + in-app notification.`,
      confirmText: 'Send',
    });
    if (!ok) return;
    setBSending(true);
    try {
      const res: any = await sendBroadcast({ subject: bSubject, message: bMessage, segment: bSegment });
      toast({ title: 'Sent', description: res.message || 'Broadcast sent' });
      setBSubject(''); setBMessage('');
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to send', variant: 'destructive' });
    } finally { setBSending(false); }
  };

  return (
    <div className="space-y-6">
      {/* Broadcast composer */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-5 w-5 text-[#1560BD]" /> Send Announcement</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label>Subject</Label>
              <Input value={bSubject} onChange={(e) => setBSubject(e.target.value)} placeholder="e.g. New Year offer — 20% off VPS" />
            </div>
            <div>
              <Label>Send to</Label>
              <select value={bSegment} onChange={(e) => setBSegment(e.target.value as any)} className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                <option value="all">All users</option>
                <option value="customers">Customers (with orders)</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Message</Label>
            <Textarea rows={4} value={bMessage} onChange={(e) => setBMessage(e.target.value)} placeholder="Write your announcement… (sent as email + in-app notification)" />
          </div>
          <div className="flex justify-end">
            <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={doBroadcast} disabled={bSending}>
              {bSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Announcement
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={cn('rounded-lg px-4 py-1.5 text-sm font-medium capitalize', filter === f ? 'bg-[#1560BD] text-white' : 'text-slate-600 hover:bg-slate-100')}>
              {f}{f === 'unread' && unread > 0 ? ` (${unread})` : ''}
            </button>
          ))}
        </div>
        {unread > 0 && (
          <Button variant="outline" onClick={readAll} className="w-fit"><CheckCheck className="mr-2 h-4 w-4" /> Mark all read</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-slate-300" /></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
              <Bell className="h-8 w-8" /><p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((n) => {
                const Icon = TYPE_ICON[n.type] || Info;
                return (
                  <button key={n._id} onClick={() => readOne(n._id, n.read)}
                    className={cn('flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50', !n.read && 'bg-blue-50/40')}>
                    <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', TYPE_TONE[n.type] || TYPE_TONE.system)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{n.title}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">{n.type}</span>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-[#1560BD]" />}
                      </div>
                      <p className="text-sm text-slate-600">{n.message}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{fmt(n.createdAt)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
        <PaginationComponent currentPage={page} totalPages={totalPages} totalItems={total} itemsPerPage={20} onPageChange={setPage} itemType="notifications" />
      </Card>

      <p className="text-center text-xs text-slate-400">Notifications are kept for the last 30 days and auto-removed after that.</p>
    </div>
  );
}
