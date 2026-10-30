import { Product, Category, Promotion, Testimonial, WebsiteSettings, Order, AdminUser, Customer } from '../types';

const API_BASE = '/api';

export function getAdminToken(): string | null {
  return localStorage.getItem('dessert_admin_token');
}

export function setAdminToken(token: string): void {
  localStorage.setItem('dessert_admin_token', token);
}

export function removeAdminToken(): void {
  localStorage.removeItem('dessert_admin_token');
}

async function fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Permintaan gagal dengan status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Website Settings
  getSettings: () => fetchJSON<{ settings: WebsiteSettings }>('/settings'),
  updateSettings: (data: Partial<WebsiteSettings>) => fetchJSON<{ message: string; settings: WebsiteSettings }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Categories
  getCategories: () => fetchJSON<{ categories: Category[] }>('/categories'),
  createCategory: (data: Partial<Category>) => fetchJSON<{ message: string; category: Category }>('/categories', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateCategory: (id: number, data: Partial<Category>) => fetchJSON<{ message: string; category: Category }>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteCategory: (id: number) => fetchJSON<{ message: string }>(`/categories/${id}`, {
    method: 'DELETE'
  }),

  // Products
  getProducts: (params?: { category?: string; search?: string; sort?: string; bestSeller?: boolean; all?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    if (params?.sort) q.set('sort', params.sort);
    if (params?.bestSeller) q.set('bestSeller', 'true');
    if (params?.all) q.set('all', 'true');
    return fetchJSON<{ products: Product[] }>(`/products?${q.toString()}`);
  },
  getProductById: (id: number | string) => fetchJSON<{ product: Product; related: Product[] }>(`/products/${id}`),
  createProduct: (data: Partial<Product>) => fetchJSON<{ message: string; product: Product }>('/products', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateProduct: (id: number, data: Partial<Product>) => fetchJSON<{ message: string; product: Product }>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteProduct: (id: number) => fetchJSON<{ message: string }>(`/products/${id}`, {
    method: 'DELETE'
  }),

  // Promotions
  getPromotions: (all = false) => fetchJSON<{ promotions: Promotion[] }>(`/promotions${all ? '?all=true' : ''}`),
  validatePromo: (code: string, subtotal: number) => fetchJSON<{ valid: boolean; promo: any }>('/promotions/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal })
  }),
  createPromotion: (data: Partial<Promotion>) => fetchJSON<{ message: string; promotion: Promotion }>('/promotions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updatePromotion: (id: number, data: Partial<Promotion>) => fetchJSON<{ message: string; promotion: Promotion }>(`/promotions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deletePromotion: (id: number) => fetchJSON<{ message: string }>(`/promotions/${id}`, {
    method: 'DELETE'
  }),

  // Testimonials
  getTestimonials: (all = false) => fetchJSON<{ testimonials: Testimonial[] }>(`/testimonials${all ? '?all=true' : ''}`),
  createTestimonial: (data: Partial<Testimonial>) => fetchJSON<{ message: string; testimonial: Testimonial }>('/testimonials', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateTestimonial: (id: number, data: Partial<Testimonial>) => fetchJSON<{ message: string; testimonial: Testimonial }>(`/testimonials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteTestimonial: (id: number) => fetchJSON<{ message: string }>(`/testimonials/${id}`, {
    method: 'DELETE'
  }),

  // Orders
  getOrders: (params?: { status?: string; search?: string; phone?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.phone) q.set('phone', params.phone);
    return fetchJSON<{ orders: Order[] }>(`/orders?${q.toString()}`);
  },
  getOrderById: (id: number | string) => fetchJSON<{ order: Order }>(`/orders/${id}`),
  createOrder: (orderData: any) => fetchJSON<{ message: string; order: Order }>('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  }),
  updateOrderStatus: (id: number, status: string) => fetchJSON<{ message: string; order: Order }>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Customers
  getCustomers: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetchJSON<{ customers: Customer[] }>(`/customers${q}`);
  },

  // Admin Auth & Stats
  adminLogin: (credentials: { username: string; password: string }) => fetchJSON<{ message: string; token: string; admin: AdminUser }>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  getAdminMe: () => fetchJSON<{ admin: AdminUser }>('/auth/admin/me'),
  updateAdminProfile: (data: any) => fetchJSON<{ message: string; admin: AdminUser }>('/auth/admin/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  getAdminList: () => fetchJSON<{ admins: AdminUser[] }>('/admin/admins'),
  createAdmin: (data: any) => fetchJSON<{ message: string; admin: AdminUser }>('/admin/admins', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteAdmin: (id: number) => fetchJSON<{ message: string }>(`/admin/admins/${id}`, {
    method: 'DELETE'
  }),
  getAdminStats: () => fetchJSON<any>('/admin/stats'),

  // Upload image
  uploadImage: (imageBase64: string, filename?: string) => fetchJSON<{ url: string }>('/upload', {
    method: 'POST',
    body: JSON.stringify({ imageBase64, filename })
  })
};
