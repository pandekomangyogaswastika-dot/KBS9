#!/bin/bash

################################################################################
# KBS8 System - Auto Deployment Script untuk VPS Hostinger
# Author: Kubus Teknologi Indonesia
# Version: 1.0
# Date: 2024
#
# Script ini akan setup KBS8 system di VPS Ubuntu 20.04/22.04
# Usage: sudo bash deploy.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="kbs8"
APP_USER="kbs8"
APP_DIR="/home/$APP_USER/KBS8"
BACKEND_PORT=8001
FRONTEND_PORT=3000

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║      KBS8 System - Auto Deployment Script                ║"
    echo "║      Kubus Teknologi Indonesia                            ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Script harus dijalankan sebagai root (gunakan sudo)"
        exit 1
    fi
}

# Main deployment steps
step_1_system_update() {
    print_step "1/12 - Updating system packages..."
    apt update -y
    apt upgrade -y
    print_info "System updated ✓"
}

step_2_install_dependencies() {
    print_step "2/12 - Installing dependencies..."
    
    # Python 3.10+
    apt install -y python3.10 python3.10-venv python3-pip
    
    # Node.js 18.x
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install -y nodejs
    fi
    
    # Nginx
    apt install -y nginx
    
    # Git
    apt install -y git
    
    # Supervisor
    apt install -y supervisor
    
    # Certbot
    apt install -y certbot python3-certbot-nginx
    
    # Other tools
    apt install -y curl wget htop ufw
    
    print_info "Dependencies installed ✓"
    print_info "Python version: $(python3 --version)"
    print_info "Node version: $(node --version)"
    print_info "Nginx version: $(nginx -v 2>&1)"
}

step_3_create_user() {
    print_step "3/12 - Creating application user..."
    
    if id "$APP_USER" &>/dev/null; then
        print_warning "User $APP_USER already exists, skipping..."
    else
        adduser --disabled-password --gecos "" $APP_USER
        usermod -aG sudo $APP_USER
        print_info "User $APP_USER created ✓"
    fi
}

