# 🚀 Deployment Todo List - Railway (Full App)

## Status: PERSIAPAN

### Step 1: Dapatkan Railway Token
- [ ] 1.1 Buka: https://railway.app/account/tokens
- [ ] 1.2 Klik **"New Token"**
- [ ] 1.3 Beri nama: **"GitHub Actions"**
- [ ] 1.4 Copy token yang dihasilkan

### Step 2: Simpan Token di GitHub Secrets
- [ ] 2.1 Buka: https://github.com/hallosatya-cloud/family-location-tracker/settings/secrets/actions
- [ ] 2.2 Klik **"New repository secret"**
- [ ] 2.3 Name: `RAILWAY_TOKEN`
- [ ] 2.4 Value: (paste token dari Step 1)
- [ ] 2.5 Klik **"Add secret"**

### Step 3: Push ke GitHub (Trigger Auto-Deploy)
```bash
cd family-tracker
git add .
git commit -m "Enable Railway auto-deploy"
git push origin main
```

### Step 4: Connect Repository di Railway
- [ ] 4.1 Buka: https://railway.app/dashboard
- [ ] 4.2 Klik **"New Project"**
- [ ] 4.3 Pilih **"Deploy from GitHub repo"**
- [ ] 4.4 Pilih: `hallosatya-cloud/family-location-tracker`
- [ ] 4.5 Klik **"Deploy"**

### Step 5: Konfigurasi di Railway
- [ ] 5.1 Buka project yang baru dibuat
- [ ] 5.2 Klik tab **"Variables"**
- [ ] 5.3 Tambah variable: `PORT` = `3000`
- [ ] 5.4 Tambah variable: `NODE_ENV` = `production`

### Step 6: Ambil URL Publik
- [ ] 6.1 Di Railway dashboard, cek bagian **"Domains"**
- [ ] 6.2 Copy URL (contoh: `https://family-location-tracker.railway.app`)
- [ ] 6.3 Klik tombol untuk open di browser

### Step 7: Verifikasi Semua Fitur
- [ ] 7.1 Buka URL di browser
- [ ] 7.2 Test Register sebagai Admin
- [ ] 7.3 Salin kode invite
- [ ] 7.4 Test Register sebagai Anggota Keluarga
- [ ] 7.5 Test Login
- [ ] 7.6 Test Map dan Location Tracking
- [ ] 7.7 Test Screen Sharing

---

## 🔗 Link Penting
- Railway Dashboard: https://railway.app/dashboard
- Railway Tokens: https://railway.app/account/tokens
- GitHub Repo: https://github.com/hallosatya-cloud/family-location-tracker
- GitHub Actions: https://github.com/hallosatya-cloud/family-location-tracker/actions

## ✅ Setelah Deployment
- Setiap push ke `main` akan auto-deploy
- Aplikasi bisa diakses 24/7
- Semua fitur (tracking, login, screen sharing) akan bekerja

