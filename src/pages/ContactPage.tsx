import React, { useState } from 'react';
import { MapPin, Phone, Clock, Instagram, Send, CheckCircle2 } from 'lucide-react';
import { WebsiteSettings } from '../types';
import { cleanPhoneNumber } from '../lib/utils';

interface ContactPageProps {
  settings?: WebsiteSettings | null;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings }) => {
  const storeName = settings?.store_name || 'Delicia Dessert & Patisserie';
  const address = settings?.address || 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan 12190';
  const whatsapp = settings?.whatsapp_number || '6281234567890';
  const instagram = settings?.instagram || '@deliciadessert';
  const tiktok = settings?.tiktok || '@delicia_patisserie';
  const hours = settings?.operational_hours || 'Senin - Minggu: 08.00 - 21.30 WIB';

  const cleanedPhone = cleanPhoneNumber(whatsapp);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message) return;

    const waText = `Halo ${storeName}, perkenalkan saya ${name} (${phone || 'Pelanggan'}):\n\n${message}`;
    window.open(`https://wa.me/${cleanedPhone}?text=${encodeURIComponent(waText)}`, '_blank');
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setName('');
      setPhone('');
      setMessage('');
    }, 2000);
  };

  return (
    <div className="py-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
          Hubungi & Kunjungi Toko Kami
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-lg mx-auto">
          Punya pertanyaan seputar katering acara, custom wedding/birthday cake, atau pesanan korporat? Kami siap melayani Anda!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Contact Cards */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Card 1: Address */}
          <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-xs flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900">Alamat Butik & Toko</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">{address}</p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-pink-600 hover:underline mt-2 inline-block"
              >
                Buka di Google Maps →
              </a>
            </div>
          </div>

          {/* Card 2: WhatsApp */}
          <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-xs flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900">WhatsApp Resmi</h3>
              <p className="text-xs text-stone-600 mt-1">Layanan pelanggan cepat & reservasi kue</p>
              <a
                href={`https://wa.me/${cleanedPhone}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-emerald-600 hover:underline mt-1 inline-block"
              >
                +{cleanedPhone} (Klik untuk Chat)
              </a>
            </div>
          </div>

          {/* Card 3: Hours */}
          <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-xs flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900">Jam Operasional</h3>
              <p className="text-xs text-stone-600 mt-1">{hours}</p>
              <span className="text-[11px] text-emerald-600 font-medium block mt-1">
                Melayani Pick-up & Delivery Sameday
              </span>
            </div>
          </div>

          {/* Card 4: Social */}
          <div className="p-5 rounded-3xl bg-white border border-pink-100 shadow-xs flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900">Media Sosial</h3>
              <div className="flex gap-4 mt-1 text-xs">
                <a href={`https://instagram.com/${instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline font-semibold">
                  {instagram}
                </a>
                <a href={`https://tiktok.com/@${tiktok.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-stone-700 hover:underline font-semibold">
                  {tiktok}
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Direct Message Form via WhatsApp */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-xl text-stone-900">
              Kirim Pesan atau Pertanyaan
            </h3>
            <p className="text-xs text-stone-500">
              Pesan akan otomatis dialihkan ke WhatsApp resmi kami agar dapat segera direspon oleh staf toko.
            </p>
          </div>

          {sent ? (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl text-emerald-700 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto" />
              <p className="font-bold text-sm">Pesan Anda sedang dibuka di WhatsApp!</p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-3.5 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Nama Anda *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Maya"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-hidden focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-hidden focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Pesan atau Permintaan Khusus *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ceritakan kebutuhan dessert Anda, tanggal pengiriman yang diinginkan, dsb..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-hidden focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-98 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Pesan ke WhatsApp Toko</span>
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
};
