import React from 'react';
import { Home, UtensilsCrossed, Search, ShoppingBag, Shield } from 'lucide-react';
import { useCart } from '../hooks/useCart';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSearch?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab, onOpenSearch }) => {
  const { totalCount, setIsCartOpen } = useCart();

  const handleNav = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-pink-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        
        {/* 1. Beranda */}
        <button
          onClick={() => handleNav('home')}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
            currentTab === 'home' ? 'text-pink-600 font-bold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] leading-none">Home</span>
        </button>

        {/* 2. Menu Katalog */}
        <button
          onClick={() => handleNav('catalog')}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
            currentTab === 'catalog' ? 'text-pink-600 font-bold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <UtensilsCrossed className={`w-5 h-5 ${currentTab === 'catalog' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] leading-none">Menu</span>
        </button>

        {/* 3. Keranjang (Center Hero Button) */}
        <div className="flex justify-center items-center h-full">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-12 h-12 -mt-5 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-lg shadow-pink-500/30 flex items-center justify-center active:scale-90 transition-transform relative"
            aria-label="Buka Keranjang"
          >
            <ShoppingBag className="w-5 h-5 stroke-[2.2px]" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-amber-400 text-stone-900 text-[10px] font-extrabold flex items-center justify-center border-2 border-white">
                {totalCount}
              </span>
            )}
          </button>
        </div>

        {/* 4. Cari */}
        <button
          onClick={() => {
            if (onOpenSearch) onOpenSearch();
            handleNav('catalog');
          }}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
            currentTab === 'search' ? 'text-pink-600 font-bold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Search className="w-5 h-5 stroke-[1.8px]" />
          <span className="text-[10px] leading-none">Cari</span>
        </button>

        {/* 5. Admin / Akun */}
        <button
          onClick={() => handleNav('admin')}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
            currentTab.startsWith('admin') ? 'text-pink-600 font-bold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Shield className={`w-5 h-5 ${currentTab.startsWith('admin') ? 'stroke-[2.5px] text-pink-600' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] leading-none">Admin</span>
        </button>

      </div>
    </nav>
  );
};
