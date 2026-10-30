import React from 'react';
import { Heart, Sparkles, Award, Users, CheckCircle, Cake } from 'lucide-react';
import { WebsiteSettings } from '../types';

interface AboutPageProps {
  settings?: WebsiteSettings | null;
  onNavigateToCatalog: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ settings, onNavigateToCatalog }) => {
  const storeName = settings?.store_name || 'Delicia Dessert & Patisserie';

  return (
    <div className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Header Banner */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold uppercase tracking-wider">
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span>Cerita & Dedikasi Kami</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight">
          Menghadirkan Kebahagiaan Lewat Setiap Gigitan Manis
        </h1>
        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {settings?.business_description || 'Delicia Dessert berawal dari kecintaan tulus terhadap seni patisserie artisanal dan keinginan menyajikan dessert berstandar hotel bintang lima langsung ke meja Anda.'}
        </p>
      </div>

      {/* Story Visual Frame */}
      <div className="rounded-3xl overflow-hidden shadow-xl aspect-video relative">
        <img
          src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80"
          alt="Baking with passion"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent flex items-end p-6 sm:p-10 text-white">
          <div>
            <span className="text-xs uppercase tracking-widest text-pink-300 font-bold block mb-1">
              Handmade Daily
            </span>
            <p className="font-display text-xl sm:text-2xl font-bold">
              Bahan Berkualitas Tinggi, Tanpa Kompromi
            </p>
          </div>
        </div>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-pink-100 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-stone-900">Bahan Alami Pilihan</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Hanya menggunakan butter New Zealand grass-fed, couverture Belgian chocolate 70%, dan vanila Madagaskar asli tanpa pemanis buatan berlebih.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-pink-100 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-stone-900">Resep Artisan Orisinal</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Setiap resep dikembangkan dan diuji ratusan kali oleh pastry chef kami agar menghasilkan tekstur sempurna, aroma wangi, dan rasa manis yang seimbang.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-pink-100 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-stone-900">Pelayanan Hangat</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Pesanan Anda kami kemas dengan sangat hati-hati menggunakan box tebal berpita eksklusif, siap menjadi bingkisan manis untuk orang-orang tersayang.
          </p>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-8 sm:p-10 rounded-3xl bg-pink-500 text-white text-center space-y-4 shadow-lg shadow-pink-500/20">
        <Cake className="w-10 h-10 mx-auto text-pink-200" />
        <h3 className="font-display text-2xl sm:text-3xl font-bold">
          Ingin Mencoba Menu Spesial Kami?
        </h3>
        <p className="text-xs sm:text-sm text-pink-100 max-w-md mx-auto">
          Pesan sekarang juga dan rasakan kelembutan dessert premium kami langsung di rumah Anda.
        </p>
        <button
          onClick={onNavigateToCatalog}
          className="px-7 py-3 rounded-2xl bg-white text-pink-600 font-bold text-xs sm:text-sm shadow-md hover:bg-pink-50 transition active:scale-95"
        >
          Lihat Menu & Pesan
        </button>
      </div>

    </div>
  );
};
