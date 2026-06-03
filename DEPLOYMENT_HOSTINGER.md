# 🚀 Deployment Guide: KBS8 System ke VPS Hostinger

**Sistem:** Kubus Teknologi Indonesia (KBS8)  
**Target:** VPS Hostinger (Ubuntu 20.04/22.04)  
**Stack:** FastAPI (Backend) + React (Frontend) + MongoDB  
**Update:** 2024 - Siap Production

---

## 📋 PREREQUISITES

### 1. VPS Hostinger Requirements
- ✅ VPS Hostinger Plan (minimal VPS 1 atau VPS 2)
- ✅ Ubuntu 20.04 LTS atau 22.04 LTS
- ✅ Minimal 2GB RAM
- ✅ Minimal 30GB Storage
- ✅ Root access (SSH)
- ✅ Domain sudah pointing ke VPS IP

### 2. Tools yang Dibutuhkan
- SSH client (Terminal, PuTTY, dll)
- Domain name (contoh: kbs8.kubusteknologi.com)
- MongoDB Atlas account (atau install MongoDB lokal)

---

## 🎯 DEPLOYMENT OVERVIEW

```
┌─────────────────────────────────────────┐
│  User Browser                            │
│  https://yourdomain.com                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Nginx (Reverse Proxy)                   │
│  - Static files serving (React build)    │
│  - Proxy /api/* → Backend                │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│  React App  │  │  FastAPI    │
│  Port 3000  │  │  Port 8001  │
│  (build)    │  │  (uvicorn)  │
└─────────────┘  └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐
                 │  MongoDB    │
                 │  Atlas/Local│
                 └─────────────┘
```

---

## 📦 STEP 1: PERSIAPAN VPS

### 1.1 SSH ke VPS Hostinger

```bash
ssh root@YOUR_VPS_IP
```

Masukkan password yang diberikan Hostinger.

### 1.2 Update System

```bash
apt update && apt upgrade -y
```

### 1.3 Install Dependencies

```bash
# Install Python 3.10+
apt install -y python3.10 python3.10-venv python3-pip

# Install Node.js 18.x (untuk build React)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install Nginx
apt install -y nginx

# Install git
apt install -y git

# Install supervisor (untuk manage processes)
apt install -y supervisor

# Install certbot (untuk SSL)
apt install -y certbot python3-certbot-nginx
```

### 1.4 Verify Instalasi

```bash
python3 --version   # Should be 3.10+
node --version      # Should be v18.x
npm --version       # Should be 9.x+
nginx -v            # Should show nginx version
```

---

## 📂 STEP 2: SETUP PROJECT

### 2.1 Create Deploy User (Security Best Practice)

```bash
# Buat user khusus untuk app (jangan pakai root)
adduser kbs8
usermod -aG sudo kbs8

# Switch ke user kbs8
su - kbs8
```

### 2.2 Clone Repository

```bash
cd /home/kbs8
git clone https://github.com/pandekomangyogaswastika-dot/KBS8.git
cd KBS8
```

**ATAU jika dari local:**

```bash
# Di local machine, rsync ke VPS:
rsync -avz --exclude 'node_modules' --exclude '.git' \
  /path/to/local/KBS8/ \
  kbs8@YOUR_VPS_IP:/home/kbs8/KBS8/
```

---

## 🔧 STEP 3: SETUP BACKEND

### 3.1 Create Virtual Environment

```bash
cd /home/kbs8/KBS8/backend
python3 -m venv venv
source venv/bin/activate
```

### 3.2 Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3.3 Configure Environment Variables

```bash
nano .env
```

**Isi .env:**

```bash
# MongoDB (WAJIB UPDATE!)
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/kbs8?retryWrites=true&w=majority

# JWT Secret (GENERATE BARU!)
JWT_SECRET=YOUR_VERY_LONG_RANDOM_SECRET_HERE_MIN_32_CHARS

# Environment
ENVIRONMENT=production

# CORS (domain Anda)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Backend URL
BACKEND_URL=https://yourdomain.com/api

# Emergent LLM (jika ada)
EMERGENT_LLM_KEY=your_key_if_needed

# Admin default password (GANTI!)
ADMIN_DEFAULT_PASSWORD=ChangeThisPassword123!

# Email config (opsional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# File upload
MAX_UPLOAD_SIZE=10485760
UPLOAD_DIR=/home/kbs8/KBS8/uploads
```

