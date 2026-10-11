import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Eye,
  Trash2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { UserSearchHistoryItem, UserViewedProductItem } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ActivityHistoryTabProps {
  onSearchQuery?: (query: string) => void;
  onNavigateProduct?: (slug: string) => void;
}

export const ActivityHistoryTab: React.FC<ActivityHistoryTabProps> = ({
  onSearchQuery,
  onNavigateProduct,
}) => {
  const { showToast } = useToast();

  const [searches, setSearches] = useState<UserSearchHistoryItem[]>([]);
  const [viewedProducts, setViewedProducts] = useState<UserViewedProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'searches' | 'viewed'>('searches');
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [searchData, viewedData] = await Promise.all([
        api.getRecentSearches(),
        api.getRecentlyViewed(),
      ]);
      setSearches(searchData || []);
      setViewedProducts(viewedData || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat riwayat aktivitas akun.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSearch = async (id: number) => {
    try {
      await api.deleteRecentSearch(id);
      setSearches((prev) => prev.filter((item) => item.id !== id));
      showToast('Kata kunci pencarian dihapus.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus riwayat pencarian.', 'error');
    }
  };

  const handleClearAllSearches = async () => {
    if (!window.confirm('Hapus seluruh riwayat pencarian Anda? Riwayat pesanan dan wishlist Anda tidak akan terpengaruh.')) {
      return;
    }

    setClearing(true);
    try {
      await api.clearRecentSearches();
      setSearches([]);
      showToast('Seluruh riwayat pencarian berhasil dibersihkan.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal membersihkan riwayat pencarian.', 'error');
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteViewed = async (id: number) => {
    try {
      await api.deleteRecentlyViewed(id);
      setViewedProducts((prev) => prev.filter((item) => item.id !== id));
      showToast('Produk dihapus dari riwayat dilihat.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus riwayat produk.', 'error');
    }
  };

  const handleClearAllViewed = async () => {
    if (!window.confirm('Hapus seluruh riwayat produk yang dilihat? Akun dan transaksi Anda tetap aman.')) {
      return;
    }

    setClearing(true);
    try {
      await api.clearRecentlyViewed();
      setViewedProducts([]);
      showToast('Seluruh riwayat produk dilihat berhasil dibersihkan.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal membersihkan riwayat produk dilihat.', 'error');
    } finally {
      setClearing(false);
    }
  };

  const formatRupiah = (val?: number | null) => {
    if (val == null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center min-h-[320px] text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#003d29]" />
        <span className="text-xs font-semibold">Memuat riwayat aktivitas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
          <History className="w-4 h-4 text-emerald-700" />
          <span>Manajemen Riwayat Aktivitas</span>
        </div>
        <h2 className="text-lg font-black text-slate-900">
          Riwayat Pencarian & Produk Terakhir Dilihat
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
          Kelola riwayat pencarian marketplace dan produk yang pernah Anda buka. Anda memiliki kendali penuh untuk menghapus entri tertentu atau mengosongkan riwayat sewaktu-waktu demi privasi Anda.
        </p>

        {/* Privacy Assurance Notice */}
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Membersihkan riwayat ini bersifat privat dan tidak akan menghapus pesanan belanja, alamat pengiriman, atau ulasan produk Anda.</span>
        </div>

        {errorMessage && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 mt-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Sub-tab Navigation: Recent Searches vs Viewed Products */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('searches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSubTab === 'searches'
              ? 'bg-[#003d29] text-white shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Pencarian Terakhir ({searches.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('viewed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSubTab === 'viewed'
              ? 'bg-[#003d29] text-white shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Produk Dilihat ({viewedProducts.length})</span>
        </button>
      </div>

      {/* Panel 1: Searches */}
      {activeSubTab === 'searches' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs">Daftar Kata Kunci Pencarian</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Dapat digunakan untuk mencari kembali dengan satu klik.</p>
            </div>
            {searches.length > 0 && (
              <button
                type="button"
                disabled={clearing}
                onClick={handleClearAllSearches}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua Pencarian</span>
              </button>
            )}
          </div>

          {searches.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Belum Ada Riwayat Pencarian</p>
              <p className="text-[11px] text-slate-400">Kata kunci yang Anda cari di marketplace akan dicatat di sini.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {searches.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900 truncate">
                        &quot;{item.query}&quot;
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(item.created_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onSearchQuery && (
                      <button
                        type="button"
                        onClick={() => onSearchQuery(item.query)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-[#003d29] hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        Cari Lagi
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteSearch(item.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Hapus entri ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Panel 2: Viewed Products */}
      {activeSubTab === 'viewed' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs">Produk yang Pernah Anda Buka</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Membantu Anda menemukan kembali barang yang sempat dilirik.</p>
            </div>
            {viewedProducts.length > 0 && (
              <button
                type="button"
                disabled={clearing}
                onClick={handleClearAllViewed}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua Riwayat Dilihat</span>
              </button>
            )}
          </div>

          {viewedProducts.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Eye className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Belum Ada Riwayat Produk Dilihat</p>
              <p className="text-[11px] text-slate-400">Jelajahi katalog PASARIA untuk melihat riwayat barang di sini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {viewedProducts.map((item) => {
                const prod = item.product;
                if (!prod) return null;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 flex items-center gap-3 justify-between bg-white hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={prod.image || '/placeholder-product.png'}
                        alt={prod.name}
                        className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0"
                      />
                      <div className="min-w-0 space-y-1">
                        <h4 className="text-xs font-extrabold text-slate-900 truncate">
                          {prod.name}
                        </h4>
                        <div className="text-xs font-black text-[#003d29]">
                          {formatRupiah(prod.price)}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{prod.rating || 5}</span>
                          </span>
                          <span>•</span>
                          <span>{prod.shop_name || 'Toko PASARIA'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {onNavigateProduct && (
                        <button
                          type="button"
                          onClick={() => onNavigateProduct(prod.slug)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                          title="Buka Produk"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteViewed(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Hapus dari riwayat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
