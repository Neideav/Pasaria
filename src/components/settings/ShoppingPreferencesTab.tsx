import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Check,
  AlertCircle,
  Sliders,
  DollarSign,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  RefreshCw,
  EyeOff,
  ShieldCheck,
  Grid,
} from 'lucide-react';
import {
  UserShoppingPreferences,
  CatalogMetadataCategory,
  CatalogMetadataBrand,
} from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const ShoppingPreferencesTab: React.FC = () => {
  const { showToast } = useToast();

  const [prefs, setPrefs] = useState<UserShoppingPreferences>({
    favorite_categories: [],
    favorite_brands: [],
    min_price: null,
    max_price: null,
    hide_out_of_stock: false,
    prioritize_official_stores: false,
    default_sort: 'popular',
    preferred_density: 'comfortable',
    recommendation_personalization: true,
    theme: 'light',
    font_size: 'normal',
    reduced_motion: false,
    high_contrast: false,
  });

  const [availableCategories, setAvailableCategories] = useState<CatalogMetadataCategory[]>([]);
  const [availableBrands, setAvailableBrands] = useState<CatalogMetadataBrand[]>([]);

  const [brandSearch, setBrandSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Min and max price local inputs (formatted or raw number)
  const [minPriceInput, setMinPriceInput] = useState<string>('');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await api.getShoppingPreferences();
      if (data) {
        setPrefs(data.preferences);
        setAvailableCategories(data.available_categories || []);
        setAvailableBrands(data.available_brands || []);
        setMinPriceInput(data.preferences.min_price != null ? String(data.preferences.min_price) : '');
        setMaxPriceInput(data.preferences.max_price != null ? String(data.preferences.max_price) : '');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat preferensi belanja.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (slugOrName: string) => {
    setPrefs((prev) => {
      const exists = prev.favorite_categories.includes(slugOrName);
      return {
        ...prev,
        favorite_categories: exists
          ? prev.favorite_categories.filter((c) => c !== slugOrName)
          : [...prev.favorite_categories, slugOrName],
      };
    });
    setSaveSuccess(false);
  };

  const handleBrandToggle = (brandName: string) => {
    setPrefs((prev) => {
      const exists = prev.favorite_brands.includes(brandName);
      return {
        ...prev,
        favorite_brands: exists
          ? prev.favorite_brands.filter((b) => b !== brandName)
          : [...prev.favorite_brands, brandName],
      };
    });
    setSaveSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    const parsedMin = minPriceInput.trim() ? Math.max(0, parseInt(minPriceInput, 10) || 0) : null;
    const parsedMax = maxPriceInput.trim() ? Math.max(0, parseInt(maxPriceInput, 10) || 0) : null;

    if (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax) {
      setErrorMessage('Harga minimum tidak boleh melebihi harga maksimum.');
      setSaving(false);
      return;
    }

    try {
      const updated = await api.updateShoppingPreferences({
        favorite_categories: prefs.favorite_categories,
        favorite_brands: prefs.favorite_brands,
        min_price: parsedMin,
        max_price: parsedMax,
        hide_out_of_stock: prefs.hide_out_of_stock,
        prioritize_official_stores: prefs.prioritize_official_stores,
        default_sort: prefs.default_sort,
        preferred_density: prefs.preferred_density,
        recommendation_personalization: prefs.recommendation_personalization,
      });

      if (updated) {
        setPrefs(updated);
        // Sync local storage display density so catalog adopts immediately
        if (updated.preferred_density) {
          localStorage.setItem('pasaria_grid_density', updated.preferred_density);
        }
      }
      setSaveSuccess(true);
      showToast('Preferensi belanja dan katalog berhasil disimpan.', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan preferensi belanja.');
    } finally {
      setSaving(false);
    }
  };

  const filteredBrands = availableBrands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase().trim())
  );

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center min-h-[320px] text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#003d29]" />
        <span className="text-xs font-semibold">Memuat preferensi belanja...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
          <ShoppingBag className="w-4 h-4 text-emerald-700" />
          <span>Preferensi Belanja & Rekomendasi</span>
        </div>
        <h2 className="text-lg font-black text-slate-900">
          Kustomisasi Penemuan Produk
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
          Atur kategori produk favorit, merek pilihan, rentang harga, dan filter katalog default. Pilihan ini akan secara otomatis mempersonalisasi rekomendasi di beranda dan urutan pencarian.
        </p>

        {errorMessage && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 mt-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div role="status" className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 mt-4">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Preferensi belanja berhasil disimpan dan diperbarui.</span>
          </div>
        )}
      </div>

      {/* 1. Favorite Categories */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#003d29]" />
            <span>Kategori Produk Favorit</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Pilih kategori yang paling sering Anda jelajahi untuk memprioritaskan penawaran terbaik.
          </p>
        </div>

        {availableCategories.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Belum ada kategori yang tersedia.</p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-2">
            {availableCategories.map((cat) => {
              const isSelected = prefs.favorite_categories.includes(cat.slug) || prefs.favorite_categories.includes(cat.name);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryToggle(cat.slug || cat.name)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border motion-press active:scale-[0.96] ${
                    isSelected
                      ? 'bg-[#003d29] text-white border-[#003d29] shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Favorite Brands */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#003d29]" />
              <span>Merek & Brand Pilihan</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Pilih merek resmi atau terpercaya yang Anda minati di marketplace PASARIA.
            </p>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder="Cari nama brand..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#003d29]"
            />
          </div>
        </div>

        {filteredBrands.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            {brandSearch ? 'Tidak ada merek yang cocok dengan kata kunci pencarian.' : 'Belum ada data merek terdaftar.'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pt-2 pr-1">
            {filteredBrands.map((brand) => {
              const isSelected = prefs.favorite_brands.includes(brand.name);
              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => handleBrandToggle(brand.name)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border motion-press active:scale-[0.96] ${
                    isSelected
                      ? 'bg-emerald-900 text-white border-emerald-900 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{brand.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Preferred Price Range */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#003d29]" />
            <span>Rentang Harga Pilihan (Rupiah / IDR)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tentukan batas kisaran harga belanja yang biasa Anda cari untuk memfilter rekomendasi. Kosongkan jika ingin melihat semua harga.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Harga Minimum (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="5000"
              placeholder="Contoh: 50000"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:border-[#003d29]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Harga Maksimum (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="10000"
              placeholder="Contoh: 1000000"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:border-[#003d29]"
            />
          </div>
        </div>

        {(minPriceInput || maxPriceInput) && (
          <button
            type="button"
            onClick={() => {
              setMinPriceInput('');
              setMaxPriceInput('');
            }}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
          >
            Hapus Batas Harga
          </button>
        )}
      </div>

      {/* 4. Catalog Behavior & Layout */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-5">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#003d29]" />
            <span>Perilaku Katalog & Tampilan Grid</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Sesuaikan urutan default, kerapatan kartu produk, dan penyaringan stok saat membuka katalog belanja.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {/* Hide Out of stock */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <EyeOff className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Sembunyikan Produk Habis (Out of Stock)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Hanya tampilkan produk dengan stok gudang tersedia di katalog penemuan.
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={prefs.hide_out_of_stock}
                onChange={(e) => setPrefs({ ...prefs, hide_out_of_stock: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#003d29]"></div>
            </label>
          </div>

          {/* Prioritize official stores */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Utamakan Toko Resmi & Terverifikasi</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Tempatkan produk dari Official Store di posisi teratas hasil pencarian.
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={prefs.prioritize_official_stores}
                onChange={(e) => setPrefs({ ...prefs, prioritize_official_stores: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#003d29]"></div>
            </label>
          </div>

          {/* Recommendation personalization */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Personalisasi Rekomendasi Beranda</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Gunakan riwayat belanja untuk memunculkan promo produk yang relevan.
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={prefs.recommendation_personalization}
                onChange={(e) => setPrefs({ ...prefs, recommendation_personalization: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#003d29]"></div>
            </label>
          </div>

          {/* Default sort selector */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 text-xs">Urutan Default Katalog Produk</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Pengurutan awal ketika Anda membuka halaman katalog atau kategori.
              </div>
            </div>
            <select
              value={prefs.default_sort}
              onChange={(e) => setPrefs({ ...prefs, default_sort: e.target.value as any })}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-hidden focus:border-[#003d29]"
            >
              <option value="popular">Paling Populer</option>
              <option value="newest">Terbaru</option>
              <option value="rating">Rating Tertinggi</option>
              <option value="price_asc">Harga: Termurah ke Termahal</option>
              <option value="price_desc">Harga: Termahal ke Termurah</option>
            </select>
          </div>

          {/* Grid density selector */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Grid className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Kerapatan Tampilan Grid Produk</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Tampilan nyaman (standar) atau kompak dengan lebih banyak produk per baris.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPrefs({ ...prefs, preferred_density: 'comfortable' })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  prefs.preferred_density === 'comfortable'
                    ? 'bg-[#003d29] text-white border-[#003d29]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Nyaman
              </button>
              <button
                type="button"
                onClick={() => setPrefs({ ...prefs, preferred_density: 'compact' })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  prefs.preferred_density === 'compact'
                    ? 'bg-[#003d29] text-white border-[#003d29]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Kompak
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50 motion-press active:scale-[0.96]"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Simpan Preferensi Belanja</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
