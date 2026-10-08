import React, { useState } from 'react';
import { X, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';
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
  const [refundAmount, setRefundAmount] = useState(order ? String(order.total) : '0');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Mohon jelaskan secara rinci alasan pengajuan komplain Anda.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.createReturn({
        order_id: order.id,
        shop_id: order.shop_id || 1,
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
      setErrorMsg(err.message || 'Gagal mengajukan pengembalian.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 text-left relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
          <RotateCcw className="w-4 h-4" />
          <span>Layanan Retur & Komplain</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 mb-1">
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
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alasan Pengembalian:
              </label>
              <select
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Kendala & Bukti:
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan kondisi barang saat diterima dan masalah yang dialami..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] text-xs leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Dana yang Diminta Kembali (Rp):
              </label>
              <input
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
                className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-full font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
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
