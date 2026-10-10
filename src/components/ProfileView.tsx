import React, { useState, useEffect, useRef } from 'react';
import { User, MapPin, Phone, Mail, Shield, Check, Camera, Plus, Trash2, ArrowLeft, AlertCircle } from 'lucide-react';
import { User as UserType, UserAddress } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

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
  const { showToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [zip, setZip] = useState(user?.zip || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Address Book state
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');
  const [removingAddressId, setRemovingAddressId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await api.getAddresses();
      setAddresses(data || []);
    } catch (e) {
      console.warn('Load addresses note:', e);
    }
  };

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setErrorMsg('');

    try {
      const res = await api.updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar: avatar || undefined,
        address: address.trim(),
        city: city.trim(),
        zip: zip.trim(),
      });

      const updatedUser = res.user || {
        ...(user as UserType),
        name,
        email,
        phone,
        avatar,
        address,
        city,
        zip,
      };

      onUpdateUser(updatedUser);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient.trim() || !newAddressLine.trim() || !newCity.trim()) return;

    try {
      const added = await api.addAddress({
        recipient_name: newRecipient.trim(),
        phone: newPhone.trim(),
        address_line: newAddressLine.trim(),
        city: newCity.trim(),
        postal_code: newPostalCode.trim(),
        is_default: addresses.length === 0,
      });

      setAddresses((prev) => [added, ...prev]);
      setShowAddAddress(false);
      setNewRecipient('');
      setNewPhone('');
      setNewAddressLine('');
      setNewCity('');
      setNewPostalCode('');
      showToast('Alamat baru berhasil ditambahkan.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan alamat', 'error');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    setRemovingAddressId(id);
    await new Promise((resolve) => setTimeout(resolve, 200));

    const addressToDelete = addresses.find((a) => a.id === id);
    try {
      await api.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));

      if (addressToDelete) {
        showToast('Alamat berhasil dihapus.', 'info', {
          duration: 6000,
          action: {
            label: 'Urungkan',
            onClick: async () => {
              try {
                const restored = await api.addAddress({
                  recipient_name: addressToDelete.recipient_name,
                  phone: addressToDelete.phone,
                  address_line: addressToDelete.address_line,
                  city: addressToDelete.city,
                  postal_code: addressToDelete.postal_code,
                  is_default: addressToDelete.is_default,
                });
                setAddresses((prev) => [restored, ...prev]);
                showToast('Alamat berhasil dipulihkan.', 'success');
              } catch (err: any) {
                showToast(err.message || 'Gagal mengembalikan alamat', 'error');
              }
            },
          },
        });
      } else {
        showToast('Alamat berhasil dihapus.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus alamat', 'error');
    } finally {
      setRemovingAddressId(null);
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await api.setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === id,
        }))
      );
      showToast('Alamat utama berhasil diubah.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah alamat utama', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 text-left space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">
            <User className="w-4 h-4 text-emerald-700" />
            <span>Akun Pengguna</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Profil Saya
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data diri, kontak, dan alamat pengiriman Anda di PASARIA.
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003d29] hover:underline cursor-pointer motion-press active:scale-[0.96]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </button>
      </div>

      {/* Main Profile Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs">
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Avatar & Role Header */}
          <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 text-[#003d29] font-black text-2xl flex items-center justify-center overflow-hidden shadow-inner">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  name.charAt(0) || 'U'
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-[#003d29] text-white rounded-full hover:bg-[#064e3b] transition-colors shadow-md cursor-pointer motion-press active:scale-[0.96]"
                title="Ganti Foto"
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
                <h3 className="text-base font-bold text-slate-900">{name || 'Pengguna PASARIA'}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#003d29] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {user?.role || 'customer'}
                </span>
              </div>
              <p className="text-slate-400 mt-0.5">{email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kota Asal</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Alamat Rumah Utama</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#003d29] hover:bg-[#064e3b] transition-all cursor-pointer flex items-center gap-2 shadow-2xs disabled:opacity-50 motion-press active:scale-[0.96]"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Perubahan Tersimpan ✓</span>
                </>
              ) : (
                <span>{saving ? 'Menyimpan...' : 'Simpan Profil'}</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Address Book Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Buku Alamat Pengiriman</h3>
            <p className="text-xs text-slate-400 mt-0.5">Daftar alamat tersimpan untuk kemudahan checkout otomatis.</p>
          </div>
          <button
            onClick={() => setShowAddAddress(!showAddAddress)}
            className="px-4 py-2 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs motion-press active:scale-[0.96]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Alamat Baru</span>
          </button>
        </div>

        {/* Add Address Form */}
        {showAddAddress && (
          <form onSubmit={handleCreateAddress} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-slate-900">Alamat Baru</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Penerima</label>
                <input
                  type="text"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  value={newAddressLine}
                  onChange={(e) => setNewAddressLine(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kota / Kabupaten</label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kode Pos</label>
                <input
                  type="text"
                  value={newPostalCode}
                  onChange={(e) => setNewPostalCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAddress(false)}
                className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-semibold cursor-pointer motion-press active:scale-[0.96]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#003d29] text-white font-bold cursor-pointer motion-press active:scale-[0.96]"
              >
                Simpan Alamat
              </button>
            </div>
          </form>
        )}

        {/* Saved Addresses List */}
        <div className="space-y-3">
          {addresses.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Belum ada alamat tambahan yang tersimpan.
            </div>
          ) : (
            addresses.map((addr) => {
              const isRemoving = removingAddressId === addr.id;
              return (
                <div
                  key={addr.id}
                  className={`p-4 rounded-2xl bg-white border border-slate-200/70 flex items-center justify-between text-xs gap-3 transition-[transform,opacity] duration-200 ease-[var(--ease-out)] ${
                    isRemoving ? 'motion-address-exit -translate-x-full opacity-0 pointer-events-none' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{addr.recipient_name}</span>
                      <span className="text-slate-400">· {addr.phone}</span>
                      {addr.is_default && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded-full">
                          Alamat Utama
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 mt-1">{addr.address_line}, {addr.city} {addr.postal_code}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!addr.is_default && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 motion-press active:scale-[0.96] transition-colors cursor-pointer"
                      >
                        Jadikan Utama
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0 motion-press active:scale-[0.96]"
                      title="Hapus Alamat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
