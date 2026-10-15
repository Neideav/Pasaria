import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Lock,
  CheckCircle2,
  Tag,
  ChevronDown,
  MapPin,
  AlertCircle,
  Building2,
  CreditCard,
  Sparkles,
  BookmarkCheck,
  Check
} from 'lucide-react';
import { CartItem, User, DeliveryShipment, UserAddress } from '../types';
import { ProductVisual } from './ProductVisual';
import { api, ApiError } from '../services/api';
import { formatRupiah } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

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
    service: 'Jaringan logistik kurir resmi prioritas',
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

interface CheckoutPageProps {
  items: CartItem[];
  user: User | null;
  onBack: () => void;
  onOrderSuccess: (orderNumber: string, shipment: DeliveryShipment, openDeliveryView?: boolean) => void;
  subtotal: number;
  onNavigateHome: () => void;
}

interface DeliveryErrors {
  email?: string;
  recipientName?: string;
  phone?: string;
  addressLine?: string;
  city?: string;
  postalCode?: string;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  user,
  onBack,
  onOrderSuccess,
  subtotal: propSubtotal,
  onNavigateHome,
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    shipment: DeliveryShipment;
  } | null>(null);

  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Address and Contact State
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [email, setEmail] = useState(user?.email || 'customer@pasaria.id');
  const [recipientName, setRecipientName] = useState(user?.name || 'Budi Santoso');
  const [phone, setPhone] = useState(user?.phone || '+62 812-3456-7890');
  const [addressLine1, setAddressLine1] = useState(user?.address || 'Jl. Sudirman No. 45, RT 02 / RW 05');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState(user?.city || 'Jakarta Selatan');
  const [stateProvince, setStateProvince] = useState('DKI Jakarta');
  const [postalCode, setPostalCode] = useState(user?.zip || '12190');
  const [country, setCountry] = useState('Indonesia');
  const [saveInfoForNextTime, setSaveInfoForNextTime] = useState(true);

  // Form touched state
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Courier Selection
  const [selectedCourierId, setSelectedCourierId] = useState('pasaria_express');

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'virtual_account' | 'credit' | 'cod'>('qris');

  // Voucher
  const [couponCode, setCouponCode] = useState('PASARIA50');
  const [appliedVoucher, setAppliedVoucher] = useState<string>('PASARIA50');
  const [voucherDiscount, setVoucherDiscount] = useState<number>(50000);
  const [voucherError, setVoucherError] = useState('');

  // Server Calculation Breakdown
  const [serverCalculation, setServerCalculation] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(() => `idemp-${Date.now()}`);

  // Load Saved Addresses
  useEffect(() => {
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
          setAddressLine1(def.address_line);
          setCity(def.city);
          setPostalCode(def.postal_code);
        }
      } catch (e) {
        console.warn('Addresses load error:', e);
      }
    };
    loadAddresses();
  }, [user]);

  // Server Calculation
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
    triggerCalculation();
  }, [selectedCourierId, appliedVoucher, items]);

  // Confetti on order success
  useEffect(() => {
    if (step === 'review' && confettiCanvasRef.current) {
      const myConfetti = confetti.create(confettiCanvasRef.current, {
        resize: true,
        useWorker: true,
      });

      myConfetti({
        particleCount: 130,
        spread: 85,
        origin: { y: 0.5 },
        colors: ['#003d29', '#064e3b', '#10b981', '#059669', '#f59e0b', '#3b82f6'],
        disableForReducedMotion: true,
      });

      const timer = setTimeout(() => {
        myConfetti.reset();
      }, 2800);

      return () => {
        clearTimeout(timer);
        myConfetti.reset();
      };
    }
  }, [step]);

  // Validation
  const validateDeliveryForm = (): DeliveryErrors => {
    const errors: DeliveryErrors = {};
    if (!email.trim()) {
      errors.email = 'Alamat email wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Format email tidak valid.';
    }
    if (!recipientName.trim()) {
      errors.recipientName = 'Nama lengkap penerima wajib diisi.';
    }
    if (!phone.trim()) {
      errors.phone = 'Nomor telepon wajib diisi.';
    } else if (!/^[0-9+\s-]{8,20}$/.test(phone.trim())) {
      errors.phone = 'Format nomor telepon minimal 8 digit.';
    }
    if (!addressLine1.trim()) {
      errors.addressLine = 'Alamat baris 1 (nama jalan & nomor rumah) wajib diisi.';
    }
    if (!city.trim()) {
      errors.city = 'Kota / Kabupaten wajib diisi.';
    }
    if (!postalCode.trim()) {
      errors.postalCode = 'Kode pos wajib diisi.';
    } else if (!/^\d{5}$/.test(postalCode.trim())) {
      errors.postalCode = 'Kode pos harus 5 digit angka.';
    }
    return errors;
  };

  const fieldErrors = validateDeliveryForm();

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSelectSavedAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setRecipientName(addr.recipient_name);
    setPhone(addr.phone);
    setAddressLine1(addr.address_line);
    setCity(addr.city);
    setPostalCode(addr.postal_code);
    showToast(`Alamat "${addr.recipient_name}" berhasil diterapkan.`, 'info');
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
      showToast(`Voucher ${couponCode.trim().toUpperCase()} berhasil digunakan!`, 'success');
    } catch (err: any) {
      setVoucherError(err.message || 'Kode voucher tidak valid atau telah kedaluwarsa.');
      setAppliedVoucher('');
      setVoucherDiscount(0);
    }
  };

  const selectedCourier = COURIER_SERVICES.find((c) => c.id === selectedCourierId) || COURIER_SERVICES[0];

  // Price calculations
  const calcSubtotal = serverCalculation?.subtotal ?? items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const calcShipping = serverCalculation?.shipping_cost ?? selectedCourier.price;
  const calcTax = serverCalculation?.tax ?? Math.round(calcSubtotal * 0.11);
  const calcDiscount = serverCalculation?.voucher_discount ?? voucherDiscount;
  const calcTotal = serverCalculation?.total ?? Math.max(0, calcSubtotal + calcShipping + calcTax - calcDiscount);

  const handleProceedToPayment = () => {
    const errors = validateDeliveryForm();
    if (Object.keys(errors).length > 0) {
      setTouched({
        email: true,
        recipientName: true,
        phone: true,
        addressLine: true,
        city: true,
        postalCode: true,
      });
      setValidationError('Silakan lengkapi informasi pengiriman dengan benar.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    setValidationError('');
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteOrder = async () => {
    if (isSubmitting) return;

    const errors = validateDeliveryForm();
    if (Object.keys(errors).length > 0) {
      setStep('shipping');
      setTouched({
        email: true,
        recipientName: true,
        phone: true,
        addressLine: true,
        city: true,
        postalCode: true,
      });
      setValidationError('Mohon periksa kembali kelengkapan alamat pengiriman.');
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

      const fullAddress = `${addressLine1.trim()}${addressLine2.trim() ? `, ${addressLine2.trim()}` : ''}, ${city.trim()}, ${stateProvince.trim()} ${postalCode.trim()}, ${country.trim()}`;

      const res = await api.checkoutOrder({
        items: checkoutItems,
        customer_name: recipientName.trim(),
        customer_phone: phone.trim(),
        recipient_name: recipientName.trim(),
        recipient_phone: phone.trim(),
        shipping_address: fullAddress,
        payment_method: paymentMethod,
        shipping_method: selectedCourier.name,
        voucher_code: appliedVoucher || undefined,
        idempotency_key: idempotencyKey,
      });

      // Optionally save address to backend if user requested
      if (saveInfoForNextTime && user) {
        try {
          await api.addAddress({
            recipient_name: recipientName.trim(),
            phone: phone.trim(),
            address_line: `${addressLine1.trim()}${addressLine2.trim() ? `, ${addressLine2.trim()}` : ''}`,
            city: city.trim(),
            postal_code: postalCode.trim(),
            is_default: savedAddresses.length === 0,
          });
        } catch (_) {
          // Non-blocking if address already exists
        }
      }

      const shipment: DeliveryShipment = res.shipment || {
        id: `shp-${res.order_number}`,
        order_number: res.order_number,
        courier_name: selectedCourier.name,
        courier_service: selectedCourier.service,
        tracking_number: res.tracking_number || (res as any).shipment?.tracking_number || `PAS-TRK-${res.order_number}`,
        status: 'in_transit',
        status_label: 'Paket Sedang Dikirim — Kurir Prioritas PASARIA',
        recipient_name: recipientName,
        recipient_phone: phone,
        delivery_address: fullAddress,
        origin_address: 'Fulfillment Center PASARIA Hub Utama',
        estimated_arrival: selectedCourier.eta,
        current_location: 'Pusat Distribusi Regional',
        items_count: items.reduce((s, i) => s + i.quantity, 0),
        total_amount: (res as any).pricing?.total || res.total || calcTotal,
        created_at: new Date().toISOString(),
        checkpoints: [],
      };

      setIdempotencyKey(`idemp-${Date.now()}`);
      setCompletedOrder({
        orderNumber: res.order_number,
        shipment,
      });
      setStep('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="min-h-screen bg-[#fcfcfc] text-[#1c2a23] pb-20">
      {/* Motion Confetti Canvas */}
      <canvas
        ref={confettiCanvasRef}
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8">
        {/* Navigation & Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#003d29] hover:text-[#064e3b] hover:underline cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Cart</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#526058] bg-emerald-50/70 px-3 py-1 rounded-full border border-emerald-100">
                <Lock className="w-3.5 h-3.5 text-[#003d29]" />
                <span>Secure 256-Bit Checkout</span>
              </div>
              <div className="text-xs text-[#526058] font-medium hidden sm:block">
                Langkah {step === 'shipping' ? '1' : step === 'payment' ? '2' : '3'} dari 3
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1c2a23] tracking-tight mb-6">
            Checkout
          </h1>

          {/* Stepper Progress Bar */}
          <div className="flex items-center gap-3 sm:gap-6 py-2 overflow-x-auto text-xs sm:text-sm font-semibold">
            {/* Step 1: Shipping */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === 'shipping'
                    ? 'bg-[#003d29] text-white shadow-sm'
                    : 'bg-[#10b981] text-white'
                }`}
              >
                {step === 'shipping' ? '1' : '✓'}
              </span>
              <span className={step === 'shipping' ? 'text-[#003d29] font-bold' : 'text-[#1c2a23]'}>
                Shipping
              </span>
            </div>

            <div className="w-8 sm:w-16 h-px bg-slate-200 shrink-0" />

            {/* Step 2: Payment */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === 'payment'
                    ? 'bg-[#003d29] text-white shadow-sm'
                    : step === 'review'
                    ? 'bg-[#10b981] text-white'
                    : 'border border-slate-300 text-slate-400 bg-white'
                }`}
              >
                {step === 'review' ? '✓' : '2'}
              </span>
              <span
                className={
                  step === 'payment'
                    ? 'text-[#003d29] font-bold'
                    : step === 'review'
                    ? 'text-[#1c2a23]'
                    : 'text-slate-400'
                }
              >
                Payment
              </span>
            </div>

            <div className="w-8 sm:w-16 h-px bg-slate-200 shrink-0" />

            {/* Step 3: Review */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === 'review'
                    ? 'bg-[#003d29] text-white shadow-sm'
                    : 'border border-slate-300 text-slate-400 bg-white'
                }`}
              >
                3
              </span>
              <span className={step === 'review' ? 'text-[#003d29] font-bold' : 'text-slate-400'}>
                Review
              </span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {validationError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-xs"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Form Content */}
          <div className="lg:col-span-7 space-y-8">
            {/* STEP 1: SHIPPING */}
            {step === 'shipping' && (
              <div className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
                {/* Saved Address Quick Selector */}
                {savedAddresses.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#f8faf9] border border-slate-200/80 text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1c2a23] flex items-center gap-1.5">
                        <BookmarkCheck className="w-4 h-4 text-[#003d29]" />
                        <span>Pilih dari Alamat Tersimpan:</span>
                      </span>
                      <span className="text-[11px] text-[#526058] font-medium">
                        {savedAddresses.length} Alamat tersedia
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-[#003d29] text-white border-[#003d29] shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span>{addr.recipient_name}</span>
                            {addr.is_default && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-[#003d29]'}`}>
                                Utama
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 1: Contact Information */}
                <section>
                  <h2 className="text-lg font-bold text-[#1c2a23] mb-4">
                    Contact Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="checkout-email"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Email address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="checkout-email"
                        type="email"
                        autoComplete="email"
                        placeholder="youremail@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (validationError) setValidationError('');
                        }}
                        onBlur={() => handleBlur('email')}
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none ${
                          touched.email && fieldErrors.email
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200'
                            : 'border-slate-200 focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]/15'
                        }`}
                        required
                      />
                      {touched.email && fieldErrors.email && (
                        <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{fieldErrors.email}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-phone"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Phone number / WhatsApp <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="checkout-phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+62 812-3456-7890"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (validationError) setValidationError('');
                        }}
                        onBlur={() => handleBlur('phone')}
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none ${
                          touched.phone && fieldErrors.phone
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200'
                            : 'border-slate-200 focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]/15'
                        }`}
                        required
                      />
                      {touched.phone && fieldErrors.phone && (
                        <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{fieldErrors.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Section 2: Shipping Address */}
                <section>
                  <h2 className="text-lg font-bold text-[#1c2a23] mb-4">
                    Shipping Address
                  </h2>

                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label
                        htmlFor="checkout-name"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="checkout-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Nama Lengkap Penerima"
                        value={recipientName}
                        onChange={(e) => {
                          setRecipientName(e.target.value);
                          if (validationError) setValidationError('');
                        }}
                        onBlur={() => handleBlur('recipientName')}
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none ${
                          touched.recipientName && fieldErrors.recipientName
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200'
                            : 'border-slate-200 focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]/15'
                        }`}
                        required
                      />
                      {touched.recipientName && fieldErrors.recipientName && (
                        <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{fieldErrors.recipientName}</span>
                        </p>
                      )}
                    </div>

                    {/* Address Line 1 */}
                    <div>
                      <label
                        htmlFor="checkout-address1"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Address Line 1 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="checkout-address1"
                        type="text"
                        autoComplete="address-line1"
                        placeholder="House number and street name"
                        value={addressLine1}
                        onChange={(e) => {
                          setAddressLine1(e.target.value);
                          if (validationError) setValidationError('');
                        }}
                        onBlur={() => handleBlur('addressLine')}
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none ${
                          touched.addressLine && fieldErrors.addressLine
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200'
                            : 'border-slate-200 focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]/15'
                        }`}
                        required
                      />
                      {touched.addressLine && fieldErrors.addressLine && (
                        <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{fieldErrors.addressLine}</span>
                        </p>
                      )}
                    </div>

                    {/* Address Line 2 */}
                    <div>
                      <label
                        htmlFor="checkout-address2"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Address Line 2 (Optional)
                      </label>
                      <input
                        id="checkout-address2"
                        type="text"
                        autoComplete="address-line2"
                        placeholder="Apartment, suite, unit, etc."
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm transition-all focus:outline-none focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]/15"
                      />
                    </div>

                    {/* City & State/Province Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="checkout-city"
                          className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          City <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="checkout-city"
                          type="text"
                          autoComplete="address-level2"
                          placeholder="Jakarta Selatan"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            if (validationError) setValidationError('');
                          }}
                          onBlur={() => handleBlur('city')}
                          className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none ${
                            touched.city && fieldErrors.city
                              ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200'
                              : 'border-slate-200 focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]/15'
                          }`}
                          required
                        />
                        {touched.city && fieldErrors.city && (
                          <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{fieldErrors.city}</span>
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <label
                          htmlFor="checkout-state"
                          className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          State / Province <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            id="checkout-state"
                            type="text"
                            value={stateProvince}
                            onChange={(e) => setStateProvince(e.target.value)}
                            placeholder="DKI Jakarta / Jawa Barat"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm transition-all focus:outline-none focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]/15"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* ZIP & Country Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="checkout-zip"
                          className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          ZIP / Postal Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="checkout-zip"
                          type="text"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          placeholder="12190"
                          value={postalCode}
                          onChange={(e) => {
                            setPostalCode(e.target.value);
                            if (validationError) setValidationError('');
                          }}
                          onBlur={() => handleBlur('postalCode')}
                          className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none ${
                            touched.postalCode && fieldErrors.postalCode
                              ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200'
                              : 'border-slate-200 focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]/15'
                          }`}
                          required
                        />
                        {touched.postalCode && fieldErrors.postalCode && (
                          <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{fieldErrors.postalCode}</span>
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <label
                          htmlFor="checkout-country"
                          className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          Country <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="checkout-country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white transition-all focus:outline-none focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]/15 cursor-pointer pr-10"
                          >
                            <option value="Indonesia">Indonesia</option>
                            <option value="Malaysia">Malaysia</option>
                            <option value="Singapore">Singapore</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 3: Courier Selection */}
                <section>
                  <h2 className="text-lg font-bold text-[#1c2a23] mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#003d29]" />
                    <span>Shipping Method</span>
                  </h2>

                  <div className="space-y-3">
                    {COURIER_SERVICES.map((c) => {
                      const isSelected = selectedCourierId === c.id;
                      return (
                        <label
                          key={c.id}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs sm:text-sm ${
                            isSelected
                              ? 'border-[#003d29] bg-emerald-50/40 ring-1 ring-[#003d29]'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="courier_option"
                              value={c.id}
                              checked={isSelected}
                              onChange={() => setSelectedCourierId(c.id)}
                              className="w-4 h-4 text-[#003d29] accent-[#003d29] focus:ring-[#003d29] cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2 font-bold text-[#1c2a23]">
                                <span>{c.name}</span>
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  {c.badge}
                                </span>
                              </div>
                              <p className="text-[#526058] text-xs mt-0.5">
                                {c.service} · <span className="font-medium text-[#1c2a23]">{c.eta}</span>
                              </p>
                            </div>
                          </div>
                          <div className="font-extrabold text-[#003d29] tabular-nums text-sm sm:text-base">
                            {c.price === 0 ? 'Gratis' : formatRupiah(c.price)}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </section>

                {/* Checkbox Save info */}
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={saveInfoForNextTime}
                      onChange={(e) => setSaveInfoForNextTime(e.target.checked)}
                      className="w-4 h-4 text-[#003d29] rounded accent-[#003d29] cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 font-medium">
                      Save this information for next time
                    </span>
                  </label>
                </div>

                {/* Submit Step 1 Button */}
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="w-full py-4 px-6 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white font-bold text-base shadow-md shadow-[#003d29]/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* STEP 2: PAYMENT */}
            {step === 'payment' && (
              <div className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
                {/* Shipping Summary Box */}
                <div className="p-4 rounded-xl bg-[#f8faf9] border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-[#526058] font-medium">Contact:</span>
                    <span className="font-bold text-[#1c2a23]">{email} ({phone})</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-[#526058] font-medium">Ship to:</span>
                    <span className="font-bold text-[#1c2a23] truncate max-w-[260px] sm:max-w-md">
                      {recipientName}, {addressLine1}, {city}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#526058] font-medium">Method:</span>
                    <span className="font-bold text-[#1c2a23]">{selectedCourier.name} ({selectedCourier.price === 0 ? 'Gratis' : formatRupiah(selectedCourier.price)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('shipping')}
                    className="text-xs font-bold text-[#003d29] hover:underline cursor-pointer pt-1"
                  >
                    Change Shipping Details
                  </button>
                </div>

                {/* Payment Selection */}
                <section>
                  <h2 className="text-lg font-bold text-[#1c2a23] mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#003d29]" />
                    <span>Select Payment Method</span>
                  </h2>

                  <div className="space-y-3">
                    {[
                      {
                        id: 'qris',
                        name: 'QRIS (GoPay, OVO, Dana, ShopeePay, BCA)',
                        desc: 'Scan QR instan otomatis terverifikasi secara real-time',
                        tag: 'Paling Populer',
                      },
                      {
                        id: 'virtual_account',
                        name: 'Virtual Account (BCA, Mandiri, BRI, BNI)',
                        desc: 'Nomor VA langsung keluar, tanpa verifikasi manual',
                        tag: 'Otomatis',
                      },
                      {
                        id: 'credit',
                        name: 'Kartu Kredit / Debit Online',
                        desc: 'Proteksi 3D Secure dengan enkripsi PCI-DSS 256-bit',
                        tag: 'Aman',
                      },
                      {
                        id: 'cod',
                        name: 'Cash on Delivery (COD)',
                        desc: 'Bayar tunai langsung ke kurir saat paket sampai di tempat',
                        tag: 'Bayar di Tempat',
                      },
                    ].map((pm) => {
                      const isSelected = paymentMethod === pm.id;
                      return (
                        <label
                          key={pm.id}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs sm:text-sm ${
                            isSelected
                              ? 'border-[#003d29] bg-emerald-50/40 ring-1 ring-[#003d29]'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="payment_method"
                              value={pm.id}
                              checked={isSelected}
                              onChange={() => setPaymentMethod(pm.id as any)}
                              className="w-4 h-4 text-[#003d29] accent-[#003d29] focus:ring-[#003d29] cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2 font-bold text-[#1c2a23]">
                                <span>{pm.name}</span>
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                  {pm.tag}
                                </span>
                              </div>
                              <p className="text-[#526058] text-xs mt-0.5">{pm.desc}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </section>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('shipping')}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    ← Return to Shipping
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteOrder}
                    disabled={isSubmitting}
                    className="w-full sm:flex-1 py-4 px-6 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white font-bold text-base shadow-md shadow-[#003d29]/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Memproses Pembayaran...</span>
                    ) : (
                      <>
                        <span>Complete Order ({formatRupiah(calcTotal)})</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW / SUCCESS */}
            {step === 'review' && completedOrder && (
              <div className="space-y-6 bg-white p-8 sm:p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/10 mb-4 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                    <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                    <span>Order Successfully Confirmed</span>
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1c2a23] tracking-tight">
                    Terima Kasih Atas Pesanan Anda!
                  </h2>
                  <p className="text-sm text-[#526058] max-w-md mx-auto">
                    Nomor pesanan Anda adalah{' '}
                    <span className="font-bold text-[#1c2a23]">
                      #{completedOrder.orderNumber}
                    </span>
                    . Penjual sedang menyiapkan paket untuk diserahkan ke kurir logistik.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="max-w-md mx-auto bg-[#f8faf9] rounded-2xl p-5 border border-slate-200 text-xs text-left space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-[#526058] font-medium">Tracking Number:</span>
                    <span className="font-mono font-bold text-[#1c2a23]">{completedOrder.shipment.tracking_number}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-[#526058] font-medium">Kurir Pengiriman:</span>
                    <span className="font-bold text-[#1c2a23]">{completedOrder.shipment.courier_name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-[#526058] font-medium">Estimasi Tiba:</span>
                    <span className="font-bold text-[#059669]">{completedOrder.shipment.estimated_arrival}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 font-bold">
                    <span className="text-slate-700">Total Pembayaran:</span>
                    <span className="text-base text-[#003d29] font-extrabold tabular-nums">
                      {formatRupiah(completedOrder.shipment.total_amount)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 max-w-md mx-auto flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => onOrderSuccess(completedOrder.orderNumber, completedOrder.shipment, true)}
                    className="w-full py-4 px-6 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Lacak Status Pengiriman</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateHome}
                    className="w-full sm:w-auto py-4 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
                  >
                    Kembali Belanja
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs sticky top-24 sm:top-28 space-y-6">
              <h2 className="text-lg font-bold text-[#1c2a23]">
                Order Summary
              </h2>

              {/* Items List */}
              <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={`${item.product.id}-${item.variant_id || idx}`} className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 relative">
                      <ProductVisual
                        imageKey={item.product.image}
                        name={item.product.name}
                        size="sm"
                        className="w-full h-full object-contain"
                      />
                      {item.quantity > 1 && (
                        <span className="absolute top-1 right-1 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          x{item.quantity}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-[#1c2a23] truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-[#526058] mt-0.5 truncate">
                        {item.selectedColor ? item.selectedColor : 'Standar'}
                        {item.variant_id ? ` · Varian #${item.variant_id}` : ''}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <span className="font-extrabold text-sm text-[#1c2a23] tabular-nums">
                        {formatRupiah(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon / Voucher Input Form */}
              <form onSubmit={handleApplyCoupon} className="pt-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Kode Kupon (cth: PASARIA50)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold uppercase tracking-wider focus:outline-none focus:border-[#003d29] focus:ring-1 focus:ring-[#003d29]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Terapkan
                  </button>
                </div>
                {voucherError && (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-medium">{voucherError}</p>
                )}
                {appliedVoucher && !voucherError && (
                  <p className="text-[11px] text-emerald-700 mt-1.5 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Voucher {appliedVoucher} berhasil terpasang (-{formatRupiah(voucherDiscount)})</span>
                  </p>
                )}
              </form>

              {/* Price Breakdown */}
              <div className="border-t border-slate-100 pt-5 space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-[#526058]">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#1c2a23] tabular-nums">
                    {formatRupiah(calcSubtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#526058]">
                  <span>Shipping</span>
                  <span className="font-bold text-[#1c2a23] tabular-nums">
                    {calcShipping === 0 ? 'Gratis (Free)' : formatRupiah(calcShipping)}
                  </span>
                </div>

                {calcDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-semibold">
                    <span>Discount</span>
                    <span className="tabular-nums">-{formatRupiah(calcDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[#526058] text-xs">
                  <span>PPN (11%)</span>
                  <span className="tabular-nums">{formatRupiah(calcTax)}</span>
                </div>

                {/* Final Total */}
                <div className="border-t border-slate-100 pt-4 flex justify-between items-baseline">
                  <span className="text-base font-bold text-[#1c2a23]">Total</span>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#003d29] tabular-nums tracking-tight">
                      {formatRupiah(calcTotal)}
                    </span>
                    {isCalculating && (
                      <span className="block text-[10px] text-slate-400">Menghitung...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3 Trust Badges */}
              <div className="border-t border-slate-100 pt-6 grid grid-cols-3 gap-3 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#003d29] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#1c2a23] leading-tight">
                    Secure Checkout
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#003d29] flex items-center justify-center">
                    <Truck className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#1c2a23] leading-tight">
                    Free Shipping
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#003d29] flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#1c2a23] leading-tight">
                    Easy Returns
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
