# 🏠 Family Location Tracker

Web aplikasi untuk melacak lokasi anggota keluarga secara real-time dengan fitur screen sharing.

## ✨ Fitur

- 📍 **Real-time Location Tracking** - Lacak lokasi anggota keluarga secara langsung
- 👨‍👩‍👧‍👦 **Family Management** - Sistem keluarga dengan kode invite
- 🖥️ **Screen Sharing** - Berbagi layar antar anggota keluarga
- 📱 **24/7 Tracking** - Tracking berlanjut даже ketika aplikasi ditutup
- 🗺️ **Interactive Map** - Peta interaktif dengan Leaflet (OpenStreetMap)
- 📊 **Location History** - Riwayat pergerakan anggota keluarga

## 🚀 Deployment ke GitHub + Platform Gratis

### 1. Push ke GitHub

```bash
# Buat repository di GitHub.com terlebih dahulu
# Kemudian jalankan:

cd family-tracker
git add .
git commit -m "Initial commit: Family Location Tracker"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY_NAME.git
git push -u origin main
```

### 2. Deploy ke Railway (Gratis)

1. Buka https://railway.app
2. Login dengan GitHub
3. Klik **"New Project"** → **"Deploy from GitHub repo"**
4. Pilih repository ini
5. Railway akan auto-detect Node.js app
6. Tambahkan environment variable `PORT=3000`
7. Klik **"Deploy"**

**URL Publik:** https://your-app.railway.app

### 3. Deploy ke Render (Gratis)

1. Buka https://render.com
2. Login dengan GitHub
3. Klik **"New"** → **"Web Service"**
4. Connect repository GitHub
5. Settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment: `Node`
6. Klik **"Create Web Service"**

**URL Publik:** https://your-app.onrender.com

### 4. Deploy ke Vercel (Gratis + Fast)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

**URL Publik:** https://your-project.vercel.app

### 5. Deploy ke Cyclic (Gratis + Simple)

1. Buka https://cyclic.sh
2. Login dengan GitHub
3. Klik **"Link Your Repo"**
4. Pilih repository ini
5. Otomatis deploy!

**URL Publik:** https://your-app.cyclic.sh

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
git clone https://github.com/USERNAME/REPOSITORY_NAME.git
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
├── server.js          # Backend (Express + Socket.io)
├── package.json       # Dependencies
├── .gitignore
├── README.md
└── public/
    ├── index.html     # Halaman utama
    ├── app.js         # Logic frontend & tracking
    ├── styles.css     # Styling
    └── sw.js          # Service Worker (background sync)
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

- Untuk akses publik, deploy ke Railway/Render/Vercel/Cyclic
- Ngrok memerlukan authtoken untuk akses publik
- Data lokasi disimpan di `data.json` (bisa换成 database production)
- Screen sharing menggunakan WebRTC (peer-to-peer)

## 📄 License

MIT License - Free to use and modify!

