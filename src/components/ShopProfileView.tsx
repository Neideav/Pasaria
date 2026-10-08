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
  Heart
} from 'lucide-react';
import { Shop, Product } from '../types';
import { ProductCard } from './ProductCard';
import { api } from '../services/api';

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
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Filter products by this shop
  const shopProducts = products.filter(
    (p) => (p.shop_id != null && shop.id != null && String(p.shop_id) === String(shop.id)) ||
           (p.shop_name && shop.name && p.shop_name.trim().toLowerCase() === shop.name.trim().toLowerCase())
  );

  const displayedProducts = shopProducts.length > 0 ? shopProducts : products.slice(0, 4);

  const handleToggleFollow = async () => {
    setFollowingLoading(true);
    try {
      if (isFollowing) {
        await api.unfollowShop(shop.id);
        setIsFollowing(false);
      } else {
        await api.followShop(shop.id);
        setIsFollowing(true);
      }
    } catch (e) {
      console.warn('Toggle follow note:', e);
    } finally {
      setFollowingLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 text-left space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={onBackToHome} className="hover:text-slate-700">Beranda</button>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span>Toko Resmi</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-800 font-semibold">{shop.name}</span>
        </div>

        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003d29] hover:underline cursor-pointer"
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
            <button
              onClick={handleToggleFollow}
              disabled={followingLoading}
              className={`py-2.5 px-4 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                isFollowing
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-[#003d29] hover:bg-[#064e3b] text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFollowing ? 'fill-emerald-800' : ''}`} />
              <span>{isFollowing ? 'Mengikuti ✓' : '+ Ikuti Toko'}</span>
            </button>

            {onOpenChatWithShop && (
              <button
                onClick={() => onOpenChatWithShop(shop.id)}
                className="py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat Penjual</span>
              </button>
            )}

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert(`Tautan toko ${shop.name} berhasil disalin!`);
              }}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Bagikan Toko"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Store Description Quote */}
      {shop.description && (
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-slate-800">Tentang Toko: </span>
          {shop.description}
        </div>
      )}

      {/* Store Products Showcase */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Etalase Produk dari {shop.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {displayedProducts.length} produk pilihan dengan jaminan originalitas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onSelect={onSelectProduct}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
