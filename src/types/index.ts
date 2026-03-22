export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  filter?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  role: string;
  status: 'active' | 'inactive';
  isEmailVerified: boolean;
  avatar?: string;
  ordersCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  role: string;
  status: 'active' | 'inactive';
   isEmailVerified?: boolean;
}

export type OSType = 'linux' | 'window' ;
export type OsSystem =
  | "Ubuntu 20 64"
  | "Ubuntu 22 64"
  | "Ubuntu 24 64"
  | "Debian 11 64"
  | "Debian 12 64"
  | "CentOS 7 64"
  | "CentOS 8 64"
  | "Alma 8 64"
  | "Alma 9 64"
  | "Rocky 9 64"
  | "Windows 2012 64"
  | "Windows 2016 64"
  | "Windows 2019 64"
  | "Windows 2022 64"
  | "Windows 10 Pro"
  | "Windows 11 Pro";
// types/index.ts or wherever your Plan type is defined

export interface Plan {
  _id: string;
  name: string;
  type: 'vps' | 'dedicated' | 'cloud' | 'forex';
  location: 'india' | 'us';
  windowsPrice: string;
  linuxPrice: string;
  systemType?: 'linux' | 'window'; // For compatibility with existing code
  specs: {
    cpu: string;
    ram: string;
    storage: string;
    bandwidth: string;
  };
  features: string[];
  popular: boolean;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanFormData {
  name: string;
  type: 'vps' | 'dedicated' | 'cloud' | 'forex';
  location: 'india' | 'us';
  windowsPrice: string;
  linuxPrice: string;
  systemType?: 'linux' | 'window';
  specs: {
    cpu: string;
    ram: string;
    storage: string;
    bandwidth: string;
  };
  features: string[];
  popular: boolean;
  status: 'active' | 'inactive';
}

// Order Types
export type OrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'active' 
  | 'completed' 
  | 'cancelled' 
  | 'inactive';

export type PlanType = 'vps' | 'cloud' | 'dedicated';


export type paymentStatus = 'unpaid' | 'paid' | 'cancel' | 'refund';

export interface Order {
  _id: string;
  customerId: string;
  customerName: string;
  planId: string;
  planName: string;
  planType: PlanType;
  ram: string;
  storage: string;   
  cpu: string;       
  ip: string;
  osType : OSType
  os: OsSystem;
  status: string;
  username : string;
  password : string;
  orderStatus: OrderStatus;
  bandwidth: string;
  paymentStatus: paymentStatus;
  basePrice: number;
  gstAmount: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  
}

// Dashboard Stats
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalOrders: number;
  vpsOrders: number;
  cloudOrders: number;
  dedicatedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  ordersThisMonth: number;
  usersThisMonth: number;
}

// Chart Data
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  users: number;
  orders: number;
  revenue: number;
}



export interface OrderFormData {
  customerId: string;
  planId: string;
  planName: string;
  planType: PlanType;
  ram: string;
  storage: string;  
  cpu: string;     
  ip: string;
  osType : OSType
  os: OsSystem;
  username : string;
  password : string;
  bandwidth: string;
  basePrice: number; 
  gstAmount: number;
  totalPrice: number;
  orderStatus: OrderStatus;
  paymentStatus: paymentStatus
}
// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  filter?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Modal Types
export type ModalType = 'view' | 'edit' | 'delete' | 'add' | null;

// Navigation
export interface NavItem {
  _id: string;
  label: string;
  icon: any;
  path: string;
  badge?: number;
}

export interface TicketFormData {
  title: string;
  description: string;
  customer_name: string;
  customer_email: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  attachments?: File[];
  _uid?: string;
}

export interface ReplyFormData {
  message: string;
  attachments?: File[];
  isInternal?: boolean;
}

// ... existing types ...

// ==================== IP POOL TYPES (Only once at the end) ====================

export interface IPSpecs {
  protection: string;
  virtualization:string;
  storageType:string;
  uptime:string
}

export interface IPAvailability {
  '4GB': boolean;
  '8GB': boolean;
  '16GB': boolean;
  '32GB': boolean;
}

export interface IPPricing {
  '4GB': number;
  '8GB': number;
  '16GB': number;
  '32GB': number;
}

export interface IPPool {
  _id: string;
  series: string;
  location: 'NOIDA' | 'MUMBAI' | 'DELHI' | 'NEW LAUNCH' | 'CHENNAI' | 'BANGALORE' | 'KOLKATA';
  plan: 'SILVER' | 'GOLD' | 'DIAMOND' | 'PLATINUM';
  status: 'available' | 'coming-soon' | 'maintenance' | 'out-of-stock';
  availability: IPAvailability;
  pricing: IPPricing;
  specs: IPSpecs;
  description: string;
  isActive: boolean;
  stock: number;
  tags: Array<'recommended' | 'new' | 'popular' | 'limited'>;
  createdAt: string;
  updatedAt: string;
}

export interface IPPoolFormData {
  series: string;
  location: string;
  plan: string;
  status: string;
  availability: IPAvailability;
  pricing: IPPricing;
  specs: IPSpecs;
  description: string;
  stock: number;
  tags: string[];
  isActive: boolean;
}

export interface IPPoolsResponse {
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