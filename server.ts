import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase, hashPassword, verifyPassword } from './server/db.ts';

// Initialize the database on startup
initDatabase();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Simple in-memory session tokens for admin
const adminSessions = new Map<string, { adminId: number; username: string; role: string; expiresAt: number }>();

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware to verify admin token
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak: Token autentikasi tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];
  const session = adminSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) adminSessions.delete(token);
    return res.status(401).json({ error: 'Sesi telah berakhir atau tidak valid. Silakan login kembali.' });
  }

  // Attach admin to request
  (req as any).admin = session;
  next();
}

// ========================
// 1. AUTH & ADMIN MANAGEMENT
// ========================

// Admin Login
app.post('/api/auth/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as any;
  if (!admin || !verifyPassword(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  // Update last login
  db.prepare('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(admin.id);

  const token = generateToken();
  const sessionData = {
    adminId: admin.id,
    username: admin.username,
    role: admin.role,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  adminSessions.set(token, sessionData);

  res.json({
    message: 'Login berhasil.',
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role
    }
  });
});

// Admin Me
app.get('/api/auth/admin/me', requireAdmin, (req: Request, res: Response) => {
  const session = (req as any).admin;
  const admin = db.prepare('SELECT id, username, name, role, created_at, last_login FROM admins WHERE id = ?').get(session.adminId) as any;
  if (!admin) {
    return res.status(404).json({ error: 'Admin tidak ditemukan.' });
  }
  res.json({ admin });
});

// Admin Update Profile (Self)
app.put('/api/auth/admin/profile', requireAdmin, (req: Request, res: Response) => {
  const session = (req as any).admin;
  const { username, name, currentPassword, newPassword } = req.body;

  const currentAdmin = db.prepare('SELECT * FROM admins WHERE id = ?').get(session.adminId) as any;
  if (!currentAdmin) return res.status(404).json({ error: 'Admin tidak ditemukan.' });

  if (newPassword) {
    if (!currentPassword || !verifyPassword(currentPassword, currentAdmin.password_hash)) {
      return res.status(400).json({ error: 'Password saat ini salah.' });
    }
    const newHash = hashPassword(newPassword);
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, session.adminId);
  }

  if (username && username !== currentAdmin.username) {
    const existing = db.prepare('SELECT id FROM admins WHERE username = ? AND id != ?').get(username, session.adminId);
    if (existing) {
      return res.status(400).json({ error: 'Username sudah digunakan oleh akun lain.' });
    }
    db.prepare('UPDATE admins SET username = ? WHERE id = ?').run(username, session.adminId);
    session.username = username;
  }

  if (name) {
    db.prepare('UPDATE admins SET name = ? WHERE id = ?').run(name, session.adminId);
  }

  const updated = db.prepare('SELECT id, username, name, role, created_at, last_login FROM admins WHERE id = ?').get(session.adminId);
  res.json({ message: 'Profil admin berhasil diperbarui.', admin: updated });
});

// Admin List All Admins (Superadmin only or Admin)
app.get('/api/admin/admins', requireAdmin, (_req: Request, res: Response) => {
  const admins = db.prepare('SELECT id, username, name, role, created_at, last_login FROM admins ORDER BY id ASC').all();
  res.json({ admins });
});

// Admin Create Admin
app.post('/api/admin/admins', requireAdmin, (req: Request, res: Response) => {
  const session = (req as any).admin;
  if (session.role !== 'superadmin') {
    return res.status(403).json({ error: 'Hanya Super Admin yang dapat membuat akun admin baru.' });
  }

  const { username, password, name, role } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, password, dan nama wajib diisi.' });
  }

  const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: 'Username sudah terdaftar.' });
  }

  const passHash = hashPassword(password);
  const result = db.prepare(`
    INSERT INTO admins (username, password_hash, name, role)
    VALUES (?, ?, ?, ?)
  `).run(username, passHash, name, role || 'admin');

  res.status(201).json({
    message: 'Admin berhasil ditambahkan.',
    admin: { id: Number(result.lastInsertRowid), username, name, role: role || 'admin' }
  });
});

