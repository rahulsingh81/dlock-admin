import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left Side */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="hidden md:flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 w-64 bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            3
          </span>
        </Button>
        
        <div className="hidden sm:block text-sm text-slate-600">
          Welcome back, Admin!
        </div>
      </div>
    </header>
  );
}