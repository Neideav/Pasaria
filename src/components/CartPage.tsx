import React from 'react';
import { Minus, Plus, Trash2, ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';
import { ProductVisual } from './ProductVisual';

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
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
        <p className="text-sm text-slate-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <button
          onClick={onContinueShopping}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-left">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Shopping Cart ({items.reduce((s, i) => s + i.quantity, 0)} items)
        </h1>
        <button
          onClick={onContinueShopping}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#003d29] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.product.id}-${item.selectedColor}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-[#f8f9fa] flex items-center justify-center p-2 shrink-0">
                  <ProductVisual imageKey={item.product.image} name={item.product.name} size="sm" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
                    {item.product.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-1">
                    {item.product.category} {item.selectedColor ? `· Color: ${item.selectedColor}` : ''}
                  </p>
                  <div className="text-sm font-bold text-slate-900 tabular-nums">
                    ${item.product.price.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Quantity Stepper & Remove */}
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="flex items-center bg-slate-100/90 rounded-full px-3 py-1 border border-slate-200/60">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-bold text-slate-900 tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-sm font-bold text-slate-900 tabular-nums min-w-[70px] text-right">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </div>

                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="w-8 h-8 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Summary Card */}
        <div className="lg:col-span-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (10%)</span>
                <span className="font-semibold text-slate-900 tabular-nums">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-emerald-600">Free</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline text-sm font-bold text-slate-900">
                <span>Total</span>
                <span className="text-xl font-extrabold text-[#003d29] tabular-nums">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full py-3.5 px-6 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] shadow-md shadow-emerald-950/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
