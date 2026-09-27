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
  Tag
} from 'lucide-react';
import { CartItem, User } from '../types';
import { ProductVisual } from './ProductVisual';

interface CheckoutModalProps {
  items: CartItem[];
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderNumber: string) => void;
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
  const [firstName, setFirstName] = useState(user?.name ? user.name.split(' ')[0] : 'Wade');
  const [lastName, setLastName] = useState(user?.name && user.name.split(' ').length > 1 ? user.name.split(' ')[1] : 'Warren');
  const [address, setAddress] = useState(user?.address || '4140 Parker Rd.');
  const [city, setCity] = useState(user?.city || 'Allentown');
  const [zipCode, setZipCode] = useState(user?.zip || '31134');
  const [mobile, setMobile] = useState(user?.phone || '+001234567890');
  const [email, setEmail] = useState(user?.email || 'customer@shopcart.com');

  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'cod' | 'paypal' | 'shopcart'>('credit');
  const [cardHolder, setCardHolder] = useState('Wade Warren');
  const [cardNumber, setCardNumber] = useState('3657 8943 0012 3410');
  const [expiry, setExpiry] = useState('08/29');
  const [cvc, setCvc] = useState('784');

  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10); // 10% demo discount as in screenshot ($54.90)
  const [couponApplied, setCouponApplied] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('9945284820');

  if (!isOpen) return null;

  const tax = subtotal * 0.1;
  const discountAmount = couponApplied ? subtotal * (discountPercent / 100) : 0;
  const shippingCost = 0;
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

  const handleCompleteOrder = async () => {
    setIsSubmitting(true);
    const newTransactionId = String(Math.floor(1000000000 + Math.random() * 9000000000));
    setOrderId(newTransactionId);

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
          items: items.map((i) => ({
            id: i.product.id,
            name: i.product.name,
            slug: i.product.slug,
            price: i.product.price,
            quantity: i.quantity,
            color: i.selectedColor || 'Standard',
            image: i.product.image
          }))
        })
      });
    } catch (e) {
      console.error(e);
    }

    setIsSubmitting(false);
    setOrderComplete(true);

    // Fire celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (_) {}

    onOrderSuccess(newTransactionId);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-slate-100 max-h-[92vh] flex flex-col text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-slate-100 bg-[#fbfbfb]">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>Home</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">Checkout</span>
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
          // Order Accepted State (matching video 0:24-0:25)
          <div className="p-8 sm:p-16 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-lg ring-8 ring-emerald-50/60 animate-in zoom-in-75">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Your order has been accepted
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Transaction ID: <span className="font-bold text-slate-800 tabular-nums">{orderId}</span>
              </p>
            </div>

            <p className="text-xs text-slate-400 max-w-sm">
              We've sent an order confirmation and delivery status tracking link to your email.
            </p>

            <button
              onClick={onClose}
              className="px-8 py-3.5 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] shadow-md transition-all cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="p-6 sm:p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Review Item, Shipping & Payment Form */}
            <div className="lg:col-span-7 space-y-8">
              {/* Review Item & Shipping */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4">
                  Review Item And Shipping
                </h3>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center p-1 border border-slate-100 shrink-0">
                          <ProductVisual imageKey={item.product.image} name={item.product.name} size="sm" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900">
                            {item.product.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Color: <span className="font-semibold text-slate-700">{item.selectedColor || 'Default'}</span>
                            <span className="mx-2">·</span>
                            Quantity: <span className="font-semibold text-slate-700">{item.quantity}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-slate-900 tabular-nums">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Information Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Delivery Information
                  </h3>
                  <button className="text-xs font-semibold text-[#003d29] hover:underline cursor-pointer">
                    Save Information
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      First Name*
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Last Name*
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Address*
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      City/ Town*
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Zip Code*
                    </label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Mobile*
                    </label>
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Email*
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4 pt-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Payment Details
                </h3>

                {/* Radio list */}
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="text-[#003d29] focus:ring-[#003d29]"
                    />
                    <span className="font-semibold text-slate-800">Cash on Delivery</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'shopcart'}
                      onChange={() => setPaymentMethod('shopcart')}
                      className="text-[#003d29] focus:ring-[#003d29]"
                    />
                    <span className="font-semibold text-slate-800">Shopcart Card</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                      className="text-[#003d29] focus:ring-[#003d29]"
                    />
                    <span className="font-semibold text-slate-800">Paypal</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#003d29] bg-emerald-50/20 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'credit'}
                      onChange={() => setPaymentMethod('credit')}
                      className="text-[#003d29] focus:ring-[#003d29]"
                    />
                    <span className="font-bold text-slate-900">Credit or Debit card</span>
                  </label>
                </div>

                {/* Card Fields Form */}
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
                        placeholder="e.g. Wade Warren"
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
                          CVC*
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
              </div>
            </div>

            {/* Right Column: Order Summary & Pay CTA */}
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
                    placeholder="Enter Coupon Code"
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
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Special 10% Shopcart discount applied!</span>
                  </div>
                )}

                {/* Costs breakdown */}
                <div className="space-y-2.5 text-xs border-t border-slate-200 pt-4">
                  <div className="flex justify-between text-slate-600">
                    <span>Sub Total</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax (10%)</span>
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
                    <span>Shipping Cost</span>
                    <span className="font-semibold text-emerald-600">Free</span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline text-sm font-extrabold text-slate-900">
                    <span>Total</span>
                    <span className="text-xl text-[#003d29] tabular-nums">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handleCompleteOrder}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] active:scale-[0.99] shadow-md shadow-emerald-950/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmitting ? 'Processing Payment...' : `Pay $${total.toFixed(2)}`}</span>
                </button>

                {/* Cashback banner */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f0fdf4] border border-emerald-100 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-[#003d29] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    5%
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Earn 5% cash back on Shopcart</div>
                    <div className="text-[11px] text-slate-500">Learn Store Perks</div>
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