step_4_clone_repository() {
    print_step "4/12 - Setting up application directory..."
    
    if [ -d "$APP_DIR" ]; then
        print_warning "Directory $APP_DIR already exists"
        read -p "Do you want to backup and re-clone? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            mv "$APP_DIR" "${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
        else
            print_info "Using existing directory"
            return
        fi
    fi
    
    print_info "Repository should be manually uploaded or cloned"
    print_info "Please ensure code is in: $APP_DIR"
    
    # Create directory structure
    sudo -u $APP_USER mkdir -p $APP_DIR
    sudo -u $APP_USER mkdir -p $APP_DIR/uploads
    sudo -u $APP_USER mkdir -p /home/$APP_USER/backups
    
    print_info "Directory structure created ✓"
}

step_5_setup_backend() {
    print_step "5/12 - Setting up backend..."
    
    cd $APP_DIR/backend
    
    # Create virtual environment
    sudo -u $APP_USER python3 -m venv venv
    
    # Install dependencies
    sudo -u $APP_USER bash -c "source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt"
    
    # Create .env if not exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found, creating template..."
        cat > .env << 'EOF'
# MongoDB Connection (UPDATE THIS!)
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/kbs8?retryWrites=true&w=majority

# JWT Secret (GENERATE NEW!)
JWT_SECRET=CHANGE_THIS_TO_RANDOM_32_CHAR_STRING

# Environment
ENVIRONMENT=production

# CORS (UPDATE WITH YOUR DOMAIN!)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Backend URL
BACKEND_URL=https://yourdomain.com/api

# Admin
ADMIN_DEFAULT_PASSWORD=ChangeThisPassword123!

# Upload
MAX_UPLOAD_SIZE=10485760
UPLOAD_DIR=/home/kbs8/KBS8/uploads
EOF
        chown $APP_USER:$APP_USER .env
        print_warning "⚠️  IMPORTANT: Edit $APP_DIR/backend/.env with your actual values!"
    fi
    
    print_info "Backend setup complete ✓"
}

step_6_setup_frontend() {
    print_step "6/12 - Setting up frontend..."
    
    cd $APP_DIR/frontend
    
    # Install dependencies
    sudo -u $APP_USER npm install
    
    # Create .env if not exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found, creating template..."
        cat > .env << 'EOF'
# Backend URL (UPDATE THIS!)
REACT_APP_BACKEND_URL=https://yourdomain.com/api

# Environment
NODE_ENV=production
EOF
        chown $APP_USER:$APP_USER .env
        print_warning "⚠️  IMPORTANT: Edit $APP_DIR/frontend/.env with your actual domain!"
    fi
    
    # Build production
    print_info "Building frontend for production..."
    sudo -u $APP_USER npm run build
    
    print_info "Frontend setup complete ✓"
}

step_7_setup_supervisor() {
    print_step "7/12 - Setting up supervisor..."
    
    # Backend supervisor config
    cat > /etc/supervisor/conf.d/kbs8-backend.conf << EOF
[program:kbs8-backend]
command=$APP_DIR/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port $BACKEND_PORT --workers 2
directory=$APP_DIR/backend
user=$APP_USER
autostart=true
autorestart=true
stderr_logfile=/var/log/kbs8-backend.err.log
stdout_logfile=/var/log/kbs8-backend.out.log
environment=HOME="/home/$APP_USER",USER="$APP_USER"
EOF
    
    # Frontend supervisor config
    cat > /etc/supervisor/conf.d/kbs8-frontend.conf << EOF
[program:kbs8-frontend]
command=/usr/bin/python3 -m http.server $FRONTEND_PORT --directory $APP_DIR/frontend/build
directory=$APP_DIR/frontend/build
user=$APP_USER
autostart=true
autorestart=true
stderr_logfile=/var/log/kbs8-frontend.err.log
stdout_logfile=/var/log/kbs8-frontend.out.log
EOF
    
    # Reload supervisor
    supervisorctl reread
    supervisorctl update
    supervisorctl start kbs8-backend
    supervisorctl start kbs8-frontend
    
    print_info "Supervisor configured ✓"
    supervisorctl status
}

step_8_setup_nginx() {
    print_step "8/12 - Setting up nginx..."
    
    # Get domain from user
    read -p "Enter your domain (e.g., example.com): " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        print_error "Domain is required!"
        exit 1
    fi
    
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
        proxy_pass http://localhost:$BACKEND_PORT/api/;
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
        root $APP_DIR/frontend/build;
        try_files \$uri \$uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Uploads
    location /uploads/ {
        alias $APP_DIR/uploads/;
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
    
    print_info "Nginx configured ✓"
    print_info "Domain: $DOMAIN"
}

step_9_setup_ssl() {
    print_step "9/12 - Setting up SSL certificate..."
    
    read -p "Do you want to setup SSL with Let's Encrypt? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your email for SSL notifications: " EMAIL
        
        if [ -z "$EMAIL" ]; then
            print_warning "Email is required for SSL. Skipping SSL setup."
        else
            certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect
            print_info "SSL certificate installed ✓"
        fi
    else
        print_warning "Skipping SSL setup. You can run 'sudo certbot --nginx' later."
    fi
}

step_10_setup_firewall() {
    print_step "10/12 - Setting up firewall..."
    
    # Configure UFW
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    
    print_info "Firewall configured ✓"
    ufw status
}

step_11_create_admin_user() {
    print_step "11/12 - Creating admin user..."
    
    print_info "Creating default admin user..."
    print_warning "⚠️  Default credentials: admin@kubusteknologi.com / Admin123!"
    print_warning "⚠️  PLEASE CHANGE PASSWORD after first login!"
    
    # Script will be created in backend folder
    cat > $APP_DIR/backend/create_admin.py << 'EOF'
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
    result = await db.users.update_one(
        {'email': admin['email']},
        {'$set': admin},
        upsert=True
    )
    print('✅ Admin user created/updated: admin@kubusteknologi.com / Admin123!')
    print('⚠️  PLEASE CHANGE PASSWORD after first login!')

if __name__ == '__main__':
    asyncio.run(create_admin())
EOF
    
    cd $APP_DIR/backend
    sudo -u $APP_USER bash -c "source venv/bin/activate && python3 create_admin.py" || print_warning "Could not create admin user automatically. Run manually after configuring MongoDB."
    
    print_info "Admin user setup complete ✓"
}

step_12_final_checks() {
    print_step "12/12 - Running final checks..."
    
    print_info "Checking services status..."
    
    # Check supervisor
    echo "Supervisor status:"
    supervisorctl status
    
    # Check nginx
    echo ""
    echo "Nginx status:"
    systemctl status nginx --no-pager | head -n 5
    
    # Check ports
    echo ""
    echo "Listening ports:"
    netstat -tulpn | grep -E ':(80|443|8001|3000)'
    
    print_info "Final checks complete ✓"
}

print_summary() {
    echo ""
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║           🎉 DEPLOYMENT COMPLETE! 🎉                      ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${YELLOW}IMPORTANT NEXT STEPS:${NC}"
    echo ""
    echo "1. Configure MongoDB:"
    echo "   - Edit: $APP_DIR/backend/.env"
    echo "   - Set MONGO_URL with your connection string"
    echo ""
    echo "2. Configure Domain:"
    echo "   - Edit: $APP_DIR/backend/.env (ALLOWED_ORIGINS)"
    echo "   - Edit: $APP_DIR/frontend/.env (REACT_APP_BACKEND_URL)"
    echo ""
    echo "3. Generate JWT Secret:"
    echo "   python3 -c \"import secrets; print(secrets.token_urlsafe(32))\""
    echo "   - Add to $APP_DIR/backend/.env"
    echo ""
    echo "4. Restart services after config:"
    echo "   sudo supervisorctl restart all"
    echo ""
    echo "5. Check logs if issues:"
    echo "   tail -f /var/log/kbs8-backend.err.log"
    echo "   tail -f /var/log/nginx/kbs8-error.log"
    echo ""
    echo "6. Access your application:"
    echo "   http://$DOMAIN (or https:// if SSL configured)"
    echo ""
    echo "7. Default admin login:"
    echo "   Email: admin@kubusteknologi.com"
    echo "   Password: Admin123!"
    echo "   ⚠️  CHANGE PASSWORD IMMEDIATELY!"
    echo ""
    echo -e "${GREEN}Happy deploying! 🚀${NC}"
}

# Main execution
main() {
    print_header
    
    check_root
    
    step_1_system_update
    step_2_install_dependencies
    step_3_create_user
    step_4_clone_repository
    step_5_setup_backend
    step_6_setup_frontend
    step_7_setup_supervisor
    step_8_setup_nginx
    step_9_setup_ssl
    step_10_setup_firewall
    step_11_create_admin_user
    step_12_final_checks
    
    print_summary
}

# Run main function
main
