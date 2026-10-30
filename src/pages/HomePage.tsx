import React from 'react';
import { Hero } from '../components/Hero';
import { CategoryList } from '../components/CategoryList';
import { ProductCard } from '../components/ProductCard';
import { PromotionsSection } from '../components/PromotionsSection';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { Product, Category, Promotion, Testimonial, WebsiteSettings } from '../types';
import { Flame, ArrowRight, Sparkles, ShieldCheck, HeartHandshake } from 'lucide-react';

interface HomePageProps {
  categories: Category[];
  products: Product[];
  promotions: Promotion[];
  testimonials: Testimonial[];
  settings?: WebsiteSettings | null;
  onSelectCategory: (slug: string) => void;
  onViewProductDetail: (product: Product) => void;
  onNavigateToCatalog: () => void;
  onRefreshTestimonials?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  categories,
  products,
  promotions,
  testimonials,
  settings,
  onSelectCategory,
  onViewProductDetail,
  onNavigateToCatalog,
  onRefreshTestimonials
}) => {
  // Filter best sellers (or top 8 products)
  const bestSellers = products.filter(p => p.is_best_seller).slice(0, 8);
  const displayProducts = bestSellers.length > 0 ? bestSellers : products.slice(0, 8);

  return (
    <div className="space-y-4">
      {/* 1. Hero Section */}
      <Hero
        settings={settings}
        onExploreClick={onNavigateToCatalog}
        onOrderClick={onNavigateToCatalog}
      />

      {/* 2. Categories Horizontal Bar */}
      <CategoryList
        categories={categories}
        selectedCategory="all"
        onSelectCategory={(slug) => {
          onSelectCategory(slug);
          onNavigateToCatalog();
        }}
      />

      {/* 3. Best Seller Products Section */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-pink-600 text-xs font-bold uppercase tracking-wider mb-1.5">
              <Flame className="w-4 h-4 fill-current text-rose-500" />
              <span>Paling Banyak Dipesan</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Produk Terlaris Minggu Ini
            </h2>
          </div>

          <button
            onClick={onNavigateToCatalog}
            className="mt-3 sm:mt-0 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-pink-600 hover:text-pink-700 group self-start sm:self-auto"
          >
            <span>Lihat Semua ({products.length} Menu)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 2 columns on mobile, 3 on tablet, 4 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {displayProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onViewDetail={onViewProductDetail}
            />
          ))}
        </div>
      </section>

      {/* 4. Promotions & Discount Vouchers */}
      <PromotionsSection
        promotions={promotions}
        onOrderBundlingClick={onNavigateToCatalog}
      />

      {/* 5. Craftsmanship & Philosophy Feature Banner */}
      <section className="py-12 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-center sm:text-left">
            
            <div className="p-6 rounded-3xl bg-stone-800/60 border border-stone-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto sm:mx-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Artisanal Small Batches</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Setiap cake, brownies, dan cookies dipanggang setiap pagi dalam jumlah terbatas untuk memastikan kesegaran, kelembutan, dan aroma terbaik.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-stone-800/60 border border-stone-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto sm:mx-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">100% Bahan Halal & Premium</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Kami hanya memakai mentega New Zealand murni, cokelat Belgia Couverture murni, dan vanila Madagaskar tanpa pengawet sintetik.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-stone-800/60 border border-stone-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto sm:mx-0">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Pengiriman Instan & Aman</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Kemasan insulated food-grade dengan ice gel khusus memastikan kue sampai di tangan Anda dalam kondisi sempurna dan tetap dingin.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Customer Testimonials */}
      <TestimonialsSection
        testimonials={testimonials}
        onRefresh={onRefreshTestimonials}
      />
    </div>
  );
};
