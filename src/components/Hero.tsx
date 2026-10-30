import React from 'react';
import { ArrowRight, Sparkles, Heart, Award, Clock } from 'lucide-react';
import { WebsiteSettings } from '../types';

interface HeroProps {
  settings?: WebsiteSettings | null;
  onExploreClick: () => void;
  onOrderClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ settings, onExploreClick, onOrderClick }) => {
  const bannerTitle = settings?.banner_title || 'Manisnya Momen Istimewa Dimulai Dari Sini';
  const bannerSubtitle = settings?.banner_subtitle || 'Dibuat segar setiap hari dengan bahan-bahan premium import & cokelat Belgia berkualitas tinggi.';
  const bannerImage = settings?.banner_image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-pink-50/70 via-[#FFFDF9] to-white pt-6 pb-12 sm:pt-10 sm:pb-20">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-pink-200/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100/80 border border-pink-200/80 text-pink-700 text-xs sm:text-sm font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-pink-600 animate-pulse" />
              <span>Artisanal Handcrafted Patisserie</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight leading-[1.15]">
              {bannerTitle}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              {bannerSubtitle}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={onOrderClick}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-base shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/35 active:scale-95 transition-all flex items-center justify-center gap-2.5 group"
              >
                <span>Pesan Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onExploreClick}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-semibold text-base border border-stone-200/90 shadow-sm hover:border-pink-300 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Lihat Menu Lengkap</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-stone-100 grid grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center gap-2 text-stone-600">
                <Clock className="w-4 h-4 text-pink-500 shrink-0" />
                <span className="text-xs font-medium">Fresh Baked Daily</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600">
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-medium">100% Halal Ingredients</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600">
                <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-xs font-medium">Belgian Chocolate</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Photo Frame */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-pink-900/10 border-4 border-white bg-stone-100 aspect-[4/3] sm:aspect-square group">
                <img
                  src={bannerImage}
                  alt="Dessert Artisanal Delicia"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />

                {/* Bottom Overlay Label */}
                <div className="absolute bottom-4 left-4 right-4 text-white p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-pink-200 font-medium">Signature Collection</p>
                      <p className="text-sm font-bold font-display">Belgian Truffle & Shortcake</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-pink-500 text-white text-[11px] font-bold">
                      Best Seller ⭐ 4.9
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Review Badge */}
              <div className="absolute -top-4 -left-4 sm:-top-5 sm:-left-5 bg-white p-3 rounded-2xl shadow-lg border border-pink-100 flex items-center gap-2.5 animate-bounce-gentle">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">
                  ★
                </div>
                <div>
                  <p className="text-[11px] font-bold text-stone-800">4.9 / 5.0 Rating</p>
                  <p className="text-[10px] text-stone-500">2,500+ Pelanggan Puas</p>
                </div>
              </div>

              {/* Floating Delivery Tag */}
              <div className="absolute -bottom-4 -right-2 sm:-bottom-5 sm:-right-4 bg-white px-3.5 py-2.5 rounded-2xl shadow-lg border border-pink-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-stone-800">Bisa Kirim Hari Ini (Sameday)</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
