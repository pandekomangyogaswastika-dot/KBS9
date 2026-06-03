# 🚀 DEPLOYMENT COMMANDS - Copy Paste Ready!

**Untuk VPS Hostinger - Ubuntu 20.04/22.04**

---

## 🎯 QUICK DEPLOYMENT (Copy-Paste Semua Command!)

### STEP 1: SSH & System Update

```bash
# SSH ke VPS
ssh root@YOUR_VPS_IP
# Masukkan password Hostinger

# Update system
apt update && apt upgrade -y
```

---

### STEP 2: Install Dependencies

**Copy paste semua baris ini sekaligus:**

```bash
# Install Python 3.10
apt install -y python3.10 python3.10-venv python3-pip

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install Nginx, Git, Supervisor
apt install -y nginx git supervisor

# Install Certbot untuk SSL
apt install -y certbot python3-certbot-nginx

# Install tools tambahan
apt install -y curl wget htop ufw net-tools

# Verify instalasi
echo "=== Version Check ==="
python3 --version
node --version
npm --version
nginx -v
```

**Output yang benar:**
```
Python 3.10.x
v18.x.x
9.x.x
nginx version: nginx/1.18.0
```

---

### STEP 3: Create User & Directory

```bash
# Buat user kbs8
adduser kbs8
# Tekan Enter untuk semua prompt (atau isi info yang diminta)
# Set password: (masukkan password untuk user kbs8)

# Add ke sudo group
usermod -aG sudo kbs8

# Create directory structure
mkdir -p /home/kbs8/KBS8
mkdir -p /home/kbs8/KBS8/uploads
mkdir -p /home/kbs8/backups

# Set ownership
chown -R kbs8:kbs8 /home/kbs8
```

---

### STEP 4: Upload Project

**Option A - Via Git (dari GitHub):**

```bash
cd /home/kbs8
sudo -u kbs8 git clone https://github.com/pandekomangyogaswastika-dot/KBS8.git
cd KBS8
```

**Option B - Via rsync (dari local machine):**

```bash
# JALANKAN DI LOCAL MACHINE (bukan di VPS!)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'backend/venv' \
  --exclude 'frontend/build' \
  /path/to/local/KBS8/ \
  root@YOUR_VPS_IP:/home/kbs8/KBS8/

# Kemudian di VPS, set ownership:
chown -R kbs8:kbs8 /home/kbs8/KBS8
```

---

### STEP 5: Setup Backend

```bash
# Masuk ke directory backend
cd /home/kbs8/KBS8/backend

# Create virtual environment
sudo -u kbs8 python3 -m venv venv

# Activate venv & install dependencies
sudo -u kbs8 bash -c "source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.production.txt"

# Create .env file
cat > .env << 'EOF'
# MongoDB Connection (WAJIB UPDATE!)
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/kbs8?retryWrites=true&w=majority

# JWT Secret (WAJIB GENERATE!)
JWT_SECRET=CHANGE_THIS_TO_RANDOM_SECRET_MIN_32_CHARS

# Environment
ENVIRONMENT=production

# CORS (UPDATE DENGAN DOMAIN ANDA!)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Backend URL
BACKEND_URL=https://yourdomain.com/api

# Admin Default
ADMIN_DEFAULT_PASSWORD=Admin123!ChangeThis

# Upload Settings
MAX_UPLOAD_SIZE=10485760
UPLOAD_DIR=/home/kbs8/KBS8/uploads

# AI Integration (OPTIONAL - jika pakai Claude AI)
# ANTHROPIC_API_KEY=your_anthropic_key_here
EOF

# Set permissions
chown kbs8:kbs8 .env
chmod 600 .env

echo "✅ Backend .env created! EDIT FILE INI dengan nano /home/kbs8/KBS8/backend/.env"
```

**Generate JWT Secret:**

```bash
python3 -c "import secrets; print('Generated JWT_SECRET:'); print(secrets.token_urlsafe(32))"
# Copy output dan paste ke .env
```

---

### STEP 6: Setup Frontend

```bash
# Masuk ke directory frontend
cd /home/kbs8/KBS8/frontend

# Install dependencies
sudo -u kbs8 npm install

# Create .env
cat > .env << 'EOF'
# Backend URL (WAJIB UPDATE!)
REACT_APP_BACKEND_URL=https://yourdomain.com/api

# Environment
NODE_ENV=production
EOF

# Set permissions
chown kbs8:kbs8 .env

# Build production
echo "Building frontend... (tunggu 2-5 menit)"
sudo -u kbs8 npm run build

echo "✅ Frontend built!"
```

---

### STEP 7: Setup Supervisor

