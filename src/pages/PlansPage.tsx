import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Server,
  Cloud,
  HardDrive,
  TrendingUp,
  Activity,
  DollarSign,
  Users,
  Zap,
  Target
} from 'lucide-react';
import { PaginationComponent } from '@/components/PaginationComponent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { useToast } from '@/hooks/use-toast';
import { Plan, PlanFormData, PlanType, ModalType , OSType} from '@/types';
import { getPlans, createPlan, updatePlan, deletePlan } from '@/services/api';


const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    type: 'vps',
    systemType: 'linux',
    ram: '',
    storage: '',
    cpu: '',
    bandwidth: '',
    price: 0,
    features: [],
    status: 'active'
  });
  const [featuresInput, setFeaturesInput] = useState('');

  const [stats, setStats] = useState({
  totalPlans: 0,
  activePlans: 0,
  inactivePlans: 0,
  vpsPlans: 0,
  cloudPlans: 0,
  dedicatedPlans: 0,
});
  const { toast } = useToast();
  const itemsPerPage = 10;

  const fetchPlans = async () => {
  try {
    setLoading(true);
    const response = await getPlans({
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm,
      filter: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    });

    if (response) {
      // ✅ set plans list
      setPlans(response.items);

      // ✅ set pagination
      setTotalPages(response.totalPages);

      // ✅ directly use API-provided stats
      setStats({
        totalPlans: response.totalPlans || 0,
        activePlans: response.activeCount || 0,
        inactivePlans: response.inactiveCount || 0,
        vpsPlans: response.totalVPS || 0,
        cloudPlans: response.totalCloud || 0,
        dedicatedPlans: response.totalDedicated || 0,
      });
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to fetch plans",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchPlans();
  }, [currentPage, searchTerm, typeFilter]);

  const handleOpenModal = (type: ModalType, plan?: Plan) => {
    setModalType(type);
    setSelectedPlan(plan || null);
    
    if (type === 'add') {
      setFormData({
        name: '',
        type: 'vps',
        systemType: 'linux',
        ram: '',
        storage: '',
        cpu: '',
        bandwidth: '',
        price: 0,
        features: [],
        status: 'active'
      });
      setFeaturesInput('');
    } else if (type === 'edit' && plan) {
      setFormData({
        name: plan.name,
        type: plan.type,
        systemType: plan.systemType,
        ram: plan.ram,
        storage: plan.storage,
        cpu: plan.cpu,
        bandwidth: plan.bandwidth,
        price: plan.price,
        features: plan.features,
        status: plan.status
      });
      setFeaturesInput(plan.features.join(', '));
    }
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedPlan(null);
    setFormData({
      name: '',
      type: 'vps',
      systemType:'linux',
      ram: '',
      storage: '',
      cpu: '',
      bandwidth: '',
      price: 0,
      features: [],
      status: 'active'
    });
    setFeaturesInput('');
  };

  const handleSubmit = async () => {
    try {
      const planData = {
        ...formData,
        features: featuresInput.split(',').map(f => f.trim()).filter(f => f.length > 0)
      };

      if (modalType === 'add') {
        const response = await createPlan(planData);
        if (response) {
          toast({
            title: "Success",
            description: "Plan created successfully",
          });
          fetchPlans();
          handleCloseModal();
        }
      } else if (modalType === 'edit' && selectedPlan) {
         console.log("update",selectedPlan)
        const response = await updatePlan(selectedPlan._id, planData);
        console.log("update",response)
        if (response) {
          toast({
            title: "Success",
            description: "Plan updated successfully",
          });
          fetchPlans();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save plan",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;

    try {
      const response = await deletePlan(selectedPlan._id);
      console.log("update",response)
      if (response) {
        toast({
          title: "Success",
          description: "Plan deleted successfully",
        });
        fetchPlans();
        handleCloseModal();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete plan",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: PlanType) => {
    switch (type) {
      case 'vps': return <Server className="h-4 w-4" />;
      case 'cloud': return <Cloud className="h-4 w-4" />;
      case 'dedicated': return <HardDrive className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: PlanType) => {
    switch (type) {
      case 'vps': return 'bg-blue-100 text-blue-800';
      case 'cloud': return 'bg-purple-100 text-purple-800';
      case 'dedicated': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getSystemTypeColor = (systemType: string) => {
    return systemType === 'linux' 
      ? 'bg-green-100 text-orange-800' 
      : 'bg-green-100 text-blue-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans Management</h1>
          <p className="text-gray-600">Manage hosting plans and pricing</p>
        </div>
        <Button onClick={() => handleOpenModal('add')} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white opacity-90">Total Plans</CardTitle>
            <Target className="h-5 w-5 text-white opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalPlans}</div>
            <p className="text-xs text-white/70 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8% this quarter
            </p>
          </CardContent>
        </Card>
        
        <Card className="gradient-card-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white opacity-90">Active Plans</CardTitle>
            <Activity className="h-5 w-5 text-white opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activePlans}</div>
            <p className="text-xs text-white/70 mt-1">
              {Math.round((stats.activePlans / stats.totalPlans) * 100)}% available
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white opacity-90">Inactive Plans</CardTitle>
            <Zap className="h-5 w-5 text-white opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.inactivePlans}</div>
            <p className="text-xs text-white/70 mt-1">
              Under review
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white opacity-90">VPS Plans</CardTitle>
            <Server className="h-5 w-5 text-white opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.vpsPlans}</div>
            <p className="text-xs text-white/70 mt-1">
              Enterprise ready
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white opacity-90">Cloud Plans</CardTitle>
            <Cloud className="h-5 w-5 text-white opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.cloudPlans}</div>
            <p className="text-xs text-white/70 mt-1">
              Scalable solutions
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white opacity-90">Dedicated Plans</CardTitle>
            <HardDrive className="h-5 w-5 text-white opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.dedicatedPlans}</div>
            <p className="text-xs text-white/70 mt-1">
              High performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="vps">VPS</SelectItem>
                <SelectItem value="cloud">Cloud</SelectItem>
                <SelectItem value="dedicated">Dedicated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Plans Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>OS Type</TableHead>
              <TableHead>Specifications</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <div className="flex items-center space-x-4">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No plans found
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(plan.type)}
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-gray-500">{plan._id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(plan.type)}>
                      {plan.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSystemTypeColor(plan.systemType)}>
                      {plan.systemType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div>RAM: {plan.ram}</div>
                      <div>Storage: {plan.storage}</div>
                      <div>CPU: {plan.cpu}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">${plan.price}/month</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(plan.status)}>
                      {plan.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal('view', plan)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal('edit', plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal('delete', plan)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={plans.length}
          itemsPerPage={10}
          onPageChange={setCurrentPage}
          itemType="plans"
        />
      </Card>

      {/* Plan Modal */}
      <Dialog open={modalType !== null} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {modalType === 'view' && 'Plan Details'}
              {modalType === 'add' && 'Add New Plan'}
              {modalType === 'edit' && 'Edit Plan'}
              {modalType === 'delete' && 'Delete Plan'}
            </DialogTitle>
            <DialogDescription>
              {modalType === 'view' && 'View plan information and features'}
              {modalType === 'add' && 'Create a new hosting plan'}
              {modalType === 'edit' && 'Update plan information'}
              {modalType === 'delete' && 'Are you sure you want to delete this plan?'}
            </DialogDescription>
          </DialogHeader>

          {modalType === 'view' && selectedPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Plan Name</Label>
                  <p className="mt-1">{selectedPlan.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="mt-1">
                    <Badge className={getTypeColor(selectedPlan.type)}>
                      {selectedPlan.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                 <div>
                  <Label className="text-sm font-medium">OS Type</Label>
                  <div className="mt-1">
                    <Badge className={getSystemTypeColor(selectedPlan.systemType)}>
                      {selectedPlan.systemType.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">RAM</Label>
                  <p className="mt-1">{selectedPlan.ram}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Storage</Label>
                  <p className="mt-1">{selectedPlan.storage}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">CPU</Label>
                  <p className="mt-1">{selectedPlan.cpu}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Bandwidth</Label>
                  <p className="mt-1">{selectedPlan.bandwidth}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Price</Label>
                  <p className="mt-1 font-semibold">${selectedPlan.price}/month</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedPlan.status)}>
                      {selectedPlan.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Features</Label>
                <div className="mt-2 space-y-1">
                  {selectedPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(modalType === 'add' || modalType === 'edit') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter plan name"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Plan Type</Label>
                  <Select value={formData.type} onValueChange={(value: PlanType) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vps">VPS</SelectItem>
                      <SelectItem value="cloud">Cloud</SelectItem>
                      <SelectItem value="dedicated">Dedicated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div>
                  <Label htmlFor="systemType">OS Type</Label>
                  <Select value={formData.systemType} onValueChange={(value: OSType) => setFormData({ ...formData, systemType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linux">Linux</SelectItem>
                      <SelectItem value="window">Window</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ram">RAM</Label>
                  <Input
                    id="ram"
                    value={formData.ram}
                    onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                    placeholder="e.g., 8GB"
                  />
                </div>
                <div>
                  <Label htmlFor="storage">Storage</Label>
                  <Input
                    id="storage"
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    placeholder="e.g., 256GB SSD"
                  />
                </div>
                <div>
                  <Label htmlFor="cpu">CPU</Label>
                  <Input
                    id="cpu"
                    value={formData.cpu}
                    onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                    placeholder="e.g., 4 vCPU"
                  />
                </div>
                <div>
                  <Label htmlFor="bandwidth">Bandwidth</Label>
                  <Input
                    id="bandwidth"
                    value={formData.bandwidth}
                    onChange={(e) => setFormData({ ...formData, bandwidth: e.target.value })}
                    placeholder="e.g., 2TB/month"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (USD/month)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="features">Features (comma-separated)</Label>
                <Textarea
                  id="features"
                  value={featuresInput}
                  onChange={(e) => setFeaturesInput(e.target.value)}
                  placeholder="99.9% Uptime, 24/7 Support, Free SSL, Daily Backups"
                  rows={3}
                />
              </div>
            </div>
          )}

          {modalType === 'delete' && selectedPlan && (
            <div className="text-center py-4">
              <p>This action cannot be undone. This will permanently delete the plan:</p>
              <p className="font-semibold mt-2">{selectedPlan.name}</p>
            </div>
          )}

          <DialogFooter>
            {modalType === 'view' && (
              <Button onClick={handleCloseModal}>
                Close
              </Button>
            )}
            {(modalType === 'add' || modalType === 'edit') && (
              <>
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {modalType === 'add' ? 'Create Plan' : 'Update Plan'}
                </Button>
              </>
            )}
            {modalType === 'delete' && (
              <>
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete Plan
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlansPage;
