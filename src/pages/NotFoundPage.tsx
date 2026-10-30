import React from 'react';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md mx-auto space-y-5">
        <div className="w-24 h-24 rounded-3xl bg-pink-50 text-pink-500 flex items-center justify-center text-5xl mx-auto shadow-inner">
          🍪
        </div>
        <div className="space-y-2">
          <span className="text-pink-600 font-extrabold text-xs uppercase tracking-widest bg-pink-100 px-3 py-1 rounded-full">
            Error 404
          </span>
          <h2 className="font-display text-3xl font-bold text-stone-900">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 max-w-xs mx-auto leading-relaxed">
            Ups! Sepertinya kue atau halaman yang Anda cari sudah habis atau berpindah tempat.
          </p>
        </div>
        <button
          onClick={onGoHome}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95"
        >
          <Home className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>
      </div>
    </div>
  );
};
