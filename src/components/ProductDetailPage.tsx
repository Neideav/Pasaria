import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  Minus,
  Plus,
  Heart,
  ChevronRight,
  Check,
  Share2,
  Store,
  Star,
  MessageCircle,
  HelpCircle,
  Send,
  BellRing,
  MapPin,
  BadgeCheck,
  ThumbsUp,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Product, ProductVariant, Review, ProductQuestion } from '../types';
import { ProductVisual } from './ProductVisual';
import { ProductCard } from './ProductCard';
import { formatRupiah, formatDateTime } from '../utils/formatters';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

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
  const { showToast } = useToast();
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
  const [justWishlisted, setJustWishlisted] = useState(false);
  const [isFollowingShop, setIsFollowingShop] = useState(false);

  // Motion: Momentary blur & crossfade on gallery switch
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);
  const imageTransitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lower tabs state: Description, Additional Information, Review, Q&A
  const [lowerTab, setLowerTab] = useState<'description' | 'additional' | 'review' | 'qa'>('review');
  const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [filterStar, setFilterStar] = useState<number | 'all'>('all');
  const [filterWithMedia, setFilterWithMedia] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewBreakdown, setReviewBreakdown] = useState<any>(null);

  // Q&A state
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [questionSuccess, setQuestionSuccess] = useState(false);

  // FAQ Accordion State (first item open by default)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
    loadReviewsAndQA();
  }, [product.id]);

  useEffect(() => {
    return () => {
      if (imageTransitionTimeoutRef.current) {
        clearTimeout(imageTransitionTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectColor = (colorName: string, hex: string) => {
    if (colorName === selectedColor) return;
    setIsImageTransitioning(true);
    if (imageTransitionTimeoutRef.current) {
      clearTimeout(imageTransitionTimeoutRef.current);
    }
    setSelectedColor(colorName);
    setSelectedHex(hex);
    imageTransitionTimeoutRef.current = setTimeout(() => {
      setIsImageTransitioning(false);
    }, 180);
  };

  const loadReviewsAndQA = async () => {
    const [reviewsResult, questionsResult] = await Promise.allSettled([
      api.getProductReviews(product.id),
      api.getProductQuestions(product.id),
    ]);

    if (reviewsResult.status === 'fulfilled') {
      const data = reviewsResult.value;
      setReviews(data?.reviews || []);
      setReviewBreakdown(data?.breakdown || null);
    } else {
      console.warn('Reviews load note:', reviewsResult.reason);
    }

    if (questionsResult.status === 'fulfilled') {
      const qData = questionsResult.value;
      setQuestions(qData || []);
    } else {
      console.warn('Questions load note:', questionsResult.reason);
    }
  };

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  const colors = product.colors || [
    { name: 'Green', hex: '#e4f7a2' },
    { name: 'Dark Gray', hex: '#44474d' },
    { name: 'Soft Peach', hex: '#f6d1c9' },
  ];

  // Sizes for shoes / apparel or variants
  const defaultSizes = ['40', '41', '42', '43', '44', '45', '46', '47'];

  const handleToggleWishlist = async () => {
    try {
      if (isWishlisted) {
        await api.removeFromWishlist(product.id);
        setIsWishlisted(false);
      } else {
        await api.addToWishlist(product.id);
        setIsWishlisted(true);
        setJustWishlisted(true);
        setTimeout(() => setJustWishlisted(false), 300);
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
      showToast('Pertanyaan berhasil dikirim!', 'success');
      setTimeout(() => setQuestionSuccess(false), 3000);
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim pertanyaan. Silakan masuk terlebih dahulu.', 'error');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterStar !== 'all' && r.rating !== filterStar) return false;
    return true;
  });

  return (
    <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 sm:pb-14 text-left">
      {/* Breadcrumb Navigation Minimalist */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 py-2 mb-6 overflow-x-auto whitespace-nowrap">
        <button onClick={onBackToHome} className="hover:text-slate-800 font-medium transition-colors cursor-pointer">
          PASARIA
        </button>
        <span className="text-slate-300">•</span>
        <span className="hover:text-slate-800 cursor-pointer font-medium">{product.category}</span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-700 font-semibold truncate max-w-[280px]">{product.name}</span>
      </nav>

      {/* ========================================================= */}
      {/* 2-COLUMN MODERN MINIMALIST HERO (Left: Stage, Right: Info) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: HERO STAGE + THUMBNAILS (6.5 / 12 Cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Stage Card with Pastel Tinted Backdrop */}
          <div
            className="relative rounded-3xl p-8 sm:p-14 flex items-center justify-center min-h-[380px] sm:min-h-[460px] overflow-hidden transition-colors duration-300"
            style={{
              backgroundColor: `${selectedHex}18`, // Soft subtle matching tint
            }}
          >
            {/* Main Interactive Graphic */}
            <div
              className={`transition-[filter,opacity,transform] duration-200 ease-[var(--ease-out)] w-full flex items-center justify-center ${
                isImageTransitioning ? 'blur-[2px] opacity-70 scale-95' : 'blur-0 opacity-100 scale-100'
              }`}
            >
              <ProductVisual
                imageKey={product.image}
                name={product.name}
                colorHex={selectedHex}
                size="lg"
                className="max-h-[340px] drop-shadow-md"
              />
            </div>
          </div>

          {/* Thumbnail Gallery underneath (Active border + preview cards) */}
          <div className="flex items-center gap-3 overflow-x-auto py-1">
            {colors.map((c, idx) => {
              const isSelected = selectedColor === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleSelectColor(c.name, c.hex)}
                  className={`w-20 h-20 rounded-2xl p-2 border-2 transition-all cursor-pointer flex flex-col items-center justify-center shrink-0 motion-press active:scale-95 ${
                    isSelected
                      ? 'border-[#003d29] bg-white ring-2 ring-emerald-100 shadow-2xs'
                      : 'border-slate-200/80 bg-slate-50/80 hover:border-slate-300'
                  }`}
                  style={{
                    backgroundColor: isSelected ? '#ffffff' : `${c.hex}14`,
                  }}
                  title={c.name}
                >
                  <ProductVisual
                    imageKey={product.image}
                    colorHex={c.hex}
                    size="sm"
                    className="w-12 h-12 object-contain"
                  />
                </button>
              );
            })}

            {/* Extra Thumbnail placeholder (+ 4 more like reference) */}
            <div className="w-20 h-20 rounded-2xl border border-dashed border-slate-200 bg-white flex items-center justify-center text-xs font-semibold text-slate-400 shrink-0 select-none">
              +4 Foto
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: PRODUCT DETAILS & ACTIONS (5.5 / 12 Cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Brand Logo & Name Header */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#003d29] mb-1.5">
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <Store className="w-2.5 h-2.5 text-[#003d29]" />
              </div>
              <span>{product.shop_name || 'PASARIA Official'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Star Rating & Total Reviews */}
            <div className="flex items-center gap-2 mt-2 text-xs">
              <div className="flex text-amber-400">
                {'★'.repeat(5)}
              </div>
              <span className="text-slate-500 font-medium">
                {product.review_count || reviews.length || 128} Ulasan Terverifikasi
              </span>
            </div>
          </div>

          {/* Product Description Paragraph */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              Deskripsi Produk
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {product.short_desc ||
                product.description ||
                'Produk eksklusif dengan material premium berdaya tahan tinggi, dirancang untuk kenyamanan maksimal sepanjang hari dengan jaminan kualitas resmi PASARIA.'}
            </p>
          </div>

          {/* Big Price Display */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums tracking-tight">
              {formatRupiah(currentPrice)}
            </span>
            {product.original_price && (
              <span className="text-sm line-through text-slate-400 tabular-nums">
                {formatRupiah(product.original_price)}
              </span>
            )}
            {product.discount_percent && (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full tabular-nums">
                Hemat {product.discount_percent}%
              </span>
            )}
          </div>

          {/* Color Selector with soft pill thumbnails (Ref: Color • Green) */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-900">
              Warna: <span className="text-slate-500 font-normal">{selectedColor}</span>
            </div>
            <div className="flex items-center gap-2.5">
              {colors.map((c) => {
                const isSelected = selectedColor === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleSelectColor(c.name, c.hex)}
                    className={`w-14 h-14 rounded-2xl p-1.5 border-2 transition-all cursor-pointer flex items-center justify-center motion-press active:scale-95 ${
                      isSelected
                        ? 'border-[#003d29] ring-2 ring-emerald-100 shadow-2xs'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                    style={{ backgroundColor: `${c.hex}22` }}
                    title={c.name}
                  >
                    <ProductVisual
                      imageKey={product.image}
                      colorHex={c.hex}
                      size="sm"
                      className="w-10 h-10 object-contain"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Variants (if product has variants) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-900">
                Pilih Varian:{' '}
                <span className="text-slate-500 font-normal">
                  {selectedVariant ? selectedVariant.name : 'Pilih Varian'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer motion-press active:scale-95 ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Stepper (Minimalist Pill Ref: [-] 1 [+]) */}
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                aria-label="Kurangi kuantitas"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-xs font-bold text-slate-900 tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(currentStock || 99, quantity + 1))}
                disabled={quantity >= currentStock}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 cursor-pointer transition-colors shadow-2xs"
                aria-label="Tambah kuantitas"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="text-xs text-slate-400">
              Tersedia <span className="font-semibold text-slate-700 tabular-nums">{currentStock} stok</span>
            </span>
          </div>

          {/* Action Buttons Row: [Buy Now] [Add To Cart] [Wishlist Button] */}
          <div className="flex items-center gap-3 pt-2">
            {/* Primary Buy Now (Solid Dark / Forest Green) */}
            <button
              type="button"
              onClick={handleBuy}
              className="flex-1 py-3.5 px-6 min-h-[48px] rounded-xl font-bold text-xs sm:text-sm text-white bg-slate-900 hover:bg-[#003d29] motion-press active:scale-[0.98] transition-all cursor-pointer shadow-sm text-center"
            >
              Beli Langsung
            </button>

            {/* Secondary Add To Cart (Clean Outline) */}
            <button
              type="button"
              onClick={handleAdd}
              className={`flex-1 py-3.5 px-6 min-h-[48px] rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer motion-press active:scale-[0.98] flex items-center justify-center gap-2 ${
                addedSuccess
                  ? 'bg-emerald-50 text-[#003d29] border-emerald-300'
                  : 'bg-white text-slate-800 border-slate-300 hover:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Ditambahkan</span>
                </>
              ) : (
                <span>+ Keranjang</span>
              )}
            </button>

            {/* Wishlist Icon Button */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              className={`w-12 h-12 min-h-[48px] rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 motion-press active:scale-90 ${
                isWishlisted
                  ? 'bg-rose-50 border-rose-200 text-rose-500'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900'
              }`}
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
            </button>
          </div>

          {/* Escrow & Buyer Protection Guarantee */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-slate-600">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50">
              <ShieldCheck className="w-4 h-4 text-[#003d29] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">PASARIA Escrow</span>
                <span className="text-slate-500">Dana ditahan aman sampai barang tiba tanpa cacat.</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50">
              <RefreshCw className="w-4 h-4 text-[#003d29] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">14 Hari Retur Gratis</span>
                <span className="text-slate-500">Jaminan tukar ukuran atau pengembalian dana 100%.</span>
              </div>
            </div>
          </div>

          {/* Delivery Note (Ref: 🚚 Free Delivery On Order Over $200) */}
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
            <Truck className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Gratis ongkir untuk pesanan di atas Rp200.000 dengan estimasi 1-3 hari.</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION INFORMASI TOKO & PENGIRIMAN (CARD CONTAINER) */}
      {/* ========================================================= */}
      <div className="mt-14 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* Toko / Merchant Profile Info (Left 7 Cols) */}
          <div className="md:col-span-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 md:pb-0 md:border-r md:border-slate-100 md:pr-8">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-800 shrink-0 overflow-hidden">
                {product.shop_logo ? (
                  <img src={product.shop_logo} alt={product.shop_name || 'Shop'} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-5 h-5 text-slate-700" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                    {product.shop_name || 'PASARIA Official Store'}
                  </h3>
                  <BadgeCheck className="w-4 h-4 text-[#003d29] shrink-0" />
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="font-medium text-slate-600">Kota {product.shop_city || 'Jakarta Selatan'}</span>
                  <span>•</span>
                  <span className="text-slate-900 font-bold">★ 4.9 Rating Toko</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Follow, Kunjungi, Chat */}
            <div className="flex items-center gap-2 shrink-0">
              {product.shop_id && (
                <button
                  type="button"
                  onClick={handleToggleFollowShop}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isFollowingShop
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-slate-900 hover:bg-[#003d29] text-white shadow-2xs'
                  }`}
                >
                  {isFollowingShop ? 'Mengikuti' : 'Follow'}
                </button>
              )}
              {onViewShop && (
                <button
                  type="button"
                  onClick={() => onViewShop(product.shop_name || 'PASARIA Official Store', product.shop_id)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 hover:border-slate-800 text-slate-800 bg-white transition-all cursor-pointer"
                >
                  Kunjungi Toko
                </button>
              )}
              {onOpenChatWithShop && product.shop_id && (
                <button
                  type="button"
                  onClick={() => onOpenChatWithShop(product.shop_id!)}
                  className="p-1.5 rounded-xl border border-slate-200 hover:border-slate-800 text-slate-700 transition-all cursor-pointer"
                  title="Chat Penjual"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Pengiriman & Estimasi (Right 5 Cols) */}
          <div className="md:col-span-5 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Truck className="w-4 h-4 text-slate-800" />
              <span>Pengiriman & Garansi</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span>
                Dikirim dari <span className="font-semibold text-slate-900">{product.shop_city || 'Jakarta Selatan'}</span>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-3.5 text-center font-bold text-slate-900 shrink-0">✓</span>
              <span>
                Ongkir Reguler <span className="font-bold text-slate-900">Rp0 - Rp12.000</span> (Bebas Ongkir tersedia)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pl-5.5 leading-relaxed">
              Estimasi 1 - 3 hari kerja. Dilengkapi jaminan keaslian dan proteksi pembeli 14 hari.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTIONS: Description -> Additional Info -> Reviews -> Q&A */}
      {/* ========================================================= */}
      <div className="mt-20 border-t border-slate-200/80 pt-12 space-y-16">
        {/* UNIFIED CONTAINER: Description & Additional Information */}
        <div className="max-w-4xl rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 space-y-8 shadow-2xs">
          {/* 1. DESCRIPTION SECTION */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Description
            </h3>
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3 font-normal">
              <p>
                {product.description ||
                  product.short_desc ||
                  'Produk ini dirancang secara presisi dengan memadukan kenyamanan, fungsionalitas, dan estetika modern. Material pilihan berkualitas tinggi memastikan daya tahan jangka panjang serta performa optimal untuk aktivitas harian Anda.'}
              </p>
              <p>
                Didistribusikan resmi melalui jaringan merchant PASARIA terverifikasi, menjamin keaslian 100% dengan garansi retur dan perlindungan konsumen penuh.
              </p>

            </div>
          </section>

          <div className="border-t border-slate-100" />

          {/* 2. ADDITIONAL INFORMATION SECTION */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Additional Information
            </h3>
            <table className="w-full text-xs sm:text-sm">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="w-1/3 py-2.5 font-semibold text-slate-500">Kategori</td>
                  <td className="py-2.5 text-slate-900 font-medium">{product.category}</td>
                </tr>
                <tr>
                  <td className="w-1/3 py-2.5 font-semibold text-slate-500">Kondisi</td>
                  <td className="py-2.5 text-slate-900 font-medium">Baru (100% Original)</td>
                </tr>
                <tr>
                  <td className="w-1/3 py-2.5 font-semibold text-slate-500">SKU / Kode Produk</td>
                  <td className="py-2.5 font-mono text-slate-900">{selectedVariant?.sku || `PSR-${product.id}-001`}</td>
                </tr>
                <tr>
                  <td className="w-1/3 py-2.5 font-semibold text-slate-500">Dikirim Dari</td>
                  <td className="py-2.5 text-slate-900 font-medium">{product.shop_city || 'Jakarta Selatan'}</td>
                </tr>
                <tr>
                  <td className="w-1/3 py-2.5 font-semibold text-slate-500">Estimasi Berat</td>
                  <td className="py-2.5 text-slate-900 font-medium">500 Gram</td>
                </tr>
                <tr>
                  <td className="w-1/3 py-2.5 font-semibold text-slate-500">Garansi Toko</td>
                  <td className="py-2.5 text-slate-900 font-medium">Garansi Resmi 12 Bulan</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        {/* 3. REVIEW SECTION (WRAPPED IN DEDICATED CONTAINER) */}
        <div className="max-w-4xl rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 space-y-8 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Review
            </h3>
            {onOpenReviewModal && (
              <button
                type="button"
                onClick={() => onOpenReviewModal(product)}
                className="px-4 py-2 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                + Beri Ulasan
              </button>
            )}
          </div>

          {/* Rating Summary Box (4.8 out of 5 + Amber 5-to-1 Star Progress Bars) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-2 border-b border-slate-100 pb-8">
            {/* Left Score Column */}
            <div className="md:col-span-4 flex flex-col items-center justify-center md:border-r border-slate-100 md:pr-8 text-center">
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl sm:text-6xl font-extrabold text-slate-900 tabular-nums">
                  {Number(product.rating || 4.8).toFixed(1)}
                </span>
                <span className="text-slate-400 text-xs sm:text-sm font-medium">out of 5</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400 my-2 text-sm">
                {'★'.repeat(5)}
              </div>
              <span className="text-xs text-slate-400">
                ({product.review_count || reviews.length || 245} Review)
              </span>
            </div>

            {/* Right Progress Bars Column */}
            <div className="md:col-span-8 space-y-2 text-xs">
              {[
                { star: 5, pct: 80 },
                { star: 4, pct: 45 },
                { star: 3, pct: 15 },
                { star: 2, pct: 8 },
                { star: 1, pct: 2 },
              ].map((item) => {
                const count = reviewBreakdown ? reviewBreakdown[item.star] || 0 : undefined;
                return (
                  <div key={item.star} className="flex items-center gap-3">
                    <span className="w-12 text-slate-500 font-medium">{item.star} Star</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${count !== undefined && reviews.length > 0 ? Math.round((count / reviews.length) * 100) : item.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review List Header: Title, Total, and Sort Dropdown */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Review List</h4>
              <p className="text-slate-400 mt-0.5">
                Showing 1-{reviews.length || 4} of {reviews.length || 24} results
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Sort by :</span>
              <select
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-[#003d29]"
              >
                <option value="newest">Newest</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </div>

          {/* Review Cards List */}
          <div className="space-y-6 divide-y divide-slate-100">
            {reviews.length === 0 ? (
              <>
                <div className="pt-4 space-y-3 text-xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80"
                        alt="Kristin Watson"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs">Kristin Watson</div>
                        <span className="text-[10px] text-slate-400">(Verified)</span>
                      </div>
                    </div>
                    <span className="text-slate-400 text-[11px]">1 month ago</span>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Absolutely love this product!
                    </h5>
                    <p className="text-slate-600 leading-relaxed font-normal">
                      Kualitasnya sangat melampaui ekspektasi. Jahitan rapi, bantalan sol sangat empuk untuk pemakaian seharian, dan warnanya persis seperti di foto. Pengiriman juga super cepat!
                    </p>
                    <div className="flex items-center gap-1.5 text-amber-400 pt-0.5">
                      {'★'.repeat(5)}
                      <span className="text-slate-500 font-bold text-[11px] ml-1">5.0</span>
                    </div>
                  </div>

                  {/* Customer Photo Thumbnails underneath */}
                  <div className="flex items-center gap-3 pt-2">
                    {colors.map((c, i) => (
                      <div
                        key={i}
                        className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center overflow-hidden hover:border-[#003d29] transition-colors cursor-pointer"
                      >
                        <ProductVisual imageKey={product.image} colorHex={c.hex} size="sm" className="w-14 h-14" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 space-y-3 text-xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                        alt="Jenny Wilson"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs">Jenny Wilson</div>
                        <span className="text-[10px] text-slate-400">(Verified)</span>
                      </div>
                    </div>
                    <span className="text-slate-400 text-[11px]">2 months ago</span>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Perfect for my daily routine!
                    </h5>
                    <p className="text-slate-600 leading-relaxed font-normal">
                      Sangat nyaman dipakai bekerja seharian. Desainnya sangat stylish dan pas di kaki. Pasti akan order varian warna lainnya di toko ini.
                    </p>
                    <div className="flex items-center gap-1.5 text-amber-400 pt-0.5">
                      {'★'.repeat(5)}
                      <span className="text-slate-500 font-bold text-[11px] ml-1">5.0</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="pt-5 space-y-3 text-xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#003d29] border border-emerald-100 font-bold flex items-center justify-center text-xs">
                        {r.is_anonymous ? 'U' : (r.user?.name ? r.user.name.charAt(0) : 'U')}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {r.is_anonymous ? 'Pengguna PASARIA' : (r.user?.name || 'Pembeli Terverifikasi')}
                        </div>
                        {r.is_verified_purchase && (
                          <span className="text-[10px] text-slate-400">(Verified)</span>
                        )}
                      </div>
                    </div>
                    <span className="text-slate-400 text-[11px]">{formatDateTime(r.created_at)}</span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-slate-700 leading-relaxed font-normal">
                      {r.review_text}
                    </p>
                    <div className="flex items-center gap-1.5 text-amber-400 pt-0.5">
                      {'★'.repeat(r.rating)}
                      <span className="text-slate-500 font-bold text-[11px] ml-1">
                        {Number(r.rating).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Clean Minimalist Seller Reply (Bubble Style instead of green stripe) */}
                  {r.seller_reply && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px]">
                        <Store className="w-3.5 h-3.5 text-slate-600" />
                        <span>Respon Penjual:</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed pl-5">
                        {r.seller_reply}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Q&A SECTION (WRAPPED IN DEDICATED CONTAINER) */}
        <div className="max-w-4xl rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 space-y-6 shadow-2xs">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#003d29]" />
              Tanya Jawab & Diskusi Produk
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Punya pertanyaan seputar ukuran, stok, atau garansi? Tanyakan langsung kepada penjual.
            </p>
          </div>

          <form
            onSubmit={handleAskQuestion}
            className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200/80 text-xs"
          >
            {questionSuccess && (
              <div className="p-3 mb-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Pertanyaan berhasil dikirim!</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Ketik pertanyaan Anda di sini..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white focus:bg-white border border-slate-200 focus:border-[#003d29] focus:outline-none text-xs"
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

          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-slate-100">
                Belum ada pertanyaan untuk produk ini.
              </div>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="bg-slate-50/70 rounded-xl p-4 border border-slate-100 space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      Q
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">{q.question}</span>
                      <span className="text-[10px] text-slate-400 ml-2">{formatDateTime(q.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 5. FAQ SECTION (PRODUCT-SPECIFIC FREQUENTLY ASKED QUESTIONS) */}
        <div className="max-w-4xl rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 space-y-6 shadow-2xs">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#003d29]" />
              FAQ Produk {product.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Pertanyaan umum mengenai spesifikasi, kelengkapan kotak, dan garansi resmi produk ini.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: `Apa saja kelengkapan yang ada di dalam kotak pembelian ${product.name}?`,
                a: `Paket penjualan mencakup 1x unit ${product.name} original, kartu garansi resmi, buku panduan pemakaian, serta aksesoris bawaan pabrik lengkap dalam kondisi segel baru (brand new in box).`,
              },
              {
                q: 'Apakah unit ini bergaransi resmi Indonesia?',
                a: 'Ya, produk ini dijamin 100% bergaransi resmi selama 12 bulan. Klaim garansi dapat dilakukan langsung di seluruh service center resmi merchant atau dibantu melalui pusat resolusi PASARIA.',
              },
              {
                q: 'Bagaimana standar pengemasan untuk menjamin produk aman selama perjalanan?',
                a: 'Setiap pengiriman dilapisi bubble wrap tebal berlapis serta kardus pelindung ekstra bertanda fragile tanpa biaya tambahan, memastikan unit aman dari benturan maupun cuaca buruk.',
              },
              {
                q: 'Bagaimana cara memastikan nomor seri (serial number) produk valid dan terdaftar?',
                a: 'Nomor seri (SN) tertera pada boks luar serta fisik perangkat. Anda dapat melakukan verifikasi langsung di website resmi pabrikan untuk memastikan masa aktif garansi dan keaslian unit.',
              },
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 transition-colors overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {faq.q}
                    </span>
                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
                      {isOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-[#003d29]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RELATED PRODUCTS GRID */}
      {/* ========================================================= */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Pilihan Lainnya Untukmu
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
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

      {/* Sticky Mobile Purchase Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] bg-white border-t border-slate-200 z-30 flex items-center gap-3 shadow-lg">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] text-slate-400 font-medium">Total Harga</span>
          <span className="text-base font-extrabold text-[#003d29] tabular-nums truncate">
            {formatRupiah(currentPrice * quantity)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className={`px-4 py-2.5 min-h-[42px] rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
            addedSuccess
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
          }`}
        >
          {addedSuccess ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <span>+ Keranjang</span>
          )}
        </button>
        <button
          type="button"
          onClick={handleBuy}
          className="px-5 py-2.5 min-h-[42px] rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-[#003d29] transition-all cursor-pointer shrink-0"
        >
          Beli Sekarang
        </button>
      </div>
    </div>
  );
};
