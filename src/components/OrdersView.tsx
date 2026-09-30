import React from 'react';
import { Package, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { Order } from '../types';
import { ProductVisual } from './ProductVisual';

interface OrdersViewProps {
  orders: Order[];
  onNavigateHome: () => void;
  onSelectProductBySlug: (slug: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onNavigateHome,
  onSelectProductBySlug,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 text-left">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Orders
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track and view your recent purchases and receipts.
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="text-xs font-semibold text-[#003d29] hover:underline"
        >
          Return to Store
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No orders yet</h3>
          <p className="text-xs text-slate-500 mb-6">You haven't placed any orders yet.</p>
          <button
            onClick={onNavigateHome}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#003d29] hover:bg-[#064e3b] transition-all cursor-pointer"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400">Order ID: </span>
                  <span className="font-bold text-slate-900 tabular-nums">#{order.order_number}</span>
                </div>
                <div className="text-slate-400">
                  {new Date(order.created_at || Date.now()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{order.status || 'Delivered'}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#f8f9fa] flex items-center justify-center p-1 border border-slate-100 shrink-0">
                        <ProductVisual imageKey={item.image || 'airpods-max'} name={item.name} size="sm" />
                      </div>
                      <div>
                        <div
                          onClick={() => item.slug && onSelectProductBySlug(item.slug)}
                          className="font-bold text-slate-900 hover:text-[#003d29] cursor-pointer"
                        >
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Qty: {item.quantity} {item.color ? `· Color: ${item.color}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold text-slate-900 tabular-nums">
                      ${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                <div className="text-slate-500">
                  Paid via <span className="font-medium text-slate-700">{order.payment_method}</span>
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  Total: <span className="text-[#003d29] tabular-nums">${(Number(order.total) || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
