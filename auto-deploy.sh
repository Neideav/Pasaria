#!/bin/bash

set -e

cd /var/www/shopcart

echo "Pulling latest code..."
git pull origin main

echo "Building Docker image..."
docker compose build shopcart

echo "Recreating container..."
docker compose up -d --force-recreate shopcart

echo "Cleaning unused Docker images..."
docker image prune -f

echo "Deployment complete!"