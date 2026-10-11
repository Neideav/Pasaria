import React, { useState, useEffect } from 'react';
import {
  BellRing,
  AlertCircle,
  RefreshCw,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  Tag,
  TrendingDown,
  PackageCheck,
  Store,
  DollarSign,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { ProductAlert } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ProductAlertsTabProps {
  onNavigateProduct?: (slug: string) => void;
}

export const ProductAlertsTab: React.FC<ProductAlertsTabProps> = ({ onNavigateProduct }) => {
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState<ProductAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Edit target price modal / inline state
  const [editingAlertId, setEditingAlertId] = useState<number | null>(null);
  const [editTargetPriceInput, setEditTargetPriceInput] = useState<string>('');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await api.getProductAlerts();
      setAlerts(data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat daftar pantauan produk.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (alert: ProductAlert) => {
    setUpdatingId(alert.id);
    const newStatus = !alert.is_active;
    try {
      const updated = await api.updateProductAlert(alert.id, {
        is_active: newStatus,
      });
      setAlerts((prev) =>
        prev.map((item) => (item.id === alert.id ? { ...item, is_active: updated.is_active } : item))
      );
      showToast(
        newStatus ? 'Pantauan produk diaktifkan kembali.' : 'Pantauan produk dijeda sementara.',
        'info'
      );
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status pantauan produk.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Hapus pantauan produk ini? Anda tidak akan menerima notifikasi harga lagi.')) {
      return;
    }

    setUpdatingId(id);
    try {
      await api.deleteProductAlert(id);
      setAlerts((prev) => prev.filter((item) => item.id !== id));
      showToast('Pantauan produk berhasil dihapus.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus pantauan produk.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const startEditTargetPrice = (alert: ProductAlert) => {
    setEditingAlertId(alert.id);
    setEditTargetPriceInput(alert.target_price ? String(alert.target_price) : '');
  };

  const cancelEditTargetPrice = () => {
    setEditingAlertId(null);
    setEditTargetPriceInput('');
  };

  const handleSaveTargetPrice = async (alertId: number) => {
    const parsedPrice = editTargetPriceInput.trim() ? parseInt(editTargetPriceInput, 10) : null;
    if (parsedPrice !== null && (isNaN(parsedPrice) || parsedPrice <= 0)) {
      showToast('Masukkan nominal harga target yang valid.', 'error');
      return;
    }

    setUpdatingId(alertId);
    try {
      const updated = await api.updateProductAlert(alertId, {
        target_price: parsedPrice,
      });
      setAlerts((prev) =>
        prev.map((item) => (item.id === alertId ? { ...item, target_price: updated.target_price } : item))
      );
      setEditingAlertId(null);
      showToast('Harga target pantauan berhasil diperbarui.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui harga target.', 'error');
    } finally {
      setUpdatingId(null);
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

  const renderBadge = (type: string) => {
    switch (type) {
      case 'price_drop':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <TrendingDown className="w-3 h-3 text-amber-600" />
            <span>Harga Turun</span>
          </span>
        );
      case 'back_in_stock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <PackageCheck className="w-3 h-3 text-emerald-600" />
            <span>Stok Tersedia</span>
          </span>
        );
      case 'target_price':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <DollarSign className="w-3 h-3 text-blue-600" />
            <span>Target Harga</span>
          </span>
        );
      case 'shop_new_product':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Store className="w-3 h-3 text-purple-600" />
            <span>Produk Baru Toko</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            <Tag className="w-3 h-3" />
            <span>{type}</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center min-h-[320px] text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#003d29]" />
        <span className="text-xs font-semibold">Memuat pantauan produk Anda...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
            <BellRing className="w-4 h-4 text-emerald-700" />
            <span>Pantau Produk & Notifikasi Harga</span>
          </div>
          <button
            type="button"
            onClick={loadAlerts}
            className="text-xs font-bold text-[#003d29] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan</span>
          </button>
        </div>
        <h2 className="text-lg font-black text-slate-900">
          Daftar Pantauan Harga & Stok Otomatis
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
          Sistem akan mengirimkan notifikasi instan ke aplikasi Anda ketika barang favorit mengalami penurunan harga, mencapai target anggaran Anda, atau kembali tersedia di gudang.
        </p>

        {errorMessage && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 mt-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Alert Items List */}
      {alerts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-2xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#003d29] flex items-center justify-center mx-auto">
            <BellRing className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">
            Belum Ada Pantauan Produk Aktif
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Anda dapat mengaktifkan pantauan harga langsung pada halaman detail produk atau daftar wishlist Anda dengan menekan tombol lonceng &quot;Pantau Harga&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {alerts.map((alert) => {
            const product = alert.product;
            const isEditingPrice = editingAlertId === alert.id;
            const isBusy = updatingId === alert.id;

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all ${
                  alert.is_active
                    ? 'border-slate-200/90 shadow-2xs'
                    : 'border-slate-200/50 bg-slate-50/50 opacity-75'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Product info preview */}
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={product?.image || '/placeholder-product.png'}
                      alt={product?.name || 'Produk'}
                      className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border border-slate-100 shrink-0"
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {renderBadge(alert.alert_type)}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            alert.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {alert.is_active ? 'Aktif' : 'Dijeda'}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-xs truncate max-w-sm">
                        {product?.name || 'Produk ID #' + alert.product_id}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="font-black text-[#003d29]">
                          {formatRupiah(product?.price)}
                        </span>
                        {product && (
                          <span className={`text-[11px] font-semibold ${
                            product.stock > 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                            {product.stock > 0 ? `Stok: ${product.stock} unit` : 'Stok Habis'}
                          </span>
                        )}
                        {product?.shop_name && (
                          <span className="text-[11px] text-slate-400">
                            Toko: {product.shop_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Target Price */}
                  <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Target Price display / inline edit */}
                    {isEditingPrice ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          placeholder="Harga target"
                          value={editTargetPriceInput}
                          onChange={(e) => setEditTargetPriceInput(e.target.value)}
                          className="w-28 px-2.5 py-1 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#003d29]"
                        />
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleSaveTargetPrice(alert.id)}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                          title="Simpan"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditTargetPrice}
                          className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                          title="Batal"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400 text-[11px]">Harga Target:</span>
                        <span className="font-extrabold text-slate-900">
                          {formatRupiah(alert.target_price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEditTargetPrice(alert)}
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Ubah Target Harga"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {product?.slug && onNavigateProduct && (
                        <button
                          type="button"
                          onClick={() => onNavigateProduct(product.slug)}
                          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                          title="Buka Halaman Produk"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggleStatus(alert)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          alert.is_active
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {alert.is_active ? (
                          <>
                            <Pause className="w-3 h-3" />
                            <span>Jeda</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            <span>Lanjut</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDelete(alert.id)}
                        className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                        title="Hapus Pantauan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {alert.last_notified_at && (
                      <span className="text-[10px] text-slate-400">
                        Notifikasi terakhir: {new Date(alert.last_notified_at).toLocaleDateString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
