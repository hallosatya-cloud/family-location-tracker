#!/bin/bash

# 🚀 Setup Auto-Deploy untuk Family Location Tracker

echo "=========================================="
echo "   AUTO-DEPLOY SETUP untuk Railway"
echo "=========================================="

# Step 1: Dapatkan Railway Token
echo ""
echo "📋 Langkah 1: Dapatkan Railway Token"
echo "   1. Buka: https://railway.app/account/tokens"
echo "   2. Klik 'New Token'"
echo "   3. Beri nama: 'GitHub Actions'"
echo "   4. Copy token yang dihasilkan"
echo ""

read -p "📝 Masukkan Railway Token Anda: " RAILWAY_TOKEN

if [ -z "$RAILWAY_TOKEN" ]; then
    echo "❌ Token tidak boleh kosong!"
    exit 1
fi

# Step 2: Simpan token ke GitHub Secrets
echo ""
echo "📋 Langkah 2: Simpan Token ke GitHub"
echo "   1. Buka: https://github.com/hallosatya-cloud/family-location-tracker/settings/secrets/actions"
echo "   2. Klik 'New repository secret'"
echo "   3. Name: RAILWAY_TOKEN"
echo "   4. Value: $RAILWAY_TOKEN"
echo "   5. Klik 'Add secret'"
echo ""

echo "🔐 Token Anda (copy ini):"
echo "$RAILWAY_TOKEN"
echo ""

# Step 3: Deploy via Railway CLI
echo "📋 Langkah 3: Deploy Awal via Railway"
echo "   Menjalankan: railway login"
echo ""

# Install Railway CLI
npm install -g @railway/cli --legacy-peer-deps

# Login
echo "Silakan login ke Railway..."
npx @railway/cli@latest login

# Init project
echo "Menghubungkan ke Railway..."
npx @railway/cli@latest init

# Deploy
echo "Deploying..."
npx @railway/cli@latest up

echo ""
echo "=========================================="
echo "   ✅ SETUP SELESAI!"
echo "=========================================="
echo ""
echo "🌐 URL Railway akan muncul setelah deployment"
echo ""
echo "📌 Untuk Auto-Deploy Otomatis:"
echo "   1. Pastikan RAILWAY_TOKEN sudah disimpan di GitHub Secrets"
echo "   2. Setiap push ke main akan auto-deploy"
echo ""

