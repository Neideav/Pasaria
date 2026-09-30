# Shopcart - Modern E-Commerce Platform

A clean, modern e-commerce storefront built with Laravel, Blade, Tailwind CSS, and SQLite.
This project is styled after modern high-end consumer retail sites (warm ivory, dark forest emerald `#003d29`, soft rounded corners, unboxed typography, and spacious layouts).

> **Note for Local Educational Demonstration:**
> The backend contains an educational demonstration for SQL Injection on the product search and authentication queries, controlled via the `DEMO_SQLI_MODE` environment variable. The frontend UI remains 100% normal with zero visual indicators, CTF badges, or cybersecurity references.

---

## 1. Docker Deployment Guide (Ubuntu / AWS EC2)

Panduan deployment Shopcart menggunakan Docker & Docker Compose dengan database AWS RDS MariaDB.

### Langkah 1: Persiapan Database di AWS RDS

Install MariaDB client untuk membuat database awal di instance RDS:
```bash
sudo apt update
sudo apt install -y mariadb-client

# Masuk ke RDS MySQL/MariaDB
mysql -h YOUR_RDS_ENDPOINT -P 3306 -u admin -p

# Buat database
CREATE DATABASE database_name;
exit
```

---

### Langkah 2: Instalasi Docker di Server (Ubuntu)

1. **Install dependensi & keyring Docker:**
   ```bash
   sudo apt update
   sudo apt install -y ca-certificates curl
   sudo install -m 0755 -d /etc/apt/keyrings
   sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
   sudo chmod a+r /etc/apt/keyrings/docker.asc
   ```

2. **Tambahkan Docker Repository:**
   ```bash
   sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
   Types: deb
   URIs: https://download.docker.com/linux/ubuntu
   Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
   Components: stable
   Architectures: $(dpkg --print-architecture)
   Signed-By: /etc/apt/keyrings/docker.asc
   EOF
   ```

3. **Install Docker Engine & Docker Compose Plugin:**
   ```bash
   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```

4. **Verifikasi instalasi & beri permission ke user:**
   ```bash
   docker --version
   docker compose version
   sudo usermod -aG docker $USER
   exit  # Log out dan login kembali agar group docker aktif
   ```

---

### Langkah 3: Clone Repository

```bash
docker ps  # pastikan docker berjalan tanpa sudo
sudo mkdir -p /var/www
sudo git clone https://github.com/Neideav/shopcart.git /var/www/shopcart
sudo chown -R ubuntu:ubuntu /var/www/shopcart
cd /var/www/shopcart
```

---

### Langkah 4: Konfigurasi Environment (`.env`)

Salin file template `.env.example` ke `.env`:
```bash
cp .env.example .env
nano .env
```

Pastikan variabel berikut disesuaikan dengan server dan RDS Anda:
```env
APP_NAME="shopcart"
APP_ENV=production
APP_DEBUG=false
APP_KEY=
APP_TIMEZONE=UTC
APP_URL=http://EC2_PUBLIC_IP

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

DB_CONNECTION=mariadb
DB_HOST=YOUR_RDS_ENDPOINT
DB_PORT=3306
DB_DATABASE=database_name
DB_USERNAME=admin
DB_PASSWORD=YOUR_RDS_PASSWORD
MYSQL_ATTR_SSL_CA=/etc/ssl/certs/ca-certificates.crt

SESSION_DRIVER=file
SESSION_LIFETIME=120
CACHE_DRIVER=file

DEMO_SQLI_MODE=true
```

---

### Langkah 5: Build & Jalankan Docker Container

```bash
# Build image Docker (Multi-stage build frontend React + backend Laravel)
docker compose build

# Jalankan container di background
docker compose up -d

# Cek status container
docker compose ps

# (Opsional) Cek log container
docker compose logs -f shopcart
```

**Verifikasi awal container:**
```bash
curl -I http://localhost
# Atau buka browser: http://EC2_PUBLIC_IP
```

---

### Langkah 6: Konfigurasi & Inisialisasi Laravel

Jalankan perintah berikut untuk menginisialisasi aplikasi Laravel di dalam container:

1. **Generate Encryption Key:**
   ```bash
   docker exec -it shopcart bash
   php -v
   php artisan --version
   php artisan about
   php artisan key:generate
   exit
   ```

