import React from 'react';
import { ShoppingCart, ShieldCheck, Heart, Store, Truck } from 'lucide-react';

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
                PASARIA
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm font-normal leading-relaxed">
              PASARIA adalah platform modern multi-vendor marketplace terpercaya di Indonesia. Menghubungkan pembeli, penjual resmi, dan UMKM dengan transaksi yang aman, transparan, dan terintegrasi.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                100% Proteksi Transaksi
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Truck className="w-4 h-4 text-[#003d29]" />
                Lacak Resi Real-Time
              </span>
            </div>
          </div>

          {/* Column 1: Marketplace */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Kategori</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><span className="hover:text-[#003d29] cursor-pointer">Elektronik & Gadget</span></li>
              <li><span className="hover:text-[#003d29] cursor-pointer">Audio & Headphone</span></li>
              <li><span className="hover:text-[#003d29] cursor-pointer">Pakaian & Sepatu</span></li>
              <li><span className="hover:text-[#003d29] cursor-pointer">Perlengkapan Rumah</span></li>
              <li><span className="hover:text-[#003d29] cursor-pointer">Promo Kilat & Flash Sale</span></li>
            </ul>
          </div>

          {/* Column 2: Layanan Pelanggan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Layanan Pelanggan</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><span className="hover:text-[#003d29] cursor-pointer">Pusat Bantuan</span></li>
              <li><span className="hover:text-[#003d29] cursor-pointer">Lacak Pengiriman</span></li>
              <li><span className="hover:text-[#003d29] cursor-pointer">Kebijakan Pengembalian</span></li>
              <li><span className="hover:text-[#003d29] cursor-pointer">Metode Pembayaran</span></li>
              <li><span className="hover:text-[#003d29] cursor-pointer">Hubungi Kami</span></li>
            </ul>
          </div>

          {/* Column 3: Seller & Bisnis */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Mitra & Seller</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><span className="hover:text-[#003d29] cursor-pointer">Daftar Seller Center</span></li>
              <li><span className="hover:text-[#003d29] cursor-pointer">Panduan Berjualan</span></li>
              <li><span className="hover:text-[#003d29] cursor-pointer">Official Store Program</span></li>
              <li><span className="hover:text-[#003d29] cursor-pointer">Syarat & Ketentuan Seller</span></li>
              <li><span className="hover:text-[#003d29] cursor-pointer">Kebijakan Privasi</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 PASARIA. Seluruh hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-600 cursor-pointer">Privasi</span>
            <span className="hover:text-slate-600 cursor-pointer">Syarat Penggunaan</span>
            <span className="hover:text-slate-600 cursor-pointer">Keamanan & Audit</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
