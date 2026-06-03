# 🚀 Fresh Start Deployment - Kubus KBS8 ke VPS Ubuntu 24.04

## Persiapan Awal

### 1. Push Perubahan Terbaru ke GitHub

**Di workspace Emergent ini, jalankan:**

```bash
git add .
git commit -m "feat: production ready - remove emergentintegrations, add Kubus branding"
git push origin main
```

> ✅ **Pastikan push berhasil sebelum lanjut ke VPS!**

---

## Deployment di VPS - Step by Step

### LANGKAH 1: Bersihkan Instalasi Lama (jika ada)

```bash
# Stop semua service yang mungkin berjalan
sudo supervisorctl stop all 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

# Hapus direktori lama
sudo rm -rf /var/www/KBS9

# Hapus konfigurasi nginx lama (jika ada)
sudo rm -f /etc/nginx/sites-enabled/kubus
sudo rm -f /etc/nginx/sites-available/kubus
```

**✅ Checkpoint:** Pastikan tidak ada error. Lanjut ke langkah 2.

---

### LANGKAH 2: Update System & Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y
```

**Tunggu sampai selesai**, lalu:

```bash
# Install dependencies dasar
sudo apt install -y python3-pip python3-venv nginx supervisor git curl
```

**✅ Checkpoint:** Cek instalasi berhasil dengan `python3 --version` dan `nginx -v`

---

### LANGKAH 3: Install Node.js 20.x

```bash
# Download dan install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**Verifikasi:**
```bash
node -v  # Harus muncul v20.x.x
npm -v   # Harus muncul 10.x.x
```

**✅ Checkpoint:** Pastikan Node.js versi 20 terinstall.

---

### LANGKAH 4: Install MongoDB Local

```bash
# Import MongoDB public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update dan install
sudo apt update
sudo apt install -y mongodb-org
```

**Start MongoDB:**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod
```

**✅ Checkpoint:** Status MongoDB harus `active (running)`. Tekan `q` untuk keluar dari status.

---

### LANGKAH 5: Clone Repository

```bash
# Buat direktori
sudo mkdir -p /var/www
cd /var/www

# Clone repo
sudo git clone https://github.com/pandekomangyogaswastika-dot/KBS9.git
sudo chown -R $USER:$USER /var/www/KBS9
cd KBS9
```

**✅ Checkpoint:** Pastikan folder `/var/www/KBS9` ada dan berisi code.

---

### LANGKAH 6: Setup Backend

```bash
cd /var/www/KBS9/backend

# Buat virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

**Buat file .env untuk backend:**
```bash
cat > .env << 'EOF'
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017/kubus_db

# JWT Configuration
JWT_SECRET=kubus-production-secret-change-this-in-production-12345
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://YOUR_VPS_IP

# Server Configuration
HOST=0.0.0.0
PORT=8001
EOF
```

**⚠️ PENTING:** Ganti `YOUR_VPS_IP` dengan IP VPS Anda!

**Test Backend:**
```bash
# Masih di /var/www/KBS9/backend dengan venv aktif
python server.py
```

Biarkan berjalan sebentar, lalu tekan `Ctrl+C` untuk stop. Lihat apakah ada error.

**✅ Checkpoint:** Backend harus bisa jalan tanpa error. Jika ada error, STOP dan share error-nya.

---

### LANGKAH 7: Setup Frontend

**Buka terminal/tab baru** (backend masih jalan di tab lain atau sudah di-stop):

```bash
cd /var/www/KBS9/frontend

# Install dependencies
npm install --legacy-peer-deps
```

**⏳ Proses ini bisa 3-5 menit.**

**Buat file .env untuk frontend:**
```bash
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://YOUR_VPS_IP:8001
REACT_APP_API_URL=http://YOUR_VPS_IP:8001/api
EOF
```

**⚠️ PENTING:** Ganti `YOUR_VPS_IP` dengan IP VPS Anda!

