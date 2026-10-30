import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Promotion } from '../types';
import { api } from '../lib/api';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, note?: string) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  coupon: Promotion | null;
  discountAmount: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  subtotal: number;
  total: number;
  totalCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('dessert_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [coupon, setCoupon] = useState<Promotion | null>(() => {
    try {
      const saved = localStorage.getItem('dessert_cart_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dessert_cart_items', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      if (coupon) {
        localStorage.setItem('dessert_cart_coupon', JSON.stringify(coupon));
      } else {
        localStorage.removeItem('dessert_cart_coupon');
      }
    } catch (e) {
      console.error('Failed to save coupon', e);
    }
  }, [coupon]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  };

  const addToCart = (product: Product, quantity = 1, note = '') => {
    setItems(prevItems => {
      const existing = prevItems.find(it => it.product.id === product.id);
      if (existing) {
        return prevItems.map(it =>
          it.product.id === product.id
            ? { ...it, quantity: it.quantity + quantity, note: note || it.note }
            : it
        );
      }
      return [...prevItems, { product, quantity, note }];
    });
    showToast(`✓ "${product.name}" ditambahkan ke keranjang`);
  };

  const removeFromCart = (productId: number) => {
    setItems(prev => prev.filter(it => it.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(it => (it.product.id === productId ? { ...it, quantity } : it))
    );
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
  };

  // Subtotal calculation
  const subtotal = items.reduce((sum, it) => {
    const effectivePrice = it.product.discount_price ?? it.product.price;
    return sum + effectivePrice * it.quantity;
  }, 0);

  // Total items counter
  const totalCount = items.reduce((sum, it) => sum + it.quantity, 0);

  // Calculate discount based on active coupon
  let discountAmount = 0;
  if (coupon && subtotal >= (coupon.min_purchase || 0)) {
    if (coupon.discount_type === 'percentage') {
      discountAmount = Math.round((subtotal * coupon.discount_value) / 100);
    } else {
      discountAmount = coupon.discount_value;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const total = Math.max(0, subtotal - discountAmount);

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!code.trim()) {
      return { success: false, message: 'Masukkan kode voucher terlebih dahulu.' };
    }
    try {
      const res = await api.validatePromo(code.trim(), subtotal);
      if (res.valid) {
        setCoupon({
          id: 0,
          code: res.promo.code,
          title: res.promo.title,
          description: '',
          discount_type: res.promo.discount_type,
          discount_value: res.promo.discount_value,
          min_purchase: 0,
          start_date: '',
          end_date: '',
          is_active: 1,
          usage_count: 0
        });
        showToast(`🎉 Voucher ${res.promo.code} berhasil digunakan!`);
        return { success: true, message: `Voucher berhasil diterapkan!` };
      }
      return { success: false, message: 'Voucher tidak valid.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal menggunakan voucher.' };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    showToast('Voucher dihapus');
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        coupon,
        discountAmount,
        applyCoupon,
        removeCoupon,
        subtotal,
        total,
        totalCount,
        isCartOpen,
        setIsCartOpen,
        toastMessage,
        showToast
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
