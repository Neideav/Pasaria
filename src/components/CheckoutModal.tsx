import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Tag,
  MapPin,
  AlertCircle,
  Clock,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Store,
  Plus
} from 'lucide-react';
import { CartItem, User, DeliveryShipment, UserAddress } from '../types';
import { ProductVisual } from './ProductVisual';
import { api } from '../services/api';
import { formatRupiah } from '../utils/formatters';

export interface CourierOption {
  id: string;
  name: string;
  service: string;
  eta: string;
  price: number;
  badge: string;
}

export const COURIER_SERVICES: CourierOption[] = [
  {
    id: 'pasaria_express',
    name: 'PASARIA Express Bebas Ongkir',
    service: 'Jaringan logistik prioritas kurir resmi',
    eta: 'Besok, sebelum 14:00 WIB',
    price: 0,
    badge: 'Gratis Ongkir',
  },
  {
    id: 'sicepat_best',
    name: 'SiCepat BEST Kilat',
    service: 'Layanan udara direct next-day',
    eta: 'Besok pagi, sebelum 10:30 WIB',
    price: 25000,
    badge: 'Paling Cepat',
  },
  {
    id: 'instant_courier',
    name: 'GoSend / Grab Instant',
    service: 'Pengiriman langsung titik-ke-titik',
    eta: 'Hari ini (2-3 Jam)',
    price: 35000,
    badge: 'Sameday Instant',
  },
];

