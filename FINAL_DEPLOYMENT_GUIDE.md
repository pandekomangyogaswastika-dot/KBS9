# 🚀 KBS8 Production Deployment - Clean & Tested Guide

**Target:** VPS Hostinger Ubuntu 24.04 LTS  
**Status:** ✅ Ready for Production  
**Last Updated:** 2024-06-03

---

## 📋 PRE-DEPLOYMENT CHECKLIST

**Sebelum mulai, pastikan:**
- [ ] VPS Hostinger Ubuntu 24.04 LTS (minimal 2GB RAM)
- [ ] SSH root access
- [ ] Backup data existing (jika ada)
- [ ] Waktu: ~30-45 menit

**Tidak perlu:**
- ❌ Domain (bisa pakai IP dulu)
- ❌ MongoDB Atlas (pakai local)
- ❌ SSL/HTTPS (setup nanti setelah punya domain)

---

## 🎯 DEPLOYMENT OVERVIEW

```
1. System Setup (5 min)
2. Install Dependencies (10 min)
3. Clone & Setup Project (10 min)
4. Configure Services (10 min)
5. Start & Test (5 min)
```

---

## 🔧 KNOWN ISSUES & FIXES

### Issue 1: emergentintegrations in requirements.txt
**Problem:** Package tidak tersedia di PyPI  
**Fix:** Sudah dihapus di requirements.production.txt

### Issue 2: @zxing dependency conflict
**Problem:** @zxing/library@0.23.0 vs @zxing/browser@0.2.0 peer dependency  
**Fix:** Install dengan --legacy-peer-deps

### Issue 3: ajv module not found
**Problem:** Missing ajv/dist/compile/codegen  
**Fix:** Install ajv@^8.0.0 sebelum build

### Issue 4: Node.js version warning
**Problem:** @zxing requires Node 24+, VPS has Node 20  
**Fix:** Warning only, tidak blocking (masih works)

---

## 📦 DEPLOYMENT STEPS

### STEP 1: System Preparation

```bash
# Update system
apt update && apt upgrade -y

# Install base dependencies
apt install -y python3.12 python3.12-venv python3-pip python3-dev \
  build-essential pkg-config curl wget htop ufw net-tools

# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Nginx, Git, Supervisor
apt install -y nginx git supervisor

# Verify
python3 --version  # Should be 3.12.x
node --version     # Should be v20.x
```

---

### STEP 2: Install MongoDB Local

```bash
# Add MongoDB repository
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install
apt update
apt install -y mongodb-org

# Start & enable
systemctl start mongod
systemctl enable mongod

# Verify
systemctl status mongod
mongosh --eval 'db.runCommand({ connectionStatus: 1 })'
```

---

### STEP 3: Create User & Clone Project

```bash
# Create user
adduser --disabled-password --gecos "" kbs8
usermod -aG sudo kbs8

# Clone project
cd /home/kbs8
sudo -u kbs8 git clone https://github.com/pandekomangyogaswastika-dot/KBS9.git KBS8
chown -R kbs8:kbs8 KBS8

# Create directories
mkdir -p /home/kbs8/KBS8/uploads
mkdir -p /home/kbs8/backups
chown -R kbs8:kbs8 /home/kbs8
```

---

### STEP 4: Setup Backend

```bash
cd /home/kbs8/KBS8/backend

# Create venv
sudo -u kbs8 python3 -m venv venv

# Install dependencies (using production requirements)
sudo -u kbs8 bash -c "
  source venv/bin/activate && \
  pip install --upgrade pip setuptools wheel && \
  pip install fastapi==0.110.1 uvicorn==0.25.0 boto3>=1.34.129 \
    requests-oauthlib>=2.0.0 cryptography>=42.0.8 python-dotenv>=1.0.1 \
    pymongo==4.5.0 pydantic>=2.6.4 email-validator>=2.2.0 pyjwt>=2.10.1 \
    bcrypt==4.1.3 passlib>=1.7.4 tzdata>=2024.2 motor==3.3.1 \
    pytest>=8.0.0 black>=24.1.1 isort>=5.13.2 flake8>=7.0.0 mypy>=1.8.0 \
    python-jose>=3.3.0 requests>=2.31.0 pandas>=2.2.0 numpy>=1.26.0 \
    python-multipart>=0.0.9 jq>=1.6.0 typer>=0.9.0 \
    anthropic>=0.39.0 reportlab>=4.0.0 Pillow>=10.0.0
"

# Get IP
IP_VPS=$(curl -4 ifconfig.me)

# Create .env
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017/kbs8
JWT_SECRET=guspX7PspvLOXy7dW6FgWtdyneCRoYohwXOodDQRLkQ
ENVIRONMENT=production
ALLOWED_ORIGINS=http://$IP_VPS,http://localhost:3000
BACKEND_URL=http://$IP_VPS/api
ADMIN_DEFAULT_PASSWORD=Admin123!
MAX_UPLOAD_SIZE=10485760
UPLOAD_DIR=/home/kbs8/KBS8/uploads
EOF

chown kbs8:kbs8 .env
chmod 600 .env
```

---

### STEP 5: Setup Frontend

