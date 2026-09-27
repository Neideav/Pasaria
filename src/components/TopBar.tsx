import React, { useState } from 'react';
import { Phone, ChevronDown, MapPin, Globe } from 'lucide-react';

interface TopBarProps {
  onShopNow?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onShopNow }) => {
  const [lang, setLang] = useState('Eng');
  const [location, setLocation] = useState('Location');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showLocMenu, setShowLocMenu] = useState(false);

  return (
    <div className="bg-[#003d29] text-white text-xs font-normal py-2 px-4 sm:px-8 border-b border-emerald-950/20 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Phone */}
        <div className="flex items-center gap-2 text-emerald-100/90 font-medium">
          <Phone className="w-3.5 h-3.5 text-emerald-300" />
          <span>+001234567890</span>
        </div>

        {/* Center: Promo Offer */}
        <div className="hidden sm:flex items-center gap-2 text-emerald-100">
          <span>Get 50% Off on Selected Items</span>
          <span className="text-emerald-400/60 font-light">|</span>
          <button
            onClick={onShopNow}
            className="font-semibold text-white hover:text-emerald-300 transition-colors underline underline-offset-4 cursor-pointer"
          >
            Shop Now
          </button>
        </div>

        {/* Right: Language & Location */}
        <div className="flex items-center gap-5 text-emerald-100/90">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowLocMenu(false);
              }}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 opacity-80" />
              <span>{lang}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-24 bg-white text-slate-800 rounded-lg shadow-lg py-1 z-50 text-xs border border-slate-100">
                {['Eng', 'ID', 'ES', 'FR'].map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLang(l);
                      setShowLangMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors"
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLocMenu(!showLocMenu);
                setShowLangMenu(false);
              }}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 opacity-80" />
              <span>{location}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {showLocMenu && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white text-slate-800 rounded-lg shadow-lg py-1 z-50 text-xs border border-slate-100">
                {['New York, USA', 'California, USA', 'Jakarta, ID', 'London, UK'].map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setLocation(loc.split(',')[0]);
                      setShowLocMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors truncate"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
