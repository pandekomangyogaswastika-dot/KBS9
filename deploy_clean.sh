#!/bin/bash

################################################################################
# KBS8 System - Production Deployment Script
# Author: Kubus Teknologi Indonesia
# Version: 2.0 - Clean & Tested
# Target: Ubuntu 24.04 LTS
# Usage: bash deploy_clean.sh
################################################################################

set -e  # Exit on any error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_USER="kbs8"
APP_DIR="/home/$APP_USER/KBS8"
REPO_URL="https://github.com/pandekomangyogaswastika-dot/KBS9.git"

# Functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "Script must be run as root (use sudo)"
        exit 1
    fi
}

print_header() {
    clear
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║      KBS8 System - Production Deployment v2.0             ║"
    echo "║      Kubus Teknologi Indonesia                            ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
}

# Main Steps
step_1_system_update() {
    log_info "Step 1/10: Updating system..."
    apt update -y && apt upgrade -y
    log_success "System updated"
}

step_2_install_dependencies() {
    log_info "Step 2/10: Installing dependencies..."
    
    # Python
    apt install -y python3.12 python3.12-venv python3-pip python3-dev \
        build-essential pkg-config
    
    # Node.js 20.x
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
    fi
    
    # Nginx, Git, Supervisor
    apt install -y nginx git supervisor
    
    # Tools
    apt install -y curl wget htop ufw net-tools
    
    log_success "Dependencies installed"
    log_info "Python: $(python3 --version)"
    log_info "Node: $(node --version)"
}

step_3_install_mongodb() {
    log_info "Step 3/10: Installing MongoDB..."
    
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
        tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    apt update
    apt install -y mongodb-org
    
    systemctl start mongod
    systemctl enable mongod
    
    log_success "MongoDB installed and started"
}

step_4_create_user() {
    log_info "Step 4/10: Creating application user..."
    
    if id "$APP_USER" &>/dev/null; then
        log_warning "User $APP_USER already exists"
    else
        adduser --disabled-password --gecos "" $APP_USER
        usermod -aG sudo $APP_USER
        log_success "User $APP_USER created"
    fi
}

step_5_clone_project() {
    log_info "Step 5/10: Cloning project..."
    
    if [ -d "$APP_DIR" ]; then
        log_warning "Directory $APP_DIR exists, backing up..."
        mv "$APP_DIR" "${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    fi
    
    cd /home/$APP_USER
    sudo -u $APP_USER git clone $REPO_URL KBS8
    
    mkdir -p $APP_DIR/uploads
    mkdir -p /home/$APP_USER/backups
    chown -R $APP_USER:$APP_USER /home/$APP_USER
    
    log_success "Project cloned"
}

step_6_setup_backend() {
    log_info "Step 6/10: Setting up backend..."
    
    cd $APP_DIR/backend
    
    # Create venv
    sudo -u $APP_USER python3 -m venv venv
    
    # Install dependencies
    sudo -u $APP_USER bash -c "
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
UPLOAD_DIR=$APP_DIR/uploads
EOF
    
    chown $APP_USER:$APP_USER .env
    chmod 600 .env
    
    log_success "Backend setup complete"
}

step_7_setup_frontend() {
    log_info "Step 7/10: Setting up frontend..."
    
    cd $APP_DIR/frontend
    
    # Install dependencies
    sudo -u $APP_USER npm install --legacy-peer-deps
    
    # Fix ajv issue
    sudo -u $APP_USER npm install ajv@^8.0.0 --legacy-peer-deps
    
    # Get IP
    IP_VPS=$(curl -4 ifconfig.me)
    
    # Create .env
    cat > .env << EOF
REACT_APP_BACKEND_URL=http://$IP_VPS/api
NODE_ENV=production
EOF
    
    chown $APP_USER:$APP_USER .env
    
    # Build
    log_info "Building frontend (this may take 2-5 minutes)..."
    sudo -u $APP_USER npm run build
    
    log_success "Frontend setup complete"
}

step_8_setup_supervisor() {
    log_info "Step 8/10: Configuring Supervisor..."
    
    # Backend
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
    
    # Frontend
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
    
    sleep 3
    
    log_success "Supervisor configured"
}

step_9_setup_nginx() {
    log_info "Step 9/10: Configuring Nginx..."
    
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
    
    log_success "Nginx configured"
}

step_10_firewall_and_admin() {
    log_info "Step 10/10: Setting up firewall and creating admin..."
    
    # Firewall
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Create admin
    cd $APP_DIR/backend
    
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

if __name__ == '__main__':
    asyncio.run(create_admin())
PYEOF
    
    sudo -u $APP_USER bash -c "source venv/bin/activate && python3 create_admin.py"
    
    log_success "Firewall and admin configured"
}

print_summary() {
    IP_VPS=$(curl -4 ifconfig.me)
    
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║              🎉 DEPLOYMENT COMPLETE! 🎉                   ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${GREEN}📊 System Information:${NC}"
    echo "   MongoDB: Local (localhost:27017)"
    echo "   IP Address: $IP_VPS"
    echo "   Access URL: http://$IP_VPS"
    echo ""
    echo -e "${GREEN}🔐 Login Credentials:${NC}"
    echo "   Email: admin@kubusteknologi.com"
    echo "   Password: Admin123!"
    echo -e "   ${YELLOW}⚠️  CHANGE PASSWORD after first login!${NC}"
    echo ""
    echo -e "${GREEN}📋 Service Status:${NC}"
    supervisorctl status
    echo ""
    echo -e "${GREEN}✅ Next Steps:${NC}"
    echo "   1. Open http://$IP_VPS in your browser"
    echo "   2. Login with credentials above"
    echo "   3. Change admin password immediately"
    echo "   4. Test all features"
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                  Happy Using KBS8! 🚀                     ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
}

# Main execution
main() {
    print_header
    check_root
    
    log_info "Starting deployment..."
    
    step_1_system_update
    step_2_install_dependencies
    step_3_install_mongodb
    step_4_create_user
    step_5_clone_project
    step_6_setup_backend
    step_7_setup_frontend
    step_8_setup_supervisor
    step_9_setup_nginx
    step_10_firewall_and_admin
    
    print_summary
}

# Run
main
