#!/usr/bin/env bash
# ============================================================
#  KUBUS DEPLOY · Step 5/5 · SSL/HTTPS via Let's Encrypt
#
#  Prasyarat:
#    - Step 04 sudah selesai (Nginx + systemd berjalan)
#    - Domain sudah diarahkan ke IP VPS di DNS provider
#    - Port 80 & 443 sudah dibuka di Hostinger hPanel firewall
#
#  Jalankan sebagai root:
#    sudo bash deploy/05-ssl.sh
# ============================================================
set -euo pipefail

if [[ "$EUID" -ne 0 ]]; then
  echo "[ERROR] Jalankan dengan sudo: sudo bash deploy/05-ssl.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

# ---- Load config -----------------------------------------------------
if [[ ! -f "$SCRIPT_DIR/config.env" ]]; then
  echo "[ERROR] File config.env tidak ditemukan."
  echo "        Buat dari template: cp deploy/config.env.example deploy/config.env"
  exit 1
fi
# shellcheck disable=SC1090
source "$SCRIPT_DIR/config.env"

echo "================================================================"
echo "  Step 5/5 · SSL/HTTPS — Let's Encrypt (Certbot)"
echo "================================================================"
echo "  Domain    : $DOMAIN"
echo "  Repo dir  : $REPO_DIR"
echo ""

