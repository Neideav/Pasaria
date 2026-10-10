# PASARIA — Modern Multi-Vendor Marketplace Platform

> **PASARIA: Your Everyday Marketplace**  
> Platform marketplace multi-vendor modern, aman, dan scalable yang menghubungkan pembeli (*Customer*), penjual resmi (*Seller*), dan tim operasional (*Administrator/Support*) se-Indonesia.

---

## 1. Arsitektur & Teknologi

PASARIA mengadopsi arsitektur terpisah (*Decoupled SPA + RESTful API*) dengan **Laravel 11 API sebagai Single Source of Truth** untuk seluruh aturan bisnis, kalkulasi harga, pemisahan sub-order multi-vendor, otentikasi Sanctum, dan persistensi transaksi database:

```text
               ┌────────────────────────────────────────────────────────┐
               │              React 19 + TypeScript + Vite              │
               │   (Single-Page App, Tailwind CSS, Centralized API)     │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                HTTPS / REST API / Bearer Token
                                           │
               ┌───────────────────────────▼────────────────────────────┐
               │                   Laravel 11 API                       │
               │  ├── Sanctum Token Authentication & Role Authorization │
               │  ├── FormRequest Validation & IDOR Protection          │
               │  ├── PricingService & Atomic CheckoutService           │
               │  ├── Multi-Vendor Sub-Orders & Escrow Logic            │
               │  └── Eloquent Models & ACID Database Transactions      │
               └───────────────────────────┬────────────────────────────┘
                                           │
                           MariaDB / MySQL (AWS RDS / Local)
                                           │
         ┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
         ▼             ▼             ▼             ▼             ▼             ▼
       Users         Shops       Products        Orders       Shipments     Reviews
     Addresses      Wallets      Variants      Sub-Orders     Tracking        Q&A
```

### Matriks Teknologi

| Layer | Teknologi | Keterangan |
|---|---|---|
| **Backend Framework** | Laravel 11.56.1 | PHP 8.2+ runtime, strict typing & PSR-4 autoloading |
| **API Authentication** | Laravel Sanctum | Bearer token authorization melalui `personal_access_tokens` |
| **Database Engine** | MariaDB 10.6+ / SQLite | Relational schema dengan foreign key cascade & soft deletes |
| **Frontend Framework** | React 19.0.1 | TypeScript 7.0+, React Router & Context state |
| **Styling & Icons** | Tailwind CSS v4.3.3 | UI Motion springs, Lucide Icons, Canvas Confetti |
| **Bundler & Tooling** | Vite 8.3.1 | Hot Module Replacement (HMR), tree-shaking |
| **Automated Testing** | PHPUnit 11.0.0 | Unit & Feature test suite (135 tes, 582 assertions) |
| **Container Runtime** | Docker | Multi-stage build (Node 22 builder into PHP 8.2 Apache) |

---

## 2. Fitur & Alur Bisnis Utama

### A. Alur Akun & Autentikasi
1. **Registrasi**: Akun baru didaftarkan dengan kata sandi ter-enkripsi `bcrypt` dan kode verifikasi 6-digit.
2. **Verifikasi Akun**: User memverifikasi email sebelum dapat melakukan checkout transaksi.
3. **Login & Session**: Menghasilkan Sanctum Bearer Token yang disimpan di client.
4. **Suspension Guard**: Akun yang dibekukan (`status: suspended`) langsung ditolak oleh middleware `account.active` dan token-token aktifnya dicabut.

### B. Alur Onboarding Seller & Toko
1. Pengguna dengan peran customer mengajukan pembukaan toko resmi via `POST /api/shops`.
2. Status toko baru adalah `pending` dan tidak dapat menerbitkan produk ke katalog publik.
3. Administrator meninjau dan menyetujui pengajuan toko (`PUT /api/admin/sellers/{id}/status`).
4. Toko berstatus `approved` otomatis mendapatkan dompet seller (`wallets`) dan peran pengguna dinaikkan menjadi `seller`.

