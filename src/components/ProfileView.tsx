import React, { useState, useRef } from 'react';
import { User, MapPin, Phone, Mail, Shield, Check, Camera, Upload } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileViewProps {
  user: UserType | null;
  onUpdateUser: (user: UserType) => void;
  onNavigateHome: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  onNavigateHome,
}) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [zip, setZip] = useState(user?.zip || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      const updatedUser: UserType = {
        ...user,
        name,
        email,
        address,
        city,
        zip,
        phone,
        avatar
      };
      onUpdateUser(updatedUser);
    }
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
          className="text-xs font-semibold text-[#003d29] hover:underline cursor-pointer"
        >
          Return to Store
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xs">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 text-[#003d29] font-extrabold text-2xl flex items-center justify-center overflow-hidden shadow-inner">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  name.charAt(0) || 'U'
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 bg-[#003d29] text-white rounded-full hover:bg-emerald-900 transition-colors shadow-md cursor-pointer"
                title="Change Avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{name || 'User Profile'}</h3>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline ml-2 cursor-pointer"
                >
                  Upload Foto
                </button>
              </div>
              <p className="text-slate-400 mt-0.5">{user?.role === 'admin' ? 'Administrator' : 'Verified Member'}</p>
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
