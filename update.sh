#!/bin/bash

# ===========================================
# 🔄 Clevio App Update Script
# Jalankan script ini untuk update aplikasi
# ===========================================

set -e

echo "========================================"
echo "🔄 Updating Clevio App..."
echo "========================================"

# Masuk ke folder project
cd "$(dirname "$0")"

# Pull perubahan terbaru dari GitHub
echo ""
echo "📥 Step 1: Pulling latest changes from GitHub..."
git pull origin main

# Rebuild dan restart container
echo ""
echo "🔨 Step 2: Rebuilding Docker container..."
docker-compose up -d --build

# Bersihkan image lama yang tidak terpakai
echo ""
echo "🧹 Step 3: Cleaning up old Docker images..."
docker image prune -f

# Tampilkan status
echo ""
echo "========================================"
echo "✅ Update complete!"
echo "========================================"
echo ""
echo "📊 Container Status:"
docker ps --filter "name=clevio-app" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "🌐 App is running at: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "📝 To view logs: docker-compose logs -f"
echo "========================================"
