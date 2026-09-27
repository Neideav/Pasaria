#!/usr/bin/env bash
# =============================================================================
# Shopcart AWS EC2 Deployment & Permissions Script
# =============================================================================
set -e

echo "🚀 Starting Shopcart deployment on AWS EC2..."

# 1. Pastikan file .env ada
if [ ! -f ".env" ]; then
    echo "⚠️  File .env tidak ditemukan. Menyalin dari .env.example..."
    cp .env.example .env
    php artisan key:generate
fi

# 2. Pastikan direktori storage dan cache tersedia
mkdir -p storage/framework/{sessions,views,cache/data} storage/logs bootstrap/cache

# 3. Atur hak akses permission untuk Web Server (Apache2 / Nginx / PHP-FPM)
echo "🔒 Mengatur hak akses storage & cache..."
if command -v id -u www-data >/dev/null 2>&1; then
    sudo chown -R www-data:www-data storage bootstrap/cache
elif command -v id -u nginx >/dev/null 2>&1; then
    sudo chown -R nginx:nginx storage bootstrap/cache
fi
sudo chmod -R 775 storage bootstrap/cache

# 4. Install Composer dependencies (production mode)
if command -v composer >/dev/null 2>&1; then
    echo "📦 Menginstall dependencies..."
    composer install --no-dev --optimize-autoloader --no-interaction
fi

# 5. Jalankan migrasi database ke MariaDB / AWS RDS
echo "🗄️  Menjalankan database migration & seeders..."
php artisan migrate --force --seed

# 6. Bersihkan cache lama agar konfigurasi .env terbaru aktif
echo "⚡ Membersihkan cache Laravel..."
php artisan config:clear
php artisan route:clear
php artisan view:clear

# 7. Konfigurasi Apache2 jika terpasang di sistem
if command -v a2enmod >/dev/null 2>&1; then
    echo "🌐 Mengaktifkan modul Apache2 (rewrite, headers)..."
    sudo a2enmod rewrite headers || true
    if [ -f "apache/shopcart.conf" ] && [ -d "/etc/apache2/sites-available" ]; then
        sudo cp apache/shopcart.conf /etc/apache2/sites-available/shopcart.conf
        sudo a2ensite shopcart.conf || true
        sudo a2dissite 000-default.conf || true
        sudo apache2ctl configtest && sudo systemctl reload apache2 || true
    fi
fi

echo "✅ Deployment selesai! Shopcart siap diakses melalui Apache2 / Web Server."
