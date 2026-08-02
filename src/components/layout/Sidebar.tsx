import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Server, Package, Ticket, UserCog, LogOut,
  X, ChevronLeft, ChevronRight, Network, FileText, Newspaper, Wallet, Bell, Settings, TicketPercent, Code2, Mail, FileSpreadsheet, Database,
  CalendarClock, BarChart3, Megaphone, KeyRound, Image as ImageIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useConfirm } from '@/components/confirm-provider';
import { Button } from '@/components/ui/button';

const logoUrl = `${import.meta.env.BASE_URL}logo-dark.png`;

const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: 'Users', href: '/users', icon: Users },
      { name: 'Plans', href: '/plans', icon: Server },
      { name: 'Ip-Pool', href: '/ips', icon: Network },
      { name: 'Orders', href: '/orders', icon: Package },
      { name: 'Renewals & Expiry', href: '/renewals', icon: CalendarClock },
      { name: 'Transactions', href: '/transactions', icon: Wallet },
      { name: 'CA Invoices', href: '/ca-invoices', icon: FileSpreadsheet },
      { name: 'Coupons', href: '/coupons', icon: TicketPercent },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { name: 'Email Campaigns', href: '/campaigns', icon: Megaphone },
      { name: 'Poster Maker', href: '/poster', icon: ImageIcon },
    ],
  },
  {
    label: 'Development',
    items: [
      { name: 'Development', href: '/development', icon: Code2 },
      { name: 'Developer API', href: '/developer', icon: KeyRound },
    ],
  },
  {
    label: 'Support',
    items: [
      { name: 'Ticket System', href: '/ticket', icon: Ticket },
      { name: 'Enquiries', href: '/enquiries', icon: Mail },
      { name: 'Blogs', href: '/blogs', icon: Newspaper },
      { name: 'Legal Pages', href: '/content', icon: FileText },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Database Backup', href: '/backup', icon: Database },
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'Profile', href: '/profile', icon: UserCog },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen: externalIsOpen, onClose }: SidebarProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout, user } = useAuthStore();
  const confirm = useConfirm();
  const location = useLocation();

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Sign out?',
      description: 'You will be logged out of the admin panel.',
      confirmText: 'Sign Out',
      variant: 'danger',
    });
    if (!ok) return;
    logout();
    toggleSidebar();
  };

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const toggleSidebar = () => {
    if (externalIsOpen !== undefined && onClose) {
      onClose();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  useEffect(() => {
    if (externalIsOpen === undefined) {
      setInternalIsOpen(false);
    }
  }, [location, externalIsOpen]);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fadeIn lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col
          bg-gradient-to-b from-[#0d3a73] via-[#124f9c] to-[#0b2f5e] text-blue-50 shadow-2xl
          transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0
          ${isCollapsed ? 'w-20' : 'w-72'}
        `}
      >
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-10 top-20 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />

        {/* Header */}
        <div className={`relative flex items-center gap-2 border-b border-white/10 ${isCollapsed ? 'justify-center px-2 py-5' : 'justify-between px-4 py-6'}`}>
          {!isCollapsed && (
            <div className="flex-1 rounded-xl bg-white px-4 py-3 shadow-md">
              <img
                src={logoUrl}
                alt="DLock Services"
                className="h-11 w-full object-contain"
              />
            </div>
          )}
          <button
            onClick={toggleCollapse}
            className={`hidden rounded-lg p-2 text-blue-100 transition-all duration-300 hover:bg-white/10 hover:text-white lg:block ${isCollapsed ? 'mx-auto' : ''}`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-blue-100 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={22} />
          </button>
        </div>

        {/* User info */}
        <div className={`relative border-b border-white/10 ${isCollapsed ? 'flex justify-center py-5' : 'px-4 py-5'}`}>
          <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-lg font-bold text-white ring-1 ring-white/20 backdrop-blur">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#124f9c] bg-emerald-400" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{user?.name || 'Admin User'}</p>
                <p className="truncate text-xs text-blue-200/80">{user?.email || 'info@dlockservices.com'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!isCollapsed && (
                <p className="mb-1.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-blue-300/60">
                  {group.label}
                </p>
              )}
              {isCollapsed && <div className="mx-auto mb-2 h-px w-8 bg-white/10" />}
              <div className="space-y-1">
                {group.items.map(({ name, href, icon: Icon }) => (
                  <NavLink
                    key={name}
                    to={href}
                    className={({ isActive }) => `
                      group relative flex items-center rounded-xl text-sm font-medium transition-all duration-200
                      ${isCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-2.5'}
                      ${isActive
                        ? 'bg-white text-[#0d3a73] shadow-lg shadow-black/10'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }
                    `}
                    onClick={toggleSidebar}
                    title={isCollapsed ? name : ''}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && !isCollapsed && (
                          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-cyan-400" />
                        )}
                        <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${!isCollapsed && 'mr-3'}`} />
                        {!isCollapsed && <span>{name}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className={`mt-auto border-t border-white/10 py-4 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`
              group w-full rounded-xl text-blue-100 transition-all duration-200
              hover:bg-red-500/20 hover:text-white
              ${isCollapsed ? 'justify-center px-2 py-3' : 'justify-start px-4 py-2.5'}
            `}
            title={isCollapsed ? 'Sign Out' : ''}
          >
            <LogOut className={`h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5 ${!isCollapsed && 'mr-3'}`} />
            {!isCollapsed && <span className="font-medium">Sign Out</span>}
          </Button>
        </div>
      </aside>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.35); }
      `}</style>
    </>
  );
}