2. **Jalankan Database Migration & Seeder:**
   ```bash
   docker exec shopcart php artisan migrate --force
   docker exec shopcart php artisan db:seed --force
   ```

3. **Optimasi Cache Laravel untuk Production:**
   ```bash
   docker exec shopcart php artisan config:cache
   docker exec shopcart php artisan route:cache
   docker exec shopcart php artisan view:cache
   docker exec shopcart php artisan config:clear
   docker exec shopcart php artisan config:cache
   ```

---

### Langkah 7: Pengujian & Verifikasi

Uji endpoint API dari terminal atau browser:
```bash
curl http://EC2_PUBLIC_IP/api/products
```
Buka aplikasi melalui web browser: `http://EC2_PUBLIC_IP`

---

## 2. Seeded Demo Accounts

| Role | Username / Email | Password |
|---|---|---|
| Customer | `customer@shopcart.com` or `wadewarren` | `password123` |
| Administrator | `admin@shopcart.com` or `admin` | `admin123` |

---

## 3. SQL Injection Demonstration Guide

Toggle between vulnerable and secure implementations in `.env`:

### MODE A: Intentionally Vulnerable (`DEMO_SQLI_MODE=true`)
When `DEMO_SQLI_MODE=true`, the backend executes raw SQL string concatenation:

1. **Product Search (`/search?q=...`)**
   - Location: `app/Services/StoreQueryService.php` (`searchProducts()`)
   - Code pattern:
     ```php
     // INTENTIONALLY VULNERABLE FOR LOCAL EDUCATIONAL DEMONSTRATION
     $rawQuery = "SELECT * FROM products WHERE (name LIKE '%" . $keyword . "%' OR description LIKE '%" . $keyword . "%') ...";
     $results = DB::select(DB::raw($rawQuery));
     ```
   - Demonstration Payload Example:
     ```text
     ' OR 1=1 #
     ' OR '1'='1' -- 
     ```

2. **Login Query (`/login`)**
   - Location: `app/Services/StoreQueryService.php` (`authenticateUser()`)
   - Code pattern:
     ```php
     // INTENTIONALLY VULNERABLE FOR LOCAL EDUCATIONAL DEMONSTRATION
     $rawQuery = "SELECT * FROM users WHERE (email = '" . $identifier . "' OR username = '" . $identifier . "') AND password = '" . $password . "' LIMIT 1";
     $results = DB::select(DB::raw($rawQuery));
     ```
   - Demonstration Payload Example:
     - Username: `admin'#` atau `admin@shopcart.com'#` (pada MariaDB tanda `#` memotong sisa query tanpa perlu spasi tambahan)
     - Username alternatif: `admin@shopcart.com' -- `
     - Password: `(bebas / sembarang)`

### MODE B: Secure Implementation (`DEMO_SQLI_MODE=false`)
When `DEMO_SQLI_MODE=false`, the backend uses parameterized prepared queries via Eloquent / Query Builder:
- Code pattern:
  ```php
  // SECURE IMPLEMENTATION USING PARAMETERIZED QUERY
  Product::where(function ($query) use ($keyword) {
      $query->where('name', 'LIKE', '%' . $keyword . '%')
            ->orWhere('description', 'LIKE', '%' . $keyword . '%');
  })->get();
  ```
All user input is treated strictly as data literals.

---

## 4. Architecture Overview

```
app/
├── Http/Controllers/
│   ├── HomeController.php      # Catalog & featured collections
│   ├── ProductController.php   # Product detail page & specifications
│   ├── SearchController.php    # Search routing
│   ├── AuthController.php      # Sign in, registration & session
│   ├── CartController.php      # Session-based cart
│   ├── ProfileController.php   # Customer profile
│   └── OrderController.php     # Checkout & orders
├── Models/
│   ├── User.php
│   ├── Product.php
│   ├── Category.php
│   ├── Order.php
│   └── OrderItem.php
└── Services/
    └── StoreQueryService.php   # Search & Auth query handling (Vulnerable vs Secure)

resources/views/
├── layouts/app.blade.php
├── home.blade.php
├── products/show.blade.php
├── search/index.blade.php
├── auth/login.blade.php
├── auth/register.blade.php
├── cart/index.blade.php
├── profile/index.blade.php
└── orders/index.blade.php
```
