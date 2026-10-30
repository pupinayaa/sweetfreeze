export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
  created_at?: string;
}

export interface Product {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount_price?: number | null;
  stock: number;
  image_url: string;
  images_json?: string; // stringified array of URLs
  is_best_seller: boolean | number;
  is_active: boolean | number;
  rating: number;
  reviews_count: number;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  total: number;
  image_url: string;
}

export type OrderStatus = 'Pending' | 'Diproses' | 'Sedang Dikirim' | 'Selesai' | 'Dibatalkan';

export interface Order {
  id: number;
  order_number: string;
  user_id?: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_method: 'delivery' | 'pickup';
  delivery_address?: string;
  notes?: string;
  subtotal: number;
  discount_amount: number;
  coupon_code?: string;
  total: number;
  status: OrderStatus;
  payment_method: string;
  whatsapp_sent: boolean | number;
  created_at: string;
  items?: OrderItem[];
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  created_at?: string;
}

export interface Promotion {
  id: number;
  code: string;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  start_date: string;
  end_date: string;
  is_active: boolean | number;
  usage_count: number;
  banner_url?: string;
}

export interface Testimonial {
  id: number;
  customer_name: string;
  avatar_url?: string;
  rating: number;
  comment: string;
  is_visible: boolean | number;
  sort_order: number;
  created_at?: string;
}

export interface WebsiteSettings {
  id: number;
  store_name: string;
  store_tagline: string;
  logo_url: string;
  banner_title: string;
  banner_subtitle: string;
  banner_image_url: string;
  business_description: string;
  address: string;
  whatsapp_number: string;
  instagram: string;
  tiktok: string;
  operational_hours: string;
  theme_color: string;
  updated_at?: string;
}

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  role: 'superadmin' | 'admin' | 'staff';
  created_at?: string;
  last_login?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  created_at?: string;
}
