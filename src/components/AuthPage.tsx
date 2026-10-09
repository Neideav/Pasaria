import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowLeft,
  Info,
  Check,
  Eye,
  EyeOff,
  ShoppingBag,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { Language } from '../i18n/translations';

// Asset photos for lifestyle testimonial carousel
import slideKnitImg from '../assets/images/hero_card_yellow_knit.jpg';
import slideSneakersImg from '../assets/images/hero_sneakers_fashion.jpg';
import slideHeadphonesImg from '../assets/images/hero_headphones_lifestyle.jpg';

interface AuthPageProps {
  initialTab?: 'login' | 'register';
  onLoginSuccess: (user: User) => void;
  onNavigateHome: () => void;
  message?: string;
  lang?: Language;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialTab = 'login',
  onLoginSuccess,
  onNavigateHome,
  message,
  lang = 'id',
}) => {
  const isId = lang === 'id';
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Testimonial Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: slideKnitImg,
      quote: isId
        ? 'PASARIA menghadirkan pengalaman belanja online yang sangat nyaman. Kualitas barang 100% original, pengemasan rapi, dan pengiriman super cepat!'
        : 'Shopping on PASARIA has been an absolute breeze. 100% genuine products, secure packaging, and lightning-fast delivery across Indonesia.',
      author: 'Amélie Laurent',
      role: isId ? 'Fashion Enthusiast & Verified Buyer' : 'Fashion Enthusiast & Verified Buyer',
    },
    {
      image: slideSneakersImg,
      quote: isId
        ? 'Kurasi brand resmi dan produk lifestyle-nya sangat lengkap. Proses transaksi multi-vendor aman, transparan, dan terpercaya.'
        : 'The curation of verified official stores and lifestyle brands is unmatched. Seamless multi-vendor checkout with complete peace of mind.',
      author: 'Dimas Setiawan',
      role: isId ? 'Sneakerhead & Architect, Jakarta' : 'Sneakerhead & Architect, Jakarta',
    },
    {
      image: slideHeadphonesImg,
      quote: isId
        ? 'Platform belanja modern dengan antarmuka yang bersih, cepat, dan layanan pelanggan official store yang responsif serta ramah.'
        : 'A truly modern marketplace with an elegant, ultra-fast interface and dedicated support that sets a new standard for online shopping.',
      author: 'Rania Salsabila',
      role: isId ? 'Product Designer, Bandung' : 'Product Designer, Bandung',
    },
  ];

  useEffect(() => {
    setTab(initialTab);
    setErrorMsg('');
  }, [initialTab]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = await api.login(username.trim(), password);
      setSuccessMsg(isId ? 'Berhasil masuk! Mengalihkan...' : 'Logged in successfully! Redirecting...');
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || (isId ? 'Gagal masuk. Periksa kembali email dan kata sandi Anda.' : 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const computedUsername = regUsername.trim() || regEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
      const data = await api.register({
        name: regName.trim(),
        username: computedUsername,
        email: regEmail.trim(),
        password: regPassword,
      });

      setSuccessMsg(isId ? 'Pendaftaran berhasil! Mengalihkan...' : 'Registration successful! Redirecting...');
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || (isId ? 'Pendaftaran gagal. Pastikan email belum pernah terdaftar.' : 'Registration failed. Email might already be taken.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col lg:flex-row items-stretch font-sans">
      {/* LEFT HALF: Full-height Auth Form Area */}
      <div className="w-full lg:w-[48%] xl:w-[44%] flex flex-col justify-between px-6 sm:px-12 lg:px-16 xl:px-20 py-8 sm:py-10 bg-white min-h-screen">
        {/* Top Brand Logo & Back navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#003d29] text-white transition-transform group-hover:scale-105">
              <ShoppingBag className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-xl font-black tracking-tight text-[#003d29]">PASARIA</span>
          </button>

          <button
            onClick={onNavigateHome}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isId ? 'Kembali ke Beranda' : 'Back to Store'}</span>
          </button>
        </div>

        {/* Center Form Container */}
        <div className="my-auto py-8 max-w-md w-full mx-auto lg:mx-0">
          {/* Header Title */}
          <div className="text-left mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {tab === 'register'
                ? isId
                  ? 'Buat Akun Baru'
                  : 'Create an account'
                : isId
                ? 'Masuk ke Akun'
                : 'Welcome back'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-normal">
              {tab === 'register'
                ? isId
                  ? 'Mulai pengalaman belanja kebutuhan terbaik di PASARIA.'
                  : "Let's get started with your 30-day member perks."
                : isId
                ? 'Selamat datang kembali, masukkan detail akun Anda.'
                : 'Please enter your account details to continue.'}
            </p>
          </div>

          {/* Global notice banner */}
          {message && !errorMsg && (
            <div className="p-3.5 mb-5 rounded-xl bg-[#003d29]/5 border border-[#003d29]/20 text-[#003d29] text-xs font-medium flex items-center gap-3">
              <Info className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3 mb-5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-left">
              {errorMsg}
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="p-3 mb-5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-left flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Content */}
          {tab === 'register' ? (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {isId ? 'Nama Lengkap' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder={isId ? 'Contoh: Rania Salsabila' : 'e.g. Amélie Laurent'}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs sm:text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {isId ? 'Alamat Email' : 'Email address'}
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs sm:text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {isId ? 'Kata Sandi' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs sm:text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-slate-900 hover:bg-black transition-all cursor-pointer disabled:opacity-50 mt-2 shadow-sm active:scale-[0.99]"
              >
                {loading ? (isId ? 'Membuat akun...' : 'Creating account...') : isId ? 'Buat Akun' : 'Create account'}
              </button>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {isId ? 'Email atau Username' : 'Email or Username'}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="customer@pasaria.id"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs sm:text-sm transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    {isId ? 'Kata Sandi' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => alert(isId ? 'Gunakan akun demo di bawah untuk login instan.' : 'Use the demo accounts below for instant login.')}
                    className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer underline"
                  >
                    {isId ? 'Lupa Sandi?' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 text-xs sm:text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-slate-900 hover:bg-black transition-all cursor-pointer disabled:opacity-50 mt-2 shadow-sm active:scale-[0.99]"
              >
                {loading ? (isId ? 'Memproses Masuk...' : 'Signing in...') : isId ? 'Masuk ke Akun' : 'Log in'}
              </button>

              {/* Quick Demo Credentials */}
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isId ? 'Pilih Akun Demo (1-Klik Isi):' : 'Instant Demo Accounts:'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('customer@pasaria.id');
                      setPassword('password123');
                    }}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="font-bold text-[11px] text-slate-800 group-hover:text-emerald-800">Pembeli</div>
                    <div className="text-[10px] text-slate-500 truncate">customer@...</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('seller@pasaria.id');
                      setPassword('password123');
                    }}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="font-bold text-[11px] text-slate-800 group-hover:text-emerald-800">Penjual</div>
                    <div className="text-[10px] text-slate-500 truncate">seller@...</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('admin@pasaria.id');
                      setPassword('admin123');
                    }}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="font-bold text-[11px] text-slate-800 group-hover:text-emerald-800">Admin</div>
                    <div className="text-[10px] text-slate-500 truncate">admin@...</div>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Social Login Divider & Buttons */}
          <div className="mt-5 space-y-2.5">
            <button
              type="button"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-medium text-xs text-slate-700 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{tab === 'register' ? (isId ? 'Daftar dengan Google' : 'Sign up with Google') : isId ? 'Masuk dengan Google' : 'Sign in with Google'}</span>
            </button>

            <button
              type="button"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-medium text-xs text-slate-700 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current text-slate-800" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.08.64-2.73 1.39-.57.65-1.07 1.71-.94 2.74 1.05.08 2.06-.52 2.66-1.26z" />
              </svg>
              <span>{isId ? 'Masuk dengan Apple ID' : 'Sign in with Apple'}</span>
            </button>
          </div>

          {/* Line Separator & Centered Switcher */}
          <div className="pt-6 mt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            {tab === 'register' ? (
              <span>
                {isId ? 'Sudah memiliki akun?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="font-bold text-slate-900 underline underline-offset-2 hover:text-black cursor-pointer ml-1"
                >
                  {isId ? 'Masuk di sini' : 'Log in'}
                </button>
              </span>
            ) : (
              <span>
                {isId ? 'Belum memiliki akun?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="font-bold text-slate-900 underline underline-offset-2 hover:text-black cursor-pointer ml-1"
                >
                  {isId ? 'Daftar sekarang' : 'Sign up'}
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Bottom space placeholder to keep vertical balance */}
        <div className="hidden lg:block h-6" />
      </div>

      {/* RIGHT HALF: Lifestyle Hero Testimonial Card */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[56%] p-3 lg:p-4 bg-white">
        <div className="relative w-full h-full min-h-[640px] rounded-2xl overflow-hidden bg-slate-950 flex flex-col justify-end p-8 lg:p-12 text-white shadow-none">
          {/* Background Image with smooth transition */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img
              key={currentSlide}
              src={slides[currentSlide].image}
              alt="PASARIA Lifestyle"
              className="w-full h-full object-cover opacity-85 scale-100 transition-all duration-1000 ease-out"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/15" />
          </div>

          {/* Bottom Testimonial Content */}
          <div className="relative z-10 text-left">
            {/* Quote marks */}
            <div className="text-3xl sm:text-4xl font-serif text-white/80 leading-none mb-3">“</div>

            {/* Quote text */}
            <p className="text-base sm:text-lg lg:text-xl font-medium tracking-tight text-white leading-relaxed mb-6 line-clamp-3">
              {slides[currentSlide].quote}
            </p>

            {/* Author details */}
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {slides[currentSlide].author}
              </h4>
              <p className="text-xs text-white/70 font-normal mt-0.5">
                {slides[currentSlide].role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
