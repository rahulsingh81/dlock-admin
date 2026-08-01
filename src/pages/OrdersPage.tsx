import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Mail,
  Package,
  RefreshCw,
  Loader2,
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
import { PaginationComponent } from '@/components/PaginationComponent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useToast } from '@/hooks/use-toast';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSearchParams } from 'react-router-dom';
import { getOrders, getOrder, createOrder, updateOrder, deleteOrder, renewOrder, getUsers, getActivePlans, getIPPools, sendEmail, exportData, getFxRate, bulkDelete } from '@/services/api';
import { useBulkSelect } from '@/hooks/use-bulk-select';
import { BulkBar, SelectCheck } from '@/components/bulk-bar';
import { useConfirm } from '@/components/confirm-provider';

// parse a price that may be a string like "₹1,999" or a number
const parsePrice = (v: any): number => {
  if (v === undefined || v === null) return 0;
  const n = Number(String(v).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
};

const fmtDate = (d: any): string =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (d: any): string =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

// Show an order amount in the currency it was placed in (amounts are stored in INR base)
const oMoney = (order: any, inrAmount: number): string => {
  const isUsd = order?.currency === 'USD';
  const rate = order?.exchangeRate && order.exchangeRate > 1 ? order.exchangeRate : 88;
  if (isUsd) return '$' + (Number(inrAmount || 0) / rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return '₹' + Number(inrAmount || 0).toLocaleString('en-IN');
};

// Compute subscription dates from an order (based on its duration)
// expiry = start + duration months - 1 day ; renew = expiry - 1 day
const computeOrderDates = (order: any) => {
  const start = order?.startDate ? new Date(order.startDate) : (order?.createdAt ? new Date(order.createdAt) : null);
  let expiry: Date | null = null;
  if (order?.endDate) {
    expiry = new Date(order.endDate);
  } else if (start) {
    expiry = new Date(start);
    expiry.setMonth(expiry.getMonth() + (order?.duration || 1));
    expiry.setDate(expiry.getDate() - 1);
  }
  const renew = expiry ? new Date(expiry.getTime() - 86400000) : null;
  return { start, renew, expiry };
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [ipPools, setIpPools] = useState([]);
  const [usdRate, setUsdRate] = useState<number>(83); // ₹ per $1, refreshed from live API
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || searchParams.get('focus') || '');
  // keep search in sync when navbar navigates here with a new ?q= or ?focus=<orderId>
  useEffect(() => {
    const urlQ = searchParams.get('q');
    const focus = searchParams.get('focus');
    if (focus) setSearchTerm(focus);
    else if (urlQ !== null) setSearchTerm(urlQ);
  }, [searchParams]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [renewMonths, setRenewMonths] = useState(1);
  const [renewing, setRenewing] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const initialForm = {
    customerId: '',
    planKind: 'plan',     // 'plan' (Hosting Plan) | 'ipseries' (IP Series Plan)
    category: 'vps',      // for Hosting Plan: vps | cloud | dedicated | forex
    productType: 'vps',   // actual plan type (vps|cloud|dedicated|forex) or 'ip-pool'
    planId: '',
    planName: '',
    planType: 'vps',
    location: '',
    ipPoolId: '',
    ramOption: '',
    ram: '',
    storage: '',
    cpu: '',
    ip: '',
    osType: '',
    os: '',
    management: 'unmanaged', // dedicated: managed / unmanaged
    username: '',
    password: '',
    bandwidth: '',
    quantity: 1,
    duration: 1,
    durationMode: 'preset',   // 'preset' | 'custom'
    customStart: '',
    customEnd: '',
    basePrice: 0,
    gstAmount: 0,
    totalPrice: 0,
    orderStatus: 'active',
    paymentStatus: 'unpaid',
    deliveryStatus: 'processing',
  };
  const [formData, setFormData] = useState<any>(initialForm);
  // global counts from the API (NOT page-based)
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0, activeCount: 0, processingCount: 0, deliveredCount: 0, paidCount: 0, renewRequestedCount: 0,
  });
  const [renewOnly, setRenewOnly] = useState(false);

  const { toast } = useToast();
  const confirm = useConfirm();
  const bulk = useBulkSelect(orders as any[]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleBulkDelete = async () => {
    const ids = bulk.selectedIds;
    if (!ids.length) return;
    const ok = await confirm({
      title: `Delete ${ids.length} order(s)?`,
      description: 'This permanently removes the selected orders. This cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    setBulkDeleting(true);
    try {
      const { ok: done, failed } = await bulkDelete(ids, deleteOrder);
      toast({ title: `${done} deleted`, description: failed ? `${failed} failed` : 'Selected orders removed.', variant: failed ? 'destructive' : undefined });
      bulk.clear();
      await fetchOrders();
    } finally {
      setBulkDeleting(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: itemsPerPage };
      if (searchTerm) params.q = searchTerm;
      if (statusFilter !== 'all') params.orderStatus = statusFilter;
      if (typeFilter !== 'all') params.planType = typeFilter;
      if (paymentFilter !== 'all') params.paymentStatus = paymentFilter;
      if (renewOnly) params.renewRequested = 'true';
      const response = await getOrders(params);
      if (response) {
        setOrders(response.items);
        setTotalPages(response.totalPages);
        setOrderStats({
          totalOrders: response.totalOrders ?? 0,
          activeCount: response.activeCount ?? 0,
          processingCount: response.processingCount ?? 0,
          deliveredCount: response.deliveredCount ?? 0,
          paidCount: response.paidCount ?? 0,
          renewRequestedCount: response.renewRequestedCount ?? 0,
        });
      }
    } catch {
      toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getUsers({ limit: 1000 });
      if (response) setUsers(response.items);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await getActivePlans();
      if (response) setPlans(response.items);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    }
  };

  const fetchIpPools = async () => {
    try {
      const response: any = await getIPPools({ limit: 1000 });
      setIpPools(response?.data || response?.items || []);
    } catch (err) {
      console.error('Failed to fetch IP pools:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter, typeFilter, paymentFilter, itemsPerPage, renewOnly]);

  useEffect(() => {
    fetchUsers();
    fetchPlans();
    fetchIpPools();
    // live USD↔INR rate for foreign pricing
    getFxRate().then((r) => { if (r?.usdInr) setUsdRate(r.usdInr); }).catch(() => {});
  }, []);

  // Deep-link: /orders?open=<orderId> → auto-open that order's detail (e.g. clicked from Users → orders)
  useEffect(() => {
    const id = searchParams.get('open');
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const res: any = await getOrder(id);
        const o = res?.order || res;
        if (active && o && o._id) handleOpenModal('view', o);
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleOpenModal = (type, order = null ) => {
    setModalType(type);
    setSelectedOrder(order || null);
    if (type === 'add') {
      setFormData({ ...initialForm });
    } else if (type === 'edit' && order) {
      const isIp = order.orderType === 'ip-pool' || order.planType === 'ip-pool' || !!order.ipPoolId;
      const poolId = order.ipPoolId?._id || order.ipPoolId || '';
      setFormData({
        ...initialForm,
        customerId: order.userId?._id || '',
        planKind: isIp ? 'ipseries' : 'plan',
        category: isIp ? 'vps' : (order.planType && order.planType !== 'ip-pool' ? order.planType : 'vps'),
        productType: order.planType || (isIp ? 'ip-pool' : 'vps'),
        planId: order.planId?._id || order.planId_id || '',
        planName: order.planName || '',
        planType: order.planType || 'vps',
        location: order.location || order.ipPoolData?.location || '',
        ipPoolId: poolId,
        ramOption: isIp ? (order.ipPoolData?.selectedRAM || order.ram || '') : '',
        ram: order.ram || '',
        storage: order.storage || '',
        cpu: order.cpu || '',
        ip: order.ip || '',
        osType : order.osType || '',
        os: order.os || '',
        management: order.management || 'unmanaged',
        username: order.username || '',
        password: order.password || '',
        bandwidth: order.bandwidth || '',
        quantity: order.quantity || 1,
        duration: order.duration || 1,
        durationMode: order.startDate && order.endDate ? 'custom' : 'preset',
        customStart: order.startDate ? new Date(order.startDate).toISOString().slice(0, 10) : '',
        customEnd: order.endDate ? new Date(order.endDate).toISOString().slice(0, 10) : '',
        basePrice: order.basePrice || 0,
        gstAmount: order.gstAmount || 0,
        totalPrice: order.totalPrice || 0,
        orderStatus: order.orderStatus || 'active',
        paymentStatus: order.paymentStatus || 'unpaid',
        deliveryStatus: order.deliveryStatus || 'processing',
      });
    }
  };

  // NOTE: `value` must exactly match the Order model's `os` enum, otherwise
  // saving fails with "... is not a valid enum value for path `os`".
  const osOptions = [
    { value: "ubuntu-20.04-x86_64", label: "Ubuntu 20.04 (64-bit)" },
    { value: "ubuntu-22.04-x86_64", label: "Ubuntu 22.04 (64-bit)" },
    { value: "ubuntu-24.04-x86_64", label: "Ubuntu 24.04 (64-bit)" },
    { value: "debian-12.0-x86_64", label: "Debian 12.0 (64-bit)" },
    { value: "centos-7.9-x86_64", label: "CentOS 7.9 (64-bit)" },
    { value: "centos-9.6-x86_64", label: "CentOS 9.6 (64-bit)" },
    { value: "windows-2019-scsi-virtio", label: "Windows Server 2019" },
    { value: "windows-2022-x86_64", label: "Windows Server 2022" },
  ];
  const osTypeOptions = [
    "linux",
    "window"
  ];
  
  const handleCloseModal = () => {
    setModalType(null);
    setSelectedOrder(null);
    setFormData({ ...initialForm });
  };

  const buildPayload = () => {
    const payload: any = { ...formData };
    if (formData.planKind === 'ipseries') {
      const pool: any = ipPools.find((p: any) => p._id === formData.ipPoolId);
      payload.orderType = 'ip-pool';
      payload.planType = 'ip-pool';
      payload.planId = undefined;
      if (pool) {
        payload.ipPoolData = {
          series: pool.series,
          location: pool.location,
          plan: pool.plan,
          selectedRAM: formData.ramOption,
          ramPrice: formData.basePrice,
          specs: pool.ramSpecs?.[formData.ramOption] || {},
        };
      }
    } else {
      payload.orderType = 'regular';
      payload.ipPoolId = undefined;
    }
    // custom date range → send effective months + dates
    if (formData.durationMode === 'custom') {
      payload.duration = effectiveMonths;
      payload.startDate = formData.customStart || undefined;
      payload.endDate = formData.customEnd || undefined;
    }
    return payload;
  };

  const handleSubmit = async () => {
    try {
      if (modalType === 'add') {
        const response = await createOrder(buildPayload());
        if (response) {
          toast({ title: "Success", description: "Order created successfully" });
          fetchOrders();
          handleCloseModal();
        }
      } else if (modalType === 'edit' && selectedOrder) {
        const response = await updateOrder(selectedOrder._id, buildPayload());
        if (response) {
          toast({ title: "Success", description: "Order updated successfully" });
          fetchOrders();
          handleCloseModal();
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to save order", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    try {
      const response = await deleteOrder(selectedOrder._id);
      if (response) {
        toast({ title: "Success", description: "Order deleted successfully" });
        fetchOrders();
        handleCloseModal();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete order", variant: "destructive" });
    }
  };

  const handleRenew = async () => {
    if (!selectedOrder) return;
    setRenewing(true);
    try {
      await renewOrder(selectedOrder._id, renewMonths);
      toast({ title: "Renewed", description: `Order extended by ${renewMonths} month${renewMonths > 1 ? 's' : ''}` });
      fetchOrders();
      handleCloseModal();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to renew order", variant: "destructive" });
    } finally {
      setRenewing(false);
    }
  };

  const handleUserSelect = (userId) => {
    const user = users.find(u => u._id === userId);
    if (user) setFormData(prev => ({ ...prev, customerId: userId }));
  };

  // pick unit price from a plan (always stored in INR) based on OS type (linux/windows)
  const planUnitPrice = (plan: any, osType: string) =>
    parsePrice(osType === 'window' ? plan.windowsPrice : plan.linuxPrice);

  // convert an INR amount to the order's location currency (foreign = USD, live rate)
  const toLocationPrice = (inr: number, location: string) =>
    location === 'us' ? Math.round((inr / (usdRate || 83)) * 100) / 100 : inr;
  // currency symbol for a location
  const curSym = (location: string) => (location === 'us' ? '$' : '₹');

  const handlePlanKind = (value: string) => {
    // reset selection-specific fields when switching plan kind
    setFormData((prev: any) => ({
      ...prev,
      planKind: value,
      category: 'vps',
      productType: value === 'ipseries' ? 'ip-pool' : 'vps',
      planType: value === 'ipseries' ? 'ip-pool' : 'vps',
      planId: '',
      planName: '',
      // Hosting Plan: default India (INR); IP Series: chosen from pool
      location: value === 'ipseries' ? '' : 'india',
      ipPoolId: '',
      ramOption: '',
      ram: '',
      storage: '',
      cpu: '',
      bandwidth: '',
      basePrice: 0,
    }));
  };

  // Hosting Plan: change category (vps/cloud/dedicated/forex) → reset selected plan
  const handleCategory = (value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      category: value,
      planId: '',
      planName: '',
      basePrice: 0,
    }));
  };

  const handlePlanSelect = (planId: string) => {
    const plan = plans.find((p: any) => p._id === planId);
    if (plan) {
      setFormData((prev: any) => {
        const loc = prev.location || 'india';
        return {
          ...prev,
          planId,
          planName: plan.name,
          productType: plan.type,
          planType: plan.type,
          location: loc,
          ram: plan.specs?.ram || '',
          storage: plan.specs?.storage || '',
          cpu: plan.specs?.cpu || '',
          bandwidth: plan.specs?.bandwidth || '',
          basePrice: toLocationPrice(planUnitPrice(plan, prev.osType), loc),
        };
      });
    }
  };

  // Hosting Plan: switch India ⇄ Foreign → recompute base price in the right currency
  const handleHostingLocation = (loc: string) => {
    setFormData((prev: any) => {
      const plan = plans.find((p: any) => p._id === prev.planId);
      return {
        ...prev,
        location: loc,
        basePrice: plan ? toLocationPrice(planUnitPrice(plan, prev.osType), loc) : prev.basePrice,
      };
    });
  };

  // Hosting Plan: OS Type change → recompute base price (windows/linux differ)
  const handleHostingOsType = (osType: string) => {
    setFormData((prev: any) => {
      const plan = plans.find((p: any) => p._id === prev.planId);
      return {
        ...prev,
        osType,
        basePrice: plan ? toLocationPrice(planUnitPrice(plan, osType), prev.location || 'india') : prev.basePrice,
      };
    });
  };

  // IP-pool selection flow
  const handleLocationSelect = (loc: string) => {
    setFormData((prev: any) => ({ ...prev, location: loc, ipPoolId: '', ramOption: '', ip: '', basePrice: 0 }));
  };

  const handleSeriesSelect = (poolId: string) => {
    const pool = ipPools.find((p: any) => p._id === poolId);
    setFormData((prev: any) => ({
      ...prev,
      ipPoolId: poolId,
      ip: pool?.series || '',
      planName: pool ? `${pool.plan} - ${pool.series}` : prev.planName,
      ramOption: '',
      basePrice: 0,
    }));
  };

  const handleRamSelect = (ram: string) => {
    const pool: any = ipPools.find((p: any) => p._id === formData.ipPoolId);
    const price = pool?.pricing?.[ram] ?? 0;
    const rs = pool?.ramSpecs?.[ram] || {};
    setFormData((prev: any) => ({
      ...prev,
      ramOption: ram,
      ram,
      cpu: rs.cpu || '',
      storage: rs.storage || '',
      bandwidth: rs.bandwidth || '',
      basePrice: Number(price) || 0,
    }));
  };

  // duration discount: 6 months -> 5% off, 12 months -> 10% off (only for presets)
  const durationDiscount = (months: number) => (months >= 12 ? 10 : months >= 6 ? 5 : 0);

  // months between two yyyy-mm-dd dates (min 1)
  const monthsBetween = (start: string, end: string) => {
    if (!start || !end) return 1;
    const days = (new Date(end).getTime() - new Date(start).getTime()) / 86400000;
    return Math.max(1, Math.round(days / 30));
  };

  // effective billing months (custom date range overrides preset)
  const effectiveMonths = formData.durationMode === 'custom'
    ? monthsBetween(formData.customStart, formData.customEnd)
    : (Number(formData.duration) || 1);

  // auto-calc GST + total whenever base price / qty / duration inputs change
  useEffect(() => {
    const base = Number(formData.basePrice) || 0;
    const qty = Number(formData.quantity) || 1;
    const months = effectiveMonths;
    let subtotal = base * qty * months;
    const disc = formData.durationMode === 'custom' ? 0 : durationDiscount(months);
    if (disc > 0) subtotal = subtotal - (subtotal * disc) / 100;
    subtotal = Math.round(subtotal * 100) / 100;
    const gst = Math.round(subtotal * 0.18 * 100) / 100;
    const total = Math.round((subtotal + gst) * 100) / 100;
    setFormData((prev: any) => (prev.gstAmount === gst && prev.totalPrice === total ? prev : { ...prev, gstAmount: gst, totalPrice: total }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.basePrice, formData.quantity, formData.duration, formData.durationMode, formData.customStart, formData.customEnd]);

  const getTypeColor = (type) => {
    switch (type) {
      case 'vps': return 'bg-blue-100 text-blue-800';
      case 'cloud': return 'bg-purple-100 text-purple-800';
      case 'dedicated': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (type) => {
    switch (type) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-yellow-100 text-yellow-800';
      case 'refund': return 'bg-blue-100 text-blue-800';
      case 'cancel': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliveryColor = (status) => {
    switch (status) {
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancel': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate the invoice HTML for one order and print/save-as-PDF via a hidden iframe (no backend needed)
  const handleDownloadInvoice = (type: 'normal' | 'ca', order: any) => {
    if (!order) return;
    const isCa = type === 'ca';
    // Normal → order currency; CA → INR (for GST filing)
    const money = (n: number) => {
      if (!isCa && order.currency === 'USD') {
        const rate = order.exchangeRate && order.exchangeRate > 1 ? order.exchangeRate : 88;
        return '$' + (Number(n || 0) / rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    const total = Number(order.totalPrice || 0);
    const gst = Number(order.gstAmount || 0);
    const base = Math.max(0, Number((total - gst).toFixed(2)));
    const discount = Number(order.discountAmount || 0);
    const isPaid = order.paymentStatus === 'paid';
    const paid = isPaid ? total : 0;
    const balance = Math.max(0, total - paid);
    const fmtInv = (d: Date | null) => d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    // Subscription dates (start / renew / expiry) — same logic used across the app
    const { start: svcStart, renew: svcRenew, expiry: svcExpiry } = computeOrderDates(order);
    // Invoice date = renewal issue date if this order was renewed, else the order date
    const invoiceDate = order.renewedAt ? new Date(order.renewedAt) : (order.createdAt ? new Date(order.createdAt) : new Date());
    const dateStr = fmtInv(invoiceDate);
    // Due date = 3 days BEFORE the renewal date (fallback: invoice date + 7 days)
    let dd: Date;
    if (svcRenew) { dd = new Date(svcRenew.getTime() - 3 * 86400000); }
    else { dd = new Date(invoiceDate); dd.setDate(dd.getDate() + 7); }
    const dueStr = fmtInv(dd);
    const renewStr = fmtInv(svcRenew);
    const expiryStr = fmtInv(svcExpiry);
    const periodStr = svcStart && svcExpiry ? `${fmtInv(svcStart)} — ${fmtInv(svcExpiry)}` : '';
    const invId = `INV-${String(order._id).slice(-8).toUpperCase()}`;
    const cust = order.userId || {};
    const cd = order.customerDetails || {};
    const custName = cust.name || cd.fullName || '—';
    const custEmail = cust.email || cd.email || '';
    const custPhone = cust.phone || cd.phone || '';
    const custAddr = [cd.address, cd.city, cd.state, cd.zipCode, cd.country].filter(Boolean).join(', ');
    const custGstin = cd.gstin || cust.gstin || '';
    const logo = new URL(import.meta.env.BASE_URL + 'logo-dark.png', window.location.origin).href;

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${invId}</title>
      <style>
        *{box-sizing:border-box;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif}
        body{margin:0;padding:40px 46px;color:#111827;font-size:12.5px;line-height:1.5}
        .top{display:flex;justify-content:space-between;align-items:flex-start}
        .logo{height:48px;object-fit:contain}
        .company{font-size:21px;font-weight:800;margin-top:14px;color:#0d3a73}
        .muted{color:#6b7280}
        .title{font-size:26px;font-weight:800;letter-spacing:0.5px;text-align:right;color:#0d3a73}
        .lbl{font-weight:800;letter-spacing:0.5px;margin-bottom:4px;color:#1560BD;font-size:12px}
        .row2{display:flex;justify-content:space-between;margin-top:24px;gap:24px}
        .terms{text-align:center;font-style:italic;margin:22px 0 12px;color:#374151}
        table{width:100%;border-collapse:collapse}
        thead th{background:#0d3a73;color:#fff;text-align:left;padding:11px 14px;font-size:12px;font-weight:600}
        thead th.r,tbody td.r{text-align:right}
        tbody td{padding:13px 14px;border-bottom:1px solid #eef2f7;vertical-align:top}
        .totals{width:300px;margin-left:auto;margin-top:14px}
        .totals .line{display:flex;justify-content:space-between;padding:6px 12px;font-weight:600}
        .totals .line span:first-child{color:#6b7280}
        .balance{display:flex;justify-content:space-between;padding:13px 14px;background:#0d3a73;color:#fff;font-weight:800;font-size:15px;margin-top:8px;border-radius:6px}
        .bottom{display:flex;justify-content:space-between;margin-top:36px;gap:30px}
        .tc-title{font-size:15px;font-weight:800;color:#0d3a73}
        .pay-title{font-size:15px;font-weight:800;text-align:right;color:#0d3a73}
        .badge{display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700}
        .paid{background:#dcfce7;color:#15803d}.due{background:#fef3c7;color:#b45309}
        .foot{margin-top:30px;text-align:center;color:#9ca3af;font-size:11px;border-top:1px solid #eef2f7;padding-top:12px}
      </style></head><body>
        <div class="top">
          <div>
            <img class="logo" src="${logo}" alt="Dlock Services" onerror="this.style.display='none'"/>
            <div class="company">Dlock Services</div>
            <div class="muted" style="margin-top:6px">Hosting · Cloud · Development<br/>info@dlockservices.com<br/>+91 8503023131<br/>GSTIN: 08XXXXX0000X1ZX</div>
          </div>
          <div>
            <div class="title">TAX INVOICE${isCa ? ' (CA COPY)' : ''}</div>
            <div class="muted" style="text-align:right;margin-top:10px"><div><b>No.</b> ${invId}</div><div><b>Date:</b> ${dateStr}</div><div><b>Due Date:</b> ${dueStr}</div></div>
            <div style="text-align:right"><span class="badge ${isPaid ? 'paid' : 'due'}">${isPaid ? 'PAID' : 'DUE'}</span></div>
          </div>
        </div>
        <div class="row2">
          <div>
            <div class="lbl">INVOICE TO:</div>
            <div style="font-weight:700">${custName}</div>
            <div class="muted">${custEmail}</div>
            ${custPhone ? `<div class="muted">${custPhone}</div>` : ''}
            ${custAddr ? `<div class="muted">${custAddr}</div>` : ''}
            ${custGstin ? `<div class="muted">GSTIN: ${custGstin}</div>` : ''}
          </div>
          <div style="text-align:right">
            <div class="lbl">SERVICE:</div>
            <div style="font-weight:700">${order.planName || 'Server Plan'}</div>
            <div class="muted">${(order.planType || '').toUpperCase()} · ${(order.location || '').toUpperCase()}</div>
            ${periodStr ? `<div class="muted" style="margin-top:6px"><b>Service Period:</b> ${periodStr}</div>` : ''}
            ${renewStr !== '—' ? `<div class="muted"><b>Renews on:</b> ${renewStr}</div>` : ''}
            ${expiryStr !== '—' ? `<div class="muted"><b>Expires on:</b> ${expiryStr}</div>` : ''}
          </div>
        </div>
        <div class="terms"><b>Payment Terms:</b> ${isPaid ? 'Paid in full — thank you.' : `Please pay by ${dueStr}.`}</div>
        <table>
          <thead><tr><th>Description</th><th class="r">Quantity</th><th class="r">Price</th><th class="r">Total</th></tr></thead>
          <tbody><tr>
            <td><b>${order.planName || 'Server Plan'}</b><br/><span class="muted">${order.ram || ''} RAM · ${order.cpu || ''} · ${order.storage || ''} · ${order.os || ''}</span></td>
            <td class="r">${order.quantity || 1} × ${order.duration || 1} mo</td>
            <td class="r">${money(order.basePrice || 0)}</td>
            <td class="r">${money(base)}</td>
          </tr></tbody>
        </table>
        <div class="totals">
          <div class="line"><span>Sub Total:</span><span>${money(base)}</span></div>
          <div class="line"><span>GST (18%):</span><span>${money(gst)}</span></div>
          ${discount > 0 ? `<div class="line"><span>Discount${order.couponCode ? ` (${order.couponCode})` : ''}:</span><span>- ${money(discount)}</span></div>` : ''}
          <div class="line"><span>Total Amount:</span><span>${money(total)}</span></div>
          <div class="line"><span>Amount Paid:</span><span>${money(paid)}</span></div>
          <div class="balance"><span>Balance Due</span><span>${money(balance)}</span></div>
        </div>
        <div class="bottom">
          <div style="max-width:340px"><div class="tc-title">Terms &amp; Conditions:</div><div class="muted" style="margin-top:8px">Services are billed on a prepaid basis. Fees are generally non-refundable as per our Refund Policy.</div></div>
          <div><div class="pay-title">Payment Information</div><div class="muted" style="text-align:right;margin-top:8px">Pay online via dashboard<br/>(Cards · UPI · Net Banking)<br/>info@dlockservices.com</div></div>
        </div>
        <div class="foot">Computer-generated ${isCa ? 'CA copy ' : ''}tax invoice · Dlock Services</div>
      </body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) { document.body.removeChild(iframe); return; }
    doc.open(); doc.write(html); doc.close();
    let printed = false;
    const go = () => { if (printed) return; printed = true; try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); } catch { /* ignore */ } setTimeout(() => { try { document.body.removeChild(iframe); } catch { /* ignore */ } }, 1500); };
    iframe.onload = () => setTimeout(go, 350);
    setTimeout(go, 1500);
  };

  const handleSendEmail = async (order) => {
    try {
      await sendEmail(order._id);  
      toast({
        title: "Email Sent ",
        description: `Credentials sent to ${order.customerName || 'user'} (${order._id})`
      });
    } catch (err) {
      toast({
        title: "Email Failed ",
        description: err.response?.data?.message || "Could not send email"
      });
    }
  };

  const userOptions = users
    .filter((user: any) => user.status !== 'inactive')
    .map(user => ({
      value: user._id,
      label: user.name,
      subtitle: user.email
    }));

  // plans of the chosen category (VPS / Cloud / Dedicated / Forex) for "Hosting Plan"
  const planOptions = plans
    .filter((plan: any) => plan.type === formData.category)
    .map((plan: any) => ({
      value: plan._id,
      label: plan.name,
      subtitle: `${(plan.type || '').toUpperCase()} • ₹${parsePrice(plan.linuxPrice)}/mo`,
    }));

  // IP-pool derived options
  const poolLocations = Array.from(new Set(ipPools.map((p: any) => p.location))).filter(Boolean);
  const seriesOptions = ipPools
    .filter((p: any) => p.location === formData.location)
    .map((p: any) => ({ value: p._id, label: p.series, subtitle: `${p.plan} • Stock ${p.stock}` }));
  const selectedPool: any = ipPools.find((p: any) => p._id === formData.ipPoolId);
  const ramOptions = selectedPool
    ? ['4GB', '8GB', '16GB', '32GB'].filter((r) => selectedPool.availability?.[r])
    : [];

  // Safe parse float helper for inputs
  const safeParseFloat = (val) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end gap-2">
        {orderStats.renewRequestedCount > 0 && (
          <button
            onClick={() => { setCurrentPage(1); setRenewOnly((v) => !v); }}
            className={`mr-auto inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              renewOnly ? 'border-amber-400 bg-amber-500 text-white' : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <RefreshCw className="h-4 w-4" />
            {renewOnly ? 'Showing renewal requests' : `Renewal Requests`}
            <span className={`rounded-full px-1.5 text-xs font-bold ${renewOnly ? 'bg-white/25' : 'bg-amber-500 text-white'}`}>{orderStats.renewRequestedCount}</span>
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-slate-200">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportData('orders', 'excel')}>
              <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportData('orders', 'csv')}>
              <FileText className="h-4 w-4 mr-2 text-blue-600" />
              Export as CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={() => handleOpenModal('add')} className="bg-[#1560BD] text-white hover:bg-[#124f9c]">
          <Plus className="h-4 w-4 mr-2" />
          Add Order
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'Total Orders', value: orderStats.totalOrders, tone: 'bg-blue-50 text-[#1560BD]' },
          { label: 'Active', value: orderStats.activeCount, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Processing', value: orderStats.processingCount, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Delivered', value: orderStats.deliveredCount, tone: 'bg-violet-50 text-violet-600' },
          { label: 'Paid', value: orderStats.paidCount, tone: 'bg-emerald-50 text-emerald-600' },
        ].map((c) => (
          <Card key={c.label} className="card-hover">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.tone}`}>
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold leading-tight tabular-nums text-slate-900">{c.value}</div>
                <div className="truncate text-xs font-medium text-slate-500">{c.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, mobile, order no..."
                value={searchTerm}
                onChange={(e) => { setCurrentPage(1); setSearchTerm(e.target.value); }}
                className="pl-10"
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
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
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
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
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
            <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="cancel">Cancel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      <BulkBar count={bulk.count} onClear={bulk.clear} onDelete={handleBulkDelete} deleting={bulkDeleting} noun="order" />

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3.5 w-10"><SelectCheck ariaLabel="Select all orders" checked={bulk.allSelected} indeterminate={bulk.someSelected} onChange={bulk.toggleAll} /></th>
                {['Order', 'Customer', 'Plan', 'Qty × Duration', 'Amount', 'Payment', 'Delivery', 'Dates', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="py-12 text-center"><span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#1560BD]" /></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center text-slate-500">No orders found</td></tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order._id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                    <td className="px-4 py-4"><SelectCheck ariaLabel="Select order" checked={bulk.selected.has(order._id)} onChange={() => bulk.toggle(order._id)} /></td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold text-slate-900">{order.orderNumber || `#${String(order._id).slice(-8)}`}</div>
                      {order.invoiceNumber && <div className="font-mono text-[11px] text-slate-400">{order.invoiceNumber}</div>}
                      <div className="text-xs text-slate-500">{order.ip || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{order.userId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{order.userId?.email || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{order.planName || '—'}</div>
                      <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600">{order.planType || 'n/a'}</span>
                      {order.renewRequested && (
                        <span className="mt-1 flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          <RefreshCw className="h-3 w-3" /> Renewal req · {order.renewRequestMonths || 1}mo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 tabular-nums">
                      {order.quantity || 1} × {order.duration || 1}mo
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold tabular-nums text-slate-900">{oMoney(order, order.totalPrice)}{order.currency === 'USD' && <span className="ml-1 text-[10px] font-normal text-slate-400">USD</span>}</div>
                      <div className="text-[11px] text-slate-400 tabular-nums">Base {oMoney(order, order.basePrice)} + GST {oMoney(order, order.gstAmount)}</div>
                    </td>
                    <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getPaymentColor(order.paymentStatus)}`}>{order.paymentStatus || 'n/a'}</span></td>
                    <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getDeliveryColor(order.deliveryStatus)}`}>{order.deliveryStatus || 'n/a'}</span></td>
                    <td className="px-6 py-4">
                      {(() => {
                        const d = computeOrderDates(order);
                        return (
                          <div className="space-y-0.5 text-xs">
                            <div><span className="text-slate-400">Created:</span> <span className="text-slate-700">{fmtDateTime(order.createdAt)}</span></div>
                            <div><span className="text-slate-400">Renew:</span> <span className="text-amber-600">{fmtDate(d.renew)}</span></div>
                            <div><span className="text-slate-400">Expire:</span> <span className="text-red-600">{fmtDate(d.expiry)}</span></div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleOpenModal('view', order)} title="View" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => handleOpenModal('edit', order)} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => { setRenewMonths(order.renewRequestMonths || 1); handleOpenModal('renew', order); }} title={order.renewRequested ? `Approve renewal (${order.renewRequestMonths || 1}mo)` : 'Renew'} className={`relative flex h-8 w-8 items-center justify-center rounded-lg border bg-white ${order.renewRequested ? 'border-amber-300 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}><RefreshCw className="h-4 w-4" />{order.renewRequested && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500" />}</button>
                        <button onClick={() => handleSendEmail(order)} title="Email credentials" className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-white text-[#1560BD] hover:bg-blue-50"><Mail className="h-4 w-4" /></button>
                        <button onClick={() => handleOpenModal('delete', order)} title="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationComponent currentPage={currentPage} totalPages={totalPages} totalItems={orders.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} itemType="orders" />
      </Card>

      {/* Sheet Modal */}
      <Sheet open={modalType !== null} onOpenChange={handleCloseModal}>
        <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              {modalType === "view" && "Order Details"}
              {modalType === "add" && "Add New Order"}
              {modalType === "edit" && "Edit Order"}
              {modalType === "renew" && "Renew Order"}
              {modalType === "delete" && "Delete Order"}
            </SheetTitle>
            <SheetDescription>
              {modalType === "view" && "View order information and specifications"}
              {modalType === "add" && "Create a new order for a customer"}
              {modalType === "edit" && "Update order information"}
              {modalType === "renew" && "Extend the order period (created date stays the same)"}
              {modalType === "delete" && "Are you sure you want to delete this order?"}
            </SheetDescription>
          </SheetHeader>

          {modalType === "view" && selectedOrder && (() => {
            const cur = selectedOrder.location === 'us' ? '$' : '₹';
            const { start: startD, renew: renewD, expiry: expiryD } = computeOrderDates(selectedOrder);
            return (
            <div className="space-y-5">
              {/* Banner */}
              <div className="flex items-center justify-between rounded-xl bg-gradient-to-br from-[#1560BD] to-[#0d3a73] p-4 text-white">
                <div className="min-w-0">
                  <div className="text-xs text-blue-200">Order #{String(selectedOrder._id).slice(-8)}</div>
                  <div className="truncate text-lg font-semibold">{selectedOrder.planName || '—'}</div>
                  <div className="text-xs text-blue-100">{selectedOrder.userId?.name} · {selectedOrder.userId?.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold tabular-nums">{oMoney(selectedOrder, selectedOrder.totalPrice)}</div>
                  <div className="text-xs text-blue-200 capitalize">{selectedOrder.paymentStatus}{selectedOrder.currency === 'USD' ? ' · USD' : ''}</div>
                </div>
              </div>

              {/* Status pills */}
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusColor(selectedOrder.orderStatus)}`}>Order: {selectedOrder.orderStatus}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getPaymentColor(selectedOrder.paymentStatus)}`}>Payment: {selectedOrder.paymentStatus}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getDeliveryColor(selectedOrder.deliveryStatus)}`}>Delivery: {selectedOrder.deliveryStatus}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-600">{selectedOrder.planType}</span>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Specs */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-900">Server Specifications</h4>
                  <dl className="space-y-1.5 text-sm">
                    {[['RAM', selectedOrder.ram], ['Storage', selectedOrder.storage], ['CPU', selectedOrder.cpu], ['Bandwidth', selectedOrder.bandwidth], ['OS Type', selectedOrder.osType], ['OS', selectedOrder.os]].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-800 text-right">{v || '—'}</dd></div>
                    ))}
                  </dl>
                </div>

                {/* Access */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-900">Server Access</h4>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">IP</dt><dd className="font-mono font-medium text-slate-800">{selectedOrder.ip || '—'}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Username</dt><dd className="font-mono font-medium text-slate-800">{selectedOrder.username || '—'}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Password</dt><dd className="font-mono font-medium text-slate-800">{selectedOrder.password || '—'}</dd></div>
                  </dl>
                </div>
              </div>

              {/* Pricing summary */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-900">Pricing</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Base × Qty × Duration</span><span className="tabular-nums text-slate-800">{oMoney(selectedOrder, selectedOrder.basePrice)} × {selectedOrder.quantity || 1} × {selectedOrder.duration || 1}mo</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">GST (18%)</span><span className="tabular-nums text-slate-800">{oMoney(selectedOrder, selectedOrder.gstAmount)}</span></div>
                  {Number(selectedOrder.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span className="flex items-center gap-1.5">
                        Discount
                        {selectedOrder.couponCode && <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase text-emerald-700">{selectedOrder.couponCode}</span>}
                      </span>
                      <span className="tabular-nums">− {oMoney(selectedOrder, selectedOrder.discountAmount)}</span>
                    </div>
                  )}
                  <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900"><span>Total</span><span className="tabular-nums">{oMoney(selectedOrder, selectedOrder.totalPrice)}{selectedOrder.currency === 'USD' && <span className="ml-1 text-[10px] font-normal text-slate-400">USD · 1$=₹{selectedOrder.exchangeRate}</span>}</span></div>
                  {Number(selectedOrder.refundAmount || 0) > 0 && (
                    <div className="mt-1 flex justify-between rounded-lg bg-blue-50 px-2 py-1.5 font-semibold text-blue-700"><span>Refunded</span><span className="tabular-nums">− {oMoney(selectedOrder, selectedOrder.refundAmount)}</span></div>
                  )}
                </div>
              </div>

              {/* Subscription dates (based on duration) */}
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span>Billing period</span>
                <span className="font-semibold text-slate-800">
                  {selectedOrder.startDate && selectedOrder.endDate
                    ? `${fmtDate(startD)} → ${fmtDate(expiryD)}`
                    : `${selectedOrder.duration || 1} month${(selectedOrder.duration || 1) > 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 p-3 text-center">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">Start</div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-800">{fmtDate(startD)}</div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
                  <div className="text-[11px] uppercase tracking-wide text-amber-600">Renew by</div>
                  <div className="mt-0.5 text-sm font-semibold text-amber-700">{fmtDate(renewD)}</div>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
                  <div className="text-[11px] uppercase tracking-wide text-red-500">Expires</div>
                  <div className="mt-0.5 text-sm font-semibold text-red-600">{fmtDate(expiryD)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                <div>Created: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '—'}</div>
                <div>Updated: {selectedOrder.updatedAt ? new Date(selectedOrder.updatedAt).toLocaleString() : '—'}</div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="outline" onClick={() => handleDownloadInvoice('normal', selectedOrder)}>Download Invoice</Button>
                <Button variant="outline" onClick={() => handleDownloadInvoice('ca', selectedOrder)}>Download CA Invoice</Button>
              </div>
            </div>
            );
          })()}

          {(modalType === "add" || modalType === "edit") && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 text-sm font-semibold text-slate-800">Customer & Plan</div>
                <div>
                  <Label>Customer</Label>
                  <SearchableSelect options={userOptions} value={formData.customerId} placeholder="Select customer..." onValueChange={handleUserSelect} searchPlaceholder="Search customers..." emptyMessage="No customers found" />
                </div>
                <div>
                  <Label>Plan Type</Label>
                  <Select value={formData.planKind} onValueChange={handlePlanKind}>
                    <SelectTrigger><SelectValue placeholder="Select plan type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plan">Hosting Plan (VPS / Cloud / Dedicated / Forex)</SelectItem>
                      <SelectItem value="ipseries">IP Series Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.planKind === 'ipseries' ? (
                  <>
                    <div>
                      <Label>Location</Label>
                      <Select value={formData.location} onValueChange={handleLocationSelect}>
                        <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                        <SelectContent>
                          {poolLocations.map((loc: any) => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>IP Series</Label>
                      <SearchableSelect
                        options={seriesOptions}
                        value={formData.ipPoolId}
                        placeholder={formData.location ? 'Select IP series...' : 'Pick location first'}
                        onValueChange={handleSeriesSelect}
                        searchPlaceholder="Search series..."
                        emptyMessage="No IP series in this location"
                      />
                    </div>
                    <div>
                      <Label>RAM Plan</Label>
                      <Select value={formData.ramOption} onValueChange={handleRamSelect}>
                        <SelectTrigger><SelectValue placeholder={formData.ipPoolId ? 'Select RAM' : 'Pick IP series first'} /></SelectTrigger>
                        <SelectContent>
                          {ramOptions.map((r: string) => (
                            <SelectItem key={r} value={r}>
                              {r} — ₹{selectedPool?.pricing?.[r] ?? 0}/mo
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label>Category</Label>
                      <Select value={formData.category} onValueChange={handleCategory}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vps">VPS</SelectItem>
                          <SelectItem value="cloud">Cloud</SelectItem>
                          <SelectItem value="dedicated">Dedicated</SelectItem>
                          <SelectItem value="forex">Forex</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Plan ({(formData.category || '').toUpperCase()})</Label>
                      <SearchableSelect options={planOptions} value={formData.planId} placeholder="Select plan..." onValueChange={handlePlanSelect} searchPlaceholder="Search plans..." emptyMessage="No plans in this category" />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Select value={formData.location || 'india'} onValueChange={handleHostingLocation}>
                        <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="india">India (₹ INR)</SelectItem>
                          <SelectItem value="us">Foreign ($ USD)</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.location === 'us' && (
                        <p className="mt-1 text-xs text-slate-400">Live rate: $1 = ₹{usdRate}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="col-span-2 mt-2 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-800">Billing & Duration</div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: Math.max(1, safeParseFloat(e.target.value) || 1) })}
                  />
                </div>
                <div>
                  <Label>Duration</Label>
                  <Select
                    value={formData.durationMode === 'custom' ? 'custom' : String(formData.duration)}
                    onValueChange={(v) => {
                      if (v === 'custom') setFormData({ ...formData, durationMode: 'custom' });
                      else setFormData({ ...formData, durationMode: 'preset', duration: Number(v) });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Duration" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Month</SelectItem>
                      <SelectItem value="3">3 Months</SelectItem>
                      <SelectItem value="6">6 Months (5% off)</SelectItem>
                      <SelectItem value="12">12 Months (10% off)</SelectItem>
                      <SelectItem value="custom">Custom (date range)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.durationMode === 'custom' && (
                  <>
                    <div>
                      <Label>Start Date</Label>
                      <Input type="date" value={formData.customStart} onChange={e => setFormData({ ...formData, customStart: e.target.value })} />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input type="date" value={formData.customEnd} onChange={e => setFormData({ ...formData, customEnd: e.target.value })} />
                      <p className="mt-1 text-xs text-slate-400">≈ {effectiveMonths} month(s) billed</p>
                    </div>
                  </>
                )}

                <div className="col-span-2 mt-2 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-800">Server Configuration</div>
                <div>
                  <Label>OS Type</Label>
                  <Select
                    value={formData.osType}
                    onValueChange={handleHostingOsType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select OS" />
                    </SelectTrigger>
                    <SelectContent>
                      {osTypeOptions.map((osType) => (
                        <SelectItem key={osType} value={osType}>
                          {osType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>OS System</Label>
                  <Select
                    value={formData.os}
                    onValueChange={(value) => setFormData({ ...formData, os: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select OS" />
                    </SelectTrigger>
                    <SelectContent>
                      {osOptions.map((os) => (
                        <SelectItem key={os.value} value={os.value}>
                          {os.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.planType === 'dedicated' && (
                  <div>
                    <Label>Management</Label>
                    <Select
                      value={formData.management}
                      onValueChange={(value) => setFormData({ ...formData, management: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select management" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unmanaged">Unmanaged</SelectItem>
                        <SelectItem value="managed">Managed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>RAM</Label>
                  <Input value={formData.ram} onChange={e => setFormData({ ...formData, ram: e.target.value })} placeholder="e.g., 8GB" />
                </div>
                <div>
                  <Label>Storage</Label>
                  <Input value={formData.storage} onChange={e => setFormData({ ...formData, storage: e.target.value })} placeholder="e.g., 256GB SSD" />
                </div>
                <div>
                  <Label>CPU</Label>
                  <Input value={formData.cpu} onChange={e => setFormData({ ...formData, cpu: e.target.value })} placeholder="e.g., 4 vCPU" />
                </div>
                <div>
                  <Label>Bandwidth</Label>
                  <Input value={formData.bandwidth} onChange={e => setFormData({ ...formData, bandwidth: e.target.value })} placeholder="e.g., 1TB" />
                </div>
                <div>
                  <Label>IP Address</Label>
                  <Input value={formData.ip} onChange={e => setFormData({ ...formData, ip: e.target.value })} placeholder="e.g., 192.168.1.100" />
                </div>
                <div>
                  <Label>User Name</Label>
                  <Input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="e.g., username" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="e.g., Hello@123" />
                </div>

                <div className="col-span-2 mt-2 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-800">Pricing (auto-calculated, editable)</div>
                <div>
                  <Label>Base Price ({curSym(formData.location)} per month)</Label>
                  <Input
                    type="number"
                    value={formData.basePrice === 0 ? '' : formData.basePrice}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({ ...formData, basePrice: val === '' ? 0 : safeParseFloat(val) });
                    }}
                    placeholder="Auto-filled from plan / pool"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    {formData.location === 'us'
                      ? `Converted from India price at live rate ($1 = ₹${usdRate}). Editable.`
                      : 'Auto-fills on selection; GST & Total recalc automatically.'}
                  </p>
                </div>
                <div>
                  <Label>GST Amount ({curSym(formData.location)}, editable)</Label>
                  <Input
                    type="number"
                    value={formData.gstAmount === 0 ? '' : formData.gstAmount}
                    onChange={e => setFormData({ ...formData, gstAmount: e.target.value === '' ? 0 : safeParseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Total Price ({curSym(formData.location)}, editable)</Label>
                  <Input
                    type="number"
                    value={formData.totalPrice === 0 ? '' : formData.totalPrice}
                    onChange={e => setFormData({ ...formData, totalPrice: e.target.value === '' ? 0 : safeParseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>

                <div className="col-span-2 mt-2 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-800">Status</div>
                <div>
                  <Label>Order Status</Label>
                  <Select value={formData.orderStatus} onValueChange={value => setFormData({ ...formData, orderStatus: value })}>
                    <SelectTrigger><SelectValue placeholder="Select status"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Payment Status</Label>
                  <Select value={formData.paymentStatus} onValueChange={value => setFormData({ ...formData, paymentStatus: value })}>
                    <SelectTrigger><SelectValue placeholder="Select payment status"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancel">Cancel</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Delivery Status</Label>
                  <Select value={formData.deliveryStatus} onValueChange={value => setFormData({ ...formData, deliveryStatus: value })}>
                    <SelectTrigger><SelectValue placeholder="Select delivery status"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancel">Cancel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price summary */}
              {(() => {
                const cur = formData.location === 'us' ? '$' : '₹';
                const months = effectiveMonths;
                const unit = Number(formData.basePrice) || 0;
                const qty = Number(formData.quantity) || 1;
                const disc = formData.durationMode === 'custom' ? 0 : (months >= 12 ? 10 : months >= 6 ? 5 : 0);
                const subtotal = unit * qty * months;
                const row = (label: string, value: string, strong = false) => (
                  <div className={`flex items-center justify-between ${strong ? 'text-base font-bold text-slate-900' : 'text-sm text-slate-600'}`}>
                    <span>{label}</span>
                    <span className="tabular-nums">{value}</span>
                  </div>
                );
                return (
                  <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    {row('Unit price (per month)', `${cur}${unit.toLocaleString('en-IN')}`)}
                    {row('Quantity', `${qty}`)}
                    {row('Duration', `${months} month${months > 1 ? 's' : ''}`)}
                    <div className="border-t border-slate-200" />
                    {row('Subtotal', `${cur}${subtotal.toLocaleString('en-IN')}`)}
                    {disc > 0 && (
                      <div className="flex items-center justify-between text-sm text-emerald-600">
                        <span>Duration discount</span>
                        <span className="tabular-nums">-{disc}%</span>
                      </div>
                    )}
                    {row('GST (18%)', `${cur}${Number(formData.gstAmount || 0).toLocaleString('en-IN')}`)}
                    <div className="border-t border-slate-200 pt-1.5">
                      {row('Total', `${cur}${Number(formData.totalPrice || 0).toLocaleString('en-IN')}`, true)}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {modalType === 'renew' && selectedOrder && (() => {
            const cur = computeOrderDates(selectedOrder);
            const newExpiry = cur.expiry ? new Date(cur.expiry) : null;
            if (newExpiry) newExpiry.setMonth(newExpiry.getMonth() + renewMonths);
            return (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-slate-200 p-3 text-sm">
                  <div className="font-medium text-slate-900">{selectedOrder.planName || '—'}</div>
                  <div className="text-xs text-slate-500">{selectedOrder.userId?.name} · #{String(selectedOrder._id).slice(-8)}</div>
                </div>
                <div>
                  <Label>Extend by</Label>
                  <Select value={String(renewMonths)} onValueChange={(v) => setRenewMonths(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Month</SelectItem>
                      <SelectItem value="3">3 Months</SelectItem>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3 text-center">
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">Created</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-800">{fmtDateTime(selectedOrder.createdAt)}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 text-center">
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">Current expiry</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-700">{fmtDate(cur.expiry)}</div>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                    <div className="text-[11px] uppercase tracking-wide text-emerald-600">New expiry</div>
                    <div className="mt-0.5 text-sm font-semibold text-emerald-700">{fmtDate(newExpiry)}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-400">Created date stays the same; only renew &amp; expiry dates move forward.</p>
              </div>
            );
          })()}

          {modalType === 'delete' && selectedOrder && (
            <div className="text-center py-4">
              <p>This action cannot be undone. This will permanently delete the order:</p>
              <p className="font-semibold mt-2">{selectedOrder._id} - {selectedOrder.planName || 'No Plan'}</p>
            </div>
          )}

          <SheetFooter className="mt-6 gap-2 border-t pt-4">
            {modalType === 'view' && <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={handleCloseModal}>Close</Button>}
            {(modalType === 'add' || modalType === 'edit') && (
              <>
                <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={handleSubmit}>{modalType === 'add' ? 'Create Order' : 'Update Order'}</Button>
              </>
            )}
            {modalType === 'renew' && (
              <>
                <Button variant="outline" onClick={handleCloseModal} disabled={renewing}>Cancel</Button>
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleRenew} disabled={renewing}>
                  {renewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Renew Order
                </Button>
              </>
            )}
            {modalType === 'delete' && (
              <>
                <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete Order</Button>
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default OrdersPage;