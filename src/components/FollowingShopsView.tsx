import React, { useState, useEffect } from 'react';
import { Store, Star, MapPin, ArrowLeft, ShieldCheck, UserMinus } from 'lucide-react';
import { Shop } from '../types';
import { api } from '../services/api';

interface FollowingShopsViewProps {
  onNavigateHome: () => void;
  onViewShop: (shopName: string, shopId?: number) => void;
}

export const FollowingShopsView: React.FC<FollowingShopsViewProps> = ({
  onNavigateHome,
  onViewShop,
}) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowing();
  }, []);

  const loadFollowing = async () => {
    try {
      setLoading(true);
      const data = await api.getFollowingShops();
      setShops(data || []);
    } catch (e) {
      console.warn('Load following shops error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (shopId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.unfollowShop(shopId);
      setShops((prev) => prev.filter((s) => s.id !== shopId));
    } catch (e) {
      console.warn('Unfollow error:', e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 text-left">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">
            <Store className="w-4 h-4 text-emerald-700" />
            <span>Toko Favorit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Toko yang Anda Ikuti ({shops.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dapatkan pembaruan produk baru dan promo spesial dari penjual favorit Anda.
          </p>
        </div>

        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003d29] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Memuat daftar toko...
        </div>
      ) : shops.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 p-8">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            Belum Mengikuti Toko Apapun
          </h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            Buka halaman produk atau profil toko penjual dan klik "Ikuti Toko" untuk menyimpan toko favorit Anda di sini.
          </p>
          <button
            onClick={onNavigateHome}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#003d29] hover:bg-[#064e3b] transition-all cursor-pointer"
          >
            Jelajahi Toko PASARIA
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shops.map((shop) => (
            <div
              key={shop.id}
              onClick={() => onViewShop(shop.name, shop.id)}
              className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden shrink-0 font-extrabold text-[#003d29]">
                  {shop.logo ? (
                    <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                  ) : (
                    shop.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {shop.name}
                    </h3>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {shop.slogan || shop.tagline || 'Penyedia Produk Resmi & Bergaransi'}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{shop.city || 'Indonesia'}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5 text-emerald-700 font-semibold">
                      <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                      <span>{Number(shop.rating || 5).toFixed(1)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => handleUnfollow(shop.id, e)}
                  className="px-3 py-1.5 rounded-full border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-all flex items-center gap-1"
                  title="Berhenti Mengikuti"
                >
                  <UserMinus className="w-3 h-3" />
                  <span className="hidden sm:inline">Batal Ikuti</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
