# ⚡ Quick Deploy Guide

> Panduan cepat deploy ke VPS. Asumsi: Docker sudah terinstall di VPS.

---

## 🚀 Deploy Pertama Kali

### 1. SSH ke VPS
```bash
ssh root@IP_VPS_KAMU
```

### 2. Clone Repository
```bash
cd /home
git clone https://github.com/USERNAME/clevio-agent-pro.git
cd clevio-agent-pro
```

### 3. Buat File Environment
```bash
nano .env.production
```

Isi dengan environment variables (copy dari `.env.local`, sesuaikan untuk production):
```env
NEXT_PUBLIC_API_URL=https://api.domain-kamu.com
NEXT_PUBLIC_APP_URL=https://domain-kamu.com
# ... variabel lainnya
```

Simpan: `Ctrl + X` → `Y` → `Enter`

### 4. Build & Jalankan
```bash
docker-compose up -d --build
```

### 5. Cek Status
```bash
# Lihat container jalan
docker ps

# Lihat logs
docker-compose logs -f
```

### 6. Akses Aplikasi
```
http://IP_VPS_KAMU:3000
```

---

## 🔄 Update Aplikasi

Setelah push perubahan ke GitHub, jalankan di VPS:

```bash
cd /home/clevio-agent-pro
./update.sh
```

**Selesai!** 🎉

---

## 📋 Perintah Berguna

| Tujuan | Perintah |
|--------|----------|
| Update app | `./update.sh` |
| Lihat status | `docker ps` |
| Lihat logs | `docker-compose logs -f` |
| Restart | `docker-compose restart` |
| Stop | `docker-compose down` |
| Start | `docker-compose up -d` |
| Rebuild | `docker-compose up -d --build` |

---

## ❌ Troubleshooting

**Container error?**
```bash
docker-compose logs
```

**Port 3000 busy?**
```bash
sudo lsof -i :3000
sudo kill -9 [PID]
```

**Disk penuh?**
```bash
docker system prune -a
```
