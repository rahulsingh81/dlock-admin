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

// Auto-logout on an expired/invalid session. The route guard only checks the
// persisted `isAuthenticated` flag, so a token that has expired server-side
// still shows the dashboard shell — until an API call comes back 401/403.
// When that happens, clear the session and bounce to the login page.
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      try { useAuthStore.getState().logout(); } catch { /* noop */ }
      // basename is /admin — send the admin to the login page (avoid a loop if already there)
      if (!window.location.pathname.endsWith('/admin/login')) {
        window.location.replace('/admin/login');
      }
    }
    return Promise.reject(err);
  }
);

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

// ==================== ADMIN 2FA (authenticator app) ====================
export const get2FAStatus = async () => handle(client.get('/admin/2fa/status'));
export const setup2FA = async () => handle(client.post('/admin/2fa/setup', {}));
export const enable2FA = async (otp: string) => handle(client.post('/admin/2fa/enable', { otp }));
export const disable2FA = async (password: string) => handle(client.post('/admin/2fa/disable', { password }));

export const changePassword = async (email: string, oldPassword: string, newPassword: string) => {
  return handle(client.post('/auth/user/change-password', { email, oldPassword, newPassword }));
};

export const register = async (payload: { name: string, email: string, password: string }) => {
  return handle(client.post('/auth/register', payload));
};

export const verifyEmail = async (email: string, code: string) => {
  return handle(client.post('/auth/verify-email', { email, code }));
};

// ==================== CONTENT PAGES ====================
export const getContentPages = async () => handle(client.get('/admin/content'));
export const updateContentPage = async (slug: string, data: { title: string; content: string }) =>
  handle(client.put(`/admin/content/${slug}`, data));

// ==================== COUPONS ====================
export const getCoupons = async (params?: any) => handle(client.get('/admin/coupons', { params }));
export const createCoupon = async (data: any) => handle(client.post('/admin/coupons', data));
export const updateCoupon = async (id: string, data: any) => handle(client.put(`/admin/coupons/${id}`, data));
export const deleteCoupon = async (id: string) => handle(client.delete(`/admin/coupons/${id}`));

// ==================== EXPORT (CSV / Excel) ====================
export const exportData = async (
  kind: 'orders' | 'transactions' | 'users',
  format: 'csv' | 'excel' = 'csv'
) => {
  const res = await client.get(`/admin/export/${kind}`, {
    params: { format },
    responseType: 'blob',
  });
  const blob = res.data as Blob;
  // Trigger a browser download
  const ext = format === 'excel' ? 'xls' : 'csv';
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${kind}-${new Date().toISOString().slice(0, 10)}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
  return blob;
};

// ==================== PORTFOLIO / DEVELOPMENT ====================
export const getPortfolios = async (params?: any) => handle(client.get('/admin/portfolio', { params }));
export const createPortfolio = async (data: any) => handle(client.post('/admin/portfolio', data));
export const updatePortfolio = async (id: string, data: any) => handle(client.put(`/admin/portfolio/${id}`, data));
export const deletePortfolio = async (id: string) => handle(client.delete(`/admin/portfolio/${id}`));

// ==================== CONTACT / ENQUIRIES ====================
export const getContacts = async (params?: any) => handle(client.get('/admin/contacts', { params }));
export const updateContactStatus = async (id: string, status: string) =>
  handle(client.patch(`/admin/contacts/${id}/status`, { status }));
export const replyContact = async (id: string, message: string) =>
  handle(client.post(`/admin/contacts/${id}/reply`, { message }));
export const deleteContact = async (id: string) => handle(client.delete(`/admin/contacts/${id}`));

// ==================== SITE SETTINGS ====================
export const getSiteSettings = async () => handle(client.get('/admin/settings'));
export const updateSiteSettings = async (data: any) => handle(client.put('/admin/settings', data));
export const testVirtualizor = async () => handle(client.post('/admin/settings/virtualizor/test'));

// ==================== NOTIFICATIONS ====================
export const getNotifications = async (filter = 'all', page = 1, limit = 50) =>
  handle(client.get('/admin/notifications', { params: { filter, page, limit } }));
export const markNotificationRead = async (id: string) => handle(client.patch(`/admin/notifications/${id}/read`));
export const markAllNotificationsRead = async () => handle(client.patch('/admin/notifications/read-all'));
export const deleteNotification = async (id: string) => handle(client.delete(`/admin/notifications/${id}`));
export const deleteAllNotifications = async () => handle(client.delete('/admin/notifications'));

// ==================== BROADCAST ====================
export const sendBroadcast = async (data: { subject: string; message: string; segment: string }) =>
  handle(client.post('/admin/broadcast', data));

