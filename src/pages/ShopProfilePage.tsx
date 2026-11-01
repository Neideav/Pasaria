import React, { useState, useEffect } from 'react';
import { ShopProfileView } from '../components/ShopProfileView';
import { Shop, Product } from '../types';
import { api } from '../services/api';
import { useAppContext } from '../layouts/MainLayout';

interface ShopProfilePageProps {
  shopIdOrSlug: string;
  initialShop?: Shop;
}

export function ShopProfilePage({ shopIdOrSlug, initialShop }: ShopProfilePageProps) {
  const { user, handleAddToCart, openChat } = useAppContext();

  const [shop, setShop] = useState<Shop | null>(initialShop || null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!initialShop);

  useEffect(() => {
    loadShop();
    loadProducts();
  }, [shopIdOrSlug]);

  const loadShop = async () => {
    if (user?.shop && (String(user.shop.id) === shopIdOrSlug || user.shop.slug === shopIdOrSlug)) {
      setShop(user.shop);
      setLoading(false);
      return;
    }

    try {
      const s = await api.getShop(shopIdOrSlug);
      setShop(s);
    } catch {
      setShop({
        id: isNaN(Number(shopIdOrSlug)) ? 1 : Number(shopIdOrSlug),
        user_id: 1,
        name: isNaN(Number(shopIdOrSlug)) ? shopIdOrSlug : 'Toko Penjual',
        slug: shopIdOrSlug,
        city: 'Jakarta',
        rating: 5.0,
        is_verified: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.getProducts();
      setProducts(res.products || []);
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="py-32 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500 font-medium">Memuat profil toko...</span>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-md mx-auto py-24 px-6 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">
          Toko tidak ditemukan.
        </div>
        <button
          onClick={() => { window.location.href = '/'; }}
          className="px-6 py-2.5 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <ShopProfileView
      shop={shop}
      products={products}
      onSelectProduct={(p) => {
        window.location.href = '/products/' + p.slug;
      }}
      onAddToCart={(p) => handleAddToCart(p, 1)}
      onBackToHome={() => {
        window.location.href = '/';
      }}
      onOpenChatWithShop={(sId) => {
        openChat(sId);
      }}
    />
  );
}
