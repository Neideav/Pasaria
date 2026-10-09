import React from 'react';
import faqImg from '../assets/images/service_faq_family_1790485254074.jpg';
import paymentImg from '../assets/images/service_online_payment_1790485268106.jpg';
import deliveryImg from '../assets/images/service_home_delivery_1790485280855.jpg';
import { Language } from '../i18n/translations';

interface ServicesSectionProps {
  lang?: Language;
  onLearnMore?: (serviceName: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ lang = 'id', onLearnMore }) => {
  const isId = lang === 'id';

  const services = [
    {
      title: isId ? 'Pusat Bantuan & FAQ' : 'Frequently Asked Questions',
      subtitle: isId
        ? 'Panduan belanja aman, terpercaya, dan solusi kendala toko'
        : 'Updates on safe shopping and store support',
      image: faqImg,
      bgColor: 'bg-[#fbf5ee]',
      alt: isId ? 'Keluarga berbelanja bersama di PASARIA' : 'Family shopping together on a tablet',
    },
    {
      title: isId ? 'Proses Pembayaran Online' : 'Online Payment Process',
      subtitle: isId
        ? 'Metode pembayaran instan, praktis, dan terenkripsi aman'
        : 'Fast, seamless, and securely encrypted checkout',
      image: paymentImg,
      bgColor: 'bg-[#edf6f2]',
      alt: isId ? 'Transaksi pembayaran online yang aman' : 'Secure contactless mobile payment transaction',
    },
    {
      title: isId ? 'Pilihan Pengiriman ke Rumah' : 'Home Delivery Options',
      subtitle: isId
        ? 'Pengiriman cepat dan lacak resi langsung dari kurir resmi'
        : 'Fast delivery and live tracking with trusted couriers',
      image: deliveryImg,
      bgColor: 'bg-[#fdf1e7]',
      alt: isId ? 'Kurir pengiriman paket dengan ramah' : 'Friendly courier delivering package with green uniform',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14 text-left">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isId ? 'Layanan untuk Membantu Belanja Anda' : 'Services To Help You Shop'}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {services.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onLearnMore && onLearnMore(item.title)}
            className={`group rounded-2xl ${item.bgColor} p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer select-none`}
          >
            <div className="text-left mb-4">
              <h3 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 group-hover:text-[#003d29] transition-colors leading-snug">
                {item.title}
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-600 mt-1 font-normal">
                {item.subtitle}
              </p>
            </div>

            <div className="w-full h-48 sm:h-52 md:h-56 rounded-xl overflow-hidden bg-slate-100">
              <img
                src={item.image}
                alt={item.alt}
                className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};


