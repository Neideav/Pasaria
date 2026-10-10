import React, { useState, useEffect, useRef } from 'react';
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
import { api, ApiError } from '../services/api';
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

interface DeliveryErrors {
  recipientName?: string;
  phone?: string;
  addressLine?: string;
  city?: string;
  postalCode?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  items,
  user,
  isOpen,
  onClose,
  onOrderSuccess,
  subtotal: propSubtotal,
}) => {
  const [step, setStep] = useState<'delivery' | 'payment' | 'success'>('delivery');
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    shipment: DeliveryShipment;
  } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Address State
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '+62 812-8888-9999');
  const [addressLine, setAddressLine] = useState(user?.address || 'Jl. Jenderal Sudirman No. 45, Gedung Menara Mandiri');
  const [city, setCity] = useState(user?.city || 'Jakarta Pusat');
  const [postalCode, setPostalCode] = useState(user?.zip || '10210');

  // Touched state for onBlur validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  const handleModalClose = () => {
    if (step === 'success' && completedOrder) {
      onOrderSuccess(completedOrder.orderNumber, completedOrder.shipment, true);
    } else {
      onClose();
    }
  };

  // Motion Point #38: Confetti burst on step === 'success' with isolated canvas and 2.5s auto-cleanup
  useEffect(() => {
    if (step === 'success' && confettiCanvasRef.current) {
      const myConfetti = confetti.create(confettiCanvasRef.current, {
        resize: true,
        useWorker: true,
      });

      myConfetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#003d29', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'],
        disableForReducedMotion: true,
      });

      const timer = setTimeout(() => {
        myConfetti.reset();
      }, 2500);

      return () => {
        clearTimeout(timer);
        myConfetti.reset();
      };
    }
  }, [step]);

  // Validation function
  const validateDeliveryForm = (): DeliveryErrors => {
    const errors: DeliveryErrors = {};
    if (!recipientName.trim()) {
      errors.recipientName = 'Nama penerima wajib diisi.';
    }
    if (!phone.trim()) {
      errors.phone = 'Nomor WhatsApp / HP wajib diisi.';
    } else if (!/^[0-9+\s-]{8,20}$/.test(phone.trim())) {
      errors.phone = 'Format nomor HP tidak valid (minimal 8 digit).';
    }
    if (!addressLine.trim()) {
      errors.addressLine = 'Alamat lengkap wajib diisi.';
    }
    if (!city.trim()) {
      errors.city = 'Kota / Kabupaten wajib diisi.';
    }
    if (!postalCode.trim()) {
      errors.postalCode = 'Kode pos wajib diisi.';
    } else if (!/^\d{5}$/.test(postalCode.trim())) {
      errors.postalCode = 'Kode pos harus terdiri dari 5 digit angka.';
    }
    return errors;
  };

  const fieldErrors = validateDeliveryForm();

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Keyboard trap and Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleModalClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, step, completedOrder]);

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

  useEffect(() => {
    if (isOpen) {
      setStep('delivery');
      setCompletedOrder(null);
      setValidationError('');
      loadAddresses();
      triggerCalculation();
    }
  }, [isOpen, selectedCourierId, appliedVoucher, items]);

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

  const handleProceedToPayment = () => {
    const errors = validateDeliveryForm();
    if (Object.keys(errors).length > 0) {
      setTouched({
        recipientName: true,
        phone: true,
        addressLine: true,
        city: true,
        postalCode: true,
      });
      setValidationError('Mohon lengkapi alamat pengiriman dengan benar.');
      return;
    }
    setValidationError('');
    setStep('payment');
  };

  const handleCompleteOrder = async () => {
    if (isSubmitting) return;

    const errors = validateDeliveryForm();
    if (Object.keys(errors).length > 0) {
      setTouched({
        recipientName: true,
        phone: true,
        addressLine: true,
        city: true,
        postalCode: true,
      });
      setValidationError('Mohon lengkapi alamat pengiriman secara lengkap.');
      setStep('delivery');
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

      setIdempotencyKey(`idemp-${Date.now()}`);
      setCompletedOrder({
        orderNumber: res.order_number,
        shipment,
      });
      setStep('success');
      onOrderSuccess(res.order_number, shipment, true);
    } catch (err: any) {
      const errorMsg =
        (err instanceof ApiError && err.getFirstValidationError()) ||
        err.message ||
        'Gagal memproses pesanan. Silakan periksa kembali rincian data Anda.';
      setValidationError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleModalClose();
      }}
      className="motion-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
        className="motion-modal relative bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden text-left"
      >
        {/* Motion Point #38: Isolated Confetti Canvas */}
        <canvas
          ref={confettiCanvasRef}
          className="absolute inset-0 pointer-events-none z-30 w-full h-full rounded-3xl"
        />

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#003d29] flex items-center justify-center font-black">
              P
            </div>
            <div>
              <h2 id="checkout-modal-title" className="text-lg font-black text-slate-900 tracking-tight">
                Checkout Pembayaran PASARIA
              </h2>
              <p className="text-xs text-slate-400">
                {step === 'delivery'
                  ? 'Langkah 1 dari 2: Alamat & Pengiriman'
                  : step === 'payment'
                  ? 'Langkah 2 dari 2: Metode Pembayaran'
                  : 'Pesanan Berhasil Dikonfirmasi'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            aria-label="Tutup modal checkout"
            className="motion-press w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Motion Point #24: Step Progression Bar Linear Transition (transition: width 250ms var(--ease-out)) */}
        <div
          className="w-full bg-slate-100 h-1 overflow-hidden shrink-0"
          role="progressbar"
          aria-valuenow={step === 'delivery' ? 50 : 100}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progres langkah checkout"
        >
          <div
            className="h-full bg-[#003d29] transition-[width] duration-250 ease-[var(--ease-out)]"
            style={{ width: step === 'delivery' ? '50%' : '100%' }}
          />
        </div>

        {/* Body Content */}
        {step === 'success' ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-12 flex flex-col items-center justify-center text-center">
            {/* Motion Point #39: Success Checkmark Stamp Bounce (scale(0.8) -> scale(1.15) -> scale(1) in 280ms) */}
            <div className="motion-stamp-bounce w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/10 mb-5">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-2 mb-6 max-w-md">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                ✨ Transaksi Berhasil
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Pembayaran Sukses Dikonfirmasi!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Terima kasih, pesanan Anda dengan nomor{' '}
                <span className="font-bold text-slate-900">#{completedOrder?.orderNumber}</span> sedang disiapkan oleh penjual untuk segera dikirimkan.
              </p>
            </div>

            {/* Shipment summary card */}
            {completedOrder && (
              <div className="w-full max-w-md bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-left space-y-2.5 mb-6">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Kurir Pengiriman:</span>
                  <span className="font-bold text-slate-900">{completedOrder.shipment.courier_name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Estimasi Tiba:</span>
                  <span className="font-bold text-emerald-700">{completedOrder.shipment.estimated_arrival}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Penerima & Alamat:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">{completedOrder.shipment.delivery_address}</span>
                </div>
                <div className="flex justify-between items-center pt-1 font-bold">
                  <span className="text-slate-700">Total Dibayar:</span>
                  <span className="font-extrabold text-[#003d29] text-sm tabular-nums">
                    {formatRupiah(completedOrder.shipment.total_amount)}
                  </span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="w-full max-w-md flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (completedOrder) {
                    onOrderSuccess(completedOrder.orderNumber, completedOrder.shipment, true);
                  } else {
                    onClose();
                  }
                }}
                className="motion-press active:scale-[0.97] w-full py-3.5 px-6 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] shadow-md shadow-emerald-950/10 flex items-center justify-center gap-2 cursor-pointer transition-[transform,background-color,box-shadow] duration-160 ease-[var(--ease-out)]"
              >
                <Truck className="w-4 h-4" />
                <span>Lacak Status Pengiriman</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (completedOrder) {
                    onOrderSuccess(completedOrder.orderNumber, completedOrder.shipment, false);
                  } else {
                    onClose();
                  }
                }}
                className="motion-press active:scale-[0.97] w-full sm:w-auto py-3.5 px-6 rounded-full font-bold text-sm text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-[transform,background-color] duration-160 ease-[var(--ease-out)]"
              >
                <span>Selesai</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Form Steps */}
            <div className="lg:col-span-7 space-y-6">
              {validationError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {step === 'delivery' ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#003d29]" />
                      <span>Alamat Pengiriman</span>
                    </h3>

                    {/* Single-Column Linear Layout */}
                    <div className="flex flex-col space-y-3.5 text-xs">
                      <div>
                        <label htmlFor="checkout-recipient-name" className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Nama Penerima <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="checkout-recipient-name"
                          type="text"
                          autoComplete="name"
                          value={recipientName}
                          onChange={(e) => {
                            setRecipientName(e.target.value);
                            if (validationError) setValidationError('');
                          }}
                          onBlur={() => handleBlur('recipientName')}
                          aria-invalid={!!(touched.recipientName && fieldErrors.recipientName)}
                          aria-describedby={touched.recipientName && fieldErrors.recipientName ? 'checkout-recipient-name-error' : undefined}
                          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border transition-all ${
                            touched.recipientName && fieldErrors.recipientName
                              ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                              : 'border-slate-200 focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29]'
                          } focus:outline-none`}
                          required
                        />
                        {touched.recipientName && fieldErrors.recipientName && (
                          <p id="checkout-recipient-name-error" className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium" role="alert">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{fieldErrors.recipientName}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="checkout-phone" className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Nomor WhatsApp / HP <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="checkout-phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (validationError) setValidationError('');
                          }}
                          onBlur={() => handleBlur('phone')}
                          aria-invalid={!!(touched.phone && fieldErrors.phone)}
                          aria-describedby={touched.phone && fieldErrors.phone ? 'checkout-phone-error' : undefined}
                          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border transition-all ${
                            touched.phone && fieldErrors.phone
                              ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                              : 'border-slate-200 focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29]'
                          } focus:outline-none`}
                          required
                        />
                        {touched.phone && fieldErrors.phone && (
                          <p id="checkout-phone-error" className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium" role="alert">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{fieldErrors.phone}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="checkout-address" className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Alamat Lengkap <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          id="checkout-address"
                          rows={2}
                          autoComplete="street-address"
                          value={addressLine}
                          onChange={(e) => {
                            setAddressLine(e.target.value);
                            if (validationError) setValidationError('');
                          }}
                          onBlur={() => handleBlur('addressLine')}
                          aria-invalid={!!(touched.addressLine && fieldErrors.addressLine)}
                          aria-describedby={touched.addressLine && fieldErrors.addressLine ? 'checkout-address-error' : undefined}
                          className={`w-full px-3.5 py-2.5 rounded-xl border leading-relaxed transition-all ${
                            touched.addressLine && fieldErrors.addressLine
                              ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                              : 'border-slate-200 focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29]'
                          } focus:outline-none`}
                          required
                        />
                        {touched.addressLine && fieldErrors.addressLine && (
                          <p id="checkout-address-error" className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium" role="alert">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{fieldErrors.addressLine}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="checkout-city" className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Kota / Kabupaten <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="checkout-city"
                          type="text"
                          autoComplete="address-level2"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            if (validationError) setValidationError('');
                          }}
                          onBlur={() => handleBlur('city')}
                          aria-invalid={!!(touched.city && fieldErrors.city)}
                          aria-describedby={touched.city && fieldErrors.city ? 'checkout-city-error' : undefined}
                          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border transition-all ${
                            touched.city && fieldErrors.city
                              ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                              : 'border-slate-200 focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29]'
                          } focus:outline-none`}
                          required
                        />
                        {touched.city && fieldErrors.city && (
                          <p id="checkout-city-error" className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium" role="alert">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{fieldErrors.city}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="checkout-postal-code" className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Kode Pos <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="checkout-postal-code"
                          type="text"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          value={postalCode}
                          onChange={(e) => {
                            setPostalCode(e.target.value);
                            if (validationError) setValidationError('');
                          }}
                          onBlur={() => handleBlur('postalCode')}
                          aria-invalid={!!(touched.postalCode && fieldErrors.postalCode)}
                          aria-describedby={touched.postalCode && fieldErrors.postalCode ? 'checkout-postal-error' : undefined}
                          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border transition-all ${
                            touched.postalCode && fieldErrors.postalCode
                              ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                              : 'border-slate-200 focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29]'
                          } focus:outline-none`}
                          required
                        />
                        {touched.postalCode && fieldErrors.postalCode && (
                          <p id="checkout-postal-error" className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium" role="alert">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{fieldErrors.postalCode}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Courier Selection Radio Group */}
                  <fieldset className="border-0 p-0 m-0 space-y-3" role="radiogroup" aria-labelledby="courier-heading">
                    <legend id="courier-heading" className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#003d29]" />
                      <span>Pilih Layanan Pengiriman</span>
                    </legend>

                    <div className="space-y-2.5">
                      {COURIER_SERVICES.map((c) => {
                        const isSelected = selectedCourierId === c.id;
                        return (
                          <label
                            key={c.id}
                            htmlFor={`courier-${c.id}`}
                            className={`motion-press p-3.5 rounded-2xl border transition-[border-color,box-shadow,transform] duration-160 ease-[var(--ease-out)] active:scale-[0.98] cursor-pointer flex items-center justify-between text-xs focus-within:ring-2 focus-within:ring-[#003d29] focus-within:border-[#003d29] ${
                              isSelected
                                ? 'border-[#003d29] bg-emerald-50/50 ring-2 ring-[#003d29]/20 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                id={`courier-${c.id}`}
                                name="courier_option"
                                value={c.id}
                                checked={isSelected}
                                onChange={() => setSelectedCourierId(c.id)}
                                className="w-4 h-4 text-[#003d29] accent-[#003d29] focus:ring-[#003d29] cursor-pointer"
                              />
                              <div>
                                <div className="flex items-center gap-2 font-bold text-slate-900">
                                  <span>{c.name}</span>
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    {c.badge}
                                  </span>
                                </div>
                                <p className="text-slate-500 text-[11px] mt-0.5">{c.service} · {c.eta}</p>
                              </div>
                            </div>
                            <div className="font-extrabold text-[#003d29] tabular-nums text-sm">
                              {c.price === 0 ? 'Gratis' : formatRupiah(c.price)}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    className="motion-press active:scale-[0.97] w-full min-h-[44px] py-3.5 px-6 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] transition-[background-color,transform,box-shadow] duration-160 ease-[var(--ease-out)] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/10"
                  >
                    <span>Lanjut ke Metode Pembayaran</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Payment Method Radio Group */}
                  <fieldset className="border-0 p-0 m-0 space-y-3" role="radiogroup" aria-labelledby="payment-heading">
                    <legend id="payment-heading" className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#003d29]" />
                      <span>Pilih Metode Pembayaran</span>
                    </legend>

                    <div className="space-y-3">
                      {[
                        { id: 'qris', name: 'QRIS (GoPay, OVO, Dana, ShopeePay, BCA)', desc: 'Scan instan otomatis terverifikasi' },
                        { id: 'virtual_account', name: 'Virtual Account (BCA, Mandiri, BRI, BNI)', desc: 'Konfirmasi otomatis tanpa upload bukti' },
                        { id: 'credit', name: 'Kartu Kredit / Debit Online', desc: 'Proteksi 3D Secure 256-bit SSL' },
                        { id: 'cod', name: 'Cash on Delivery (COD)', desc: 'Bayar tunai ke kurir saat barang tiba' },
                      ].map((pm) => {
                        const isSelected = paymentMethod === pm.id;
                        return (
                          <label
                            key={pm.id}
                            htmlFor={`payment-${pm.id}`}
                            className={`motion-press p-3.5 rounded-2xl border transition-[border-color,box-shadow,transform] duration-160 ease-[var(--ease-out)] active:scale-[0.98] cursor-pointer flex items-center gap-3 text-xs focus-within:ring-2 focus-within:ring-[#003d29] focus-within:border-[#003d29] ${
                              isSelected
                                ? 'border-[#003d29] bg-emerald-50/50 ring-2 ring-[#003d29]/20 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              id={`payment-${pm.id}`}
                              name="payment_method"
                              value={pm.id}
                              checked={isSelected}
                              onChange={() => setPaymentMethod(pm.id as any)}
                              className="w-4 h-4 text-[#003d29] accent-[#003d29] focus:ring-[#003d29] cursor-pointer"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{pm.name}</div>
                              <div className="text-[11px] text-slate-500">{pm.desc}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('delivery')}
                      className="motion-press active:scale-[0.97] w-1/3 min-h-[44px] py-3 px-4 rounded-full border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] transition-[background-color,transform] duration-160 ease-[var(--ease-out)] cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteOrder}
                      disabled={isSubmitting}
                      className="motion-press active:scale-[0.97] w-2/3 min-h-[44px] py-3.5 px-6 rounded-full font-black text-sm text-white bg-[#003d29] hover:bg-[#064e3b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] transition-[background-color,transform,box-shadow] duration-160 ease-[var(--ease-out)] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/10 disabled:opacity-40"
                    >
                      <Lock className="w-4 h-4" />
                      <span className="tabular-nums">{isSubmitting ? 'Memproses Pesanan...' : `Bayar ${formatRupiah(calcTotal)}`}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Order Summary & Voucher */}
            <div className="lg:col-span-5 space-y-5">
              {/* Voucher Box */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2 text-xs">
                <label htmlFor="checkout-coupon-code" className="font-bold text-slate-900 flex items-center gap-1.5 cursor-pointer">
                  <Tag className="w-4 h-4 text-[#003d29]" />
                  <span>Miliki Kode Voucher Promo?</span>
                </label>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    id="checkout-coupon-code"
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Contoh: PASARIA50"
                    className="flex-1 px-3 py-2 min-h-[40px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29] uppercase font-bold text-xs transition-all"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 min-h-[40px] rounded-xl bg-[#003d29] text-white font-bold text-xs hover:bg-[#064e3b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] transition-colors cursor-pointer"
                  >
                    Terapkan
                  </button>
                </form>
                {appliedVoucher && (
                  <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Voucher {appliedVoucher} aktif! Hemat <span className="tabular-nums">{formatRupiah(calcDiscount)}</span></span>
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
        )}
      </div>
    </div>
  );
};
