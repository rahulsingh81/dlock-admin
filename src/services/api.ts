import axios from 'axios';
import { useAuthStore } from "../store/auth-store";
import { 
  User, Order, Plan, 
  ApiResponse, PaginatedResponse, PaginationParams,
  UserFormData, OrderFormData, PlanFormData,
  // IP Pool Types
  IPPool, 
  IPPoolFormData, 
  IPSpecs, 
  IPAvailability, 
  IPPricing,
  IPPoolsResponse
  
} from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://dlockservices.com/api';

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to handle responses
async function handle(p: Promise<any>) {
  try {
    const res = await p;
    return res.data;
  } catch (err: any) {
    const message = err?.response?.data?.message || err.message || 'API Error';
    throw new Error(message);
  }
}

// ==================== AUTH ====================
export const login = async (email: string, password: string) => {
  const data = await handle(client.post("/auth/login", { email, password }));
  if (data.token) localStorage.setItem("token", data.token);
  return data;
};

export const adminLogin = async (email: string, password: string) => {
  const data = await handle(client.post('/admin/auth/login', { email, password }));
  if (data.token) {
    localStorage.setItem("token", data.token);
  }
  return data;
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const register = async (payload: { name: string, email: string, password: string }) => {
  return handle(client.post('/auth/register', payload));
};

export const verifyEmail = async (email: string, code: string) => {
  return handle(client.post('/auth/verify-email', { email, code }));
};

// ==================== USERS ====================
export const getUsers = async (params?: any) => {
  return handle(client.get('/admin/users', { params }));
};

export const getUser = async (id: string) => handle(client.get(`/admin/users/${id}`));
export const createUser = async (data: UserFormData) => handle(client.post('/admin/users', data));
export const updateUser = async (id: string, data: Partial<UserFormData>) => handle(client.put(`/admin/users/${id}`, data));
export const deleteUser = async (id: string) => handle(client.delete(`/admin/users/${id}`));

// ==================== PLANS ====================
export const getPlans = async (params?: any) => {
  return handle(client.get('/admin/plans', { params }));
};
export const getPlan = async (id: string) => handle(client.get(`/admin/plans/${id}`));
export const getActivePlans = async () => handle(client.get('/admin/plans?active=true'));
export const createPlan = async (data: PlanFormData) => handle(client.post('/admin/plans', data));
export const updatePlan = async (id: string, data: Partial<PlanFormData>) => handle(client.put(`/admin/plans/${id}`, data));
export const deletePlan = async (id: string) => handle(client.delete(`/admin/plans/${id}`));

// ==================== ORDERS ====================
export const getOrders = async () => handle(client.get('/admin/orders'));
export const getOrder = async (id: string) => handle(client.get(`/admin/orders/${id}`));
export const createOrder = async (data: OrderFormData) => handle(client.post('/admin/orders', data));
export const updateOrder = async (id: string, data: Partial<OrderFormData>) => handle(client.put(`/admin/orders/${id}`, data));
export const deleteOrder = async (id: string) => handle(client.delete(`/admin/orders/${id}`));

// ==================== TICKETS ====================
export interface TicketFormData {
  title: string;
  description: string;
  customer_name: string;
  customer_email: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  _uid?: string;
}

export interface ReplyFormData {
  message: string;
}

export const fetchTickets = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
}) => {
  return handle(client.get('/admin/ticket', { params }));
};

export const fetchTicketStats = async () => {
  return handle(client.get('/admin/ticket/stats'));
};

export const fetchSingleTicket = async (id: string) => {
  return handle(client.get(`/admin/ticket/${id}`));
};

export const createNewTicket = async (data: TicketFormData) => {
  return handle(client.post('/admin/ticket', data));
};

export const updateExistingTicket = async (id: string, data: Partial<TicketFormData>) => {
  return handle(client.put(`/admin/ticket/${id}`, data));
};

export const removeTicket = async (id: string) => {
  return handle(client.delete(`/admin/ticket/${id}`));
};

export const addReplyToTicket = async (id: string, data: ReplyFormData) => {
  return handle(client.post(`/admin/ticket/${id}/reply`, data));
};

export const changeTicketStatus = async (id: string, status: string) => {
  return handle(client.patch(`/admin/ticket/${id}/status`, { status }));
};

export const sendEmail = async (id: string) => handle(client.post(`/admin/email/${id}`));

// ==================== IP POOLS ====================
export const getIPPools = async (params?: any) => {
    console.log('Calling:', '/ip-pool/ip-pools', params);
  return handle(client.get('/ip-pool/ip-pools', { params }));
};

export const getIPPool = async (id: string) => {
  return handle(client.get(`/ip-pool/ip-pools/${id}`));
};

export const createIPPool = async (data: IPPoolFormData) => {
  return handle(client.post('/ip-pool/ip-pools', data));
};

export const updateIPPool = async (id: string, data: Partial<IPPoolFormData>) => {
  return handle(client.put(`/ip-pool/ip-pools/${id}`, data));
};

export const deleteIPPool = async (id: string) => {
  return handle(client.delete(`/ip-pool/ip-pools/${id}`));
};


// ==================== DEFAULT EXPORT ====================
export default client;