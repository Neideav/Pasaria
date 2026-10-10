import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  Shield,
  KeyRound,
  Check,
  AlertCircle,
  Lock,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { User } from '../types';
import { Language, translations } from '../i18n/translations';
import { api } from '../services/api';

interface SettingsViewProps {
  user: User | null;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigateHome: () => void;
  onClearCache: () => void;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  barColor: string;
}

const getPasswordStrength = (pass: string): PasswordStrength => {
  if (!pass) {
    return { score: 0, label: '', color: '', barColor: '' };
  }
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  if (/\d/.test(pass)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

  if (pass.length < 8) {
    return { score: 1, label: 'Terlalu Pendek (< 8 Karakter)', color: 'text-rose-600', barColor: 'bg-rose-500' };
  }

  switch (score) {
    case 1:
    case 2:
      return { score: 2, label: 'Cukup', color: 'text-amber-600', barColor: 'bg-amber-500' };
    case 3:
      return { score: 3, label: 'Kuat', color: 'text-emerald-600', barColor: 'bg-emerald-500' };
    case 4:
      return { score: 4, label: 'Sangat Kuat', color: 'text-[#003d29]', barColor: 'bg-[#003d29]' };
    default:
      return { score: 1, label: 'Lemah', color: 'text-rose-600', barColor: 'bg-rose-500' };
  }
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  currentLang,
  onLanguageChange,
  onNavigateHome,
}) => {
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<'security' | 'notifications' | 'privacy'>('security');

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Notification state
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [promoNotif, setPromoNotif] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  const passwordStrength = getPasswordStrength(newPassword);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setPasswordSaving(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Gagal mengubah kata sandi. Pastikan kata sandi saat ini benar.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 text-left space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">
            <SettingsIcon className="w-4 h-4 text-emerald-700" />
            <span>Pengaturan Akun</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Keamanan & Preferensi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola kata sandi, preferensi notifikasi, dan keamanan login akun PASARIA.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-xs font-semibold text-[#003d29] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] rounded-lg cursor-pointer motion-press active:scale-[0.96]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-xs">
        {[
          { id: 'security', label: 'Keamanan & Kata Sandi', icon: Shield },
          { id: 'notifications', label: 'Notifikasi', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-full font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] motion-press active:scale-[0.96] ${
                isActive
                  ? 'bg-[#003d29] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Security Tab: Real Password Change */}
      {activeTab === 'security' && (
        <div className="motion-tab-pane bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#003d29]" />
              <span>Ubah Kata Sandi Akun</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan kata sandi yang kuat dengan minimal 8 karakter untuk menjaga keamanan akun Anda.
            </p>
          </div>

          {passwordError && (
            <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSaved && (
            <div role="status" className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Kata sandi Anda berhasil diperbarui.</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md text-xs">
            <div>
              <label htmlFor="settings-current-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Kata Sandi Saat Ini
              </label>
              <div className="relative">
                <input
                  id="settings-current-password"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  aria-label={showCurrentPassword ? 'Sembunyikan kata sandi saat ini' : 'Tampilkan kata sandi saat ini'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] rounded p-1.5 transition-colors cursor-pointer motion-press active:scale-[0.96]"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="settings-new-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  id="settings-new-password"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? 'Sembunyikan kata sandi baru' : 'Tampilkan kata sandi baru'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] rounded p-1.5 transition-colors cursor-pointer motion-press active:scale-[0.96]"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Dynamic Password Strength Indicator (Motion Point #46) */}
              {newPassword.length > 0 && (
                <div className="space-y-1.5 pt-2" aria-live="polite">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Kekuatan Kata Sandi:</span>
                    <span className={`font-bold ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width,background-color] duration-250 ease-[var(--ease-out)] ${passwordStrength.barColor}`}
                      style={{ width: `${Math.max(10, (passwordStrength.score / 4) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Kombinasikan huruf besar, huruf kecil, angka, dan simbol untuk keamanan maksimal.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="settings-confirm-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  id="settings-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi kata sandi baru' : 'Tampilkan konfirmasi kata sandi baru'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] rounded p-1.5 transition-colors cursor-pointer motion-press active:scale-[0.96]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordSaving}
                className="min-h-[44px] px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#003d29] hover:bg-[#064e3b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs disabled:opacity-40 motion-press active:scale-[0.96]"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{passwordSaving ? 'Memproses...' : 'Perbarui Kata Sandi'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="motion-tab-pane bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#003d29]" />
              <span>Preferensi Pemberitahuan</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Atur bagaimana PASARIA mengabari Anda mengenai pesanan, promosi, dan pesan baru.
            </p>
          </div>

          <form onSubmit={handleSaveNotifications} className="space-y-4 text-xs">
            {/* Toggle 1: Email Orders (Motion Point #47) */}
            <label htmlFor="notif-orders" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer min-h-[48px]">
              <div>
                <div className="font-bold text-slate-900">Pembaruan Pesanan & Pengiriman</div>
                <div className="text-[11px] text-slate-500">Notifikasi status resi, transit kurir, dan konfirmasi barang tiba via Email.</div>
              </div>
              <input
                id="notif-orders"
                type="checkbox"
                checked={emailNotif}
                onChange={(e) => setEmailNotif(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-[var(--ease-out)] ml-3 ${
                  emailNotif ? 'bg-[#003d29]' : 'bg-slate-200'
                }`}
                aria-hidden="true"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-[var(--ease-out)] active:scale-95 ${
                    emailNotif ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>

            {/* Toggle 2: WhatsApp / Chat (Motion Point #47) */}
            <label htmlFor="notif-chat" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer min-h-[48px]">
              <div>
                <div className="font-bold text-slate-900">Pesan Chat & WhatsApp Penjual</div>
                <div className="text-[11px] text-slate-500">Notifikasi saat penjual membalas pertanyaan atau ulasan produk via WhatsApp.</div>
              </div>
              <input
                id="notif-chat"
                type="checkbox"
                checked={smsNotif}
                onChange={(e) => setSmsNotif(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-[var(--ease-out)] ml-3 ${
                  smsNotif ? 'bg-[#003d29]' : 'bg-slate-200'
                }`}
                aria-hidden="true"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-[var(--ease-out)] active:scale-95 ${
                    smsNotif ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>

            {/* Toggle 3: Push Promo (Motion Point #47) */}
            <label htmlFor="notif-promo" className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer min-h-[48px]">
              <div>
                <div className="font-bold text-slate-900">Promo & Voucher Spesial</div>
                <div className="text-[11px] text-slate-500">Kabar diskon kilat flash sale mingguan dan voucher diskon.</div>
              </div>
              <input
                id="notif-promo"
                type="checkbox"
                checked={promoNotif}
                onChange={(e) => setPromoNotif(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-[var(--ease-out)] ml-3 ${
                  promoNotif ? 'bg-[#003d29]' : 'bg-slate-200'
                }`}
                aria-hidden="true"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-[var(--ease-out)] active:scale-95 ${
                    promoNotif ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>

            <div className="pt-2 flex items-center justify-between">
              {notifSaved && (
                <span role="status" className="text-xs text-emerald-700 font-bold">Preferensi berhasil disimpan!</span>
              )}
              <button
                type="submit"
                className="ml-auto min-h-[44px] px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#003d29] hover:bg-[#064e3b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] transition-all cursor-pointer shadow-2xs motion-press active:scale-[0.96]"
              >
                Simpan Preferensi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
