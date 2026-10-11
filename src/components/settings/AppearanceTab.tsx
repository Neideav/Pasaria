import React, { useState } from 'react';
import {
  Globe,
  Sun,
  Moon,
  Monitor,
  RefreshCw,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '../../i18n/translations';
import { useToast } from '../../context/ToastContext';

interface AppearanceTabProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onClearCache: () => void;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
  currentLang,
  onLanguageChange,
  onClearCache,
}) => {
  const { showToast } = useToast();

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const saved = localStorage.getItem('pasaria_theme');
      return saved === 'dark' || saved === 'system' ? saved : 'light';
    } catch {
      return 'light';
    }
  });

  const [cacheClearing, setCacheClearing] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    try {
      localStorage.setItem('pasaria_theme', newTheme);
      showToast(`Tema ${newTheme === 'light' ? 'Terang' : newTheme === 'dark' ? 'Gelap' : 'Sistem'} dipilih.`, 'info');
    } catch {}
  };

  const handleClearCacheClick = async () => {
    setCacheClearing(true);
    setCacheCleared(false);
    try {
      await onClearCache();
      setCacheCleared(true);
      showToast('Cache lokal berhasil dibersihkan dan data terbaru telah dimuat.', 'success');
      setTimeout(() => setCacheCleared(false), 3000);
    } catch {
      showToast('Gagal menyegarkan data cache.', 'error');
    } finally {
      setCacheClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Language Preference */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-5">
        <div>
          <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#003d29]" />
            <span>Bahasa Tampilan (Application Language)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pilih bahasa utama untuk seluruh antarmuka, navigasi menu, dan pesan sistem PASARIA.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <button
            type="button"
            onClick={() => {
              onLanguageChange('id');
              showToast('Bahasa aplikasi diubah ke Bahasa Indonesia.', 'info');
            }}
            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              currentLang === 'id'
                ? 'bg-emerald-50/50 border-emerald-400 shadow-2xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-label="Bendera Indonesia">🇮🇩</span>
              <div>
                <div className="font-extrabold text-slate-900">Bahasa Indonesia</div>
                <div className="text-[11px] text-slate-400">Default sistem marketplace</div>
              </div>
            </div>
            {currentLang === 'id' && (
              <CheckCircle2 className="w-4 h-4 text-[#003d29]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              onLanguageChange('en');
              showToast('Application language changed to English.', 'info');
            }}
            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              currentLang === 'en'
                ? 'bg-emerald-50/50 border-emerald-400 shadow-2xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-label="English flag">🇬🇧</span>
              <div>
                <div className="font-extrabold text-slate-900">English (US)</div>
                <div className="text-[11px] text-slate-400">International storefront</div>
              </div>
            </div>
            {currentLang === 'en' && (
              <CheckCircle2 className="w-4 h-4 text-[#003d29]" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Theme Selection */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-5">
        <div>
          <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Sun className="w-4 h-4 text-[#003d29]" />
            <span>Tema Tampilan Antarmuka</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sesuaikan kenyamanan visual Anda dengan mode terang, gelap, atau mengikuti tema perangkat sistem operasi Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-emerald-50/50 border-emerald-400 shadow-2xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <Sun className="w-5 h-5 text-amber-500" />
              {theme === 'light' && <Check className="w-4 h-4 text-[#003d29]" />}
            </div>
            <div>
              <div className="font-bold text-slate-900">Mode Terang</div>
              <div className="text-[11px] text-slate-400">Tampilan standar jernih & bersih</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-emerald-50/50 border-emerald-400 shadow-2xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <Moon className="w-5 h-5 text-indigo-500" />
              {theme === 'dark' && <Check className="w-4 h-4 text-[#003d29]" />}
            </div>
            <div>
              <div className="font-bold text-slate-900">Mode Gelap</div>
              <div className="text-[11px] text-slate-400">Mengurangi silau di malam hari</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('system')}
            className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
              theme === 'system'
                ? 'bg-emerald-50/50 border-emerald-400 shadow-2xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <Monitor className="w-5 h-5 text-slate-600" />
              {theme === 'system' && <Check className="w-4 h-4 text-[#003d29]" />}
            </div>
            <div>
              <div className="font-bold text-slate-900">Mengikuti Sistem</div>
              <div className="text-[11px] text-slate-400">Otomatis sinkron dengan OS</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Cache & Store Sync */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1 flex-1 text-xs">
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#003d29]" />
              <span>Sinkronisasi Ulang & Segarkan Cache Toko</span>
            </h2>
            <p className="text-slate-500 leading-relaxed max-w-xl">
              Tindakan ini menghapus salinan cache katalog lokal di browser Anda dan mengambil data produk serta status akun terbaru langsung dari database server. Keranjang belanja dan data login Anda tetap aman tersimpan.
            </p>
            {cacheCleared && (
              <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2 mt-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Katalog produk dan sesi akun berhasil disinkronkan kembali!</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleClearCacheClick}
            disabled={cacheClearing}
            className="min-h-[44px] px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50 motion-press active:scale-[0.96]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cacheClearing ? 'animate-spin' : ''}`} />
            <span>{cacheClearing ? 'Menyinkronkan...' : 'Segarkan Data Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
