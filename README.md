# 🏠 Family Location Tracker

Web aplikasi untuk melacak lokasi anggota keluarga secara real-time dengan fitur screen sharing.

## ✨ Fitur

- 📍 **Real-time Location Tracking** - Lacak lokasi anggota keluarga secara langsung
- 👨‍👩‍👧‍👦 **Family Management** - Sistem keluarga dengan kode invite
- 🖥️ **Screen Sharing** - Berbagi layar antar anggota keluarga
- 📱 **24/7 Tracking** - Tracking berlanjut bahkan ketika aplikasi ditutup
- 🗺️ **Interactive Map** - Peta interaktif dengan Leaflet (OpenStreetMap)
- 📊 **Location History** - Riwayat pergerakan anggota keluarga

## 🚀 Deployment ke Railway (Gratis)

Aplikasi ini membutuhkan backend server (Node.js + Socket.io), jadi deploy ke Railway yang support Node.js.

### 1. Push ke GitHub (Jika belum)

```bash
cd family-tracker
git add .
git commit -m "Initial commit: Family Location Tracker"
git branch -M main
git remote add origin https://github.com/hallosatya-cloud/family-location-tracker.git
git push -u origin main
```

### 2. Setup di Railway

1. Buka https://railway.app
2. Login dengan GitHub
3. Klik **"New Project"** → **"Deploy from GitHub repo"**
4. Pilih repository: `hallosatya-cloud/family-location-tracker`
5. Railway akan auto-detect Node.js app
6. Di tab **"Variables"**, tambahkan:
   - `PORT` = `3000`
   - `NODE_ENV` = `production`
7. Klik **"Deploy"**

### 3. Setup GitHub Actions Auto-Deploy

1. Dapatkan Railway Token: https://railway.app/account/tokens
2. Buka: https://github.com/hallosatya-cloud/family-location-tracker/settings/secrets/actions
3. Klik **"New repository secret"**
4. Name: `RAILWAY_TOKEN`
5. Value: (paste token dari langkah 1)
6. Klik **"Add secret"**

**URL Publik:** https://your-app.railway.app

### 4. Auto-Deploy

Setiap kali ada push ke branch `main`, Railway akan auto-deploy. Cek status di:
- GitHub Actions: https://github.com/hallosatya-cloud/family-location-tracker/actions
- Railway Dashboard: https://railway.app/dashboard

---

## 📱 Cara Penggunaan

### Admin (Pembuat Keluarga)
1. Buka aplikasi
2. Klik **"Register"**
3. Pilih **"Admin Keluarga"**
4. Masukkan **"Nama Keluarga Baru"**
5. Klik Register
6. **Salin kode invite** untuk dibagikan ke anggota keluarga

### Anggota Keluarga
1. Buka aplikasi
2. Klik **"Register"**
3. Pilih **"Anggota Keluarga"**
4. Masukkan **"Kode Invite"** dari admin
5. Klik Register
6. Aktifkan **"Berbagi Lokasi Saya"**

### Admin Melacak
1. Login sebagai admin
2. Lihat peta untuk lokasi semua anggota
3. Klik anggota untuk detail lokasi
4. Gunakan **"Screen Sharing"** untuk berbagi layar

## 🛠️ Development Lokal

```bash
# Clone repository
git clone https://github.com/hallosatya-cloud/family-location-tracker.git
cd family-tracker

# Install dependencies
npm install

# Jalankan server lokal
npm start

# Buka http://localhost:3000
```

## 📁 Struktur Project

```
family-tracker/
├── server.js              # Backend (Express + Socket.io)
├── package.json           # Dependencies
├── .gitignore
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions untuk Railway
├── README.md
└── public/
    ├── index.html         # Halaman utama
    ├── app.js             # Logic frontend & tracking
    ├── styles.css         # Styling
    └── sw.js              # Service Worker (background sync)
```

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register user baru |
| POST | `/api/login` | Login user |
| GET | `/api/family/:id/members` | Daftar anggota keluarga |
| GET | `/api/family/:id/all-locations` | Semua lokasi anggota |
| GET | `/api/location/:userId/history` | Riwayat lokasi user |
| GET | `/api/location/:userId/latest` | Lokasi terakhir user |
| POST | `/api/sync-location` | Sync lokasi (background) |

## 📝 Catatan

- Data lokasi disimpan di `data.json` (bisa diganti dengan database production di Railway)
- Screen sharing menggunakan WebRTC (peer-to-peer)
- Railway memberikan gratis 500 jam/bulan untuk hobby plan

## 📄 License

MIT License - Free to use and modify!

