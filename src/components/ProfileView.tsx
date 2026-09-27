import React, { useState } from 'react';
import { User, MapPin, Phone, Mail, Shield, Check } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileViewProps {
  user: UserType | null;
  onUpdateUser: (user: UserType) => void;
  onNavigateHome: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onNavigateHome,
}) => {
  const [name, setName] = useState(user?.name || 'Wade Warren');
  const [email, setEmail] = useState(user?.email || 'customer@shopcart.com');
  const [address, setAddress] = useState(user?.address || '4140 Parker Rd.');
  const [city, setCity] = useState(user?.city || 'Allentown');
  const [zip, setZip] = useState(user?.zip || '31134');
  const [phone, setPhone] = useState(user?.phone || '+001234567890');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 text-left">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Profile
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal information, address, and preferences.
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="text-xs font-semibold text-[#003d29] hover:underline"
        >
          Return to Store
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xs">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#003d29] font-extrabold text-xl flex items-center justify-center">
              {name.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{name}</h3>
              <p className="text-slate-400">{user?.role === 'admin' ? 'Administrator' : 'Verified Member'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Zip Code</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#003d29] hover:bg-[#064e3b] transition-all cursor-pointer flex items-center gap-2"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Changes Saved</span>
                </>
              ) : (
                <span>Save Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
