import React, { useState } from 'react';
import { Shield, Lock, User, Eye, EyeOff, ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import { api, setAdminToken } from '../lib/api';
import { AdminUser } from '../types';

interface AdminLoginPageProps {
  onLoginSuccess: (admin: AdminUser) => void;
  onBackToStore: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onBackToStore }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await api.adminLogin({ username, password });
      setAdminToken(res.token);
      onLoginSuccess(res.admin);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal. Periksa username dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-stone-100 via-pink-50/30 to-white">
      <div className="w-full max-w-md bg-white rounded-3xl border border-pink-100 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        
        {/* Top Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToStore}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Toko</span>
          </button>

          <span className="text-[10px] uppercase font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-200">
            Admin Portal
          </span>
        </div>

        {/* Brand Icon & Heading */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-stone-900 text-white flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-7 h-7 text-pink-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-stone-900">
            Masuk ke Admin Dashboard
          </h2>
          <p className="text-xs text-stone-500">
            Kelola produk dessert, pesanan pelanggan, kategori, dan laporan penjualan
          </p>
        </div>

        {/* Demo Hint Banner */}
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-[11px] text-amber-800 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Akun Demo Bawaan:</span>
          </div>
          <p className="text-stone-600">
            Username: <strong className="font-mono text-stone-900">admin</strong> &nbsp;|&nbsp; 
            Password: <strong className="font-mono text-stone-900">admin123</strong>
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Username Admin
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username admin"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-hidden focus:border-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-hidden focus:border-pink-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-98 flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4 text-pink-400" />
            <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
