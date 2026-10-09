import React, { useState, useRef, useEffect } from 'react';
import { Phone, MapPin, Sparkles, Globe, ChevronDown, Check } from 'lucide-react';
import { Language } from '../i18n/translations';

interface TopBarProps {
  onShopNow?: () => void;
  currentLang?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onShopNow,
  currentLang = 'id',
  onLanguageChange,
}) => {
  const [internalLang, setInternalLang] = useState<Language>(currentLang);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const activeLang = onLanguageChange ? currentLang : internalLang;

  const handleSelectLang = (lang: Language) => {
    if (onLanguageChange) {
      onLanguageChange(lang);
    } else {
      setInternalLang(lang);
    }
    setIsLangOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="bg-[#003d29] text-white text-xs font-normal py-2 px-4 sm:px-8 border-b border-emerald-950/20 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Contact */}
        <div className="flex items-center gap-2 text-emerald-100/90 font-medium">
          <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          <span className="truncate">Layanan Pelanggan: 0800-1-PASARIA (Bebas Pulsa)</span>
        </div>

        {/* Center: Promo Offer */}
        <div className="hidden sm:flex items-center gap-2 text-emerald-100">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>Promo Spesial: Diskon Hingga 50% & Gratis Ongkir Se-Indonesia</span>
          <span className="text-emerald-400/60 font-light">|</span>
          <button
            type="button"
            onClick={onShopNow}
            className="motion-press font-semibold text-white hover:text-emerald-300 transition-colors underline underline-offset-4 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-300 rounded"
          >
            Belanja Sekarang
          </button>
        </div>

        {/* Right: Location & Guarantee & Language Selector */}
        <div className="flex items-center gap-3 sm:gap-4 text-emerald-100/90">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="hidden xs:inline">Indonesia (IDR / Rp)</span>
          </div>

          <span className="text-emerald-400/50 hidden md:inline">|</span>

          {/* Point #9: TopBar language switcher popover micro-fade */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setIsLangOpen(!isLangOpen)}
              aria-haspopup="true"
              aria-expanded={isLangOpen}
              aria-label="Pilih Bahasa / Language Selector"
              className="motion-press flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-emerald-900/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-300"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="font-bold uppercase tracking-wider text-[11px]">
                {activeLang}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-emerald-300 transition-transform duration-160 ease-[var(--ease-out)] ${
                  isLangOpen ? 'rotate-180' : 'rotate-0'
                }`}
              />
            </button>

            {isLangOpen && (
              <div
                role="menu"
                aria-label="Pilihan Bahasa"
                className="motion-popover absolute right-0 mt-1.5 w-38 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-left"
                style={{ transformOrigin: 'top right' }}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelectLang('id')}
                  className={`motion-press w-full min-h-[36px] flex items-center justify-between px-3 py-1.5 text-xs transition-colors hover:bg-slate-50 cursor-pointer ${
                    activeLang === 'id'
                      ? 'font-bold text-[#003d29] bg-emerald-50/60'
                      : 'text-slate-700'
                  }`}
                >
                  <span>Bahasa Indonesia</span>
                  {activeLang === 'id' && <Check className="w-3.5 h-3.5 text-[#003d29]" />}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelectLang('en')}
                  className={`motion-press w-full min-h-[36px] flex items-center justify-between px-3 py-1.5 text-xs transition-colors hover:bg-slate-50 cursor-pointer ${
                    activeLang === 'en'
                      ? 'font-bold text-[#003d29] bg-emerald-50/60'
                      : 'text-slate-700'
                  }`}
                >
                  <span>English</span>
                  {activeLang === 'en' && <Check className="w-3.5 h-3.5 text-[#003d29]" />}
                </button>
              </div>
            )}
          </div>

          <span className="text-emerald-400/50 hidden md:inline">|</span>
          <span className="hidden md:inline text-emerald-200">100% Original & Bergaransi</span>
        </div>
      </div>
    </div>
  );
};
