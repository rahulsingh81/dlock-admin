import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Server, Package, Ticket, MessageCircle, UserCog, LogOut, 
  Menu, X, ChevronLeft, ChevronRight, Sparkles, Crown, Settings,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, badge: null },
  { name: 'Users', href: '/users', icon: Users, badge: null },
  { name: 'Plans', href: '/plans', icon: Server, badge: null },
  { name: 'Ip-Pool', href: '/ips', icon: Server, badge: null },
  { name: 'Orders', href: '/orders', icon: Package, badge: null },
  { name: 'Ticket System', href: '/ticket', icon: Ticket, badge: null },
  { name: 'Live Chat', href: '/live', icon: MessageCircle, badge: null },
  { name: 'Profile', href: '/profile', icon: UserCog, badge: null },
];

// Add this interface
interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen: externalIsOpen, onClose }: SidebarProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const { logout, user } = useAuthStore();
  const location = useLocation();

  // Use external control if provided, otherwise use internal state
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
      {/* Mobile Hamburger Button with animation */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white lg:hidden focus:outline-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay for mobile with blur effect */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gradient-to-b from-gray-50 to-white text-gray-800 shadow-2xl z-50
          transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:shadow-none
          flex flex-col
          h-screen
          border-r border-gray-200/50
          ${isCollapsed ? 'w-20' : 'w-72'}
        `}
      >
        {/* Header */}
        <div className={`
          relative overflow-hidden
          ${isCollapsed ? 'px-2 py-5' : 'px-6 py-5'}
          border-b border-gray-200/50
          bg-gradient-to-r from-blue-50 to-indigo-50
        `}>
          <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:20px_20px]" />
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} relative z-10`}>
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                {/* Logo from public folder */}
                <img 
                  src="/logo-dark.png" 
                  alt="AdminHub Logo" 
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    // Fallback if logo doesn't load
                    e.currentTarget.style.display = 'none';
                    const sparkle = document.createElement('div');
                    sparkle.innerHTML = '<svg class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>';
                    e.currentTarget.parentElement?.prepend(sparkle.firstChild);
                  }}
                />
              
              </div>
            )}
            <button
              onClick={toggleCollapse}
              className={`
                p-2 rounded-xl hover:bg-white/80 transition-all duration-300 
                hover:scale-110 hover:shadow-md group
                ${isCollapsed ? 'mx-auto' : ''}
              `}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? 
                <ChevronRight size={20} className="group-hover:text-blue-600" /> : 
                <ChevronLeft size={20} className="group-hover:text-blue-600" />
              }
            </button>
          </div>
          
        </div>

        {/* User info */}
        {!isCollapsed ? (
          <div className="relative px-4 py-5 border-b border-gray-200/50">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center space-x-3 hover:bg-gray-50 rounded-xl p-2 transition-all duration-300 group"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md group-hover:scale-105 transition-transform duration-300">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-800">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@dashboard.com'}</p>
              </div>
              {showUserMenu ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        ) : (
          <div className="flex justify-center py-6 border-b border-gray-200/50">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-base font-bold shadow-md">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1.5 custom-scrollbar">
          {navigationItems.map(({ name, href, icon: Icon, badge }, idx) => (
            <NavLink
              key={name}
              to={href}
              onMouseEnter={() => setHoveredItem(name)}
              onMouseLeave={() => setHoveredItem(null)}
              className={({ isActive }) => `
                group relative flex items-center rounded-xl text-sm font-medium transition-all duration-300
                ${isCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'}
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-[1.02]' 
                  : 'text-gray-600 hover:bg-gray-100 hover:scale-[1.02] hover:text-blue-600'
                }
                ${hoveredItem === name && !isActive ? 'translate-x-1' : ''}
              `}
              style={{
                transitionDelay: `${idx * 30}ms`,
              }}
              onClick={toggleSidebar}
              title={isCollapsed ? name : ''}
            >
              <Icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${!isCollapsed && 'mr-3'}`} />
              {!isCollapsed && (
                <>
                  <span>{name}</span>
                  {badge && (
                    <span className={`
                      ml-auto text-xs px-2 py-0.5 rounded-full font-semibold
                      ${location.pathname === href 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {badge}
                    </span>
                  )}
                </>
              )}
              {isCollapsed && badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className={`px-4 py-6 border-t border-gray-200/50 mt-auto ${isCollapsed ? 'px-2' : 'px-6'}`}>
          <Button
            variant="ghost"
            onClick={() => { logout(); toggleSidebar(); }}
            className={`
              w-full group relative overflow-hidden rounded-xl transition-all duration-300
              ${isCollapsed ? 'justify-center px-2 py-3' : 'justify-start px-4 py-3'}
              hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-600
              text-gray-600
            `}
            title={isCollapsed ? 'Sign Out' : ''}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <LogOut className={`h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 ${!isCollapsed && 'mr-3'}`} />
            {!isCollapsed && (
              <span className="font-medium group-hover:translate-x-1 transition-transform duration-300">
                Sign Out
              </span>
            )}
          </Button>
        </div>
      </aside>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .bg-grid-black\\/[0\\.02] {
          background-image: linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px);
        }
      `}</style>
    </>
  );
}