import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';
const tokenKey = 'mart-management-token';

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(tokenKey);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type DashboardStats = {
  totalProducts: number;
  totalCategories: number;
  lowStockCount: number;
  todaySales: number;
  monthSales: number;
  todayPurchases: number;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  unit: string;
  categoryId: number;
  category?: { id: number; name: string };
  stockOnHand: number;
  reorderLevel: number;
  purchasePrice: number;
  sellingPrice: number;
  barcode?: string | null;
  vatPercent: number;
};

export type Category = {
  id: number;
  name: string;
  description?: string | null;
};

export type CategoryPayload = {
  id?: number;
  name: string;
  description?: string | null;
};

export type AuthUser = {
  id: string;
  userName: string;
  email: string;
  roles: string[];
  token?: string | null;
  fullName?: string | null;
};

export type Supplier = {
  id: number;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export type SupplierPayload = {
  id?: number;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export type CustomerRecord = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
};

export type CustomerPayload = {
  id?: number;
  name: string;
  phone?: string | null;
  email?: string | null;
};

export type ActivityLog = {
  id: number;
  action: string;
  entityName?: string | null;
  entityId?: string | null;
  performedByUserId?: string | null;
  createdAt: string;
  details?: string | null;
};

export type ProductPayload = {
  id?: number;
  sku: string;
  name: string;
  description?: string | null;
  unit: string;
  barcode?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  vatPercent: number;
  stockOnHand: number;
  reorderLevel: number;
  categoryId: number;
};

export type LoginPayload = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type OrderLineInput = {
  productId: number;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  vatPercent?: number;
};

export type SalesOrderPayload = {
  customerId: number;
  lines: OrderLineInput[];
};

export type PurchaseOrderPayload = {
  vendorId: number;
  lines: OrderLineInput[];
};

export async function getDashboardStats() {
  const { data } = await api.get<DashboardStats>('/reports/stock');
  return data;
}

export async function getProducts() {
  const { data } = await api.get<Product[]>('/products');
  return data;
}

export async function getLowStockProducts() {
  const { data } = await api.get<Product[]>('/products/low-stock');
  return data;
}

export async function getCategories() {
  const { data } = await api.get<Category[]>('/categories');
  return data;
}

export async function createCategory(payload: CategoryPayload) {
  const { data } = await api.post<Category>('/categories', payload);
  return data;
}

export async function updateCategory(id: number, payload: CategoryPayload) {
  const { data } = await api.put<Category>(`/categories/${id}`, { ...payload, id });
  return data;
}

export async function deleteCategory(id: number) {
  await api.delete(`/categories/${id}`);
}

export async function getCustomers() {
  const { data } = await api.get<Array<{ id: number; name: string; phone?: string | null; email?: string | null }>>('/referenceData/customers');
  return data;
}

export async function createCustomer(payload: CustomerPayload) {
  const { data } = await api.post<CustomerRecord>('/referenceData/customers', payload);
  return data;
}

export async function updateCustomer(id: number, payload: CustomerPayload) {
  const { data } = await api.put<CustomerRecord>(`/referenceData/customers/${id}`, { ...payload, id });
  return data;
}

export async function deleteCustomer(id: number) {
  await api.delete(`/referenceData/customers/${id}`);
}

export async function getVendors() {
  const { data } = await api.get<Supplier[]>('/referenceData/vendors');
  return data;
}

export async function createSupplier(payload: SupplierPayload) {
  const { data } = await api.post<Supplier>('/referenceData/vendors', payload);
  return data;
}

export async function updateSupplier(id: number, payload: SupplierPayload) {
  const { data } = await api.put<Supplier>(`/referenceData/vendors/${id}`, { ...payload, id });
  return data;
}

export async function deleteSupplier(id: number) {
  await api.delete(`/referenceData/vendors/${id}`);
}

export async function getActivityLogs() {
  const { data } = await api.get<ActivityLog[]>('/activitylogs');
  return data;
}

export async function getUsers() {
  const { data } = await api.get('/users');
  return data as Array<{ id: string; userName?: string; email?: string; fullName?: string; roles: string[]; isLocked?: boolean }>;
}

export async function updateUserRoles(userId: string, roles: string[]) {
  await api.put(`/users/${userId}/roles`, { roles });
}

export function setAuthToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(tokenKey);
    return;
  }

  localStorage.setItem(tokenKey, token);
}

export function clearAuthToken() {
  localStorage.removeItem(tokenKey);
}

export function getAuthToken() {
  return localStorage.getItem(tokenKey);
}

export async function createProduct(payload: ProductPayload) {
  const { data } = await api.post<Product>('/products', payload);
  return data;
}

export async function updateProduct(id: number, payload: ProductPayload) {
  const { data } = await api.put<Product>(`/products/${id}`, { ...payload, id });
  return data;
}

export async function deleteProduct(id: number) {
  await api.delete(`/products/${id}`);
}

export async function createSale(payload: SalesOrderPayload) {
  const { data } = await api.post('/orders/sale', payload);
  return data as any;
}

export async function createPurchase(payload: PurchaseOrderPayload) {
  const { data } = await api.post('/orders/purchase', payload);
  return data as any;
}

export async function getSales() {
  const { data } = await api.get('/orders/sales');
  return data as any[];
}

export async function getPurchases() {
  const { data } = await api.get('/orders/purchases');
  return data as any[];
}

export async function deleteSale(id: number) {
  await api.delete(`/orders/sale/${id}`);
}

export async function deletePurchase(id: number) {
  await api.delete(`/orders/purchase/${id}`);
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post<AuthUser>('/auth/login', payload);
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<AuthUser>('/auth/register', payload);
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function logout() {
  clearAuthToken();
  await api.post('/auth/logout');
}

export async function getCurrentUser() {
  const { data } = await api.get<AuthUser | null>('/auth/me');
  return data;
}

export async function getRecentStockMovements() {
  const { data } = await api.get('/stockmovement/recent?count=8');
  return data;
}

export async function getStockMovements() {
  const { data } = await api.get('/stockmovement');
  return data as any[];
}

export async function getReportsSummary() {
  const { data } = await api.get('/reports/summary');
  return data as any;
}

export default api;
