#!/bin/bash
# =====================================================================
# Production Deployment Script for frontend.eclatconnect.com
# =====================================================================
set -e

echo "=========================================================="
echo " Starting Deployment for frontend.eclatconnect.com       "
echo "=========================================================="

# 1. Ensure external Docker network exists (named eclat_network in production)
if ! docker network inspect eclat_network >/dev/null 2>&1; then
  echo "Creating Docker network 'eclat_network'..."
  docker network create eclat_network || true
fi

# 2. Build and launch container
echo "Building and starting container with Docker Compose..."
docker compose up -d --build --remove-orphans

# 3. Connect Caddy to eclat_network if running
if docker ps -qf "name=ihrms-caddy-1" >/dev/null 2>&1; then
  echo "Connecting ihrms-caddy-1 to eclat_network..."
  docker network connect eclat_network ihrms-caddy-1 2>/dev/null || true
fi

# 4. Wait for health check
echo "Waiting 5 seconds for health status..."
sleep 5

# 5. Display status
echo ""
echo "Container Status:"
docker compose ps

echo ""
echo "=========================================================="
echo " Deployment Complete!"
echo " Domain: https://frontend.eclatconnect.com"
echo " Local Container Port: http://127.0.0.1:${PORT:-3090}"
echo "=========================================================="
