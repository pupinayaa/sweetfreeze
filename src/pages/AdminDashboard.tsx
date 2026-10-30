import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Cake, FolderTree, ShoppingBag, Users,
  Tag, MessageSquareQuote, Settings, ShieldAlert, LogOut,
  Plus, Edit, Trash2, Search, ArrowUpRight, TrendingUp,
  CheckCircle, Clock, Truck, XCircle, Eye, Phone, RefreshCw,
  DollarSign, Package, UserCheck, Flame, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, BarChart, Bar, CartesianGrid
} from 'recharts';
import { api, removeAdminToken } from '../lib/api';
import { Product, Category, Order, Customer, Promotion, Testimonial, WebsiteSettings, AdminUser } from '../types';
import { formatRupiah, formatDate, cleanPhoneNumber } from '../lib/utils';

interface AdminDashboardProps {
  currentAdmin: AdminUser;
  onLogout: () => void;
  onNavigateToStore: () => void;
  onSettingsUpdated?: (newSettings: WebsiteSettings) => void;
}

type TabType = 'overview' | 'products' | 'categories' | 'orders' | 'customers' | 'promotions' | 'testimonials' | 'settings' | 'admins';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentAdmin,
  onLogout,
  onNavigateToStore,
  onSettingsUpdated
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Stats data
  const [stats, setStats] = useState<any>(null);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Resource datasets
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [adminList, setAdminList] = useState<AdminUser[]>([]);

  // Feedback notifications
  const [toast, setToast] = useState<string | null>(null);
  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [orderDetailModal, setOrderDetailModal] = useState<Order | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number; name: string } | null>(null);

  // Search and filter in tables
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [customerSearch, setCustomerSearch] = useState('');

  // Fetch all dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        prodRes,
        catRes,
        orderRes,
        custRes,
        promoRes,
        testRes,
        settingsRes,
        adminRes
      ] = await Promise.all([
        api.getAdminStats(),
        api.getProducts({ all: true }),
        api.getCategories(),
        api.getOrders(),
        api.getCustomers(),
        api.getPromotions(true),
        api.getTestimonials(true),
        api.getSettings(),
        api.getAdminList().catch(() => ({ admins: [] }))
      ]);

      setStats(statsRes);
      setProducts(prodRes.products || []);
      setCategories(catRes.categories || []);
      setOrders(orderRes.orders || []);
      setCustomers(custRes.customers || []);
      setPromotions(promoRes.promotions || []);
      setTestimonials(testRes.testimonials || []);
      setSettings(settingsRes.settings || null);
      setAdminList(adminRes.admins || []);
    } catch (err: any) {
      console.error(err);
      showNotification('Gagal memuat data: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [refreshKey]);

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      showNotification(`Status pesanan diubah ke "${status}"`);
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: status as any } : o)));
      if (orderDetailModal && orderDetailModal.id === orderId) {
        setOrderDetailModal(prev => (prev ? { ...prev, status: status as any } : null));
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal mengubah status');
    }
  };

  // Delete handler
  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    try {
      if (type === 'product') {
        await api.deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
        showNotification('Produk berhasil dihapus');
      } else if (type === 'category') {
        await api.deleteCategory(id);
        setCategories(prev => prev.filter(c => c.id !== id));
        showNotification('Kategori berhasil dihapus');
      } else if (type === 'promotion') {
        await api.deletePromotion(id);
        setPromotions(prev => prev.filter(p => p.id !== id));
        showNotification('Promo berhasil dihapus');
      } else if (type === 'testimonial') {
        await api.deleteTestimonial(id);
        setTestimonials(prev => prev.filter(t => t.id !== id));
        showNotification('Testimoni berhasil dihapus');
      } else if (type === 'admin') {
        await api.deleteAdmin(id);
        setAdminList(prev => prev.filter(a => a.id !== id));
        showNotification('Akun admin berhasil dihapus');
      }
    } catch (err: any) {
      showNotification(err.message || 'Gagal menghapus');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const navItems: Array<{ id: TabType; label: string; icon: any; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Produk', icon: Cake, badge: products.length },
    { id: 'categories', label: 'Kategori', icon: FolderTree, badge: categories.length },
    { id: 'orders', label: 'Pesanan', icon: ShoppingBag, badge: orders.filter(o => o.status === 'Pending').length },
    { id: 'customers', label: 'Pelanggan', icon: Users, badge: customers.length },
    { id: 'promotions', label: 'Promo & Voucher', icon: Tag, badge: promotions.length },
    { id: 'testimonials', label: 'Testimoni', icon: MessageSquareQuote },
    { id: 'settings', label: 'Pengaturan Website', icon: Settings },
    { id: 'admins', label: 'Akun Admin', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      
      {/* Top Banner & Notifications */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-slide-down border border-stone-800">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-stone-900 text-white border-b border-stone-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500 flex items-center justify-center font-bold shadow-xs">
            <Cake className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-base sm:text-lg leading-tight">
              {settings?.store_name || 'Delicia'} Admin Panel
            </h1>
            <p className="text-[10px] text-pink-400 font-semibold uppercase tracking-wider">
              Mode: {currentAdmin.role.toUpperCase()} • Halo, {currentAdmin.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onNavigateToStore}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Lihat Toko Pelanggan</span>
          </button>

          <button
            onClick={() => {
              removeAdminToken();
              onLogout();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold transition border border-rose-500/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Admin Workspace with Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Desktop Sidebar / Mobile Tabs Scroll */}
        <aside className="w-full md:w-64 bg-white border-r border-stone-200/80 p-3 sm:p-4 shrink-0 flex md:flex-col overflow-x-auto no-scrollbar md:overflow-visible gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap md:whitespace-normal shrink-0 ${
                  isActive
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-white text-pink-600' : 'bg-pink-100 text-pink-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Content Panel */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          
          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
                
                {/* Total Pendapatan */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-stone-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Pendapatan</span>
                    <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="font-display text-xl sm:text-2xl font-black text-stone-900">
                      {formatRupiah(stats?.kpi?.totalRevenue || 0)}
                    </span>
                    <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Terverifikasi dari pesanan aktif</span>
                    </p>
                  </div>
                </div>

                {/* Total Pesanan */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-stone-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Pesanan</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="font-display text-xl sm:text-2xl font-black text-stone-900">
                      {stats?.kpi?.totalOrders || orders.length} Pesanan
                    </span>
                    <p className="text-[11px] text-amber-600 font-semibold mt-1">
                      {stats?.kpi?.pendingOrders || 0} butuh diproses
                    </p>
                  </div>
                </div>

                {/* Total Produk */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-stone-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Menu Aktif</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Cake className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="font-display text-xl sm:text-2xl font-black text-stone-900">
                      {stats?.kpi?.totalProducts || products.length} Dessert
                    </span>
                    <p className="text-[11px] text-stone-500 font-semibold mt-1">
                      dalam {stats?.kpi?.totalCategories || categories.length} kategori
                    </p>
                  </div>
                </div>

                {/* Total Pelanggan */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-stone-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Pelanggan</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="font-display text-xl sm:text-2xl font-black text-stone-900">
                      {stats?.kpi?.totalCustomers || customers.length} Orang
                    </span>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                      Pelanggan setia terdaftar
                    </p>
                  </div>
                </div>

              </div>

              {/* Sales Chart Section */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-lg text-stone-900">
                      Grafik Penjualan Dessert
                    </h3>
                    <p className="text-xs text-stone-500">
                      Tren pergerakan omzet toko per periode waktu
                    </p>
                  </div>

                  {/* Period toggle */}
                  <div className="flex p-1 bg-stone-100 rounded-xl self-start sm:self-auto">
                    <button
                      onClick={() => setChartPeriod('daily')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        chartPeriod === 'daily' ? 'bg-white shadow-xs text-pink-600' : 'text-stone-600'
                      }`}
                    >
                      Harian (7 Hari)
                    </button>
                    <button
                      onClick={() => setChartPeriod('weekly')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        chartPeriod === 'weekly' ? 'bg-white shadow-xs text-pink-600' : 'text-stone-600'
                      }`}
                    >
                      Mingguan
                    </button>
                    <button
                      onClick={() => setChartPeriod('monthly')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        chartPeriod === 'monthly' ? 'bg-white shadow-xs text-pink-600' : 'text-stone-600'
                      }`}
                    >
                      Bulanan
                    </button>
                  </div>
                </div>

                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={
                        chartPeriod === 'daily'
                          ? stats?.dailySales || []
                          : chartPeriod === 'weekly'
                          ? stats?.weeklySales || []
                          : stats?.monthlySales || []
                      }
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey={chartPeriod === 'daily' ? 'date' : chartPeriod === 'weekly' ? 'week' : 'month'}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `Rp ${(v / 1000).toLocaleString('id-ID')}k`}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatRupiah(val), 'Penjualan']}
                        contentStyle={{
                          borderRadius: '16px',
                          border: 'none',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                          backgroundColor: '#1e293b',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#ec4899"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#salesGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Best Sellers & Recent Orders Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Best Sellers */}
                <div className="lg:col-span-5 p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-base text-stone-900 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-500 fill-current" />
                      <span>Produk Terlaris</span>
                    </h3>
                    <span className="text-xs text-stone-400">Paling Laku</span>
                  </div>

                  <div className="space-y-3">
                    {products.filter(p => p.is_best_seller).slice(0, 5).map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-2xl bg-stone-50 border border-stone-100">
                        <span className="w-6 h-6 rounded-lg bg-pink-100 text-pink-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-stone-900 truncate">{p.name}</p>
                          <p className="text-[11px] text-pink-600 font-semibold">{formatRupiah(p.discount_price ?? p.price)}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                          Stok: {p.stock}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Orders Overview */}
                <div className="lg:col-span-7 p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-base text-stone-900">
                      Pesanan Masuk Terbaru
                    </h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-pink-600 hover:underline"
                    >
                      Lihat Semua ({orders.length}) →
                    </button>
                  </div>

                  <div className="divide-y divide-stone-100">
                    {orders.slice(0, 5).map((ord) => (
                      <div key={ord.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-stone-900 truncate">
                            #{ord.order_number} • {ord.customer_name}
                          </p>
                          <p className="text-[11px] text-stone-400">
                            {formatDate(ord.created_at)} • {ord.delivery_method === 'delivery' ? 'Pengiriman' : 'Ambil di Toko'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-extrabold text-stone-900">{formatRupiah(ord.total)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' :
                            ord.status === 'Diproses' ? 'bg-blue-100 text-blue-700' :
                            ord.status === 'Sedang Dikirim' ? 'bg-amber-100 text-amber-700' :
                            ord.status === 'Dibatalkan' ? 'bg-stone-100 text-stone-500' :
                            'bg-pink-100 text-pink-700 animate-pulse'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: PRODUCTS MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-xs">
                <div>
                  <h2 className="font-display font-bold text-xl text-stone-900">
                    Manajemen Produk Dessert ({products.length})
                  </h2>
                  <p className="text-xs text-stone-500">
                    Kelola foto, harga, diskon, stok, dan label Best Seller
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Produk Baru</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Cari nama dessert atau rasa..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-stone-200 text-xs sm:text-sm bg-white"
                  />
                </div>

                <select
                  value={productCatFilter}
                  onChange={(e) => setProductCatFilter(e.target.value)}
                  className="px-3.5 py-2.5 rounded-2xl border border-stone-200 text-xs font-bold bg-white text-stone-700"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-4">Menu Dessert</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4">Harga Normal / Diskon</th>
                        <th className="py-3 px-4">Stok</th>
                        <th className="py-3 px-4">Status & Badge</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {products
                        .filter(p => {
                          if (productCatFilter !== 'all' && String(p.category_id) !== productCatFilter) return false;
                          if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase())) return false;
                          return true;
                        })
                        .map((prod) => (
                          <tr key={prod.id} className="hover:bg-stone-50/80 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img src={prod.image_url} alt={prod.name} className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0" />
                                <div className="min-w-0 max-w-xs">
                                  <p className="font-bold text-stone-900 truncate">{prod.name}</p>
                                  <p className="text-[11px] text-stone-400 line-clamp-1">{prod.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-stone-700">
                              {prod.category_name || categories.find(c => c.id === prod.category_id)?.name || '-'}
                            </td>
                            <td className="py-3 px-4">
                              {prod.discount_price ? (
                                <div>
                                  <span className="font-bold text-pink-600 block">{formatRupiah(prod.discount_price)}</span>
                                  <span className="text-[10px] text-stone-400 line-through">{formatRupiah(prod.price)}</span>
                                </div>
                              ) : (
                                <span className="font-bold text-stone-900">{formatRupiah(prod.price)}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                prod.stock <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {prod.stock} Porsi
                              </span>
                            </td>
                            <td className="py-3 px-4 space-x-1">
                              {prod.is_best_seller ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">
                                  Best Seller
                                </span>
                              ) : null}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                prod.is_active ? 'bg-stone-100 text-stone-700' : 'bg-stone-200 text-stone-400'
                              }`}>
                                {prod.is_active ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-1">
                              <button
                                onClick={() => {
                                  setEditingProduct(prod);
                                  setProductModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-stone-600 hover:text-pink-600 hover:bg-pink-50 transition"
                                title="Edit Produk"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'product', id: prod.id, name: prod.name })}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Hapus Produk"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CATEGORIES MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === 'categories' && (
            <div className="space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-xs">
                <div>
                  <h2 className="font-display font-bold text-xl text-stone-900">
                    Kategori Dessert ({categories.length})
                  </h2>
                  <p className="text-xs text-stone-500">
                    Kelola kategori produk dan ikon gambar pada homepage
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kategori</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-4 rounded-3xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={cat.image_url} alt={cat.name} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm text-stone-900">{cat.name}</h4>
                        <p className="text-[11px] text-stone-400">Slug: {cat.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryModalOpen(true);
                        }}
                        className="p-1.5 text-stone-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'category', id: cat.id, name: cat.name })}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: ORDERS MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-xs">
                <div>
                  <h2 className="font-display font-bold text-xl text-stone-900">
                    Manajemen Pesanan Masuk ({orders.length})
                  </h2>
                  <p className="text-xs text-stone-500">
                    Ubah status pesanan, lihat detail item, dan hubungi pelanggan via WhatsApp
                  </p>
                </div>
              </div>

              {/* Search & Status Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Cari nomor pesanan, nama pemesan, atau nomor telp..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-stone-200 text-xs sm:text-sm bg-white"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {['all', 'Pending', 'Diproses', 'Sedang Dikirim', 'Selesai', 'Dibatalkan'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                        orderStatusFilter === st
                          ? 'bg-stone-900 text-white'
                          : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {st === 'all' ? 'Semua Status' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders List Table */}
              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-4">No. Pesanan</th>
                        <th className="py-3 px-4">Pelanggan & WhatsApp</th>
                        <th className="py-3 px-4">Metode & Alamat</th>
                        <th className="py-3 px-4">Total Bayar</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {orders
                        .filter(o => {
                          if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
                          if (orderSearch) {
                            const q = orderSearch.toLowerCase();
                            const matchNum = o.order_number.toLowerCase().includes(q);
                            const matchName = o.customer_name.toLowerCase().includes(q);
                            const matchPhone = o.customer_phone.includes(q);
                            if (!matchNum && !matchName && !matchPhone) return false;
                          }
                          return true;
                        })
                        .map((order) => (
                          <tr key={order.id} className="hover:bg-stone-50/80 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                              #{order.order_number}
                              <span className="block text-[10px] font-normal text-stone-400 font-sans mt-0.5">
                                {formatDate(order.created_at)}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <p className="font-bold text-stone-900">{order.customer_name}</p>
                              <a
                                href={`https://wa.me/${cleanPhoneNumber(order.customer_phone)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                {order.customer_phone}
                              </a>
                            </td>

                            <td className="py-3.5 px-4 max-w-xs">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-bold text-[10px]">
                                {order.delivery_method === 'delivery' ? 'Pengiriman' : 'Ambil di Toko'}
                              </span>
                              {order.delivery_address && (
                                <p className="text-[11px] text-stone-500 truncate mt-1">
                                  {order.delivery_address}
                                </p>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-extrabold text-stone-900 block">
                                {formatRupiah(order.total)}
                              </span>
                              {order.discount_amount > 0 && (
                                <span className="text-[10px] text-pink-600 font-medium">
                                  Hemat {formatRupiah(order.discount_amount)}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <select
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                  order.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  order.status === 'Diproses' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  order.status === 'Sedang Dikirim' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  order.status === 'Dibatalkan' ? 'bg-stone-100 text-stone-500 border-stone-200' :
                                  'bg-pink-50 text-pink-700 border-pink-200 animate-pulse'
                                }`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Diproses">Diproses</option>
                                <option value="Sedang Dikirim">Sedang Dikirim</option>
                                <option value="Selesai">Selesai</option>
                                <option value="Dibatalkan">Dibatalkan</option>
                              </select>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setOrderDetailModal(order)}
                                className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold transition inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: CUSTOMERS MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === 'customers' && (
            <div className="space-y-5">
              
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-xl text-stone-900">
                    Daftar Pelanggan ({customers.length})
                  </h2>
                  <p className="text-xs text-stone-500">
                    Riwayat transaksi dan kontak pelanggan setia
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Cari nama atau WhatsApp..."
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-stone-200 text-xs"
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase">
                    <tr>
                      <th className="py-3 px-4">Nama Pelanggan</th>
                      <th className="py-3 px-4">WhatsApp</th>
                      <th className="py-3 px-4">Alamat Terakhir</th>
                      <th className="py-3 px-4">Total Order</th>
                      <th className="py-3 px-4">Total Belanja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {customers
                      .filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch))
                      .map((cust) => (
                        <tr key={cust.id} className="hover:bg-stone-50/80 transition">
                          <td className="py-3.5 px-4 font-bold text-stone-900">{cust.name}</td>
                          <td className="py-3.5 px-4">
                            <a
                              href={`https://wa.me/${cleanPhoneNumber(cust.phone)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              {cust.phone}
                            </a>
                          </td>
                          <td className="py-3.5 px-4 text-stone-500 max-w-xs truncate">{cust.address || '-'}</td>
                          <td className="py-3.5 px-4 font-bold text-stone-800">{cust.total_orders}x Transaksi</td>
                          <td className="py-3.5 px-4 font-extrabold text-pink-600">{formatRupiah(cust.total_spent)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: PROMOTIONS */}
          {/* ======================================================== */}
          {activeTab === 'promotions' && (
            <div className="space-y-5">
              
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-xl text-stone-900">
                    Voucher Promo & Diskon ({promotions.length})
                  </h2>
                  <p className="text-xs text-stone-500">
                    Kelola kode voucher diskon untuk checkout pelanggan
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingPromo(null);
                    setPromoModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Promo Baru</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {promotions.map((p) => (
                  <div key={p.id} className="p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-black text-sm bg-stone-100 text-stone-800 px-2.5 py-1 rounded-xl">
                          {p.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400'
                        }`}>
                          {p.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <h4 className="font-bold text-stone-900 text-sm">{p.title}</h4>
                      <p className="text-xs text-stone-500 mt-1">{p.description}</p>
                      <div className="mt-3 text-xs space-y-1 text-stone-600">
                        <p>Nilai: <strong>{p.discount_type === 'percentage' ? `${p.discount_value}%` : formatRupiah(p.discount_value)}</strong></p>
                        <p>Min. Belanja: <strong>{formatRupiah(p.min_purchase)}</strong></p>
                        <p>Digunakan: <strong>{p.usage_count} kali</strong></p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingPromo(p);
                          setPromoModalOpen(true);
                        }}
                        className="p-1.5 text-stone-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'promotion', id: p.id, name: p.code })}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: TESTIMONIALS */}
          {/* ======================================================== */}
          {activeTab === 'testimonials' && (
            <div className="space-y-5">
              
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-xl text-stone-900">
                    Manajemen Testimoni ({testimonials.length})
                  </h2>
                  <p className="text-xs text-stone-500">
                    Moderasi ulasan pelanggan yang ditampilkan di halaman muka
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingTestimonial(null);
                    setTestimonialModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Testimoni</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testimonials.map((t) => (
                  <div key={t.id} className="p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-stone-900">{t.customer_name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.is_visible ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400'
                        }`}>
                          {t.is_visible ? 'Ditampilkan' : 'Disembunyikan'}
                        </span>
                      </div>
                      <p className="text-xs text-amber-500 font-bold mb-1">
                        {'★'.repeat(t.rating)}
                      </p>
                      <p className="text-xs text-stone-600 italic">"{t.comment}"</p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingTestimonial(t);
                          setTestimonialModalOpen(true);
                        }}
                        className="p-1.5 text-stone-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'testimonial', id: t.id, name: t.customer_name })}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 8: WEBSITE SETTINGS */}
          {/* ======================================================== */}
          {activeTab === 'settings' && settings && (
            <div className="bg-white p-5 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
              <div>
                <h2 className="font-display font-bold text-xl text-stone-900">
                  Pengaturan Toko & Website
                </h2>
                <p className="text-xs text-stone-500">
                  Perubahan nomor WhatsApp, nama toko, banner, dan alamat langsung tersinkron ke pelanggan.
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await api.updateSettings(settings);
                    setSettings(res.settings);
                    if (onSettingsUpdated) onSettingsUpdated(res.settings);
                    showNotification('Pengaturan website berhasil diperbarui!');
                  } catch (err: any) {
                    showNotification(err.message || 'Gagal menyimpan pengaturan');
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Nama Toko Dessert</label>
                    <input
                      type="text"
                      required
                      value={settings.store_name}
                      onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Tagline Bisnis</label>
                    <input
                      type="text"
                      value={settings.store_tagline || ''}
                      onChange={(e) => setSettings({ ...settings, store_tagline: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Nomor WhatsApp Toko (Tujuan Checkout) *
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.whatsapp_number}
                      onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                      placeholder="6281234567890"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-semibold"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">Gunakan format internasional tanpa tanda + (contoh: 6281234567890).</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Jam Operasional</label>
                    <input
                      type="text"
                      value={settings.operational_hours || ''}
                      onChange={(e) => setSettings({ ...settings, operational_hours: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Akun Instagram</label>
                    <input
                      type="text"
                      value={settings.instagram || ''}
                      onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Akun TikTok</label>
                    <input
                      type="text"
                      value={settings.tiktok || ''}
                      onChange={(e) => setSettings({ ...settings, tiktok: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Alamat Lengkap Toko</label>
                  <input
                    type="text"
                    value={settings.address || ''}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Deskripsi Bisnis</label>
                  <textarea
                    rows={3}
                    value={settings.business_description || ''}
                    onChange={(e) => setSettings({ ...settings, business_description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95"
                  >
                    Simpan Pengaturan
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 9: ADMINS MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === 'admins' && (
            <div className="space-y-5">
              
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-xl text-stone-900">
                    Kelola Akun Admin ({adminList.length})
                  </h2>
                  <p className="text-xs text-stone-500">
                    Atur hak akses admin dan ubah kredensial akun
                  </p>
                </div>

                {currentAdmin.role === 'superadmin' && (
                  <button
                    onClick={() => setAdminModalOpen(true)}
                    className="px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Admin Baru</span>
                  </button>
                )}
              </div>

              {/* Admin Accounts Table */}
              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-bold">
                    <tr>
                      <th className="py-3 px-4">Nama & Username</th>
                      <th className="py-3 px-4">Role Akses</th>
                      <th className="py-3 px-4">Terakhir Login</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {adminList.map((adm) => (
                      <tr key={adm.id} className="hover:bg-stone-50/80 transition">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-stone-900">{adm.name}</p>
                          <p className="text-stone-400 font-mono text-[11px]">@{adm.username}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            adm.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'
                          }`}>
                            {adm.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-500">{formatDate(adm.last_login)}</td>
                        <td className="py-3.5 px-4 text-right">
                          {adm.id !== currentAdmin.id && currentAdmin.role === 'superadmin' && (
                            <button
                              onClick={() => setDeleteConfirm({ type: 'admin', id: adm.id, name: adm.name })}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* MODAL: PRODUCT CREATE / EDIT */}
      {/* ======================================================== */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-display font-bold text-lg text-stone-900">
                {editingProduct ? 'Edit Menu Dessert' : 'Tambah Dessert Baru'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const payload: any = {
                  category_id: Number(formData.get('category_id')),
                  name: formData.get('name'),
                  description: formData.get('description'),
                  price: Number(formData.get('price')),
                  discount_price: formData.get('discount_price') ? Number(formData.get('discount_price')) : null,
                  stock: Number(formData.get('stock')),
                  image_url: formData.get('image_url'),
                  is_best_seller: formData.get('is_best_seller') === 'on' ? 1 : 0,
                  is_active: formData.get('is_active') === 'on' ? 1 : 0
                };

                try {
                  if (editingProduct) {
                    const res = await api.updateProduct(editingProduct.id, payload);
                    setProducts(prev => prev.map(p => p.id === editingProduct.id ? res.product : p));
                    showNotification('Produk berhasil diperbarui');
                  } else {
                    const res = await api.createProduct(payload);
                    setProducts(prev => [res.product, ...prev]);
                    showNotification('Produk baru berhasil ditambahkan');
                  }
                  setProductModalOpen(false);
                } catch (err: any) {
                  showNotification(err.message || 'Gagal menyimpan produk');
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-stone-700 mb-1">Kategori *</label>
                <select
                  name="category_id"
                  required
                  defaultValue={editingProduct?.category_id || categories[0]?.id}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-semibold"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Nama Produk Dessert *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingProduct?.name || ''}
                  placeholder="Contoh: Lotus Biscoff Fudgy Brownies"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Harga Normal (Rp) *</label>
                  <input
                    type="number"
                    name="price"
                    required
                    defaultValue={editingProduct?.price || ''}
                    placeholder="75000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Harga Diskon (Opsional)</label>
                  <input
                    type="number"
                    name="discount_price"
                    defaultValue={editingProduct?.discount_price || ''}
                    placeholder="65000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Jumlah Stok *</label>
                  <input
                    type="number"
                    name="stock"
                    required
                    defaultValue={editingProduct ? editingProduct.stock : 30}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">URL Foto Produk *</label>
                  <input
                    type="url"
                    name="image_url"
                    required
                    defaultValue={editingProduct?.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Deskripsi Rasa & Bahan</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingProduct?.description || ''}
                  placeholder="Jelaskan kelembutan, bahan cokelat, topping, dan sensasi rasanya..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_best_seller"
                    defaultChecked={Boolean(editingProduct?.is_best_seller)}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <span className="font-bold text-stone-800">Tandai Best Seller</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={editingProduct ? Boolean(editingProduct.is_active) : true}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <span className="font-bold text-stone-800">Aktif Dijual</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold shadow-md"
                >
                  {editingProduct ? 'Perbarui Produk' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CATEGORY CREATE / EDIT */}
      {/* ======================================================== */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-display font-bold text-lg text-stone-900">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
              </h3>
              <button onClick={() => setCategoryModalOpen(false)} className="text-stone-400">✕</button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const payload: any = {
                  name: formData.get('name'),
                  slug: formData.get('slug'),
                  description: formData.get('description'),
                  image_url: formData.get('image_url')
                };

                try {
                  if (editingCategory) {
                    const res = await api.updateCategory(editingCategory.id, payload);
                    setCategories(prev => prev.map(c => c.id === editingCategory.id ? res.category : c));
                    showNotification('Kategori berhasil diperbarui');
                  } else {
                    const res = await api.createCategory(payload);
                    setCategories(prev => [...prev, res.category]);
                    showNotification('Kategori baru berhasil ditambahkan');
                  }
                  setCategoryModalOpen(false);
                } catch (err: any) {
                  showNotification(err.message || 'Gagal menyimpan kategori');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nama Kategori *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingCategory?.name || ''}
                  placeholder="Contoh: Cupcakes"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">URL Foto Kategori *</label>
                <input
                  type="url"
                  name="image_url"
                  required
                  defaultValue={editingCategory?.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  name="description"
                  defaultValue={editingCategory?.description || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-500 text-white font-bold"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PROMO CREATE / EDIT */}
      {/* ======================================================== */}
      {promoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-display font-bold text-lg text-stone-900">
                {editingPromo ? 'Edit Kode Promo' : 'Buat Kode Promo Baru'}
              </h3>
              <button onClick={() => setPromoModalOpen(false)} className="text-stone-400">✕</button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const payload: any = {
                  code: formData.get('code'),
                  title: formData.get('title'),
                  description: formData.get('description'),
                  discount_type: formData.get('discount_type'),
                  discount_value: Number(formData.get('discount_value')),
                  min_purchase: Number(formData.get('min_purchase') || 0),
                  is_active: formData.get('is_active') === 'on' ? 1 : 0
                };

                try {
                  if (editingPromo) {
                    const res = await api.updatePromotion(editingPromo.id, payload);
                    setPromotions(prev => prev.map(p => p.id === editingPromo.id ? res.promotion : p));
                    showNotification('Promo berhasil diperbarui');
                  } else {
                    const res = await api.createPromotion(payload);
                    setPromotions(prev => [res.promotion, ...prev]);
                    showNotification('Promo berhasil dibuat');
                  }
                  setPromoModalOpen(false);
                } catch (err: any) {
                  showNotification(err.message || 'Gagal menyimpan promo');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-stone-700 mb-1">Kode Voucher (Huruf Besar) *</label>
                <input
                  type="text"
                  name="code"
                  required
                  defaultValue={editingPromo?.code || ''}
                  placeholder="DISKON15"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Judul Promo *</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingPromo?.title || ''}
                  placeholder="Potongan Spesial Ulang Tahun"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Tipe Diskon</label>
                  <select
                    name="discount_type"
                    defaultValue={editingPromo?.discount_type || 'percentage'}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-semibold"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nilai Diskon *</label>
                  <input
                    type="number"
                    name="discount_value"
                    required
                    defaultValue={editingPromo?.discount_value || 10}
                    placeholder="10 atau 20000"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Minimal Belanja (Rp)</label>
                <input
                  type="number"
                  name="min_purchase"
                  defaultValue={editingPromo?.min_purchase || 0}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 font-semibold"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={editingPromo ? Boolean(editingPromo.is_active) : true}
                  className="w-4 h-4 rounded text-pink-600"
                />
                <span className="font-bold text-stone-800">Aktifkan Voucher Ini</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPromoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-500 text-white font-bold"
                >
                  Simpan Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ORDER DETAILS */}
      {/* ======================================================== */}
      {orderDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-display font-bold text-lg text-stone-900">
                  Detail Pesanan #{orderDetailModal.order_number}
                </h3>
                <p className="text-xs text-stone-400">
                  Dibuat pada {formatDate(orderDetailModal.created_at)}
                </p>
              </div>
              <button onClick={() => setOrderDetailModal(null)} className="text-stone-400">✕</button>
            </div>

            {/* Customer Contact Box */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Nama Pelanggan:</span>
                <strong className="text-stone-900">{orderDetailModal.customer_name}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">WhatsApp:</span>
                <a
                  href={`https://wa.me/${cleanPhoneNumber(orderDetailModal.customer_phone)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {orderDetailModal.customer_phone}
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Metode:</span>
                <strong className="text-stone-900">{orderDetailModal.delivery_method === 'delivery' ? 'Pengiriman' : 'Ambil di Toko'}</strong>
              </div>
              {orderDetailModal.delivery_address && (
                <div>
                  <span className="text-stone-500 block mb-0.5">Alamat Tujuan:</span>
                  <p className="font-semibold text-stone-800 bg-white p-2 rounded-xl border border-stone-200">
                    {orderDetailModal.delivery_address}
                  </p>
                </div>
              )}
              {orderDetailModal.notes && (
                <div>
                  <span className="text-stone-500 block mb-0.5">Catatan Khusus:</span>
                  <p className="italic text-stone-700 bg-amber-50/80 p-2 rounded-xl border border-amber-200/80">
                    "{orderDetailModal.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Order Items List */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-400 mb-2">
                Daftar Hidangan Dipesan:
              </h4>
              <div className="divide-y divide-stone-100 border border-stone-100 rounded-2xl overflow-hidden">
                {(orderDetailModal.items || []).map((it, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs bg-white">
                    <div className="flex items-center gap-2.5">
                      {it.image_url && (
                        <img src={it.image_url} alt={it.product_name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-stone-900">{it.product_name}</p>
                        <p className="text-[11px] text-stone-500">{it.quantity}x @ {formatRupiah(it.price)}</p>
                      </div>
                    </div>
                    <span className="font-bold text-stone-900">{formatRupiah(it.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculation summary */}
            <div className="pt-2 border-t border-stone-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal:</span>
                <span>{formatRupiah(orderDetailModal.subtotal)}</span>
              </div>
              {orderDetailModal.discount_amount > 0 && (
                <div className="flex justify-between text-pink-600 font-bold">
                  <span>Diskon Voucher ({orderDetailModal.coupon_code}):</span>
                  <span>-{formatRupiah(orderDetailModal.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-stone-900 pt-2 border-t border-stone-200">
                <span>Total Pesanan:</span>
                <span className="text-pink-600">{formatRupiah(orderDetailModal.total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-stone-700">Ubah Status:</span>
                <select
                  value={orderDetailModal.status}
                  onChange={(e) => handleUpdateOrderStatus(orderDetailModal.id, e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold"
                >
                  <option value="Pending">Pending</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Sedang Dikirim">Sedang Dikirim</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              <a
                href={`https://wa.me/${cleanPhoneNumber(orderDetailModal.customer_phone)}?text=${encodeURIComponent(`Halo ${orderDetailModal.customer_name}, kami dari ${settings?.store_name || 'Delicia'} ingin mengonfirmasi pesanan #${orderDetailModal.order_number}...`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Chat WhatsApp Pelanggan</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ======================================================== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">Konfirmasi Hapus</h3>
              <p className="text-xs text-stone-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong>"{deleteConfirm.name}"</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteDelete}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE ADMIN */}
      {/* ======================================================== */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-display font-bold text-lg text-stone-900">
                Tambah Akun Admin Baru
              </h3>
              <button onClick={() => setAdminModalOpen(false)} className="text-stone-400">✕</button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const payload = {
                  username: formData.get('username'),
                  name: formData.get('name'),
                  password: formData.get('password'),
                  role: formData.get('role')
                };

                try {
                  const res = await api.createAdmin(payload);
                  setAdminList(prev => [...prev, res.admin]);
                  showNotification('Akun admin berhasil dibuat');
                  setAdminModalOpen(false);
                } catch (err: any) {
                  showNotification(err.message || 'Gagal membuat admin');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Maya Indah"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Username Login *</label>
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="maya.admin"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Role / Hak Akses</label>
                <select
                  name="role"
                  defaultValue="admin"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 font-semibold"
                >
                  <option value="admin">Admin (Kelola Produk & Pesanan)</option>
                  <option value="staff">Staff (Kelola Pesanan Saja)</option>
                  <option value="superadmin">Super Admin (Akses Penuh)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 text-white font-bold"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
