import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
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
  Trash
} from 'lucide-react';
import { User, UserFormData, PaginationParams } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getUsers, createUser, updateUser, deleteUser } from '@/services/api';
import { cn } from '@/lib/utils';

// Helper function to check if a date is today
const isToday = (dateString?: string): boolean => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// Move StatsCard outside
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  gradient,
  loading = false
}: {
  title: string;
  value: string;
  icon: any;
  gradient: string;
  loading?: boolean;
}) => (
  <Card className="card-hover">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-600">
        {title}
      </CardTitle>
      <div className={`w-10 h-10 rounded-lg ${gradient} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </CardHeader>
    <CardContent>
      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      ) : (
        <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      )}
    </CardContent>
  </Card>
);

// Move UserOrdersModal outside
const UserOrdersModal = ({ user, open, onOpenChange }: { user: User; open: boolean; onOpenChange: (open: boolean) => void }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl w-full">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span>Orders for {user.name}</span>
          <Badge variant="secondary">{user.ordersCount || 0} orders</Badge>
        </DialogTitle>
        <DialogDescription>
          View all orders placed by this user
        </DialogDescription>
      </DialogHeader>
      
      <div className="text-center py-8 text-slate-500">
        Orders data will be displayed here when available.
        <p className="text-sm mt-2">API integration needed for user orders.</p>
      </div>
    </DialogContent>
  </Dialog>
);

// Move UserViewModal outside
const UserViewModal = ({ user, open, onOpenChange, onClearHighlight }: { user: User; open: boolean; onOpenChange: (open: boolean) => void; onClearHighlight?: () => void }) => {
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && onClearHighlight && isToday(user.createdAt)) {
      onClearHighlight();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>User Details</span>
            {isToday(user.createdAt) && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                New Today
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Detailed information about the user account
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className={cn(
                "w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold",
                isToday(user.createdAt) && "ring-4 ring-yellow-300 ring-offset-2"
              )}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                {user.name}
                {isToday(user.createdAt) && (
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                )}
              </h3>
              <p className="text-slate-600">{user.email}</p>
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
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Address</span>
              </div>
              <p className="text-slate-900">{user.address || 'N/A'}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Joined Date</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-slate-900">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
                {isToday(user.createdAt) && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
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
        </div>
      </DialogContent>
    </Dialog>
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
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-600" />
          Confirm Delete
        </DialogTitle>
        <DialogDescription>
          {isBulk 
            ? `Are you sure you want to delete ${count} selected user${count !== 1 ? 's' : ''}? This action cannot be undone.`
            : `Are you sure you want to delete user "${userName}"? This action cannot be undone.`
          }
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
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
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }, [setFormData]);

  const handleSelectChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [setFormData]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setFormData(prev => ({ ...prev, [id]: checked }));
  }, [setFormData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl w-full"
        onInteractOutside={(e) => {
          if (isSaving) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update user information' : 'Add a new user to the system'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto px-1">
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
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  className={validationErrors.password ? 'border-red-500' : ''}
                  disabled={isSaving}
                  autoComplete="new-password"
                />
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
              className="btn-primary"
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
      </DialogContent>
    </Dialog>
  );
};

interface UsersResponse {
  items: User[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  page: number;
  totalPages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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
    role: 'user',
    status: 'active',
    isEmailVerified: false
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const usersPerPage = 10;
  
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

      const response = await getUsers(params) as UsersResponse;
      
      if (response && response.items) {
        setUsers(response.items);
        setTotalPages(response.totalPages || Math.ceil(response.totalCount / usersPerPage));
        setTotalUsers(response.totalCount || 0);
        setActiveCount(response.activeCount || 0);
        setInactiveCount(response.inactiveCount || 0);
        calculateTodayNewUsers(response.items);
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
  }, [currentPage, searchTerm, statusFilter, usersPerPage, toast, calculateTodayNewUsers]);

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

  // Calculate verified count from current users
  const verifiedCount = useMemo(() => {
    return users.filter(user => user.isEmailVerified).length;
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm) ||
        user.address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      const matchesEmailVerification = emailVerifiedFilter === 'all' ||
        (emailVerifiedFilter === 'verified' && user.isEmailVerified) ||
        (emailVerifiedFilter === 'unverified' && !user.isEmailVerified);
      
      return matchesSearch && matchesStatus && matchesEmailVerification;
    });
  }, [users, searchTerm, statusFilter, emailVerifiedFilter]);

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
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Users Management</h1>
        <p className="text-slate-600">Manage and monitor all user accounts and their activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatsCard
          title="Total Users"
          value={totalUsers.toString()}
          icon={Users}
          gradient="bg-gradient-to-r from-blue-500 to-blue-600"
          loading={loading && users.length === 0}
        />
        <StatsCard
          title="Active Users"
          value={activeCount.toString()}
          icon={UserCheck}
          gradient="bg-gradient-to-r from-green-500 to-green-600"
          loading={loading && users.length === 0}
        />
        <StatsCard
          title="Inactive Users"
          value={inactiveCount.toString()}
          icon={UserX}
          gradient="bg-gradient-to-r from-red-500 to-red-600"
          loading={loading && users.length === 0}
        />
        <StatsCard
          title="Verified Emails"
          value={verifiedCount.toString()}
          icon={ShieldCheck}
          gradient="bg-gradient-to-r from-purple-500 to-purple-600"
          loading={loading && users.length === 0}
        />
        <StatsCard
          title="New Today"
          value={todayNewUsers.toString()}
          icon={Sparkles}
          gradient="bg-gradient-to-r from-yellow-500 to-orange-500"
          loading={loading && users.length === 0}
        />
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <CardTitle>User List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  autoComplete="off"
                />
              </div>
              
              <Select
                value={statusFilter}
                onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}
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
                onValueChange={(value: 'all' | 'verified' | 'unverified') => setEmailVerifiedFilter(value)}
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
              
              <Button className="btn-primary" onClick={handleAddUser}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* Bulk Actions Bar */}
              {selectedUsers.size > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2"
                  >
                    <Trash className="w-4 h-4" />
                    Delete Selected
                  </Button>
                </div>
              )}

              {/* Users Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-slate-600">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSelectAll}
                          className="p-0 hover:bg-transparent"
                        >
                          {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </Button>
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-600">User</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-600">Contact Info</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-600">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-600">Verification</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-600">Role</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-600">Orders</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-600">Joined Date</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-600">Actions</th>
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
                              isNewToday && !isHighlighted && "bg-gradient-to-r from-yellow-50 to-orange-50 animate-pulse-slow",
                              isHighlighted && "bg-gradient-to-r from-yellow-100 to-orange-100 shadow-inner",
                              isSelected && "bg-blue-50"
                            )}
                          >
                            <td className="py-4 px-6">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSelectUser(user._id)}
                                className="p-0 hover:bg-transparent"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-400" />
                                )}
                              </Button>
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
                                        isNewToday && "ring-2 ring-yellow-400 ring-offset-2"
                                      )}
                                    />
                                  ) : (
                                    <div className={cn(
                                      "w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold",
                                      isNewToday && "ring-2 ring-yellow-400 ring-offset-2"
                                    )}>
                                      {user.name?.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  {isNewToday && !isHighlighted && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                                    {user.name}
                                    {isNewToday && (
                                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-xs px-1.5 py-0">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        New
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-slate-500 truncate max-w-32">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                <div className="text-sm">
                                  <span className="text-slate-500">Phone:</span>{' '}
                                  <span className="font-medium">{user.phone || 'N/A'}</span>
                                </div>
                                <div className="text-sm text-slate-600 truncate max-w-48">
                                  {user.address || 'No address'}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <Badge 
                                variant="secondary"
                                className={
                                  user.status === 'active' 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }
                              >
                                {user.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-6">
                              <Badge 
                                variant="secondary"
                                className={
                                  user.isEmailVerified 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }
                              >
                                {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                              </Badge>
                            </td>
                            <td className="py-4 px-6">
                              <Badge variant="secondary">
                                {user.role || 'user'}
                              </Badge>
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
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">
                                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                </span>
                                {isNewToday && (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                                    Today
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewUser(user)}
                                  className={cn(
                                    "hover:bg-slate-200",
                                    isNewToday && "text-yellow-700 hover:text-yellow-800"
                                  )}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                  className="hover:bg-slate-200"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteClick(user._id, user.name)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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
              <div className="mt-6">
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
                <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      {todayNewUsers} new user{todayNewUsers !== 1 ? 's' : ''} joined today!
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-white text-yellow-700 border-yellow-300">
                    Click on user to remove highlight
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