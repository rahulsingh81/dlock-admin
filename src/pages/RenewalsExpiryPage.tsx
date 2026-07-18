import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  RefreshCw, AlertCircle, CalendarClock, RotateCcw, AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react';
import { getRenewalsOverview, renewOrder } from '@/services/api';
import { useConfirm } from '@/components/confirm-provider';

const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const daysLeft = (d?: string) => {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
};

interface OrderRow {
  _id: string;
  userId?: { _id: string; name?: string; email?: string; phone?: string };
  planName?: string;
  planType?: string;
  totalPrice?: number;
  endDate?: string;
  renewRequestedAt?: string;
  renewRequestMonths?: number;
  paymentStatus?: string;
  serviceStatus?: string;
}

interface Overview {
  requests: OrderRow[];
  expiring: OrderRow[];
  overdue: OrderRow[];
}

const TABS = [
  { key: 'requests', label: 'Renewal Requests', icon: RotateCcw, tone: 'text-[#1560BD]', bg: 'bg-blue-50' },
  { key: 'expiring', label: 'Expiring (7 days)', icon: CalendarClock, tone: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'overdue', label: 'Overdue / Unpaid', icon: AlertTriangle, tone: 'text-rose-600', bg: 'bg-rose-50' },
] as const;

export default function RenewalsExpiryPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'requests' | 'expiring' | 'overdue'>('requests');
  const [months, setMonths] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const { toast } = useToast();
  const confirm = useConfirm();

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRenewalsOverview();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load renewals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (o: OrderRow) => {
    const m = months[o._id] || o.renewRequestMonths || 1;
    const who = o.userId?.name || o.userId?.email || 'this customer';
    const ok = await confirm({
      title: 'Confirm renewal',
      description: `Renew "${o.planName || 'this order'}" for ${who} by ${m} month(s)?`,
      confirmText: 'Renew',
    });
    if (!ok) return;
    try {
      setBusy(o._id);
      await renewOrder(o._id, m);
      toast({ title: 'Renewed', description: `${o.planName || 'Order'} extended by ${m} month(s).` });
      await load();
    } catch (err: any) {
      toast({ title: 'Renewal failed', description: err?.message || 'Try again', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <div>
          <p className="font-semibold text-slate-900">Could not load renewals</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-[#1560BD] px-4 py-2 text-sm font-medium text-white hover:bg-[#124f9c]">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  const d = data!;
  const counts = { requests: d.requests.length, expiring: d.expiring.length, overdue: d.overdue.length };
  const rows = d[tab];

  const CustomerCell = (o: OrderRow) => (
    <div>
      <div className="font-medium text-slate-900">{o.userId?.name || 'Unknown'}</div>
      <div className="text-xs text-slate-500">{o.userId?.email || '—'}</div>
      {o.userId?.phone && <div className="text-xs text-slate-400">{o.userId.phone}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Renewals & Expiry</h1>
          <p className="text-sm text-slate-500">Approve renewal requests, catch expiring services, and chase overdue payments.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Summary cards / tab switch */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TABS.map((t) => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-xl border bg-white p-5 text-left transition-all ${active ? 'border-[#1560BD] ring-2 ring-[#1560BD]/20 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-bold tabular-nums text-slate-900">{counts[t.key]}</div>
                  <div className="mt-0.5 text-sm font-medium text-slate-500">{t.label}</div>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${t.bg}`}>
                  <Icon className={`h-5 w-5 ${t.tone}`} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">
            {TABS.find((t) => t.key === tab)?.label} <span className="text-slate-400">({rows.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-300" />
              <p className="text-sm">Nothing here — all clear.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">{tab === 'requests' ? 'Requested' : 'Expiry'}</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => {
                    const dl = daysLeft(o.endDate);
                    return (
                      <tr key={o._id} className="border-b border-slate-50 transition-colors hover:bg-slate-50/60">
                        <td className="px-4 py-3">{CustomerCell(o)}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {o.planName || '—'}
                          {o.planType && <span className="ml-1 text-xs uppercase text-slate-400">({o.planType})</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{inr(o.totalPrice || 0)}</td>
                        <td className="px-4 py-3">
                          {tab === 'requests' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="h-3 w-3" /> {fmtDate(o.renewRequestedAt)}
                            </span>
                          ) : (
                            <div>
                              <div className="text-slate-700">{fmtDate(o.endDate)}</div>
                              {dl !== null && (
                                <div className={`text-xs ${dl < 0 ? 'text-rose-600' : dl <= 3 ? 'text-amber-600' : 'text-slate-400'}`}>
                                  {dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'expires today' : `${dl}d left`}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <Badge className={`border-0 font-medium capitalize ${o.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{o.paymentStatus}</Badge>
                            {o.serviceStatus && o.serviceStatus !== 'active' && (
                              <Badge className="border-0 bg-slate-100 font-medium capitalize text-slate-600">{o.serviceStatus}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={months[o._id] || o.renewRequestMonths || 1}
                              onChange={(e) => setMonths((m) => ({ ...m, [o._id]: Number(e.target.value) }))}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-[#1560BD] focus:outline-none"
                            >
                              {[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} mo</option>)}
                            </select>
                            <button
                              disabled={busy === o._id}
                              onClick={() => approve(o)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1560BD] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#124f9c] disabled:opacity-50"
                            >
                              {busy === o._id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                              {tab === 'requests' ? 'Approve' : 'Renew'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
