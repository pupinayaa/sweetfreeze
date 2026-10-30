/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CartProvider } from './hooks/useCart';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Toast } from './components/Toast';

import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotFoundPage } from './pages/NotFoundPage';

import { api, getAdminToken } from './lib/api';
import { Product, Category, Promotion, Testimonial, WebsiteSettings, AdminUser } from './types';

export default function App() {
  return (
    <CartProvider>
      <MainApp />
    </CartProvider>
  );
}

function MainApp() {
  // Navigation tab state: 'home' | 'catalog' | 'about' | 'contact' | 'admin'
  const [currentTab, setCurrentTab] = useState<string>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/products')) return 'catalog';
    if (path.startsWith('/about')) return 'about';
    if (path.startsWith('/contact')) return 'contact';
    return 'home';
  });

  // Selected category in catalog
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Selected product for detail modal
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  // Core application data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin session
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // URL sync handler
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) setCurrentTab('admin');
      else if (path.startsWith('/products')) setCurrentTab('catalog');
      else if (path.startsWith('/about')) setCurrentTab('about');
      else if (path.startsWith('/contact')) setCurrentTab('contact');
      else setCurrentTab('home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToTab = (tab: string) => {
    setCurrentTab(tab);
    let targetPath = '/';
    if (tab === 'catalog') targetPath = '/products';
    else if (tab === 'about') targetPath = '/about';
    else if (tab === 'contact') targetPath = '/contact';
    else if (tab === 'admin') targetPath = '/admin';

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  // Verify admin token on boot
  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      api.getAdminMe()
        .then(res => setAdminUser(res.admin))
        .catch(() => setAdminUser(null));
    }
  }, []);

  // Fetch initial store data
  const fetchStoreData = async () => {
    try {
      const [pRes, cRes, promoRes, tRes, sRes] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getPromotions(),
        api.getTestimonials(),
        api.getSettings(),
      ]);

      setProducts(pRes.products || []);
      setCategories(cRes.categories || []);
      setPromotions(promoRes.promotions || []);
      setTestimonials(tRes.testimonials || []);
      setSettings(sRes.settings || null);
    } catch (err) {
      console.error('Error fetching store data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  // Related products for detail modal
  const relatedProducts = detailProduct
    ? products
        .filter(p => p.category_id === detailProduct.category_id && p.id !== detailProduct.id)
        .slice(0, 4)
    : [];

  const isAdminTab = currentTab.startsWith('admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9] selection:bg-pink-200 selection:text-pink-900">
      
      {/* Toast Alert */}
      <Toast />

      {/* Header (hidden in admin dashboard) */}
      {!isAdminTab && (
        <Header
          currentTab={currentTab}
          setCurrentTab={navigateToTab}
          settings={settings}
        />
      )}

      {/* Main Content Router */}
      <div className="flex-1">
        {loading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
            <p className="font-display font-semibold text-stone-600 text-sm animate-pulse">
              Menyiapkan hidangan manis Anda...
            </p>
          </div>
        ) : (
          <>
            {currentTab === 'home' && (
              <HomePage
                categories={categories}
                products={products}
                promotions={promotions}
                testimonials={testimonials}
                settings={settings}
                onSelectCategory={(slug) => {
                  setSelectedCategory(slug);
                  navigateToTab('catalog');
                }}
                onViewProductDetail={(prod) => setDetailProduct(prod)}
                onNavigateToCatalog={() => navigateToTab('catalog')}
                onRefreshTestimonials={fetchStoreData}
              />
            )}

            {currentTab === 'catalog' && (
              <CatalogPage
                products={products}
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onViewProductDetail={(prod) => setDetailProduct(prod)}
              />
            )}

            {currentTab === 'about' && (
              <AboutPage
                settings={settings}
                onNavigateToCatalog={() => navigateToTab('catalog')}
              />
            )}

            {currentTab === 'contact' && (
              <ContactPage
                settings={settings}
              />
            )}

            {currentTab === 'admin' && (
              adminUser ? (
                <AdminDashboard
                  currentAdmin={adminUser}
                  onLogout={() => setAdminUser(null)}
                  onNavigateToStore={() => navigateToTab('home')}
                  onSettingsUpdated={(newSettings) => setSettings(newSettings)}
                />
              ) : (
                <AdminLoginPage
                  onLoginSuccess={(adm) => setAdminUser(adm)}
                  onBackToStore={() => navigateToTab('home')}
                />
              )
            )}

            {!['home', 'catalog', 'about', 'contact', 'admin'].includes(currentTab) && (
              <NotFoundPage onGoHome={() => navigateToTab('home')} />
            )}
          </>
        )}
      </div>

      {/* Product Detail Modal */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          relatedProducts={relatedProducts}
          onClose={() => setDetailProduct(null)}
          onSelectProduct={(p) => setDetailProduct(p)}
          storeWhatsApp={settings?.whatsapp_number}
          storeName={settings?.store_name}
        />
      )}

      {/* Slide-over Cart & Checkout Drawer */}
      <CartDrawer
        settings={settings}
        onOrderSuccess={(orderNum) => {
          fetchStoreData();
        }}
      />

      {/* Customer Footer (hidden in admin) */}
      {!isAdminTab && (
        <Footer
          settings={settings}
          onNavigate={navigateToTab}
        />
      )}

      {/* Floating WhatsApp Quick Support (hidden in admin) */}
      {!isAdminTab && (
        <FloatingWhatsApp
          whatsappNumber={settings?.whatsapp_number}
          storeName={settings?.store_name}
        />
      )}

      {/* Mobile Android-style Bottom Navigation (hidden in admin) */}
      {!isAdminTab && (
        <BottomNav
          currentTab={currentTab}
          setCurrentTab={navigateToTab}
          onOpenSearch={() => navigateToTab('catalog')}
        />
      )}

    </div>
  );
}
