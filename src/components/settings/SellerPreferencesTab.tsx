import React, { useState, useEffect } from 'react';
import {
  Store,
  Check,
  AlertCircle,
  RefreshCw,
  Bell,
  Package,
  Calendar,
  MessageSquare,
  ShoppingBag,
  RotateCcw,
  Star,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { SellerPreferences } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface SellerPreferencesTabProps {
  onOpenShopDashboard?: () => void;
}

export const SellerPreferencesTab: React.FC<SellerPreferencesTabProps> = ({
  onOpenShopDashboard,
}) => {
  const { showToast } = useToast();

  const [prefs, setPrefs] = useState<SellerPreferences>({
    notify_new_orders: true,
    notify_customer_chat: true,
    notify_low_stock: true,
    notify_reviews: true,
    notify_returns: true,
    low_stock_threshold: 5,
    vacation_mode: false,
    vacation_message: '',
    vacation_start: '',
    vacation_end: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadSellerPreferences();
  }, []);

  const loadSellerPreferences = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await api.getSellerPreferences();
      if (data) {
        setPrefs(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat preferensi penjual.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    if (prefs.low_stock_threshold < 1 || prefs.low_stock_threshold > 100) {
      setErrorMessage('Batas stok menipis harus di antara 1 dan 100 unit.');
      setSaving(false);
      return;
    }

    try {
      const updated = await api.updateSellerPreferences({
        notify_new_orders: prefs.notify_new_orders,
        notify_customer_chat: prefs.notify_customer_chat,
        notify_low_stock: prefs.notify_low_stock,
        notify_reviews: prefs.notify_reviews,
        notify_returns: prefs.notify_returns,
        low_stock_threshold: Number(prefs.low_stock_threshold),
        vacation_mode: prefs.vacation_mode,
        vacation_message: prefs.vacation_message,
        vacation_start: prefs.vacation_start || null,
        vacation_end: prefs.vacation_end || null,
      });

      if (updated) {
        setPrefs(updated);
      }
      setSaveSuccess(true);
      showToast('Preferensi toko penjual berhasil disimpan.', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan preferensi penjual.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center min-h-[320px] text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#003d29]" />
        <span className="text-xs font-semibold">Memuat preferensi toko Anda...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
              <Store className="w-4 h-4 text-emerald-700" />
              <span>Preferensi Penjual & Toko</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-1">
              Kontrol Notifikasi & Operasional Toko
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
              Atur batas peringatan sisa stok, notifikasi transaksi toko, serta mode libur operasional.
            </p>
          </div>

          {onOpenShopDashboard && (
            <button
              type="button"
              onClick={onOpenShopDashboard}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition-colors cursor-pointer self-start sm:self-center motion-press active:scale-[0.96]"
            >
              <Store className="w-3.5 h-3.5 text-[#003d29]" />
              <span>Buka Seller Center</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>

        {errorMessage && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 mt-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div role="status" className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 mt-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Pengaturan toko berhasil diperbarui.</span>
          </div>
        )}
      </div>

      {/* 1. Low Stock Alert Threshold */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-[#003d29]" />
            <span>Batas Peringatan Stok Menipis (Low-Stock Alert)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Sistem PASARIA akan secara otomatis mengirimkan pemberitahuan ketika jumlah stok produk atau varian toko Anda mencapai batas ini.
          </p>
        </div>

        <div className="max-w-xs">
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Batas Peringatan Sisa Unit
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="100"
              value={prefs.low_stock_threshold}
              onChange={(e) => setPrefs({ ...prefs, low_stock_threshold: parseInt(e.target.value, 10) || 5 })}
              className="w-32 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-hidden focus:border-[#003d29]"
            />
            <span className="text-xs text-slate-500 font-semibold">unit sisa</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Rekomendasi default: 5 unit.</span>
        </div>
      </div>

      {/* 2. Vacation Mode */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#003d29]" />
              <span>Mode Libur Toko (Vacation Mode)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Aktifkan saat toko Anda tutup sementara atau cuti libur agar pesanan baru dicegah secara otomatis oleh sistem.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={prefs.vacation_mode}
              onChange={(e) => setPrefs({ ...prefs, vacation_mode: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#003d29]"></div>
          </label>
        </div>

        {/* Vacation details if enabled */}
        {prefs.vacation_mode && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4 pt-3">
            <div className="flex items-start gap-2 text-amber-800 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                Saat Mode Libur aktif, pembeli tidak dapat melakukan checkout terhadap produk toko Anda. Pesanan lama yang sedang berjalan tetap diproses secara normal.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Pesan Pengumuman Libur untuk Pembeli
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Toko kami tutup libur tanggal 1-5. Semua pesanan akan dikirimkan kembali setelah buka."
                value={prefs.vacation_message || ''}
                onChange={(e) => setPrefs({ ...prefs, vacation_message: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-amber-200 text-xs bg-white focus:outline-hidden focus:border-[#003d29]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mulai Libur (Opsional)
                </label>
                <input
                  type="date"
                  value={prefs.vacation_start ? prefs.vacation_start.split('T')[0] : ''}
                  onChange={(e) => setPrefs({ ...prefs, vacation_start: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 text-xs bg-white focus:outline-hidden focus:border-[#003d29]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Selesai Libur (Opsional)
                </label>
                <input
                  type="date"
                  value={prefs.vacation_end ? prefs.vacation_end.split('T')[0] : ''}
                  onChange={(e) => setPrefs({ ...prefs, vacation_end: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 text-xs bg-white focus:outline-hidden focus:border-[#003d29]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Seller Alert Notifications */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#003d29]" />
            <span>Pemberitahuan Penjual</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Pilih peristiwa toko yang ingin Anda terima sebagai notifikasi in-app dan email.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {/* New Orders */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShoppingBag className="w-4 h-4 text-[#003d29] mt-0.5" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Pesanan Baru Masuk</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Dapatkan notifikasi segera setelah pembeli menyelesaikan pembayaran.</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={prefs.notify_new_orders}
                onChange={(e) => setPrefs({ ...prefs, notify_new_orders: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#003d29]"></div>
            </label>
          </div>

          {/* Customer Chat */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-4 h-4 text-emerald-600 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Pesan Chat Pelanggan</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Pertanyaan ketersediaan produk atau konsultasi pesanan dari calon pembeli.</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={prefs.notify_customer_chat}
                onChange={(e) => setPrefs({ ...prefs, notify_customer_chat: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#003d29]"></div>
            </label>
          </div>

          {/* Low Stock */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Package className="w-4 h-4 text-amber-500 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Peringatan Sisa Stok Menipis</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Pemberitahuan otomatis saat barang dagangan mendekati habis.</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={prefs.notify_low_stock}
                onChange={(e) => setPrefs({ ...prefs, notify_low_stock: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#003d29]"></div>
            </label>
          </div>

          {/* Customer Reviews */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Star className="w-4 h-4 text-amber-400 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Ulasan & Rating Pembeli Baru</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Kabar saat pembeli memberikan ulasan dan rating kepuasan pada barang.</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={prefs.notify_reviews}
                onChange={(e) => setPrefs({ ...prefs, notify_reviews: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#003d29]"></div>
            </label>
          </div>

          {/* Return & Dispute Requests */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <RotateCcw className="w-4 h-4 text-rose-500 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Pengajuan Retur & Komplain Pembeli</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Notifikasi saat pembeli mengajukan pengembalian dana atau barang rusak.</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={prefs.notify_returns}
                onChange={(e) => setPrefs({ ...prefs, notify_returns: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#003d29]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Submit Button */}
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
              <span>Simpan Pengaturan Toko</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
