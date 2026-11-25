#!/bin/bash
# =====================================================================
# Production Deployment Script for frontend.eclatconnect.com
# =====================================================================
set -e

echo "=========================================================="
echo " Starting Deployment for frontend.eclatconnect.com       "
echo "=========================================================="

# 1. Clean up any existing conflicting containers
echo "Cleaning up conflicting or old container..."
docker rm -f eclat-frontend 2>/dev/null || true
docker rm -f eclatconnect-frontend 2>/dev/null || true

# 2. Ensure external Docker network exists
if ! docker network inspect eclat-net >/dev/null 2>&1; then
  echo "Creating Docker network 'eclat-net'..."
  docker network create eclat-net || true
fi

# 3. Build and launch container
echo "Building and starting container with Docker Compose..."
docker compose up -d --build --remove-orphans

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
