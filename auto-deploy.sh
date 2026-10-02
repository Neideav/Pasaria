#!/bin/bash

set -e

cd /var/www/shopcart

echo "Pulling latest code..."
git pull origin main

echo "Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

echo "Installing/building frontend..."
npm ci
npm run build

echo "Running migrations..."
php artisan migrate --force

echo "Clearing/rebuilding Laravel cache..."
php artisan optimize

echo "Reloading Apache..."
sudo systemctl reload apache2

echo "Deployment complete!"