```bash
# Create backend supervisor config
cat > /etc/supervisor/conf.d/kbs8-backend.conf << 'EOF'
[program:kbs8-backend]
command=/home/kbs8/KBS8/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
directory=/home/kbs8/KBS8/backend
user=kbs8
autostart=true
autorestart=true
stderr_logfile=/var/log/kbs8-backend.err.log
stdout_logfile=/var/log/kbs8-backend.out.log
environment=HOME="/home/kbs8",USER="kbs8"
EOF

# Create frontend supervisor config
cat > /etc/supervisor/conf.d/kbs8-frontend.conf << 'EOF'
[program:kbs8-frontend]
command=/usr/bin/python3 -m http.server 3000 --directory /home/kbs8/KBS8/frontend/build
directory=/home/kbs8/KBS8/frontend/build
user=kbs8
autostart=true
autorestart=true
stderr_logfile=/var/log/kbs8-frontend.err.log
stdout_logfile=/var/log/kbs8-frontend.out.log
EOF

# Reload supervisor
supervisorctl reread
supervisorctl update

# Start services
supervisorctl start kbs8-backend
supervisorctl start kbs8-frontend

# Check status (harus RUNNING)
supervisorctl status
```

**Output yang benar:**
```
kbs8-backend                     RUNNING   pid 12345, uptime 0:00:05
kbs8-frontend                    RUNNING   pid 12346, uptime 0:00:05
```

**Jika ada ERROR, cek log:**
```bash
tail -n 50 /var/log/kbs8-backend.err.log
```

---

### STEP 8: Setup Nginx

**⚠️ GANTI `yourdomain.com` dengan domain ANDA yang sebenarnya!**

```bash
# Set domain variable
DOMAIN="yourdomain.com"  # GANTI INI!

# Create nginx config
cat > /etc/nginx/sites-available/kbs8 << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 10M;

    access_log /var/log/nginx/kbs8-access.log;
    error_log /var/log/nginx/kbs8-error.log;

    # API Backend
    location /api/ {
        proxy_pass http://localhost:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location / {
        root /home/kbs8/KBS8/frontend/build;
        try_files \$uri \$uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Uploads
    location /uploads/ {
        alias /home/kbs8/KBS8/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/kbs8 /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test config
nginx -t

# Reload nginx
systemctl reload nginx

echo "✅ Nginx configured untuk domain: $DOMAIN"
```

---

### STEP 9: Setup SSL (HTTPS)

**⚠️ PASTIKAN domain sudah pointing ke VPS IP!**

```bash
# Set variables (GANTI INI!)
DOMAIN="yourdomain.com"           # GANTI!
EMAIL="your-email@example.com"    # GANTI!

# Install SSL certificate
certbot --nginx \
  -d $DOMAIN \
  -d www.$DOMAIN \
  --non-interactive \
  --agree-tos \
  --email $EMAIL \
  --redirect

# Test SSL
curl -I https://$DOMAIN
```

**Output yang benar:**
```
HTTP/2 200
server: nginx
...
```

---

### STEP 10: Setup Firewall

```bash
# Enable & configure UFW
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS

# Check status
ufw status numbered

echo "✅ Firewall configured!"
```

---

### STEP 11: Create Admin User

```bash
cd /home/kbs8/KBS8/backend

# Create script
cat > create_admin.py << 'PYEOF'
import asyncio
from db import get_db
from security import hash_password
from core_utils import now_iso

async def create_admin():
    db = get_db()
    admin = {
        'id': 'admin-001',
        'email': 'admin@kubusteknologi.com',
        'name': 'System Admin',
        'role': 'admin',
        'password': hash_password('Admin123!'),
        'created_at': now_iso(),
        'voided': False
    }
    await db.users.update_one(
        {'email': admin['email']},
        {'$set': admin},
        upsert=True
    )
    print('✅ Admin user created!')
    print('Email: admin@kubusteknologi.com')
    print('Password: Admin123!')
    print('⚠️  CHANGE PASSWORD after first login!')

if __name__ == '__main__':
    asyncio.run(create_admin())
PYEOF

# Run script
sudo -u kbs8 bash -c "source venv/bin/activate && python3 create_admin.py"

echo "✅ Admin user created!"
```

---

### STEP 12: Final Verification

```bash
# Check all services
echo "=== Services Status ==="
supervisorctl status

echo ""
echo "=== Nginx Status ==="
systemctl status nginx --no-pager | head -5

echo ""
echo "=== Listening Ports ==="
netstat -tlnp | grep -E ':(80|443|8001|3000)'

echo ""
echo "=== Test Backend Health ==="
curl http://localhost:8001/api/health

echo ""
echo "=== Test Frontend ==="
curl -I http://localhost:3000
```

---

## ✅ EDIT CONFIGURATION FILES

### Edit Backend .env

```bash
nano /home/kbs8/KBS8/backend/.env
```

