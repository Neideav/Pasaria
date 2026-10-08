# PASARIA — Modern Multi-Vendor Marketplace Platform

> **PASARIA: Your Everyday Marketplace**  
> Platform marketplace multi-vendor modern, aman, dan scalable yang menghubungkan pembeli (Customer), penjual resmi (Seller), dan tim operasional (Administrator/Support) se-Indonesia.

---

## 1. Arsitektur Sistem

PASARIA menggunakan arsitektur modular terpadu dengan **Laravel 11 API sebagai Single Source of Truth** untuk business logic, autentikasi sesi Sanctum, dan persistensi database relasional:

```text
               ┌────────────────────────────────────────────────────────┐
               │              React 19 + TypeScript + Vite              │
               │   (Single-Page App, Tailwind CSS, Centralized API)    │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                HTTPS / REST API / Bearer Token
                                           │
               ┌───────────────────────────▼────────────────────────────┐
               │                   Laravel 11 API                       │
               │  ├── Sanctum Authentication & Role Authorization       │
               │  ├── FormRequest Validation & IDOR Protection          │
               │  ├── PricingService & Atomic CheckoutService           │
               │  ├── Multi-Vendor Sub-Orders & Escrow Logic            │
               │  └── Real Eloquent Models & Database Transactions      │
               └───────────────────────────┬────────────────────────────┘
                                           │
                           MariaDB / MySQL (AWS RDS / Local)
                                           │
         ┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
         ▼             ▼             ▼             ▼             ▼             ▼
       Users         Shops       Products        Orders       Shipments     Reviews
     Addresses      Wallets      Variants      Sub-Orders     Tracking        Q&A
```

---

## 2. Matriks Fitur Lengkap

### A. Fitur Pembeli (Customer)
- **Katalog & Navigasi**: Beranda responsif, filter harga/kategori/rating, pencarian autocomplete instan, dan pagination bernomor.
- **Detail Produk & Varian**: Pemilihan varian (warna, memori, model) yang otomatis memperbarui SKU, harga, dan ketersediaan stok.
- **Keranjang Multi-Vendor**: Keranjang belanja tersimpan di database dan dikelompokkan otomatis per toko penjual.
- **Checkout Server-Controlled**: Kalkulasi subtotal, ongkir per kurir (PASARIA Express, SiCepat, GoSend), PPN 11%, dan validasi kode promo (contoh: `PASARIA50`) dihitung 100% oleh server.
- **Manajemen Pesanan**: Pemisahan sub-order per toko, pelacakan resi real-time dengan rute kurir interaktif, tombol pembatalan pesanan aman, dan pembelian ulang (*Buy Again*).
- **Ulasan & Rating Terverifikasi**: Hanya pembeli yang telah menerima barang yang dapat memberikan ulasan bintang 1–5. Dilengkapi rincian grafik kepuasan dan balasan penjual.
- **Tanya Jawab Publik (Q&A)**: Pembeli dapat mengajukan pertanyaan publik yang dijawab langsung oleh toko penjual resmi.
- **Wishlist & Follow Toko**: Simpan produk favorit dan ikuti toko resmi untuk mendapatkan notifikasi pembaruan promo.
- **Retur & Komplain**: Pengajuan pengembalian dana/barang dengan bukti kendala dan mediasi sengketa.
- **Chat Real-Time**: Fitur kirim pesan langsung antara pembeli dan penjual dengan balasan cepat (*quick replies*).
- **Profil & Alamat**: Kelola data diri, upload foto profil, dan simpan banyak alamat pengiriman di buku alamat.

### B. Fitur Penjual (Seller Center)
- **Onboarding Toko**: Pendaftaran toko resmi dengan nama, slogan, domisili kota, dan verifikasi dokumen.
- **Dashboard Statistik Real**: Pendapatan kotor, total pesanan masuk, produk aktif, dan peringatan stok menipis dari database.
- **Manajemen Produk & SKU**: Tambah produk baru beserta spesifikasi, varian harga, stok awal, dan foto.
- **Manajemen Inventaris**: Penyesuaian stok kilat (+5, +20, manual) langsung ke database.
- **Pemrosesan Pesanan**: Perbarui status pesanan dari diproses menjadi dikirim dan terbitkan nomor resi kurir.
- **Pusat Ulasan**: Pantau ulasan pelanggan dan tulis balasan resmi toko.
- **Keuangan & Payout**: Buku kas transaksi penjualan, saldo escrow tertahan, dan pengajuan penarikan dana ke rekening bank (BCA, Mandiri, BRI, BNI).