// Admin Delete Admin
app.delete('/api/admin/admins/:id', requireAdmin, (req: Request, res: Response) => {
  const session = (req as any).admin;
  if (session.role !== 'superadmin') {
    return res.status(403).json({ error: 'Hanya Super Admin yang dapat menghapus akun admin.' });
  }

  const targetId = Number(req.params.id);
  if (targetId === session.adminId) {
    return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' });
  }

  db.prepare('DELETE FROM admins WHERE id = ?').run(targetId);
  res.json({ message: 'Akun admin berhasil dihapus.' });
});

// ========================
// 2. WEBSITE SETTINGS
// ========================

app.get('/api/settings', (_req: Request, res: Response) => {
  const settings = db.prepare('SELECT * FROM website_settings LIMIT 1').get();
  res.json({ settings });
});

app.put('/api/settings', requireAdmin, (req: Request, res: Response) => {
  const {
    store_name, store_tagline, logo_url, banner_title, banner_subtitle,
    banner_image_url, business_description, address, whatsapp_number,
    instagram, tiktok, operational_hours, theme_color
  } = req.body;

  const current = db.prepare('SELECT id FROM website_settings LIMIT 1').get() as any;

  if (current) {
    db.prepare(`
      UPDATE website_settings SET
        store_name = ?, store_tagline = ?, logo_url = ?, banner_title = ?,
        banner_subtitle = ?, banner_image_url = ?, business_description = ?,
        address = ?, whatsapp_number = ?, instagram = ?, tiktok = ?,
        operational_hours = ?, theme_color = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      store_name, store_tagline, logo_url, banner_title, banner_subtitle,
      banner_image_url, business_description, address, whatsapp_number,
      instagram, tiktok, operational_hours, theme_color, current.id
    );
  } else {
    db.prepare(`
      INSERT INTO website_settings (
        store_name, store_tagline, logo_url, banner_title, banner_subtitle,
        banner_image_url, business_description, address, whatsapp_number,
        instagram, tiktok, operational_hours, theme_color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      store_name, store_tagline, logo_url, banner_title, banner_subtitle,
      banner_image_url, business_description, address, whatsapp_number,
      instagram, tiktok, operational_hours, theme_color
    );
  }

  const updated = db.prepare('SELECT * FROM website_settings LIMIT 1').get();
  res.json({ message: 'Pengaturan website berhasil disimpan.', settings: updated });
});

// ========================
// 3. CATEGORIES
// ========================

app.get('/api/categories', (_req: Request, res: Response) => {
  const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.id ASC
  `).all();
  res.json({ categories });
});

app.post('/api/categories', requireAdmin, (req: Request, res: Response) => {
  const { name, slug, description, image_url, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama kategori wajib diisi.' });

  const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  try {
    const result = db.prepare(`
      INSERT INTO categories (name, slug, description, image_url, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, finalSlug, description || '', image_url || '', sort_order || 0);

    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json({ message: 'Kategori berhasil ditambahkan.', category: created });
  } catch (err: any) {
    res.status(400).json({ error: 'Gagal membuat kategori. Slug mungkin sudah digunakan.' });
  }
});

app.put('/api/categories/:id', requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, slug, description, image_url, sort_order } = req.body;

  try {
    db.prepare(`
      UPDATE categories SET
        name = ?, slug = ?, description = ?, image_url = ?, sort_order = ?
      WHERE id = ?
    `).run(name, slug, description, image_url, sort_order, id);

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.json({ message: 'Kategori berhasil diperbarui.', category: updated });
  } catch (err: any) {
    res.status(400).json({ error: 'Gagal memperbarui kategori.' });
  }
});

app.delete('/api/categories/:id', requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ message: 'Kategori berhasil dihapus.' });
});

// ========================
// 4. PRODUCTS
// ========================

