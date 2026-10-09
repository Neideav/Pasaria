import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  XCircle,
  Star,
  ShoppingBag,
  ArrowLeft,
  ChevronDown,
  CreditCard,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Order, OrderItemType } from '../types';
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
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<number>>(new Set());
  const [confirmingReceiptId, setConfirmingReceiptId] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);

  useEffect(() => {
    if (onRefreshOrders) {
      onRefreshOrders();
    }
  }, []);

  const toggleOrderTimeline = (orderId: number) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    const s = (status || 'processing').toLowerCase();
    if (s === 'completed' || s === 'delivered' || s === 'paid') {
      return {
        label: s === 'completed' ? 'Selesai' : s === 'delivered' ? 'Tiba di Tujuan' : 'Sudah Dibayar',
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      };
    }
    if (s.includes('transit') || s.includes('shipped') || s.includes('dikirim')) {
      return {
        label: 'Sedang Dikirim',
        cls: 'bg-blue-50 text-blue-800 border-blue-200 shadow-blue-500/10',
        icon: <Truck className="w-3.5 h-3.5 text-blue-600" />,
      };
    }
    if (s.includes('cancel') || s.includes('batal')) {
      return {
        label: 'Dibatalkan',
        cls: 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-500/10',
        icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
      };
    }
    if (s.includes('return') || s.includes('refund')) {
      return {
        label: 'Komplain / Retur',
        cls: 'bg-purple-50 text-purple-800 border-purple-200 shadow-purple-500/10',
        icon: <RotateCcw className="w-3.5 h-3.5 text-purple-600" />,
      };
    }
    if (s.includes('pending') || s.includes('unpaid')) {
      return {
        label: 'Menunggu Pembayaran',
        cls: 'bg-amber-50 text-amber-800 border-amber-200 shadow-amber-500/10',
        icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
      };
    }
    return {
      label: 'Sedang Diproses',
      cls: 'bg-amber-50 text-amber-800 border-amber-200 shadow-amber-500/10',
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

  const handleConfirmReceipt = async (orderId: number) => {
    setConfirmingReceiptId(orderId);
    try {
      await api.updateOrderStatus(orderId, 'completed');
      showToast('Terima kasih! Pesanan telah dikonfirmasi selesai.', 'success');
      if (onRefreshOrders) onRefreshOrders();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengonfirmasi penerimaan pesanan.', 'error');
    } finally {
      setConfirmingReceiptId(null);
    }
  };

  const handlePayOrder = (order: Order) => {
    setPayingId(order.id);
    showToast(`Membuka instruksi pembayaran pesanan #${order.order_number}...`, 'info');
    setTimeout(() => {
      setPayingId(null);
    }, 800);
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003d29] hover:underline cursor-pointer motion-press"
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
            className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer motion-press ${
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
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#003d29] hover:bg-[#064e3b] transition-colors cursor-pointer motion-press"
          >
            Mulai Belanja
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status || 'processing');
            const statusLower = (order.status || '').toLowerCase();
            const isPendingPayment = statusLower === 'pending_payment' || statusLower === 'pending';
            const canCancel = isPendingPayment || statusLower === 'processing';
            const isShipped = statusLower.includes('shipped') || statusLower.includes('transit');
            const isCompleted = statusLower === 'completed' || statusLower === 'delivered';
            const isExpanded = expandedOrderIds.has(order.id);

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4"
              >
                {/* Order Top Bar with Motion Point #32 Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 tabular-nums">#{order.order_number}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">{formatDateTime(order.created_at)}</span>
                  </div>
                  {/* Motion Point #32: Badge Status Color & Glow Transition */}
                  <div
                    className={`motion-status-badge flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shadow-xs ${badge.cls}`}
                  >
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
                            className="text-[11px] font-bold text-emerald-700 hover:underline mt-1 cursor-pointer flex items-center gap-1 motion-press"
                          >
                            <Star className="w-3 h-3 fill-emerald-600" />
                            <span>Beri Ulasan</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Motion Point #33: OrdersView Timeline Accordion via CSS Grid Row Interpolation (Recipe 7) */}
                <div
                  className="motion-accordion-wrapper border-t border-slate-100/80"
                  data-expanded={isExpanded ? 'true' : 'false'}
                >
                  <div className="motion-accordion-content">
                    <div className="pt-4 pb-2 space-y-4">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3.5 text-xs">
                        <div className="flex items-center justify-between text-slate-700 font-bold border-b border-slate-200/60 pb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#003d29]" />
                            <span>Rincian & Timeline Pengiriman</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            Resi: {order.tracking_number || `SC-TRK-${order.order_number}`}
                          </span>
                        </div>

                        {/* Visual timeline steps */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                          <div className="flex items-start gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-[11px]">Pesanan Dibuat</div>
                              <div className="text-[10px] text-slate-400">{formatDateTime(order.created_at)}</div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                                !isPendingPayment
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-amber-100 text-amber-700 border border-amber-300'
                              }`}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-[11px]">
                                {!isPendingPayment ? 'Pembayaran Lunas' : 'Menunggu Bayar'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {!isPendingPayment ? 'Terkonfirmasi otomatis' : 'Perlu diselesaikan'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                                isShipped || isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-400'
                              }`}
                            >
                              <Truck className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-[11px]">Kurir Pengiriman</div>
                              <div className="text-[10px] text-slate-400">
                                {order.courier || 'Shopcart Express Priority'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                                isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-400'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-[11px]">Selesai / Diterima</div>
                              <div className="text-[10px] text-slate-400">
                                {isCompleted ? 'Paket sampai tujuan' : 'Menunggu pengantaran'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Shipping address & live map shortcut */}
                        {order.shipping_address && (
                          <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Alamat Pengiriman: <strong className="text-slate-800">{order.shipping_address}</strong></span>
                            </div>
                            {onTrackDelivery && (
                              <button
                                type="button"
                                onClick={() => onTrackDelivery(order)}
                                className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer motion-press"
                              >
                                <span>Buka Peta GPS Lengkap</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Bottom Bar: Total & Action Feedback Pulse (#32) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="text-slate-500">
                      Total Pesanan:{' '}
                      <span className="text-base font-extrabold text-[#003d29] tabular-nums ml-1">
                        {formatRupiah(order.total)}
                      </span>
                    </div>

                    {/* Timeline Accordion Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleOrderTimeline(order.id)}
                      aria-expanded={isExpanded}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-[#003d29] bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer motion-press"
                    >
                      <span>{isExpanded ? 'Tutup Rincian' : 'Rincian & Timeline'}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Pay Now Button (if pending payment) with Motion Press Feedback */}
                    {isPendingPayment && (
                      <button
                        onClick={() => handlePayOrder(order)}
                        disabled={payingId === order.id}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#003d29] hover:bg-[#064e3b] transition-colors cursor-pointer motion-press flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{payingId === order.id ? 'Memuat...' : 'Bayar Sekarang'}</span>
                      </button>
                    )}

                    {/* Confirm Receipt Button (if shipped / in transit) with Motion Press Feedback */}
                    {isShipped && (
                      <button
                        onClick={() => handleConfirmReceipt(order.id)}
                        disabled={confirmingReceiptId === order.id}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer motion-press flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{confirmingReceiptId === order.id ? 'Mengonfirmasi...' : 'Konfirmasi Terima'}</span>
                      </button>
                    )}

                    {/* Track Delivery */}
                    {onTrackDelivery && (
                      <button
                        onClick={() => onTrackDelivery(order)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#003d29] bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer motion-press flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Lacak Resi</span>
                      </button>
                    )}

                    {/* Buy Again */}
                    {isCompleted && onBuyAgain && order.items && (
                      <button
                        onClick={() => onBuyAgain(order.items!)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer motion-press flex items-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Beli Lagi</span>
                      </button>
                    )}

                    {/* Return / Dispute request */}
                    {isCompleted && onOpenReturnModal && (
                      <button
                        onClick={() => onOpenReturnModal(order)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer motion-press flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retur / Komplain</span>
                      </button>
                    )}

                    {/* Cancel Order with Tactile Feedback (#32) */}
                    {canCancel && (
                      confirmCancelId === order.id ? (
                        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                          <span className="text-[11px] font-medium text-rose-800">
                            Yakin batalkan pesanan ini? Stok akan dikembalikan secara otomatis.
                          </span>
                          <button
                            onClick={() => handleExecuteCancel(order.id)}
                            disabled={cancellingId === order.id}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer motion-press"
                          >
                            {cancellingId === order.id ? 'Memproses...' : 'Ya, Batalkan'}
                          </button>
                          <button
                            onClick={() => setConfirmCancelId(null)}
                            disabled={cancellingId === order.id}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer motion-press"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmCancelId(order.id)}
                          disabled={cancellingId === order.id}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer disabled:opacity-40 motion-press"
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
