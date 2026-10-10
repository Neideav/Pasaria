import React from 'react';
import { Truck, ShieldCheck, CreditCard, Headphones, ArrowRight } from 'lucide-react';
import faqImg from '../assets/images/service_faq_family_1790485254074.jpg';
import paymentImg from '../assets/images/service_online_payment_1790485268106.jpg';
import deliveryImg from '../assets/images/service_home_delivery_1790485280855.jpg';

interface ServicesSectionProps {
  onLearnMore?: (serviceName: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onLearnMore }) => {
  const services = [
    {
      title: 'Pengiriman Aman & Cepat',
      subtitle: 'Kurir prioritas dengan proteksi asuransi & live tracking realtime',
      icon: Truck,
      image: deliveryImg,
      bgColor: 'bg-[#f4efe8]',
      badgeColor: 'bg-emerald-100/90 text-emerald-900',
      badgeText: 'Kurir Resmi',
      alt: 'Kurir ramah mengantar paket belanja ke rumah',
    },
    {
      title: 'Jaminan Kualitas 100% Original',
      subtitle: 'Produk seller resmi terkurasi ketat dengan garansi uang kembali',
      icon: ShieldCheck,
      image: faqImg,
      bgColor: 'bg-[#e9f2ee]',
      badgeColor: 'bg-teal-100/90 text-teal-900',
      badgeText: 'Garansi Retur',
      alt: 'Pusat bantuan keluarga dan jaminan mutu PASARIA',
    },
    {
      title: 'Pembayaran Terverifikasi & Aman',
      subtitle: 'Sistem escrow rekening bersama via QRIS, Virtual Account, & COD',
      icon: CreditCard,
      image: paymentImg,
      bgColor: 'bg-[#f8ede3]',
      badgeColor: 'bg-amber-100/90 text-amber-900',
      badgeText: 'Rekening Escrow',
      alt: 'Transaksi online aman dan terverifikasi',
    },
    {
      title: 'Layanan CS 24/7 Siap Membantu',
      subtitle: 'Tim dukungan pelanggan responsif mendampingi belanja Anda setiap saat',
      icon: Headphones,
      image: faqImg,
      bgColor: 'bg-[#eef2f6]',
      badgeColor: 'bg-blue-100/90 text-blue-900',
      badgeText: 'Bantuan 24 Jam',
      alt: 'Layanan pelanggan PASARIA siap melayani sepanjang waktu',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <div className="text-left mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-[#003d29] text-xs font-bold uppercase tracking-wider mb-2">
            🛡️ Kenyamanan & Keamanan
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Layanan Unggulan Pembeli PASARIA
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 max-w-sm text-left">
          Belanja dari toko lokal dengan standar kenyamanan, proteksi garansi, dan logistik modern.
        </p>
      </div>

      {/* Motion Point #42: ServicesSection Card Hover Tilt & Icon Elevation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div
              key={idx}
              onClick={() => onLearnMore && onLearnMore(item.title)}
              className={`group rounded-3xl ${item.bgColor} p-5 sm:p-6 flex flex-col justify-between overflow-hidden shadow-2xs hover:-translate-y-1.5 hover:shadow-xl transition-[transform,box-shadow] duration-200 ease-[var(--ease-out)] cursor-pointer text-left border border-white/60`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  {/* Motion Point #42: Icon Smooth Elevation */}
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#003d29] group-hover:scale-110 transition-transform duration-200 ease-[var(--ease-out)]">
                    <IconComponent className="w-6 h-6 text-[#003d29]" />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${item.badgeColor}`}
                  >
                    {item.badgeText}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#003d29] transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-600 font-normal leading-relaxed line-clamp-2">
                    {item.subtitle}
                  </p>
                </div>

                {/* Motion Point #43: Learn More Button Tactile Press (active:scale-[0.96]) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onLearnMore) onLearnMore(item.title);
                  }}
                  className="motion-press group/btn inline-flex items-center gap-1.5 text-xs font-bold text-[#003d29] hover:text-[#064e3b] active:scale-[0.96] transition-transform duration-120 cursor-pointer pt-1 focus:outline-none focus-visible:underline"
                >
                  <span>Pelajari Lebih Lanjut</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform duration-160 ease-[var(--ease-out)]" />
                </button>
              </div>

              <div className="w-full h-36 rounded-2xl overflow-hidden mt-5 shadow-xs border border-white/50 bg-white/40">
                <img
                  src={item.image}
                  alt={item.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
