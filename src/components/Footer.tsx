import React from 'react';
import { MapPin, Phone, Clock, Instagram, Shield, Heart } from 'lucide-react';
import { WebsiteSettings } from '../types';
import { cleanPhoneNumber } from '../lib/utils';

interface FooterProps {
  settings?: WebsiteSettings | null;
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  const storeName = settings?.store_name || 'Delicia Dessert & Patisserie';
  const address = settings?.address || 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan 12190';
  const whatsapp = settings?.whatsapp_number || '6281234567890';
  const instagram = settings?.instagram || '@deliciadessert';
  const tiktok = settings?.tiktok || '@delicia_patisserie';
  const hours = settings?.operational_hours || 'Senin - Minggu: 08.00 - 21.30 WIB';
  const description = settings?.business_description || 'Butik patisserie modern yang menghadirkan pengalaman menikmati hidangan penutup premium dengan bahan berkualitas tinggi.';

  const cleanedPhone = cleanPhoneNumber(whatsapp);

  return (
    <footer className="bg-stone-900 text-stone-300 pt-14 pb-20 md:pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-stone-800">
          
          {/* Brand Col (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 p-0.5 shadow-md">
                <div className="w-full h-full bg-stone-900 rounded-[14px] flex items-center justify-center">
                  <img src="/icon.svg" alt="Delicia" className="w-6 h-6" />
                </div>
              </div>
              <div>
                <span className="font-display font-bold text-xl text-white block">
                  {storeName}
                </span>
                <span className="text-[11px] text-pink-400 uppercase tracking-widest font-semibold block">
                  Artisanal Patisserie & Bakery
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm">
              {description}
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={`https://instagram.com/${instagram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-pink-600 text-stone-300 hover:text-white flex items-center justify-center transition shadow-xs"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>

              <a
                href={`https://tiktok.com/@${tiktok.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition shadow-xs text-xs font-bold"
                title="TikTok"
              >
                TT
              </a>

              <a
                href={`https://wa.me/${cleanedPhone}`}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-emerald-600 text-stone-300 hover:text-white flex items-center justify-center transition shadow-xs"
                title="WhatsApp Chat"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Menu */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-pink-400 transition">
                  Beranda
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog')} className="hover:text-pink-400 transition">
                  Katalog Menu Lengkap
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-pink-400 transition">
                  Tentang Patisserie Kami
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-pink-400 transition">
                  Lokasi & Kontak Toko
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="text-stone-400 hover:text-pink-400 transition flex items-center gap-1.5 pt-1">
                  <Shield className="w-3.5 h-3.5 text-pink-500" />
                  <span>Portal Admin</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Dessert Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Kategori Terlaris
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>Signature Belgian Cakes</li>
              <li>Classic Fudgy Brownies</li>
              <li>NYC Chocochip Cookies</li>
              <li>Dessert Box Layers</li>
              <li>Brioche Bomboloni Donuts</li>
              <li>Custom Birthday Cakes</li>
              <li>Gift & Holiday Hampers</li>
            </ul>
          </div>

          {/* Store Info & Contacts */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Informasi Toko
            </h4>
            <div className="space-y-2.5 text-xs text-stone-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`https://wa.me/${cleanedPhone}`} target="_blank" rel="noreferrer" className="hover:text-white">
                  +{cleanedPhone}
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{hours}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-3">
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Handcrafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for dessert lovers everywhere</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
