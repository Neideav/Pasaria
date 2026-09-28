#!/usr/bin/env bash
# =============================================================================
# Shopcart — Deployment Diagnostics Script
# Jalankan di EC2 server: sudo bash diagnose.sh
# =============================================================================

APP_DIR="/var/www/shopcart"
WEB_USER="www-data"
PHP_VER="8.2"

echo "========================================================"
echo "🔍 Shopcart Deployment Diagnostics (React + Laravel + RDS)"
echo "========================================================"
echo ""

# 1. PHP version
echo "--- [1] PHP & Extensions ---"
php -v 2>&1 | head -1
echo ""

# 2. Node.js & npm
echo "--- [2] Node.js & npm ---"
if command -v node &>/dev/null; then
    echo "✅ Node.js: $(node -v)"
    echo "✅ npm    : $(npm -v)"
else
    echo "❌ Node.js / npm TIDAK TERPASANG — jalankan setup-server.sh!"
fi
echo ""

# 3. Apache status
echo "--- [3] Apache2 Status ---"
systemctl is-active apache2 && echo "✅ Apache2 running" || echo "❌ Apache2 NOT running"
echo ""

# 4. Apache modules
echo "--- [4] Apache Modules (rewrite, headers, ssl, php) ---"
apache2ctl -M 2>/dev/null | grep -E "rewrite|headers|ssl|php" | sort
echo ""

# 5. Check .env
echo "--- [5] .env file ---"
if [ -f "$APP_DIR/.env" ]; then
    echo "✅ .env exists"
    echo "   APP_ENV     : $(grep '^APP_ENV=' "$APP_DIR/.env" | cut -d= -f2 || true)"
    echo "   APP_DEBUG   : $(grep '^APP_DEBUG=' "$APP_DIR/.env" | cut -d= -f2 || true)"
    echo "   APP_KEY     : $(grep '^APP_KEY=' "$APP_DIR/.env" | cut -d= -f2 | cut -c1-20 || true)..."
    echo "   APP_URL     : $(grep '^APP_URL=' "$APP_DIR/.env" | cut -d= -f2 || true)"
    echo "   DB_CONN     : $(grep '^DB_CONNECTION=' "$APP_DIR/.env" | cut -d= -f2 || true)"
    echo "   DB_HOST     : $(grep '^DB_HOST=' "$APP_DIR/.env" | cut -d= -f2 || true)"
    echo "   DB_DATABASE : $(grep '^DB_DATABASE=' "$APP_DIR/.env" | cut -d= -f2 || true)"
    echo "   SQLI_MODE   : $(grep '^DEMO_SQLI_MODE=' "$APP_DIR/.env" | cut -d= -f2 || true)"
else
    echo "❌ .env NOT FOUND — laravel tidak bisa jalan!"
fi
echo ""

# 6. React Frontend Build Assets
echo "--- [6] React Frontend Build Assets ---"
if [ -f "$APP_DIR/public/index.html" ]; then
    echo "✅ public/index.html ditemukan (React SPA entry point)"
else
    echo "❌ public/index.html TIDAK ADA — jalankan: npm run build && cp dist/index.html public/"
fi

if [ -d "$APP_DIR/public/assets" ]; then
    ASSET_COUNT=$(ls -1 "$APP_DIR/public/assets" 2>/dev/null | wc -l)
    echo "✅ public/assets/ ada ($ASSET_COUNT files/images)"
else
    echo "❌ public/assets/ TIDAK ADA"
fi
echo ""

# 7. Vendor directory
echo "--- [7] Vendor / Composer ---"
if [ -d "$APP_DIR/vendor" ]; then
    echo "✅ vendor/ ada"
else
    echo "❌ vendor/ TIDAK ADA — jalankan: composer install"
fi
echo ""

# 8. Storage & cache permissions
echo "--- [8] Permissions ---"
check_writable() {
    local dir="$1"
    if [ -d "$dir" ]; then
        if sudo -u "$WEB_USER" test -w "$dir"; then
            echo "   ✅ writable: $dir"
        else
            echo "   ❌ NOT writable: $dir  ← FIX: sudo chown -R www-data:www-data $dir && sudo chmod -R 775 $dir"
        fi
    else
        echo "   ❌ MISSING: $dir"
    fi
}
check_writable "$APP_DIR/storage"
check_writable "$APP_DIR/storage/framework"
check_writable "$APP_DIR/storage/framework/sessions"
check_writable "$APP_DIR/storage/framework/views"
check_writable "$APP_DIR/storage/framework/cache"
check_writable "$APP_DIR/storage/logs"
check_writable "$APP_DIR/bootstrap/cache"
echo ""

# 9. Laravel error log
echo "--- [9] Laravel Error Log (15 baris terakhir) ---"
LOG_FILE="$APP_DIR/storage/logs/laravel.log"
if [ -f "$LOG_FILE" ]; then
    tail -15 "$LOG_FILE"
else
    echo "(log belum ada)"
fi
echo ""

# 10. Apache error log
echo "--- [10] Apache Error Log (15 baris terakhir) ---"
APACHE_LOG="/var/log/apache2/shopcart_error.log"
if [ -f "$APACHE_LOG" ]; then
    tail -15 "$APACHE_LOG"
else
    echo "Log di $APACHE_LOG tidak ada, coba default:"
    tail -15 /var/log/apache2/error.log 2>/dev/null || echo "(apache error log kosong)"
fi
echo ""

# 11. Test database connection dari Laravel
echo "--- [11] Database Connection Test ---"
cd "$APP_DIR" && php artisan db:monitor 2>&1 | head -5 || \
    php artisan migrate:status 2>&1 | head -5 || \
    echo "(tidak bisa test DB dari sini)"
echo ""

# 12. Quick fix one-liner
echo "========================================================"
echo "🔧 Quick Fix Commands:"
echo "========================================================"
echo "  # Build frontend & fix assets:"
echo "  cd $APP_DIR && npm run build && cp -r dist/assets/* public/assets/ && cp dist/index.html public/"
echo ""
echo "  # Fix permissions:"
echo "  sudo chown -R www-data:www-data $APP_DIR/storage $APP_DIR/bootstrap/cache $APP_DIR/public"
echo "  sudo chmod -R 775 $APP_DIR/storage $APP_DIR/bootstrap/cache"
echo ""
echo "  # Re-run full deploy:"
echo "  cd $APP_DIR && bash deploy-aws.sh"
echo "========================================================"
