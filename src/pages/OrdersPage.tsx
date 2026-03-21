import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Mail
} from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { getOrders, createOrder, updateOrder, deleteOrder, getUsers, getActivePlans ,sendEmail} from '@/services/api';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalType, setModalType] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    planId: '',
    planName: '',
    planType: 'vps',
    ram: '',
    storage: '',
    cpu: '',
    ip: '',
    osType :'',
    os:'',
    username: '',
    password: '',
    bandwidth: '',
    basePrice: 0,
    gstAmount: 0,
    totalPrice: 0,
    orderStatus: 'active',
    paymentStatus: 'unpaid',
    deliveryStatus: 'processing',
  });

  const { toast } = useToast();

  const stats = {
    totalOrders: orders.length,
    activeOrders: orders.filter(o => o.orderStatus === 'active').length,
    pendingOrders: orders.filter(o => o.orderStatus === 'pending').length,
    completedOrders: orders.filter(o => o.orderStatus === 'completed').length,
    vpsOrders: orders.filter(o => o.planType === 'vps').length,
    cloudOrders: orders.filter(o => o.planType === 'cloud').length,
    dedicatedOrders: orders.filter(o => o.planType === 'dedicated').length,
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders();
      if (response) {
        setOrders(response.items);
        setTotalPages(response.totalPages);
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

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, []);

  const handleOpenModal = (type, order = null ) => {
    setModalType(type);
    setSelectedOrder(order || null);
    if (type === 'add') {
      setFormData({
        customerId: '',
        planId: '',
        planName: '',
        planType: 'vps',
        ram: '',
        storage: '',
        cpu: '',
        ip: '',
        osType :'',
        os:'',
        username: '',
        password: '',
        bandwidth: '',
        basePrice: 0,
        gstAmount: 0,
        totalPrice: 0,
        orderStatus: 'active',
        paymentStatus: 'unpaid',
        deliveryStatus: 'processing',
      });
    } else if (type === 'edit' && order) {
      setFormData({
        customerId: order.userId._id,
        planId: order.planId_id,
        planName: order.planName,
        planType: order.planType,
        ram: order.ram,
        storage: order.storage,
        cpu: order.cpu,
        ip: order.ip,
        osType : order.osType,
        os: order.os,
        username: order.username,
        password: order.password,
        bandwidth: order.bandwidth,
        basePrice: order.basePrice,
        gstAmount: order.gstAmount,
        totalPrice: order.totalPrice,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        deliveryStatus: order.deliveryStatus || 'processing',
      });
    }
  };

  const osOptions = [
  "Ubuntu 20 64",
  "Ubuntu 22 64",
  "Ubuntu 24 64",
  "Debian 11 64",
  "Debian 12 64",
  "CentOS 7 64",
  "CentOS 8 64",
  "Alma 8 64",
  "Alma 9 64",
  "Rocky 9 64",
  "Windows 2012 64",
  "Windows 2016 64",
  "Windows 2019 64",
  "Windows 2022 64",
  "Windows 10 Pro",
  "Windows 11 Pro",
];
const osTypeOptions = [
  "linux",
  "window"
]
  const handleCloseModal = () => {
    setModalType(null);
    setSelectedOrder(null);
    setFormData({
      customerId: '',
      planId: '',
      planName: '',
      planType: 'vps',
      ram: '',
      storage: '',
      cpu: '',
      ip: '',
      osType : '',
      os:'',
      username: '',
      password: '',
      bandwidth: '',
      basePrice: 0,
      gstAmount: 0,
      totalPrice: 0,
      orderStatus: 'active',
      paymentStatus: 'unpaid',
      deliveryStatus: 'processing',
    });
  };

  const handleSubmit = async () => {
    try {
      if (modalType === 'add') {
        const response = await createOrder(formData as any);
        if (response) {
          toast({ title: "Success", description: "Order created successfully" });
          fetchOrders();
          handleCloseModal();
        }
      } else if (modalType === 'edit' && selectedOrder) {
        const response = await updateOrder(selectedOrder._id, formData as any);
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

  const handleUserSelect = (userId) => {
    const user = users.find(u => u._id === userId);
    if (user) setFormData(prev => ({ ...prev, customerId: userId }));
  };

  const handlePlanSelect = (planId) => {
    const plan = plans.find(p => p._id === planId);
    if (plan) {
      setFormData(prev => ({
        ...prev,
        planId,
        planName: plan.name,
        planType: plan.type,
        ram: plan.ram,
        storage: plan.storage,
        cpu: plan.cpu,
        basePrice: plan.price,
        osType: plan.systemType,
        bandwidth: plan.bandwidth || ''
      }));
    }
  };

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

  const handleDownloadInvoice = (type, order) => {
    window.open(`/api/invoice/download?orderId=${order._id}&type=${type}`, '_blank');
    toast({ title: "Download", description: `Download ${type} invoice for ${order._id}` });
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

  const userOptions = users.map(user => ({
    value: user._id,
    label: user.name,
    subtitle: user.email
  }));

  const planOptions = plans.map(plan => ({
    value: plan._id,
    label: plan.name,
    subtitle: `${plan.type.toUpperCase()} - $${plan.price}/month`
  }));

  // Safe parse float helper for inputs
  const safeParseFloat = (val) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600">Manage customer orders and server deployments</p>
        </div>
        <Button onClick={() => handleOpenModal('add')} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Order
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
  {/* Total Orders */}
  <Card className="bg-gray-50">
    <CardContent>
      <div className="font-bold text-gray-700">Total Orders</div>
      <div className="text-2xl font-extrabold text-gray-900">{orders.length}</div>
    </CardContent>
  </Card>
  {/* Active Orders */}
  <Card className="bg-green-50">
    <CardContent>
      <div className="font-bold text-green-700">Active Orders</div>
      <div className="text-2xl font-extrabold text-green-900">
        {orders.filter(o => o.orderStatus === "active").length}
      </div>
    </CardContent>
  </Card>
  {/* Inactive Orders */}
  <Card className="bg-gray-100">
    <CardContent>
      <div className="font-bold text-gray-700">Inactive Orders</div>
      <div className="text-2xl font-extrabold text-gray-900">
        {orders.filter(o => o.orderStatus === "inactive").length}
      </div>
    </CardContent>
  </Card>
  {/* Processing Orders */}
  <Card className="bg-yellow-50">
    <CardContent>
      <div className="font-bold text-yellow-700">Processing Orders</div>
      <div className="text-2xl font-extrabold text-yellow-900">
        {orders.filter(o => o.deliveryStatus === "processing").length}
      </div>
    </CardContent>
  </Card>
  {/* Delivered Orders */}
  <Card className="bg-green-50">
    <CardContent>
      <div className="font-bold text-green-700">Delivered Orders</div>
      <div className="text-2xl font-extrabold text-green-900">
        {orders.filter(o => o.deliveryStatus === "delivered").length}
      </div>
    </CardContent>
  </Card>
  {/* Cancelled Orders */}
  <Card className="bg-red-50">
    <CardContent>
      <div className="font-bold text-red-700">Cancelled Orders</div>
      <div className="text-2xl font-extrabold text-red-900">
        {orders.filter(o => o.deliveryStatus === "cancel").length}
      </div>
    </CardContent>
  </Card>
  {/* Paid Orders */}
  <Card className="bg-green-100">
    <CardContent>
      <div className="font-bold text-green-700">Paid Orders</div>
      <div className="text-2xl font-extrabold text-green-900">
        {orders.filter(o => o.paymentStatus === "paid").length}
      </div>
    </CardContent>
  </Card>
  {/* Unpaid Orders */}
  <Card className="bg-yellow-100">
    <CardContent>
      <div className="font-bold text-yellow-700">Unpaid Orders</div>
      <div className="text-2xl font-extrabold text-yellow-900">
        {orders.filter(o => o.paymentStatus === "unpaid").length}
      </div>
    </CardContent>
  </Card>
  {/* Refund Orders */}
  <Card className="bg-blue-100">
    <CardContent>
      <div className="font-bold text-blue-700">Refund Orders</div>
      <div className="text-2xl font-extrabold text-blue-900">
        {orders.filter(o => o.paymentStatus === "refund").length}
      </div>
    </CardContent>
  </Card>
  {/* VPS Orders */}
  <Card className="bg-purple-50">
    <CardContent>
      <div className="font-bold text-purple-700">VPS Orders</div>
      <div className="text-2xl font-extrabold text-purple-900">
        {orders.filter(o => o.planType === "vps").length}
      </div>
    </CardContent>
  </Card>
  {/* Cloud Orders */}
  <Card className="bg-blue-50">
    <CardContent>
      <div className="font-bold text-blue-700">Cloud Orders</div>
      <div className="text-2xl font-extrabold text-blue-900">
        {orders.filter(o => o.planType === "cloud").length}
      </div>
    </CardContent>
  </Card>
  {/* Dedicated Orders */}
  <Card className="bg-orange-50">
    <CardContent>
      <div className="font-bold text-orange-700">Dedicated Orders</div>
      <div className="text-2xl font-extrabold text-orange-900">
        {orders.filter(o => o.planType === "dedicated").length}
      </div>
    </CardContent>
  </Card>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {/* Add your stats cards here if needed */}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
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

      {/* Orders Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Specifications</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Plan Type</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Order Status</TableHead>
              <TableHead>Delivery Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={11}>
                    <div className="flex items-center space-x-4">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">No orders found</TableCell>
              </TableRow>
            ) : (
              orders.map(order => (
                <TableRow key={order._id}>
                  <TableCell>
                    <div className="font-medium">{order._id}</div>
                    <div className="text-sm text-gray-500">{order.ip}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{order.userId.name}</div>
                    <div className="text-sm text-gray-500">{order.userId.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{order.planName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div>RAM: {order.ram}</div>
                      <div>Storage: {order.storage}</div>
                      <div>CPU: {order.cpu}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">${order.totalPrice}</div>
                    <div className="text-xs text-gray-500">Base: ${order.basePrice} + GST: ${order.gstAmount}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(order.planType)}>{order.planType.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPaymentColor(order.paymentStatus)}>{order.paymentStatus.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.orderStatus)}>{order.orderStatus.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getDeliveryColor(order.deliveryStatus)}>{order.deliveryStatus.toUpperCase()}</Badge>
                  </TableCell>
                  {/* <TableCell>
                    <Badge className={order.invoiceStatus === "generated" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {order.invoiceStatus === "generated" ? "Generated" : "Not Generated"}
                    </Badge>
                  </TableCell> */}
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal('view', order)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal('edit', order)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal('delete', order)}><Trash2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleSendEmail(order)}><Mail className="h-4 w-4" />Email</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationComponent currentPage={currentPage} totalPages={totalPages} totalItems={orders.length} itemsPerPage={10} onPageChange={setCurrentPage} itemType="orders" />
      </Card>

      {/* Dialog Modal */}
      <Dialog open={modalType !== null} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {modalType === "view" && "Order Details"}
              {modalType === "add" && "Add New Order"}
              {modalType === "edit" && "Edit Order"}
              {modalType === "delete" && "Delete Order"}
            </DialogTitle>
            <DialogDescription>
              {modalType === "view" && "View order information and specifications"}
              {modalType === "add" && "Create a new order for a customer"}
              {modalType === "edit" && "Update order information"}
              {modalType === "delete" && "Are you sure you want to delete this order?"}
            </DialogDescription>
          </DialogHeader>

          {modalType === "view" && selectedOrder && (
            <>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Order Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-gray-600">Order ID:</span><span className="font-medium">{selectedOrder._id}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Plan:</span><span className="font-medium">{selectedOrder.planName}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Type:</span><Badge className={getTypeColor(selectedOrder.planType)}>{selectedOrder.planType.toUpperCase()}</Badge></div>
                      <div className="flex justify-between"><span className="text-gray-600">Order Status:</span><Badge className={getStatusColor(selectedOrder.orderStatus)}>{selectedOrder.orderStatus.toUpperCase()}</Badge></div>
                      <div className="flex justify-between"><span className="text-gray-600">Payment:</span><Badge className={getPaymentColor(selectedOrder.paymentStatus)}>{selectedOrder.paymentStatus.toUpperCase()}</Badge></div>
                      <div className="flex justify-between"><span className="text-gray-600">Delivery Status:</span><Badge className={getDeliveryColor(selectedOrder.deliveryStatus)}>{selectedOrder.deliveryStatus.toUpperCase()}</Badge></div>
                      <div className="flex justify-between"><span className="text-gray-600">Total Price:</span><span className="font-semibold">${selectedOrder.totalPrice}</span></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Customer</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-gray-600">Name:</span><span className="font-medium">{selectedOrder.userId.name}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Email:</span><span className="font-medium">{selectedOrder.userId.email}</span></div>
                    </div>
                  </div>
                </div>
                 <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                   <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Server Specifications</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between"><span className="text-gray-600">RAM:</span><span className="font-medium">{selectedOrder.ram}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Storage:</span><span className="font-medium">{selectedOrder.storage}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">CPU:</span><span className="font-medium">{selectedOrder.cpu}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Bandwidth:</span><span className="font-medium">{selectedOrder.bandwidth}</span></div>
                     <div className="flex justify-between"><span className="text-gray-600">Os System:</span><Badge className={selectedOrder.os}>{selectedOrder.os.toUpperCase()}</Badge></div>
                       <div className="flex justify-between"><span className="text-gray-600">Os Type:</span><Badge className={selectedOrder.osType}>{selectedOrder.osType.toUpperCase()}</Badge></div>
                  </div>
                </div>
                  </div>
                  <div className="space-y-4 grid grid-cols-2 gap-4">
                    <h4 className="font-semibold text-gray-900" >Server Details</h4>
                    <div className="space-y-2 ">
                      <div className="flex justify-between"><span className="text-gray-600">IP:</span><span className="font-medium font-mono">{selectedOrder.ip}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">User Name:</span><span className="font-medium font-mono">{selectedOrder.username}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Password:</span><span className="font-medium font-mono">{selectedOrder.password}</span></div>
                    </div>
                  </div>
                </div>
              
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex justify-between"><span>Created:</span><span>{new Date(selectedOrder.createdAt).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Updated:</span><span>{new Date(selectedOrder.updatedAt).toLocaleString()}</span></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-6">
                <Button variant="outline" onClick={() => handleDownloadInvoice('normal', selectedOrder)}>Download Normal Invoice</Button>
                <Button variant="outline" onClick={() => handleDownloadInvoice('ca', selectedOrder)}>Download CV Invoice</Button>
              </div>
            </>
          )}

          {(modalType === "add" || modalType === "edit") && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <SearchableSelect options={userOptions} value={formData.customerId} placeholder="Select customer..." onValueChange={handleUserSelect} searchPlaceholder="Search customers..." emptyMessage="No customers found" />
                                  </div>
                <div>
                  <Label>Plan</Label>
                  <SearchableSelect options={planOptions} value={formData.planId} placeholder="Select plan..." onValueChange={handlePlanSelect} searchPlaceholder="Search plans..." emptyMessage="No plans found" />
                </div>
                <div>
                  <Label>OS Type</Label>
                  <Select
                    value={formData.osType}
                    onValueChange={(value) => setFormData({ ...formData, osType: value })}
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
                        <SelectItem key={os} value={os}>
                          {os}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

                <div>
                  <Label>Base Price</Label>
                  <Input
                    type="number"
                    value={formData.basePrice === 0 ? '' : formData.basePrice}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({ ...formData, basePrice: val === '' ? 0 : safeParseFloat(val) });
                    }}
                    placeholder="0.00"
                  />
                </div>
                {/* <div>
                  <Label>GST Amount</Label>
                  <Input
                    type="number"
                    value={formData.gstAmount === 0 ? '' : formData.gstAmount}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({ ...formData, gstAmount: val === '' ? 0 : safeParseFloat(val) });
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Total Price</Label>
                  <Input
                    type="number"
                    value={formData.totalPrice === 0 ? '' : formData.totalPrice}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({ ...formData, totalPrice: val === '' ? 0 : safeParseFloat(val) });
                    }}
                    placeholder="0.00"
                  />
                </div> */}

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
            </div>
          )}

          {modalType === 'delete' && selectedOrder && (
            <div className="text-center py-4">
              <p>This action cannot be undone. This will permanently delete the order:</p>
              <p className="font-semibold mt-2">{selectedOrder._id} - {selectedOrder.planName}</p>
            </div>
          )}

          <DialogFooter>
            {modalType === 'view' && <Button onClick={handleCloseModal}>Close</Button>}
            {(modalType === 'add' || modalType === 'edit') && (
              <>
                <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button onClick={handleSubmit}>{modalType === 'add' ? 'Create Order' : 'Update Order'}</Button>
              </>
            )}
            {modalType === 'delete' && (
              <>
                <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete Order</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