### C. Alur Checkout Multi-Vendor & Stok
1. **Kalkulasi Server-Controlled**: Discard semua harga dari client. `PricingService` menghitung subtotal, diskon voucher promo, ongkos kirim per merchant, dan PPN 11% secara eksklusif di server.
2. **Transaksi Database Atomik**: `CheckoutService` mengeksekusi pesanan di dalam `DB::transaction()`:
   - Mengunci stok produk dengan `lockForUpdate()`.
   - Mengurangi stok varian/produk.
   - Membuat *Parent Order* dan *Sub-Orders* per merchant.
   - Menerbitkan record pengiriman (*Shipments*) dan mengosongkan keranjang.
3. **Idempotensi**: Mencegah pemesanan ganda akibat klik ganda atau network timeout via `X-Idempotency-Key`.

### D. Alur Pembayaran & Rekonsiliasi Escrow
1. Pesanan dibuat dengan status pembayaran `unpaid` dan rekonsiliasi gateway `pending`.
2. **Webhook Callback Gateway**: Webhook Midtrans / Sandbox diverifikasi melalui signature HMAC-SHA512.
3. Pembayaran sukses (`settlement` / `capture`) memindahkan pesanan ke status `paid`.
4. Dana pembayaran ditahan di rekening penampungan aman (*escrow*).
5. Setelah pesanan selesai diterima pembeli (`completed`), saldo pendapatan bersih dikreditkan secara atomik ke `wallets` toko penjual dengan pencatatan ganda pada `wallet_transactions`.

### E. Alur Retur, Komplain & Refund
1. Pembeli dapat mengajukan retur barang untuk pesanan yang telah terkirim (`delivered`) dalam masa garansi komplain.
2. Penjual dapat menyetujui atau menolak komplain retur.
3. Jika terdapat perselisihan, Admin / Support menengahi melalui pusat resolusi sengketa (`POST /api/disputes/{id}/resolve`).
4. Refund yang disetujui memicu pencatatan jurnal refund dan restock barang ke inventaris.

### F. Alur Payout Penjual
1. Penjual mengajukan penarikan dana (`POST /api/seller/payout`) sesuai saldo tersedia.
2. Dana yang ditarik dicadangkan (*reserved*) di dompet untuk mencegah *double-spending*.
3. Admin memverifikasi dan menyetujui penarikan dana (`POST /api/admin/payouts/{id}/approve`), mendebit saldo secara final dan mencatat bukti transfer.

---

## 3. Akun Pengujian Development (Seeded Accounts)

Database development telah dilengkapi akun seeder siap pakai untuk pengujian:

| Peran | Email | Kata Sandi | Keterangan |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@pasaria.id` | `password123` | Pembeli aktif terverifikasi dengan buku alamat |
| **Seller** | `seller@pasaria.id` | `password123` | Penjual resmi dengan toko disetujui (*PASARIA Official Store*) |
| **Admin** | `admin@pasaria.id` | `admin123` | Akses penuh ke Portal Administrator & Moderasi |
| **Support** | `support@pasaria.id` | `support123` | Akses penanganan sengketa retur & laporan ulasan |

> [!WARNING]
> Akun seeder di atas hanya untuk lingkungan lokal/pengujian (`local`/`testing`). Jangan pernah menjalankan seeder di server production.

---

## 4. Panduan Menjalankan Secara Lokal

### Kebutuhan Sistem
- PHP 8.2+ dengan ekstensi `pdo_sqlite`, `pdo_mysql`, `mbstring`, `intl`, `bcmath`
- Composer 2.8+
- Node.js 22+ & npm 10+

### Menjalankan Backend Laravel
```bash
# 1. Install dependensi PHP
composer install

# 2. Siapkan file environment
cp .env.example .env
php artisan key:generate

# 3. Jalankan migrasi dan seeder data awal
php artisan migrate --seed

# 4. Jalankan server Laravel API (Port 8000)
php artisan serve
```

### Menjalankan Frontend React + Vite
```bash
# 1. Install dependensi frontend
npm install

