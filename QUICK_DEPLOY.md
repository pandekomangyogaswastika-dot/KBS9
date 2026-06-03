# 🚀 Quick Start Deployment - KBS8 ke Hostinger VPS

**5 Menit Setup!** ⚡

---

## 📋 PREREQUISITES

Sebelum mulai, pastikan Anda punya:
- ✅ VPS Hostinger (Ubuntu 20.04/22.04)
- ✅ Domain name (sudah pointing ke VPS IP)
- ✅ SSH access ke VPS
- ✅ MongoDB Atlas account (gratis di mongodb.com/cloud)

---

## 🎯 CARA 1: AUTO DEPLOYMENT (RECOMMENDED)

### Step 1: SSH ke VPS

```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Upload Project

**Option A - Via Git:**
```bash
cd /root
git clone https://github.com/pandekomangyogaswastika-dot/KBS8.git
cd KBS8
```

**Option B - Via rsync (dari local):**
```bash
# Di local machine:
rsync -avz --exclude 'node_modules' --exclude '.git' \
  /path/to/KBS8/ root@YOUR_VPS_IP:/root/KBS8/
```

### Step 3: Run Deployment Script

```bash
cd /root/KBS8
sudo bash deploy.sh
```

Script akan:
1. ✅ Install semua dependencies (Python, Node.js, Nginx, dll)
2. ✅ Setup user & directory structure
3. ✅ Install backend & frontend
4. ✅ Configure supervisor (process manager)
5. ✅ Configure nginx (web server)
6. ✅ Setup SSL (HTTPS)
7. ✅ Configure firewall
8. ✅ Create admin user

**Ikuti prompt untuk:**
- Masukkan domain name
- Masukkan email untuk SSL

### Step 4: Configure Environment

**Edit Backend .env:**
```bash
nano /home/kbs8/KBS8/backend/.env
```

Update nilai:
```bash
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/kbs8?retryWrites=true&w=majority
JWT_SECRET=YOUR_RANDOM_32_CHAR_SECRET_HERE
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Edit Frontend .env:**
```bash
nano /home/kbs8/KBS8/frontend/.env
```

Update nilai:
```bash
REACT_APP_BACKEND_URL=https://yourdomain.com/api
```

**Generate JWT Secret:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 5: Restart Services

```bash
sudo supervisorctl restart all
```

### Step 6: Test!

Buka browser: `https://yourdomain.com`

Login dengan:
- Email: `admin@kubusteknologi.com`
- Password: `Admin123!`

**⚠️ SEGERA GANTI PASSWORD!**

---

## 🎯 CARA 2: MANUAL DEPLOYMENT

Ikuti dokumentasi lengkap di: `/app/DEPLOYMENT_HOSTINGER.md`

---

## 🔧 COMMON COMMANDS

### Check Status
```bash
sudo supervisorctl status
```

### Restart Services
```bash
# Restart backend
sudo supervisorctl restart kbs8-backend

# Restart frontend
sudo supervisorctl restart kbs8-frontend

# Restart all
sudo supervisorctl restart all

# Restart nginx
sudo systemctl restart nginx
```

### View Logs
```bash
# Backend errors
tail -f /var/log/kbs8-backend.err.log

# Backend output
tail -f /var/log/kbs8-backend.out.log

# Nginx errors
tail -f /var/log/nginx/kbs8-error.log

# All logs together
multitail /var/log/kbs8-backend.err.log /var/log/nginx/kbs8-error.log
```

### Update Application
```bash
cd /home/kbs8/KBS8
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo supervisorctl restart kbs8-backend

# Update frontend
cd ../frontend
npm install
npm run build
sudo supervisorctl restart kbs8-frontend
```

---

## 🐛 TROUBLESHOOTING

### Backend tidak start
```bash
# Check logs
tail -n 100 /var/log/kbs8-backend.err.log

# Common fixes:
# 1. Check MongoDB connection
# 2. Check .env file
# 3. Check port 8001: lsof -i :8001
```

### Frontend 404 Error
```bash
# Rebuild
cd /home/kbs8/KBS8/frontend
npm run build
sudo supervisorctl restart kbs8-frontend
```

