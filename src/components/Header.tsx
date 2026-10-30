import React, { useState } from 'react';
import { ShoppingBag, Menu, X, Shield, Cake, Sparkles, Phone, Info } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { PWAInstallButton } from './PWAInstallButton';
import { WebsiteSettings } from '../types';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  settings?: WebsiteSettings | null;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, settings }) => {
  const { totalCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'catalog', label: 'Produk & Menu' },
    { id: 'about', label: 'Tentang Kami' },
    { id: 'contact', label: 'Kontak' },
  ];

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const storeName = settings?.store_name || 'Delicia Dessert';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pink-100 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Store Name */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-200 p-0.5 shadow-sm group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <img 
                  src={settings?.logo_url || '/icon.svg'} 
                  alt="Delicia Logo" 
                  className="w-7 h-7 object-contain"
                  onError={(e) => {
                    // Fallback to icon
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
            <div>
              <span className="font-display font-bold text-lg sm:text-xl text-stone-900 tracking-tight block leading-tight group-hover:text-pink-600 transition-colors">
                {storeName}
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-pink-600 tracking-wider uppercase block">
                Artisanal Patisserie
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                    isActive
                      ? 'text-pink-600 bg-pink-50 font-bold'
                      : 'text-stone-700 hover:text-pink-600 hover:bg-stone-50'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-pink-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button */}
            <div className="hidden sm:block">
              <PWAInstallButton />
            </div>

            {/* Admin Dashboard Quick Link */}
            <button
              onClick={() => handleNavClick('admin')}
              className={`p-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                currentTab.startsWith('admin')
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
              }`}
              title="Admin Portal"
            >
              <Shield className="w-4 h-4 text-pink-500" />
              <span className="hidden lg:inline text-xs">Admin</span>
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 sm:px-3.5 sm:py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg hover:from-pink-600 hover:to-rose-600 active:scale-95 transition-all flex items-center gap-2"
              aria-label="Keranjang Belanja"
            >
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="hidden sm:inline">Keranjang</span>
              {totalCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-900 text-[11px] font-extrabold flex items-center justify-center shadow-xs animate-bounce">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100 active:scale-95 transition"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-pink-100 bg-white/98 px-4 pt-3 pb-6 shadow-xl animate-fade-in">
          <div className="flex flex-col gap-1 mb-4">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-semibold transition ${
                  currentTab === link.id
                    ? 'bg-pink-50 text-pink-600'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span>{link.label}</span>
                {link.id === 'catalog' && <Cake className="w-4 h-4 text-pink-400" />}
                {link.id === 'about' && <Info className="w-4 h-4 text-pink-400" />}
                {link.id === 'contact' && <Phone className="w-4 h-4 text-pink-400" />}
              </button>
            ))}

            <button
              onClick={() => handleNavClick('admin')}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-semibold transition mt-2 ${
                currentTab.startsWith('admin')
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-pink-500" />
                Admin Dashboard
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-pink-100 text-pink-700 font-bold">Akses Toko</span>
            </button>
          </div>

          <div className="pt-2 border-t border-stone-100">
            <PWAInstallButton variant="banner" />
          </div>
        </div>
      )}
    </header>
  );
};