**Yang WAJIB diupdate:**
```bash
# 1. MongoDB URL (dari MongoDB Atlas)
MONGO_URL=mongodb+srv://USER:PASS@cluster.mongodb.net/kbs8?retryWrites=true&w=majority

# 2. JWT Secret (generate dengan command di atas)
JWT_SECRET=<paste_generated_secret_here>

# 3. Domain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
BACKEND_URL=https://yourdomain.com/api

# 4. Admin password (opsional, akan diganti setelah login)
ADMIN_DEFAULT_PASSWORD=YourSecurePassword123!
```

Tekan `Ctrl+X`, lalu `Y`, lalu `Enter` untuk save.

---

### Edit Frontend .env

```bash
nano /home/kbs8/KBS8/frontend/.env
```

**Yang WAJIB diupdate:**
```bash
# Domain backend
REACT_APP_BACKEND_URL=https://yourdomain.com/api
```

Tekan `Ctrl+X`, lalu `Y`, lalu `Enter` untuk save.

---

### Rebuild Frontend (setelah edit .env)

```bash
cd /home/kbs8/KBS8/frontend
sudo -u kbs8 npm run build
```

---

### Restart Services (setelah edit config)

```bash
supervisorctl restart all
systemctl reload nginx
```

---

## 🧪 TESTING

### Test Backend API

```bash
# Health check
curl https://yourdomain.com/api/health

# Should return: {"status":"healthy"}
```

### Test Login

```bash
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kubusteknologi.com","password":"Admin123!"}'

# Should return JWT token
```

### Test Frontend

Buka browser: `https://yourdomain.com`

**Test checklist:**
- [ ] Homepage loads
- [ ] No console errors (F12)
- [ ] Login page accessible
- [ ] Login dengan admin works
- [ ] Dashboard loads
- [ ] Assessment module accessible

---

## 🔧 MAINTENANCE COMMANDS

### View Logs

```bash
# Backend errors
tail -f /var/log/kbs8-backend.err.log

# Nginx errors
tail -f /var/log/nginx/kbs8-error.log

# Both together
multitail /var/log/kbs8-backend.err.log /var/log/nginx/kbs8-error.log
```

### Restart Services

```bash
# Restart backend only
supervisorctl restart kbs8-backend

# Restart frontend only
supervisorctl restart kbs8-frontend

# Restart all
supervisorctl restart all

# Restart nginx
systemctl restart nginx
```

### Check Status

```bash
# All services
supervisorctl status

# Nginx
systemctl status nginx

# Ports
netstat -tlnp | grep -E ':(80|443|8001|3000)'
```

---

## 🐛 TROUBLESHOOTING

### Backend Won't Start

```bash
# Check logs
tail -n 100 /var/log/kbs8-backend.err.log

# Common issues:
# 1. MongoDB connection → Check MONGO_URL in .env
# 2. Port conflict → lsof -i :8001
# 3. Missing dependencies → cd backend && source venv/bin/activate && pip install -r requirements.production.txt
```

### Frontend 404 Errors

```bash
# Rebuild frontend
cd /home/kbs8/KBS8/frontend
sudo -u kbs8 npm run build
supervisorctl restart kbs8-frontend
```

### API Calls Failing (CORS)

```bash
# Check backend .env
cat /home/kbs8/KBS8/backend/.env | grep ALLOWED_ORIGINS

# Should include your domain!

# Check frontend .env
cat /home/kbs8/KBS8/frontend/.env | grep BACKEND_URL

# Should be: https://yourdomain.com/api

# Restart backend
supervisorctl restart kbs8-backend
```

### SSL Issues

```bash
# Renew certificate
certbot renew

# Force renew
certbot renew --force-renewal

# Check certificate
certbot certificates
```

---

## 📦 UPDATE APPLICATION

```bash
# Pull latest code
cd /home/kbs8/KBS8
sudo -u kbs8 git pull origin main

# Update backend
cd backend
sudo -u kbs8 bash -c "source venv/bin/activate && pip install -r requirements.production.txt"
supervisorctl restart kbs8-backend

# Update frontend
cd ../frontend
sudo -u kbs8 npm install
sudo -u kbs8 npm run build
supervisorctl restart kbs8-frontend

echo "✅ Application updated!"
```

---

## 🎉 DEPLOYMENT COMPLETE!

**Access your application:**
```
https://yourdomain.com
```

**Login credentials:**
```
Email: admin@kubusteknologi.com
Password: Admin123!
```

**⚠️ IMPORTANT: Change admin password immediately after first login!**

---

## 📞 NEED HELP?

**Check documentation:**
- `/app/DEPLOYMENT_HOSTINGER.md` - Full guide
- `/app/README.md` - System overview

**Common commands:**
```bash
# Status check
supervisorctl status

# View logs
tail -f /var/log/kbs8-backend.err.log

# Restart all
supervisorctl restart all
```

---

**🚀 Happy deploying!**
