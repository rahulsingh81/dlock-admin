import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Package,
  IndianRupee,
  TrendingUp,
  UserCheck,
  UserPlus,
  LifeBuoy,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Clock,
  CalendarClock,
  RotateCcw,
  Wallet,
  Boxes,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { getDashboardStats, getAttention } from '@/services/api';

interface Attention {
  todayRevenue: number;
  dueRenewals: number;
  unpaidOrders: number;
  openTickets: number;
  pendingProvisioning: number;
  renewalRequests: number;
}

interface TimelinePoint {
  label: string;
  orders: number;
  revenue: number;
  users: number;
}

interface DashboardData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    newUsers: number;
    totalOrders: number;
    vpsOrders: number;
    cloudOrders: number;
    dedicatedOrders: number;
    paidCount: number;
    unpaidCount: number;
    processingCount: number;
    deliveredCount: number;
    openTickets: number;
    newToday: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
  timeline: TimelinePoint[];
  years: number[];
  selectedYear: number;
  ordersByType: { name: string; value: number }[];
  recentOrders: any[];
  newUsersToday: any[];
}

const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;
const PIE_COLORS = ['#1560BD', '#06b6d4', '#8b5cf6'];

// Soft, brand-cohesive tints (shared look with the Users page)
const TONES: Record<string, { bg: string; text: string }> = {
  blue:    { bg: 'bg-blue-50',    text: 'text-[#1560BD]' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-600' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600' },
  cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-600' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-500' },
};

