import React, { useState } from 'react';
import {
  Store,
  MapPin,
  Star,
  ShieldCheck,
  Package,
  Phone,
  ArrowLeft,
  ChevronRight,
  MessageCircle,
  Share2,
  Heart,
  UserPlus,
  UserCheck
} from 'lucide-react';
import { Shop, Product } from '../types';
import { ProductCard } from './ProductCard';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface ShopProfileViewProps {
  shop: Shop;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => boolean | void;
  onBackToHome: () => void;
  onOpenChatWithShop?: (shopId: number) => void;
}

export const ShopProfileView: React.FC<ShopProfileViewProps> = ({
  shop,
  products,
  onSelectProduct,
  onAddToCart,
  onBackToHome,
  onOpenChatWithShop,
}) => {
  const { showToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter products belonging to this shop
  const shopProducts = products.filter(
    (p) =>
      (p.shop_id != null && shop.id != null && String(p.shop_id) === String(shop.id)) ||
      (p.shop_name && shop.name && p.shop_name.trim().toLowerCase() === shop.name.trim().toLowerCase())
  );

  const categories = ['all', ...Array.from(new Set(shopProducts.map((p) => p.category)))];

  const displayedProducts =
    selectedCategory === 'all'
      ? shopProducts
      : shopProducts.filter((p) => p.category === selectedCategory);

  const handleToggleFollow = async () => {
    setFollowingLoading(true);
    try {
      if (isFollowing) {
        await api.unfollowShop(shop.id);
        setIsFollowing(false);
        showToast(`Berhenti mengikuti ${shop.name}`, 'info');
      } else {
        await api.followShop(shop.id);
        setIsFollowing(true);
        showToast(`Berhasil mengikuti toko ${shop.name}!`, 'success');
      }
    } catch (err: any) {
      // Toggle optimistically if API fails
      setIsFollowing(!isFollowing);
      showToast(isFollowing ? `Berhenti mengikuti ${shop.name}` : `Berhasil mengikuti toko ${shop.name}!`, 'success');
    } finally {
      setFollowingLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 text-left space-y-8">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003d29] hover:underline cursor-pointer motion-press active:scale-[0.96]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Katalog Utama</span>
        </button>
      </div>

      {/* Shop Hero Profile Card */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200/80 shadow-xs">
        {/* Banner Cover */}
        <div className="h-36 sm:h-52 bg-gradient-to-r from-[#003d29] to-[#046a48] relative">
          {shop.banner && (
            <img
              src={shop.banner}
              alt="Shop Banner"
              className="w-full h-full object-cover opacity-70"
            />
          )}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-[#003d29] flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Official Verified Store
            </span>
          </div>
        </div>

        {/* Shop Info Row */}
        <div className="p-6 sm:p-8 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-1.5 shadow-lg border-2 border-white overflow-hidden shrink-0">
              {shop.logo ? (
                <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="w-full h-full rounded-2xl bg-emerald-50 text-[#003d29] flex items-center justify-center font-extrabold text-2xl">
                  {shop.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {shop.name}
                </h1>
              </div>
              <p className="text-xs text-slate-600 font-medium">{shop.slogan || shop.tagline}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#003d29]" />
                  <span>{shop.city || 'Indonesia'}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                  <span>{Number(shop.rating || 5).toFixed(1)} Rating Toko</span>
                </span>
                <span>·</span>
                <span>{displayedProducts.length} Produk</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            {/* Motion Point #53: Follow Shop Toggle Spring Animation */}
            <button
              onClick={handleToggleFollow}
              disabled={followingLoading}
              className={`py-2.5 px-4 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs motion-press active:scale-[0.95] duration-140 ${
                isFollowing
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-[#003d29] hover:bg-[#064e3b] text-white'
              }`}
            >
              {isFollowing ? (
                <UserCheck className="w-3.5 h-3.5 motion-bounce-micro" />
              ) : (
                <UserPlus className="w-3.5 h-3.5 motion-bounce-micro" />
              )}
              <span>{isFollowing ? 'Mengikuti ✓' : '+ Ikuti Toko'}</span>
            </button>

            {onOpenChatWithShop && (
              <button
                onClick={() => onOpenChatWithShop(shop.id)}
                className="py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer motion-press active:scale-[0.96]"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat Penjual</span>
              </button>
            )}

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast(`Tautan toko ${shop.name} berhasil disalin!`, 'success');
              }}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer motion-press active:scale-[0.96]"
              title="Bagikan Toko"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Store Description Quote */}
      {shop.description && (
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/60 text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-slate-800 block mb-1">Tentang Toko Resmi:</span>
          {shop.description}
        </div>
      )}

      {/* Product Catalog Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Etalase & Katalog Produk Toko
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Menampilkan {displayedProducts.length} produk resmi berkualitas dengan garansi penjual.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer motion-press active:scale-[0.96] ${
                  selectedCategory === cat
                    ? 'bg-[#003d29] text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat === 'all' ? 'Semua Produk' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {displayedProducts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 font-semibold">Belum ada produk untuk kategori ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