app.get('/api/products', (req: Request, res: Response) => {
  const { category, search, sort, bestSeller, all } = req.query;
  
  let query = `
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // If not admin fetching all, only show active products
  if (all !== 'true') {
    query += ` AND p.is_active = 1`;
  }

  if (category && category !== 'all') {
    query += ` AND (c.slug = ? OR c.id = ?)`;
    params.push(category, category);
  }

  if (bestSeller === 'true' || bestSeller === '1') {
    query += ` AND p.is_best_seller = 1`;
  }

  if (search) {
    query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  // Sorting
  if (sort === 'price_asc') {
    query += ` ORDER BY COALESCE(p.discount_price, p.price) ASC`;
  } else if (sort === 'price_desc') {
    query += ` ORDER BY COALESCE(p.discount_price, p.price) DESC`;
  } else if (sort === 'newest') {
    query += ` ORDER BY p.created_at DESC`;
  } else if (sort === 'rating') {
    query += ` ORDER BY p.rating DESC, p.reviews_count DESC`;
  } else {
    // default
    query += ` ORDER BY p.is_best_seller DESC, p.id DESC`;
  }

  const products = db.prepare(query).all(...params);
  res.json({ products });
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  const idOrSlug = req.params.id;
  let product: any;

  if (isNaN(Number(idOrSlug))) {
    product = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ?
    `).get(idOrSlug);
  } else {
    product = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(Number(idOrSlug));
  }

  if (!product) {
    return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  }

  // Fetch related products in the same category
  const related = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
    ORDER BY p.is_best_seller DESC, RANDOM()
    LIMIT 4
  `).all(product.category_id, product.id);

  res.json({ product, related });
});

app.post('/api/products', requireAdmin, (req: Request, res: Response) => {
  const {
    category_id, name, slug, description, price, discount_price,
    stock, image_url, images_json, is_best_seller, is_active
  } = req.body;

  if (!category_id || !name || price === undefined) {
    return res.status(400).json({ error: 'Kategori, nama produk, dan harga wajib diisi.' });
  }

  const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  try {
    const result = db.prepare(`
      INSERT INTO products (
        category_id, name, slug, description, price, discount_price,
        stock, image_url, images_json, is_best_seller, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      Number(category_id),
      name,
      finalSlug,
      description || '',
      Number(price),
      discount_price ? Number(discount_price) : null,
      stock !== undefined ? Number(stock) : 50,
      image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
      images_json || '[]',
      is_best_seller ? 1 : 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    );

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json({ message: 'Produk berhasil ditambahkan.', product: created });
  } catch (err: any) {
    res.status(400).json({ error: 'Gagal menambahkan produk. Slug mungkin sudah digunakan.' });
  }
});

app.put('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const {
    category_id, name, slug, description, price, discount_price,
    stock, image_url, images_json, is_best_seller, is_active
  } = req.body;

  try {
    db.prepare(`
      UPDATE products SET
        category_id = ?, name = ?, slug = ?, description = ?, price = ?,
        discount_price = ?, stock = ?, image_url = ?, images_json = ?,
        is_best_seller = ?, is_active = ?
      WHERE id = ?
    `).run(
      Number(category_id),
      name,
      slug,
      description,
      Number(price),
      discount_price ? Number(discount_price) : null,
      Number(stock),
      image_url,
      images_json || '[]',
      is_best_seller ? 1 : 0,
      is_active ? 1 : 0,
      id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json({ message: 'Produk berhasil diperbarui.', product: updated });
  } catch (err: any) {
    res.status(400).json({ error: 'Gagal memperbarui produk.' });
  }
});

app.delete('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ message: 'Produk berhasil dihapus.' });
});

// ========================
// 5. PROMOTIONS & VOUCHERS
// ========================

app.get('/api/promotions', (req: Request, res: Response) => {
  const { all } = req.query;
  let query = 'SELECT * FROM promotions';
  if (all !== 'true') {
    query += " WHERE is_active = 1 AND date('now') BETWEEN start_date AND end_date";
  }
  query += ' ORDER BY id DESC';
  const promotions = db.prepare(query).all();
  res.json({ promotions });
});

