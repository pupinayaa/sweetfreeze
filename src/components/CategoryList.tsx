import React from 'react';
import { Category } from '../types';
import { Sparkles } from 'lucide-react';

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <section className="py-8 bg-white border-y border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-pink-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pilihan Menu Terbaik</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Kategori Dessert Favorit
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 sm:mt-0">
            Pilih kategori untuk melihat aneka varian manis kami
          </p>
        </div>

        {/* Categories Bar (Mobile scrollable, desktop responsive grid) */}
        <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 no-scrollbar sm:grid sm:grid-cols-5 md:grid-cols-9 sm:gap-3 sm:overflow-visible sm:pb-0">
          
          {/* "Semua" Chip */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`flex flex-col items-center gap-2 shrink-0 p-3 rounded-2xl transition-all duration-300 w-24 sm:w-auto text-center group cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25 scale-105'
                : 'bg-stone-50 hover:bg-pink-50/60 text-stone-700 hover:text-pink-600'
            }`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
              selectedCategory === 'all' ? 'bg-white/20' : 'bg-white text-pink-500'
            }`}>
              <span className="text-2xl">✨</span>
            </div>
            <span className="text-xs font-bold whitespace-nowrap">Semua Menu</span>
          </button>

          {/* Dynamic Categories */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`flex flex-col items-center gap-2 shrink-0 p-3 rounded-2xl transition-all duration-300 w-24 sm:w-auto text-center group cursor-pointer ${
                  isSelected
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25 scale-105'
                    : 'bg-stone-50 hover:bg-pink-50/60 text-stone-700 hover:text-pink-600'
                }`}
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white shadow-xs p-0.5 relative group-hover:scale-105 transition-transform">
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-[10px]"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-pink-600/20 rounded-[10px]" />
                  )}
                </div>
                <span className="text-xs font-bold line-clamp-1 group-hover:text-inherit">
                  {cat.name}
                </span>
              </button>
            );
          })}

        </div>

      </div>
    </section>
  );
};