interface CheckoutModalProps {
  items: CartItem[];
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderNumber: string, shipment: DeliveryShipment, openDeliveryView?: boolean) => void;
  subtotal: number;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  items,
  user,
  isOpen,
  onClose,
  onOrderSuccess,
  subtotal: propSubtotal,
}) => {
  const [step, setStep] = useState<'delivery' | 'payment'>('delivery');

  // Address State
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '+62 812-8888-9999');
  const [addressLine, setAddressLine] = useState(user?.address || 'Jl. Jenderal Sudirman No. 45, Gedung Menara Mandiri');
  const [city, setCity] = useState(user?.city || 'Jakarta Pusat');
  const [postalCode, setPostalCode] = useState(user?.zip || '10210');

  // Courier state
  const [selectedCourierId, setSelectedCourierId] = useState('pasaria_express');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'virtual_account' | 'credit' | 'cod'>('qris');

  // Coupon state
  const [couponCode, setCouponCode] = useState('PASARIA50');
  const [appliedVoucher, setAppliedVoucher] = useState<string>('PASARIA50');
  const [voucherDiscount, setVoucherDiscount] = useState<number>(50000);
  const [voucherError, setVoucherError] = useState('');

  // Server Calculation Breakdown
  const [serverCalculation, setServerCalculation] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(() => `idemp-${Date.now()}`);

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
      triggerCalculation();
    }
  }, [isOpen, selectedCourierId, appliedVoucher, items]);

  const loadAddresses = async () => {
    if (!user) return;
    try {
      const addresses = await api.getAddresses();
      if (addresses && addresses.length > 0) {
        setSavedAddresses(addresses);
        const def = addresses.find((a: UserAddress) => a.is_default) || addresses[0];
        setSelectedAddressId(def.id);
        setRecipientName(def.recipient_name);
        setPhone(def.phone);
        setAddressLine(def.address_line);
        setCity(def.city);
        setPostalCode(def.postal_code);
      }
    } catch (e) {
      console.warn('Addresses load error:', e);
    }
  };

  const triggerCalculation = async () => {
    if (items.length === 0) return;
    setIsCalculating(true);
    try {
      const checkoutItems = items.map((i) => ({
        product_id: i.product.id,
        variant_id: i.variant_id,
        quantity: i.quantity,
      }));

      const res = await api.calculateOrder({
        items: checkoutItems,
        voucher_code: appliedVoucher || undefined,
        shipping_method: selectedCourierId,
      });

      setServerCalculation(res);
      setVoucherDiscount(res.voucher_discount || 0);
    } catch (e) {
      console.warn('Calculation error:', e);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError('');
    if (!couponCode.trim()) {
      setAppliedVoucher('');
      setVoucherDiscount(0);
      return;
    }

    try {
      const v = await api.validateVoucher(couponCode.trim(), propSubtotal);
      setAppliedVoucher(couponCode.trim().toUpperCase());
      setVoucherDiscount(v.discount || 0);
      triggerCalculation();
    } catch (err: any) {
      setVoucherError(err.message || 'Kode voucher tidak valid atau telah habis.');
      setAppliedVoucher('');
      setVoucherDiscount(0);
    }
  };

  if (!isOpen) return null;

  const selectedCourier = COURIER_SERVICES.find((c) => c.id === selectedCourierId) || COURIER_SERVICES[0];

  // Calculated numbers (Server-controlled fallback to reasonable IDR estimates)
  const calcSubtotal = serverCalculation?.subtotal ?? items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const calcShipping = serverCalculation?.shipping_cost ?? selectedCourier.price;
  const calcTax = serverCalculation?.tax ?? Math.round(calcSubtotal * 0.11);
  const calcDiscount = serverCalculation?.voucher_discount ?? voucherDiscount;
  const calcTotal = serverCalculation?.total ?? Math.max(0, calcSubtotal + calcShipping + calcTax - calcDiscount);

  const handleCompleteOrder = async () => {
    if (!recipientName.trim() || !addressLine.trim() || !city.trim()) {
      setValidationError('Mohon lengkapi alamat pengiriman secara lengkap.');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      const checkoutItems = items.map((i) => ({
        product_id: i.product.id,
        variant_id: i.variant_id,
        quantity: i.quantity,
        color: i.selectedColor || 'Default',
      }));

      const res = await api.checkoutOrder({
        items: checkoutItems,
        recipient_name: recipientName.trim(),
        recipient_phone: phone.trim(),
        shipping_address: `${addressLine.trim()}, ${city.trim()} ${postalCode.trim()}`,
        payment_method: paymentMethod,
        shipping_method: selectedCourier.name,
        voucher_code: appliedVoucher || undefined,
        idempotency_key: idempotencyKey,
      });

      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });

      const shipment: DeliveryShipment = res.shipment || {
        id: `shp-${res.order_number}`,
        order_number: res.order_number,
        courier_name: selectedCourier.name,
        courier_service: selectedCourier.service,
        tracking_number: res.tracking_number || `PASARIA-${Date.now()}`,
        status: 'in_transit',
        status_label: 'Paket Sedang Dikirim — Kurir Prioritas PASARIA',
        recipient_name: recipientName,
        recipient_phone: phone,
        delivery_address: `${addressLine}, ${city} ${postalCode}`,
        origin_address: 'Fulfillment Center PASARIA Hub Utama',
        estimated_arrival: selectedCourier.eta,
        current_location: 'Pusat Distribusi Regional',
        items_count: items.reduce((s, i) => s + i.quantity, 0),
        total_amount: res.total || calcTotal,
        created_at: new Date().toISOString(),
        checkpoints: [],
      };

      onOrderSuccess(res.order_number, shipment, true);
    } catch (err: any) {
      setValidationError(err.message || 'Gagal membuat pesanan. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden text-left">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#003d29] flex items-center justify-center font-black">
              P
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Checkout Pembayaran PASARIA
              </h2>
              <p className="text-xs text-slate-400">
                Langkah {step === 'delivery' ? '1 dari 2: Alamat & Pengiriman' : '2 dari 2: Metode Pembayaran'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Steps */}
          <div className="lg:col-span-7 space-y-6">
            {validationError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {step === 'delivery' ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#003d29]" />
                    Alamat Pengiriman
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Penerima</label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                      <textarea
                        rows={2}
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] leading-relaxed"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kota / Kabupaten</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kode Pos</label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Courier Selection */}
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#003d29]" />
                    Pilih Layanan Pengiriman
                  </h3>

                  <div className="space-y-2.5">
                    {COURIER_SERVICES.map((c) => {
                      const isSelected = selectedCourierId === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCourierId(c.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                            isSelected
                              ? 'border-[#003d29] bg-emerald-50/50 ring-1 ring-[#003d29]'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 font-bold text-slate-900">
                              <span>{c.name}</span>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full">
                                {c.badge}
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] mt-0.5">{c.service} · {c.eta}</p>
                          </div>
                          <div className="font-extrabold text-[#003d29] tabular-nums text-sm">
                            {c.price === 0 ? 'Gratis' : formatRupiah(c.price)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="w-full py-3.5 px-6 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/10"
                >
                  <span>Lanjut ke Metode Pembayaran</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#003d29]" />
                    Pilih Metode Pembayaran
                  </h3>

                  <div className="space-y-3">
                    {[
                      { id: 'qris', name: 'QRIS (GoPay, OVO, Dana, ShopeePay, BCA)', desc: 'Scan instan otomatis terverifikasi' },
                      { id: 'virtual_account', name: 'Virtual Account (BCA, Mandiri, BRI, BNI)', desc: 'Konfirmasi otomatis tanpa upload bukti' },
                      { id: 'credit', name: 'Kartu Kredit / Debit Online', desc: 'Proteksi 3D Secure 256-bit SSL' },
                      { id: 'cod', name: 'Cash on Delivery (COD)', desc: 'Bayar tunai ke kurir saat barang tiba' },
                    ].map((pm) => {
                      const isSelected = paymentMethod === pm.id;
                      return (
                        <div
                          key={pm.id}
                          onClick={() => setPaymentMethod(pm.id as any)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 text-xs ${
                            isSelected
                              ? 'border-[#003d29] bg-emerald-50/50 ring-1 ring-[#003d29]'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#003d29]' : 'border-slate-300'}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[#003d29]" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{pm.name}</div>
                            <div className="text-[11px] text-slate-500">{pm.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('delivery')}
                    className="w-1/3 py-3 px-4 rounded-full border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteOrder}
                    disabled={isSubmitting}
                    className="w-2/3 py-3.5 px-6 rounded-full font-black text-sm text-white bg-[#003d29] hover:bg-[#064e3b] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/10 disabled:opacity-40"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isSubmitting ? 'Memproses Pesanan...' : `Bayar ${formatRupiah(calcTotal)}`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary & Voucher */}
          <div className="lg:col-span-5 space-y-5">
            {/* Voucher Box */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#003d29]" />
                <span>Miliki Kode Voucher Promo?</span>
              </div>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Contoh: PASARIA50"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none uppercase font-bold text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#003d29] text-white font-bold text-xs hover:bg-[#064e3b] transition-colors cursor-pointer"
                >
                  Terapkan
                </button>
              </form>
              {appliedVoucher && (
                <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Voucher {appliedVoucher} aktif! Hemat {formatRupiah(calcDiscount)}</span>
                </div>
              )}
              {voucherError && (
                <div className="text-[11px] text-rose-600 font-medium">{voucherError}</div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs space-y-3 text-xs">
              <h4 className="font-extrabold text-slate-900 pb-2 border-b border-slate-200">
                Rincian Pembayaran
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Produk</span>
                  <span className="font-bold text-slate-900 tabular-nums">{formatRupiah(calcSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Pengiriman ({selectedCourier.name.split(' ')[0]})</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {calcShipping === 0 ? 'Gratis' : formatRupiah(calcShipping)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Pajak Pertambahan Nilai (PPN 11%)</span>
                  <span className="font-bold text-slate-900 tabular-nums">{formatRupiah(calcTax)}</span>
                </div>
                {calcDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Diskon Promo Voucher</span>
                    <span className="tabular-nums">- {formatRupiah(calcDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2.5 flex justify-between items-baseline text-sm font-extrabold text-slate-900">
                  <span>Total Tagihan</span>
                  <span className="text-lg font-black text-[#003d29] tabular-nums">
                    {formatRupiah(calcTotal)}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-400 flex items-center gap-1.5 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Transaksi dijamin aman dengan rekening escrow PASARIA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
