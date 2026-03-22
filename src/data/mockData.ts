import { User, Order, Plan, DashboardStats, TimeSeriesData, ChartData } from '@/types';

// Mock Users Data
export const mockUsers: User[] = [
  {
    _id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, New York, NY 10001',
    status: 'active',
     role: 'user', // Add this
    isEmailVerified: true, // Add this
    createdAt: '2024-01-15T10:30:00Z',
    ordersCount: 12,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
  },
  {
    _id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com', 
    phone: '+1 (555) 987-6543',
    address: '456 Oak Ave, Los Angeles, CA 90210',
    status: 'active',
     role: 'user', // Add this
    isEmailVerified: true, // Add this
    createdAt: '2024-01-20T14:20:00Z',
    ordersCount: 8,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b67a0c8d?w=400&h=400&fit=crop'
  },
  {
    _id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    phone: '+1 (555) 456-7890',
    address: '789 Pine Rd, Chicago, IL 60601',
     role: 'user', // Add this
    isEmailVerified: true, // Add this
    status: 'inactive',
    createdAt: '2024-02-01T09:15:00Z',
    ordersCount: 3,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  },
  {
    _id: '4',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    phone: '+1 (555) 234-5678',
    address: '321 Elm St, Houston, TX 77001',
    status: 'active',
     role: 'user', // Add this
    isEmailVerified: true, // Add this
    createdAt: '2024-02-10T16:45:00Z',
    ordersCount: 15,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
  },
  {
    _id: '5',
    name: 'Dav_id Brown',
    email: 'dav_id.brown@example.com',
    phone: '+1 (555) 345-6789',
    address: '654 Maple Dr, Phoenix, AZ 85001',
    status: 'active',
     role: 'user', // Add this
    isEmailVerified: true, // Add this
    createdAt: '2024-02-15T11:30:00Z',
    ordersCount: 7,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'
  },
  
 
];

// Mock Plans Data
// export const mockPlans: Plan[] = [
//   {
//     _id: 'PLAN-001',
//     name: 'Starter VPS',
//     type: 'vps',
//     ram: '4GB',
//     storage: '128GB SSD',
//     cpu: '2 vCPU',
//     bandwidth: '1TB/month',
//      systemType: 'linux', // Add this
//     price: 19.99,
//     features: ['99.9% Uptime', '24/7 Support', 'Free SSL', 'Daily Backups'],
//     status: 'active',
//     createdAt: '2024-01-01T00:00:00Z',
//     updatedAt: '2024-01-01T00:00:00Z'
//   },
//   {
//     _id: 'PLAN-002',
//     name: 'Premium VPS',
//     type: 'vps',
//     ram: '8GB',
//     storage: '256GB SSD',
//     cpu: '4 vCPU',
//     bandwidth: '2TB/month',
//      systemType: 'linux', // Add this
//     price: 29.99,
//     features: ['99.9% Uptime', '24/7 Support', 'Free SSL', 'Daily Backups', 'DDoS Protection'],
//     status: 'active',
//     createdAt: '2024-01-01T00:00:00Z',
//     updatedAt: '2024-01-01T00:00:00Z'
//   },
 
 
// ];

