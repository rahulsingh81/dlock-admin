import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Users, BarChart3, Package } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!email || !password) {
    toast({
      title: "Error",
      description: "Please fill in all fields",
      variant: "destructive"
    });
    return;
  }

  try {
    await login({ email, password });
    // Agar yahan tak pahunch gaye to login successful
    toast({
      title: "Welcome back!",
      description: "Successfully logged into admin dashboard",
    });
  } catch (error) {
    toast({
      title: "Login Failed",
      description: "Invalid credentials. Use password 'admin' for demo.",
      variant: "destructive"
    });
  }
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJtMzYgMzQgNi0ydi0yaDItMnYtMmgtMnYtMmgtMnYyaC0ydjJoLTJ2Mmg2djJ6bS0xNiAwaDJ2MmgtMnYtMnptMTAgMGgydjJoLTJ2LTJ6bS0xMCAyaDJ2MmgtMnYtMnptMTYgMGgydjJoLTJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Features */}
        <div className="hidden lg:block space-y-8 text-white">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold gradient-text">
              Admin Dashboard
            </h1>
            <p className="text-xl text-slate-300">
              Modern management system with comprehensive analytics and user control
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="card-glass p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold">User Management</h3>
              <p className="text-sm text-slate-400">Complete CRUD operations with advanced filtering</p>
            </div>
            
            <div className="card-glass p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold">Order Tracking</h3>
              <p className="text-sm text-slate-400">Monitor orders with status management</p>
            </div>
            
            <div className="card-glass p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold">Analytics</h3>
              <p className="text-sm text-slate-400">Interactive charts and detailed reports</p>
            </div>
            
            <div className="card-glass p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold">Security</h3>
              <p className="text-sm text-slate-400">Role-based access and secure authentication</p>
            </div>
          </div>
        </div>
        
        {/* Right Side - Login Form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md card-glass border-slate-700/50">
            <CardHeader className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
                <CardDescription className="text-slate-400">
                  Sign in to access your admin dashboard
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@dashboard.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full btn-primary" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
                
                <div className="text-center text-sm text-slate-400">
                  Demo credentials: Use password <code className="text-blue-400 bg-slate-800 px-2 py-1 rounded">"admin"</code> with any email
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}