import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Bell, Search, UserPlus, Package, LifeBuoy, RefreshCw, CreditCard, Info, CheckCheck, Sun, Moon, Users as UsersIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUsers, getOrders } from '@/services/api';

interface NavbarProps {
  onMenuClick: () => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your platform' },
  '/users': { title: 'Users', subtitle: 'Manage user accounts' },
  '/plans': { title: 'Plans', subtitle: 'Manage server plans' },
  '/ips': { title: 'IP Pool', subtitle: 'Manage IP series & pools' },
  '/orders': { title: 'Orders', subtitle: 'Track and manage orders' },
  '/transactions': { title: 'Transactions', subtitle: 'Payments & gateway settings' },
  '/ticket': { title: 'Ticket System', subtitle: 'Customer support tickets' },
  '/blogs': { title: 'Blogs', subtitle: 'Manage blog posts & SEO' },
  '/content': { title: 'Legal Pages', subtitle: 'Terms, Privacy, Refund' },
  '/profile': { title: 'Profile', subtitle: 'Your account settings' },
};

const TYPE_ICON: Record<string, any> = {
  register: UserPlus, order: Package, ticket: LifeBuoy, renew: RefreshCw, payment: CreditCard, system: Info,
};
const TYPE_TONE: Record<string, string> = {
  register: 'bg-blue-50 text-[#1560BD]', order: 'bg-emerald-50 text-emerald-600',
  ticket: 'bg-amber-50 text-amber-600', renew: 'bg-violet-50 text-violet-600',
  payment: 'bg-emerald-50 text-emerald-600', system: 'bg-slate-100 text-slate-600',
};

const timeAgo = (d: any) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

