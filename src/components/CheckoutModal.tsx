import React, { useState } from 'react';
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
  Navigation,
  Sparkles
} from 'lucide-react';
import { CartItem, User, DeliveryShipment } from '../types';
import { ProductVisual } from './ProductVisual';

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
    id: 'shopcart_express',
    name: 'Shopcart Express Priority',
    service: 'Fast ground & local distribution network',
    eta: 'Tomorrow by 2:00 PM',
    price: 0.0,
    badge: 'Free Included',
  },
  {
    id: 'fedex_air',
    name: 'FedEx Priority Air Overnight',
    service: 'Direct air freight with premium insurance',
    eta: 'Tomorrow by 10:30 AM',
    price: 4.99,
    badge: 'Fastest Air',
  },
  {
    id: 'instant_courier',
    name: 'Same-Day Dedicated Courier',
    service: 'Direct point-to-point courier delivery',
    eta: 'Today within 3-4 Hours',
    price: 8.99,
    badge: 'Same-Day Instant',
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
  subtotal,
}) => {
  // Stepper state: 'delivery' must be filled before 'payment'
  const [step, setStep] = useState<'delivery' | 'payment'>('delivery');

  // Form Fields
  const [firstName, setFirstName] = useState(user?.name ? user.name.split(' ')[0] : '');
  const [lastName, setLastName] = useState(user?.name && user.name.split(' ').length > 1 ? user.name.split(' ')[1] : '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [zipCode, setZipCode] = useState(user?.zip || '');
  const [mobile, setMobile] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  // Courier state
  const [selectedCourierId, setSelectedCourierId] = useState('shopcart_express');
  const [validationError, setValidationError] = useState('');
  const [attemptedStep1, setAttemptedStep1] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'cod' | 'paypal' | 'shopcart'>('credit');
  const [cardHolder, setCardHolder] = useState(user?.name || '');
  const [cardNumber, setCardNumber] = useState('3657 8943 0012 3410');
  const [expiry, setExpiry] = useState('08/29');
  const [cvc, setCvc] = useState('784');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [couponApplied, setCouponApplied] = useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('9945284820');
  const [completedShipment, setCompletedShipment] = useState<DeliveryShipment | null>(null);

  if (!isOpen) return null;

  const selectedCourier = COURIER_SERVICES.find((c) => c.id === selectedCourierId) || COURIER_SERVICES[0];
  const shippingCost = selectedCourier.price;
  const tax = subtotal * 0.1;
  const discountAmount = couponApplied ? subtotal * (discountPercent / 100) : 0;
  const total = Math.max(0, subtotal + tax - discountAmount + shippingCost);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === 'SHOP50') {
      setDiscountPercent(50);
      setCouponApplied(true);
    } else {
      setDiscountPercent(10);
      setCouponApplied(true);
    }
  };

  // Validation function: Check if delivery info is complete
  const isDeliveryValid = () => {
    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      address.trim().length > 0 &&
      city.trim().length > 0 &&
      zipCode.trim().length > 0 &&
      mobile.trim().length > 0 &&
      email.trim().length > 0
    );
  };

  const handleProceedToPayment = () => {
    setAttemptedStep1(true);
    if (!isDeliveryValid()) {
      setValidationError('Please complete all required shipping address fields and choose a courier before payment.');
      return;
    }
    setValidationError('');
    setStep('payment');
  };

  const handleCompleteOrder = async () => {
    if (!isDeliveryValid()) {
      setStep('delivery');
      setAttemptedStep1(true);
      setValidationError('Please complete all required shipping address fields before payment.');
      return;
    }

    setIsSubmitting(true);
    const newTransactionId = String(Math.floor(1000000000 + Math.random() * 9000000000));
    const trackingNumber = `SC-${selectedCourier.name.slice(0, 3).toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;
    setOrderId(newTransactionId);

    // Create real-time delivery shipment structure
    const newShipment: DeliveryShipment = {
      id: `shp-${newTransactionId}`,
      order_number: newTransactionId,
      courier_name: selectedCourier.name,
      courier_service: selectedCourier.service,
      tracking_number: trackingNumber,
      status: 'in_transit',
      status_label: 'Package in Transit — Handed to Courier for Live Delivery',
      recipient_name: `${firstName} ${lastName}`.trim(),
      recipient_phone: mobile,
      delivery_address: `${address}, ${city}, ${zipCode}`,
      origin_address: 'Central Fulfillment Center #4, North Hub',
      estimated_arrival: selectedCourier.eta,
      driver_name: 'Marcus Vance (Courier Specialist)',
      driver_phone: '+1 (555) 987-6543',
      driver_vehicle: 'Eco Electric Van #EV-428',
      current_location: 'Central Sorting & Transit Dispatch, Sector 7',
      items_count: items.reduce((s, i) => s + i.quantity, 0),
      items_preview: items.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        color: i.selectedColor || 'Default',
        image: i.product.image,
      })),
      total_amount: total,
      created_at: new Date().toISOString(),
      checkpoints: [
        {
          id: 'cp-1',
          title: 'Order Confirmed & Securely Packed',
          location: 'Shopcart Central Fulfillment Center',
          timestamp: 'Just Now',
          status: 'completed',
          description: `Payment approved via ${paymentMethod === 'credit' ? 'Credit Card' : paymentMethod.toUpperCase()}. Products packed in eco-friendly protective packaging.`
        },
        {
          id: 'cp-2',
          title: `Courier Dispatched (${selectedCourier.name})`,
          location: 'Outbound Bay #12',
          timestamp: 'Just Now',
          status: 'completed',
          description: `Assigned tracking barcode ${trackingNumber}. Passed weight inspection.`
        },
        {
          id: 'cp-3',
          title: 'In Transit — Heading to Local Delivery Hub',
          location: 'Regional Logistics Expressway',
          timestamp: 'Active Now',
          status: 'current',
          description: `Courier driver Marcus Vance is en route with your package. Live GPS updates enabled.`
        },
        {
          id: 'cp-4',
          title: 'Out for Final Delivery',
          location: `${city} Neighborhood Delivery Hub`,
          timestamp: selectedCourier.eta,
          status: 'upcoming',
          description: 'Courier driver will arrive at destination address with secure contactless handover.'
        },
        {
          id: 'cp-5',
          title: 'Package Delivered',
          location: `${address}, ${city}`,
          timestamp: selectedCourier.eta,
          status: 'upcoming',
          description: 'Signed confirmation and digital delivery photo proof.'
        }
      ]
    };

    setCompletedShipment(newShipment);

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: `${firstName} ${lastName}`.trim(),
          customer_email: email,
          shipping_address: `${address}, ${city}, ${zipCode}`,
          payment_method:
            paymentMethod === 'credit'
              ? 'Credit or Debit Card'
              : paymentMethod === 'cod'
              ? 'Cash on Delivery'
              : paymentMethod === 'paypal'
              ? 'PayPal'
              : 'Shopcart Card',
          subtotal,
          tax,
          discount: discountAmount,
          shipping_cost: shippingCost,
          total,
          courier: selectedCourier.name,
          courier_service: selectedCourier.service,
          tracking_number: trackingNumber,
          estimated_delivery: selectedCourier.eta,
          items: items.map((i) => ({
            id: i.product.id,
            name: i.product.name,
            slug: i.product.slug,
            price: i.product.price,
            quantity: i.quantity,
            color: i.selectedColor || 'Standard',
            image: i.product.image,
          })),
        }),
      });
    } catch (e) {
      console.error(e);
    }

    setIsSubmitting(false);
    setOrderComplete(true);

    try {
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch (_) {}

    onOrderSuccess(newTransactionId, newShipment, false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-slate-100 max-h-[92vh] flex flex-col text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-slate-100 bg-[#fbfbfb]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>Home</span>
              <span>/</span>
              <span>Cart</span>
              <span>/</span>
              <span className="text-[#003d29] font-bold">Checkout</span>
            </div>

            {!orderComplete && (
              <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full transition-colors ${
                    step === 'delivery'
                      ? 'bg-[#003d29] text-white'
                      : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  1. Delivery Details
                </span>
                <span className="text-slate-300">→</span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full transition-colors ${
                    step === 'payment'
                      ? 'bg-[#003d29] text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  2. Payment
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {orderComplete ? (
          /* Order Accepted State with Live Delivery Details */
          <div className="p-6 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 overflow-y-auto">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-lg ring-8 ring-emerald-50/70 animate-in zoom-in-75">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Payment Successful & Order Confirmed!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Transaction ID: <span className="font-bold text-slate-800 tabular-nums">#{orderId}</span>
              </p>
            </div>

            {/* Live Delivery Activated Card */}
            {completedShipment && (
              <div className="w-full max-w-lg p-5 rounded-2xl bg-[#003d29]/5 border border-[#003d29]/20 text-left space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-[#003d29]/10">
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-5 h-5 text-[#003d29]" />
                    <span className="font-extrabold text-sm text-[#003d29]">
                      {completedShipment.courier_name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800">
                    {completedShipment.tracking_number}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[11px] text-slate-400">Estimated Arrival</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {completedShipment.estimated_arrival}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Current Status</div>
                    <div className="font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Live in Transit</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#003d29] shrink-0" />
                  <span>Destination: {completedShipment.delivery_address}</span>
                </div>
              </div>
            )}

            {/* Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full max-w-md">
              <button
                onClick={() => {
                  onClose();
                  if (completedShipment) {
                    onOrderSuccess(orderId, completedShipment, true);
                  }
                }}
                className="flex-1 py-3.5 px-6 rounded-full font-bold text-xs sm:text-sm text-white bg-[#003d29] hover:bg-[#064e3b] shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Track Live Delivery Now</span>
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-3.5 px-6 rounded-full font-bold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Review Item, Step 1 (Delivery) OR Step 2 (Payment) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Validation Alert Message */}
              {validationError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2.5 animate-in shake">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Items Summary Preview (Collapsible / Compact) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Selected Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                  <span className="text-slate-500 font-normal">Subtotal: ${subtotal.toFixed(2)}</span>
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center p-1 border border-slate-200 shrink-0">
                          <ProductVisual imageKey={item.product.image} name={item.product.name} size="sm" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 line-clamp-1">{item.product.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Qty: {item.quantity} {item.selectedColor ? `· Color: ${item.selectedColor}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="font-semibold text-slate-900 tabular-nums">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* STEP 1: Delivery Information & Courier (Wajib Diisi Sebelum Bayar) */}
              {/* ========================================================================= */}
              {step === 'delivery' ? (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span>1. Delivery Information</span>
                        <span className="text-xs font-normal text-rose-500">*Required</span>
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Please enter your shipping address details. Courier will deliver directly to this location.
                    </p>
                  </div>

                  {/* Address Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. John"
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:border-[#003d29] ${
                          attemptedStep1 && !firstName.trim() ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Doe"
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:border-[#003d29] ${
                          attemptedStep1 && !lastName.trim() ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Complete Street Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House / Apartment number, Street name"
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:border-[#003d29] ${
                          attemptedStep1 && !address.trim() ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        City / Town <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. New York / Jakarta"
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:border-[#003d29] ${
                          attemptedStep1 && !city.trim() ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Zip / Postal Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="e.g. 10001"
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:border-[#003d29] ${
                          attemptedStep1 && !zipCode.trim() ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Mobile Phone <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:border-[#003d29] ${
                          attemptedStep1 && !mobile.trim() ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:border-[#003d29] ${
                          attemptedStep1 && !email.trim() ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Courier Service Selection */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#003d29]" />
                      <span>Select Shipping Courier Service</span>
                    </h4>

                    <div className="space-y-2.5">
                      {COURIER_SERVICES.map((courier) => {
                        const isSelected = selectedCourierId === courier.id;
                        return (
                          <div
                            key={courier.id}
                            onClick={() => setSelectedCourierId(courier.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-[#003d29] bg-[#003d29]/5 shadow-xs ring-1 ring-[#003d29]'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="courier"
                                checked={isSelected}
                                onChange={() => setSelectedCourierId(courier.id)}
                                className="text-[#003d29] focus:ring-[#003d29]"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                                    {courier.name}
                                  </span>
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800">
                                    {courier.badge}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {courier.service} · <span className="font-semibold text-slate-700">{courier.eta}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-xs font-bold text-slate-900 shrink-0">
                              {courier.price === 0 ? 'Free' : `+$${courier.price.toFixed(2)}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Proceed to Payment CTA */}
                  <div className="pt-2">
                    <button
                      onClick={handleProceedToPayment}
                      className="w-full py-3.5 px-6 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] shadow-md shadow-emerald-950/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Proceed to Payment Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* ========================================================================= */
                /* STEP 2: Payment Details (Muncul Setelah Alat Pengiriman Terisi) */
                /* ========================================================================= */
                <div className="space-y-6 animate-in fade-in">
                  {/* Confirmed Delivery Summary Chip */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-extrabold text-[#003d29] uppercase tracking-wide flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Delivery Address & Courier Confirmed</span>
                      </div>
                      <div className="font-bold text-slate-900">
                        {firstName} {lastName} ({mobile})
                      </div>
                      <div className="text-slate-600">
                        {address}, {city}, {zipCode} · <span className="font-semibold text-[#003d29]">{selectedCourier.name}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setStep('delivery')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#003d29] bg-white border border-emerald-200 hover:bg-emerald-50 transition-colors shrink-0 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  {/* Payment Details Form */}
                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      2. Payment Method
                    </h3>

                    <div className="space-y-2 text-xs">
                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                          paymentMethod === 'credit'
                            ? 'border-[#003d29] bg-emerald-50/20'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'credit'}
                          onChange={() => setPaymentMethod('credit')}
                          className="text-[#003d29] focus:ring-[#003d29]"
                        />
                        <span className="font-bold text-slate-900">Credit or Debit Card</span>
                      </label>

                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                          paymentMethod === 'cod'
                            ? 'border-[#003d29] bg-emerald-50/20'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="text-[#003d29] focus:ring-[#003d29]"
                        />
                        <span className="font-semibold text-slate-800">Cash on Delivery (Pay upon arrival)</span>
                      </label>

                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                          paymentMethod === 'paypal'
                            ? 'border-[#003d29] bg-emerald-50/20'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'paypal'}
                          onChange={() => setPaymentMethod('paypal')}
                          className="text-[#003d29] focus:ring-[#003d29]"
                        />
                        <span className="font-semibold text-slate-800">PayPal Instant</span>
                      </label>

                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                          paymentMethod === 'shopcart'
                            ? 'border-[#003d29] bg-emerald-50/20'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'shopcart'}
                          onChange={() => setPaymentMethod('shopcart')}
                          className="text-[#003d29] focus:ring-[#003d29]"
                        />
                        <span className="font-semibold text-slate-800">Shopcart Store Card</span>
                      </label>
                    </div>

                    {/* Credit Card Details */}
                    {paymentMethod === 'credit' && (
                      <div className="p-4 rounded-2xl bg-[#fafafa] border border-slate-200/80 space-y-3 text-xs animate-in fade-in">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Card Holder Name*
                          </label>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#003d29]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Card Number*
                          </label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="3657 8943 0012 3410"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-[#003d29]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Expiry (MM/YY)*
                            </label>
                            <input
                              type="text"
                              value={expiry}
                              onChange={(e) => setExpiry(e.target.value)}
                              placeholder="MM/YY"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-[#003d29]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              CVC / CVV*
                            </label>
                            <input
                              type="text"
                              value={cvc}
                              onChange={(e) => setCvc(e.target.value)}
                              placeholder="000"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-[#003d29]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex gap-3">
                      <button
                        onClick={() => setStep('delivery')}
                        className="py-3 px-5 rounded-full font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>

                      <button
                        onClick={handleCompleteOrder}
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 px-6 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] shadow-md shadow-emerald-950/15 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Lock className="w-4 h-4" />
                        <span>{isSubmitting ? 'Confirming Order & Courier...' : `Complete Payment · $${total.toFixed(2)}`}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-[#fafafa] border border-slate-200/80 space-y-5">
                <h3 className="text-base font-bold text-slate-900">
                  Order Summary
                </h3>

                {/* Coupon Code Input */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon (e.g. SHOP50)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-[#003d29]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </form>

                {couponApplied && (
                  <div className="text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/70 flex items-center gap-1.5 font-medium">
                    <Tag className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Special 10% Shopcart coupon applied!</span>
                  </div>
                )}

                {/* Costs breakdown */}
                <div className="space-y-2.5 text-xs border-t border-slate-200 pt-4">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Estimated Tax (10%)</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      ${tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Coupon Discount</span>
                    <span className="font-semibold tabular-nums">
                      -${discountAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <span>Shipping ({selectedCourier.name})</span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      {shippingCost === 0 ? (
                        <span className="text-emerald-700 font-bold">Free</span>
                      ) : (
                        `$${shippingCost.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline text-sm font-extrabold text-slate-900">
                    <span>Total Amount</span>
                    <span className="text-xl text-[#003d29] tabular-nums">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Step indicator in right sidebar */}
                {step === 'delivery' ? (
                  <button
                    onClick={handleProceedToPayment}
                    className="w-full py-4 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] active:scale-[0.99] shadow-md shadow-emerald-950/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleCompleteOrder}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] active:scale-[0.99] shadow-md shadow-emerald-950/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isSubmitting ? 'Processing Payment...' : `Pay $${total.toFixed(2)}`}</span>
                  </button>
                )}

                {/* Cashback banner */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f0fdf4] border border-emerald-100 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-[#003d29] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    5%
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Earn 5% cash back on Shopcart</div>
                    <div className="text-[11px] text-slate-500">Live GPS tracking automatically included</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
