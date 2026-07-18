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
  Globe,
  Loader2,
  Star,
} from 'lucide-react';
import { PaginationComponent } from '@/components/PaginationComponent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { Plan, PlanFormData } from '@/types';
import { getPlans, createPlan, updatePlan, deletePlan } from '@/services/api';
import { useTableBulk } from '@/hooks/use-table-bulk';
import { BulkBar, SelectCheck } from '@/components/bulk-bar';
import { cn } from '@/lib/utils';

// ---- helpers ----
const currencySymbol = (loc: string) => (loc === 'india' ? '₹' : '$');
const locationLabel = (loc: string) => (loc === 'india' ? 'India' : 'Foreign');
const formatPrice = (loc: string, val?: string) => {
  if (!val) return '—';
  const clean = String(val).replace(/[₹$]/g, '').trim();
  return clean ? `${currencySymbol(loc)}${clean}` : '—';
};

const TONES: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-[#1560BD]' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

const TYPE_META: Record<string, { label: string; icon: any; pill: string; tone: keyof typeof TONES }> = {
  vps: { label: 'VPS', icon: Server, pill: 'bg-blue-50 text-[#1560BD]', tone: 'blue' },
  cloud: { label: 'Cloud', icon: Cloud, pill: 'bg-violet-50 text-violet-700', tone: 'violet' },
  dedicated: { label: 'Dedicated', icon: HardDrive, pill: 'bg-orange-50 text-orange-700', tone: 'orange' },
  forex: { label: 'Forex', icon: TrendingUp, pill: 'bg-emerald-50 text-emerald-700', tone: 'emerald' },
};

const StatsCard = ({
  title,
  value,
  icon: Icon,
  tone = 'blue',
}: {
  title: string;
  value: number | string;
  icon: any;
  tone?: keyof typeof TONES;
}) => {
  const t = TONES[tone] || TONES.blue;
  return (
    <Card className="card-hover">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.bg}`}>
          <Icon className={`h-5 w-5 ${t.text}`} />
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold leading-tight tabular-nums text-slate-900">{value}</div>
          <div className="truncate text-xs font-medium text-slate-500">{title}</div>
        </div>
      </CardContent>
    </Card>
  );
};

const emptyForm: PlanFormData = {
  name: '',
  type: 'vps',
  location: 'india',
  windowsPrice: '',
  linuxPrice: '',
  managedLinuxPrice: '',
  managedWindowsPrice: '',
  ips: 1,
  systemType: 'linux',
  specs: { cpu: '', ram: '', storage: '', bandwidth: '' },
  features: [],
  popular: false,
  status: 'active',
};

const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [modalType, setModalType] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(emptyForm);
  const [featuresInput, setFeaturesInput] = useState('');
  const [saving, setSaving] = useState(false);

  const [stats, setStats] = useState({
    totalPlans: 0,
    activePlans: 0,
    vpsPlans: 0,
    cloudPlans: 0,
    dedicatedPlans: 0,
    forexPlans: 0,
  });

  const { toast } = useToast();
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response: any = await getPlans({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        filter: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (response) {
        setPlans(response.items || []);
        setTotalPages(response.totalPages || 1);
        setTotalItems(response.totalPlans || (response.items?.length ?? 0));
        setStats({
          totalPlans: response.totalPlans || 0,
          activePlans: response.activeCount || 0,
          vpsPlans: response.totalVPS || 0,
          cloudPlans: response.totalCloud || 0,
          dedicatedPlans: response.totalDedicated || 0,
          forexPlans: response.totalForex || 0,
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch plans', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const { bulk, deleting, onDelete } = useTableBulk(plans, { noun: 'plan', deleteOne: deletePlan, reload: fetchPlans });

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, typeFilter, statusFilter, itemsPerPage]);

  const handleOpenModal = (type: string, plan?: Plan) => {
    setModalType(type);
    setSelectedPlan(plan || null);

    if (type === 'add') {
      setFormData(emptyForm);
      setFeaturesInput('');
    } else if (type === 'edit' && plan) {
      setFormData({
        name: plan.name,
        type: plan.type,
        location: plan.location,
        windowsPrice: plan.windowsPrice,
        linuxPrice: plan.linuxPrice,
        managedLinuxPrice: plan.managedLinuxPrice || '',
        managedWindowsPrice: plan.managedWindowsPrice || '',
        ips: plan.ips ?? 1,
        systemType: plan.systemType || 'linux',
        specs: plan.specs,
        features: plan.features,
        popular: plan.popular,
        status: plan.status,
      });
      setFeaturesInput(plan.features.join(', '));
    }
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedPlan(null);
    setFormData(emptyForm);
    setFeaturesInput('');
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const planData = {
        ...formData,
        // location comes from the form (india / us) so USA-page plans can be created too
        features: featuresInput.split(',').map((f) => f.trim()).filter((f) => f.length > 0),
      };

      if (modalType === 'add') {
        await createPlan(planData);
        toast({ title: 'Success', description: 'Plan created successfully' });
      } else if (modalType === 'edit' && selectedPlan) {
        await updatePlan(selectedPlan._id, planData);
        toast({ title: 'Success', description: 'Plan updated successfully' });
      }
      fetchPlans();
      handleCloseModal();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save plan', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    try {
      await deletePlan(selectedPlan._id);
      toast({ title: 'Success', description: 'Plan deleted successfully' });
      fetchPlans();
      handleCloseModal();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete plan', variant: 'destructive' });
    }
  };

  const curSym = currencySymbol(formData.location);

  return (
    <div className="space-y-6">
      {/* Stats: 4 plan types + total + active */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatsCard title="Total Plans" value={stats.totalPlans} icon={Filter} tone="slate" />
        <StatsCard title="VPS" value={stats.vpsPlans} icon={Server} tone="blue" />
        <StatsCard title="Cloud" value={stats.cloudPlans} icon={Cloud} tone="violet" />
        <StatsCard title="Dedicated" value={stats.dedicatedPlans} icon={HardDrive} tone="orange" />
        <StatsCard title="Forex" value={stats.forexPlans} icon={TrendingUp} tone="emerald" />
        <StatsCard title="Active" value={stats.activePlans} icon={Globe} tone="blue" />
      </div>

      {/* Filters + Add */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">Rows</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(v) => { setCurrentPage(1); setItemsPerPage(Number(v)); }}
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="vps">VPS</SelectItem>
              <SelectItem value="cloud">Cloud</SelectItem>
              <SelectItem value="dedicated">Dedicated</SelectItem>
              <SelectItem value="forex">Forex</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={() => handleOpenModal('add')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Plan
          </Button>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      <BulkBar count={bulk.count} onClear={bulk.clear} onDelete={onDelete} deleting={deleting} noun="plan" />

      {/* Plans Table */}
      <Card>
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3.5 w-10"><SelectCheck ariaLabel="Select all plans" checked={bulk.allSelected} indeterminate={bulk.someSelected} onChange={bulk.toggleAll} /></th>
                {['Plan Name', 'Type', 'Location', 'Specifications', 'Price / month', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-300" />
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No plans found
                  </td>
                </tr>
              ) : (
                plans.map((plan) => {
                  const meta = TYPE_META[plan.type] || TYPE_META.vps;
                  const TypeIcon = meta.icon;
                  return (
                    <tr key={plan._id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-4"><SelectCheck ariaLabel="Select plan" checked={bulk.selected.has(plan._id)} onChange={() => bulk.toggle(plan._id)} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${TONES[meta.tone].bg}`}>
                            <TypeIcon className={`h-4 w-4 ${TONES[meta.tone].text}`} />
                          </div>
                          <div className="font-medium text-slate-900 flex items-center gap-1.5">
                            {plan.name}
                            {plan.popular && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', meta.pill)}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                          plan.location === 'india' ? 'bg-blue-50 text-[#1560BD]' : 'bg-cyan-50 text-cyan-700'
                        )}>
                          <Globe className="h-3 w-3" />
                          {locationLabel(plan.location)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5 text-xs text-slate-600">
                          <div><span className="text-slate-400">CPU:</span> {plan.specs?.cpu || '—'}</div>
                          <div><span className="text-slate-400">RAM:</span> {plan.specs?.ram || '—'}</div>
                          <div><span className="text-slate-400">Storage:</span> {plan.specs?.storage || '—'}</div>
                          <div><span className="text-slate-400">Bandwidth:</span> {plan.specs?.bandwidth || '—'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          <div className="font-semibold tabular-nums text-slate-900">
                            {formatPrice(plan.location, plan.linuxPrice)} <span className="text-xs font-normal text-slate-400">Linux</span>
                          </div>
                          <div className="font-semibold tabular-nums text-slate-900">
                            {formatPrice(plan.location, plan.windowsPrice)} <span className="text-xs font-normal text-slate-400">Windows</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                          plan.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        )}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleOpenModal('view', plan)} title="View"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleOpenModal('edit', plan)} title="Edit"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleOpenModal('delete', plan)} title="Delete"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50">
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

        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemType="plans"
        />
      </Card>

      {/* Plan Modal */}
      <Sheet open={modalType !== null} onOpenChange={(open) => !open && handleCloseModal()}>
        <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              {modalType === 'view' && 'Plan Details'}
              {modalType === 'add' && 'Add New Plan'}
              {modalType === 'edit' && 'Edit Plan'}
              {modalType === 'delete' && 'Delete Plan'}
            </SheetTitle>
            <SheetDescription>
              {modalType === 'view' && 'View plan information and features'}
              {modalType === 'add' && 'Create a new hosting plan'}
              {modalType === 'edit' && 'Update plan information'}
              {modalType === 'delete' && 'Are you sure you want to delete this plan?'}
            </SheetDescription>
          </SheetHeader>

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
                    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', (TYPE_META[selectedPlan.type] || TYPE_META.vps).pill)}>
                      {(TYPE_META[selectedPlan.type] || TYPE_META.vps).label}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="mt-1">{locationLabel(selectedPlan.location)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Popular</Label>
                  <p className="mt-1">{selectedPlan.popular ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Linux Price</Label>
                  <p className="mt-1 font-semibold">{formatPrice(selectedPlan.location, selectedPlan.linuxPrice)}/mo</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Windows Price</Label>
                  <p className="mt-1 font-semibold">{formatPrice(selectedPlan.location, selectedPlan.windowsPrice)}/mo</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">CPU</Label>
                  <p className="mt-1">{selectedPlan.specs?.cpu || '—'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">RAM</Label>
                  <p className="mt-1">{selectedPlan.specs?.ram || '—'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Storage</Label>
                  <p className="mt-1">{selectedPlan.specs?.storage || '—'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Bandwidth</Label>
                  <p className="mt-1">{selectedPlan.specs?.bandwidth || '—'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="mt-1 capitalize">{selectedPlan.status}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Features</Label>
                <div className="mt-2 space-y-1">
                  {selectedPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
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
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter plan name" />
                </div>
                <div>
                  <Label htmlFor="type">Plan Type *</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vps">VPS</SelectItem>
                      <SelectItem value="cloud">Cloud</SelectItem>
                      <SelectItem value="dedicated">Dedicated</SelectItem>
                      <SelectItem value="forex">Forex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value as 'india' | 'us' })}>
                    <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="india">India 🇮🇳</SelectItem>
                      <SelectItem value="us">USA 🇺🇸</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-slate-400">Prices stored in ₹; USA page auto-converts to $ at order time.</p>
                </div>
                <div>
                  <Label htmlFor="popular">Popular Plan</Label>
                  <Select value={String(formData.popular)} onValueChange={(value) => setFormData({ ...formData, popular: value === 'true' })}>
                    <SelectTrigger><SelectValue placeholder="Popular?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">No</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="linuxPrice">Linux Price * ({curSym})</Label>
                  <Input id="linuxPrice" value={formData.linuxPrice} onChange={(e) => setFormData({ ...formData, linuxPrice: e.target.value })} placeholder={`e.g., ${curSym}3,999`} />
                </div>
                <div>
                  <Label htmlFor="windowsPrice">Windows Price * ({curSym})</Label>
                  <Input id="windowsPrice" value={formData.windowsPrice} onChange={(e) => setFormData({ ...formData, windowsPrice: e.target.value })} placeholder={`e.g., ${curSym}7,999`} />
                </div>
                {formData.type === 'dedicated' && (
                  <>
                    <div>
                      <Label htmlFor="managedLinuxPrice">Managed Linux Price ({curSym})</Label>
                      <Input id="managedLinuxPrice" value={formData.managedLinuxPrice || ''} onChange={(e) => setFormData({ ...formData, managedLinuxPrice: e.target.value })} placeholder="blank = +10% of Linux price" />
                    </div>
                    <div>
                      <Label htmlFor="managedWindowsPrice">Managed Windows Price ({curSym})</Label>
                      <Input id="managedWindowsPrice" value={formData.managedWindowsPrice || ''} onChange={(e) => setFormData({ ...formData, managedWindowsPrice: e.target.value })} placeholder="blank = +10% of Windows price" />
                    </div>
                    <div>
                      <Label htmlFor="ips">Included IPs</Label>
                      <Input id="ips" type="number" min={1} value={formData.ips ?? 1} onChange={(e) => setFormData({ ...formData, ips: Number(e.target.value) || 1 })} placeholder="e.g., 1 or 5" />
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="ram">RAM</Label>
                  <Input id="ram" value={formData.specs.ram} onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, ram: e.target.value } })} placeholder="e.g., 32GB RAM" />
                </div>
                <div>
                  <Label htmlFor="storage">Storage</Label>
                  <Input id="storage" value={formData.specs.storage} onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, storage: e.target.value } })} placeholder="e.g., 240GB NVMe SSD" />
                </div>
                <div>
                  <Label htmlFor="cpu">CPU</Label>
                  <Input id="cpu" value={formData.specs.cpu} onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, cpu: e.target.value } })} placeholder="e.g., 16 vCPU Cores" />
                </div>
                <div>
                  <Label htmlFor="bandwidth">Bandwidth</Label>
                  <Input id="bandwidth" value={formData.specs.bandwidth} onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, bandwidth: e.target.value } })} placeholder="e.g., 8TB Bandwidth" />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="features">Features (comma-separated)</Label>
                <Textarea id="features" value={featuresInput} onChange={(e) => setFeaturesInput(e.target.value)} placeholder="99.9% Uptime, 24/7 Support, Free SSL, Daily Backups" rows={3} />
              </div>
            </div>
          )}

          {modalType === 'delete' && selectedPlan && (
            <div className="py-4 text-center">
              <p>This action cannot be undone. This will permanently delete the plan:</p>
              <p className="mt-2 font-semibold">{selectedPlan.name}</p>
            </div>
          )}

          <SheetFooter className="mt-6 gap-2 border-t pt-4">
            {modalType === 'view' && <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={handleCloseModal}>Close</Button>}
            {(modalType === 'add' || modalType === 'edit') && (
              <>
                <Button variant="outline" onClick={handleCloseModal} disabled={saving}>Cancel</Button>
                <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={handleSubmit} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {modalType === 'add' ? 'Create Plan' : 'Update Plan'}
                </Button>
              </>
            )}
            {modalType === 'delete' && (
              <>
                <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete Plan</Button>
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PlansPage;
