import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle2, Ticket, Sparkles, Send } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { formatRupiah, generateWhatsAppCheckoutLink } from '../lib/utils';
import { api } from '../lib/api';
import { WebsiteSettings } from '../types';

interface CartDrawerProps {
  settings?: WebsiteSettings | null;
  onOrderSuccess?: (orderNumber: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ settings, onOrderSuccess }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    discountAmount,
    total,
    coupon,
    applyCoupon,
    removeCoupon,
    showToast
  } = useCart();

  // Checkout form states
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('dessert_cust_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('dessert_cust_phone') || '');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState(() => localStorage.getItem('dessert_cust_address') || '');
  const [orderNotes, setOrderNotes] = useState('');
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState('');

  if (!isCartOpen) return null;

  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError('');
    const res = await applyCoupon(voucherInput);
    if (!res.success) {
      setVoucherError(res.message);
    } else {
      setVoucherInput('');
    }
  };

  const handleCheckoutWhatsApp = async () => {
    if (!customerName.trim()) {
      showToast('Mohon isi nama lengkap Anda.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 8) {
      showToast('Mohon isi nomor WhatsApp yang valid.');
      return;
    }
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      showToast('Mohon isi alamat pengiriman lengkap.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Save customer details to localStorage for future orders
      localStorage.setItem('dessert_cust_name', customerName.trim());
      localStorage.setItem('dessert_cust_phone', customerPhone.trim());
      if (deliveryAddress.trim()) {
        localStorage.setItem('dessert_cust_address', deliveryAddress.trim());
      }

      // 2. Prepare payload for real backend database order
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        delivery_method: deliveryMethod,
        delivery_address: deliveryMethod === 'delivery' ? deliveryAddress.trim() : 'Ambil di Toko',
        notes: orderNotes.trim() || undefined,
        coupon_code: coupon ? coupon.code : undefined,
        discount_amount: discountAmount,
        payment_method: 'WhatsApp / Transfer',
        items: items.map(it => ({
          product_id: it.product.id,
          product_name: it.product.name,
          price: it.product.discount_price ?? it.product.price,
          quantity: it.quantity,
          image_url: it.product.image_url
        }))
      };

      // 3. Save to database
      const response = await api.createOrder(payload);
      const createdOrder = response.order;
      setCompletedOrderNumber(createdOrder.order_number);

      // 4. Generate formatted WhatsApp link
      const storeWhatsApp = settings?.whatsapp_number || '6281234567890';
      const storeName = settings?.store_name || 'Delicia Dessert';

      const waUrl = generateWhatsAppCheckoutLink(storeWhatsApp, {
        orderNumber: createdOrder.order_number,
        storeName,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryMethod,
        deliveryAddress: deliveryAddress.trim(),
        notes: orderNotes.trim(),
        items: items.map(it => ({
          name: it.product.name + (it.note ? ` (${it.note})` : ''),
          quantity: it.quantity,
          price: it.product.discount_price ?? it.product.price,
          total: (it.product.discount_price ?? it.product.price) * it.quantity
        })),
        subtotal,
        discountAmount,
        couponCode: coupon?.code,
        total
      });

      // 5. Open WhatsApp in new tab
      window.open(waUrl, '_blank');

      // 6. Transition to Success view & clear cart
      clearCart();
      setStep('success');
      if (onOrderSuccess) onOrderSuccess(createdOrder.order_number);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal memproses pesanan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCartOpen(false);
    setTimeout(() => {
      setStep('cart');
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-pink-100 flex items-center justify-between bg-pink-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-stone-900">
                {step === 'cart' && 'Keranjang Belanja'}
                {step === 'checkout' && 'Konfirmasi & Checkout'}
                {step === 'success' && 'Pesanan Berhasil!'}
              </h2>
              <p className="text-[11px] text-stone-500">
                {step === 'cart' && `${items.length} jenis hidangan`}
                {step === 'checkout' && 'Lengkapi data pengiriman'}
                {step === 'success' && 'Terima kasih atas pesanan Anda'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-4">
          
          {/* STEP 1: CART LIST */}
          {step === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center text-4xl">
                    🍰
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-stone-800">Keranjang Masih Kosong</h3>
                    <p className="text-xs text-stone-500 max-w-xs mt-1">
                      Belum ada hidangan dessert manis yang Anda pilih. Yuk temukan menu favorit Anda!
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold shadow-md shadow-pink-500/20 active:scale-95 transition"
                  >
                    Mulai Belanja
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((it) => {
                    const price = it.product.discount_price ?? it.product.price;
                    return (
                      <div
                        key={it.product.id}
                        className="flex gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-100/80 items-center justify-between"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-stone-200/60">
                          <img
                            src={it.product.image_url}
                            alt={it.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                            {it.product.name}
                          </h4>
                          <p className="text-xs font-semibold text-pink-600">
                            {formatRupiah(price)}
                          </p>
                          {it.note && (
                            <p className="text-[10px] text-stone-500 italic truncate mt-0.5">
                              Note: {it.note}
                            </p>
                          )}

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center border border-stone-200 rounded-lg bg-white">
                              <button
                                onClick={() => updateQuantity(it.product.id, it.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center text-stone-500 hover:text-pink-600"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-stone-800">
                                {it.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(it.product.id, it.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center text-stone-500 hover:text-pink-600"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-[11px] font-bold text-stone-700">
                              = {formatRupiah(price * it.quantity)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromCart(it.product.id)}
                          className="p-2 text-stone-400 hover:text-rose-500 transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Voucher Section */}
                  <div className="pt-2">
                    <form onSubmit={handleApplyVoucher} className="space-y-2">
                      <label className="block text-xs font-bold text-stone-700">
                        Punya Kode Voucher Promo?
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Ticket className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            value={voucherInput}
                            onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                            placeholder="Contoh: MANIS10 / SWEETDEAL"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs uppercase font-semibold focus:outline-hidden focus:border-pink-500"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition"
                        >
                          Pakai
                        </button>
                      </div>
                      {voucherError && (
                        <p className="text-[11px] text-rose-500 font-medium">{voucherError}</p>
                      )}
                    </form>

                    {coupon && (
                      <div className="mt-2 p-2.5 rounded-xl bg-pink-50 border border-pink-200/70 flex items-center justify-between text-xs text-pink-700">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-pink-600" />
                          <span>Voucher <strong>{coupon.code}</strong> aktif!</span>
                        </div>
                        <button
                          onClick={removeCoupon}
                          className="text-[11px] font-bold text-rose-600 hover:underline"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 2: CHECKOUT FORM */}
          {step === 'checkout' && (
            <div className="space-y-4">
              {/* Delivery method toggle */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  Metode Penerimaan:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('delivery')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      deliveryMethod === 'delivery'
                        ? 'border-pink-500 bg-pink-50 text-pink-700 ring-1 ring-pink-500'
                        : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    <span>🚚 Pengiriman</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      deliveryMethod === 'pickup'
                        ? 'border-pink-500 bg-pink-50 text-pink-700 ring-1 ring-pink-500'
                        : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    <span>🏪 Ambil di Toko</span>
                  </button>
                </div>
              </div>

              {/* Customer Info Form */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nama Pemesan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-hidden focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nomor WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-hidden focus:border-pink-500"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Kami akan menghubungi nomor ini untuk konfirmasi pesanan.</p>
                </div>

                {deliveryMethod === 'delivery' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Alamat Pengiriman Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Nama jalan, nomor rumah/gedung, RT/RW, kelurahan, kecamatan, kota..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-hidden focus:border-pink-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Catatan Pesanan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Contoh: Lilin ultah, pita gold, jam pengiriman..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-hidden focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Order Mini Summary */}
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal ({items.length} menu)</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-pink-600 font-semibold">
                    <span>Diskon ({coupon?.code})</span>
                    <span>-{formatRupiah(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-stone-200 pt-2 flex justify-between font-bold text-stone-900 text-sm">
                  <span>Total Bayar</span>
                  <span className="text-pink-600 font-extrabold">{formatRupiah(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-stone-900">
                  Pesanan Berhasil Dicatat!
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Nomor Pesanan: <strong className="text-stone-900 font-mono">#{completedOrderNumber}</strong>
                </p>
                <p className="text-xs text-stone-600 max-w-xs mx-auto mt-2 leading-relaxed">
                  WhatsApp Anda telah dibuka untuk mengirimkan detail pesanan ke admin toko kami. Mohon tunggu konfirmasi ketersediaan & pembayaran.
                </p>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <button
                  onClick={handleClose}
                  className="w-full py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition shadow-md"
                >
                  Selesai & Lanjut Belanja
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Drawer Footer Actions */}
        {items.length > 0 && step !== 'success' && (
          <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-100 space-y-3">
            
            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900">{formatRupiah(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-pink-600 font-bold">
                  <span>Potongan Diskon</span>
                  <span>-{formatRupiah(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm sm:text-base font-extrabold text-stone-900 pt-1 border-t border-stone-200">
                <span>Total Pembayaran</span>
                <span className="text-pink-600">{formatRupiah(total)}</span>
              </div>
            </div>

            {/* Step navigation buttons */}
            {step === 'cart' ? (
              <button
                onClick={() => setStep('checkout')}
                className="w-full py-3.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm shadow-md shadow-pink-500/25 transition active:scale-98 flex items-center justify-center gap-2"
              >
                <span>Lanjut ke Pengiriman</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="px-4 py-3.5 rounded-2xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold transition"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCheckoutWhatsApp}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition active:scale-98 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memproses...' : 'Checkout via WhatsApp'}</span>
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