# ---- Validasi domain (bukan IP) -------------------------------------
if [[ "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "================================================================"
  echo "  [PENTING] Domain Anda adalah IP address: $DOMAIN"
  echo ""
  echo "  Let's Encrypt TIDAK mendukung sertifikat SSL untuk IP address."
  echo "  Anda perlu domain (contoh: kubus.id, app.kubus.id) yang sudah"
  echo "  diarahkan (DNS A record) ke IP VPS Anda."
  echo ""
  echo "  Jika belum punya domain:"
  echo "    1. Beli domain di Niagahoster, Namecheap, dll."
  echo "    2. Tambah DNS A record: @ -> $(curl -s ifconfig.me 2>/dev/null || echo 'IP-VPS-ANDA')"
  echo "    3. Tunggu propagasi DNS (5-30 menit)"
  echo "    4. Ubah DOMAIN di config.env menjadi nama domain Anda"
  echo "    5. Jalankan ulang script ini"
  echo "================================================================"
  exit 1
fi

if [[ "$DOMAIN" == "ganti-dengan-domain-atau-ip" ]]; then
  echo "[ERROR] Anda belum mengubah DOMAIN di config.env."
  echo "        Edit: nano $SCRIPT_DIR/config.env"
  exit 1
fi

# ---- Cek DNS sudah mengarah ke VPS ----------------------------------
echo "[*] Memeriksa DNS propagasi untuk $DOMAIN..."
SERVER_IP=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
DNS_IP=$(dig +short "$DOMAIN" 2>/dev/null | tail -n1 || true)

if [[ -z "$DNS_IP" ]]; then
  echo ""
  echo "  [PERINGATAN] Tidak bisa resolve DNS untuk $DOMAIN"
  echo "  Pastikan DNS A record sudah diarahkan ke IP VPS: $SERVER_IP"
  echo ""
  read -rp "  Lanjutkan meskipun DNS belum terverifikasi? (y/N): " FORCE_CONTINUE
  if [[ "${FORCE_CONTINUE,,}" != "y" ]]; then
    echo "  Dibatalkan. Coba lagi setelah DNS propagasi selesai."
    exit 1
  fi
elif [[ "$DNS_IP" != "$SERVER_IP" ]]; then
  echo ""
  echo "  [PERINGATAN] DNS belum mengarah ke server ini."
  echo "    Domain $DOMAIN → $DNS_IP"
  echo "    Server ini        → $SERVER_IP"
  echo ""
  read -rp "  Lanjutkan meskipun DNS belum sinkron? (y/N): " FORCE_CONTINUE
  if [[ "${FORCE_CONTINUE,,}" != "y" ]]; then
    echo "  Dibatalkan. Coba lagi setelah DNS propagasi selesai (biasanya 5-30 menit)."
    exit 1
  fi
else
  echo "  [OK] DNS $DOMAIN → $DNS_IP (sesuai)"
fi

# ---- Install Certbot -------------------------------------------------
echo ""
echo "[*] Menginstall Certbot + plugin Nginx..."
apt-get update -qq
apt-get install -y -qq certbot python3-certbot-nginx
echo "  [OK] Certbot siap."

# ---- Pastikan Nginx jalan -------------------------------------------
echo "[*] Memastikan Nginx berjalan..."
nginx -t
systemctl reload nginx

# ---- Minta sertifikat SSL -------------------------------------------
echo ""
echo "[*] Meminta sertifikat SSL dari Let's Encrypt untuk: $DOMAIN"
echo "    (Proses ini butuh koneksi ke internet dan domain harus bisa diakses)"
echo ""

# Email default dari config, fallback ke admin@domain
EMAIL="${LETS_ENCRYPT_EMAIL:-admin@${DOMAIN}}"

certbot --nginx \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --redirect \
  --no-eff-email \
  || {
    echo ""
    echo "================================================================"
    echo "  [ERROR] Certbot gagal mendapatkan sertifikat."
    echo ""
    echo "  Kemungkinan penyebab:"
    echo "    1. Port 80/443 belum dibuka di Hostinger hPanel firewall"
    echo "    2. DNS belum propagasi (tunggu lebih lama)"
    echo "    3. Domain tidak valid atau tidak diarahkan ke IP ini"
    echo ""
    echo "  Cara cek port:"
    echo "    curl -I http://$DOMAIN"
    echo "================================================================"
    exit 1
  }

echo ""
echo "  [OK] Sertifikat SSL berhasil dibuat!"

# ---- Aktifkan auto-renewal ------------------------------------------
echo "[*] Mengaktifkan auto-renewal sertifikat SSL..."
# Certbot biasanya membuat timer otomatis, pastikan aktif
if systemctl list-timers certbot.timer --no-pager 2>/dev/null | grep -q certbot; then
  systemctl enable certbot.timer
  systemctl start certbot.timer
  echo "  [OK] certbot.timer aktif (auto-renew setiap 12 jam)"
else
  # Fallback: cron job
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | sort -u | crontab -
  echo "  [OK] Cron job renewal ditambahkan (setiap jam 03:00)"
fi

# ---- Test auto-renewal ----------------------------------------------
echo "[*] Test dry-run renewal..."
certbot renew --dry-run --quiet && echo "  [OK] Dry-run renewal berhasil." || echo "  [PERINGATAN] Dry-run gagal, periksa konfigurasi."

# ---- Update config.env → USE_HTTPS=true ----------------------------
echo "[*] Memperbarui config.env: USE_HTTPS=true..."
sed -i 's/^USE_HTTPS=.*/USE_HTTPS="true"/' "$SCRIPT_DIR/config.env"

# ---- Rebuild frontend dengan HTTPS URL ------------------------------
echo ""
echo "[*] Rebuild frontend dengan HTTPS URL..."
HTTPS_BACKEND_URL="https://$DOMAIN"

cd "$REPO_DIR/frontend"
# Update .env
echo "REACT_APP_BACKEND_URL=$HTTPS_BACKEND_URL" > .env

# Rebuild
export NODE_OPTIONS="--max-old-space-size=2048"
yarn build 2>&1 | tail -5
echo "  [OK] Frontend berhasil di-rebuild."

# Perbaiki permissions
chmod -R o+rX "$REPO_DIR/frontend/build"

# ---- Reload Nginx ---------------------------------------------------
echo "[*] Reload Nginx..."
nginx -t && systemctl reload nginx
echo "  [OK] Nginx sudah berjalan dengan HTTPS."

# ---- Verifikasi akhir -----------------------------------------------
echo ""
echo "================================================================"
echo "  HTTPS SELESAI DIKONFIGURASI!"
echo ""
echo "  Akses:      https://$DOMAIN"
echo "  HTTP redirect ke HTTPS secara otomatis."
echo "  Sertifikat SSL diperbarui otomatis setiap 60–90 hari."
echo ""
echo "  Verifikasi:"
echo "    curl -I https://$DOMAIN"
echo "    certbot certificates"
echo ""
echo "  Informasi sertifikat:"
certbot certificates 2>/dev/null || true
echo "================================================================"
echo "  [INGAT] Ganti password admin default di portal!"
echo "          Login: https://$DOMAIN/portal/login"
echo "          Email: admin@kubus.id  Password: Admin#2026"
echo "================================================================"
