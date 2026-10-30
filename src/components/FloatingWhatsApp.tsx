import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { cleanPhoneNumber } from '../lib/utils';

interface FloatingWhatsAppProps {
  whatsappNumber?: string;
  storeName?: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  whatsappNumber = '6281234567890',
  storeName = 'Delicia Dessert'
}) => {
  const [showTooltip, setShowTooltip] = useState(true);

  const phone = cleanPhoneNumber(whatsappNumber);
  const defaultText = `Halo ${storeName}, saya ingin bertanya tentang menu dessert dan ketersediaan hari ini! ✨`;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(defaultText)}`;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-30 flex items-end gap-2.5">
      {/* Tooltip speech bubble */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl shadow-xl border border-emerald-100 text-xs text-stone-700 animate-fade-in relative">
          <span>Butuh bantuan atau pesanan khusus? Chat kami! 👋</span>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-stone-400 hover:text-stone-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-r border-t border-emerald-100 rotate-45" />
        </div>
      )}

      {/* WhatsApp Action Button */}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/35 hover:scale-110 active:scale-95 transition-all duration-300 relative group"
        aria-label="Hubungi Admin WhatsApp"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
        <MessageCircle className="w-7 h-7 sm:w-7.5 sm:h-7.5 fill-current" />
      </a>
    </div>
  );
};
