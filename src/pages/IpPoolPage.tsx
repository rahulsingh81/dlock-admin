import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaginationComponent } from '@/components/PaginationComponent';
import { 
  Globe, 
  MapPin, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Shield, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Loader2,
  Server,
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
  Zap,
  Sparkles,
  Star,
  Layers,
  MemoryStick,
  Gauge,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn, formatDate } from '@/lib/utils';
import { getIPPools, createIPPool, updateIPPool, deleteIPPool } from '@/services/api';
import { useTableBulk } from '@/hooks/use-table-bulk';
import { BulkBar, SelectCheck } from '@/components/bulk-bar';


// Types for IP Pool
interface IPSpecs {
  protection: string;
  virtualization:string;
  storageType:string;
  uptime:string
}

// RAM specific specs for each size
interface RAMSpecs {
  '4GB': {
    cpu: string;
    storage: string;
    bandwidth: string;
  };
  '8GB': {
    cpu: string;
    storage: string;
    bandwidth: string;
  };
  '16GB': {
    cpu: string;
    storage: string;
    bandwidth: string;
  };
  '32GB': {
    cpu: string;
    storage: string;
    bandwidth: string;
  };
}

interface IPAvailability {
  '4GB': boolean;
  '8GB': boolean;
  '16GB': boolean;
  '32GB': boolean;
}

interface IPPricing {
  '4GB': number;
  '8GB': number;
  '16GB': number;
  '32GB': number;
}

interface IPStockByRam {
  '4GB': number;
  '8GB': number;
  '16GB': number;
  '32GB': number;
}

interface IPPool {
  _id: string;
  series: string;
  location: 'NOIDA' | 'MUMBAI' | 'DELHI' | 'NEW LAUNCH' | 'CHENNAI' | 'BANGALORE' | 'KOLKATA';
  plan: 'SILVER' | 'GOLD' | 'DIAMOND' | 'PLATINUM';
  status: 'available' | 'coming-soon' | 'maintenance' | 'out-of-stock';
  availability: IPAvailability;
  pricing: IPPricing;
  ramSpecs: RAMSpecs;  // New field for RAM-specific specs
  specs: IPSpecs;       // General specs (virtualization, storageType, protection, uptime)
  description: string;
  isActive: boolean;
  stock: number;
  stockByRam: IPStockByRam;
  tags: Array<'recommended' | 'new' | 'popular' | 'limited'>;
  createdAt: string;
  updatedAt: string;
}

interface IPPoolFormData {
  series: string;
  location: string;
  plan: string;
  status: string;
  availability: IPAvailability;
  pricing: IPPricing;
  ramSpecs: RAMSpecs;  // New field for RAM-specific specs
  specs: IPSpecs;
  description: string;
  stock: number;
  stockByRam: IPStockByRam;
  tags: string[];
  isActive: boolean;
}

