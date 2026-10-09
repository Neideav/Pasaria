import React from 'react';
import { Language } from '../i18n/translations';

interface TestimonialsSectionProps {
  lang?: Language;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ lang = 'id' }) => {
  const isId = lang === 'id';

  const topRow = [
    {
      id: 1,
      quote: isId
        ? 'Barang tiba dalam 1 hari dengan kemasan super aman. Kualitas 100% original!'
        : 'Arrived in 1 day with ultra-secure packaging. 100% genuine quality!',
      name: 'Jamie Lin',
      role: isId ? 'Fashion Stylist' : 'Fashion Stylist',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    },
    {
      id: 2,
      quote: isId
        ? 'Sistem multi-vendor PASARIA sangat praktis, beli dari banyak toko sekali checkout.'
        : 'Multi-vendor checkout is seamless. Bought from different shops in one go.',
      name: 'Finley Cruz',
      role: isId ? 'Creative Director' : 'Creative Director',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    },
    {
      id: 3,
      quote: isId
        ? 'Pelayanan official store sangat ramah dan antarmuka aplikasinya cepat.'
        : 'Official store support is top notch and the interface is lightning fast.',
      name: 'Taylor Smith',
      role: isId ? 'Audio Enthusiast' : 'Audio Enthusiast',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80',
    },
    {
      id: 4,
      quote: isId
        ? 'Garansi resmi terjamin dan nomor seri produk langsung terdaftar aman.'
        : 'Genuine warranty with authentic serial numbers registered instantly.',
      name: 'Aiden Vance',
      role: isId ? 'Tech Reviewer' : 'Tech Reviewer',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80',
    },
  ];

  const bottomRow = [
    {
      id: 5,
      quote: isId
        ? 'Sistem escrow proteksi pembeli membuat belanja online bebas rasa was-was.'
        : 'The escrow buyer protection gives complete confidence in every purchase.',
      name: 'Chloe Jordan',
      role: isId ? 'Interior Designer' : 'Interior Designer',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&h=150&q=80',
    },
    {
      id: 6,
      quote: isId
        ? 'Kurasi brand lifestyle sangat lengkap dan promo gratis ongkirnya menguntungkan.'
        : 'Exceptional brand curation with authentic discounts and quick dispatch.',
      name: 'Lex Taylor',
      role: isId ? 'Sneaker Collector' : 'Sneaker Collector',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    },
    {
      id: 7,
      quote: isId
        ? 'Perabot rumah tangga dikirim dengan packing kayu rapi tanpa cacat sedikitpun.'
        : 'Home items arrived securely in wooden crate packaging without a scratch.',
      name: 'Marley Hayes',
      role: isId ? 'Home Living Enthusiast' : 'Home Living Enthusiast',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    },
    {
      id: 8,
      quote: isId
        ? 'Pelacakan resi akurat dan seller memproses kiriman di hari yang sama.'
        : 'Real-time tracking updates and same-day delivery dispatch exceeded expectations.',
      name: 'Rian Pratama',
      role: isId ? 'Verified Customer' : 'Verified Customer',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80',
    },
  ];

  // Duplicate for seamless infinite marquee loop
  const duplicatedTopRow = [...topRow, ...topRow, ...topRow];
  const duplicatedBottomRow = [...bottomRow, ...bottomRow, ...bottomRow];

  return (
    <section className="w-full py-12 sm:py-16 bg-[#fcfcfc] overflow-hidden relative select-none">
      {/* Blurry Side Fade Overlays */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 sm:w-44 lg:w-60 bg-gradient-to-r from-[#fcfcfc] via-[#fcfcfc]/85 to-transparent backdrop-blur-[2px] z-20" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 sm:w-44 lg:w-60 bg-gradient-to-l from-[#fcfcfc] via-[#fcfcfc]/85 to-transparent backdrop-blur-[2px] z-20" />

      {/* Top Marquee Row */}
      <div className="w-full overflow-hidden">
        <div className="animate-marquee gap-4 sm:gap-6 py-2">
          {duplicatedTopRow.map((item, idx) => (
            <div
              key={`top-${item.id}-${idx}`}
              className="w-[260px] sm:w-[290px] md:w-[310px] shrink-0 rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between text-left shadow-none transition-transform hover:-translate-y-0.5 duration-200"
            >
              {/* Top: Avatar + Quote + Author */}
              <div className="flex items-start gap-3">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-100"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-xs text-slate-700 leading-snug font-normal">
                    {item.quote}
                  </p>
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-900 block mt-1.5 truncate">
                    {item.name}
                  </span>
                </div>
              </div>

              {/* Bottom: Role */}
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 pt-3 border-t border-slate-100 mt-3">
                {item.role}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center Headline */}
      <div className="text-center my-8 sm:my-10 px-4">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
          {isId ? 'Apa Kata Pengguna PASARIA' : 'What PASARIA Users Say'}
        </h2>
      </div>

      {/* Bottom Reverse Marquee Row */}
      <div className="w-full overflow-hidden">
        <div className="animate-marquee-reverse gap-4 sm:gap-6 py-2">
          {duplicatedBottomRow.map((item, idx) => (
            <div
              key={`bottom-${item.id}-${idx}`}
              className="w-[260px] sm:w-[290px] md:w-[310px] shrink-0 rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between text-left shadow-none transition-transform hover:-translate-y-0.5 duration-200"
            >
              {/* Top: Avatar + Quote + Author */}
              <div className="flex items-start gap-3">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-100"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-xs text-slate-700 leading-snug font-normal">
                    {item.quote}
                  </p>
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-900 block mt-1.5 truncate">
                    {item.name}
                  </span>
                </div>
              </div>

              {/* Bottom: Role */}
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 pt-3 border-t border-slate-100 mt-3">
                {item.role}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
