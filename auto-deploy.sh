#!/usr/bin/env bash
# =============================================================================
# PASARIA Marketplace — Standard Container Rollout Script (Near-Zero Downtime)
# =============================================================================
# CATATAN ARSITEKTUR TENTANG DOWNTIME:
# Proses restart kontainer tunggal (`docker compose up -d`) memiliki jeda cutover
# singkat (sekitar 2–4 detik) saat kontainer baru mengikat port 80 dan menyelesaikan
# inisialisasi health check. Ini adalah near-zero downtime, BUKAN true zero-downtime
# blue-green. Jangan mengklaim zero-downtime tanpa reverse-proxy rolling multi-node.
# =============================================================================

set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/pasaria}"

if [ ! -d "$DEPLOY_DIR" ]; then
    echo "❌ ERROR: Deployment directory $DEPLOY_DIR does not exist!"
    exit 1
fi

cd "$DEPLOY_DIR"

if [ ! -f "$DEPLOY_DIR/.env" ]; then
    echo "❌ ERROR: .env configuration file not found in $DEPLOY_DIR!"
    exit 1
fi

LOG_FILE="/var/log/pasaria-deploy.log"
exec > >(tee -a "${LOG_FILE:-/dev/null}") 2>&1

echo "=========================================================="
echo "Starting PASARIA Production Rollout: $(date)"
echo "Directory: $(pwd)"
echo "=========================================================="

DEPLOY_BRANCH="${DEPLOY_BRANCH:-production}"
echo "[1/6] Fetching latest release code (${DEPLOY_BRANCH})..."
git fetch origin "$DEPLOY_BRANCH"
git checkout "$DEPLOY_BRANCH"
git pull origin "$DEPLOY_BRANCH"

echo "[2/6] Backing up current container image for rollback..."
docker tag pasaria:latest pasaria:rollback-backup 2>/dev/null || true

echo "[3/6] Building updated production Docker image..."
docker compose build --pull pasaria

echo "[4/6] Executing database migrations safely before traffic cutover..."
docker compose run --rm --no-deps pasaria php artisan migrate --force

echo "[5/6] Performing graceful container recreation..."
docker compose up -d --no-deps --force-recreate pasaria

# Refresh Laravel caches inside the running container
docker compose exec -T pasaria php artisan optimize:clear
docker compose exec -T pasaria php artisan config:cache
docker compose exec -T pasaria php artisan route:cache
docker compose exec -T pasaria php artisan view:cache

echo "[6/6] Verifying container healthcheck endpoint (/up)..."
HEALTHY=false
for i in {1..12}; do
    if docker compose exec -T pasaria curl -sf http://127.0.0.1/up > /dev/null 2>&1; then
        echo "✅ Health check passed on attempt $i."
        HEALTHY=true
        break
    fi
    echo "Waiting for container initialization (attempt $i/12)..."
    sleep 3
done

if [ "$HEALTHY" = false ]; then
    echo "🚨 CRITICAL ERROR: Health check failed! Rollback initiated."
    docker compose logs --tail=100 pasaria
    
    echo "🔄 Rolling back to previous backup image..."
    if docker image inspect pasaria:rollback-backup > /dev/null 2>&1; then
        docker tag pasaria:rollback-backup pasaria:latest
        docker compose up -d --force-recreate pasaria
        echo "⚠️  Rolled back to previous image. Investigate build logs immediately."
    else
        echo "❌ No previous backup image found. Manual intervention required."
    fi
    exit 1
fi

echo "Pruning dangling build artifacts..."
docker image prune -f

echo "=========================================================="
echo "✅ PASARIA Rollout successfully completed: $(date)"
echo "=========================================================="