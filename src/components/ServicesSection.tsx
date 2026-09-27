import React from 'react';
import faqImg from '../assets/images/service_faq_family_1790485254074.jpg';
import paymentImg from '../assets/images/service_online_payment_1790485268106.jpg';
import deliveryImg from '../assets/images/service_home_delivery_1790485280855.jpg';

interface ServicesSectionProps {
  onLearnMore?: (serviceName: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onLearnMore }) => {
  const services = [
    {
      title: 'Frequently Asked Questions',
      subtitle: 'Updates on safe Shopping in our Stores',
      image: faqImg,
      bgColor: 'bg-[#f4efe8]',
      alt: 'Family shopping together on a tablet'
    },
    {
      title: 'Online Payment Process',
      subtitle: 'Updates on safe Shopping in our Stores',
      image: paymentImg,
      bgColor: 'bg-[#e9f2ee]',
      alt: 'Secure contactless mobile payment transaction'
    },
    {
      title: 'Home Delivery Options',
      subtitle: 'Updates on safe Shopping in our Stores',
      image: deliveryImg,
      bgColor: 'bg-[#f8ede3]',
      alt: 'Friendly courier delivering package with green uniform'
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <div className="text-left mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Services To Help You Shop
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onLearnMore && onLearnMore(item.title)}
            className={`group rounded-3xl ${item.bgColor} p-6 pb-0 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer`}
          >
            <div className="text-left space-y-2 mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-[#003d29] transition-colors leading-snug">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 font-normal">
                {item.subtitle}
              </p>
            </div>

            <div className="w-full h-52 sm:h-56 rounded-t-2xl overflow-hidden mt-auto">
              <img
                src={item.image}
                alt={item.alt}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
