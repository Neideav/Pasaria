import { Language } from '../i18n/translations';
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import heroImg1 from '../assets/images/hero_headphone_lifestyle_1790485238666.jpg';
import heroImg2 from '../assets/images/service_home_delivery_1790485280855.jpg';
import heroImg3 from '../assets/images/service_online_payment_1790485268106.jpg';

interface HeroBannerProps {
  lang?: Language;
  onBuyNow: (categoryOrSlug?: string) => void;
  onContactUs?: () => void;
}

interface BannerSlide {
  badge: string;
  title: string;
  description: string;
  ctaText: string;
  image: string;
  imageAlt: string;
  bgColor: string;
  auraGradient: string;
  badgeBg: string;
  badgeText: string;
}

const SLIDES: BannerSlide[] = [
  {
    badge: '✨ Pasar Modern Terpercaya',
    title: 'PASARIA — Belanja Hemat, Praktis & Aman Setiap Hari',
    description: 'Temukan ribuan produk pilihan dari seller resmi terverifikasi se-Indonesia. Jaminan original, garansi pengembalian, dan pengiriman super cepat.',
    ctaText: 'Mulai Belanja',
    image: heroImg1,
    imageAlt: 'Pengalaman berbelanja modern di PASARIA',
    bgColor: 'bg-[#fcf0e4]',
    auraGradient: 'from-[#fae7d4]',
    badgeBg: 'bg-emerald-100/80',
    badgeText: 'text-[#003d29]',
  },
  {
    badge: '🚀 Bebas Ongkir Se-Nusantara',
    title: 'Pengiriman Cepat & Terlindungi ke Pintu Rumah Anda',
    description: 'Nikmati kurir prioritas PASARIA Express dengan pelacakan posisi paket secara transparan dan jaminan kompensasi tepat waktu.',
    ctaText: 'Lihat Promo Ongkir',
    image: heroImg2,
    imageAlt: 'Layanan kurir pengiriman cepat PASARIA',
    bgColor: 'bg-[#e8f5e9]',
    auraGradient: 'from-[#c8e6c9]',
    badgeBg: 'bg-emerald-200/80',
    badgeText: 'text-emerald-950',
  },
  {
    badge: '🛡️ Transaksi Dijamin 100% Aman',
    title: 'Pembayaran Rekening Escrow Terproteksi Penuh',
    description: 'Belanja tenang tanpa rasa cemas melalui QRIS instan, Virtual Account semua bank utama, hingga kemudahan Cash on Delivery (COD).',
    ctaText: 'Eksplor Penawaran',
    image: heroImg3,
    imageAlt: 'Sistem pembayaran aman dan terverifikasi PASARIA',
    bgColor: 'bg-[#e8f0fe]',
    auraGradient: 'from-[#d2e3fc]',
    badgeBg: 'bg-blue-100/80',
    badgeText: 'text-blue-900',
  },
];

export const HeroBanner: React.FC<HeroBannerProps> = ({ lang = "id", onBuyNow, onContactUs }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Auto-advance slide every 5.5s when not paused/hovered
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
    }, 5500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Promosi Unggulan PASARIA"
    >
      <div
        className="relative overflow-hidden rounded-3xl min-h-[300px] sm:min-h-[380px] lg:min-h-[420px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Motion Point #40: Carousel track GPU translateX on iOS spring curve (300ms var(--ease-drawer)) */}
        <div
          className="flex w-full transition-transform duration-300 ease-[var(--ease-drawer)] will-change-transform"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {SLIDES.map((slide, index) => (
            <div
              key={index}
              className={`w-full shrink-0 relative flex items-center ${slide.bgColor}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} dari ${SLIDES.length}: ${slide.title}`}
              aria-hidden={currentSlide !== index}
            >
              {/* Decorative background aura */}
              <div
                className={`absolute right-0 top-0 bottom-0 w-2/3 bg-gradient-to-l ${slide.auraGradient} to-transparent pointer-events-none`}
              />

              <div className="w-full grid grid-cols-1 md:grid-cols-12 items-center gap-6 z-10 px-6 sm:px-12 lg:px-16 py-8 sm:py-12">
                {/* Left Column: Headline & CTA */}
                <div className="md:col-span-7 lg:col-span-6 space-y-5 sm:space-y-6 text-left">
                  <div
                    className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full ${slide.badgeBg} ${slide.badgeText} text-xs font-extrabold uppercase tracking-wider shadow-2xs`}
                  >
                    <span>{slide.badge}</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#003d29] tracking-tight leading-[1.18] text-balance">
                    {slide.title}
                  </h1>

                  <p className="text-xs sm:text-sm lg:text-base text-stone-600 font-normal max-w-md leading-relaxed">
                    {slide.description}
                  </p>

                  <div className="pt-2 flex items-center gap-3">
                    {/* Motion Point #41: HeroBanner CTA Button Hover Lift & Tactile Press */}
                    <button
                      type="button"
                      onClick={() => onBuyNow()}
                      className="motion-press inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-3.5 text-sm sm:text-base font-bold text-white bg-[#003d29] hover:bg-[#064e3b] hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97] rounded-full shadow-md shadow-emerald-950/15 transition-[transform,box-shadow,background-color] duration-160 ease-[var(--ease-out)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2"
                    >
                      <span>{slide.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right Column: Hero Image */}
                <div className="md:col-span-5 lg:col-span-6 flex justify-center md:justify-end relative">
                  <div className="relative w-full max-w-[420px] aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border-4 border-white/70 bg-white/40">
                    <img
                      src={slide.image}
                      alt={slide.imageAlt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center transform transition-transform duration-700 hover:scale-105"
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Motion Point #44: HeroBanner Arrow Nav Button Hover Glow & Tactile Press */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Slide sebelumnya"
          className="motion-press absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 backdrop-blur-xs hover:bg-white text-slate-700 hover:text-slate-900 shadow-md hover:scale-105 active:scale-95 transition-[transform,background-color,color] duration-160 ease-[var(--ease-out)] flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Slide berikutnya"
          className="motion-press absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 backdrop-blur-xs hover:bg-white text-slate-700 hover:text-slate-900 shadow-md hover:scale-105 active:scale-95 transition-[transform,background-color,color] duration-160 ease-[var(--ease-out)] flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29]"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Motion Point #40: Dot Indicator Morph (w-3 -> w-8 rounded-full transition-[width,background-color] duration-250 ease-[var(--ease-out)]) */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/60 backdrop-blur-xs px-3 py-1.5 rounded-full shadow-2xs border border-white/40"
          role="tablist"
          aria-label="Pilih Slide"
        >
          {SLIDES.map((_, index) => {
            const isActive = currentSlide === index;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentSlide(index)}
                role="tab"
                aria-selected={isActive}
                aria-label={`Buka slide ${index + 1}`}
                className={`h-3 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] transition-[width,background-color] duration-250 ease-[var(--ease-out)] ${
                  isActive
                    ? 'w-8 bg-[#003d29]'
                    : 'w-3 bg-stone-300 hover:bg-stone-400'
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};
