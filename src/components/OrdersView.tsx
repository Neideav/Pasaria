import React, { useState, useEffect } from 'react';
import { Package, CheckCircle2, Clock, Truck, RotateCcw, XCircle, Star, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Order, OrderItemType, Product } from '../types';
import { ProductVisual } from './ProductVisual';
import { formatRupiah, formatDateTime } from '../utils/formatters';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface OrdersViewProps {
  orders: Order[];
  onNavigateHome: () => void;
  onSelectProductBySlug: (slug: string) => void;
  onTrackDelivery?: (order: Order) => void;
  onRefreshOrders?: () => void;
  onOpenReviewModal?: (item: OrderItemType, orderId: number) => void;
  onOpenReturnModal?: (order: Order) => void;
  onBuyAgain?: (items: OrderItemType[]) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onNavigateHome,
  onSelectProductBySlug,
  onTrackDelivery,
  onRefreshOrders,
  onOpenReviewModal,
  onOpenReturnModal,
  onBuyAgain,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);

  useEffect(() => {
    if (onRefreshOrders) {
      onRefreshOrders();
    }
  }, []);

  const getStatusBadge = (status: string) => {
    const s = (status || 'processing').toLowerCase();
    if (s === 'completed' || s === 'delivered' || s === 'paid') {
      return {
        label: s === 'completed' ? 'Selesai' : s === 'delivered' ? 'Tiba di Tujuan' : 'Sudah Dibayar',
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      };
    }
    if (s.includes('transit') || s.includes('shipped') || s.includes('dikirim')) {
      return {
        label: 'Sedang Dikirim',
        cls: 'bg-blue-50 text-blue-800 border-blue-200',
        icon: <Truck className="w-3.5 h-3.5 text-blue-600" />,
      };
    }
    if (s.includes('cancel') || s.includes('batal')) {
      return {
        label: 'Dibatalkan',
        cls: 'bg-rose-50 text-rose-800 border-rose-200',
        icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
      };
    }
    if (s.includes('return') || s.includes('refund')) {
      return {
        label: 'Komplain / Retur',
        cls: 'bg-purple-50 text-purple-800 border-purple-200',
        icon: <RotateCcw className="w-3.5 h-3.5 text-purple-600" />,
      };
    }
    return {
      label: 'Sedang Diproses',
      cls: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    };
  };

  const handleExecuteCancel = async (orderId: number) => {
    setCancellingId(orderId);
    try {
      await api.cancelOrder(orderId, 'Dibatalkan oleh pembeli');
      showToast('Pesanan berhasil dibatalkan.', 'success');
      setConfirmCancelId(null);
      if (onRefreshOrders) onRefreshOrders();
    } catch (err: any) {
      showToast(err.message || 'Gagal membatalkan pesanan.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'all') return true;
    const s = (o.status || '').toLowerCase();
    if (activeTab === 'processing') return s.includes('processing') || s.includes('pending') || s.includes('paid');
    if (activeTab === 'shipped') return s.includes('transit') || s.includes('shipped');
    if (activeTab === 'completed') return s.includes('complete') || s.includes('delivered');
    if (activeTab === 'cancelled') return s.includes('cancel');
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 text-left">
      {/* View Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">
            <Package className="w-4 h-4 text-emerald-700" />
            <span>Riwayat Belanja</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pesanan Saya ({orders.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau status pesanan, resi pengiriman, ulasan produk, dan ajukan pengembalian.
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003d29] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Katalog</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-100 text-xs">
        {[
          { id: 'all', label: 'Semua Pesanan' },
          { id: 'processing', label: 'Sedang Diproses' },
          { id: 'shipped', label: 'Dalam Pengiriman' },
          { id: 'completed', label: 'Selesai' },
          { id: 'cancelled', label: 'Dibatalkan' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#003d29] text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 p-8">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Tidak Ada Pesanan</h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            Belum ada transaksi pada kategori ini. Mulai belanja produk idaman di PASARIA!
          </p>
          <button
            onClick={onNavigateHome}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#003d29] hover:bg-[#064e3b] transition-all cursor-pointer"
          >
            Mulai Belanja
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status || 'processing');
            const canCancel = (order.status || '').toLowerCase() === 'pending_payment' || (order.status || '').toLowerCase() === 'processing';
            const isCompleted = (order.status || '').toLowerCase() === 'completed' || (order.status || '').toLowerCase() === 'delivered';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 tabular-nums">#{order.order_number}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">{formatDateTime(order.created_at)}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${badge.cls}`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>
                </div>

                {/* Items in this Order */}
                <div className="space-y-3">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-xl bg-[#f8f9fa] flex items-center justify-center p-1.5 border border-slate-100 shrink-0">
                          <ProductVisual imageKey={item.image || 'airpods-max'} name={item.product_name || item.name || 'Produk'} size="sm" />
                        </div>
                        <div>
                          <div
                            onClick={() => (item.slug || item.product_slug) && onSelectProductBySlug(item.slug || item.product_slug!)}
                            className="font-bold text-slate-900 hover:text-[#003d29] cursor-pointer"
                          >
                            {item.product_name || item.name}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {item.quantity} barang {item.color ? `· Warna: ${item.color}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-slate-900 tabular-nums">
                          {formatRupiah((Number(item.price) || 0) * (Number(item.quantity) || 1))}
                        </div>
                        {isCompleted && onOpenReviewModal && (
                          <button
                            onClick={() => onOpenReviewModal(item, order.id)}
                            className="text-[11px] font-bold text-emerald-700 hover:underline mt-1 cursor-pointer flex items-center gap-1"
                          >
                            <Star className="w-3 h-3 fill-emerald-600" />
                            <span>Beri Ulasan</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Bottom Bar: Total & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="text-slate-500">
                    Total Pesanan:{' '}
                    <span className="text-base font-extrabold text-[#003d29] tabular-nums ml-1">
                      {formatRupiah(order.total)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Track Delivery */}
                    {onTrackDelivery && (
                      <button
                        onClick={() => onTrackDelivery(order)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#003d29] bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Lacak Resi</span>
                      </button>
                    )}

                    {/* Buy Again */}
                    {isCompleted && onBuyAgain && order.items && (
                      <button
                        onClick={() => onBuyAgain(order.items!)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Beli Lagi</span>
                      </button>
                    )}

                    {/* Return / Dispute request */}
                    {isCompleted && onOpenReturnModal && (
                      <button
                        onClick={() => onOpenReturnModal(order)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retur / Komplain</span>
                      </button>
                    )}

                    {/* Cancel Order */}
                    {canCancel && (
                      confirmCancelId === order.id ? (
                        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                          <span className="text-[11px] font-medium text-rose-800">
                            Yakin batalkan pesanan ini? Stok akan dikembalikan secara otomatis.
                          </span>
                          <button
                            onClick={() => handleExecuteCancel(order.id)}
                            disabled={cancellingId === order.id}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {cancellingId === order.id ? 'Memproses...' : 'Ya, Batalkan'}
                          </button>
                          <button
                            onClick={() => setConfirmCancelId(null)}
                            disabled={cancellingId === order.id}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmCancelId(order.id)}
                          disabled={cancellingId === order.id}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          Batalkan
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
