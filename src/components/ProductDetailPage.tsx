import React, { useState, useEffect } from 'react';
import {
  Truck,
  RotateCcw,
  Minus,
  Plus,
  Heart,
  ChevronRight,
  Check,
  Share2,
  Store,
  ShieldCheck,
  Star,
  MessageCircle,
  HelpCircle,
  User,
  Send,
  AlertCircle
} from 'lucide-react';
import { Product, ProductVariant, Review, ProductQuestion } from '../types';
import { ProductVisual } from './ProductVisual';
import { ProductCard } from './ProductCard';
import { formatRupiah, formatDateTime } from '../utils/formatters';
import { api } from '../services/api';

interface ProductDetailPageProps {
  product: Product;
  relatedProducts: Product[];
  onAddToCart: (product: Product, quantity: number, color?: string, variantId?: number) => boolean | void;
  onBuyNow: (product: Product, quantity: number, color?: string, variantId?: number) => void;
  onSelectProduct: (product: Product) => void;
  onBackToHome: () => void;
  onViewShop?: (shopName: string, shopId?: number) => void;
  onOpenChatWithShop?: (shopId: number) => void;
  onOpenReviewModal?: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  relatedProducts,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  onBackToHome,
  onViewShop,
  onOpenChatWithShop,
  onOpenReviewModal,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [selectedColor, setSelectedColor] = useState(
    product.colors && product.colors.length > 0 ? product.colors[0].name : ''
  );
  const [selectedHex, setSelectedHex] = useState(
    product.colors && product.colors.length > 0 ? product.colors[0].hex : '#111827'
  );
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(Boolean(product.is_wishlisted));
  const [isFollowingShop, setIsFollowingShop] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewBreakdown, setReviewBreakdown] = useState<any>(null);

  // Q&A state
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [questionSuccess, setQuestionSuccess] = useState(false);

  useEffect(() => {
    // When product changes, reset variant & fetch reviews & questions
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
    loadReviewsAndQA();
  }, [product.id]);

  const loadReviewsAndQA = async () => {
    try {
      const data = await api.getProductReviews(product.id);
      setReviews(data.reviews || []);
      setReviewBreakdown(data.breakdown || null);
    } catch (e) {
      console.warn('Reviews load note:', e);
    }

    try {
      const qData = await api.getProductQuestions(product.id);
      setQuestions(qData || []);
    } catch (e) {
      console.warn('Questions load note:', e);
    }
  };

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  const colors = product.colors || [
    { name: 'Space Gray', hex: '#44474d' },
    { name: 'Silver', hex: '#dce0e3' },
    { name: 'Sky Blue', hex: '#7795ad' },
  ];

  const handleToggleWishlist = async () => {
    try {
      if (isWishlisted) {
        await api.removeFromWishlist(product.id);
        setIsWishlisted(false);
      } else {
        await api.addToWishlist(product.id);
        setIsWishlisted(true);
      }
    } catch (e) {
      console.warn('Wishlist toggle note:', e);
    }
  };

  const handleToggleFollowShop = async () => {
    if (!product.shop_id) return;
    try {
      if (isFollowingShop) {
        await api.unfollowShop(product.shop_id);
        setIsFollowingShop(false);
      } else {
        await api.followShop(product.shop_id);
        setIsFollowingShop(true);
      }
    } catch (e) {
      console.warn('Follow shop note:', e);
    }
  };

  const handleAdd = () => {
    const result = onAddToCart(product, quantity, selectedColor, selectedVariant?.id);
    if (result !== false) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 1600);
    }
  };

  const handleBuy = () => {
    onBuyNow(product, quantity, selectedColor, selectedVariant?.id);
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || submittingQuestion) return;

    setSubmittingQuestion(true);
    try {
      const res = await api.askQuestion(product.id, newQuestionText.trim());
      setQuestions((prev) => [res, ...prev]);
      setNewQuestionText('');
      setQuestionSuccess(true);
      setTimeout(() => setQuestionSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim pertanyaan. Silakan masuk terlebih dahulu.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 text-left">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 py-3 mb-4 overflow-x-auto whitespace-nowrap">
        <button onClick={onBackToHome} className="hover:text-slate-800 transition-colors">
          PASARIA
        </button>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="hover:text-slate-800 cursor-pointer">{product.category}</span>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-slate-800 font-semibold truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Two-Column PDP Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Product Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative rounded-3xl bg-[#f8f9fa] border border-slate-100 p-8 sm:p-12 flex items-center justify-center min-h-[380px] sm:min-h-[460px] shadow-2xs">
            {/* Wishlist & Share buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                onClick={handleToggleWishlist}
                className="w-10 h-10 rounded-full bg-white shadow-2xs border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                title="Wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Tautan produk berhasil disalin!');
                }}
                className="w-10 h-10 rounded-full bg-white shadow-2xs border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Bagikan"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Main Interactive Graphic */}
            <ProductVisual
              imageKey={product.image}
              name={product.name}
              colorHex={selectedHex}
              size="lg"
            />
          </div>

          {/* Color Thumbnails */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pt-2">
            {colors.map((c) => {
              const isSelected = selectedColor === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => {
                    setSelectedColor(c.name);
                    setSelectedHex(c.hex);
                  }}
                  className={`rounded-xl bg-[#f8f9fa] p-2 border-2 transition-all flex flex-col items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'border-[#003d29] shadow-xs'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <ProductVisual
                    imageKey={product.image}
                    colorHex={c.hex}
                    size="sm"
                    className="w-12 h-12"
                  />
                  <span className="text-[10px] font-medium text-slate-600 mt-1 truncate max-w-full">
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Purchase Module */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            {product.badge && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-[#003d29] border border-emerald-100 inline-block mb-2">
                {product.badge}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              {product.name}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed">
              {product.short_desc || product.description}
            </p>

            {/* Stars & Rating Summary */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 text-emerald-600 text-sm font-bold">
                <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                <span>{Number(product.rating || 5).toFixed(1)}</span>
              </div>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs font-semibold text-slate-500">
                {product.review_count || reviews.length} Ulasan Terverifikasi
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Terjual {product.review_count ? product.review_count * 2 + 15 : 24}+
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-[#003d29] tabular-nums">
                {formatRupiah(currentPrice)}
              </span>
              {product.original_price && (
                <span className="text-sm line-through text-slate-400 tabular-nums">
                  {formatRupiah(product.original_price)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Harga sudah termasuk Pajak PPN 11% sesuai ketentuan resmi.
            </p>
          </div>

          {/* Product Variants (Storage, Type, etc.) */}
          {product.variants && product.variants.length > 0 && (
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <div className="text-xs font-semibold text-slate-800">
                Pilih Varian:{' '}
                <span className="text-[#003d29] font-bold">
                  {selectedVariant ? selectedVariant.name : 'Pilih Varian'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-[#003d29] text-white border-[#003d29] shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {v.name} · {formatRupiah(v.price)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color Selector */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="text-xs font-semibold text-slate-800">
              Pilihan Warna: <span className="text-slate-500 font-normal">{selectedColor}</span>
            </div>
            <div className="flex items-center gap-3">
              {colors.map((c) => {
                const isSelected = selectedColor === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => {
                      setSelectedColor(c.name);
                      setSelectedHex(c.hex);
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-[#003d29]'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Stock */}
          <div className="border-t border-slate-100 pt-5 flex flex-wrap items-center gap-6">
            <div className="flex items-center bg-slate-100/90 rounded-full px-3 py-1.5 border border-slate-200/60">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-30"
                disabled={quantity <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-slate-800 tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(currentStock || 99, quantity + 1))}
                disabled={quantity >= currentStock}
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-30"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Tersisa <span className="font-bold text-amber-700 tabular-nums">{currentStock} unit</span>
              <br />
              <span className="text-slate-400">Garansi originalitas PASARIA</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleBuy}
              className="w-full sm:w-1/2 py-3.5 px-6 rounded-full font-bold text-white bg-[#003d29] hover:bg-[#064e3b] active:scale-[0.99] shadow-md shadow-emerald-950/10 text-sm transition-all cursor-pointer"
            >
              Beli Sekarang
            </button>
            <button
              onClick={handleAdd}
              className={`w-full sm:w-1/2 py-3.5 px-6 rounded-full font-semibold text-sm transition-all border cursor-pointer flex items-center justify-center gap-2 ${
                addedSuccess
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-800 border-slate-300 hover:border-slate-800 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Masuk Keranjang</span>
                </>
              ) : (
                <span>+ Keranjang Belanja</span>
              )}
            </button>
          </div>

          {/* Seller / Store Information Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center font-extrabold text-[#003d29] shadow-2xs overflow-hidden shrink-0">
                {product.shop_logo ? (
                  <img src={product.shop_logo} alt={product.shop_name || 'Store'} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-5 h-5 text-[#003d29]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 text-sm">
                    {product.shop_name || 'PASARIA Official Merchant'}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>📍 {product.shop_city || 'Jakarta'}</span>
                  <span>·</span>
                  <span className="text-emerald-700 font-semibold">★ 5.0 Rating Toko</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {product.shop_id && (
                <button
                  onClick={handleToggleFollowShop}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isFollowingShop
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-white hover:bg-emerald-50 text-[#003d29] border-emerald-200 shadow-2xs'
                  }`}
                >
                  {isFollowingShop ? 'Mengikuti ✓' : '+ Ikuti'}
                </button>
              )}
              {onOpenChatWithShop && product.shop_id && (
                <button
                  onClick={() => onOpenChatWithShop(product.shop_id!)}
                  className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-[#003d29] border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                  title="Chat Penjual"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              )}
              {onViewShop && (
                <button
                  onClick={() => onViewShop(product.shop_name || 'PASARIA Official Store', product.shop_id)}
                  className="py-2 px-3.5 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  Kunjungi Toko
                </button>
              )}
            </div>
          </div>

          {/* Delivery & Return info cards */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-amber-50/40 border border-amber-100/60">
              <div className="w-8 h-8 rounded-lg bg-amber-100/80 flex items-center justify-center text-amber-700 shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900">Pengiriman Cepat & Terjamin</div>
                <div className="text-slate-500 mt-0.5">
                  Tersedia kurir Instant, Sameday, Next Day, dan Reguler dengan resi real-time.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-amber-50/40 border border-amber-100/60">
              <div className="w-8 h-8 rounded-lg bg-amber-100/80 flex items-center justify-center text-amber-700 shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900">Garansi Retur PASARIA 14 Hari</div>
                <div className="text-slate-500 mt-0.5">
                  Jaminan pengembalian dana penuh jika produk rusak atau cacat pabrik.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      <div className="mt-16 border-t border-slate-100 pt-10">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
          Spesifikasi Produk Lengkap
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#fafafa] rounded-3xl p-6 sm:p-8 border border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              Informasi Umum
            </h3>
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Nama Produk</dt>
                <dd className="font-semibold text-slate-800">{product.name}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Kategori</dt>
                <dd className="font-semibold text-slate-800">{product.category}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">SKU / Seri</dt>
                <dd className="font-semibold text-slate-800">{selectedVariant?.sku || 'PASARIA-STD-001'}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Garansi</dt>
                <dd className="font-semibold text-slate-800">12 Bulan Garansi Resmi</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              Detail Logistik & Stok
            </h3>
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Kondisi</dt>
                <dd className="font-semibold text-slate-800">Baru (100% Original)</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Stok Tersedia</dt>
                <dd className="font-semibold text-emerald-700">{currentStock} Unit</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Dikirim Dari</dt>
                <dd className="font-semibold text-slate-800">{product.shop_city || 'Jakarta'}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Estimasi Berat</dt>
                <dd className="font-semibold text-slate-800">500 Gram</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Ratings & Reviews Section (Verified Purchase) */}
      <div className="mt-16 border-t border-slate-100 pt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Ulasan & Penilaian Pembeli
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ulasan asli dari pembeli yang telah menyelesaikan transaksi di PASARIA.
            </p>
          </div>
          {onOpenReviewModal && (
            <button
              onClick={() => onOpenReviewModal(product)}
              className="px-5 py-2.5 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              + Beri Ulasan
            </button>
          )}
        </div>

        {/* Rating Breakdown Bars */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xs mb-8">
          <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
            <span className="text-5xl font-black text-slate-900 tabular-nums">
              {Number(product.rating || 5).toFixed(1)}
            </span>
            <div className="flex text-amber-400 my-2 text-base">★★★★★</div>
            <span className="text-xs text-slate-400">
              Berdasarkan {reviews.length} ulasan terverifikasi
            </span>
          </div>

          <div className="md:col-span-8 space-y-2 text-xs">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviewBreakdown ? reviewBreakdown[stars] || 0 : stars === 5 ? reviews.length : 0;
              const total = reviews.length || 1;
              const percent = Math.round((count / total) * 100);
              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="w-10 font-bold text-slate-700 flex items-center gap-1">
                    {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-slate-400 font-semibold tabular-nums">
                    {count} ({percent}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs bg-slate-50/50 rounded-2xl">
              Belum ada ulasan untuk produk ini. Jadilah pembeli pertama yang memberikan ulasan!
            </div>
          ) : (
            reviews.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#003d29] font-bold flex items-center justify-center text-xs">
                      {r.is_anonymous ? 'U' : (r.user?.name ? r.user.name.charAt(0) : 'U')}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">
                        {r.is_anonymous ? 'Pengguna PASARIA' : (r.user?.name || 'Pembeli Terverifikasi')}
                      </span>
                      {r.is_verified_purchase && (
                        <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          ✓ Pembelian Terverifikasi
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {'★'.repeat(r.rating)}
                    <span className="text-slate-400 text-[11px] ml-1">
                      {formatDateTime(r.created_at)}
                    </span>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed font-normal">
                  {r.review_text}
                </p>

                {/* Seller Reply Display */}
                {r.seller_reply && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border-l-4 border-[#003d29] space-y-1">
                    <div className="font-bold text-[#003d29] text-[11px] flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5" />
                      <span>Respon dari Penjual:</span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {r.seller_reply}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Product Questions & Answers (Q&A) */}
      <div className="mt-16 border-t border-slate-100 pt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#003d29]" />
              Tanya Jawab Produk ({questions.length})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ada pertanyaan seputar produk ini? Tanyakan langsung kepada penjual.
            </p>
          </div>
        </div>

        {/* Ask Question Form */}
        <form onSubmit={handleAskQuestion} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs mb-6 text-xs">
          {questionSuccess && (
            <div className="p-3 mb-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Pertanyaan Anda berhasil dikirim! Penjual akan segera menjawab.</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="Contoh: Apakah barang ini bergaransi resmi Indonesia? Warna hitam ready?"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#003d29] focus:outline-none text-xs"
            />
            <button
              type="submit"
              disabled={!newQuestionText.trim() || submittingQuestion}
              className="px-5 py-2.5 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Tanya</span>
            </button>
          </div>
        </form>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-2xl">
              Belum ada pertanyaan untuk produk ini.
            </div>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    Q
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{q.question}</span>
                    <span className="text-[10px] text-slate-400 ml-2">{formatDateTime(q.created_at)}</span>
                  </div>
                </div>

                {q.answers && q.answers.length > 0 ? (
                  q.answers.map((ans) => (
                    <div key={ans.id} className="ml-8 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#003d29] font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        A
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#003d29] text-[11px]">
                            {ans.shop?.name || product.shop_name || 'Penjual Resmi'}
                          </span>
                          <span className="text-[9px] font-bold bg-emerald-200/70 text-[#003d29] px-1.5 py-0.2 rounded-full">
                            Penjual
                          </span>
                        </div>
                        <p className="text-slate-700 mt-1 leading-relaxed">{ans.answer}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ml-8 text-[11px] text-slate-400 italic">
                    Menunggu jawaban dari penjual...
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Similar Items */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Produk Terkait yang Mungkin Anda Suka
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-3.5">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={onSelectProduct}
                onAddToCart={(prod) => onAddToCart(prod, 1)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
