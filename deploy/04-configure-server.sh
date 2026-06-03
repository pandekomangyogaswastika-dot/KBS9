#!/usr/bin/env bash
# ============================================================
#  KUBUS DEPLOY · Step 4/4 · Nginx + systemd + start
#  Jalankan sebagai root:  sudo bash deploy/04-configure-server.sh
# ============================================================
set -euo pipefail

if [[ "$EUID" -ne 0 ]]; then
  echo "[ERROR] Jalankan dengan sudo."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
# shellcheck disable=SC1090
source "$SCRIPT_DIR/config.env"

echo "================================================================"
echo "  Step 4/4 · systemd (backend) + Nginx (frontend + proxy /api)"
echo "================================================================"

# ---- systemd service untuk backend (uvicorn) ------------------------
echo "[*] Membuat service kubus-backend..."
cat > /etc/systemd/system/kubus-backend.service <<EOF
[Unit]
Description=Kubus Teknologi FastAPI backend
After=network.target mongod.service

[Service]
Type=simple
WorkingDirectory=${REPO_DIR}/backend
ExecStart=${REPO_DIR}/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable kubus-backend
systemctl restart kubus-backend
sleep 3
systemctl --no-pager --lines=10 status kubus-backend || true

# ---- Nginx site -----------------------------------------------------
echo "[*] Membuat konfigurasi Nginx..."
cat > /etc/nginx/sites-available/kubus <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${DOMAIN} _;
    client_max_body_size 50M;

    root ${REPO_DIR}/frontend/build;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
    }

    location / {
        try_files \$uri /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/kubus /etc/nginx/sites-enabled/kubus
# Hapus semua konfigurasi default Nginx agar tidak menutupi aplikasi
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/conf.d/default.conf

# Pastikan Nginx (www-data) bisa membaca build folder
chmod -R o+rX "${REPO_DIR}/frontend/build"

nginx -t
systemctl reload nginx

echo ""
echo "================================================================"
echo "  SELESAI! Buka:  http://${DOMAIN}"
echo "  Login admin default:  admin@kubus.id  /  Admin#2026"
echo "  (GANTI password admin segera setelah login)"
echo "================================================================"
echo "  Cek log backend:   journalctl -u kubus-backend -f"
echo "  Restart backend:   sudo systemctl restart kubus-backend"
