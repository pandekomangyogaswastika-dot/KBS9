# Panduan Deployment KBS9 ke VPS (Ubuntu 24.04)

Panduan langkah demi langkah. Semua script ada di folder `deploy/`.

---

## Ringkasan
- Frontend: React (di-build pakai **yarn** → hindari error `craco`/`ajv` pada npm)
- Backend: FastAPI (uvicorn :8001) dijalankan via **systemd** `kubus-backend`
- Database: MongoDB lokal (default) atau Atlas
- Web server: **Nginx** menyajikan frontend + proxy `/api` ke backend
- AI: pakai `ANTHROPIC_API_KEY` (opsional). Tanpa key → situs tetap jalan, fitur AI nonaktif.

---

## Langkah 0 — Push perbaikan ke GitHub
Di Emergent, klik tombol **"Save to GitHub"** agar semua perbaikan + folder `deploy/` masuk ke repo **KBS9**.

## Langkah 1 — Clone repo di VPS (ke /opt, JANGAN /root)
> Penting: kalau clone di `/root`, Nginx tidak bisa baca file build.
```bash
sudo rm -rf /opt/kubus
sudo git clone https://github.com/USERNAME/KBS9.git /opt/kubus
cd /opt/kubus
```

## Langkah 2 — Isi konfigurasi
```bash
cp deploy/config.env.example deploy/config.env
nano deploy/config.env
```
Yang WAJIB diubah:
- `DOMAIN` → domain Anda (mis. `kubus.id`) atau IP VPS (mis. `203.0.113.10`)
- `JWT_SECRET` → string acak panjang & unik

Opsional:
- `ANTHROPIC_API_KEY` → isi untuk mengaktifkan fitur AI (Claude). Kosongkan bila belum punya.
- `MONGO_URL` / `DB_NAME` → ganti bila pakai MongoDB Atlas.

## Langkah 3 — Jalankan deployment
Sekaligus (paling cepat, ~5-10 menit):
```bash
sudo bash deploy/deploy.sh
```
Atau bertahap (kalau ingin lihat tiap tahap / mudah debug):
```bash
sudo bash deploy/01-install-system.sh    # Node 20, Yarn, Python, MongoDB 8, Nginx
sudo bash deploy/02-setup-backend.sh     # virtualenv + pip install + tulis backend/.env
sudo bash deploy/03-build-frontend.sh    # yarn install + yarn build
sudo bash deploy/04-configure-server.sh  # systemd service + Nginx + start
```

## Langkah 4 — Selesai
Buka di browser: `http://DOMAIN-ANDA`

Login admin default:
- Email: `admin@kubus.id`
- Password: `Admin#2026`

> Segera GANTI password admin setelah login pertama.

---

## Perintah berguna (troubleshooting)
| Tujuan | Perintah |
|--------|----------|
| Lihat log backend realtime | `journalctl -u kubus-backend -f` |
| Restart backend | `sudo systemctl restart kubus-backend` |
| Status backend | `sudo systemctl status kubus-backend` |
| Tes config Nginx | `sudo nginx -t` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Cek MongoDB | `sudo systemctl status mongod` |
| Build ulang frontend | `sudo bash deploy/03-build-frontend.sh` |

## Update aplikasi (setelah ada perubahan baru di GitHub)
```bash
cd /opt/kubus
sudo git pull
sudo bash deploy/02-setup-backend.sh
sudo bash deploy/03-build-frontend.sh
sudo systemctl restart kubus-backend
sudo systemctl reload nginx
```

## Masalah umum
- **`craco: not found` / error `ajv`** → Pastikan pakai script (yang memakai **yarn**), bukan `npm run build` manual.
- **Halaman 502 Bad Gateway** → Backend belum jalan. Cek `journalctl -u kubus-backend -f`.
- **Forbidden / 403 dari Nginx** → Repo di-clone di `/root`. Pindahkan ke `/opt/kubus`.
- **Fitur AI error 503** → `ANTHROPIC_API_KEY` belum diisi di `deploy/config.env` (ini normal; situs tetap jalan).
