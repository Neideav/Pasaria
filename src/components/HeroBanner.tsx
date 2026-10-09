import React, { useState, useEffect } from 'react';
import { ShieldCheck, Tag, Users, ArrowRight } from 'lucide-react';
import { Language } from '../i18n/translations';
import heroHeadphones from '../assets/images/hero_headphones_lifestyle.jpg';
import heroFurniture from '../assets/images/hero_furniture_living.jpg';
import heroSneakersFashion from '../assets/images/hero_sneakers_fashion.jpg';
import heroLifestyle from '../assets/images/hero_lifestyle_panoramic.jpg';

interface HeroBannerProps {
  lang?: Language;
  onBuyNow?: (categoryOrSlug?: string) => void;
  onContactUs?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ lang = 'id', onBuyNow }) => {
  const isId = lang === 'id';
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: isId ? 'Tingkatkan Kualitas Hidup Anda' : 'Elevate Your Everyday',
      subtitle: isId
        ? 'Temukan berbagai produk pilihan original dan terkurasi di seluruh kategori untuk kebutuhan gaya hidup Anda.'
        : 'Discover quality products across every category — made for the way you live.',
      ctaText: isId ? 'Belanja Sekarang' : 'Shop Now',
      category: 'all',
      badgeTag: isId ? 'PROMO SPESIAL' : 'SUMMER SALE',
      badgeDiscount: '40%',
      image: heroLifestyle,
      leftImage: heroHeadphones,
      leftCategory: 'headphones',
      rightImage: heroSneakersFashion,
      rightCategory: 'shoes',
      alt: 'Koleksi produk gaya hidup terkurasi',
      bgTone: 'bg-[#eef3eb]',
    },
    {
      id: 2,
      title: isId ? 'Audio Fidelitas Tinggi' : 'Pure Acoustic Freedom',
      subtitle: isId
        ? 'Dengarkan setiap detail nada dengan kejernihan suara tanpa kompromi dan active noise cancellation.'
        : 'Experience studio-grade sound, deep bass, and active noise cancellation designed for pure immersion.',
      ctaText: isId ? 'Jelajahi Audio' : 'Explore Audio',
      category: 'headphones',
      badgeTag: isId ? 'AUDIO FEST' : 'AUDIO DEALS',
      badgeDiscount: '25%',
      image: heroHeadphones,
      leftImage: heroFurniture,
      leftCategory: 'furniture',
      rightImage: heroSneakersFashion,
      rightCategory: 'shoes',
      alt: 'Headphone premium nirkabel',
      bgTone: 'bg-[#faf4ea]',
    },
    {
      id: 3,
      title: isId ? 'Harmoni Ruang & Hunian' : 'Modern Living Spaces',
      subtitle: isId
        ? 'Sentuhan dekorasi minimalis dan perabot Skandinavia untuk kenyamanan rumah impian Anda.'
        : 'Comfortable Scandinavian furniture and soothing modern decor crafted for every room.',
      ctaText: isId ? 'Lihat Dekorasi' : 'Shop Decor',
      category: 'furniture',
      badgeTag: isId ? 'HOME LIVING' : 'HOME SALE',
      badgeDiscount: '30%',
      image: heroFurniture,
      leftImage: heroLifestyle,
      leftCategory: 'all',
      rightImage: heroHeadphones,
      rightCategory: 'headphones',
      alt: 'Perabot dekorasi rumah minimalis',
      bgTone: 'bg-[#eef5fa]',
    },
    {
      id: 4,
      title: isId ? 'Gaya Kasual & Streetwear' : 'Urban Streetwear Style',
      subtitle: isId
        ? 'Koleksi sepatu kasual, tas kanvas ramah lingkungan, dan apparel terkini dengan bahan premium.'
        : 'Premium sneakers, eco-friendly canvas tote bags, and everyday urban style essentials.',
      ctaText: isId ? 'Koleksi Fashion' : 'Shop Fashion',
      category: 'shoes',
      badgeTag: isId ? 'FASHION WEEK' : 'NEW ARRIVAL',
      badgeDiscount: '20%',
      image: heroSneakersFashion,
      leftImage: heroFurniture,
      leftCategory: 'furniture',
      rightImage: heroLifestyle,
      rightCategory: 'all',
      alt: 'Sepatu kasual dan tas kanvas modern',
      bgTone: 'bg-[#fbf2e9]',
    },
  ];

  // Auto-advance slides smoothly every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const current = slides[activeSlide];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6">
      {/* Panoramic Banner Card */}
      <div
        className={`w-full rounded-2xl border border-slate-200/90 ${current.bgTone} transition-colors duration-500 overflow-hidden relative min-h-[440px] sm:min-h-[480px] md:min-h-[500px] flex flex-col justify-between p-6 sm:p-8 md:p-10 lg:p-12`}
      >
        {/* Main Banner Content (Split 2-Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center z-10 my-auto">
          {/* Left Column: Typography, Subtitle & Action */}
          <div className="lg:col-span-7 flex flex-col items-start text-left max-w-xl pr-0 lg:pr-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold text-[#0d2a1f] tracking-tight leading-[1.12]">
              {current.title}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium leading-relaxed mt-3 sm:mt-4 mb-6 sm:mb-8 max-w-lg">
              {current.subtitle}
            </p>

            <button
              type="button"
              onClick={() => onBuyNow?.(current.category)}
              className="group inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#003d29] hover:bg-[#00261a] text-white text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
            >
              <span>{current.ctaText}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Right Column: 3-Card Overlapping Fan Layout */}
          <div className="lg:col-span-5 w-full flex items-center justify-center lg:justify-end relative mt-6 lg:mt-0 py-4 sm:py-6">
            <div className="relative flex items-center justify-center max-w-[440px] sm:max-w-[480px] w-full select-none">
              {/* Left Card - Tilted Left */}
              <div
                onClick={() => onBuyNow?.(current.leftCategory)}
                className="w-[115px] sm:w-[140px] md:w-[160px] lg:w-[170px] aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200/80 -rotate-6 -mr-9 sm:-mr-12 md:-mr-14 z-10 shrink-0 cursor-pointer transition-transform duration-300 hover:z-30 hover:scale-105 shadow-none"
              >
                <img
                  key={`left-${current.id}`}
                  src={current.leftImage}
                  alt="Complementary category"
                  className="w-full h-full object-cover transition-opacity duration-500"
                  loading="eager"
                />
              </div>

              {/* Center Card - Prominent Foreground */}
              <div
                onClick={() => onBuyNow?.(current.category)}
                className="w-[135px] sm:w-[165px] md:w-[185px] lg:w-[195px] aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200/80 z-20 shrink-0 cursor-pointer transition-transform duration-300 hover:scale-105 shadow-none"
              >
                <img
                  key={`center-${current.id}`}
                  src={current.image}
                  alt={current.alt}
                  className="w-full h-full object-cover transition-all duration-500 animate-in fade-in"
                  loading="eager"
                />
              </div>

              {/* Right Card - Tilted Right */}
              <div
                onClick={() => onBuyNow?.(current.rightCategory)}
                className="w-[115px] sm:w-[140px] md:w-[160px] lg:w-[170px] aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200/80 rotate-6 -ml-9 sm:-ml-12 md:-ml-14 z-10 shrink-0 cursor-pointer transition-transform duration-300 hover:z-30 hover:scale-105 shadow-none"
              >
                <img
                  key={`right-${current.id}`}
                  src={current.rightImage}
                  alt="Complementary category"
                  className="w-full h-full object-cover transition-opacity duration-500"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Trust Badges (Left) & Carousel Pagination Dots (Center/Right) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 sm:pt-8 border-t border-slate-900/10 z-10">
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-700 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#003d29] stroke-[2]" />
              <span>{isId ? 'Kualitas Terjamin' : 'Premium Quality'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#003d29] stroke-[2]" />
              <span>{isId ? 'Harga Terbaik' : 'Great Prices'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#003d29] stroke-[2]" />
              <span>{isId ? 'Dipercaya 10K+ Pembeli' : 'Trusted by 10K+ Customers'}</span>
            </div>
          </div>

          {/* Carousel Pagination Dots */}
          <div className="flex items-center justify-center sm:justify-end gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  activeSlide === idx
                    ? 'w-6 h-2 bg-[#003d29]'
                    : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};