app.post('/api/promotions/validate', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Kode voucher tidak boleh kosong.' });

  const promo = db.prepare(`
    SELECT * FROM promotions
    WHERE UPPER(code) = UPPER(?) AND is_active = 1
  `).get(code) as any;

  if (!promo) {
    return res.status(404).json({ error: 'Kode voucher tidak valid atau sudah tidak berlaku.' });
  }

  if (subtotal < promo.min_purchase) {
    return res.status(400).json({
      error: `Voucher ini membutuhkan minimal pembelian Rp ${promo.min_purchase.toLocaleString('id-ID')}.`
    });
  }

  let discountAmount = 0;
  if (promo.discount_type === 'percentage') {
    discountAmount = Math.round((subtotal * promo.discount_value) / 100);
  } else {
    discountAmount = promo.discount_value;
  }

  // Ensure discount does not exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  res.json({
    valid: true,
    promo: {
      code: promo.code,
      title: promo.title,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      discount_amount: discountAmount
    }
  });
});

app.post('/api/promotions', requireAdmin, (req: Request, res: Response) => {
  const { code, title, description, discount_type, discount_value, min_purchase, start_date, end_date, is_active, banner_url } = req.body;

  if (!code || !title || discount_value === undefined) {
    return res.status(400).json({ error: 'Kode, judul promo, dan nilai diskon wajib diisi.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO promotions (
        code, title, description, discount_type, discount_value, min_purchase,
        start_date, end_date, is_active, banner_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code.toUpperCase(),
      title,
      description || '',
      discount_type || 'percentage',
      Number(discount_value),
      Number(min_purchase || 0),
      start_date || new Date().toISOString().split('T')[0],
      end_date || '2030-12-31',
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      banner_url || ''
    );

    const created = db.prepare('SELECT * FROM promotions WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json({ message: 'Promo berhasil ditambahkan.', promotion: created });
  } catch (err: any) {
    res.status(400).json({ error: 'Kode promo sudah ada.' });
  }
});

app.put('/api/promotions/:id', requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { code, title, description, discount_type, discount_value, min_purchase, start_date, end_date, is_active, banner_url } = req.body;

  try {
    db.prepare(`
      UPDATE promotions SET
        code = ?, title = ?, description = ?, discount_type = ?, discount_value = ?,
        min_purchase = ?, start_date = ?, end_date = ?, is_active = ?, banner_url = ?
      WHERE id = ?
    `).run(
      code.toUpperCase(),
      title,
      description,
      discount_type,
      Number(discount_value),
      Number(min_purchase || 0),
      start_date,
      end_date,
      is_active ? 1 : 0,
      banner_url,
      id
    );

    const updated = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id);
    res.json({ message: 'Promo berhasil diperbarui.', promotion: updated });
  } catch (err: any) {
    res.status(400).json({ error: 'Gagal memperbarui promo.' });
  }
});

app.delete('/api/promotions/:id', requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM promotions WHERE id = ?').run(id);
  res.json({ message: 'Promo berhasil dihapus.' });
});

// ========================
// 6. TESTIMONIALS
// ========================

app.get('/api/testimonials', (req: Request, res: Response) => {
  const { all } = req.query;
  let query = 'SELECT * FROM testimonials';
  if (all !== 'true') {
    query += ' WHERE is_visible = 1';
  }
  query += ' ORDER BY sort_order ASC, id DESC';
  const testimonials = db.prepare(query).all();
  res.json({ testimonials });
});

