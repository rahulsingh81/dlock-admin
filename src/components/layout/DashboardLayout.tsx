import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ display: 'flex', flexWrap: 'nowrap' }}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="lg:ml-64"  style={{margin: 0,width: '100%',overflowY: 'scroll',maxHeight: '100vh'  }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}