# 2. Jalankan development server (Port 3000)
npm run dev
```

Buka peramban di `http://localhost:3000`. Vite secara otomatis mem-proxy request API (`/api/*`, `/sanctum/*`, `/up`) ke backend port 8000.

---

## 5. Quality Gate & Rangkaian Pengujian

PASARIA menerapkan quality gate otomatis yang dapat dijalankan secara konsisten:

```bash
# Menjalankan seluruh Quality Gate (Composer + Lint + PHPUnit + Route + Build + Migration)
npm run quality-gate
# atau pada Windows PowerShell:
pwsh scripts/quality-gate.ps1

# Menjalankan PHPUnit Test Suite secara mandiri
./vendor/bin/phpunit

# Menjalankan TypeScript Typecheck & Lint
npm run lint

# Menjalankan Production Frontend Bundle Build
npm run build
```

### Metrik Pengujian Terkini:
- **Total Test**: 135 tests
- **Total Assertions**: 582 assertions
- **Status**: 100% PASSING (0 failed, 0 errors, 0 skipped)

---

## 6. Deployment & CI/CD Pipeline

### Pipeline GitHub Actions
Workflows CI dan CD dipisahkan secara ketat untuk mencegah release yang tidak disengaja:

1. **Continuous Integration (`.github/workflows/ci.yml`)**:
   - Dipicu saat push & pull request ke branch `testing` dan `main`.
   - Menjalankan validasi Composer, PHP syntax lint, test suite PHPUnit, route matrix check, frontend TypeScript lint, bundle build, dan verifikasi Docker build dry-run.
   - Concurrency control aktif (`cancel-in-progress: true`).

2. **Continuous Deployment (`.github/workflows/deploy.yml`)**:
   - Dipicu saat push ke branch `production`, tag release `v*`, atau manual dispatch dengan persetujuan environment.
   - **Push ke branch `testing` diblokir keras dari eksekusi deployment.**
   - Eksekusi aman via SSH action dengan secrets `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`.

### Deployment Kontainer Docker
```bash
# Build dan jalankan container PASARIA
docker compose build pasaria
docker compose up -d pasaria

# Jalankan migrasi di dalam container
docker compose exec pasaria php artisan migrate --force

# Cek status kesehatan container
curl -i http://localhost/up
```

### Rollout Script (`auto-deploy.sh`)
Script rollout produksi menerapkan pencadangan image lama sebelum build dan otomatis melakukan rollback jika health check gagal:
```bash
bash auto-deploy.sh
```

---

## 7. Checklist Kesiapan Produksi & Integrasi Eksternal

| Komponen | Status Implementasi | Kebutuhan Kredensial Produksi |
|---|---|---|
| **Mode Debug** | `APP_DEBUG=false` di `.env` | Wajib dinonaktifkan di environment server |
| **Kunci Enkripsi** | `APP_KEY` unik 32-byte | `php artisan key:generate` |
| **HTTPS / TLS** | HSTS, CSP, X-Frame-Options aktif | Sertifikat SSL (Let's Encrypt / AWS ACM) |
| **CORS / CSRF** | Whitelist `CORS_ALLOWED_ORIGINS` & Sanctum Bearer tokens | Domain domain produksi (`https://pasaria.id`) |
| **Database RDS** | MariaDB + TLS SSL Certificate | CA Bundle: `/etc/ssl/certs/rds-combined-ca-bundle.pem` |
| **Payment Gateway** | Midtrans Driver terintegrasi | `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_MERCHANT_ID` |
| **Object Storage** | S3 / Cloudflare R2 driver didukung | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET` |
| **Email SMTP** | Template verifikasi email siap | `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` |
| **Database Backup** | Prosedur snapshot RDS & mysqldump | Cron backup berkala sebelum migrasi |

---

## 8. Lisensi & Hak Cipta
Hak Cipta © 2026 PASARIA. Seluruh hak cipta dilindungi undang-undang.
