import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Phone,
} from 'lucide-react';
import { UserAddress } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AddressesTab: React.FC = () => {
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [formRecipient, setFormRecipient] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddressLine, setFormAddressLine] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formProvince, setFormProvince] = useState('DKI Jakarta');
  const [formPostalCode, setFormPostalCode] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Confirmation State
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAddresses();
      setAddresses(data || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat buku alamat.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setFormRecipient('');
    setFormPhone('');
    setFormAddressLine('');
    setFormCity('');
    setFormProvince('DKI Jakarta');
    setFormPostalCode('');
    setFormIsDefault(addresses.length === 0);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (addr: UserAddress) => {
    setEditingAddress(addr);
    setFormRecipient(addr.recipient_name);
    setFormPhone(addr.phone);
    setFormAddressLine(addr.address_line);
    setFormCity(addr.city);
    setFormProvince(addr.province || 'DKI Jakarta');
    setFormPostalCode(addr.postal_code);
    setFormIsDefault(addr.is_default);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRecipient.trim() || !formPhone.trim() || !formAddressLine.trim() || !formCity.trim() || !formPostalCode.trim()) {
      setFormError('Semua kolom wajib diisi.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (editingAddress) {
        const updated = await api.updateAddress(editingAddress.id, {
          recipient_name: formRecipient.trim(),
          phone: formPhone.trim(),
          address_line: formAddressLine.trim(),
          city: formCity.trim(),
          province: formProvince.trim(),
          postal_code: formPostalCode.trim(),
          is_default: formIsDefault,
        });

        setAddresses((prev) =>
          prev.map((a) => {
            if (a.id === editingAddress.id) {
              return updated;
            }
            if (formIsDefault) {
              return { ...a, is_default: false };
            }
            return a;
          })
        );
        showToast('Alamat berhasil diperbarui.', 'success');
      } else {
        const created = await api.addAddress({
          recipient_name: formRecipient.trim(),
          phone: formPhone.trim(),
          address_line: formAddressLine.trim(),
          city: formCity.trim(),
          province: formProvince.trim(),
          postal_code: formPostalCode.trim(),
          is_default: formIsDefault || addresses.length === 0,
        });

        setAddresses((prev) => {
          if (created.is_default) {
            return [created, ...prev.map((a) => ({ ...a, is_default: false }))];
          }
          return [...prev, created];
        });
        showToast('Alamat baru berhasil ditambahkan.', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan alamat.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === id,
        }))
      );
      showToast('Alamat utama berhasil diatur.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengatur alamat utama.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await api.deleteAddress(deleteTargetId);
      setAddresses((prev) => prev.filter((a) => a.id !== deleteTargetId));
      showToast('Alamat berhasil dihapus.', 'info');
      setDeleteTargetId(null);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus alamat.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#003d29]" />
              <span>Buku Alamat Pengiriman</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Kelola alamat tujuan checkout pesanan Anda. Pastikan nama penerima dan nomor telepon akurat.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="min-h-[44px] px-4 py-2 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs motion-press active:scale-[0.96]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Alamat Baru</span>
          </button>
        </div>

        {error && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Memuat daftar alamat pengiriman...
          </div>
        ) : addresses.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700">Belum Ada Alamat Tersimpan</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Tambahkan alamat tempat tinggal atau kantor Anda untuk mempermudah proses pemesanan barang di PASARIA.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-2 min-h-[40px] px-5 py-2 rounded-full bg-[#003d29] text-white text-xs font-bold cursor-pointer hover:bg-[#064e3b]"
            >
              Tambah Alamat Sekarang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-5 rounded-2xl border text-xs transition-all ${
                  addr.is_default
                    ? 'bg-emerald-50/30 border-emerald-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm">{addr.recipient_name}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600 flex items-center gap-1 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{addr.phone}</span>
                      </span>
                      {addr.is_default && (
                        <span className="text-[10px] font-bold text-[#003d29] bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Alamat Utama ✓
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 font-normal leading-relaxed">
                      {addr.address_line}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {addr.city}, {addr.province || 'DKI Jakarta'} {addr.postal_code}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    {!addr.is_default && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-[11px] font-bold text-[#003d29] hover:bg-emerald-100/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Jadikan Utama
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditModal(addr)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                      title="Edit Alamat"
                      aria-label="Edit Alamat"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(addr.id)}
                      className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Hapus Alamat"
                      aria-label="Hapus Alamat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {editingAddress ? 'Edit Alamat Pengiriman' : 'Tambah Alamat Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {formError && (
              <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="address-recipient-name" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama Penerima
                  </label>
                  <input
                    id="address-recipient-name"
                    type="text"
                    value={formRecipient}
                    onChange={(e) => setFormRecipient(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29]"
                  />
                </div>
                <div>
                  <label htmlFor="address-phone-number" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    id="address-phone-number"
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address-detail-line" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Alamat Lengkap (Jalan, RT/RW, No. Rumah)
                  </label>
                  <input
                    id="address-detail-line"
                    type="text"
                    value={formAddressLine}
                    onChange={(e) => setFormAddressLine(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29]"
                  />
                </div>
                <div>
                  <label htmlFor="address-city-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Kota / Kabupaten
                  </label>
                  <input
                    id="address-city-input"
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29]"
                  />
                </div>
                <div>
                  <label htmlFor="address-province-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Provinsi
                  </label>
                  <input
                    id="address-province-input"
                    type="text"
                    value={formProvince}
                    onChange={(e) => setFormProvince(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address-postal-code" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Kode Pos
                  </label>
                  <input
                    id="address-postal-code"
                    type="text"
                    value={formPostalCode}
                    onChange={(e) => setFormPostalCode(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsDefault}
                    onChange={(e) => setFormIsDefault(e.target.checked)}
                    className="w-4 h-4 text-[#003d29] rounded border-slate-300 focus:ring-[#003d29]"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Jadikan sebagai alamat pengiriman utama
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[40px] px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[40px] px-5 py-2 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white font-bold cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Alamat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-slate-200 shadow-xl space-y-4 text-left">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hapus Alamat Ini?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Alamat yang dihapus tidak dapat dipulihkan kembali. Anda dapat menambahkan alamat baru kapan saja.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="min-h-[40px] px-4 py-2 rounded-full border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="min-h-[40px] px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
