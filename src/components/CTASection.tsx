import React from 'react';
import deliveryBanner from '../assets/images/service_home_delivery_1790485280855.jpg';
import { Language } from '../i18n/translations';

interface CTASectionProps {
  lang?: Language;
}

export const CTASection: React.FC<CTASectionProps> = ({ lang = 'id' }) => {
  const isId = lang === 'id';

  const handleDownloadClick = (platform: 'ios' | 'android') => {
    alert(
      isId
        ? `Aplikasi PASARIA untuk ${platform === 'ios' ? 'iOS (App Store)' : 'Android (Google Play)'} segera hadir!`
        : `PASARIA App for ${platform === 'ios' ? 'iOS (App Store)' : 'Android (Google Play)'} is coming soon!`
    );
  };

  return (
    <section className="relative w-full overflow-hidden select-none bg-slate-950">
      {/* Fixed Parallax Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url(${deliveryBanner})`,
          backgroundAttachment: 'fixed',
        }}
      />

      {/* Cinematic Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/80 pointer-events-none" />

      {/* Foreground Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-16 sm:py-24 md:py-28 text-center flex flex-col items-center justify-center">
        {/* Main Headline */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4 drop-shadow-md">
          {isId
            ? 'Nikmati Pengalaman Belanja Lebih Praktis di Aplikasi PASARIA'
            : 'Experience Seamless Shopping Anywhere with the PASARIA App'}
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm md:text-base text-slate-200 max-w-2xl font-normal leading-relaxed mb-8 drop-shadow">
          {isId
            ? 'Dapatkan gratis ongkir tanpa batas, promo kilat eksklusif, dan kemudahan lacak paket langsung dari ponsel Anda.'
            : 'Enjoy unlimited free delivery, exclusive flash deals, and live order tracking right from your pocket.'}
        </p>

        {/* App Store & Google Play Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
          {/* Apple App Store Badge */}
          <button
            type="button"
            onClick={() => handleDownloadClick('ios')}
            className="inline-flex items-center gap-3 px-4 sm:px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 transition-all cursor-pointer shadow-lg hover:shadow-xl active:scale-95 border border-white"
          >
            <svg className="w-6 h-6 fill-current text-black shrink-0" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.08.64-2.73 1.39-.57.65-1.07 1.71-.94 2.74 1.05.08 2.06-.52 2.66-1.26z" />
            </svg>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[9px] sm:text-[10px] font-semibold text-slate-600 uppercase tracking-tight">
                Download on the
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-950 mt-0.5 tracking-tight">
                App Store
              </span>
            </div>
          </button>

          {/* Google Play Store Badge */}
          <button
            type="button"
            onClick={() => handleDownloadClick('android')}
            className="inline-flex items-center gap-3 px-4 sm:px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 transition-all cursor-pointer shadow-lg hover:shadow-xl active:scale-95 border border-white"
          >
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M3.6 1.8L13.8 12 3.6 22.2c-.3-.3-.6-.8-.6-1.4V3.2c0-.6.3-1.1.6-1.4z" />
              <path fill="#FBBC05" d="M17.3 8.5L13.8 12l3.5 3.5 4.1-2.4c1.2-.7 1.2-1.9 0-2.6l-4.1-2z" />
              <path fill="#EA4335" d="M3.6 1.8l10.2 10.2 3.5-3.5-11.4-6.6c-.8-.5-1.7-.4-2.3-.1z" />
              <path fill="#34A853" d="M3.6 22.2l13.7-7.9-3.5-3.5-10.2 10.2c.6.3 1.5.4 2.3-.1z" />
            </svg>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[9px] sm:text-[10px] font-semibold text-slate-600 uppercase tracking-tight">
                GET IT ON
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-950 mt-0.5 tracking-tight">
                Google Play
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
