# Shopcart - Modern E-Commerce Platform

A clean, modern e-commerce storefront built with Laravel, Blade, Tailwind CSS, and SQLite.
This project is styled after modern high-end consumer retail sites (warm ivory, dark forest emerald `#003d29`, soft rounded corners, unboxed typography, and spacious layouts).

> **Note for Local Educational Demonstration:**
> The backend contains an educational demonstration for SQL Injection on the product search and authentication queries, controlled via the `DEMO_SQLI_MODE` environment variable. The frontend UI remains 100% normal with zero visual indicators, CTF badges, or cybersecurity references.

---

## 1. Quick Start Guide

### Requirements
- PHP >= 8.2 (dengan ekstensi `pdo_mysql`, `mbstring`, `bcmath`, `curl`)
- Composer
- MariaDB Server >= 10.5 (atau AWS RDS MariaDB) / SQLite3

### Installation Steps

1. **Install Dependencies**
   ```bash
   composer install --optimize-autoloader --no-dev
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. **Database Setup (MariaDB / AWS RDS)**
   Buat database di MariaDB:
   ```sql
   CREATE DATABASE shopcart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'shopcart_user'@'%' IDENTIFIED BY 'shopcart_password_123';
   GRANT ALL PRIVILEGES ON shopcart.* TO 'shopcart_user'@'%';
   FLUSH PRIVILEGES;
   ```

   Sesuaikan variabel di `.env`:
   ```env
   DB_CONNECTION=mariadb
   DB_HOST=127.0.0.1 # atau Endpoint AWS RDS (contoh: xxx.rds.amazonaws.com)
   DB_PORT=3306
   DB_DATABASE=shopcart
   DB_USERNAME=shopcart_user
   DB_PASSWORD=shopcart_password_123
   ```

   Jalankan migrasi dan seeder:
   ```bash
   php artisan migrate:fresh --seed
   ```

4. **Apache2 Web Server Setup (AWS EC2 / Linux Ubuntu)**
   Install Apache2 dan modul PHP:
   ```bash
   sudo apt update
   sudo apt install -y apache2 libapache2-mod-php8.2 php8.2-mysql php8.2-curl php8.2-xml php8.2-mbstring php8.2-zip unzip
   ```

   Aktifkan modul `rewrite` dan `headers`:
   ```bash
   sudo a2enmod rewrite headers
   ```

   Salin konfigurasi VirtualHost dari `apache/shopcart.conf`:
   ```bash
   sudo cp apache/shopcart.conf /etc/apache2/sites-available/shopcart.conf
   sudo a2ensite shopcart.conf
   sudo a2dissite 000-default.conf
   sudo apache2ctl configtest
   sudo systemctl restart apache2
   ```

5. **Alternatif: Nginx Web Server**
   Jika menggunakan Nginx, file konfigurasi tersedia di `nginx/shopcart.conf`.

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
