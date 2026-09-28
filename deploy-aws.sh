#!/usr/bin/env bash
# =============================================================================
# Shopcart — AWS EC2 (Ubuntu + Apache2) + RDS MariaDB Deployment Script
# =============================================================================
# Cara penggunaan:
#   1. Upload/git clone repo ke /var/www/shopcart
#   2. Salin .env.example ke .env dan isi variabel DB_HOST, DB_PASSWORD, dll.
#   3. Jalankan: bash deploy-aws.sh
# =============================================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_USER="www-data"

echo "🚀 Shopcart — AWS EC2 Deployment"
echo "📂 App directory: $APP_DIR"

# ---------------------------------------------------------------------------
# 1. Pastikan .env ada
# ---------------------------------------------------------------------------
if [ ! -f "$APP_DIR/.env" ]; then
    echo "⚠️  .env tidak ditemukan — menyalin dari .env.example..."
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    echo "   ✏️  PENTING: Edit .env dan isi DB_HOST, DB_PASSWORD, APP_KEY, dll."
    echo "   Lalu jalankan: php artisan key:generate"
    exit 1
fi

# ---------------------------------------------------------------------------
# 2. Pastikan APP_KEY sudah diset
# ---------------------------------------------------------------------------
if grep -q 'APP_KEY=$\|APP_KEY=base64:yourGenerated' "$APP_DIR/.env"; then
    echo "🔑 Generating application key..."
    php artisan key:generate --force
fi

# ---------------------------------------------------------------------------
# 3. Buat direktori storage & cache yang dibutuhkan
# ---------------------------------------------------------------------------
echo "📁 Menyiapkan direktori storage & cache..."
mkdir -p \
    "$APP_DIR/storage/framework/sessions" \
    "$APP_DIR/storage/framework/views" \
    "$APP_DIR/storage/framework/cache/data" \
    "$APP_DIR/storage/logs" \
    "$APP_DIR/bootstrap/cache"

# ---------------------------------------------------------------------------
# 4. Install PHP dependencies (production, tanpa dev)
# ---------------------------------------------------------------------------
if command -v composer &>/dev/null; then
    echo "📦 Menginstall Composer dependencies (production mode)..."
    composer install \
        --no-dev \
        --optimize-autoloader \
        --no-interaction \
        --working-dir="$APP_DIR"
else
    echo "❌ ERROR: composer tidak ditemukan. Install dulu: https://getcomposer.org"
    exit 1
fi

# ---------------------------------------------------------------------------
# 5. Build React Frontend (Vite)
# ---------------------------------------------------------------------------
if command -v npm &>/dev/null; then
    echo "⚛️  Building React + Vite frontend..."
    cd "$APP_DIR"
    
    # Hapus dist lama jika ada
    rm -rf dist

    # Install npm packages
    echo "   📦 Menginstall npm packages..."
    npm install --no-audit --no-fund

    # Build bundle produksi
    echo "   🔨 Running npm run build..."
    npm run build

    # Salin hasil build React ke public/ agar disajikan oleh Apache2
    if [ -d "$APP_DIR/dist" ]; then
        echo "   📋 Menyalin aset React build ke $APP_DIR/public/..."
        mkdir -p "$APP_DIR/public/assets"
        cp -rf "$APP_DIR/dist/assets/"* "$APP_DIR/public/assets/" 2>/dev/null || true
        cp -f "$APP_DIR/dist/index.html" "$APP_DIR/public/index.html" 2>/dev/null || true
        echo "   ✅ React SPA & assets berhasil dipindahkan ke public/"
    fi
else
    echo "⚠️  WARNING: npm / nodejs tidak ditemukan! Jalankan setup-server.sh terlebih dahulu untuk menginstall Node.js."
fi

# ---------------------------------------------------------------------------
# 6. Jalankan migrasi ke AWS RDS MariaDB
# ---------------------------------------------------------------------------
echo "🗄️  Menjalankan database migrations..."
php "$APP_DIR/artisan" migrate --force

echo "🌱 Menjalankan database seeders..."
php "$APP_DIR/artisan" db:seed --force

# ---------------------------------------------------------------------------
# 7. Set permission untuk Apache2 (www-data)
# ---------------------------------------------------------------------------
echo "🔒 Mengatur file permissions untuk $WEB_USER..."
sudo chown -R "$WEB_USER:$WEB_USER" \
    "$APP_DIR/storage" \
    "$APP_DIR/bootstrap/cache" \
    "$APP_DIR/public"
sudo chmod -R 775 \
    "$APP_DIR/storage" \
    "$APP_DIR/bootstrap/cache"
# Owner file PHP boleh dimiliki current user, tapi readable oleh www-data
sudo find "$APP_DIR" -type f -name "*.php" -exec chmod 644 {} \;
sudo find "$APP_DIR" -type d -exec chmod 755 {} \;
# Restore akses storage & cache ke 775 setelah find
sudo chmod -R 775 "$APP_DIR/storage" "$APP_DIR/bootstrap/cache"

# ---------------------------------------------------------------------------
# 8. Optimize Laravel untuk production
# ---------------------------------------------------------------------------
echo "⚡ Optimizing Laravel untuk production..."
php "$APP_DIR/artisan" config:cache
php "$APP_DIR/artisan" route:cache
php "$APP_DIR/artisan" view:cache

# ---------------------------------------------------------------------------
# 9. Konfigurasi Apache2 Virtual Host
# ---------------------------------------------------------------------------
if command -v a2enmod &>/dev/null; then
    echo "🌐 Mengaktifkan modul Apache2..."
    sudo a2enmod rewrite headers

    VHOST_SRC="$APP_DIR/apache/shopcart.conf"
    VHOST_DEST="/etc/apache2/sites-available/shopcart.conf"

    if [ -f "$VHOST_SRC" ]; then
        echo "📋 Menyalin Apache vhost config..."
        sudo cp "$VHOST_SRC" "$VHOST_DEST"
        sudo a2ensite shopcart.conf
        sudo a2dissite 000-default.conf 2>/dev/null || true

        echo "🔍 Verifikasi konfigurasi Apache..."
        sudo apache2ctl configtest
        sudo systemctl reload apache2
        echo "✅ Apache2 dikonfigurasi dan di-reload."
    else
        echo "⚠️  File $VHOST_SRC tidak ditemukan, skip konfigurasi Apache."
    fi
fi

# ---------------------------------------------------------------------------
# 10. Tampilkan ringkasan
# ---------------------------------------------------------------------------
echo ""
echo "========================================================"
echo "✅ Deployment Shopcart SELESAI!"
echo "========================================================"
echo "   App URL : $(grep '^APP_URL=' "$APP_DIR/.env" | cut -d= -f2 || echo 'http://localhost')"
echo "   DB Host : $(grep '^DB_HOST=' "$APP_DIR/.env" | cut -d= -f2 || echo '127.0.0.1')"
echo "   DB Name : $(grep '^DB_DATABASE=' "$APP_DIR/.env" | cut -d= -f2 || echo 'shopcart')"
echo "   SQLi Mode: $(grep '^DEMO_SQLI_MODE=' "$APP_DIR/.env" | cut -d= -f2 || echo 'true')"
echo ""
echo "   Frontend: React SPA (dist/ -> public/)"
echo "   Backend : Laravel 11 REST API (/api/* -> MariaDB)"
echo "   Akses website melalui Apache2 di port 80."
echo "========================================================"
