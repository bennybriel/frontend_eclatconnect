#!/bin/bash
# =====================================================================
# Production Deployment Script for frontend.eclatconnect.com
# =====================================================================
set -e

echo "=========================================================="
echo " Starting Deployment for frontend.eclatconnect.com       "
echo "=========================================================="

TARGET_PORT="${PORT:-3090}"

# 1. Stop any container currently binding port 3090 to avoid "port is already allocated"
echo "Checking if port ${TARGET_PORT} is in use by another container..."
OLD_PORT_CONTAINERS=$(docker ps -q --filter "publish=${TARGET_PORT}" 2>/dev/null || true)
if [ -n "$OLD_PORT_CONTAINERS" ]; then
  echo "Stopping container(s) holding port ${TARGET_PORT}: $OLD_PORT_CONTAINERS"
  docker stop $OLD_PORT_CONTAINERS || true
fi

# 2. Disable auto-restart on legacy/test containers so VPS reboots don't resurrect them
echo "Disabling auto-restart on legacy containers..."
docker stop eclat-frontend-test 2>/dev/null || true
docker update --restart=no eclat-frontend-test 2>/dev/null || true
docker stop eclat-frontend 2>/dev/null || true
docker update --restart=no eclat-frontend 2>/dev/null || true

# 3. Ensure external Docker network exists (named eclat_network in production)
if ! docker network inspect eclat_network >/dev/null 2>&1; then
  echo "Creating Docker network 'eclat_network'..."
  docker network create eclat_network || true
fi

# 4. Stop any existing container for this project and force-recreate
echo "Stopping any stale container in this project..."
docker compose down --remove-orphans 2>/dev/null || true

echo "Building and starting container with Docker Compose..."
docker compose up -d --build --force-recreate

# 5. Connect Caddy to eclat_network if running
if docker ps -qf "name=ihrms-caddy-1" >/dev/null 2>&1; then
  echo "Connecting ihrms-caddy-1 to eclat_network..."
  docker network connect eclat_network ihrms-caddy-1 2>/dev/null || true
fi

# 6. Wait for health check
echo "Waiting 5 seconds for health status..."
sleep 5

# 7. Display status
echo ""
echo "Container Status:"
docker compose ps

echo ""
echo "=========================================================="
echo " Deployment Complete!"
echo " Domain: https://frontend.eclatconnect.com"
echo " Local Container Port: http://127.0.0.1:${TARGET_PORT}"
echo "=========================================================="
