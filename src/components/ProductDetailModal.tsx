import React, { useState } from 'react';
import { X, Star, Plus, Minus, ShoppingBag, ShieldCheck, Heart, Share2, Flame, Check } from 'lucide-react';
import { Product } from '../types';
import { formatRupiah, cleanPhoneNumber } from '../lib/utils';
import { useCart } from '../hooks/useCart';

interface ProductDetailModalProps {
  product: Product | null;
  relatedProducts?: Product[];
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  storeWhatsApp?: string;
  storeName?: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  relatedProducts = [],
  onClose,
  onSelectProduct,
  storeWhatsApp = '6281234567890',
  storeName = 'Delicia Dessert'
}) => {
  const { addToCart, setIsCartOpen } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);

  if (!product) return null;

  const effectivePrice = product.discount_price ?? product.price;
  const isOutOfStock = product.stock <= 0;
  const totalPrice = effectivePrice * quantity;

  const handleAddToCart = () => {
    addToCart(product, quantity, note);
    onClose();
  };

  const handleDirectWhatsApp = () => {
    const phone = cleanPhoneNumber(storeWhatsApp);
    const msg = `Halo ${storeName}, saya ingin memesan langsung:\n\n*${product.name}*\nJumlah: ${quantity}x\nTotal: ${formatRupiah(totalPrice)}${note ? `\nCatatan: "${note}"` : ''}\n\nApakah stok masih tersedia hari ini? Terima kasih!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Lihat dessert lezat ini di ${storeName}: ${product.name}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-100 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Sticky Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs text-stone-700 hover:text-stone-950 flex items-center justify-center shadow-md hover:bg-stone-100 transition active:scale-95"
          aria-label="Tutup Detail"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto no-scrollbar flex-1 p-5 sm:p-7 space-y-6">
          
          {/* Main Visual & Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            
            {/* Image Frame */}
            <div className="relative rounded-2xl overflow-hidden bg-stone-100 aspect-square shadow-inner border border-stone-100">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {product.is_best_seller ? (
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-extrabold shadow-sm uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  Best Seller
                </span>
              ) : null}

              {product.discount_price && (
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-black shadow-md">
                  DISKON
                </span>
              )}
            </div>

            {/* Info Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">
                  {product.category_name || 'Dessert Artisanal'}
                </span>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-800 bg-stone-50 px-2.5 py-1 rounded-lg"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin' : 'Bagikan'}</span>
                </button>
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
                {product.name}
              </h2>

              {/* Rating & Stock */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 font-bold text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{product.rating?.toFixed(1) || '4.9'}</span>
                  <span className="text-stone-400 font-normal">({product.reviews_count || 15} Ulasan)</span>
                </div>
                <span className="text-stone-300">•</span>
                <span className={`font-semibold ${isOutOfStock ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {isOutOfStock ? 'Stok Habis' : `Tersedia (${product.stock} porsi)`}
                </span>
              </div>

              {/* Price display */}
              <div className="pt-2">
                {product.discount_price ? (
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl font-black text-pink-600">
                      {formatRupiah(product.discount_price)}
                    </span>
                    <span className="text-sm text-stone-400 line-through">
                      {formatRupiah(product.price)}
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl font-black text-stone-900">
                    {formatRupiah(product.price)}
                  </span>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="pt-3">
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Jumlah Pesanan:
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-stone-200 rounded-2xl bg-stone-50 p-1">
                    <button
                      type="button"
                      disabled={quantity <= 1 || isOutOfStock}
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-xl bg-white text-stone-700 flex items-center justify-center hover:bg-pink-50 hover:text-pink-600 disabled:opacity-40 transition shadow-2xs"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-stone-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= product.stock || isOutOfStock}
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-8 h-8 rounded-xl bg-white text-stone-700 flex items-center justify-center hover:bg-pink-50 hover:text-pink-600 disabled:opacity-40 transition shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-stone-500">
                    Subtotal: <strong className="text-stone-900">{formatRupiah(totalPrice)}</strong>
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Description */}
          <div className="border-t border-stone-100 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Deskripsi & Rasa
            </h4>
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Order Note (e.g. Birthday custom candle or greeting) */}
          <div className="border-t border-stone-100 pt-4">
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Catatan Khusus (Opsional):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Tolong beri lilin ulang tahun & kartu ucapan 'Happy Birthday Budi'..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-hidden focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
            />
          </div>

          {/* Related Recommendations */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-stone-100 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                Menu Rekomendasi Lainnya
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {relatedProducts.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectProduct(rel)}
                    className="p-2 rounded-2xl bg-stone-50 hover:bg-pink-50/50 border border-stone-100 cursor-pointer transition group"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-white mb-1.5">
                      <img src={rel.image_url} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <p className="text-[11px] font-bold text-stone-800 line-clamp-1 group-hover:text-pink-600">
                      {rel.name}
                    </p>
                    <p className="text-[10px] text-pink-600 font-semibold">
                      {formatRupiah(rel.discount_price ?? rel.price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="hidden sm:block">
            <p className="text-xs text-stone-500">Total Harga:</p>
            <p className="text-lg font-black text-stone-900">{formatRupiah(totalPrice)}</p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* WhatsApp Quick Order */}
            <button
              onClick={handleDirectWhatsApp}
              disabled={isOutOfStock}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Chat WA Langsung</span>
            </button>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-pink-500/25 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>+ Keranjang</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