interface IPPoolsResponse {
  success: boolean;
  items: IPPool[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  statusCounts: {
    available: number;
    'coming-soon': number;
    maintenance: number;
    'out-of-stock': number;
  };
  planCounts: {
    SILVER: number;
    GOLD: number;
    DIAMOND: number;
    PLATINUM: number;
  };
  page: number;
  totalPages: number;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper function to get status badge
const getStatusBadge = (status: string) => {
  const statusConfig = {
    'available': { 
      label: 'Available', 
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle 
    },
    'coming-soon': { 
      label: 'Coming Soon', 
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Clock 
    },
    'maintenance': { 
      label: 'Maintenance', 
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: AlertCircle 
    },
    'out-of-stock': { 
      label: 'Out of Stock', 
      className: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle 
    }
  };
  return statusConfig[status as keyof typeof statusConfig] || statusConfig['coming-soon'];
};

// Helper function to get plan badge
const getPlanBadge = (plan: string) => {
  const planConfig = {
    'SILVER': { 
      className: 'bg-slate-100 text-slate-800 border-slate-200',
      icon: Server 
    },
    'GOLD': { 
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Star 
    },
    'DIAMOND': { 
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Sparkles 
    },
    'PLATINUM': { 
      className: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: Zap 
    }
  };
  return planConfig[plan as keyof typeof planConfig] || planConfig['SILVER'];
};

// Stats Card Component
const IP_TONES: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-[#1560BD]' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-500' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
};

const StatsCard = ({
  title,
  value,
  icon: Icon,
  tone = 'blue',
  loading = false,
  subValue,
}: {
  title: string;
  value: string;
  icon: any;
  tone?: keyof typeof IP_TONES;
  loading?: boolean;
  subValue?: string;
}) => {
  const t = IP_TONES[tone] || IP_TONES.blue;
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
            <>
              <div className="text-xl font-bold leading-tight tabular-nums text-slate-900">{value}</div>
              <div className="truncate text-xs font-medium text-slate-500">{title}</div>
              {subValue && <p className="truncate text-[11px] text-slate-400">{subValue}</p>}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// IP Pool View Modal
const IPPoolViewModal = ({ 
  ipPool, 
  open, 
  onOpenChange 
}: { 
  ipPool: IPPool | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) => {
  if (!ipPool) return null;
  
  const status = getStatusBadge(ipPool.status);
  const StatusIcon = status.icon;
  const plan = getPlanBadge(ipPool.plan);
  const PlanIcon = plan.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2 text-xl">
            <Globe className="w-5 h-5" />
            <span>IP Pool Details: {ipPool.series}</span>
          </SheetTitle>
          <SheetDescription>
            Complete information about this IP series and its configurations
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex flex-wrap items-start justify-between gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{ipPool.series}</h3>
              <p className="text-sm text-slate-600 mt-1">{ipPool.description}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={cn("flex items-center gap-1", status.className)}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </Badge>
              <Badge variant="outline" className={cn("flex items-center gap-1", plan.className)}>
                <PlanIcon className="w-3 h-3" />
                {ipPool.plan}
              </Badge>
            </div>
          </div>

          {/* Main Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Location & Plan */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location & Plan
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="font-medium text-slate-900">{ipPool.location}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Plan</p>
                    <p className="font-medium text-slate-900">{ipPool.plan}</p>
                  </div>
                </div>
              </div>

              {/* General Specifications */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  General Specifications
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Cpu className="w-3 h-3" /> Virtualization
                    </p>
                    <p className="font-medium text-slate-900">{ipPool.specs.virtualization || 'KVM'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <HardDrive className="w-3 h-3" /> Storage Type
                    </p>
                    <p className="font-medium text-slate-900">{ipPool.specs.storageType || 'NVMe SSD'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Protection
                    </p>
                    <p className="font-medium text-slate-900">{ipPool.specs.protection}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Gauge className="w-3 h-3" /> Uptime
                    </p>
                    <p className="font-medium text-slate-900">{ipPool.specs.uptime || '99.9%'}</p>
                  </div>
                </div>
              </div>

              {/* Tags & Stock */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags & Inventory
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ipPool.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="capitalize">
                      {tag}
                    </Badge>
                  ))}
                  {(!ipPool.tags || ipPool.tags.length === 0) && (
                    <p className="text-sm text-slate-500">No tags</p>
                  )}
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Available Stock</p>
                  <p className="text-2xl font-bold text-slate-900">{ipPool.stock}</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* RAM Options with Specifications */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  RAM Configurations
                </h4>
                <div className="space-y-3">
                  {(['4GB', '8GB', '16GB', '32GB'] as const).map((ram) => (
                    <div 
                      key={ram}
                      className={cn(
                        "p-3 rounded-lg border",
                        ipPool.availability[ram] 
                          ? "bg-green-50 border-green-200" 
                          : "bg-slate-50 border-slate-200 opacity-60"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {ipPool.availability[ram] ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-semibold">{ram} RAM</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">
                            {formatCurrency(ipPool.pricing[ram])}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">/mo</span>
                          {ipPool.availability[ram] && (
                            <div
                              className={cn(
                                'text-[11px] font-medium',
                                (ipPool.stockByRam?.[ram] || 0) > 0 ? 'text-green-600' : 'text-red-500'
                              )}
                            >
                              {(ipPool.stockByRam?.[ram] || 0) > 0
                                ? `${ipPool.stockByRam?.[ram]} in stock`
                                : 'Out of stock'}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {ipPool.ramSpecs && ipPool.ramSpecs[ram] && (
                        <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                          <div className="flex items-center gap-1 text-slate-600">
                            <Cpu className="w-3 h-3" />
                            <span>{ipPool.ramSpecs[ram].cpu}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600">
                            <HardDrive className="w-3 h-3" />
                            <span>{ipPool.ramSpecs[ram].storage}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600">
                            <Wifi className="w-3 h-3" />
                            <span>{ipPool.ramSpecs[ram].bandwidth}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status & Dates */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Status & Timeline
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Active Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {ipPool.isActive ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-700">Active</span>
                        </>
                      ) : (
                        <>
                          <Ban className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-700">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Stock Status</p>
                    <p className="font-medium text-slate-900">
                      {ipPool.stock > 0 ? `${ipPool.stock} units` : 'Out of stock'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Created</p>
                    <p className="font-medium text-slate-900">
                      {formatDate(ipPool.createdAt)}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Last Updated</p>
                    <p className="font-medium text-slate-900">
                      {formatDate(ipPool.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// RAM Specs Editor Component
const RAMSpecsEditor = ({ 
  ramSize, 
  specs, 
  onChange,
  disabled,
  isAvailable
}: { 
  ramSize: string;
  specs: { cpu: string; storage: string; bandwidth: string; };
  onChange: (field: string, value: string) => void;
  disabled: boolean;
  isAvailable: boolean;
}) => {
  if (!isAvailable) return null;

  return (
    <div className="ml-8 mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <p className="text-xs font-semibold text-slate-500 mb-2">Specifications for {ramSize}</p>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label htmlFor={`${ramSize}-cpu`} className="text-xs">CPU</Label>
          <Input
            id={`${ramSize}-cpu`}
            value={specs.cpu}
            onChange={(e) => onChange(`${ramSize}.cpu`, e.target.value)}
            className="text-sm h-8"
            placeholder="e.g., 2 vCPU"
            disabled={disabled}
          />
        </div>
        <div>
          <Label htmlFor={`${ramSize}-storage`} className="text-xs">Storage</Label>
          <Input
            id={`${ramSize}-storage`}
            value={specs.storage}
            onChange={(e) => onChange(`${ramSize}.storage`, e.target.value)}
            className="text-sm h-8"
            placeholder="e.g., 50GB SSD"
            disabled={disabled}
          />
        </div>
        <div>
          <Label htmlFor={`${ramSize}-bandwidth`} className="text-xs">Bandwidth</Label>
          <Input
            id={`${ramSize}-bandwidth`}
            value={specs.bandwidth}
            onChange={(e) => onChange(`${ramSize}.bandwidth`, e.target.value)}
            className="text-sm h-8"
            placeholder="e.g., 1TB"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

// Add/Edit IP Pool Modal
const AddEditIPPoolModal = ({ 
  isEdit, 
  open, 
  onOpenChange, 
  formData, 
  setFormData,
  validationErrors,
  isSaving,
  handleSaveIPPool
}: { 
  isEdit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: IPPoolFormData;
  setFormData: React.Dispatch<React.SetStateAction<IPPoolFormData>>;
  validationErrors: Record<string, string>;
  isSaving: boolean;
  handleSaveIPPool: () => Promise<void>;
}) => {
  const locations = ['NOIDA', 'MUMBAI', 'DELHI', 'NEW LAUNCH', 'CHENNAI', 'BANGALORE', 'KOLKATA'];
  const plans = ['SILVER', 'GOLD', 'DIAMOND', 'PLATINUM'];
  const statuses = ['available', 'coming-soon', 'maintenance', 'out-of-stock'];
  const tagOptions = ['recommended', 'new', 'popular', 'limited'];
  const ramOptions = ['4GB', '8GB', '16GB', '32GB'];

  const [activeTab, setActiveTab] = useState('basic');

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }, [setFormData]);

  const handleSelectChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [setFormData]);

  const handleNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: parseInt(value) || 0 }));
  }, [setFormData]);

  const handleAvailabilityChange = useCallback((ram: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [ram]: checked
      }
    }));
  }, [setFormData]);

  const handlePricingChange = useCallback((ram: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [ram]: parseInt(value) || 0
      }
    }));
  }, [setFormData]);

  const handleStockChange = useCallback((ram: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      stockByRam: {
        ...prev.stockByRam,
        [ram]: Math.max(0, parseInt(value) || 0)
      }
    }));
  }, [setFormData]);

  const handleRAMSpecsChange = useCallback((path: string, value: string) => {
    const [ram, field] = path.split('.');
    setFormData(prev => ({
      ...prev,
      ramSpecs: {
        ...prev.ramSpecs,
        [ram]: {
          ...(prev.ramSpecs?.[ram as keyof typeof prev.ramSpecs] || {}),
          [field]: value
        }
      }
    }));
  }, [setFormData]);

  const handleGeneralSpecsChange = useCallback((field: keyof IPSpecs, value: string) => {
    setFormData(prev => ({
      ...prev,
      specs: {
        ...prev.specs,
        [field]: value
      }
    }));
  }, [setFormData]);

  const handleTagsChange = useCallback((tag: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      tags: checked 
        ? [...prev.tags, tag]
        : prev.tags.filter(t => t !== tag)
    }));
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
          <SheetTitle>{isEdit ? 'Edit IP Pool' : 'Add New IP Pool'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Update IP series configuration' : 'Add a new IP series to the pool'}
          </SheetDescription>
        </SheetHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="ram">RAM Configuration</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
          </TabsList>

          <form onSubmit={(e) => { e.preventDefault(); handleSaveIPPool(); }} className="space-y-6 mt-6">
            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="series">IP Series *</Label>
                  <Input
                    id="series"
                    value={formData.series}
                    onChange={handleInputChange}
                    placeholder="e.g., 103.138.x"
                    className={validationErrors.series ? 'border-red-500' : ''}
                    disabled={isSaving}
                    autoFocus={!isEdit}
                  />
                  {validationErrors.series && (
                    <p className="text-sm text-red-500">{validationErrors.series}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Select 
                    value={formData.location} 
                    onValueChange={(value) => handleSelectChange('location', value)}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.location && (
                    <p className="text-sm text-red-500">{validationErrors.location}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan">Plan *</Label>
                  <Select 
                    value={formData.plan} 
                    onValueChange={(value) => handleSelectChange('plan', value)}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="plan">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map(plan => (
                        <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.plan && (
                    <p className="text-sm text-red-500">{validationErrors.plan}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleSelectChange('status', value)}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleNumberChange}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Active Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                      disabled={isSaving}
                    />
                    <Label htmlFor="isActive" className="text-sm cursor-pointer">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </Label>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-4 pt-2">
                    {tagOptions.map(tag => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`tag-${tag}`}
                          checked={formData.tags.includes(tag)}
                          onCheckedChange={(checked) => handleTagsChange(tag, checked as boolean)}
                          disabled={isSaving}
                        />
                        <Label htmlFor={`tag-${tag}`} className="text-sm capitalize cursor-pointer">
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter description for this IP series"
                    rows={3}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </TabsContent>

            {/* RAM Configuration Tab */}
            <TabsContent value="ram" className="space-y-4">
              <div className="space-y-6">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <MemoryStick className="w-5 h-5" />
                  RAM Availability & Pricing
                </h3>
                
                {ramOptions.map(ram => (
                  <div key={ram} className="space-y-2">
                    <div className="grid grid-cols-12 gap-4 items-center p-3 bg-slate-50 rounded-lg">
                      <div className="col-span-2 flex items-center space-x-2">
                        <Checkbox
                          id={`avail-${ram}`}
                          checked={formData.availability?.[ram as keyof IPAvailability] ?? false}
                          onCheckedChange={(checked) => handleAvailabilityChange(ram, checked as boolean)}
                          disabled={isSaving}
                        />
                        <Label htmlFor={`avail-${ram}`} className="font-medium cursor-pointer">
                          {ram}
                        </Label>
                      </div>
                      <div className="col-span-5">
                        <Label className="text-[11px] text-slate-500">Price / month</Label>
                        <div className="flex items-center">
                          <span className="text-slate-500 mr-2">₹</span>
                          <Input
                            type="number"
                            min="0"
                            value={formData.pricing?.[ram as keyof IPPricing] ?? 0}
                            onChange={(e) => handlePricingChange(ram, e.target.value)}
                            className="w-full"
                            placeholder="Price"
                            disabled={isSaving || !formData.availability?.[ram as keyof IPAvailability]}
                          />
                        </div>
                      </div>
                      <div className="col-span-5">
                        <Label className="text-[11px] text-slate-500">Stock (units)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={formData.stockByRam?.[ram as keyof IPStockByRam] ?? 0}
                            onChange={(e) => handleStockChange(ram, e.target.value)}
                            className="w-full"
                            placeholder="Stock qty"
                            disabled={isSaving || !formData.availability?.[ram as keyof IPAvailability]}
                          />
                          {formData.availability?.[ram as keyof IPAvailability] &&
                            (formData.stockByRam?.[ram as keyof IPStockByRam] ?? 0) <= 0 && (
                              <span className="whitespace-nowrap text-[11px] font-medium text-red-500">
                                Out of stock
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* RAM Specific Specs */}
                    {formData.availability?.[ram as keyof IPAvailability] && (
                      <RAMSpecsEditor
                        ramSize={ram}
                        specs={formData.ramSpecs?.[ram as keyof typeof formData.ramSpecs] ?? { cpu: '', storage: '', bandwidth: '' }}
                        onChange={handleRAMSpecsChange}
                        disabled={isSaving}
                        isAvailable={true}
                      />
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Specifications Tab */}
            <TabsContent value="specs" className="space-y-4">
              <div className="space-y-6">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  General Server Specifications
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specs-virtualization">Virtualization</Label>
                    <Input
                      id="specs-virtualization"
                      value={formData.specs.virtualization || 'KVM Virtualization'}
                      onChange={(e) => handleGeneralSpecsChange('virtualization', e.target.value)}
                      placeholder="e.g., KVM Virtualization"
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specs-storageType">Storage Type</Label>
                    <Input
                      id="specs-storageType"
                      value={formData.specs.storageType || 'NVMe SSD'}
                      onChange={(e) => handleGeneralSpecsChange('storageType', e.target.value)}
                      placeholder="e.g., NVMe SSD"
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specs-protection">Protection</Label>
                    <Input
                      id="specs-protection"
                      value={formData.specs.protection}
                      onChange={(e) => handleGeneralSpecsChange('protection', e.target.value)}
                      placeholder="e.g., DDoS Protected"
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specs-uptime">Uptime SLA</Label>
                    <Input
                      id="specs-uptime"
                      value={formData.specs.uptime || '99.9% Uptime SLA'}
                      onChange={(e) => handleGeneralSpecsChange('uptime', e.target.value)}
                      placeholder="e.g., 99.9% Uptime SLA"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <SheetFooter className="mt-6 gap-2 border-t pt-4">
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
                  isEdit ? 'Update IP Pool' : 'Add IP Pool'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({
  open,
  onOpenChange,
  ipPool,
  isDeleting,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ipPool: IPPool | null;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
}) => {
  if (!ipPool) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-6 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Delete IP Pool
          </SheetTitle>
          <SheetDescription>
            Are you sure you want to delete this IP pool? This action cannot be undone.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <div className="p-4 bg-slate-50 rounded-lg space-y-2">
            <p className="font-medium text-slate-900">{ipPool.series}</p>
            <p className="text-sm text-slate-600">{ipPool.location} • {ipPool.plan}</p>
            <Badge variant="outline" className={getStatusBadge(ipPool.status).className}>
              {getStatusBadge(ipPool.status).label}
            </Badge>
          </div>
        </div>

        <SheetFooter className="mt-6 gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete IP Pool'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// Main IP Pools Page Component
export default function IPPoolsPage() {
  const [ipPools, setIPPools] = useState<IPPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ramFilter, setRamFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    available: 0,
    'coming-soon': 0,
    maintenance: 0,
    'out-of-stock': 0
  });
  const [planCounts, setPlanCounts] = useState({
    SILVER: 0,
    GOLD: 0,
    DIAMOND: 0,
    PLATINUM: 0
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIPPool, setSelectedIPPool] = useState<IPPool | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<IPPoolFormData>({
    series: '',
    location: '',
    plan: '',
    status: 'coming-soon',
    availability: {
      '4GB': false,
      '8GB': false,
      '16GB': false,
      '32GB': false
    },
    pricing: {
      '4GB': 499,
      '8GB': 799,
      '16GB': 1299,
      '32GB': 2299
    },
    ramSpecs: {
      '4GB': { cpu: '2 vCPU', storage: '50GB NVMe SSD', bandwidth: '1TB @ 2Gbps' },
      '8GB': { cpu: '4 vCPU', storage: '100GB NVMe SSD', bandwidth: '2TB @ 2Gbps' },
      '16GB': { cpu: '8 vCPU', storage: '200GB NVMe SSD', bandwidth: '4TB @ 2Gbps' },
      '32GB': { cpu: '16 vCPU', storage: '400GB NVMe SSD', bandwidth: '8TB @ 2Gbps' }
    },
    specs: {
      virtualization: 'KVM Virtualization',
      storageType: 'NVMe SSD',
      protection: 'DDoS Protected',
      uptime: '99.9% Uptime SLA'
    },
    description: 'High-performance VPS with dedicated IP series',
    stock: 100,
    stockByRam: {
      '4GB': 0,
      '8GB': 0,
      '16GB': 0,
      '32GB': 0
    },
    tags: [],
    isActive: true
  });

  const { toast } = useToast();
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const filterTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch IP pools from API
  const fetchIPPools = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    }

    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage
      };

      if (searchTerm) params.search = searchTerm;
      if (locationFilter !== 'all') params.location = locationFilter;
      if (planFilter !== 'all') params.plan = planFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (ramFilter !== 'all') params.ram = ramFilter;
      if (activeFilter !== 'all') params.isActive = activeFilter === 'active';

      const response = await getIPPools(params);
      
      console.log('API Response:', response); // Debug log
      
      if (response.success) {
        // Handle both response formats (admin list and public list)
        if (response.items) {
          // Admin list format
          setIPPools(response.items || []);
          setTotalCount(response.totalCount || 0);
          setTotalPages(response.totalPages || 1);
          setActiveCount(response.activeCount || 0);
          setInactiveCount(response.inactiveCount || 0);
          setStatusCounts(response.statusCounts || {
            available: 0,
            'coming-soon': 0,
            maintenance: 0,
            'out-of-stock': 0
          });
          setPlanCounts(response.planCounts || {
            SILVER: 0,
            GOLD: 0,
            DIAMOND: 0,
            PLATINUM: 0
          });
        } else if (response.data) {
          // Public list format
          setIPPools(response.data || []);
          setTotalCount(response.total || 0);
          setTotalPages(response.pagination?.totalPages || 1);
          setActiveCount(response.stats?.available || 0);
          setInactiveCount(0); // Public API doesn't show inactive
          setStatusCounts({
            available: response.stats?.available || 0,
            'coming-soon': response.stats?.comingSoon || 0,
            maintenance: 0,
            'out-of-stock': 0
          });
        }
      }

    } catch (error: any) {
      console.error('Fetch IP pools error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch IP pools",
        variant: "destructive",
      });
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [currentPage, searchTerm, locationFilter, planFilter, statusFilter, ramFilter, activeFilter, itemsPerPage, toast]);

  const { bulk, deleting, onDelete } = useTableBulk(ipPools, { noun: 'IP pool', deleteOne: deleteIPPool, reload: () => fetchIPPools(false) });

  // Initial fetch
  useEffect(() => {
    fetchIPPools(true);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchIPPools(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Debounced filters
  useEffect(() => {
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    filterTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchIPPools(false);
    }, 300);

    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [locationFilter, planFilter, statusFilter, ramFilter, activeFilter]);

  // Handle page changes
  useEffect(() => {
    if (!loading) {
      fetchIPPools(false);
    }
  }, [currentPage]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.series?.trim()) {
      errors.series = 'IP series is required';
    } else if (!/^[0-9]+\.[0-9]+\.x$/.test(formData.series)) {
      errors.series = 'IP series must be in format: xxx.xxx.x';
    }
    
    if (!formData.location) {
      errors.location = 'Location is required';
    }
    
    if (!formData.plan) {
      errors.plan = 'Plan is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      series: '',
      location: '',
      plan: '',
      status: 'coming-soon',
      availability: {
        '4GB': false,
        '8GB': false,
        '16GB': false,
        '32GB': false
      },
      pricing: {
        '4GB': 499,
        '8GB': 799,
        '16GB': 1299,
        '32GB': 2299
      },
      ramSpecs: {
        '4GB': { cpu: '2 vCPU', storage: '50GB NVMe SSD', bandwidth: '1TB @ 2Gbps' },
        '8GB': { cpu: '4 vCPU', storage: '100GB NVMe SSD', bandwidth: '2TB @ 2Gbps' },
        '16GB': { cpu: '8 vCPU', storage: '200GB NVMe SSD', bandwidth: '4TB @ 2Gbps' },
        '32GB': { cpu: '16 vCPU', storage: '400GB NVMe SSD', bandwidth: '8TB @ 2Gbps' }
      },
      specs: {
        virtualization: 'KVM Virtualization',
        storageType: 'NVMe SSD',
        protection: 'DDoS Protected',
        uptime: '99.9% Uptime SLA'
      },
      description: 'High-performance VPS with dedicated IP series',
      stock: 100,
      stockByRam: {
        '4GB': 0,
        '8GB': 0,
        '16GB': 0,
        '32GB': 0
      },
      tags: [],
      isActive: true
    });
    setValidationErrors({});
  };

  const handleAddIPPool = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditIPPool = (ipPool: IPPool) => {
    setSelectedIPPool(ipPool);
    setFormData({
      series: ipPool.series,
      location: ipPool.location,
      plan: ipPool.plan,
      status: ipPool.status,
      availability: { ...ipPool.availability },
      pricing: { ...ipPool.pricing },
      ramSpecs: ipPool.ramSpecs ? { ...ipPool.ramSpecs } : formData.ramSpecs,
      specs: { ...ipPool.specs },
      description: ipPool.description,
      stock: ipPool.stock,
      stockByRam: ipPool.stockByRam
        ? { ...ipPool.stockByRam }
        : { '4GB': 0, '8GB': 0, '16GB': 0, '32GB': 0 },
      tags: [...ipPool.tags],
      isActive: ipPool.isActive
    });
    setValidationErrors({});
    setShowEditModal(true);
  };

  const handleViewIPPool = (ipPool: IPPool) => {
    setSelectedIPPool(ipPool);
    setShowViewModal(true);
  };

  const handleDeleteClick = (ipPool: IPPool) => {
    setSelectedIPPool(ipPool);
    setShowDeleteModal(true);
  };

  const handleSaveIPPool = async () => {
    if (!validateForm()) {
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    try {
      if (showAddModal) {
        await createIPPool(formData);
        toast({
          title: "Success",
          description: `IP Pool ${formData.series} has been added successfully`,
        });
        setShowAddModal(false);
      } else {
        if (!selectedIPPool) return;
        await updateIPPool(selectedIPPool._id, formData);
        toast({
          title: "Success",
          description: `IP Pool ${formData.series} has been updated successfully`,
        });
        setShowEditModal(false);
      }
      resetForm();
      fetchIPPools(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save IP pool",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIPPool = async () => {
    if (!selectedIPPool) return;

    setIsDeleting(true);
    try {
      await deleteIPPool(selectedIPPool._id);
      toast({
        title: "Success",
        description: `IP Pool ${selectedIPPool.series} has been deleted successfully`,
      });
      setShowDeleteModal(false);
      fetchIPPools(false);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete IP pool",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatsCard title="Total IP Pools" value={totalCount.toString()} icon={Globe} tone="blue" loading={loading} />
        <StatsCard title="Active Pools" value={activeCount.toString()} icon={CheckCircle} tone="emerald" loading={loading} />
        <StatsCard title="Inactive Pools" value={inactiveCount.toString()} icon={Ban} tone="rose" loading={loading} />
        <StatsCard
          title="Available"
          value={statusCounts.available.toString()}
          icon={Zap}
          tone="violet"
          loading={loading}
          subValue={`${statusCounts['coming-soon']} coming soon`}
        />
      </div>


      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by series or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="whitespace-nowrap">Rows</span>
                <Select value={String(itemsPerPage)} onValueChange={(v) => { setCurrentPage(1); setItemsPerPage(Number(v)); }}>
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

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="NOIDA">Noida</SelectItem>
                  <SelectItem value="MUMBAI">Mumbai</SelectItem>
                  <SelectItem value="DELHI">Delhi</SelectItem>
                  <SelectItem value="BANGALORE">Bangalore</SelectItem>
                  <SelectItem value="CHENNAI">Chennai</SelectItem>
                  <SelectItem value="KOLKATA">Kolkata</SelectItem>
                  <SelectItem value="NEW LAUNCH">New Launch</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="SILVER">Silver</SelectItem>
                  <SelectItem value="GOLD">Gold</SelectItem>
                  <SelectItem value="DIAMOND">Diamond</SelectItem>
                  <SelectItem value="PLATINUM">Platinum</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="coming-soon">Coming Soon</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ramFilter} onValueChange={setRamFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="RAM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All RAM</SelectItem>
                  <SelectItem value="4GB">4GB</SelectItem>
                  <SelectItem value="8GB">8GB</SelectItem>
                  <SelectItem value="16GB">16GB</SelectItem>
                  <SelectItem value="32GB">32GB</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={handleAddIPPool}>
                <Plus className="w-4 h-4 mr-2" />
                Add IP Pool
              </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      <BulkBar count={bulk.count} onClear={bulk.clear} onDelete={onDelete} deleting={deleting} noun="IP pool" />

      {/* IP Pools Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* IP Pools Table */}
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3.5 w-10"><SelectCheck ariaLabel="Select all IP pools" checked={bulk.allSelected} indeterminate={bulk.someSelected} onChange={bulk.toggleAll} /></th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">IP Series</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Location</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Plan</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">RAM Options</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Pricing (From)</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Specs</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Stock</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ipPools.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-12 text-slate-500">
                          <div className="flex flex-col items-center space-y-3">
                            <Globe className="w-12 h-12 text-slate-300" />
                            <div>
                              <p className="font-medium">No IP pools found</p>
                              <p className="text-sm">Try adjusting your search or filters</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      ipPools.map((ipPool) => {
                        const status = getStatusBadge(ipPool.status);
                        const StatusIcon = status.icon;
                        const plan = getPlanBadge(ipPool.plan);
                        const PlanIcon = plan.icon;
                        
                        // Get minimum price
                        const availableRams = Object.entries(ipPool.availability || {})
                          .filter(([_, available]) => available)
                          .map(([ram]) => ram);
                        const minPrice = availableRams.length > 0
                          ? Math.min(...availableRams.map(ram => ipPool.pricing?.[ram as keyof IPPricing] ?? 0))
                          : 0;

                        // Get first available RAM specs for display
                        const firstAvailableRam = availableRams[0] as keyof typeof ipPool.ramSpecs;
                        const displaySpecs = firstAvailableRam && ipPool.ramSpecs?.[firstAvailableRam];

                        return (
                          <tr key={ipPool._id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-4"><SelectCheck ariaLabel="Select IP pool" checked={bulk.selected.has(ipPool._id)} onChange={() => bulk.toggle(ipPool._id)} /></td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3">
                                <Globe className="w-5 h-5 text-slate-400" />
                                <div>
                                  <div className="font-semibold text-slate-900">{ipPool.series}</div>
                                  <div className="text-xs text-slate-500 truncate max-w-32">{ipPool.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span>{ipPool.location}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <Badge variant="outline" className={cn("flex items-center gap-1 w-fit", plan.className)}>
                                <PlanIcon className="w-3 h-3" />
                                {ipPool.plan}
                              </Badge>
                            </td>
                            <td className="py-4 px-6">
                              <Badge variant="outline" className={cn("flex items-center gap-1 w-fit", status.className)}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </Badge>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(ipPool.availability).map(([ram, available]) => (
                                  available && (
                                    <Badge key={ram} variant="secondary" className="text-xs">
                                      {ram}
                                    </Badge>
                                  )
                                ))}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-semibold text-slate-900">
                                {minPrice > 0 ? formatCurrency(minPrice) : 'N/A'}
                              </span>
                              <span className="text-xs text-slate-500 ml-1">/mo</span>
                            </td>
                            <td className="py-4 px-6">
                              {displaySpecs && (
                                <div className="text-xs space-y-1">
                                  <div className="flex items-center gap-1">
                                    <Cpu className="w-3 h-3" />
                                    <span>{displaySpecs.cpu}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <HardDrive className="w-3 h-3" />
                                    <span>{displaySpecs.storage}</span>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              {(() => {
                                const sb = ipPool.stockByRam;
                                const total = sb
                                  ? (sb['4GB'] || 0) + (sb['8GB'] || 0) + (sb['16GB'] || 0) + (sb['32GB'] || 0)
                                  : ipPool.stock;
                                return (
                                  <div className="space-y-1">
                                    <Badge variant={total > 0 ? 'secondary' : 'destructive'}>
                                      {total} total
                                    </Badge>
                                    {sb && (
                                      <div className="flex flex-wrap gap-1">
                                        {(['4GB', '8GB', '16GB', '32GB'] as const).map((r) =>
                                          ipPool.availability[r] ? (
                                            <span
                                              key={r}
                                              className={cn(
                                                'rounded px-1.5 py-0.5 text-[10px] font-medium',
                                                (sb[r] || 0) > 0
                                                  ? 'bg-slate-100 text-slate-600'
                                                  : 'bg-red-50 text-red-600'
                                              )}
                                            >
                                              {r}: {sb[r] || 0}
                                            </span>
                                          ) : null
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewIPPool(ipPool)}
                                  className="hover:bg-slate-200"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditIPPool(ipPool)}
                                  className="hover:bg-slate-200"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteClick(ipPool)}
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
              {totalPages > 1 && (
                <div className="border-t border-slate-100 px-4 py-4">
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    itemType="IP pools"
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals - Keep these as they are */}
      <AddEditIPPoolModal
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
        handleSaveIPPool={handleSaveIPPool}
      />

      {selectedIPPool && (
        <>
          <AddEditIPPoolModal
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
            handleSaveIPPool={handleSaveIPPool}
          />

          <IPPoolViewModal
            ipPool={selectedIPPool}
            open={showViewModal}
            onOpenChange={setShowViewModal}
          />

          <DeleteConfirmModal
            open={showDeleteModal}
            onOpenChange={setShowDeleteModal}
            ipPool={selectedIPPool}
            isDeleting={isDeleting}
            onConfirm={handleDeleteIPPool}
          />
        </>
      )}
    </div>
  );
}