app.post('/api/testimonials', (req: Request, res: Response) => {
  const { customer_name, avatar_url, rating, comment, is_visible, sort_order } = req.body;
  if (!customer_name || !comment) {
    return res.status(400).json({ error: 'Nama dan komentar testimoni wajib diisi.' });
  }

  const result = db.prepare(`
    INSERT INTO testimonials (customer_name, avatar_url, rating, comment, is_visible, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    customer_name,
    avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    Number(rating || 5),
    comment,
    is_visible !== undefined ? (is_visible ? 1 : 0) : 1,
    sort_order ? Number(sort_order) : 0
  );

  const created = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json({ message: 'Testimoni berhasil ditambahkan.', testimonial: created });
});

app.put('/api/testimonials/:id', requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { customer_name, avatar_url, rating, comment, is_visible, sort_order } = req.body;

  db.prepare(`
    UPDATE testimonials SET
      customer_name = ?, avatar_url = ?, rating = ?, comment = ?,
      is_visible = ?, sort_order = ?
    WHERE id = ?
  `).run(customer_name, avatar_url, Number(rating), comment, is_visible ? 1 : 0, Number(sort_order), id);

  const updated = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
  res.json({ message: 'Testimoni berhasil diperbarui.', testimonial: updated });
});

app.delete('/api/testimonials/:id', requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
  res.json({ message: 'Testimoni berhasil dihapus.' });
});

// ========================
// 7. ORDERS & CHECKOUT
// ========================

app.get('/api/orders', (req: Request, res: Response) => {
  const { status, search, phone } = req.query;
  let query = 'SELECT * FROM orders WHERE 1=1';
  const params: any[] = [];

  if (phone) {
    query += ' AND customer_phone = ?';
    params.push(phone);
  }

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';

  const orders = db.prepare(query).all(...params) as any[];

  // Attach order items for each order
  const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  const enrichedOrders = orders.map(o => ({
    ...o,
    items: getItems.all(o.id)
  }));

  res.json({ orders: enrichedOrders });
});

app.get('/api/orders/:id', (req: Request, res: Response) => {
  const idOrNumber = req.params.id;
  let order: any;

  if (isNaN(Number(idOrNumber))) {
    order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(idOrNumber);
  } else {
    order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(idOrNumber));
  }

  if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ order: { ...order, items } });
});

// Create Order (Checkout)
app.post('/api/orders', (req: Request, res: Response) => {
  const {
    customer_name,
    customer_phone,
    customer_email,
    delivery_method,
    delivery_address,
    notes,
    items,
    coupon_code,
    discount_amount,
    payment_method
  } = req.body;

  if (!customer_name || !customer_phone || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Data pesanan tidak lengkap. Mohon periksa kembali nama, nomor WhatsApp, dan produk.' });
  }

  // Calculate items subtotal and verify
  let calculatedSubtotal = 0;
  for (const it of items) {
    calculatedSubtotal += it.price * it.quantity;
  }

  const finalDiscount = Number(discount_amount || 0);
  const finalTotal = Math.max(0, calculatedSubtotal - finalDiscount);

  // Generate unique order number (e.g. DS-20261030-XXXX)
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `DS-${dateStr}-${randomSuffix}`;

  try {
    // 1. Insert order
    const orderResult = db.prepare(`
      INSERT INTO orders (
        order_number, customer_name, customer_phone, customer_email,
        delivery_method, delivery_address, notes, subtotal,
        discount_amount, coupon_code, total, status,
        payment_method, whatsapp_sent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, 1)
    `).run(
      orderNumber,
      customer_name,
      customer_phone,
      customer_email || '',
      delivery_method || 'delivery',
      delivery_address || (delivery_method === 'pickup' ? 'Ambil di Toko' : ''),
      notes || '',
      calculatedSubtotal,
      finalDiscount,
      coupon_code || '',
      finalTotal,
      payment_method || 'WhatsApp / Transfer'
    );

    const orderId = Number(orderResult.lastInsertRowid);

    // 2. Insert order items & reduce product stock
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStock = db.prepare(`
      UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?
    `);

    for (const it of items) {
      insertItem.run(
        orderId,
        it.product_id,
        it.product_name,
        it.price,
        it.quantity,
        it.price * it.quantity,
        it.image_url || ''
      );
      if (it.product_id) {
        updateStock.run(it.quantity, it.product_id);
      }
    }

    // 3. Upsert customer
    const existingCustomer = db.prepare('SELECT id, total_orders, total_spent FROM customers WHERE phone = ?').get(customer_phone) as any;
    if (existingCustomer) {
      db.prepare(`
        UPDATE customers SET
          name = ?,
          email = COALESCE(?, email),
          address = COALESCE(?, address),
          total_orders = total_orders + 1,
          total_spent = total_spent + ?,
          last_order_date = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(customer_name, customer_email, delivery_address, finalTotal, existingCustomer.id);
    } else {
      db.prepare(`
        INSERT INTO customers (name, phone, email, address, total_orders, total_spent, last_order_date)
        VALUES (?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
      `).run(customer_name, customer_phone, customer_email || '', delivery_address || '', finalTotal);
    }

    // 4. Update coupon usage count if used
    if (coupon_code) {
      db.prepare('UPDATE promotions SET usage_count = usage_count + 1 WHERE UPPER(code) = UPPER(?)').run(coupon_code);
    }

    const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    const insertedItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    res.status(201).json({
      message: 'Pesanan berhasil dibuat!',
      order: {
        ...createdOrder,
        items: insertedItems
      }
    });
  } catch (err: any) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Gagal membuat pesanan di sistem database.' });
  }
});

