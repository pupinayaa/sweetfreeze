import React from 'react';
import { Star, Plus, Eye, Flame } from 'lucide-react';
import { Product } from '../types';
import { formatRupiah } from '../lib/utils';
import { useCart } from '../hooks/useCart';

interface ProductCardProps {
  product: Product;
  onViewDetail: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetail }) => {
  const { addToCart } = useCart();

  const isBestSeller = Boolean(product.is_best_seller);
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="group relative bg-white rounded-3xl border border-pink-100/80 shadow-xs hover:shadow-xl hover:border-pink-200 transition-all duration-300 flex flex-col overflow-hidden">
      
      {/* Product Image Frame */}
      <div 
        onClick={() => onViewDetail(product)}
        className="relative w-full aspect-square bg-stone-100 overflow-hidden cursor-pointer"
      >
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient Shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between pointer-events-none">
          {/* Best Seller Badge */}
          {isBestSeller && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-extrabold shadow-sm uppercase tracking-wider">
              <Flame className="w-3 h-3 fill-current" />
              Best Seller
            </span>
          )}

          {/* Discount Badge */}
          {hasDiscount && (
            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black shadow-sm">
              HEMAT {Math.round(((product.price - (product.discount_price || 0)) / product.price) * 100)}%
            </span>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-2 text-center">
            <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold shadow-md">
              Stok Habis
            </span>
          </div>
        )}

        {/* Quick View Button on Hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(product);
          }}
          className="hidden sm:flex absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs text-stone-800 items-center justify-center shadow-md opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all hover:bg-pink-50 hover:text-pink-600"
          title="Lihat Detail Produk"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
            <span className="font-semibold text-pink-600 uppercase tracking-wider truncate max-w-[120px]">
              {product.category_name || 'Dessert'}
            </span>
            <div className="flex items-center gap-1 font-bold text-amber-500 shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating?.toFixed(1) || '4.9'}</span>
              <span className="text-stone-400 text-[10px]">({product.reviews_count || 12})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 
            onClick={() => onViewDetail(product)}
            className="font-display font-bold text-sm sm:text-base text-stone-900 group-hover:text-pink-600 transition-colors line-clamp-1 cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-[11px] sm:text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="pt-3 mt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          
          {/* Price */}
          <div className="min-w-0">
            {hasDiscount ? (
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-xs text-stone-400 line-through">
                  {formatRupiah(product.price)}
                </span>
                <span className="font-extrabold text-sm sm:text-base text-pink-600">
                  {formatRupiah(product.discount_price)}
                </span>
              </div>
            ) : (
              <span className="font-extrabold text-sm sm:text-base text-stone-900">
                {formatRupiah(product.price)}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mobile View Detail Button */}
            <button
              onClick={() => onViewDetail(product)}
              className="sm:hidden p-2 rounded-xl text-stone-500 hover:text-pink-600 hover:bg-pink-50"
              title="Detail"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Add to Cart Button */}
            <button
              disabled={isOutOfStock}
              onClick={() => addToCart(product, 1)}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 shadow-xs ${
                isOutOfStock
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-pink-500 hover:bg-pink-600 text-white shadow-pink-500/20 hover:shadow-md'
              }`}
              title="Tambah ke Keranjang"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Pesan</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
