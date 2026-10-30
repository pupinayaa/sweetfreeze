import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'banner' | 'pill' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className="bg-gradient-to-r from-pink-500 to-rose-400 text-white p-3 rounded-2xl flex items-center justify-between shadow-md mb-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">Pasang Aplikasi Delicia</p>
              <p className="text-xs text-pink-100">Akses lebih cepat langsung dari layar HP Anda</p>
            </div>
          </div>
          <button
            onClick={install}
            className="px-3.5 py-1.5 bg-white text-pink-600 rounded-xl text-xs font-bold shadow hover:bg-pink-50 transition active:scale-95 shrink-0"
          >
            Pasang
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-semibold transition active:scale-95 shadow-sm border border-pink-200"
        title="Pasang Aplikasi ke Layar Utama"
      >
        <Download className="w-3.5 h-3.5 text-pink-600" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-medium transition border border-pink-200"
          title="Pasang di iPhone/iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl relative border border-pink-100">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <img src="/icon.svg" alt="Dessert Shop" className="w-12 h-12 rounded-2xl shadow-sm" />
                <div>
                  <h3 className="font-bold text-base text-stone-900">Install Delicia di iPhone</h3>
                  <p className="text-xs text-stone-500">Nikmati pemesanan instan tanpa download App Store</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-stone-700 bg-pink-50/60 p-4 rounded-2xl mb-5 border border-pink-100/70">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                  <p>Tekan tombol <strong>Share</strong> (ikon kotak dengan panah ke atas) di bilah bawah browser Safari.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                  <p>Gulir menu ke bawah lalu pilih <strong>Add to Home Screen (Tambahkan ke Layar Utama)</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                  <p>Tekan tombol <strong>Add (Tambah)</strong> di sudut kanan atas. Selesai! 🎉</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold transition active:scale-98"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
