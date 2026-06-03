#!/usr/bin/env bash
# ============================================================
#  KUBUS DEPLOY · Step 3/4 · Build Frontend (yarn)
#  Jalankan:  sudo bash deploy/03-build-frontend.sh
#  Memakai YARN + yarn.lock => menghindari error craco/ajv pada npm.
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

if [[ ! -f "$SCRIPT_DIR/config.env" ]]; then
  echo "[ERROR] config.env belum ada. Lihat Step 2."
  exit 1
fi
# shellcheck disable=SC1090
source "$SCRIPT_DIR/config.env"

echo "================================================================"
echo "  Step 3/4 · Frontend build  ($REPO_DIR/frontend)"
echo "================================================================"
cd "$REPO_DIR/frontend"

PROTO="http"
[[ "${USE_HTTPS}" == "true" ]] && PROTO="https"
echo "[*] REACT_APP_BACKEND_URL = ${PROTO}://${DOMAIN}"
{
  echo "REACT_APP_BACKEND_URL=${PROTO}://${DOMAIN}"
  echo "ENABLE_HEALTH_CHECK=false"
} > .env.production

corepack enable 2>/dev/null || true
echo "[*] yarn install (--ignore-engines untuk hindari konflik engine @zxing)..."
yarn install --frozen-lockfile --ignore-engines || yarn install --ignore-engines

echo "[*] yarn build (butuh 1-3 menit)..."
CI=false yarn build

echo ""
echo "[DONE] Step 3 selesai. Build ada di ${REPO_DIR}/frontend/build"
echo "       Lanjut:  sudo bash deploy/04-configure-server.sh"