// Mock Orders Data
export const mockOrders: Order[] = [
    {
    _id: 'ORD-001',
    customerId: '1',
    customerName: 'John Doe',
    planId: 'PLAN-002',
    planName: 'Premium VPS',
    planType: 'vps',
    ram: '8GB',
    storage: '256GB SSD', // 'rom' ki jagah 'storage' use karo
    cpu: '4 vCPU', // 'core' ki jagah 'cpu' use karo
    ip: '192.168.1.100',
    osType: 'linux', // Add this
    os: 'Ubuntu 20 64', // Add this
    username: 'john_doe', // Add this
    password: 'password123', // Add this
    status: 'active', // ye rahega
    orderStatus: 'active', // Add this (same as status)
    bandwidth: '2TB/month', // Add this
    paymentStatus: 'paid', // Add this
    basePrice: 29.99, // Add this
    gstAmount: 5.40, // Add this (18% GST)
    totalPrice: 35.39, // Add this
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T12:00:00Z'
  },
  {
    _id: 'ORD-002',
    customerId: '2',
    customerName: 'Jane Smith',
    planId: 'PLAN-004',
    planName: 'Business Cloud',
    planType: 'cloud',
    ram: '16GB',
    storage: '512GB SSD',
    cpu: '8 vCPU',
    ip: '192.168.1.101',
    osType: 'linux',
    os: 'Ubuntu 22 64',
    username: 'jane_smith',
    password: 'password456',
    status: 'processing',
    orderStatus: 'processing',
    bandwidth: '5TB/month',
    paymentStatus: 'unpaid',
    basePrice: 59.99,
    gstAmount: 10.80,
    totalPrice: 70.79,
    createdAt: '2024-01-20T14:20:00Z',
    updatedAt: '2024-01-20T14:20:00Z'
  },
  {
    _id: 'ORD-003',
    customerId: '4',
    customerName: 'Sarah Wilson',
    planId: 'PLAN-007',
    planName: 'Enterprise Dedicated',
    planType: 'dedicated',
    ram: '64GB',
    storage: '2TB SSD',
    cpu: '16 CPU',
    ip: '192.168.1.102',
    osType: 'linux',
    os: 'CentOS 7 64',
    username: 'sarah_wilson',
    password: 'password789',
    status: 'pending',
    orderStatus: 'pending',
    bandwidth: 'Unlimited',
    paymentStatus: 'unpaid',
    basePrice: 199.99,
    gstAmount: 36.00,
    totalPrice: 235.99,
    createdAt: '2024-02-10T16:45:00Z',
    updatedAt: '2024-02-10T16:45:00Z'
  },
  {
    _id: 'ORD-004',
    customerId: '5',
    customerName: 'David Brown',
    planId: 'PLAN-001',
    planName: 'Starter VPS',
    planType: 'vps',
    ram: '4GB',
    storage: '128GB SSD',
    cpu: '2 vCPU',
    ip: '192.168.1.103',
    osType: 'linux',
    os: 'Debian 11 64',
    username: 'david_brown',
    password: 'passwordabc',
    status: 'completed',
    orderStatus: 'completed',
    bandwidth: '1TB/month',
    paymentStatus: 'paid',
    basePrice: 19.99,
    gstAmount: 3.60,
    totalPrice: 23.59,
    createdAt: '2024-02-15T11:30:00Z',
    updatedAt: '2024-02-15T13:00:00Z'
  },
  {
    _id: 'ORD-005',
    customerId: '1',
    customerName: 'John Doe',
    planId: 'PLAN-005',
    planName: 'Pro Cloud',
    planType: 'cloud',
    ram: '32GB',
    storage: '1TB SSD',
    cpu: '12 vCPU',
    ip: '192.168.1.104',
    osType: 'linux',
    os: 'Ubuntu 24 64',
    username: 'john_doe',
    password: 'password123',
    status: 'active',
    orderStatus: 'active',
    bandwidth: '10TB/month',
    paymentStatus: 'paid',
    basePrice: 99.99,
    gstAmount: 18.00,
    totalPrice: 117.99,
    createdAt: '2024-02-20T08:15:00Z',
    updatedAt: '2024-02-20T08:15:00Z'
  },
];



// Utility functions to simulate API calls
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateRandomIP = () => {
  return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

export const generateOrder_id = () => {
  return `ORD-${String(Math.floor(Math.random() * 9999)).padStart(3, '0')}`;
};

// Mock statistics for dashboard
export const mockStats = {
  totalUsers: 2847,
  totalOrders: 1923,
  totalRevenue: 89247,
  monthlyRevenue: 12894,
  activeUsers: 2543,
  inactiveUsers: 304,
  newUsers: 156,
  vpsOrders: 847,
  cloudOrders: 623,
  dedicatedOrders: 453,
  ordersThisMonth: 234,
  usersThisMonth: 156
};

// Mock chart data for dashboard
export const mockChartData = {
  userGrowth: [156, 203, 289, 334, 412, 498, 567, 623, 734, 821, 934, 1023],
  orderVolume: [89, 134, 178, 234, 289, 356, 423, 498, 567, 634, 723, 812],
  revenue: [4234, 5678, 6789, 7890, 8901, 9234, 10345, 11567, 12789, 13890, 14567, 15234],
  activeUsers: [1234, 1456, 1678, 1890, 2012, 2234, 2456, 2678, 2890, 3012, 3234, 3456]
};