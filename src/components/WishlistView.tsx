import React, { useState, useEffect } from 'react';
import { Heart, Trash2, ShoppingCart, ArrowLeft, Package } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { formatRupiah } from '../utils/formatters';
import { ProductVisual } from './ProductVisual';

interface WishlistViewProps {
  onNavigateHome: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  onNavigateHome,
  onSelectProduct,
  onAddToCart,
}) => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await api.getWishlist();
      setItems(data || []);
    } catch (e) {
      console.warn('Load wishlist error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.removeFromWishlist(productId);
      setItems((prev) => prev.filter((p) => p.id !== productId));
    } catch (e) {
      console.warn('Remove wishlist error:', e);
    }
  };

  const handleMoveToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 text-left">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Heart className="w-4 h-4 fill-rose-500" />
            <span>Wishlist Saya</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Produk Favorit ({items.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar produk yang Anda simpan untuk dibeli nanti.
          </p>
        </div>

        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003d29] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali Belanja</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Memuat wishlist...
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 p-8">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            Wishlist Anda Masih Kosong
          </h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            Temukan barang impian Anda di katalog PASARIA dan simpan dengan menekan ikon hati.
          </p>
          <button
            onClick={onNavigateHome}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#003d29] hover:bg-[#064e3b] transition-all cursor-pointer"
          >
            Eksplor Produk Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-3.5">
          {items.map((prod) => (
            <div
              key={prod.id}
              onClick={() => onSelectProduct(prod)}
              className="group relative flex flex-col justify-between bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all cursor-pointer text-left"
            >
              <div>
                <div className="flex justify-end mb-2">
                  <button
                    onClick={(e) => handleRemove(prod.id, e)}
                    className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-500 transition-colors"
                    title="Hapus dari wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative w-full h-44 rounded-xl bg-[#f8f9fa] flex items-center justify-center p-3 mb-4 overflow-hidden group-hover:bg-[#f3f4f6] transition-colors">
                  <ProductVisual
                    imageKey={prod.image}
                    name={prod.name}
                    size="md"
                    className="transform transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="text-[11px] text-slate-400 mb-1">
                  {prod.shop_name || 'PASARIA Merchant'}
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#003d29] transition-colors line-clamp-1 mb-1">
                  {prod.name}
                </h3>

                <div className="text-base font-extrabold text-[#003d29] tabular-nums mb-3">
                  {formatRupiah(prod.price)}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={(e) => handleMoveToCart(prod, e)}
                  className="w-full py-2.5 px-4 rounded-full text-xs font-semibold bg-[#003d29] hover:bg-[#064e3b] text-white transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Pindahkan ke Keranjang</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
