#!/usr/bin/env bash
# =============================================================================
# Shopcart — Deployment Diagnostics Script
# Jalankan di EC2 server: sudo bash diagnose.sh
# =============================================================================

APP_DIR="/var/www/shopcart"
WEB_USER="www-data"
PHP_VER="8.2"

echo "========================================================"
echo "🔍 Shopcart Deployment Diagnostics"
echo "========================================================"
echo ""

# 1. PHP version
echo "--- [1] PHP ---"
php -v 2>&1 | head -1
echo ""

# 2. Apache status
echo "--- [2] Apache2 Status ---"
systemctl is-active apache2 && echo "✅ Apache2 running" || echo "❌ Apache2 NOT running"
echo ""

# 3. Apache modules
echo "--- [3] Apache Modules (rewrite, headers, ssl) ---"
apache2ctl -M 2>/dev/null | grep -E "rewrite|headers|ssl|php" | sort
echo ""

# 4. Check .env
echo "--- [4] .env file ---"
if [ -f "$APP_DIR/.env" ]; then
    echo "✅ .env exists"
    echo "   APP_ENV   : $(grep '^APP_ENV=' "$APP_DIR/.env" | cut -d= -f2)"
    echo "   APP_DEBUG : $(grep '^APP_DEBUG=' "$APP_DIR/.env" | cut -d= -f2)"
    echo "   APP_KEY   : $(grep '^APP_KEY=' "$APP_DIR/.env" | cut -d= -f2 | cut -c1-20)..."
    echo "   APP_URL   : $(grep '^APP_URL=' "$APP_DIR/.env" | cut -d= -f2)"
    echo "   DB_CONN   : $(grep '^DB_CONNECTION=' "$APP_DIR/.env" | cut -d= -f2)"
    echo "   DB_HOST   : $(grep '^DB_HOST=' "$APP_DIR/.env" | cut -d= -f2)"
    echo "   DB_DATABASE: $(grep '^DB_DATABASE=' "$APP_DIR/.env" | cut -d= -f2)"
else
    echo "❌ .env NOT FOUND — laravel tidak bisa jalan!"
fi
echo ""

# 5. Vendor directory
echo "--- [5] Vendor / Composer ---"
if [ -d "$APP_DIR/vendor" ]; then
    echo "✅ vendor/ ada"
else
    echo "❌ vendor/ TIDAK ADA — jalankan: composer install"
fi
echo ""

# 6. Storage & cache permissions
echo "--- [6] Permissions ---"
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

# 7. Bootstrap cache (compiled config)
echo "--- [7] Bootstrap Cache ---"
ls -la "$APP_DIR/bootstrap/cache/" 2>/dev/null || echo "❌ bootstrap/cache/ kosong atau tidak ada"
echo ""

# 8. Laravel error log
echo "--- [8] Laravel Error Log (20 baris terakhir) ---"
LOG_FILE="$APP_DIR/storage/logs/laravel.log"
if [ -f "$LOG_FILE" ]; then
    tail -20 "$LOG_FILE"
else
    echo "(log belum ada)"
fi
echo ""

# 9. Apache error log
echo "--- [9] Apache Error Log (20 baris terakhir) ---"
APACHE_LOG="/var/log/apache2/shopcart_error.log"
if [ -f "$APACHE_LOG" ]; then
    tail -20 "$APACHE_LOG"
else
    echo "Log di $APACHE_LOG tidak ada, coba:"
    tail -20 /var/log/apache2/error.log 2>/dev/null || echo "(apache error log kosong)"
fi
echo ""

# 10. Test PHP dapat dijalankan oleh Apache
echo "--- [10] PHP-Apache Test ---"
PHP_LOADED=$(apache2ctl -M 2>/dev/null | grep "php")
if [ -n "$PHP_LOADED" ]; then
    echo "✅ PHP module loaded di Apache: $PHP_LOADED"
else
    echo "❌ PHP module TIDAK terdaftar di Apache"
    echo "   Fix: sudo a2enmod php${PHP_VER} && sudo systemctl restart apache2"
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
echo "🔧 Quick Fix Commands (jalankan jika ada error di atas):"
echo "========================================================"
echo ""
echo "  # Fix permissions:"
echo "  sudo chown -R www-data:www-data $APP_DIR/storage $APP_DIR/bootstrap/cache"
echo "  sudo chmod -R 775 $APP_DIR/storage $APP_DIR/bootstrap/cache"
echo ""
echo "  # Enable APP_DEBUG sementara untuk melihat error:"
echo "  sudo sed -i 's/APP_DEBUG=false/APP_DEBUG=true/' $APP_DIR/.env"
echo "  sudo php $APP_DIR/artisan config:clear"
echo "  # (Akses website, lihat error, lalu set balik ke false)"
echo ""
echo "  # Re-run optimize:"
echo "  cd $APP_DIR && php artisan config:cache && php artisan route:cache && php artisan view:cache"
echo ""
echo "  # Restart Apache:"
echo "  sudo systemctl restart apache2"
echo ""
echo "  # Re-run full deploy:"
echo "  cd $APP_DIR && bash deploy-aws.sh"
echo "========================================================"
