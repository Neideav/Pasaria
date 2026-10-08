import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, Info, Check, Eye, EyeOff } from 'lucide-react';
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
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap and Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 border border-slate-100 text-left"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup modal autentikasi"
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29]"
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
          <h2 id="auth-modal-title" className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
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
          <div role="alert" className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label htmlFor="auth-login-identifier" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Email atau Username
              </label>
              <div className="relative">
                <input
                  id="auth-login-identifier"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="customer@pasaria.id"
                  autoComplete="username"
                  required
                  className="w-full min-h-[44px] pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29] transition-all"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="auth-login-password" className="text-[11px] font-semibold text-slate-700">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  className="text-[11px] text-[#003d29] hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] rounded"
                >
                  Lupa Sandi?
                </button>
              </div>
              <div className="relative">
                <input
                  id="auth-login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full min-h-[44px] pl-9 pr-11 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29] transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  aria-label={showLoginPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] rounded p-1.5 transition-colors cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] py-3 px-4 rounded-full font-bold text-xs sm:text-sm text-white bg-[#003d29] hover:bg-[#064e3b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] transition-all shadow-md shadow-emerald-950/10 cursor-pointer disabled:opacity-50 mt-2"
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
                className="font-bold text-[#003d29] hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] rounded"
              >
                Daftar Sekarang
              </button>
            </div>
          </form>
        ) : (
          /* Register Form - Single-Column Linear Layout */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            <div>
              <label htmlFor="auth-reg-name" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Nama Lengkap
              </label>
              <input
                id="auth-reg-name"
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Budi Santoso"
                autoComplete="name"
                required
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29] transition-all"
              />
            </div>

            <div>
              <label htmlFor="auth-reg-username" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Username
              </label>
              <input
                id="auth-reg-username"
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="budisantoso"
                autoComplete="username"
                required
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29] transition-all"
              />
            </div>

            <div>
              <label htmlFor="auth-reg-email" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                id="auth-reg-email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="budi@example.com"
                autoComplete="email"
                required
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29] transition-all"
              />
            </div>

            <div>
              <label htmlFor="auth-reg-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="auth-reg-password"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword((prev) => !prev)}
                  aria-label={showRegPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] rounded p-1.5 transition-colors cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="auth-reg-confirm-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Ulangi Sandi
              </label>
              <div className="relative">
                <input
                  id="auth-reg-confirm-password"
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword((prev) => !prev)}
                  aria-label={showRegConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] rounded p-1.5 transition-colors cursor-pointer"
                >
                  {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] py-3 px-4 rounded-full font-bold text-xs sm:text-sm text-white bg-[#003d29] hover:bg-[#064e3b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] transition-all shadow-md shadow-emerald-950/10 cursor-pointer disabled:opacity-50 mt-3"
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
                className="font-bold text-[#003d29] hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] rounded"
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
