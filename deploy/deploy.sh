#!/usr/bin/env bash
# ============================================================
#  KUBUS DEPLOY · Jalankan semua step sekaligus
#  sudo bash deploy/deploy.sh
# ============================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "$SCRIPT_DIR/01-install-system.sh"
bash "$SCRIPT_DIR/02-setup-backend.sh"
bash "$SCRIPT_DIR/03-build-frontend.sh"
bash "$SCRIPT_DIR/04-configure-server.sh"
