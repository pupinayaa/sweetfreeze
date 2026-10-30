import React, { useState, useMemo } from 'react';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Search, Filter, ArrowUpDown, Flame, X, SlidersHorizontal } from 'lucide-react';

interface CatalogPageProps {
  products: Product[];
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  onViewProductDetail: (product: Product) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  onViewProductDetail
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'newest' | 'rating'>('featured');
  const [onlyBestSeller, setOnlyBestSeller] = useState(false);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const cat = categories.find(c => c.slug === selectedCategory);
        if (cat && prod.category_id !== cat.id) return false;
      }

      // Best seller filter
      if (onlyBestSeller && !prod.is_best_seller) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesDesc = prod.description.toLowerCase().includes(q);
        const matchesCategory = prod.category_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCategory) return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.discount_price ?? a.price;
      const priceB = b.discount_price ?? b.price;

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
      // featured
      return (b.is_best_seller ? 1 : 0) - (a.is_best_seller ? 1 : 0);
    });
  }, [products, categories, selectedCategory, onlyBestSeller, searchTerm, sortBy]);

  const resetFilters = () => {
    setSearchTerm('');
    onSelectCategory('all');
    setOnlyBestSeller(false);
    setSortBy('featured');
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Page Title */}
      <div className="text-center sm:text-left">
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight">
          Katalog Dessert & Patisserie
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Jelajahi aneka kue lapis, brownies, cookies, puding, dan kreasi manis pilihan kami
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4 bg-white p-4 sm:p-5 rounded-3xl border border-pink-100 shadow-xs">
        
        {/* Top search & Sort row */}
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari brownies, cheese cake, cookies, tiramisu..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-stone-200 text-xs sm:text-sm focus:outline-hidden focus:border-pink-500 bg-stone-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-9 pr-8 py-2.5 rounded-2xl border border-stone-200 text-xs sm:text-sm font-semibold bg-stone-50/50 text-stone-800 focus:outline-hidden focus:border-pink-500 cursor-pointer"
              >
                <option value="featured">Paling Populer</option>
                <option value="price_asc">Harga: Termurah</option>
                <option value="price_desc">Harga: Termahal</option>
                <option value="rating">Rating Tertinggi</option>
                <option value="newest">Menu Terbaru</option>
              </select>
              <ArrowUpDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>

            {/* Best Seller Quick Toggle */}
            <button
              onClick={() => setOnlyBestSeller(!onlyBestSeller)}
              className={`px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border ${
                onlyBestSeller
                  ? 'bg-rose-50 border-rose-300 text-rose-600'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${onlyBestSeller ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`} />
              <span className="hidden sm:inline">Best Seller</span>
            </button>
          </div>

        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-stone-100">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-pink-500 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Semua ({products.length})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-pink-500 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

      </div>

      {/* Active Filter Indicators */}
      {(selectedCategory !== 'all' || searchTerm || onlyBestSeller) && (
        <div className="flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Filter aktif:</span>
            {selectedCategory !== 'all' && (
              <span className="px-2.5 py-0.5 rounded-lg bg-pink-100 text-pink-700 font-semibold flex items-center gap-1">
                Kategori: {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
                <button onClick={() => onSelectCategory('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {searchTerm && (
              <span className="px-2.5 py-0.5 rounded-lg bg-pink-100 text-pink-700 font-semibold flex items-center gap-1">
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {onlyBestSeller && (
              <span className="px-2.5 py-0.5 rounded-lg bg-pink-100 text-pink-700 font-semibold flex items-center gap-1">
                Best Seller Saja
                <button onClick={() => setOnlyBestSeller(false)}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>

          <button
            onClick={resetFilters}
            className="text-pink-600 font-bold hover:underline shrink-0"
          >
            Reset Semua
          </button>
        </div>
      )}

      {/* Products Grid (2 columns on mobile, 3-4 on larger screens) */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {filteredProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onViewDetail={onViewProductDetail}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-white rounded-3xl border border-stone-200/60 p-8 space-y-4">
          <div className="w-20 h-20 rounded-full bg-pink-50 text-pink-400 flex items-center justify-center text-3xl mx-auto">
            🧁
          </div>
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-stone-900">
              Menu Tidak Ditemukan
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto mt-1">
              Tidak ada dessert yang cocok dengan kriteria filter atau kata kunci "{searchTerm}".
            </p>
          </div>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold shadow-md transition"
          >
            Tampilkan Semua Menu
          </button>
        </div>
      )}

    </div>
  );
};
