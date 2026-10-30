import React, { useState } from 'react';
import { Gift, Copy, Check, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { Promotion } from '../types';
import { formatRupiah } from '../lib/utils';
import { useCart } from '../hooks/useCart';

interface PromotionsSectionProps {
  promotions: Promotion[];
  onOrderBundlingClick?: () => void;
}

export const PromotionsSection: React.FC<PromotionsSectionProps> = ({
  promotions,
  onOrderBundlingClick
}) => {
  const { applyCoupon, setIsCartOpen } = useCart();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyAndApply = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    applyCoupon(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <section className="py-12 bg-gradient-to-b from-pink-50/40 via-white to-pink-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-pink-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Gift className="w-4 h-4" />
            <span>Spesial Untuk Anda</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight">
            Promo Manis & Voucher Diskon
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-2">
            Gunakan voucher eksklusif saat checkout untuk mendapatkan potongan harga spesial setiap hari.
          </p>
        </div>

        {/* Voucher Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-10">
          {promotions.map((promo) => {
            const isPercentage = promo.discount_type === 'percentage';
            const isCopied = copiedCode === promo.code;

            return (
              <div
                key={promo.id}
                className="relative bg-white rounded-3xl p-5 border-2 border-pink-100 shadow-sm hover:shadow-lg hover:border-pink-300 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                {/* Decorative cutouts */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-pink-50/80 border-r border-pink-100" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-pink-50/80 border-l border-pink-100" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-extrabold uppercase">
                      <Tag className="w-3.5 h-3.5" />
                      {isPercentage ? `DISKON ${promo.discount_value}%` : `POTONGAN ${formatRupiah(promo.discount_value)}`}
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium">
                      Min. {formatRupiah(promo.min_purchase)}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-stone-900 group-hover:text-pink-600 transition-colors">
                    {promo.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                    {promo.description}
                  </p>
                </div>

                {/* Voucher Code Copy Action */}
                <div className="pt-5 mt-4 border-t border-dashed border-pink-200 flex items-center justify-between gap-3">
                  <div className="bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
                    <span className="font-mono font-extrabold text-sm text-stone-800 tracking-wider">
                      {promo.code}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyAndApply(promo.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-pink-500 hover:bg-pink-600 text-white active:scale-95'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin & Diterapkan</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Voucher</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Featured Bundling Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-stone-900 via-stone-800 to-rose-950 text-white p-6 sm:p-10 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3 text-center lg:text-left">
              <span className="px-3 py-1 rounded-full bg-pink-500/30 text-pink-300 text-xs font-bold border border-pink-400/30 uppercase tracking-wider inline-block">
                Paket Bundling Spesial Akhir Pekan
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold">
                Sweet Weekend Combo: Brownies & Cookies Deluxe
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm max-w-xl">
                Nikmati 1 Loyang Signature Fudgy Brownies + 1 Box NYC Chocochip Cookies dengan harga bundling hemat Rp 125.000 (Harga normal Rp 140.000). Pas untuk ngemil bareng keluarga tercinta!
              </p>
            </div>

            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <button
                onClick={() => {
                  if (onOrderBundlingClick) {
                    onOrderBundlingClick();
                  } else {
                    setIsCartOpen(true);
                  }
                }}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-pink-500/30 transition active:scale-95 flex items-center gap-2 group"
              >
                <span>Pesan Paket Bundling</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
