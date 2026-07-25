import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PaginationComponent } from '@/components/PaginationComponent';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  Plus,
  Eye,
  EyeOff,
  Wand2,
  Edit, 
  Trash2,
  Package,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Star,
  CheckSquare,
  Square,
  Trash,
  LogIn,
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User, UserFormData, PaginationParams } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getUsers, getUser, createUser, updateUser, deleteUser, impersonateUser, exportData } from '@/services/api';
import { BulkBar, SelectCheck } from '@/components/bulk-bar';

const WEB_URL = import.meta.env.VITE_WEB_URL || 'https://dlockservices.com';
import { cn, formatDate } from '@/lib/utils';

// Helper function to check if a date is today
const isToday = (dateString?: string): boolean => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// Soft, brand-cohesive tints for stat cards (no loud full-color gradients)
const TONES: Record<string, { bg: string; text: string }> = {
  blue:    { bg: 'bg-blue-50',    text: 'text-[#1560BD]' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-500' },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600' },
};

// Move StatsCard outside
const StatsCard = ({
  title,
  value,
  icon: Icon,
  tone = 'blue',
  loading = false,
}: {
  title: string;
  value: string;
  icon: any;
  tone?: keyof typeof TONES;
  loading?: boolean;
}) => {
  const t = TONES[tone] || TONES.blue;
  return (
    <Card className="card-hover">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.bg}`}>
          <Icon className={`h-5 w-5 ${t.text}`} />
        </div>
        <div className="min-w-0">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
          ) : (
            <div className="text-xl font-bold leading-tight tabular-nums text-slate-900">{value}</div>
          )}
          <div className="truncate text-xs font-medium text-slate-500">{title}</div>
        </div>
      </CardContent>
    </Card>
  );
};

// Move UserOrdersModal outside
const UserOrdersModal = ({ user, open, onOpenChange }: { user: User; open: boolean; onOpenChange: (open: boolean) => void }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const full: any = await getUser(user._id);
        if (active) setOrders(full?.orders || []);
      } catch {
        if (active) setOrders([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [open, user._id]);

  const inr = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
  const fmt = (d?: Date | string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // Same logic as OrdersPage: expiry = start + duration months - 1 day; renew = expiry - 1 day
  const computeDates = (o: any) => {
    const start = o?.startDate ? new Date(o.startDate) : (o?.createdAt ? new Date(o.createdAt) : null);
    let expiry: Date | null = null;
    if (o?.endDate) {
      expiry = new Date(o.endDate);
    } else if (start) {
      expiry = new Date(start);
      expiry.setMonth(expiry.getMonth() + (o?.duration || 1));
      expiry.setDate(expiry.getDate() - 1);
    }
    const renew = expiry ? new Date(expiry.getTime() - 86400000) : null;
    return { start, renew, expiry };
  };
  const statusTone: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-700',
    terminated: 'bg-red-100 text-red-700',
    expired: 'bg-slate-200 text-slate-600',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Orders for {user.name}</span>
            <Badge variant="secondary">{loading ? '…' : orders.length} orders</Badge>
          </SheetTitle>
          <SheetDescription>
            View all orders placed by this user
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="py-10 text-center text-slate-500">Loading orders…</div>
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-500">
              <Package className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              No orders placed yet.
            </div>
          ) : (
            orders.map((o) => {
              const { start, renew, expiry } = computeDates(o);
              return (
              <div
                key={o._id}
                onClick={() => { onOpenChange(false); navigate(`/orders?open=${o._id}`); }}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-[#1560BD]/40 hover:bg-blue-50/40"
                title="Open this order"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#1560BD]">{o.planName || o.planType || 'Order'}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      #{String(o._id).slice(-8)} · {o.location || '—'} · {o.os || o.osType || '—'}
                    </p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', statusTone[o.serviceStatus || o.orderStatus || o.deliveryStatus] || 'bg-slate-100 text-slate-600')}>
                    {o.serviceStatus || o.orderStatus || o.deliveryStatus || 'pending'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-400">Amount</p>
                    <p className="font-medium text-slate-900">{inr(o.totalPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Qty × Duration</p>
                    <p className="font-medium text-slate-900">{o.quantity || 1} × {o.duration || 1}mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Renews</p>
                    <p className="font-medium text-slate-900">{o.renewCount ? `${o.renewCount}×` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Created</p>
                    <p className="font-medium text-slate-900">{fmt(start)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-amber-600">Renew by</p>
                    <p className="font-medium text-amber-600">{fmt(renew)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-red-500">Expires</p>
                    <p className="font-medium text-red-600">{fmt(expiry)}</p>
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Move UserViewModal outside
const UserViewModal = ({ user, open, onOpenChange, onClearHighlight, onLoginAs, impersonating }: { user: User; open: boolean; onOpenChange: (open: boolean) => void; onClearHighlight?: () => void; onLoginAs?: (user: User) => void; impersonating?: boolean }) => {

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && onClearHighlight && isToday(user.createdAt)) {
      onClearHighlight();
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <span>User Details</span>
            {isToday(user.createdAt) && (
              <Badge className="bg-blue-100 text-[#1560BD] border-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                New Today
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Detailed information about the user account
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6">
          {/* Gradient header banner */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1560BD] to-[#0d3a73] p-5 text-white">
            <div className="flex items-center gap-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-16 w-16 rounded-full object-cover ring-4 ring-white/30"
                />
              ) : (
                <div className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-xl font-bold ring-4 ring-white/30 backdrop-blur",
                  isToday(user.createdAt) && "ring-white/60"
                )}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 text-xl font-semibold">
                  <span className="truncate">{user.name}</span>
                  {isToday(user.createdAt) && <Star className="h-5 w-5 fill-white/90 text-white/90" />}
                </h3>
                <p className="truncate text-blue-100">{user.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge className="border-0 bg-white/20 capitalize text-white">{user.role || 'user'}</Badge>
                  <Badge className={cn('border-0 text-white', user.status === 'active' ? 'bg-emerald-500/80' : 'bg-red-500/80')}>
                    {user.status}
                  </Badge>
                  <Badge className="border-0 bg-white/20 text-white">
                    <Package className="mr-1 h-3 w-3" />
                    {user.ordersCount || 0} orders
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600">
                <Mail className="w-4 h-4" />
                <span className="text-sm">Email</span>
              </div>
              <p className="text-slate-900 font-medium">{user.email}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm">Phone</span>
              </div>
              <p className="text-slate-900 font-medium">{user.phone || 'N/A'}</p>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center space-x-2 text-slate-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Address</span>
              </div>
              <p className="text-slate-900">{user.address || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">City</span>
              </div>
              <p className="text-slate-900 font-medium">{user.city || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">State</span>
              </div>
              <p className="text-slate-900 font-medium">{user.state || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Zip Code</span>
              </div>
              <p className="text-slate-900 font-medium">{user.zipCode || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Country</span>
              </div>
              <p className="text-slate-900 font-medium">{user.country || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-sm">GSTIN</span>
              </div>
              <p className="font-medium text-slate-900">{user.gstin || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Joined Date</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-slate-900">
                  {user.createdAt ? formatDate(user.createdAt, 'N/A') : 'N/A'}
                </p>
                {isToday(user.createdAt) && (
                  <Badge variant="outline" className="bg-blue-50 text-[#1560BD] border-blue-200">
                    Today
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600">
                <Package className="w-4 h-4" />
                <span className="text-sm">Total Orders</span>
              </div>
              <p className="text-slate-900 font-semibold">{user.ordersCount || 0}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600">
                {user.isEmailVerified ? (
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                ) : (
                  <ShieldX className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">Email Verification</span>
              </div>
              <Badge 
                variant="secondary"
                className={
                  user.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }
              >
                {user.isEmailVerified ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600">
                <UserCheck className="w-4 h-4" />
                <span className="text-sm">Status</span>
              </div>
              <Badge 
                variant="secondary"
                className={
                  user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }
              >
                {user.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600">
                <span className="text-sm">Role</span>
              </div>
              <Badge variant="secondary">
                {user.role || 'user'}
              </Badge>
            </div>
          </div>

          {user.role !== 'admin' && onLoginAs && (
            <div className="flex justify-end border-t pt-4">
              <Button
                onClick={() => onLoginAs(user)}
                disabled={impersonating}
                className="bg-[#1560BD] text-white hover:bg-[#124f9c]"
              >
                {impersonating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening…
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login as this user
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userName,
  isBulk = false,
  count = 0
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  userName?: string;
  isBulk?: boolean;
  count?: number;
}) => (
  <Sheet open={isOpen} onOpenChange={onClose}>
    <SheetContent side="right" className="w-full p-6 sm:max-w-md">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-600" />
          Confirm Delete
        </SheetTitle>
        <SheetDescription>
          {isBulk 
            ? `Are you sure you want to delete ${count} selected user${count !== 1 ? 's' : ''}? This action cannot be undone.`
            : `Are you sure you want to delete user "${userName}"? This action cannot be undone.`
          }
        </SheetDescription>
      </SheetHeader>
      <SheetFooter className="mt-6 gap-2 border-t pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Delete
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
);

// Move AddEditUserModal outside and make it a proper component
const AddEditUserModal = ({ 
  isEdit, 
  open, 
  onOpenChange, 
  formData, 
  setFormData,
  validationErrors,
  isSaving,
  handleSaveUser
}: { 
  isEdit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  validationErrors: Record<string, string>;
  isSaving: boolean;
  handleSaveUser: () => Promise<void>;
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }, [setFormData]);

  const generatePassword = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$';
    let pw = '';
    const arr = new Uint32Array(12);
    (window.crypto || (window as any).msCrypto).getRandomValues(arr);
    for (let i = 0; i < 12; i++) pw += chars[arr[i] % chars.length];
    setFormData(prev => ({ ...prev, password: pw }));
    setShowPassword(true);
  }, [setFormData]);

  const handleSelectChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [setFormData]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setFormData(prev => ({ ...prev, [id]: checked }));
  }, [setFormData]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-6 sm:max-w-2xl"
        onInteractOutside={(e) => {
          if (isSaving) {
            e.preventDefault();
          }
        }}
      >
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit User' : 'Add New User'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Update user information' : 'Add a new user to the system'}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                className={validationErrors.name ? 'border-red-500' : ''}
                disabled={isSaving}
                autoFocus={!isEdit}
                autoComplete="name"
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500">{validationErrors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                className={validationErrors.email ? 'border-red-500' : ''}
                disabled={isSaving}
                autoComplete="email"
              />
              {validationErrors.email && (
                <p className="text-sm text-red-500">{validationErrors.email}</p>
              )}
            </div>

            {!isEdit && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password *</Label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#1560BD] hover:underline"
                  >
                    <Wand2 className="h-3.5 w-3.5" /> Generate
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Set a password for this user"
                    className={`pr-10 ${validationErrors.password ? 'border-red-500' : ''}`}
                    disabled={isSaving}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Hide' : 'Show'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">Share this with the user for first login — they can change it later.</p>
                {validationErrors.password && (
                  <p className="text-sm text-red-500">{validationErrors.password}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                disabled={isSaving}
                autoComplete="tel"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter complete address"
                rows={3}
                disabled={isSaving}
                autoComplete="street-address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City"
                disabled={isSaving}
                autoComplete="address-level2"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="State"
                disabled={isSaving}
                autoComplete="address-level1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                placeholder="Zip Code"
                disabled={isSaving}
                autoComplete="postal-code"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="Country"
                disabled={isSaving}
                autoComplete="country-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN (Optional)</Label>
              <Input
                id="gstin"
                value={formData.gstin}
                onChange={handleInputChange}
                placeholder="e.g. 22AAAAA0000A1Z5"
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: string) => handleSelectChange('role', value)}
                disabled={isSaving}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Account Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'inactive') => handleSelectChange('status', value)}
                disabled={isSaving}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Verification Field */}
            <div className="space-y-2">
              <Label htmlFor="isEmailVerified">Email Verification</Label>
              <Select 
                value={formData.isEmailVerified ? 'verified' : 'not-verified'} 
                onValueChange={(value: string) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    isEmailVerified: value === 'verified' 
                  }));
                }}
                disabled={isSaving}
              >
                <SelectTrigger id="isEmailVerified">
                  <SelectValue placeholder="Select verification status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">
                    <div className="flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-2 text-green-600" />
                      Verified
                    </div>
                  </SelectItem>
                  <SelectItem value="not-verified">
                    <div className="flex items-center">
                      <ShieldX className="w-4 h-4 mr-2 text-red-600" />
                      Not Verified
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#1560BD] text-white hover:bg-[#124f9c]"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                isEdit ? 'Update User' : 'Add User'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

interface UsersResponse {
  items: User[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  verifiedCount: number;
  newTodayCount: number;
  page: number;
  totalPages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  // keep search in sync when navbar navigates here with a new ?q=
  useEffect(() => {
    const urlQ = searchParams.get('q');
    if (urlQ !== null) setSearchTerm(urlQ);
  }, [searchParams]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);
  const [todayNewUsers, setTodayNewUsers] = useState<number>(0);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    gstin: '',
    role: 'user',
    status: 'active',
    isEmailVerified: false
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [usersPerPage, setUsersPerPage] = useState(10);
  const pageSizeFirstRun = useRef(true);
  
  // Multiple selection states
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Use refs for debouncing to prevent layout thrashing
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const filterTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate today's new users
  const calculateTodayNewUsers = useCallback((userList: User[]) => {
    const count = userList.filter(user => isToday(user.createdAt)).length;
    setTodayNewUsers(count);
  }, []);

  // Main fetch function with optimization
  const fetchUsers = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    }
    
    try {
      const params: PaginationParams = {
        page: currentPage,
        limit: usersPerPage,
        search: searchTerm,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (emailVerifiedFilter !== 'all') {
        params.isEmailVerified = emailVerifiedFilter === 'verified' ? 'true' : 'false';
      }

      const response = await getUsers(params) as UsersResponse;
      
      if (response && response.items) {
        setUsers(response.items);
        setTotalPages(response.totalPages || Math.ceil(response.totalCount / usersPerPage));
        setTotalUsers(response.totalCount || 0);
        setActiveCount(response.activeCount || 0);
        setInactiveCount(response.inactiveCount || 0);
        setVerifiedCount(response.verifiedCount || 0);
        setTodayNewUsers(response.newTodayCount || 0);
      } else if (Array.isArray(response)) {
        setUsers(response);
        setTotalUsers(response.length);
        setTotalPages(Math.ceil(response.length / usersPerPage));
        setActiveCount(response.filter(u => u.status === 'active').length);
        setInactiveCount(response.filter(u => u.status === 'inactive').length);
        calculateTodayNewUsers(response);
      }
      
    } catch (error: any) {
      console.error('Fetch users error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [currentPage, searchTerm, statusFilter, emailVerifiedFilter, usersPerPage, toast, calculateTodayNewUsers]);

  // Initial fetch on mount
  useEffect(() => {
    fetchUsers(true);
  }, []);

  // Reset selection when page changes or filters change
  useEffect(() => {
    setSelectedUsers(new Set());
  }, [currentPage, searchTerm, statusFilter, emailVerifiedFilter]);

  // Optimized debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Optimized debounced filters
  useEffect(() => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    filterTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers(false);
    }, 300);

    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [statusFilter, emailVerifiedFilter]);

  // Handle page changes
  useEffect(() => {
    if (!loading) {
      fetchUsers(false);
    }
  }, [currentPage]);

  // Handle page-size (per page) changes
  useEffect(() => {
    if (pageSizeFirstRun.current) {
      pageSizeFirstRun.current = false;
      return;
    }
    setCurrentPage(1);
    fetchUsers(false);
  }, [usersPerPage]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!showEditModal && !formData.password?.trim()) {
      errors.password = 'Password is required for new users';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Search, status and email-verification are all applied server-side now
  // (see fetchUsers), so the table renders the server page as-is. Re-filtering
  // here would drop matches on other pages and break the counts/pagination.
  const filteredUsers = users;

  // Handle single user delete with confirmation modal
  const handleDeleteClick = (userId: string, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete.id);
      toast({
        title: "Success",
        description: `User "${userToDelete.name}" has been deleted successfully`,
      });
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers(false);
      // Remove from selected set if present
      setSelectedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userToDelete.id);
        return newSet;
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to delete user ${userToDelete.name}`,
        variant: "destructive",
      });
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedUsers.size === 0) return;
    setShowDeleteModal(true);
  };

  const handleConfirmBulkDelete = async () => {
    const userIds = Array.from(selectedUsers);
    const usersToDelete = users.filter(u => selectedUsers.has(u._id));
    
    try {
      // Delete users one by one
      const deletePromises = userIds.map(userId => deleteUser(userId));
      await Promise.all(deletePromises);
      
      toast({
        title: "Success",
        description: `${selectedUsers.size} user${selectedUsers.size !== 1 ? 's' : ''} deleted successfully`,
      });
      
      setShowDeleteModal(false);
      setSelectedUsers(new Set());
      fetchUsers(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete some users",
        variant: "destructive",
      });
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      const newSet = new Set<string>();
      filteredUsers.forEach(user => newSet.add(user._id));
      setSelectedUsers(newSet);
    }
  };

  // Handle single user selection
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      gstin: '',
      role: 'user',
      status: 'active',
      isEmailVerified: false
    });
    setValidationErrors({});
  };

  const handleAddUser = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      zipCode: user.zipCode || '',
      country: user.country || '',
      gstin: user.gstin || '',
      role: user.role || 'user',
      status: user.status || 'active',
      isEmailVerified: user.isEmailVerified || false  
    });
    setValidationErrors({});
    setShowEditModal(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
    // Set highlighted user when viewing
    if (isToday(user.createdAt)) {
      setHighlightedUserId(user._id);
    }
  };

  const handleViewOrders = (user: User) => {
    setSelectedUser(user);
    setShowOrdersModal(true);
  };

  // Login as this user (impersonate) - opens the client website signed in as them
  const handleLoginAsUser = async (user: User) => {
    if (user.role === 'admin') {
      toast({
        title: 'Not allowed',
        description: 'You cannot log in as another admin.',
        variant: 'destructive',
      });
      return;
    }
    setImpersonatingId(user._id);
    try {
      const res = await impersonateUser(user._id);
      const { token, user: userData } = res;
      // unicode-safe base64 encode of the user payload
      const userB64 = btoa(unescape(encodeURIComponent(JSON.stringify(userData))));
      const url = `${WEB_URL.replace(/\/$/, '')}/impersonate#token=${encodeURIComponent(token)}&user=${userB64}`;
      window.open(url, '_blank', 'noopener');
      toast({
        title: 'Opening user session',
        description: `Logging in as ${user.name} on the website…`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed',
        description: error.message || 'Could not log in as this user',
        variant: 'destructive',
      });
    } finally {
      setImpersonatingId(null);
    }
  };

  const handleClearHighlight = () => {
    setHighlightedUserId(null);
  };

  const handleSaveUser = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    try {
      if (showAddModal) {
        await createUser(formData);
        toast({
          title: "Success",
          description: `${formData.name} has been added successfully`,
        });
        setShowAddModal(false);
      } else {
        if (!selectedUser) return;
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await updateUser(selectedUser._id, updateData);
        toast({
          title: "Success",
          description: `${formData.name} has been updated successfully`,
        });
        setShowEditModal(false);
      }
      resetForm();
      fetchUsers(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save user",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (validationErrors[id]) {
      setValidationErrors(prev => ({ ...prev, [id]: '' }));
    }
  }, [validationErrors]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatsCard
          title="Total Users"
          value={totalUsers.toString()}
          icon={Users}
          tone="blue"
          loading={loading && users.length === 0}
        />
        <StatsCard
          title="Active Users"
          value={activeCount.toString()}
          icon={UserCheck}
          tone="emerald"
          loading={loading && users.length === 0}
        />
        <StatsCard
          title="Inactive Users"
          value={inactiveCount.toString()}
          icon={UserX}
          tone="rose"
          loading={loading && users.length === 0}
        />
        <StatsCard
          title="Verified Emails"
          value={verifiedCount.toString()}
          icon={ShieldCheck}
          tone="indigo"
          loading={loading && users.length === 0}
        />
        <StatsCard
          title="New Today"
          value={todayNewUsers.toString()}
          icon={Sparkles}
          tone="amber"
          loading={loading && users.length === 0}
        />
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
              <div className="relative w-full flex-1 sm:min-w-[240px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                  autoComplete="off"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="whitespace-nowrap">Rows</span>
                <Select
                  value={String(usersPerPage)}
                  onValueChange={(v) => setUsersPerPage(Number(v))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Select
                value={statusFilter}
                onValueChange={(value: 'all' | 'active' | 'inactive') => { setStatusFilter(value); setCurrentPage(1); }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={emailVerifiedFilter}
                onValueChange={(value: 'all' | 'verified' | 'unverified') => { setEmailVerifiedFilter(value); setCurrentPage(1); }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Email Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verification</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Not Verified</SelectItem>
                </SelectContent>
              </Select>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-slate-200">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportData('users', 'excel')}>
                    <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportData('users', 'csv')}>
                    <FileText className="w-4 h-4 mr-2 text-blue-600" />
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={handleAddUser}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      <BulkBar
        count={selectedUsers.size}
        noun="user"
        onClear={() => setSelectedUsers(new Set())}
        onDelete={handleBulkDelete}
      />

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* Users Table */}
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3.5 w-10">
                        <SelectCheck
                          ariaLabel="Select all users"
                          checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                          indeterminate={selectedUsers.size > 0 && selectedUsers.size < filteredUsers.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Contact Info</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Address</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Verification</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Orders</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Joined Date</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-500">
                          <div className="flex flex-col items-center space-y-3">
                            <Users className="w-12 h-12 text-slate-300" />
                            <div>
                              <p className="font-medium">No users found</p>
                              <p className="text-sm">Try adjusting your search or filters</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isNewToday = isToday(user.createdAt);
                        const isHighlighted = highlightedUserId === user._id;
                        const isSelected = selectedUsers.has(user._id);
                        
                        return (
                          <tr 
                            key={user._id} 
                            className={cn(
                              "border-t border-slate-100 transition-all duration-300",
                              "hover:bg-slate-50",
                              isNewToday && !isHighlighted && "bg-blue-50/40",
                              isHighlighted && "bg-blue-50",
                              isSelected && "bg-blue-50"
                            )}
                          >
                            <td className="px-4 py-4">
                              <SelectCheck
                                ariaLabel="Select user"
                                checked={isSelected}
                                onChange={() => handleSelectUser(user._id)}
                              />
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 relative">
                                  {user.avatar ? (
                                    <img 
                                      src={user.avatar} 
                                      alt={user.name}
                                      className={cn(
                                        "w-10 h-10 rounded-full object-cover",
                                        isNewToday && "ring-2 ring-[#1560BD]/40 ring-offset-2"
                                      )}
                                    />
                                  ) : (
                                    <div className={cn(
                                      "w-10 h-10 rounded-full bg-gradient-to-br from-[#1560BD] to-[#0d3a73] flex items-center justify-center text-white font-semibold",
                                      isNewToday && "ring-2 ring-[#1560BD]/40 ring-offset-2"
                                    )}>
                                      {user.name?.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  {isNewToday && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[#1560BD] px-1.5 py-0.5 text-[9px] font-semibold leading-none text-white shadow ring-2 ring-white">
                                      new
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900">
                                    {user.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                <div className="text-sm text-slate-700 truncate max-w-48">{user.email}</div>
                                <div className="text-sm text-slate-500">{user.phone || '—'}</div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              {(() => {
                                const line = [user.city, user.state, user.country].filter(Boolean).join(', ');
                                return (
                                  <div className="space-y-1 max-w-56">
                                    <div className="text-sm text-slate-700 truncate">{user.address || '—'}</div>
                                    {line && <div className="text-xs text-slate-500 truncate">{line}</div>}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="py-4 px-6">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                                user.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              )}>
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {user.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                                user.isEmailVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              )}>
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {user.isEmailVerified ? 'Verified' : 'Unverified'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{user.ordersCount || 0}</span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewOrders(user)}
                                  className="text-xs"
                                >
                                  View
                                </Button>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-slate-600">
                                {user.createdAt ? formatDate(user.createdAt, 'N/A') : 'N/A'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleViewUser(user)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100"
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>

                                {user.role !== 'admin' && (
                                  <button
                                    onClick={() => handleLoginAsUser(user)}
                                    disabled={impersonatingId === user._id}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-white text-[#1560BD] transition-colors hover:bg-blue-50 disabled:opacity-60"
                                    title="Login as this user"
                                  >
                                    {impersonatingId === user._id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <LogIn className="h-4 w-4" />
                                    )}
                                  </button>
                                )}

                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100"
                                  title="Edit user"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>

                                <button
                                  onClick={() => handleDeleteClick(user._id, user.name)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition-colors hover:bg-red-50"
                                  title="Delete user"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t border-slate-100 px-4 py-4">
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalUsers}
                  itemsPerPage={usersPerPage}
                  onPageChange={setCurrentPage}
                  itemType="users"
                />
              </div>

              {/* Today's Users Summary */}
              {todayNewUsers > 0 && (
                <div className="mx-4 mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#1560BD]" />
                    <span className="text-sm font-medium text-[#0d3a73]">
                      {todayNewUsers} new user{todayNewUsers !== 1 ? 's' : ''} joined today
                    </span>
                  </div>
                  <Badge variant="outline" className="border-blue-300 bg-white text-[#1560BD]">
                    Click a row to dismiss highlight
                  </Badge>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        onConfirm={userToDelete ? handleConfirmDelete : handleConfirmBulkDelete}
        userName={userToDelete?.name}
        isBulk={!userToDelete && selectedUsers.size > 0}
        count={selectedUsers.size}
      />

      {/* Add User Modal */}
      <AddEditUserModal
        isEdit={false}
        open={showAddModal}
        onOpenChange={(open) => {
          if (!isSaving) {
            setShowAddModal(open);
            if (!open) resetForm();
          }
        }}
        formData={formData}
        setFormData={setFormData}
        validationErrors={validationErrors}
        isSaving={isSaving}
        handleSaveUser={handleSaveUser}
      />

      {/* Edit User Modal */}
      {selectedUser && (
        <AddEditUserModal
          isEdit={true}
          open={showEditModal}
          onOpenChange={(open) => {
            if (!isSaving) {
              setShowEditModal(open);
              if (!open) resetForm();
            }
          }}
          formData={formData}
          setFormData={setFormData}
          validationErrors={validationErrors}
          isSaving={isSaving}
          handleSaveUser={handleSaveUser}
        />
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <UserViewModal
          user={selectedUser}
          open={showViewModal}
          onOpenChange={setShowViewModal}
          onClearHighlight={handleClearHighlight}
          onLoginAs={handleLoginAsUser}
          impersonating={impersonatingId === selectedUser._id}
        />
      )}

      {/* Orders Modal */}
      {showOrdersModal && selectedUser && (
        <UserOrdersModal 
          user={selectedUser} 
          open={showOrdersModal} 
          onOpenChange={setShowOrdersModal}
        />
      )}
    </div>
  );
}