**Generate JWT Secret:**

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3.4 Create Uploads Directory

```bash
mkdir -p /home/kbs8/KBS8/uploads
chmod 755 /home/kbs8/KBS8/uploads
```

### 3.5 Test Backend

```bash
# Aktifkan venv jika belum
source /home/kbs8/KBS8/backend/venv/bin/activate

# Test run
cd /home/kbs8/KBS8/backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001

# Tekan Ctrl+C setelah verify tidak ada error
```

---

## 🎨 STEP 4: SETUP FRONTEND

### 4.1 Install Dependencies

```bash
cd /home/kbs8/KBS8/frontend
npm install
```

### 4.2 Configure Environment

```bash
nano .env
```

**Isi .env:**

```bash
# Backend URL (WAJIB!)
REACT_APP_BACKEND_URL=https://yourdomain.com/api

# Environment
NODE_ENV=production

# Optional: Analytics, etc
# REACT_APP_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

### 4.3 Build Production

```bash
cd /home/kbs8/KBS8/frontend
npm run build
```

Ini akan create folder `build/` dengan static files.

---

## 🔄 STEP 5: SETUP SUPERVISOR (Process Manager)

Supervisor akan menjaga backend tetap running.

### 5.1 Create Supervisor Config

```bash
sudo nano /etc/supervisor/conf.d/kbs8-backend.conf
```

**Isi file:**

```ini
[program:kbs8-backend]
command=/home/kbs8/KBS8/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
directory=/home/kbs8/KBS8/backend
user=kbs8
autostart=true
autorestart=true
stderr_logfile=/var/log/kbs8-backend.err.log
stdout_logfile=/var/log/kbs8-backend.out.log
environment=HOME="/home/kbs8",USER="kbs8"

[program:kbs8-frontend]
command=/usr/bin/python3 -m http.server 3000 --directory /home/kbs8/KBS8/frontend/build
directory=/home/kbs8/KBS8/frontend/build
user=kbs8
autostart=true
autorestart=true
stderr_logfile=/var/log/kbs8-frontend.err.log
stdout_logfile=/var/log/kbs8-frontend.out.log
```

### 5.2 Reload Supervisor

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start kbs8-backend
sudo supervisorctl start kbs8-frontend
```

### 5.3 Verify Running

```bash
sudo supervisorctl status

# Output should show:
# kbs8-backend                     RUNNING   pid 12345, uptime 0:00:05
# kbs8-frontend                    RUNNING   pid 12346, uptime 0:00:05
```

### 5.4 View Logs (jika ada error)

```bash
# Backend logs
tail -f /var/log/kbs8-backend.err.log
tail -f /var/log/kbs8-backend.out.log

# Frontend logs
tail -f /var/log/kbs8-frontend.err.log
```

---

## 🌐 STEP 6: SETUP NGINX (Reverse Proxy)

