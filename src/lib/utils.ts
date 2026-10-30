export function formatRupiah(value: number | string | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 'Rp 0';
  }
  return 'Rp ' + Number(value).toLocaleString('id-ID');
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export interface WhatsAppOrderMessageParams {
  orderNumber: string;
  storeName: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: 'delivery' | 'pickup';
  deliveryAddress?: string;
  notes?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  total: number;
}

export function generateWhatsAppCheckoutLink(
  storeWhatsApp: string,
  data: WhatsAppOrderMessageParams
): string {
  const targetPhone = cleanPhoneNumber(storeWhatsApp || '6281234567890');

  let text = `*PESANAN BARU - ${data.storeName.toUpperCase()}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📋 *No. Pesanan:* #${data.orderNumber}\n`;
  text += `👤 *Nama:* ${data.customerName}\n`;
  text += `📱 *WhatsApp:* ${data.customerPhone}\n`;
  text += `🚚 *Metode:* ${data.deliveryMethod === 'delivery' ? 'Pengiriman (Delivery)' : 'Ambil di Toko (Pick-up)'}\n`;

  if (data.deliveryMethod === 'delivery' && data.deliveryAddress) {
    text += `📍 *Alamat:* ${data.deliveryAddress}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*DETAIL DESSERT:*\n`;

  data.items.forEach((item, index) => {
    text += `${index + 1}. *${item.name}*\n`;
    text += `   ${item.quantity}x @ ${formatRupiah(item.price)} = *${formatRupiah(item.total)}*\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*Subtotal:* ${formatRupiah(data.subtotal)}\n`;

  if (data.discountAmount > 0) {
    text += `🎁 *Diskon (${data.couponCode || 'Promo'}):* -${formatRupiah(data.discountAmount)}\n`;
  }

  text += `💰 *TOTAL PEMBAYARAN:* *${formatRupiah(data.total)}*\n`;

  if (data.notes && data.notes.trim()) {
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📝 *Catatan Tambahan:*\n"${data.notes.trim()}"\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Mohon konfirmasi ketersediaan dan nomor rekening/QRIS untuk pembayaran. Terima kasih banyak! ✨`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}
