#!/usr/bin/env bash
# =========================================================
# PASARIA Marketplace — Production Zero-Downtime Deploy Script
# =========================================================

set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/pasaria}"
if [ ! -d "$DEPLOY_DIR" ] && [ -d "/var/www/shopcart" ]; then
    DEPLOY_DIR="/var/www/shopcart"
fi

cd "$DEPLOY_DIR"

LOG_FILE="/var/log/pasaria-deploy.log"
exec > >(tee -a "${LOG_FILE:-/dev/null}") 2>&1

echo "=========================================="
echo "Starting PASARIA Deployment: $(date)"
echo "Directory: $(pwd)"
echo "=========================================="

DEPLOY_BRANCH="${DEPLOY_BRANCH:-production}"
echo "[1/6] Pulling latest repository code (${DEPLOY_BRANCH})..."
git pull origin "$DEPLOY_BRANCH"

echo "[2/6] Building production Docker container..."
docker compose build pasaria

echo "[3/6] Starting container..."
docker compose up -d --force-recreate pasaria

echo "[4/6] Executing database migrations safely..."
docker compose exec -T pasaria php artisan migrate --force

echo "[5/6] Optimizing Laravel caches..."
docker compose exec -T pasaria php artisan optimize:clear
docker compose exec -T pasaria php artisan config:cache
docker compose exec -T pasaria php artisan route:cache
docker compose exec -T pasaria php artisan view:cache

echo "[6/6] Verifying health check endpoint (/up)..."
HEALTHY=false
for i in {1..10}; do
    if docker compose exec -T pasaria curl -sf http://localhost/up > /dev/null 2>&1; then
        echo "Health check passed on attempt $i."
        HEALTHY=true
        break
    fi
    echo "Waiting for container startup (attempt $i/10)..."
    sleep 3
done

if [ "$HEALTHY" = false ]; then
    echo "ERROR: Health check failed! Check docker logs."
    docker compose logs --tail=50 pasaria
    exit 1
fi

echo "Cleaning unused Docker images..."
docker image prune -f

echo "=========================================="
echo "PASARIA Deployment successfully finished! $(date)"
echo "=========================================="