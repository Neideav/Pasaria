import React, { useState, useRef, useEffect } from 'react';
import { Minus, Plus, Trash2, ArrowLeft, ArrowRight, ShoppingBag, Store, ShieldCheck } from 'lucide-react';
import { CartItem } from '../types';
import { ProductVisual } from './ProductVisual';
import { formatRupiah } from '../utils/formatters';

interface CartPageProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onContinueShopping,
}) => {
  // Motion Point #35: Item removal slide-left & collapse
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  const handleRemove = (productId: number) => {
    if (removingIds.has(productId)) return;
    setRemovingIds((prev) => new Set(prev).add(productId));
    setTimeout(() => {
      onRemoveItem(productId);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }, 200);
  };

  const handleQuantityDecrease = (productId: number, currentQty: number) => {
    if (currentQty <= 1) {
      handleRemove(productId);
    } else {
      onUpdateQuantity(productId, currentQty - 1);
    }
  };

  // Group items by seller/shop
  const shopGroups: Record<string, CartItem[]> = {};
  items.forEach((item) => {
    const shopKey = item.product.shop_name || 'PASARIA Official Store';
    if (!shopGroups[shopKey]) {
      shopGroups[shopKey] = [];
    }
    shopGroups[shopKey].push(item);
  });

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.11); // PPN 11%
  const total = subtotal + tax;

  // Motion Point #37: Subtotal Rolling Counter Transition with momentary micro color pulse
  const [isHighlighting, setIsHighlighting] = useState(false);
  const prevSubtotalRef = useRef(subtotal);

  useEffect(() => {
    if (prevSubtotalRef.current !== subtotal) {
      prevSubtotalRef.current = subtotal;
      setIsHighlighting(true);
      const timer = setTimeout(() => {
        setIsHighlighting(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [subtotal]);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Keranjang Belanja Kosong</h2>
        <p className="text-xs text-slate-500 mb-6">Anda belum menambahkan produk ke keranjang belanja.</p>
        <button
          onClick={onContinueShopping}
          className="motion-press active:scale-[0.97] inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-xs text-white bg-[#003d29] hover:bg-[#064e3b] transition-[transform,background-color,box-shadow] duration-160 ease-[var(--ease-out)] cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Mulai Belanja di PASARIA</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-left">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Keranjang Belanja ({items.reduce((s, i) => s + i.quantity, 0)} Produk)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pesanan dari berbagai toko akan diproses secara multi-vendor terpadu.
          </p>
        </div>
        <button
          onClick={onContinueShopping}
          className="motion-press active:scale-[0.97] inline-flex items-center gap-1.5 text-xs font-semibold text-[#003d29] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Lanjut Belanja</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cart Items Grouped by Store */}
        <div className="lg:col-span-8 space-y-6">
          {Object.entries(shopGroups).map(([shopName, shopItems]) => (
            <div
              key={shopName}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4"
            >
              {/* Store Header */}
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Store className="w-4 h-4 text-[#003d29]" />
                <h3 className="text-sm font-extrabold text-slate-900">{shopName}</h3>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] text-slate-400 ml-auto">
                  {shopItems.length} Produk
                </span>
              </div>

              {/* Items in this shop */}
              <div className="divide-y divide-slate-100">
                {shopItems.map((item) => {
                  const isRemoving = removingIds.has(item.product.id);
                  return (
                    <div
                      key={`${item.product.id}-${item.selectedColor}-${item.variant_id}`}
                      className={`py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-[transform,opacity] duration-200 ease-[var(--ease-out)] ${
                        isRemoving ? 'motion-cart-item-exit' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-18 h-18 rounded-2xl bg-[#f8f9fa] flex items-center justify-center p-2 shrink-0 border border-slate-100">
                          <ProductVisual imageKey={item.product.image} name={item.product.name} size="sm" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                            {item.product.name}
                          </h4>
                          <div className="text-xs text-slate-500 mb-1">
                            {item.selectedColor ? `Warna: ${item.selectedColor}` : item.product.category}
                          </div>
                          <div className={`text-sm font-extrabold tabular-nums transition-colors duration-200 ease-[var(--ease-out)] ${
                            isHighlighting ? 'text-emerald-700' : 'text-[#003d29]'
                          }`}>
                            {formatRupiah(item.product.price)}
                          </div>
                        </div>
                      </div>

                      {/* Stepper & Subtotal */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Motion Point #36: Stepper Click Feedback (motion-press active:scale-[0.92] transition-transform duration-120) */}
                        <div className="flex items-center bg-slate-100 rounded-full px-2.5 py-1 border border-slate-200/60">
                          <button
                            onClick={() => handleQuantityDecrease(item.product.id, item.quantity)}
                            className="motion-press active:scale-[0.92] transition-transform duration-120 w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                            title="Kurangi kuantitas"
                            aria-label="Kurangi kuantitas"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-900 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="motion-press active:scale-[0.92] transition-transform duration-120 w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                            title="Tambah kuantitas"
                            aria-label="Tambah kuantitas"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Motion Point #37: Subtotal row item */}
                        <div className={`text-sm font-extrabold tabular-nums min-w-[90px] text-right transition-colors duration-200 ease-[var(--ease-out)] ${
                          isHighlighting ? 'text-emerald-700' : 'text-slate-900'
                        }`}>
                          {formatRupiah(item.product.price * item.quantity)}
                        </div>

                        {/* Motion Point #36: Trash button feedback */}
                        <button
                          onClick={() => handleRemove(item.product.id)}
                          className="motion-press active:scale-[0.92] transition-transform duration-120 w-8 h-8 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center cursor-pointer"
                          title="Hapus"
                          aria-label="Hapus produk dari keranjang"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Summary Card */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100">
              Ringkasan Belanja
            </h3>

            {/* Motion Point #37: Subtotal and Total rolling counter transition */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Harga ({items.reduce((s, i) => s + i.quantity, 0)} barang)</span>
                <span className={`font-semibold tabular-nums transition-colors duration-200 ease-[var(--ease-out)] ${
                  isHighlighting ? 'text-emerald-700' : 'text-slate-900'
                }`}>
                  {formatRupiah(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pajak PPN (11%)</span>
                <span className={`font-semibold tabular-nums transition-colors duration-200 ease-[var(--ease-out)] ${
                  isHighlighting ? 'text-emerald-700' : 'text-slate-900'
                }`}>
                  {formatRupiah(tax)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimasi Biaya Pengiriman</span>
                <span className="font-semibold text-emerald-700">Dihitung di checkout</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline text-sm font-bold text-slate-900">
                <span>Total Tagihan</span>
                <span className={`text-xl font-black tabular-nums transition-colors duration-200 ease-[var(--ease-out)] ${
                  isHighlighting ? 'text-emerald-700' : 'text-[#003d29]'
                }`}>
                  {formatRupiah(total)}
                </span>
              </div>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="motion-press active:scale-[0.97] w-full py-3.5 px-6 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] shadow-md shadow-emerald-950/10 flex items-center justify-center gap-2 transition-[transform,background-color,box-shadow] duration-160 ease-[var(--ease-out)] cursor-pointer"
            >
              <span>Lanjut ke Pembayaran</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