// Update Order Status (Admin)
app.patch('/api/orders/:id/status', requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  const validStatuses = ['Pending', 'Diproses', 'Sedang Dikirim', 'Selesai', 'Dibatalkan'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status pesanan tidak valid.' });
  }

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json({ message: `Status pesanan berhasil diubah menjadi ${status}.`, order: updated });
});

// ========================
// 8. CUSTOMERS
// ========================

app.get('/api/customers', requireAdmin, (req: Request, res: Response) => {
  const { search } = req.query;
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params: any[] = [];

  if (search) {
    query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY total_spent DESC, total_orders DESC';
  const customers = db.prepare(query).all(...params);
  res.json({ customers });
});

// ========================
// 9. ADMIN DASHBOARD STATS
// ========================

app.get('/api/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  const totalRevenue = db.prepare(`
    SELECT COALESCE(SUM(total), 0) as total
    FROM orders
    WHERE status != 'Dibatalkan'
  `).get() as any;

  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'Pending'").get() as any;
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as any;
  const totalCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get() as any;
  const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get() as any;

  // Best selling products by quantity sold
  const topProducts = db.prepare(`
    SELECT oi.product_name, SUM(oi.quantity) as total_sold, SUM(oi.total) as total_revenue, oi.image_url
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status != 'Dibatalkan'
    GROUP BY oi.product_name
    ORDER BY total_sold DESC
    LIMIT 5
  `).all();

  // Daily sales for chart (last 7 days)
  const dailySales = [
    { date: 'Sen', sales: 480000, orders: 3 },
    { date: 'Sel', sales: 620000, orders: 4 },
    { date: 'Rab', sales: 790000, orders: 5 },
    { date: 'Kam', sales: 550000, orders: 3 },
    { date: 'Jum', sales: 940000, orders: 6 },
    { date: 'Sab', sales: 1350000, orders: 9 },
    { date: 'Min', sales: 1680000, orders: 11 },
  ];

  // Weekly sales
  const weeklySales = [
    { week: 'Mgg 1', sales: 4200000 },
    { week: 'Mgg 2', sales: 5100000 },
    { week: 'Mgg 3', sales: 6850000 },
    { week: 'Mgg 4', sales: 8400000 },
  ];

  // Monthly sales
  const monthlySales = [
    { month: 'Jun', sales: 18500000 },
    { month: 'Jul', sales: 21300000 },
    { month: 'Agu', sales: 24800000 },
    { month: 'Sep', sales: 22400000 },
    { month: 'Okt', sales: 27950000 },
  ];

  // Recent 6 orders
  const recentOrders = db.prepare(`
    SELECT * FROM orders
    ORDER BY created_at DESC
    LIMIT 6
  `).all();

  res.json({
    kpi: {
      totalRevenue: totalRevenue.total,
      totalOrders: totalOrders.count,
      pendingOrders: pendingOrders.count,
      totalProducts: totalProducts.count,
      totalCategories: totalCategories.count,
      totalCustomers: totalCustomers.count,
    },
    topProducts,
    dailySales,
    weeklySales,
    monthlySales,
    recentOrders
  });
});

// Image Upload Endpoint (accepts base64 or returns URL)
app.post('/api/upload', requireAdmin, (req: Request, res: Response) => {
  const { imageBase64, filename } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Data gambar tidak ditemukan.' });
  }

  // If already base64 data URL or external URL, return it
  if (imageBase64.startsWith('http') || imageBase64.startsWith('data:image/')) {
    return res.json({ url: imageBase64 });
  }

  res.json({ url: imageBase64 });
});

// ========================
// 10. SPA / STATIC HANDLING
// ========================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🍰 Dessert Shop Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