const StatsCard = ({
  title,
  value,
  icon: Icon,
  tone = 'blue',
  sub,
}: {
  title: string;
  value: string | number;
  icon: any;
  tone?: keyof typeof TONES;
  sub?: string;
}) => {
  const t = TONES[tone] || TONES.blue;
  return (
    <Card className="card-hover">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl font-bold tabular-nums text-slate-900">{value}</div>
            <div className="mt-0.5 text-sm font-medium text-slate-500">{title}</div>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${t.bg}`}>
            <Icon className={`h-5 w-5 ${t.text}`} />
          </div>
        </div>
        {sub && <p className="mt-3 text-xs text-slate-500">{sub}</p>}
      </CardContent>
    </Card>
  );
};

const ChartCard = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <Card className="transition-all duration-200 hover:shadow-md">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
      {action}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    unpaid: 'bg-amber-100 text-amber-700',
    cancel: 'bg-red-100 text-red-700',
    refund: 'bg-slate-100 text-slate-600',
    delivered: 'bg-green-100 text-green-700',
    processing: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-slate-100 text-slate-600',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number | undefined>(undefined); // undefined = current year
  const [range, setRange] = useState(12); // months shown within the selected year
  const [attention, setAttention] = useState<Attention | null>(null);
  const navigate = useNavigate();

  const load = async (y = year) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardStats(y);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAttention().then(setAttention).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <div>
          <p className="font-semibold text-slate-900">Could not load dashboard</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
        <button
          onClick={() => load()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1560BD] px-4 py-2 text-sm font-medium text-white hover:bg-[#124f9c]"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  const s = data!.stats;
  const activeYear = data!.selectedYear;
  const chartData = (data!.timeline || []).slice(-range);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back 👋</h1>
          <p className="text-sm text-slate-500">Here's what's happening across your platform.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Year selector */}
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            {(data!.years || [activeYear]).map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`rounded-md px-3 py-1 text-xs font-medium ${activeYear === y ? 'bg-[#1560BD] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {y}
              </button>
            ))}
          </div>
          {/* Month range within the selected year */}
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            {[1, 3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => setRange(m)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${range === m ? 'bg-[#1560BD] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {m}M
              </button>
            ))}
          </div>
          <button
            onClick={() => load()}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Needs attention */}
      {attention && (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50/60 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <CardTitle className="text-base font-semibold text-slate-900">Needs Attention</CardTitle>
            </div>
            <span className="text-xs text-slate-400">Live snapshot</span>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {[
                { label: "Today's Revenue", value: inr(attention.todayRevenue), icon: IndianRupee, tone: 'text-emerald-600', bg: 'bg-emerald-50', to: '/transactions' },
                { label: 'Renewal Requests', value: attention.renewalRequests, icon: RotateCcw, tone: 'text-[#1560BD]', bg: 'bg-blue-50', to: '/renewals' },
                { label: 'Due in 7 days', value: attention.dueRenewals, icon: CalendarClock, tone: 'text-amber-600', bg: 'bg-amber-50', to: '/renewals' },
                { label: 'Unpaid Orders', value: attention.unpaidOrders, icon: Wallet, tone: 'text-rose-600', bg: 'bg-rose-50', to: '/renewals' },
                { label: 'Open Tickets', value: attention.openTickets, icon: LifeBuoy, tone: 'text-violet-600', bg: 'bg-violet-50', to: '/ticket' },
                { label: 'Pending Setup', value: attention.pendingProvisioning, icon: Boxes, tone: 'text-cyan-600', bg: 'bg-cyan-50', to: '/orders' },
              ].map((it) => {
                const Icon = it.icon;
                return (
                  <button
                    key={it.label}
                    onClick={() => navigate(it.to)}
                    className="group flex flex-col gap-2 rounded-xl border border-slate-100 bg-white p-3 text-left transition-all hover:border-slate-200 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${it.bg}`}>
                        <Icon className={`h-4 w-4 ${it.tone}`} />
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold tabular-nums text-slate-900">{it.value}</div>
                      <div className="text-xs font-medium text-slate-500">{it.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Users" value={s.totalUsers.toLocaleString('en-IN')} icon={Users} tone="blue" sub={`${s.activeUsers} active`} />
        <StatsCard title="Total Orders" value={s.totalOrders.toLocaleString('en-IN')} icon={Package} tone="emerald" sub={`${s.deliveredCount} delivered`} />
        <StatsCard title="Total Revenue" value={inr(s.totalRevenue)} icon={IndianRupee} tone="violet" sub={`${s.paidCount} paid orders`} />
        <StatsCard title="This Month" value={inr(s.monthlyRevenue)} icon={TrendingUp} tone="amber" sub="Revenue this month" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <StatsCard title="Active Users" value={s.activeUsers.toLocaleString('en-IN')} icon={UserCheck} tone="emerald" />
        <StatsCard title="New Users (30d)" value={s.newUsers.toLocaleString('en-IN')} icon={UserPlus} tone="cyan" />
        <StatsCard title="Paid Orders" value={s.paidCount.toLocaleString('en-IN')} icon={CheckCircle2} tone="emerald" />
        <StatsCard title="Open Tickets" value={s.openTickets.toLocaleString('en-IN')} icon={LifeBuoy} tone="rose" />
      </div>

      {/* Charts: revenue + orders */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title={`Revenue Trend (${range === 12 ? activeYear : `last ${range}mo · ${activeYear}`})`}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1560BD" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#1560BD" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="revenue" stroke="#1560BD" strokeWidth={2.5} fill="url(#revFill)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Orders by Type">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data!.ordersByType} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {data!.ordersByType.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts: orders bar + user growth */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title={`Order Volume (${range === 12 ? activeYear : `last ${range}mo · ${activeYear}`})`}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ left: -10, right: 10, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="orders" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`User Growth (${range === 12 ? activeYear : `last ${range}mo · ${activeYear}`})`}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ left: -10, right: 10, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="New Users" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* New users today */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-slate-900">New Users Today</CardTitle>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              <Sparkles className="h-3 w-3" />
              {s.newToday}
            </span>
          </div>
          <button
            onClick={() => navigate('/users')}
            className="text-sm font-medium text-[#1560BD] hover:underline"
          >
            View all users →
          </button>
        </CardHeader>
        <CardContent>
          {data!.newUsersToday.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-slate-400">
              <Sparkles className="h-8 w-8 text-slate-300" />
              <p className="text-sm">No new users have signed up today yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data!.newUsersToday.map((u) => (
                <div key={u._id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50/60">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1560BD] to-[#0d3a73] font-bold text-white">
                    {u.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-900">{u.name}</div>
                    <div className="truncate text-xs text-slate-500">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-1 whitespace-nowrap text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {u.createdAt ? new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {data!.recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.recentOrders.map((o) => (
                    <tr key={o._id} className="border-b border-slate-50 transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{o.userId?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{o.userId?.email || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {o.planName || o.planId?.name || '—'}
                        {o.planType && <span className="ml-1 text-xs uppercase text-slate-400">({o.planType})</span>}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{inr(o.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <Badge className={`${statusBadge(o.paymentStatus)} border-0 font-medium capitalize`}>{o.paymentStatus}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${statusBadge(o.deliveryStatus)} border-0 font-medium capitalize`}>{o.deliveryStatus}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
