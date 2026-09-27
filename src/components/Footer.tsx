import React from 'react';
import { ShoppingCart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-100 mt-20 pt-16 pb-12 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#003d29] flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-[#003d29]" strokeWidth={2.2} />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#003d29]">
                Shopcart
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm font-normal leading-relaxed">
              Shopcart is your modern destination for premium audio gear, everyday essentials, and tech accessories designed for effortless living.
            </p>
          </div>

          {/* Column 1: Shop */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#headphones" className="hover:text-[#003d29] transition-colors">Headphones</a></li>
              <li><a href="#speakers" className="hover:text-[#003d29] transition-colors">Speakers</a></li>
              <li><a href="#accessories" className="hover:text-[#003d29] transition-colors">Accessories</a></li>
              <li><a href="#deals" className="hover:text-[#003d29] transition-colors">Special Offers</a></li>
            </ul>
          </div>

          {/* Column 2: Customer Service */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Customer Service</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#contact" className="hover:text-[#003d29] transition-colors">Contact Us</a></li>
              <li><a href="#orders" className="hover:text-[#003d29] transition-colors">Track Order</a></li>
              <li><a href="#returns" className="hover:text-[#003d29] transition-colors">Returns & Refunds</a></li>
              <li><a href="#faq" className="hover:text-[#003d29] transition-colors">Shipping Information</a></li>
            </ul>
          </div>

          {/* Column 3: About & Help */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">About</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#about" className="hover:text-[#003d29] transition-colors">Our Company</a></li>
              <li><a href="#privacy" className="hover:text-[#003d29] transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-[#003d29] transition-colors">Terms of Service</a></li>
              <li><a href="#security" className="hover:text-[#003d29] transition-colors">Trust & Safety</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Shopcart. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-slate-600 transition-colors">Privacy</a>
            <a href="#terms" className="hover:text-slate-600 transition-colors">Terms</a>
            <a href="#security" className="hover:text-slate-600 transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
