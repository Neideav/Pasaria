import React, { useState } from 'react';
import { X, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  orderId?: number;
  orderItemId?: number;
  productName: string;
  onReviewSubmitted?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  orderId,
  orderItemId,
  productName,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      setErrorMsg('Mohon isi ulasan pengalaman produk Anda.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.createReview({
        product_id: productId,
        order_id: orderId,
        order_item_id: orderItemId,
        rating,
        review_text: reviewText.trim(),
        is_anonymous: isAnonymous,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onReviewSubmitted) onReviewSubmitted();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim ulasan. Pastikan Anda adalah pembeli terverifikasi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="motion-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        className="motion-modal bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 text-left relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup modal ulasan"
          className="motion-press absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-extrabold text-slate-900 mb-1">
          Beri Ulasan Produk
        </h2>
        <p className="text-xs text-slate-500 mb-6 truncate font-medium">
          Produk: <span className="text-slate-800 font-bold">{productName}</span>
        </p>

        {success ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-slate-900">Ulasan Berhasil Dikirim!</h3>
            <p className="text-xs text-slate-500">Terima kasih telah berbagi pengalaman dengan pembeli lainnya.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Star Rating Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Kualitas Produk & Kepuasan:
              </label>
              <div className="flex items-center gap-2">
                {/* Motion Point #28: ReviewModal Star Rating Hover Scale & Click Bounce */}
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Beri ${star} bintang`}
                    className="motion-press p-1 focus:outline-none cursor-pointer hover:scale-125 active:scale-90 transition-transform duration-120 ease-[var(--ease-out)] origin-center"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">
                  {rating === 5 && 'Sangat Puas (5/5)'}
                  {rating === 4 && 'Puas (4/5)'}
                  {rating === 3 && 'Cukup (3/5)'}
                  {rating === 2 && 'Kurang (2/5)'}
                  {rating === 1 && 'Sangat Kecewa (1/5)'}
                </span>
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tulis Ulasan Anda:
              </label>
              <textarea
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Ceritakan kualitas bahan, kepuasan fungsi, kesesuaian deskripsi, dan kecepatan pengiriman..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] text-xs leading-relaxed"
                required
              />
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymousReview"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-[#003d29] rounded-md border-slate-300 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="anonymousReview" className="text-slate-600 font-medium cursor-pointer">
                Sembunyikan nama saya (Tampilkan sebagai Pengguna Terverifikasi)
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="motion-press active:scale-[0.97] px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="motion-press active:scale-[0.97] px-6 py-2.5 rounded-full font-bold text-white bg-[#003d29] hover:bg-[#064e3b] transition-[background-color,transform,box-shadow] duration-160 ease-[var(--ease-out)] disabled:opacity-40 cursor-pointer"
              >
                {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
