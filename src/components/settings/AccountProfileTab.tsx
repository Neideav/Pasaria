import React, { useState, useRef } from 'react';
import {
  User as UserIcon,
  Camera,
  Check,
  AlertCircle,
  Mail,
  Shield,
  Store,
  ExternalLink,
  Phone,
  MapPin,
} from 'lucide-react';
import { User } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface AccountProfileTabProps {
  user: User | null;
  onUpdateUser?: (updated: User) => void;
  onOpenShopDashboard?: () => void;
}

export const AccountProfileTab: React.FC<AccountProfileTabProps> = ({
  user,
  onUpdateUser,
  onOpenShopDashboard,
}) => {
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [address, setAddress] = useState(user?.address || '');
  const [zip, setZip] = useState(user?.zip || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Verified Email Change Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [emailStep, setEmailStep] = useState<'request' | 'verify'>('request');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran foto profil maksimal 2 MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama lengkap tidak boleh kosong.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const res = await api.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatar || undefined,
        address: address.trim(),
        city: city.trim(),
        zip: zip.trim(),
      });

      const updatedUser: User = res.user || {
        ...(user as User),
        name: name.trim(),
        phone: phone.trim(),
        avatar,
        address: address.trim(),
        city: city.trim(),
        zip: zip.trim(),
      };

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      setSaveSuccess(true);
      showToast('Profil Anda berhasil diperbarui.', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan profil. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setEmailLoading(true);
    setEmailError('');

    try {
      await api.requestEmailChange(newEmail.trim());
      setEmailStep('verify');
      showToast('Kode verifikasi telah dikirim ke alamat email baru Anda.', 'info');
    } catch (err: any) {
      setEmailError(err.message || 'Gagal memproses permintaan ubah email.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    setEmailLoading(true);
    setEmailError('');

    try {
      const res = await api.verifyEmailChange(otpCode.trim());
      if (res.user && onUpdateUser) {
        onUpdateUser(res.user);
      }
      setShowEmailModal(false);
      showToast('Alamat email berhasil diperbarui dan diverifikasi.', 'success');
    } catch (err: any) {
      setEmailError(err.message || 'Kode verifikasi tidak valid atau telah kedaluwarsa.');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 text-[#003d29] font-black text-2xl flex items-center justify-center overflow-hidden shadow-inner">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span>{name.charAt(0) || 'U'}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-[#003d29] hover:bg-[#064e3b] text-white rounded-full transition-colors shadow-md cursor-pointer motion-press active:scale-[0.96]"
                title="Ganti Foto Profil"
                aria-label="Ganti Foto Profil"
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-slate-900">{name || 'Pengguna PASARIA'}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#003d29] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {user?.role || 'customer'}
                </span>
                {user?.email_verified_at ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Email Terverifikasi</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    <span>Email Belum Diverifikasi</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">@{user?.username} · {user?.email}</p>
            </div>
          </div>

          {/* Seller Store Quick Link */}
          {user?.role === 'seller' && user?.shop && (
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#003d29]" />
                <div>
                  <div className="font-bold text-xs text-slate-900">{user.shop.name}</div>
                  <div className="text-[10px] text-slate-500">Toko Terdaftar · {user.shop.city}</div>
                </div>
              </div>
              {onOpenShopDashboard && (
                <button
                  type="button"
                  onClick={onOpenShopDashboard}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#003d29] hover:underline cursor-pointer"
                >
                  <span>Seller Center</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {errorMessage && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div role="status" className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profil Anda berhasil diperbarui!</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-name" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Nama Lengkap
              </label>
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29]"
              />
            </div>

            <div>
              <label htmlFor="settings-username" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Username (ID Pengguna)
              </label>
              <input
                id="settings-username"
                type="text"
                value={user?.username || ''}
                readOnly
                disabled
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed select-none"
              />
            </div>

            {/* Email Field with Verified Flow Trigger */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Alamat Email Terdaftar
                </label>
                <span className="text-[10px] text-slate-400">
                  Perubahan email membutuhkan verifikasi kode satu kali
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    disabled
                    className="w-full min-h-[44px] pl-3.5 pr-24 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed select-none"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {user?.email_verified_at ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        Aktif ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                        Belum Verifikasi
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewEmail('');
                    setOtpCode('');
                    setEmailStep('request');
                    setEmailError('');
                    setShowEmailModal(true);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[#003d29] font-bold text-xs transition-colors cursor-pointer shrink-0 motion-press active:scale-[0.96]"
                >
                  Ubah Email
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="settings-phone" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                id="settings-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29]"
              />
            </div>

            <div>
              <label htmlFor="settings-city" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Kota / Kabupaten
              </label>
              <input
                id="settings-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Contoh: Jakarta Selatan"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29]"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="settings-address" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Alamat Lengkap
              </label>
              <input
                id="settings-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29]"
              />
            </div>

            <div>
              <label htmlFor="settings-zip" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Kode Pos
              </label>
              <input
                id="settings-zip"
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="Contoh: 12190"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29]"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#003d29] hover:bg-[#064e3b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] transition-all cursor-pointer flex items-center gap-2 shadow-2xs disabled:opacity-50 motion-press active:scale-[0.96]"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Profil Tersimpan ✓</span>
                </>
              ) : (
                <span>{saving ? 'Menyimpan...' : 'Simpan Profil'}</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Verified Email Change Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">Ubah Alamat Email</h3>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {emailError && (
              <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{emailError}</span>
              </div>
            )}

            {emailStep === 'request' ? (
              <form onSubmit={handleRequestEmailChange} className="space-y-4 text-xs">
                <p className="text-slate-500">
                  Masukkan alamat email baru Anda. Kode verifikasi 6 digit akan dikirimkan untuk memastikan kepemilikan email baru.
                </p>
                <div>
                  <label htmlFor="settings-modal-new-email" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Alamat Email Baru
                  </label>
                  <input
                    id="settings-modal-new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="min-h-[40px] px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={emailLoading || !newEmail.trim()}
                    className="min-h-[40px] px-5 py-2 rounded-full bg-[#003d29] text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    {emailLoading ? 'Memproses...' : 'Kirim Kode Verifikasi'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailChange} className="space-y-4 text-xs">
                <p className="text-slate-500">
                  Kode verifikasi 6 digit telah dikirimkan ke <strong className="text-slate-800">{newEmail}</strong>.
                </p>
                <div>
                  <label htmlFor="settings-modal-otp" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Kode Verifikasi (OTP)
                  </label>
                  <input
                    id="settings-modal-otp"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 123456"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#003d29]"
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setEmailStep('request')}
                    className="text-emerald-800 hover:underline font-semibold text-xs cursor-pointer"
                  >
                    ← Ganti Email
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(false)}
                      className="min-h-[40px] px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={emailLoading || otpCode.length !== 6}
                      className="min-h-[40px] px-5 py-2 rounded-full bg-[#003d29] text-white font-bold cursor-pointer disabled:opacity-50"
                    >
                      {emailLoading ? 'Memverifikasi...' : 'Verifikasi & Simpan'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
