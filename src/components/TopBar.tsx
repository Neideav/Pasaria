import React from 'react';
import { Phone, MapPin, Sparkles } from 'lucide-react';

interface TopBarProps {
  onShopNow?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onShopNow }) => {
  return (
    <div className="bg-[#003d29] text-white text-xs font-normal py-2 px-4 sm:px-8 border-b border-emerald-950/20 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Contact */}
        <div className="flex items-center gap-2 text-emerald-100/90 font-medium">
          <Phone className="w-3.5 h-3.5 text-emerald-300" />
          <span>Layanan Pelanggan: 0800-1-PASARIA (Bebas Pulsa)</span>
        </div>

        {/* Center: Promo Offer */}
        <div className="hidden sm:flex items-center gap-2 text-emerald-100">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Promo Spesial: Diskon Hingga 50% & Gratis Ongkir Se-Indonesia</span>
          <span className="text-emerald-400/60 font-light">|</span>
          <button
            onClick={onShopNow}
            className="font-semibold text-white hover:text-emerald-300 transition-colors underline underline-offset-4 cursor-pointer"
          >
            Belanja Sekarang
          </button>
        </div>

        {/* Right: Location & Guarantee */}
        <div className="flex items-center gap-4 text-emerald-100/90">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-300" />
            <span>Indonesia (IDR / Rp)</span>
          </div>
          <span className="text-emerald-400/50 hidden md:inline">|</span>
          <span className="hidden md:inline text-emerald-200">100% Original & Bergaransi</span>
        </div>
      </div>
    </div>
  );
};