### 6.1 Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/kbs8
```

**Isi file:**

```nginx
# KBS8 System - Nginx Configuration
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Max upload size (sesuaikan dengan kebutuhan)
    client_max_body_size 10M;

    # Logs
    access_log /var/log/nginx/kbs8-access.log;
    error_log /var/log/nginx/kbs8-error.log;

    # API Backend (FastAPI)
    location /api/ {
        proxy_pass http://localhost:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files dari React build
    location / {
        root /home/kbs8/KBS8/frontend/build;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Uploads folder (jika perlu diakses publik)
    location /uploads/ {
        alias /home/kbs8/KBS8/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

### 6.2 Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/kbs8 /etc/nginx/sites-enabled/

# Remove default site (opsional)
sudo rm /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## 🔒 STEP 7: SETUP SSL (HTTPS)

### 7.1 Install SSL Certificate dengan Certbot

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Ikuti instruksi:
1. Masukkan email untuk notifikasi
2. Setuju terms
3. Pilih opsi redirect HTTP → HTTPS (recommended)

### 7.2 Verify SSL

```bash
# Test SSL
curl -I https://yourdomain.com

# Should return 200 OK
```

### 7.3 Auto-Renewal

Certbot sudah setup auto-renewal. Test dengan:

```bash
sudo certbot renew --dry-run
```

---

## 🗄️ STEP 8: SETUP MONGODB

### Option A: MongoDB Atlas (Recommended)

1. Buka https://cloud.mongodb.com
2. Create free cluster
3. Create database user
4. Whitelist VPS IP atau `0.0.0.0/0` (all IPs)
5. Copy connection string
6. Paste ke `.env` di backend

### Option B: Install MongoDB Local

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
sudo systemctl status mongod

# Update .env
MONGO_URL=mongodb://localhost:27017/kbs8
```

---

## 🔥 STEP 9: INITIAL DATA SEEDING

### 9.1 Create Admin User

```bash
cd /home/kbs8/KBS8/backend
source venv/bin/activate
python3 -c "
from db import get_db
from security import hash_password
import asyncio

async def create_admin():
    db = get_db()
    admin = {
        'id': 'admin-001',
        'email': 'admin@kubusteknologi.com',
        'name': 'System Admin',
        'role': 'admin',
        'password': hash_password('Admin123!'),
        'created_at': '2024-01-01T00:00:00Z',
        'voided': False
    }
    await db.users.update_one(
        {'email': admin['email']},
        {'\$set': admin},
        upsert=True
    )
    print('✅ Admin user created: admin@kubusteknologi.com / Admin123!')

asyncio.run(create_admin())
"
```

### 9.2 Seed Demo Data (Opsional)

Jika ada script seeding:

```bash
cd /home/kbs8/KBS8/backend
source venv/bin/activate
python3 seed_data.py
```

---

## ✅ STEP 10: VERIFICATION & TESTING

### 10.1 Check All Services

```bash
# Supervisor status
sudo supervisorctl status

# Nginx status
sudo systemctl status nginx

# MongoDB status (jika local)
sudo systemctl status mongod
```

### 10.2 Test Endpoints

```bash
# Health check
curl https://yourdomain.com/api/health

# Should return: {"status":"ok"}

# Test login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kubusteknologi.com","password":"Admin123!"}'

# Should return JWT token
```

### 10.3 Test Frontend

Buka browser:
```
https://yourdomain.com
```

Test:
- ✅ Home page loading
- ✅ Login page accessible
- ✅ Login with admin credentials
- ✅ Dashboard accessible
- ✅ Assessment module works
- ✅ No console errors

---

## 🔧 MAINTENANCE & TROUBLESHOOTING

### Restart Services

```bash
# Restart backend only
sudo supervisorctl restart kbs8-backend

# Restart frontend only
sudo supervisorctl restart kbs8-frontend

# Restart all
sudo supervisorctl restart all

# Restart nginx
sudo systemctl restart nginx
```

### View Logs

```bash
# Backend logs
tail -f /var/log/kbs8-backend.err.log

# Frontend logs
tail -f /var/log/kbs8-frontend.err.log

# Nginx access logs
tail -f /var/log/nginx/kbs8-access.log

# Nginx error logs
tail -f /var/log/nginx/kbs8-error.log
```

### Common Issues

#### 1. Backend tidak start
```bash
# Check logs
tail -n 50 /var/log/kbs8-backend.err.log

# Common fixes:
# - Check .env variables
# - Check MongoDB connection
# - Check port 8001 tidak dipakai: lsof -i :8001
```

#### 2. Frontend 404 error
```bash
# Rebuild frontend
cd /home/kbs8/KBS8/frontend
npm run build

# Restart
sudo supervisorctl restart kbs8-frontend
```

#### 3. API calls failing
```bash
# Check CORS settings di backend .env
# Check REACT_APP_BACKEND_URL di frontend .env
# Check nginx proxy_pass configuration
```

#### 4. SSL issues
```bash
# Renew SSL
sudo certbot renew

# Check certificate
sudo certbot certificates
```

---

## 🔄 UPDATING APPLICATION

### Update Backend

```bash
cd /home/kbs8/KBS8
git pull origin main

cd backend
source venv/bin/activate
pip install -r requirements.txt

sudo supervisorctl restart kbs8-backend
```

### Update Frontend

```bash
cd /home/kbs8/KBS8
git pull origin main

cd frontend
npm install
npm run build

sudo supervisorctl restart kbs8-frontend
```

---

## 📊 MONITORING

### Setup Basic Monitoring

```bash
# Install htop
sudo apt install htop

# Monitor resources
htop

# Monitor disk usage
df -h

# Monitor logs in real-time
sudo apt install multitail
multitail /var/log/kbs8-backend.err.log /var/log/nginx/kbs8-error.log
```

---

## 🔐 SECURITY CHECKLIST

- [x] Change default admin password
- [x] Use strong JWT_SECRET
- [x] Enable firewall (UFW)
- [x] Setup SSL/HTTPS
- [x] Restrict MongoDB access
- [x] Regular updates: `apt update && apt upgrade`
- [x] Backup database regularly
- [x] Monitor logs for suspicious activity
- [x] Use non-root user for app
- [x] Set correct file permissions

### Setup Firewall

```bash
# Install UFW
sudo apt install ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 📦 BACKUP STRATEGY

### Database Backup Script

Create `/home/kbs8/backup_db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/kbs8/backups"
mkdir -p $BACKUP_DIR

# MongoDB Atlas (gunakan mongodump dengan connection string)
mongodump --uri="YOUR_MONGO_URI" --out="$BACKUP_DIR/db_$DATE"

# Compress
tar -czf "$BACKUP_DIR/db_$DATE.tar.gz" "$BACKUP_DIR/db_$DATE"
rm -rf "$BACKUP_DIR/db_$DATE"

# Keep only last 7 backups
ls -t $BACKUP_DIR/*.tar.gz | tail -n +8 | xargs rm -f

echo "Backup completed: db_$DATE.tar.gz"
```

```bash
chmod +x /home/kbs8/backup_db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/kbs8/backup_db.sh
```

---

## 🎯 PERFORMANCE OPTIMIZATION

### 1. Enable Nginx Gzip

Edit `/etc/nginx/nginx.conf`, uncomment:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### 2. Setup Redis Cache (Optional)

```bash
sudo apt install redis-server
sudo systemctl enable redis-server

# Update backend to use Redis for caching
```

### 3. Database Indexing

Buat indexes untuk query yang sering:

```javascript
// Di MongoDB shell atau via script
db.users.createIndex({ email: 1 });
db.assessment_sessions.createIndex({ client_id: 1, status: 1 });
db.assessment_answers.createIndex({ session_id: 1 });
```

---

## 📞 SUPPORT

Jika ada masalah saat deployment, cek:
1. Logs di `/var/log/`
2. Supervisor status
3. Nginx config syntax
4. Environment variables di `.env`
5. MongoDB connection string

**Dokumentasi lengkap ada di:** `/app/docs/`

---

## ✅ DEPLOYMENT CHECKLIST

Sebelum go-live, pastikan:

- [ ] Domain sudah pointing ke VPS IP
- [ ] SSL certificate installed (HTTPS works)
- [ ] All services running (`supervisorctl status`)
- [ ] Backend health check returns 200
- [ ] Frontend loads correctly
- [ ] Login works
- [ ] MongoDB connected
- [ ] Admin user created
- [ ] .env configured properly (production values)
- [ ] Firewall enabled
- [ ] Backup script setup
- [ ] Logs monitored
- [ ] Performance tested

---

**🎉 Deployment Complete! KBS8 System siap production di Hostinger VPS!**
