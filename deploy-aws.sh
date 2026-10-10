#!/usr/bin/env bash
# =============================================================================
# PASARIA Marketplace — AWS EC2 Bare-Metal (Ubuntu + Apache2) Rollout Script
# =============================================================================
# Gunakan script ini untuk deployment langsung pada host Ubuntu tanpa Docker.
# (Untuk deployment berbasis kontainer, gunakan auto-deploy.sh).
#
# Prasyarat:
#   1. setup-server.sh sudah dijalankan
#   2. Repository berada di /var/www/pasaria
#   3. .env sudah dikonfigurasi dengan kredensial produksi yang valid
# =============================================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_USER="www-data"

echo "========================================================"
echo "🚀 PASARIA Marketplace — Bare-Metal Rollout: $(date)"
echo "📂 App directory: $APP_DIR"
echo "========================================================"

# ---------------------------------------------------------------------------
# 1. Pastikan .env ada
# ---------------------------------------------------------------------------
if [ ! -f "$APP_DIR/.env" ]; then
    echo "❌ ERROR: .env tidak ditemukan di $APP_DIR!"
    echo "   Salin .env.example ke .env dan isi kredensial produksi."
    exit 1
fi

# ---------------------------------------------------------------------------
# 2. Pastikan APP_KEY sudah diset
# ---------------------------------------------------------------------------
if grep -q 'APP_KEY=$\|APP_KEY=base64:yourGenerated' "$APP_DIR/.env"; then
    echo "🔑 Generating application key..."
    php "$APP_DIR/artisan" key:generate --force
fi

# ---------------------------------------------------------------------------
# 3. Buat direktori storage & cache yang dibutuhkan
# ---------------------------------------------------------------------------
echo "📁 Menyiapkan direktori storage & cache..."
mkdir -p \
    "$APP_DIR/storage/framework/sessions" \
    "$APP_DIR/storage/framework/views" \
    "$APP_DIR/storage/framework/cache/data" \
    "$APP_DIR/storage/app/public" \
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
        --prefer-dist \
        --working-dir="$APP_DIR"
else
    echo "❌ ERROR: composer tidak ditemukan."
    exit 1
fi

# ---------------------------------------------------------------------------
# 5. Build React Frontend (Vite)
# ---------------------------------------------------------------------------
if command -v npm &>/dev/null; then
    echo "⚛️  Building React 19 + Vite frontend..."
    cd "$APP_DIR"
    
    rm -rf dist
    npm ci --legacy-peer-deps || npm install --no-audit --no-fund
    npm run build

    # Salin seluruh hasil build React ke public/ agar disajikan oleh Apache2
    if [ -d "$APP_DIR/dist" ]; then
        echo "📋 Menyalin aset React build ke $APP_DIR/public/..."
        cp -rf "$APP_DIR/dist/"* "$APP_DIR/public/"
        echo "✅ React SPA & assets berhasil disalin ke public/"
    fi
else
    echo "❌ ERROR: Node.js / npm tidak ditemukan."
    exit 1
fi

# ---------------------------------------------------------------------------
# 6. Storage Symlink
# ---------------------------------------------------------------------------
if [ ! -L "$APP_DIR/public/storage" ]; then
    echo "🔗 Membuat storage link..."
    php "$APP_DIR/artisan" storage:link --quiet || true
fi

# ---------------------------------------------------------------------------
# 7. Jalankan database migrations
# ---------------------------------------------------------------------------
echo "🗄️  Menjalankan database migrations..."
php "$APP_DIR/artisan" migrate --force

if [ "${RUN_SEEDERS:-false}" = "true" ]; then
    echo "🌱 Menjalankan database seeders (RUN_SEEDERS=true)..."
    php "$APP_DIR/artisan" db:seed --force
fi

# ---------------------------------------------------------------------------
# 8. Set permission untuk Apache2 (www-data)
# ---------------------------------------------------------------------------
echo "🔒 Mengatur file permissions untuk $WEB_USER..."
sudo chown -R "$WEB_USER:$WEB_USER" \
    "$APP_DIR/storage" \
    "$APP_DIR/bootstrap/cache" \
    "$APP_DIR/public"
sudo chmod -R 775 \
    "$APP_DIR/storage" \
    "$APP_DIR/bootstrap/cache"

# ---------------------------------------------------------------------------
# 9. Optimize Laravel untuk production
# ---------------------------------------------------------------------------
echo "⚡ Optimizing Laravel caches untuk production..."
php "$APP_DIR/artisan" optimize:clear
php "$APP_DIR/artisan" config:cache
php "$APP_DIR/artisan" route:cache
php "$APP_DIR/artisan" view:cache

# ---------------------------------------------------------------------------
# 10. Konfigurasi Apache2 Virtual Host
# ---------------------------------------------------------------------------
if command -v a2enmod &>/dev/null; then
    VHOST_SRC="$APP_DIR/apache/pasaria.conf"
    VHOST_DEST="/etc/apache2/sites-available/pasaria.conf"

    if [ -f "$VHOST_SRC" ]; then
        echo "📋 Mengonfigurasi Apache vhost..."
        sudo cp "$VHOST_SRC" "$VHOST_DEST"
        sudo a2ensite pasaria.conf
        sudo a2dissite 000-default.conf 2>/dev/null || true
        sudo apache2ctl configtest
        sudo systemctl reload apache2
        echo "✅ Apache2 dikonfigurasi dan di-reload."
    fi
fi

# ---------------------------------------------------------------------------
# 11. Health Check Verification
# ---------------------------------------------------------------------------
echo "🔍 Memverifikasi endpoint health check (/up)..."
HEALTH_OK=false
for i in {1..5}; do
    if curl -sf http://127.0.0.1/up > /dev/null 2>&1; then
        echo "✅ Health check passed pada percobaan $i."
        HEALTH_OK=true
        break
    fi
    sleep 2
done

if [ "$HEALTH_OK" = false ]; then
    echo "⚠️  PERINGATAN: Health check lokal belum merespons status 200 pada http://127.0.0.1/up."
    echo "   Periksa error log di $APP_DIR/storage/logs/laravel.log dan /var/log/apache2/pasaria_error.log."
fi

echo ""
echo "========================================================"
echo "✅ Rollout PASARIA Selesai!"
echo "========================================================"
echo "   App URL : $(grep '^APP_URL=' "$APP_DIR/.env" | cut -d= -f2 || echo 'http://localhost')"
echo "   DB Host : $(grep '^DB_HOST=' "$APP_DIR/.env" | cut -d= -f2 || echo '127.0.0.1')"
echo "   DB Name : $(grep '^DB_DATABASE=' "$APP_DIR/.env" | cut -d= -f2 || echo 'pasaria')"
echo "========================================================"