// short beep via Web Audio (no asset needed)
function playBeep() {
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.start(); o.stop(ctx.currentTime + 0.36);
    setTimeout(() => ctx.close(), 500);
  } catch { /* ignore */ }
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const page = PAGE_TITLES[location.pathname] || { title: 'Admin', subtitle: 'DLock Services' };

  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // ---- Global search ----
  const [q, setQ] = useState('');
  const [sOpen, setSOpen] = useState(false);
  const [sLoading, setSLoading] = useState(false);
  const [sUsers, setSUsers] = useState<any[]>([]);
  const [sOrders, setSOrders] = useState<any[]>([]);
  const [sUsersTotal, setSUsersTotal] = useState(0);
  const [sOrdersTotal, setSOrdersTotal] = useState(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setSOpen(false); setSUsers([]); setSOrders([]); return; }
    const t = setTimeout(async () => {
      setSLoading(true);
      setSOpen(true);
      try {
        const [u, o]: any = await Promise.all([
          getUsers({ search: term, page: 1, limit: 5 }).catch(() => null),
          getOrders({ q: term, page: 1, limit: 5 }).catch(() => null),
        ]);
        setSUsers(u?.items || u?.users || []);
        setSUsersTotal(u?.totalCount ?? u?.total ?? (u?.items?.length || 0));
        setSOrders(o?.items || []);
        setSOrdersTotal(o?.totalOrders ?? (o?.items?.length || 0));
      } finally {
        setSLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const goToUsers = () => { setSOpen(false); navigate(`/users?q=${encodeURIComponent(q.trim())}`); };
  const goToOrders = () => { setSOpen(false); navigate(`/orders?q=${encodeURIComponent(q.trim())}`); };

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const prevUnread = useRef(0);
  const firstLoad = useRef(true);

  const fetchNotifs = async (f = filter) => {
    try {
      const res: any = await getNotifications(f);
      setItems(res.items || []);
      const u = res.unreadCount || 0;
      // beep when a new unread arrives (not on first load)
      if (!firstLoad.current && u > prevUnread.current) playBeep();
      firstLoad.current = false;
      prevUnread.current = u;
      setUnread(u);
    } catch { /* ignore */ }
  };

  // poll every 15s
  useEffect(() => {
    fetchNotifs('all');
    const id = setInterval(() => fetchNotifs(open ? filter : 'all'), 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filter]);

  const handleOpen = () => { const n = !open; setOpen(n); if (n) fetchNotifs(filter); };

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
    fetchNotifs(filter);
  };
  const handleReadAll = async () => {
    await markAllNotificationsRead();
    fetchNotifs(filter);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-3 pl-12 lg:pl-0">
        <Button variant="ghost" size="sm" onClick={onMenuClick} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden sm:block">
          <h2 className="text-base font-bold leading-tight text-slate-900">{page.title}</h2>
          <p className="text-xs leading-tight text-slate-500">{page.subtitle}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search users & orders..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => { if (q.trim().length >= 2) setSOpen(true); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && q.trim().length >= 2) { if (sUsersTotal >= sOrdersTotal) goToUsers(); else goToOrders(); } }}
            className="w-56 rounded-xl border-slate-200 bg-slate-50 pl-10 focus:border-[#1560BD] focus:bg-white focus:ring-2 focus:ring-[#1560BD]/20 lg:w-64"
          />

          {sOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 max-h-[70vh] w-[22rem] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {sLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                  </div>
                ) : (sUsers.length === 0 && sOrders.length === 0) ? (
                  <div className="py-8 text-center text-sm text-slate-400">No matches for “{q.trim()}”</div>
                ) : (
                  <>
                    {/* Users */}
                    {sUsers.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            <UsersIcon className="h-3.5 w-3.5" /> Users ({sUsersTotal})
                          </span>
                        </div>
                        {sUsers.map((u) => (
                          <button
                            key={u._id}
                            onClick={goToUsers}
                            className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-2.5 text-left hover:bg-slate-50"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#1560BD]">
                              {(u.name || u.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">{u.name || '—'}</p>
                              <p className="truncate text-xs text-slate-500">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                            </div>
                          </button>
                        ))}
                        {sUsersTotal > sUsers.length && (
                          <button onClick={goToUsers} className="w-full px-4 py-2 text-center text-xs font-medium text-[#1560BD] hover:bg-slate-50">
                            View all {sUsersTotal} users →
                          </button>
                        )}
                      </div>
                    )}

                    {/* Orders */}
                    {sOrders.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between border-b border-t border-slate-100 px-4 py-2">
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            <Package className="h-3.5 w-3.5" /> Orders ({sOrdersTotal})
                          </span>
                        </div>
                        {sOrders.map((o) => (
                          <button
                            key={o._id}
                            onClick={goToOrders}
                            className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-2.5 text-left hover:bg-slate-50"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                              <Package className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {o.planName || o.planType || 'Order'} · #{String(o._id).slice(-8)}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {o.userId?.name || o.userId?.email || '—'}{o.userId?.phone ? ` · ${o.userId.phone}` : ''}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-700">
                              {o.location === 'us' ? '$' : '₹'}{Number(o.totalPrice || 0).toLocaleString('en-IN')}
                            </span>
                          </button>
                        ))}
                        {sOrdersTotal > sOrders.length && (
                          <button onClick={goToOrders} className="w-full px-4 py-2 text-center text-xs font-medium text-[#1560BD] hover:bg-slate-50">
                            View all {sOrdersTotal} orders →
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Theme toggle */}
        <button onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100" title={dark ? 'Switch to light' : 'Switch to dark'}>
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button onClick={handleOpen} className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100" title="Notifications">
            <Bell className="h-5 w-5 text-slate-600" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-96">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div className="font-semibold text-slate-900">Notifications</div>
                  {unread > 0 && (
                    <button onClick={handleReadAll} className="flex items-center gap-1 text-xs font-medium text-[#1560BD] hover:underline">
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="flex gap-1 px-3 py-2">
                  {(['all', 'unread'] as const).map((f) => (
                    <button key={f} onClick={() => { setFilter(f); fetchNotifs(f); }}
                      className={cn('rounded-lg px-3 py-1 text-xs font-medium capitalize', filter === f ? 'bg-[#1560BD] text-white' : 'text-slate-600 hover:bg-slate-100')}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-400">No notifications</div>
                  ) : items.map((n) => {
                    const Icon = TYPE_ICON[n.type] || Info;
                    return (
                      <button key={n._id} onClick={() => {
                          if (!n.read) handleRead(n._id);
                          setOpen(false);
                          const oid = n?.meta?.orderId;
                          if (oid) navigate(`/orders?focus=${oid}`);
                          else if (n?.type === 'ticket') navigate('/ticket');
                          else if (n?.type === 'register') navigate('/users');
                          else if (n?.type === 'contact') navigate('/enquiries');
                          else navigate('/notifications');
                        }}
                        className={cn('flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50', !n.read && 'bg-blue-50/40')}>
                        <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', TYPE_TONE[n.type] || TYPE_TONE.system)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-slate-900">{n.title}</span>
                            {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[#1560BD]" />}
                          </div>
                          <p className="truncate text-xs text-slate-500">{n.message}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => { setOpen(false); navigate('/notifications'); }}
                  className="w-full border-t border-slate-100 py-2.5 text-center text-sm font-medium text-[#1560BD] hover:bg-slate-50"
                >
                  View all notifications
                </button>
              </div>
            </>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1560BD] to-[#0d3a73] text-sm font-bold text-white">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-800">{user?.name || 'Admin'}</p>
            <p className="text-xs leading-tight text-slate-500">{user?.role || 'admin'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