// ==================== PAYMENTS / TRANSACTIONS ====================
export const getPaymentSettings = async () => handle(client.get('/admin/payment/settings'));
export const updatePaymentSettings = async (data: any) => handle(client.put('/admin/payment/settings', data));
export const testPhonePe = async () => handle(client.post('/admin/payment/phonepe/test', {}));
export const getTransactions = async (params?: any) => handle(client.get('/admin/transactions', { params }));
export const refundTransaction = async (id: string, amount?: number, note?: string) =>
  handle(client.post(`/admin/transactions/${id}/refund`, { amount, note }));
export const deleteTransaction = async (id: string) => handle(client.delete(`/admin/transactions/${id}`));

// Delete many rows by looping a single-delete fn; returns { ok, failed }.
export const bulkDelete = async (ids: string[], deleteOne: (id: string) => Promise<any>) => {
  const results = await Promise.allSettled(ids.map((id) => deleteOne(id)));
  const ok = results.filter((r) => r.status === 'fulfilled').length;
  return { ok, failed: results.length - ok };
};

// ==================== COUPONS ====================
export const getCouponAnalytics = async () => handle(client.get('/admin/coupons/analytics'));

// ==================== CA REPORT ====================
export const getCaReport = async (month: string, status: string, from?: string, to?: string) =>
  handle(client.get('/admin/orders/ca-report', { params: { month, status, from, to } }));

// ==================== DATABASE BACKUP ====================
export const getBackupStats = async () => handle(client.get('/admin/backup/stats'));
export const downloadDbBackup = async () => client.get('/admin/backup/download', { responseType: 'blob' });

// ==================== DASHBOARDS / REPORTS / CAMPAIGNS ====================
export const getAttention = async () => handle(client.get('/admin/attention'));
export const getRenewalsOverview = async () => handle(client.get('/admin/renewals-overview'));
export const getReports = async (from?: string, to?: string) => handle(client.get('/admin/reports', { params: { from, to } }));
export const sendCampaign = async (data: { subject: string; message: string; recipients: string; userIds?: string[] }) =>
  handle(client.post('/admin/campaign', data));

// ==================== UPLOAD ====================
export const uploadImage = async (dataUrl: string, filename: string) =>
  handle(client.post('/admin/upload', { dataUrl, filename }));

// ==================== BLOGS ====================
export const getBlogs = async (params?: any) => handle(client.get('/admin/blogs', { params }));
export const getBlog = async (id: string) => handle(client.get(`/admin/blogs/${id}`));
export const createBlog = async (data: any) => handle(client.post('/admin/blogs', data));
export const updateBlog = async (id: string, data: any) => handle(client.put(`/admin/blogs/${id}`, data));
export const deleteBlog = async (id: string) => handle(client.delete(`/admin/blogs/${id}`));

// ==================== FX (live USD↔INR rate) ====================
export const getFxRate = async (): Promise<{ usdInr: number; updatedAt: number; source: string }> =>
  handle(client.get('/fx'));

// ==================== DASHBOARD ====================
export const getDashboardStats = async (year?: number) => {
  return handle(client.get('/admin/dashboard', { params: year ? { year } : {} }));
};

// ==================== USERS ====================
export const getUsers = async (params?: any) => {
  return handle(client.get('/admin/users', { params }));
};

export const getUser = async (id: string) => handle(client.get(`/admin/users/${id}`));
export const impersonateUser = async (id: string) => handle(client.post(`/admin/users/${id}/impersonate`));
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
export const getOrders = async (params?: any) => handle(client.get('/admin/orders', { params }));
export const getOrder = async (id: string) => handle(client.get(`/admin/orders/${id}`));
export const createOrder = async (data: OrderFormData) => handle(client.post('/admin/orders', data));
export const updateOrder = async (id: string, data: Partial<OrderFormData>) => handle(client.put(`/admin/orders/${id}`, data));
export const deleteOrder = async (id: string) => handle(client.delete(`/admin/orders/${id}`));
export const renewOrder = async (id: string, months: number) => handle(client.post(`/admin/orders/${id}/renew`, { months }));

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
// ==================== DEVELOPER API KEYS ====================
export const listApiKeys = async () => handle(client.get('/admin/api-keys'));
export const createApiKey = async (name: string, allowedDomains?: string[], allowedIps?: string[]) =>
  handle(client.post('/admin/api-keys', { name, allowedDomains, allowedIps }));
export const revokeApiKey = async (id: string) => handle(client.delete(`/admin/api-keys/${id}`));
export const deleteApiKey = async (id: string) => handle(client.delete(`/admin/api-keys/${id}/permanent`));
export const updateKeyDomains = async (id: string, payload: { blockedDomains?: string[]; allowedDomains?: string[]; allowedIps?: string[] }) =>
  handle(client.patch(`/admin/api-keys/${id}/domains`, payload));

export default client;