### C. Fitur Administrator & Operasional
- **Admin Portal Terpadu**: Metrik perputaran transaksi (GMV), total order, total pengguna, dan toko terdaftar.
- **Manajemen Pengguna**: Audit pengguna dan kontrol pembekuan (*suspend/activate*) akun.
- **Verifikasi Merchant**: Tinjau pengajuan toko baru, setujui atau tolak izin berjualan.
- **Moderasi Ulasan**: Sembunyikan atau setujui ulasan yang dilaporkan pengguna.
- **Pusat Resolusi Sengketa**: Pengambilan keputusan komplain retur antara pembeli dan penjual.
- **Log Audit**: Riwayat tindakan administratif yang tercatat permanen di database.

---

## 3. Akun Pengujian Development (Seeded Accounts)

Database development telah dilengkapi akun seeder siap pakai untuk setiap peran:

| Peran | Email | Kata Sandi | Keterangan |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@pasaria.id` | `password` | Pembeli aktif dengan riwayat transaksi & alamat |
| **Seller** | `seller@pasaria.id` | `password` | Pemilik toko resmi *PASARIA Audio Official* |
| **Admin** | `admin@pasaria.id` | `password` | Akses penuh ke Portal Administrator |
| **Support** | `support@pasaria.id` | `password` | Akses tim penanganan sengketa & moderasi |

*Catatan Keamanan: Jangan gunakan kredensial demo ini di lingkungan server production!*

---

## 4. Panduan Menjalankan Secara Lokal

### Kebutuhan Sistem
- PHP 8.2+ dengan ekstensi `pdo_sqlite`, `pdo_mysql`, `mbstring`, `intl`, `bcmath`
- Composer 2+
- Node.js 20+ & npm

### Langkah 1: Backend Laravel
```bash
# 1. Install dependensi PHP
composer install

# 2. Siapkan file environment
cp .env.example .env
php artisan key:generate

# 3. Jalankan migrasi dan seeder data awal
php artisan migrate:fresh --seed

# 4. Jalankan server Laravel API (Port 8000)
php artisan serve
```

### Langkah 2: Frontend React + Vite
```bash
# 1. Install dependensi frontend
npm install

# 2. Jalankan development server (Port 3000)
npm run dev
```

Buka peramban di `http://localhost:3000`. Vite akan secara otomatis meneruskan permintaan API (`/api`, `/sanctum`, `/up`) ke backend Laravel di port 8000.

---

## 5. Pengujian Otomatis & Verifikasi Kualitas

Aplikasi telah dilengkapi unit & feature test komprehensif:

```bash
# Menjalankan PHPUnit Feature & Unit Tests (14 Tests, 39 Assertions)
composer test
# atau
vendor/bin/phpunit

# Menjalankan TypeScript Lint & Typecheck
npm run lint

# Menjalankan Build Produksi Vite
npm run build
```

---

## 6. Deployment dengan Docker & AWS EC2

### Menjalankan dengan Docker Compose
```bash
# Build dan jalankan container PASARIA
docker compose build pasaria
docker compose up -d pasaria

# Jalankan migrasi di dalam container
docker compose exec pasaria php artisan migrate --force

# Cek status kesehatan container
curl -i http://localhost/up
```

### Script Otomatis `auto-deploy.sh`
Server produksi EC2 menggunakan script *zero-downtime* deployment:
```bash
bash auto-deploy.sh
```
Script ini mengeksekusi:
1. `set -euo pipefail` untuk keamanan eksekusi
2. Git pull kode terbaru dari branch `main`
3. Docker image build & container recreate
4. Eksekusi `php artisan migrate --force`
5. Optimalisasi cache Laravel (`config:cache`, `route:cache`, `view:cache`)
6. Verifikasi endpoint `/up` hingga status *healthy* tercapai

---

## 7. Lisensi & Hak Cipta
Hak Cipta © 2026 PASARIA. Seluruh hak cipta dilindungi undang-undang.
