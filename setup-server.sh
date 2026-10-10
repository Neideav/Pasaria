#!/usr/bin/env bash
# =============================================================================
# PASARIA Marketplace — AWS EC2 Ubuntu Fresh Host Setup Script
# =============================================================================
# Jalankan SEKALI saat pertama kali setup server EC2 Ubuntu baru.
# Setelah setup ini selesai, gunakan auto-deploy.sh (Docker) atau deploy-aws.sh.
#
# Cara penggunaan (sebagai ubuntu/root user):
#   chmod +x setup-server.sh
#   sudo bash setup-server.sh
# =============================================================================
set -euo pipefail

PHP_VERSION="8.2"
APP_DIR="/var/www/pasaria"

echo "🔧 PASARIA — AWS EC2 Server Setup"
echo "   PHP Version: $PHP_VERSION"
echo "   App Dir    : $APP_DIR"
echo ""

# ---------------------------------------------------------------------------
# 1. Update sistem & install dependencies
# ---------------------------------------------------------------------------
echo "📦 Update & install sistem dependencies..."
apt-get update -y
apt-get upgrade -y
apt-get install -y \
    apache2 \
    software-properties-common \
    unzip \
    curl \
    git \
    ca-certificates

# ---------------------------------------------------------------------------
# 2. Install PHP 8.2 + extensions yang dibutuhkan Laravel + MariaDB
# ---------------------------------------------------------------------------
echo "🐘 Menginstall PHP $PHP_VERSION..."
add-apt-repository ppa:ondrej/php -y
apt-get update -y
apt-get install -y \
    php${PHP_VERSION} \
    php${PHP_VERSION}-cli \
    php${PHP_VERSION}-fpm \
    php${PHP_VERSION}-mysql \
    php${PHP_VERSION}-pdo \
    php${PHP_VERSION}-mbstring \
    php${PHP_VERSION}-xml \
    php${PHP_VERSION}-bcmath \
    php${PHP_VERSION}-curl \
    php${PHP_VERSION}-zip \
    php${PHP_VERSION}-intl \
    php${PHP_VERSION}-tokenizer \
    libapache2-mod-php${PHP_VERSION}

# ---------------------------------------------------------------------------
# 3. Install Composer
# ---------------------------------------------------------------------------
if ! command -v composer &>/dev/null; then
    echo "🎵 Menginstall Composer..."
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi

# ---------------------------------------------------------------------------
# 4. Install Node.js (v22 LTS) & npm untuk build React SPA
# ---------------------------------------------------------------------------
if ! command -v node &>/dev/null; then
    echo "🟢 Menginstall Node.js 22.x & npm..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

# ---------------------------------------------------------------------------
# 5. Aktifkan modul Apache2 & PHP handler
# ---------------------------------------------------------------------------
echo "🌐 Mengaktifkan modul Apache2 & PHP ${PHP_VERSION}..."
a2dismod mpm_event mpm_worker 2>/dev/null || true
a2enmod mpm_prefork php${PHP_VERSION} rewrite headers
systemctl restart apache2

# ---------------------------------------------------------------------------
# 6. Buat direktori aplikasi & set permissions
# ---------------------------------------------------------------------------
echo "📁 Menyiapkan direktori aplikasi..."
mkdir -p "$APP_DIR"
chown -R www-data:www-data "$APP_DIR"

echo ""
echo "========================================================"
echo "✅ Server setup selesai!"
echo "========================================================"
echo ""
echo "Langkah selanjutnya:"
echo "  1. Clone repository ke $APP_DIR:"
echo "     git clone <your-repo-url> $APP_DIR"
echo ""
echo "  2. Salin dan edit .env:"
echo "     cp $APP_DIR/.env.example $APP_DIR/.env"
echo "     nano $APP_DIR/.env"
echo ""
echo "  3. Jalankan auto-deploy.sh (Docker) atau deploy-aws.sh (Bare Metal)"
echo "========================================================"
