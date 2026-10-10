# Architecture Decision Record: Rate Limiting Architecture

- **Status**: Proposed
- **Date**: 2026-10-10
- **Author**: Antigravity Assistant

## Context
Aplikasi PASARIA Marketplace berjalan pada stack Laravel 11 dengan API publik dan privat untuk pelanggan, penjual, dan administrator. Saat ini, perlindungan laju permintaan (rate limiting) hanya menggunakan batasan statis seadanya pada kelompok rute autentikasi (`throttle:30,1`) di `routes/api.php`. Tidak ada pembatas global untuk endpoint API lainnya, sehingga katalog produk, validasi voucher, mutasi pesanan, pengunggahan berkas, dan obrolan rentan terhadap scraping, brute-force dictionary attack, dan penolakan layanan (denial of service). Selain itu, `bootstrap/app.php` belum memformat eksepsi 429 ke dalam standar respons JSON PASARIA.

## Decision
Menerapkan arsitektur rate limiting bertingkat menggunakan native `RateLimiter::for()` Laravel 11 yang didaftarkan melalui `App\Providers\AppServiceProvider`, dilengkapi penanganan eksepsi `ThrottleRequestsException` seragam di `bootstrap/app.php`.

### 1. Definisi Named Limiters
Pendaftaran named limiters dikonfigurasikan di `app/Providers/AppServiceProvider.php`:
- `api`: Pembatas dasar untuk semua rute `/api/*`.
  - Tamu: 60 permintaan/menit berdasarkan IP klien.
  - Pengguna login: 120 permintaan/menit berdasarkan user ID.
- `auth-login`: Pembatas rute `POST /api/auth/login`.
  - Kuota: 5 percobaan gagal/menit per kombinasi `identifier (email/username) + IP`.
  - Secondary fallback: 10 percobaan/menit per IP untuk mencegah distributed user-enumeration.
- `auth-register`: Pembatas rute `POST /api/auth/register`.
  - Kuota: 5 pembuatan akun/menit per IP.
- `auth-resend`: Pembatas rute `POST /api/auth/resend-verification`.
  - Kuota: 3 permintaan/menit per email atau IP.
- `vouchers-validate`: Pembatas rute `POST /api/vouchers/validate`.
  - Kuota: 10 validasi/menit per IP atau user ID untuk mencegah enumerasi kode promo.
- `orders-create`: Pembatas rute `POST /api/orders`.
  - Kuota: 10 pembuatan order/menit per akun.
- `uploads`: Pembatas rute `POST /api/upload`.
  - Kuota: 10 pengunggahan berkas/menit per akun.
- `messages-send`: Pembatas rute `POST /api/conversations/messages`.
  - Kuota: 30 pesan/menit per akun.

### 2. Standarisasi Format Error 429
Registrasi handler khusus di `bootstrap/app.php` untuk menangkap `Illuminate\Http\Exceptions\ThrottleRequestsException`:
- HTTP Status: `429 Too Many Requests`.
- Headers: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`.
- Payload JSON:
  ```json
  {
    "success": false,
    "message": "Terlalu banyak permintaan. Silakan tunggu beberapa saat lagi.",
    "retry_after": 60
  }
  ```

### 3. Pemetaan Middleware Rute
Pembaruan rute pada `routes/api.php`:
- Membungkus seluruh rute API di dalam middleware `throttle:api`.
- Menyematkan named throttle khusus pada masing-masing rute sensitif:
  - `POST /auth/login` -> `throttle:auth-login`
  - `POST /auth/register` -> `throttle:auth-register`
  - `POST /auth/resend-verification` -> `throttle:auth-resend`
  - `POST /vouchers/validate` -> `throttle:vouchers-validate`
  - `POST /orders` -> `throttle:orders-create`
  - `POST /upload` -> `throttle:uploads`
  - `POST /conversations/messages` -> `throttle:messages-send`

## Alternatives Considered
1. **Parameter String Langsung pada Rute (`throttle:10,1`)**:
   - Ditolak karena tidak mendukung kunci komposit (`email + IP`), menyulitkan pengujian terisolasi, dan membuat konfigurasi tersebar di berbagai berkas rute.
2. **Middleware Interceptor Kustom**:
   - Ditolak karena menciptakan duplikasi logika redis/cache yang sudah disediakan secara optimal oleh komponen bawaan Laravel 11.

## Consequences
- Keamanan terhadap serangan brute-force, scraping, dan spam chat meningkat signifikan.
- Semua klien API (frontend SPA dan mobile) menerima respons error 429 yang konsisten beserta instruksi waktu tunggu yang jelas.
- Cache driver pada server (database/file/redis) akan menyimpan hit counter dengan key prefix terkelola.

## Verification Plan
1. **Automated Tests**:
   - Membuat berkas pengujian baru `tests/Feature/RateLimitingTest.php`.
   - Menguji respons 429 dan struktur JSON pada rute publik saat kuota terlampaui.
   - Menguji isolasi percobaan login per kombinasi email dan IP.
   - Menguji batasan validasi voucher dan pengunggahan berkas.
   - Memastikan seluruh test suite lama (`./vendor/bin/phpunit`) tetap hijau (135/135 tests lulus).
2. **Frontend Type Check**:
   - Menjalankan `bun run lint` untuk memastikan tidak ada dampak pada kode antarmuka.
