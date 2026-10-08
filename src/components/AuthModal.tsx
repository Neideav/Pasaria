import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, Info, Check } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  message?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  message,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const data = await api.login(username.trim(), password);
      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await api.register({
        name: regName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Pendaftaran gagal. Pastikan email belum pernah terdaftar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 border border-slate-100 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-7 h-7 rounded-xl bg-emerald-50 text-[#003d29] flex items-center justify-center font-black text-sm">
              P
            </span>
            <span className="font-black text-[#003d29] text-sm tracking-wider">PASARIA</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {tab === 'login' ? 'Masuk ke Akun Anda' : 'Daftar Akun Baru'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            {tab === 'login'
              ? 'Akses pesanan, pelacakan resi, wishlist, dan toko Anda.'
              : 'Bergabunglah bersama ribuan pembeli dan seller terpercaya di PASARIA.'}
          </p>
        </div>

        {/* Notice message */}
        {message && !errorMsg && (
          <div className="p-3.5 mb-5 rounded-2xl bg-[#003d29]/5 border border-[#003d29]/20 text-[#003d29] text-xs font-medium flex items-center gap-3 shadow-2xs animate-in fade-in">
            <div className="w-6 h-6 rounded-full bg-[#003d29]/10 flex items-center justify-center shrink-0 text-[#003d29]">
              <Info className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="leading-relaxed">{message}</span>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Email atau Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="customer@pasaria.id"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#003d29]"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700">Kata Sandi</label>
                <span className="text-[11px] text-[#003d29] hover:underline cursor-pointer">
                  Lupa Sandi?
                </span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#003d29]"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-full font-bold text-xs sm:text-sm text-white bg-[#003d29] hover:bg-[#064e3b] transition-all shadow-md shadow-emerald-950/10 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Memproses Masuk...' : 'Masuk ke PASARIA'}
            </button>

            <div className="text-center pt-3 text-slate-500">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMsg('');
                }}
                className="font-bold text-[#003d29] hover:underline cursor-pointer"
              >
                Daftar Sekarang
              </button>
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Budi Santoso"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="budisantoso"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="budi@example.com"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kata Sandi</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ulangi Sandi</label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-full font-bold text-xs sm:text-sm text-white bg-[#003d29] hover:bg-[#064e3b] transition-all shadow-md shadow-emerald-950/10 cursor-pointer disabled:opacity-50 mt-3"
            >
              {loading ? 'Mendaftarkan...' : 'Buat Akun Baru'}
            </button>

            <div className="text-center pt-2 text-slate-500">
              Sudah memiliki akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg('');
                }}
                className="font-bold text-[#003d29] hover:underline cursor-pointer"
              >
                Masuk di Sini
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