**Build Frontend:**
```bash
npm run build
```

**⏳ Build memakan waktu 2-5 menit.**

**✅ Checkpoint:** Build harus selesai tanpa error dan folder `build/` terbuat.

Cek dengan: `ls -la build/`

---

### LANGKAH 8: Setup Supervisor (Auto-restart Backend)

```bash
sudo tee /etc/supervisor/conf.d/kubus-backend.conf > /dev/null << 'EOF'
[program:kubus-backend]
directory=/var/www/KBS9/backend
command=/var/www/KBS9/backend/venv/bin/python server.py
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/kubus-backend.log
environment=PATH="/var/www/KBS9/backend/venv/bin"
EOF
```

**Reload supervisor:**
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start kubus-backend
sudo supervisorctl status
```

**✅ Checkpoint:** Status `kubus-backend` harus `RUNNING`.

---

### LANGKAH 9: Setup Nginx

**Hapus default config:**
```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

**Buat config Kubus:**
```bash
sudo tee /etc/nginx/sites-available/kubus > /dev/null << 'EOF'
server {
    listen 80;
    server_name YOUR_VPS_IP;

    # Frontend (React build)
    location / {
        root /var/www/KBS9/frontend/build;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static {
        alias /var/www/KBS9/frontend/build/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

**⚠️ PENTING:** Ganti `YOUR_VPS_IP` dengan IP VPS Anda!

**Aktifkan config:**
```bash
sudo ln -s /etc/nginx/sites-available/kubus /etc/nginx/sites-enabled/
sudo nginx -t
```

Jika muncul "syntax is okay" dan "test is successful":

```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

**✅ Checkpoint:** Nginx harus restart tanpa error.

---

### LANGKAH 10: Setup Firewall (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (untuk nanti)
sudo ufw --force enable
sudo ufw status
```

**✅ Checkpoint:** Firewall aktif dan port 80, 443, 22 terbuka.

---

## 🎉 Verifikasi Final

1. **Cek Backend API:**
```bash
curl http://localhost:8001/api/auth/health
```

Harus muncul response JSON.

2. **Cek Frontend:**
Buka browser: `http://YOUR_VPS_IP`

Harus muncul halaman login Kubus.

3. **Cek Logs jika ada masalah:**
```bash
# Backend log
sudo tail -f /var/log/supervisor/kubus-backend.log

# Nginx error log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔧 Troubleshooting Cepat

### Frontend tidak muncul:
```bash
# Cek build folder ada
ls -la /var/www/KBS9/frontend/build

# Cek permission
sudo chown -R www-data:www-data /var/www/KBS9/frontend/build
```

### Backend tidak jalan:
```bash
# Cek log
sudo supervisorctl tail -f kubus-backend

# Restart backend
sudo supervisorctl restart kubus-backend
```

### Nginx error:
```bash
# Cek syntax
sudo nginx -t

# Restart
sudo systemctl restart nginx
```

---

## 📝 Catatan Penting

- **MongoDB URL:** `mongodb://localhost:27017/kubus_db`
- **Backend Port:** `8001`
- **Frontend Port:** `80` (via Nginx)
- **Default Admin:** `admin@kubusteknologi.com` / `Admin123!`

---

## 🚀 Next Steps (Opsional)

1. **Setup Domain & SSL:**
   - Point domain ke IP VPS
   - Install Certbot untuk Let's Encrypt SSL
   - Update Nginx config dengan domain

2. **MongoDB Remote Access (jika perlu):**
   - Setup MongoDB authentication
   - Update firewall untuk port 27017

3. **Monitoring:**
   - Setup log rotation
   - Install monitoring tools (htop, netdata, dll)

---

**Dibuat:** 2025-06-03  
**Untuk:** Kubus Teknologi Indonesia - KBS8 System  
**Platform:** Ubuntu 24.04 LTS VPS
