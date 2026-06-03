#!/usr/bin/env bash
# ============================================================
#  KUBUS DEPLOY · Step 1/4 · Dependensi sistem
#  Jalankan sebagai root:  sudo bash deploy/01-install-system.sh
#  Idempotent: aman dijalankan ulang.
# ============================================================
set -euo pipefail

if [[ "$EUID" -ne 0 ]]; then
  echo "[ERROR] Jalankan dengan sudo:  sudo bash deploy/01-install-system.sh"
  exit 1
fi

echo "================================================================"
echo "  Step 1/4 · Install Node 20, Yarn, Python, MongoDB, Nginx"
echo "================================================================"

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl gnupg git build-essential ca-certificates

# ---- Node.js 20 LTS -------------------------------------------------
NODE_MAJOR="$(command -v node >/dev/null 2>&1 && node -v | sed 's/v//' | cut -d. -f1 || echo 0)"
if [[ "${NODE_MAJOR}" -lt 18 ]]; then
  echo "[*] Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
# Yarn classic via corepack (sesuai packageManager di package.json)
corepack enable 2>/dev/null || npm install -g yarn
echo "[OK] node $(node -v) | yarn $(yarn -v)"

# ---- Python 3 + venv ------------------------------------------------
echo "[*] Installing Python venv..."
apt-get install -y python3 python3-venv python3-dev
echo "[OK] $(python3 --version)"

# ---- MongoDB 8.0 (Ubuntu 24.04 noble) -------------------------------
if ! command -v mongod >/dev/null 2>&1; then
  echo "[*] Installing MongoDB 8.0..."
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc \
    | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" \
    > /etc/apt/sources.list.d/mongodb-org-8.0.list
  apt-get update -y
  apt-get install -y mongodb-org
fi
systemctl enable --now mongod
echo "[OK] MongoDB aktif"

# ---- Nginx ----------------------------------------------------------
apt-get install -y nginx
systemctl enable --now nginx
echo "[OK] Nginx aktif"

echo ""
echo "[DONE] Step 1 selesai. Lanjut:  sudo bash deploy/02-setup-backend.sh"