```bash
cd /home/kbs8/KBS8/frontend

# Install dependencies with legacy peer deps
sudo -u kbs8 npm install --legacy-peer-deps

# Fix ajv issue
sudo -u kbs8 npm install ajv@^8.0.0 --legacy-peer-deps

# Get IP
IP_VPS=$(curl -4 ifconfig.me)

# Create .env
cat > .env << EOF
REACT_APP_BACKEND_URL=http://$IP_VPS/api
NODE_ENV=production
EOF

chown kbs8:kbs8 .env

# Build
sudo -u kbs8 npm run build
```

---

### STEP 6: Setup Supervisor

```bash
# Backend config
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
stopwaitsecs=60
EOF

# Frontend config
cat > /etc/supervisor/conf.d/kbs8-frontend.conf << 'EOF'
[program:kbs8-frontend]
command=/usr/bin/python3 -m http.server 3000 --directory /home/kbs8/KBS8/frontend/build
directory=/home/kbs8/KBS8/frontend/build
user=kbs8
autostart=true
autorestart=true
stderr_logfile=/var/log/kbs8-frontend.err.log
stdout_logfile=/var/log/kbs8-frontend.out.log
stopwaitsecs=10
EOF

# Apply
supervisorctl reread
supervisorctl update
supervisorctl start all

# Verify (should show RUNNING)
supervisorctl status
```

---

### STEP 7: Setup Nginx

```bash
IP_VPS=$(curl -4 ifconfig.me)

cat > /etc/nginx/sites-available/kbs8 << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $IP_VPS;

    client_max_body_size 10M;

    access_log /var/log/nginx/kbs8-access.log;
    error_log /var/log/nginx/kbs8-error.log;

    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        root /home/kbs8/KBS8/frontend/build;
        try_files \$uri \$uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location /uploads/ {
        alias /home/kbs8/KBS8/uploads/;
    }
}
EOF

ln -sf /etc/nginx/sites-available/kbs8 /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx
```

---

### STEP 8: Setup Firewall

```bash
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

ufw status numbered
```

---

### STEP 9: Create Admin User

```bash
cd /home/kbs8/KBS8/backend

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

sudo -u kbs8 bash -c "source venv/bin/activate && python3 create_admin.py"
```

---

### STEP 10: Final Verification

```bash
IP_VPS=$(curl -4 ifconfig.me)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 System Info:"
echo "   MongoDB: Local (localhost:27017)"
echo "   IP: $IP_VPS"
echo "   URL: http://$IP_VPS"
echo ""
echo "🔐 Login:"
echo "   Email: admin@kubusteknologi.com"
echo "   Password: Admin123!"
echo ""
echo "📋 Services:"
supervisorctl status
echo ""
echo "✅ Test Backend:"
curl -s http://localhost:8001/api/health
echo ""
echo "✅ Test Frontend:"
curl -I http://localhost:3000 2>&1 | head -1
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

---

## 🔍 TROUBLESHOOTING

### Backend Won't Start

```bash
# Check logs
tail -n 100 /var/log/kbs8-backend.err.log

# Common fixes:
# 1. MongoDB not running
systemctl status mongod

# 2. Port in use
lsof -i :8001

# 3. Check .env
cat /home/kbs8/KBS8/backend/.env
```

### Frontend Build Error

```bash
# Rebuild
cd /home/kbs8/KBS8/frontend
sudo -u kbs8 npm install ajv@^8.0.0 --legacy-peer-deps
sudo -u kbs8 npm run build
supervisorctl restart kbs8-frontend
```

### Services Status

```bash
# Check all
supervisorctl status

# Restart all
supervisorctl restart all

# Check logs
tail -f /var/log/kbs8-backend.err.log
tail -f /var/log/nginx/kbs8-error.log
```

---

## 📦 MAINTENANCE

### Update Application

```bash
cd /home/kbs8/KBS8
sudo -u kbs8 git pull origin main

# Backend
cd backend
sudo -u kbs8 bash -c "source venv/bin/activate && pip install -r requirements.txt"
supervisorctl restart kbs8-backend

# Frontend
cd ../frontend
sudo -u kbs8 npm install --legacy-peer-deps
sudo -u kbs8 npm run build
supervisorctl restart kbs8-frontend
```

### Backup

```bash
# Database
mongodump --db kbs8 --out=/home/kbs8/backups/db_$(date +%Y%m%d)

# Code
tar -czf /home/kbs8/backups/code_$(date +%Y%m%d).tar.gz /home/kbs8/KBS8

# Uploads
tar -czf /home/kbs8/backups/uploads_$(date +%Y%m%d).tar.gz /home/kbs8/KBS8/uploads
```

---

## 🎯 POST-DEPLOYMENT

**After successful deployment:**

1. ✅ Change admin password
2. ✅ Test all features
3. ✅ Setup backup cron job
4. ✅ Monitor logs regularly
5. ✅ Consider getting domain for SSL

**When you have domain:**

```bash
# Update .env files with domain
# Run certbot for SSL
certbot --nginx -d yourdomain.com
```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] System updated
- [ ] MongoDB running
- [ ] Backend installed & configured
- [ ] Frontend built successfully
- [ ] Supervisor running both services
- [ ] Nginx configured
- [ ] Firewall enabled
- [ ] Admin user created
- [ ] Can access http://IP_VPS
- [ ] Can login successfully
- [ ] Dashboard loads correctly

---

**🎉 All Done! Application ready for use!**
