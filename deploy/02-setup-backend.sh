#!/usr/bin/env bash
# ============================================================
#  KUBUS DEPLOY · Step 2/4 · Setup Backend (venv + .env)
#  Jalankan:  sudo bash deploy/02-setup-backend.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

if [[ ! -f "$SCRIPT_DIR/config.env" ]]; then
  echo "[ERROR] $SCRIPT_DIR/config.env belum ada."
  echo "        Jalankan dulu:  cp deploy/config.env.example deploy/config.env && nano deploy/config.env"
  exit 1
fi
# shellcheck disable=SC1090
source "$SCRIPT_DIR/config.env"

echo "================================================================"
echo "  Step 2/4 · Backend  ($REPO_DIR/backend)"
echo "================================================================"
cd "$REPO_DIR/backend"

echo "[*] Membuat virtualenv & install dependensi Python..."
python3 -m venv venv
# shellcheck disable=SC1091
source venv/bin/activate
pip install --upgrade pip wheel >/dev/null
pip install -r requirements.txt

echo "[*] Menulis backend/.env ..."
{
  echo "MONGO_URL=\"${MONGO_URL}\""
  echo "DB_NAME=\"${DB_NAME}\""
  echo "CORS_ORIGINS=\"*\""
  echo "JWT_SECRET=\"${JWT_SECRET}\""
  echo "STORAGE_BACKEND=\"local\""
  echo "UPLOAD_DIR=\"${REPO_DIR}/backend/uploads\""
  echo "DOCS_USERNAME=\"${DOCS_USERNAME}\""
  echo "DOCS_PASSWORD=\"${DOCS_PASSWORD}\""
} > .env
if [[ -n "${ANTHROPIC_API_KEY}" ]]; then
  echo "ANTHROPIC_API_KEY=\"${ANTHROPIC_API_KEY}\"" >> .env
  echo "[OK] ANTHROPIC_API_KEY diset — fitur AI AKTIF."
else
  echo "[i] ANTHROPIC_API_KEY kosong — fitur AI nonaktif (situs tetap jalan)."
fi

mkdir -p "${REPO_DIR}/backend/uploads"

echo "[*] Tes cepat import backend..."
python -c "import server; print('  backend import OK')" || echo "  [WARN] import check non-fatal — cek log saat start service"

echo ""
echo "[DONE] Step 2 selesai. Lanjut:  sudo bash deploy/03-build-frontend.sh"
