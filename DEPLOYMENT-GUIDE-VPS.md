# 🚀 Panduan Deploy Next.js ke VPS Hostinger dengan Docker

> Panduan ini dibuat untuk pemula yang belum pernah menggunakan Docker. Semua step dijelaskan dengan bahasa yang mudah dipahami.

---

## 📚 Daftar Isi
1. [Apa itu Docker?](#-apa-itu-docker)
2. [Persiapan Awal](#-persiapan-awal)
3. [Setup VPS Hostinger](#-setup-vps-hostinger)
4. [Install Docker di VPS](#-install-docker-di-vps)
5. [Buat File Docker di Project](#-buat-file-docker-di-project)
6. [Deploy Pertama Kali](#-deploy-pertama-kali)
7. [Update Aplikasi (Seperti Git Pull)](#-update-aplikasi-seperti-git-pull)
8. [Troubleshooting](#-troubleshooting)

---

## 🐳 Apa itu Docker?

**Analogi Sederhana:**
> Bayangkan kamu mau kirim tanaman ke teman. Kalau kirim langsung, tanahnya bisa tumpah, potnya pecah. Tapi kalau kamu taruh dalam **kotak khusus** yang sudah ada tanah, pot, dan penyiramnya, tanaman pasti sampai dengan selamat.

**Docker = Kotak khusus untuk aplikasi kamu.**

- Aplikasi kamu dibungkus dalam "container" beserta semua yang dibutuhkan (Node.js, dependencies, dll)
- Container ini bisa jalan di mana saja (laptop kamu, VPS, cloud) dengan hasil yang sama
- Tidak perlu khawatir "di laptop saya jalan, di server kok error"

### Istilah Penting:
| Istilah | Penjelasan |
|---------|------------|
| **Image** | "Resep" atau "cetakan" aplikasi kamu. Dibuat dari Dockerfile |
| **Container** | Aplikasi yang sedang jalan, dibuat dari Image |
| **Dockerfile** | File berisi instruksi cara membuat Image |
| **docker-compose** | Tool untuk menjalankan beberapa container sekaligus |

---

## ✅ Persiapan Awal

### Yang Kamu Butuhkan:
- [ ] VPS Hostinger (sudah aktif)
- [ ] SSH client (Terminal di Mac/Linux, atau [PuTTY](https://putty.org) di Windows)
- [ ] Git repository (GitHub/GitLab) yang berisi project ini
- [ ] Domain (opsional, untuk akses via domain)

### Info VPS yang Perlu Disiapkan:
```
IP Address VPS: [catat dari Hostinger dashboard]
Username: root (biasanya)
Password: [dari email Hostinger]
```

---

## 🖥️ Setup VPS Hostinger

### Step 1: Login ke VPS via SSH

**Di Terminal (Mac/Linux):**
```bash
ssh root@IP_VPS_KAMU
```

**Di Windows (PuTTY):**
1. Buka PuTTY
2. Host Name: IP VPS kamu
3. Port: 22
4. Klik Open
5. Login dengan username `root` dan password dari Hostinger

### Step 2: Update System
```bash
# Update daftar package
sudo apt update

# Upgrade package yang sudah ada
sudo apt upgrade -y
```

### Step 3: Install Git
```bash
sudo apt install git -y

# Verifikasi
git --version
```

---

## 🐋 Install Docker di VPS

### Step 1: Install Docker

```bash
# Install dependencies
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

# Tambah Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Tambah Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io -y

# Verifikasi Docker jalan
sudo docker run hello-world
```

### Step 2: Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Beri permission
sudo chmod +x /usr/local/bin/docker-compose

# Verifikasi
docker-compose --version
```

### Step 3: (Opsional) Jalankan Docker tanpa sudo

```bash
sudo usermod -aG docker $USER

# Logout dan login lagi supaya efektif
exit
# Lalu SSH lagi
```

---

## 📁 Buat File Docker di Project

Kamu perlu membuat 2 file di project kamu (di folder yang sama dengan `package.json`).

### Step 1: Buat file `Dockerfile`

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build aplikasi
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy environment variables untuk build
# PENTING: Buat file .env.production di VPS nanti
COPY .env.production .env.production

RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Buat user non-root untuk keamanan
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy file yang dibutuhkan
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Step 2: Buat file `docker-compose.yml`

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: clevio-app
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Step 3: Update `next.config.mjs`

Tambahkan `output: 'standalone'` untuk membuat build lebih kecil:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... konfigurasi lainnya
};

export default nextConfig;
```

### Step 4: Buat file `.dockerignore`

```
node_modules
.next
.git
.gitignore
*.md
.env*.local
```

### Step 5: Push ke GitHub

```bash
git add .
git commit -m "Add Docker configuration"
git push origin main
```

---

## 🚀 Deploy Pertama Kali

### Step 1: Clone Repository di VPS

```bash
# Masuk ke folder yang diinginkan
cd /home

# Clone repository
git clone https://github.com/USERNAME/clevio-agent-pro.git

# Masuk ke folder project
cd clevio-agent-pro
```

### Step 2: Buat File Environment

```bash
# Buat file .env.production
nano .env.production
```

Isi dengan environment variables yang dibutuhkan (copy dari `.env.local` dan sesuaikan untuk production):

```env
# Contoh isi .env.production
NEXT_PUBLIC_API_URL=https://api.clevio.ai
NEXT_PUBLIC_APP_URL=https://clevio.ai
# ... dll
```

Simpan dengan `Ctrl + X`, lalu `Y`, lalu `Enter`.

### Step 3: Build dan Jalankan dengan Docker

```bash
# Build image dan jalankan container
docker-compose up -d --build

# Cek apakah container jalan
docker ps

# Lihat logs kalau ada error
docker-compose logs -f
```

### Step 4: Cek Aplikasi

Buka browser dan akses:
```
http://IP_VPS_KAMU:3000
```

🎉 **Selamat! Aplikasi kamu sudah live!**

---

## 🔄 Update Aplikasi (Seperti Git Pull)

Ini bagian yang kamu tanyakan! Untuk update aplikasi, cukup jalankan **script sederhana**.

### Buat Script Update

```bash
# Buat file script
nano /home/clevio-agent-pro/update.sh
```

Isi dengan:

```bash
#!/bin/bash

echo "🔄 Updating Clevio App..."

# Masuk ke folder project
cd /home/clevio-agent-pro

# Pull perubahan terbaru dari GitHub
echo "📥 Pulling latest changes..."
git pull origin main

# Rebuild dan restart container
echo "🔨 Rebuilding container..."
docker-compose up -d --build

# Bersihkan image lama yang tidak terpakai
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Update complete!"
echo "🌐 App is running at http://$(hostname -I | awk '{print $1}'):3000"
```

Beri permission:

```bash
chmod +x /home/clevio-agent-pro/update.sh
```

### Cara Update Aplikasi

Sekarang, **setiap kali kamu push perubahan ke GitHub**, cukup jalankan:

```bash
cd /home/clevio-agent-pro && ./update.sh
```

Atau lebih singkat:

```bash
/home/clevio-agent-pro/update.sh
```

---

## 🔧 Bonus: Auto Deploy dengan GitHub Webhook

> Supaya aplikasi update **otomatis** setiap kamu push ke GitHub.

### Step 1: Install Webhook Server

```bash
# Install webhook
sudo apt install webhook -y
```

### Step 2: Buat Konfigurasi Webhook

```bash
nano /etc/webhook.conf
```

Isi dengan:

```json
[
  {
    "id": "deploy-clevio",
    "execute-command": "/home/clevio-agent-pro/update.sh",
    "command-working-directory": "/home/clevio-agent-pro",
    "response-message": "Deploying...",
    "trigger-rule": {
      "match": {
        "type": "payload-hmac-sha256",
        "secret": "SECRET_KAMU_YANG_AMAN",
        "parameter": {
          "source": "header",
          "name": "X-Hub-Signature-256"
        }
      }
    }
  }
]
```

### Step 3: Jalankan Webhook Server

```bash
# Jalankan webhook
webhook -hooks /etc/webhook.conf -verbose -port 9000 &
```

### Step 4: Setup di GitHub

1. Buka repository di GitHub
2. Settings → Webhooks → Add webhook
3. Payload URL: `http://IP_VPS_KAMU:9000/hooks/deploy-clevio`
4. Content type: `application/json`
5. Secret: Sama dengan yang di webhook.conf
6. Events: Just the push event
7. Save

Sekarang setiap **git push**, aplikasi akan **auto deploy**! 🎉

---

## ❓ Troubleshooting

### Container tidak jalan

```bash
# Lihat status container
docker ps -a

# Lihat logs
docker-compose logs

# Restart container
docker-compose restart
```

### Port 3000 sudah dipakai

```bash
# Cari process yang pakai port 3000
sudo lsof -i :3000

# Kill process tersebut
sudo kill -9 [PID]

# Atau ganti port di docker-compose.yml
ports:
  - "8080:3000"  # Akses via port 8080
```

### Memory/Disk penuh

```bash
# Bersihkan Docker
docker system prune -a

# Cek disk usage
df -h
```

### Permission denied saat git pull

```bash
# Set git safe directory
git config --global --add safe.directory /home/clevio-agent-pro
```

---

## 📋 Cheat Sheet (Ringkasan Perintah)

| Tujuan | Perintah |
|--------|----------|
| Update aplikasi | `./update.sh` |
| Lihat container jalan | `docker ps` |
| Lihat logs | `docker-compose logs -f` |
| Restart container | `docker-compose restart` |
| Stop aplikasi | `docker-compose down` |
| Start aplikasi | `docker-compose up -d` |
| Rebuild aplikasi | `docker-compose up -d --build` |
| Bersihkan Docker | `docker system prune -a` |

---

## 🎓 Kesimpulan

**Workflow kamu sekarang:**

1. **Develop** di laptop → push ke GitHub
2. **SSH** ke VPS → jalankan `./update.sh`
3. **Selesai!** Aplikasi terupdate

Atau kalau sudah setup webhook:

1. **Develop** di laptop → push ke GitHub
2. **Otomatis deploy!** 🚀

---

> 💡 **Tips:** Simpan panduan ini dan praktekkan step by step. Jangan langsung semuanya, mulai dari install Docker dulu, lalu coba deploy, baru setup auto-deploy.

Kalau ada yang bingung, jangan ragu untuk tanya! 😊