### API Calls Failing (CORS Error)
```bash
# Check backend .env
nano /home/kbs8/KBS8/backend/.env
# Make sure ALLOWED_ORIGINS includes your domain

# Check frontend .env
nano /home/kbs8/KBS8/frontend/.env
# Make sure REACT_APP_BACKEND_URL is correct

# Restart backend
sudo supervisorctl restart kbs8-backend
```

### SSL Issues
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Force renew
sudo certbot renew --force-renewal
```

---

## 📊 MONITORING

### Check Server Resources
```bash
# CPU & Memory
htop

# Disk space
df -h

# Check processes
ps aux | grep python
ps aux | grep node
```

### Test Endpoints
```bash
# Health check
curl https://yourdomain.com/api/health

# Test login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kubusteknologi.com","password":"Admin123!"}'
```

---

## 🔐 SECURITY CHECKLIST

After deployment, make sure to:

- [ ] Change admin default password
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Firewall enabled (`ufw status`)
- [ ] SSL certificate installed (HTTPS working)
- [ ] MongoDB access restricted (whitelist VPS IP)
- [ ] Backup strategy in place
- [ ] Monitor logs regularly

---

## 📦 BACKUP

### Manual Backup
```bash
# Backup database (MongoDB Atlas)
mongodump --uri="YOUR_MONGO_URI" --out="/home/kbs8/backups/db_$(date +%Y%m%d)"

# Backup code
tar -czf /home/kbs8/backups/code_$(date +%Y%m%d).tar.gz /home/kbs8/KBS8

# Backup uploads
tar -czf /home/kbs8/backups/uploads_$(date +%Y%m%d).tar.gz /home/kbs8/KBS8/uploads
```

### Auto Backup (Daily)
```bash
# Create backup script
nano /home/kbs8/backup.sh
```

Isi:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/kbs8/backups"
mkdir -p $BACKUP_DIR

# Database backup
mongodump --uri="YOUR_MONGO_URI" --out="$BACKUP_DIR/db_$DATE"
tar -czf "$BACKUP_DIR/db_$DATE.tar.gz" "$BACKUP_DIR/db_$DATE"
rm -rf "$BACKUP_DIR/db_$DATE"

# Keep only last 7 days
ls -t $BACKUP_DIR/*.tar.gz | tail -n +8 | xargs rm -f

echo "Backup completed: $DATE"
```

```bash
chmod +x /home/kbs8/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/kbs8/backup.sh
```

---

## 🆘 NEED HELP?

**Dokumentasi Lengkap:**
- `/app/DEPLOYMENT_HOSTINGER.md` - Full deployment guide
- `/app/docs/` - System documentation

**Check Status:**
```bash
# All services
sudo supervisorctl status

# System health
systemctl status nginx
systemctl status supervisor
```

**Emergency Restart:**
```bash
sudo supervisorctl restart all
sudo systemctl restart nginx
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

Setelah deployment, test:

- [ ] Open `https://yourdomain.com` → Homepage loads ✓
- [ ] Click "Login" → Login page accessible ✓
- [ ] Login with admin credentials → Success ✓
- [ ] Navigate to Dashboard → Loads correctly ✓
- [ ] Test Assessment module → Working ✓
- [ ] Test CRUD operations → Working ✓
- [ ] Check browser console → No errors ✓
- [ ] Test on mobile → Responsive ✓
- [ ] SSL certificate valid → HTTPS green lock ✓

---

## 📞 SUPPORT CONTACTS

Jika deployment gagal, cek:
1. `/var/log/kbs8-backend.err.log` - Backend errors
2. `/var/log/nginx/kbs8-error.log` - Nginx errors  
3. `.env` files - Configuration
4. MongoDB connection - Database access

---

**🎉 Happy Deploying! Sistem KBS8 siap production di Hostinger VPS! 🚀**

---

**Quick Tips:**
- Always backup before update
- Monitor logs regularly
- Keep system updated: `apt update && apt upgrade`
- Change default passwords immediately
- Setup monitoring & alerts
