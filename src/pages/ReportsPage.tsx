import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw, AlertCircle, IndianRupee, TrendingUp, Repeat, Package, Download, Trophy,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { getReports } from '@/services/api';

const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BAR_COLORS = ['#1560BD', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#64748b'];

interface Reports {
  revenueByMonth: { _id: { y: number; m: number }; revenue: number; orders: number }[];
  ordersByPlan: { _id: string; count: number; revenue: number }[];
  ordersByLocation: { _id: string; count: number }[];
  topCustomers: { _id: string; revenue: number; orders: number; name?: string; email?: string }[];
  newUsersByMonth: { _id: { y: number; m: number }; count: number }[];
  totalRevenue: number;
  mrr: number;
}

const StatsCard = ({ title, value, icon: Icon, tone, sub }: { title: string; value: string; icon: any; tone: { bg: string; text: string }; sub?: string }) => (
  <Card className="card-hover">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold tabular-nums text-slate-900">{value}</div>
          <div className="mt-0.5 text-sm font-medium text-slate-500">{title}</div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone.bg}`}>
          <Icon className={`h-5 w-5 ${tone.text}`} />
        </div>
      </div>
      {sub && <p className="mt-3 text-xs text-slate-500">{sub}</p>}
    </CardContent>
  </Card>
);

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="transition-all duration-200 hover:shadow-md">
    <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle></CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const toCsv = (rows: (string | number)[][]) =>
  rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

const download = (name: string, csv: string) => {
  const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export default function ReportsPage() {
  const [data, setData] = useState<Reports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getReports(from || undefined, to || undefined);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const exportAll = () => {
    if (!data) return;
    const rows: (string | number)[][] = [];
    rows.push(['Revenue by Month']);
    rows.push(['Month', 'Revenue', 'Orders']);
    data.revenueByMonth.forEach((r) => rows.push([`${MONTHS[r._id.m - 1]} ${r._id.y}`, r.revenue, r.orders]));
    rows.push([]);
    rows.push(['Orders by Plan']);
    rows.push(['Plan Type', 'Orders', 'Revenue']);
    data.ordersByPlan.forEach((r) => rows.push([r._id || 'Unknown', r.count, r.revenue]));
    rows.push([]);
    rows.push(['Top Customers']);
    rows.push(['Name', 'Email', 'Orders', 'Revenue']);
    data.topCustomers.forEach((r) => rows.push([r.name || 'Unknown', r.email || '', r.orders, r.revenue]));
    download(`dlock-report-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <div>
          <p className="font-semibold text-slate-900">Could not load reports</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-[#1560BD] px-4 py-2 text-sm font-medium text-white hover:bg-[#124f9c]">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  const d = data!;
  const revenueChart = d.revenueByMonth.map((r) => ({ label: `${MONTHS[r._id.m - 1]} ${String(r._id.y).slice(2)}`, revenue: r.revenue, orders: r.orders }));
  const signupsChart = d.newUsersByMonth.map((r) => ({ label: `${MONTHS[r._id.m - 1]} ${String(r._id.y).slice(2)}`, users: r.count }));
  const planChart = d.ordersByPlan.map((r) => ({ name: (r._id || 'Unknown').toUpperCase(), value: r.revenue, orders: r.count }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">Revenue trends, recurring income, plan mix and your best customers.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#1560BD] focus:outline-none" />
          <span className="text-slate-400">→</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#1560BD] focus:outline-none" />
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-[#1560BD] px-4 py-2 text-sm font-medium text-white hover:bg-[#124f9c]">
            <RefreshCw className="h-4 w-4" /> Apply
          </button>
          <button onClick={exportAll} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Revenue" value={inr(d.totalRevenue)} icon={IndianRupee} tone={{ bg: 'bg-violet-50', text: 'text-violet-600' }} sub="All paid orders" />
        <StatsCard title="MRR (est.)" value={inr(d.mrr)} icon={Repeat} tone={{ bg: 'bg-blue-50', text: 'text-[#1560BD]' }} sub="Active recurring base" />
        <StatsCard title="Period Orders" value={(d.revenueByMonth.reduce((a, r) => a + r.orders, 0)).toLocaleString('en-IN')} icon={Package} tone={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }} sub="Paid in range" />
        <StatsCard title="New Signups" value={(d.newUsersByMonth.reduce((a, r) => a + r.count, 0)).toLocaleString('en-IN')} icon={TrendingUp} tone={{ bg: 'bg-amber-50', text: 'text-amber-600' }} sub="All time" />
      </div>

      {/* Revenue trend */}
      <ChartCard title="Revenue Over Time">
        {revenueChart.length === 0 ? <p className="py-10 text-center text-sm text-slate-400">No revenue data.</p> : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueChart} margin={{ left: -10, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="repRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1560BD" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#1560BD" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Area type="monotone" dataKey="revenue" stroke="#1560BD" strokeWidth={2.5} fill="url(#repRev)" name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Plan mix + signups */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue by Plan Type">
          {planChart.length === 0 ? <p className="py-10 text-center text-sm text-slate-400">No plan data.</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={planChart} margin={{ left: -10, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Revenue">
                  {planChart.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="New Signups Trend">
          {signupsChart.length === 0 ? <p className="py-10 text-center text-sm text-slate-400">No signup data.</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={signupsChart} margin={{ left: -10, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="users" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Top customers + locations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base font-semibold text-slate-900">Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {d.topCustomers.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No customer data.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Orders</th>
                      <th className="px-4 py-3 font-medium text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.topCustomers.map((c, i) => (
                      <tr key={c._id || i} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-semibold text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{c.name || 'Unknown'}</div>
                          <div className="text-xs text-slate-500">{c.email || '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{c.orders}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{inr(c.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold text-slate-900">Orders by Location</CardTitle></CardHeader>
          <CardContent>
            {d.ordersByLocation.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No location data.</p> : (
              <div className="space-y-3">
                {(() => {
                  const max = Math.max(...d.ordersByLocation.map((l) => l.count), 1);
                  return d.ordersByLocation.map((l, i) => (
                    <div key={i}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium capitalize text-slate-700">{l._id || 'Unknown'}</span>
                        <span className="tabular-nums text-slate-500">{l.count}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#1560BD]" style={{ width: `${(l.count / max) * 100}%` }} />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
