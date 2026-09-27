import React from 'react';
import heroImg from '../assets/images/hero_headphone_lifestyle_1790485238666.jpg';

interface HeroBannerProps {
  onBuyNow: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onBuyNow }) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-8">
      <div className="relative overflow-hidden rounded-3xl bg-[#fcf0e4] min-h-[300px] sm:min-h-[380px] lg:min-h-[420px] flex items-center">
        {/* Decorative background aura */}
        <div className="absolute right-0 top-0 bottom-0 w-2/3 bg-gradient-to-l from-[#fae7d4] to-transparent pointer-events-none" />

        <div className="w-full grid grid-cols-1 md:grid-cols-12 items-center gap-6 z-10 px-6 sm:px-12 lg:px-16 py-8">
          {/* Left Column: Headline & CTA */}
          <div className="md:col-span-7 lg:col-span-6 space-y-6 text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#003d29] tracking-tight leading-[1.15] text-balance">
              Grab Upto 50% Off On Selected Headphone
            </h1>
            <p className="text-sm sm:text-base text-stone-600 font-normal max-w-md">
              Immerse yourself in world-class acoustic engineering with industry-leading noise cancellation and spatial fidelity.
            </p>
            <div className="pt-2">
              <button
                onClick={onBuyNow}
                className="inline-flex items-center justify-center px-8 py-3.5 text-sm sm:text-base font-semibold text-white bg-[#003d29] hover:bg-[#064e3b] active:scale-[0.98] rounded-full shadow-md shadow-emerald-950/10 transition-all cursor-pointer"
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* Right Column: Hero Image */}
          <div className="md:col-span-5 lg:col-span-6 flex justify-center md:justify-end relative">
            <div className="relative w-full max-w-[420px] aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border-4 border-white/60">
              <img
                src={heroImg}
                alt="Woman enjoying premium sound with over-ear wireless headphones"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
