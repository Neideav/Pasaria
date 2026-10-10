import React, { useState } from 'react';
import { X, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Order } from '../types';
import { api, ApiError } from '../services/api';
import { formatRupiah } from '../utils/formatters';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onReturnSubmitted?: () => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  isOpen,
  onClose,
  order,
  onReturnSubmitted,
}) => {
  const [reason, setReason] = useState('Barang Rusak / Cacat Pabrik');
  const [description, setDescription] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(() => {
    return order?.items && order.items.length > 0 ? order.items[0].id : null;
  });
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
  const [refundAmount, setRefundAmount] = useState(() => {
    if (!order) return '0';
    if (order.items && order.items.length > 0) {
      return String(order.items[0].price);
    }
    return String(order.total);
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !order) return null;

  const returnReasons = [
    'Barang Rusak / Cacat Pabrik',
    'Produk yang Diterima Tidak Sesuai Pesanan (Salah Warna/Model)',
    'Bagian / Kelengkapan Produk Tidak Lengkap',
    'Produk Berbeda Jauh dari Deskripsi atau Foto',
    'Paket Tidak Pernah Sampai',
  ];

  const handleItemChange = (itemId: number) => {
    setSelectedItemId(itemId);
    const itm = order.items?.find((i) => i.id === itemId);
    if (itm) {
      setReturnQuantity(1);
      setRefundAmount(String(itm.price * 1));
    }
  };

  const handleQuantityChange = (qty: number) => {
    const selectedItem = order.items?.find((i) => i.id === selectedItemId);
    const maxQty = selectedItem?.quantity || 1;
    const clamped = Math.max(1, Math.min(qty, maxQty));
    setReturnQuantity(clamped);
    if (selectedItem) {
      setRefundAmount(String(selectedItem.price * clamped));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!description.trim()) {
      setErrorMsg('Mohon jelaskan secara rinci alasan pengajuan komplain Anda.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const selectedItem = order.items?.find((i) => i.id === selectedItemId);
      await api.createReturn({
        order_id: order.id,
        shop_id: order.shop_id || selectedItem?.shop_id || 1,
        order_item_id: selectedItemId || undefined,
        quantity: selectedItemId ? returnQuantity : undefined,
        reason,
        description: description.trim(),
        requested_amount: parseFloat(refundAmount) || order.total,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onReturnSubmitted) onReturnSubmitted();
      }, 1500);
    } catch (err: any) {
      const msg =
        (err instanceof ApiError && err.getFirstValidationError()) ||
        err.message ||
        'Gagal mengajukan pengembalian. Silakan periksa data pengajuan.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const currentSelectedItem = order.items?.find((i) => i.id === selectedItemId);

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="motion-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      {/* Motion Point #27: ReturnModal Dialog Centered Scale Reveal (scale(0.96) -> scale(1) in 220ms) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-modal-title"
        className="motion-modal bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 text-left relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup modal komplain"
          className="motion-press absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
          <RotateCcw className="w-4 h-4" />
          <span>Layanan Retur & Komplain</span>
        </div>
        <h2 id="return-modal-title" className="text-xl font-extrabold text-slate-900 mb-1">
          Ajukan Pengembalian Dana / Barang
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          No. Pesanan: <span className="font-bold text-slate-900">#{order.order_number}</span> · Total: <span className="font-bold text-[#003d29]">{formatRupiah(order.total)}</span>
        </p>

        {success ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-slate-900">Pengajuan Berhasil Diterima</h3>
            <p className="text-xs text-slate-500">Penjual dan tim pusat resolusi PASARIA akan meninjau komplain Anda dalam 1x24 jam.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {order.items && order.items.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Produk yang Diretur:
                </label>
                <select
                  value={selectedItemId || ''}
                  onChange={(e) => handleItemChange(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] text-xs bg-white"
                >
                  {order.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.product_name} ({item.quantity} unit dibeli) — {formatRupiah(item.price)}/unit
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentSelectedItem && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Kuantitas yang Diretur:
                </label>
                <input
                  type="number"
                  min={1}
                  max={currentSelectedItem.quantity}
                  value={returnQuantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] text-xs font-bold"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Maksimal {currentSelectedItem.quantity} unit sesuai kuantitas pembelian.
                </span>
              </div>
            )}

            <div>
              <label htmlFor="return-reason-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Alasan Pengembalian:
              </label>
              <select
                id="return-reason-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] text-xs bg-white"
              >
                {returnReasons.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="return-description" className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Kendala & Bukti:
              </label>
              <textarea
                id="return-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan kondisi barang saat diterima dan masalah yang dialami..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] text-xs leading-relaxed"
                required
              />
            </div>

            <div>
              <label htmlFor="return-refund-amount" className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Dana yang Diminta Kembali (Rp):
              </label>
              <input
                id="return-refund-amount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                max={order.total}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] text-xs font-bold tabular-nums"
                required
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Maksimal nominal pengembalian: {formatRupiah(order.total)}
              </span>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="motion-press active:scale-[0.97] px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              {/* Motion Point #27: Tactile Press pada tombol kirim komplain (motion-press active:scale-[0.97]) */}
              <button
                type="submit"
                disabled={submitting}
                className="motion-press active:scale-[0.97] px-6 py-2.5 rounded-full font-bold text-white bg-rose-600 hover:bg-rose-700 transition-[background-color,transform,box-shadow] duration-160 ease-[var(--ease-out)] disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {submitting ? 'Memproses...' : 'Kirim Komplain'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
