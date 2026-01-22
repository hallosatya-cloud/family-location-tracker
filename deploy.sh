#!/bin/bash

# 🚀 Auto Deploy Script untuk Family Location Tracker
# Deploy ke Railway secara otomatis

echo "🚀 Memulai deployment ke Railway..."

# Install Railway CLI
npm install -g @railway/cli --legacy-peer-deps 2>/dev/null

# Login dan deploy
echo "🔐 Silakan login ke Railway (buka link di bawah):"
npx @railway/cli@latest login

# Init project
echo "📦 Menginisialisasi project di Railway..."
npx @railway/cli@latest init

# Deploy
echo "🚀 Deploying..."
npx @railway/cli@latest up

echo "✅ Deployment selesai!"
echo "🌐 URL publik akan muncul setelah deployment selesai"

