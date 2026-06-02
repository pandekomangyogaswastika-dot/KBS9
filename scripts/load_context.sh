#!/bin/bash
# =============================================================================
# KUBUS TEKNOLOGI INDONESIA — INSTANT CONTEXT LOADER
# Jalankan di awal setiap sesi: bash /app/scripts/load_context.sh [--full]
# =============================================================================
FULL=false
[[ "$1" == "--full" ]] && FULL=true

echo ""
echo "================================================================"
echo "  KUBUS TEKNOLOGI INDONESIA — CONTEXT SNAPSHOT"
echo "  Generated: $(date '+%Y-%m-%d %H:%M')"
echo "================================================================"

echo ""
echo "> SERVICE STATUS"
if curl -s http://localhost:8001/api/ >/dev/null 2>&1; then
  echo "   OK  Backend  (http://localhost:8001)"
else
  echo "   DOWN Backend  -> supervisorctl restart backend"
fi
if curl -s http://localhost:3000 >/dev/null 2>&1; then
  echo "   OK  Frontend (http://localhost:3000)"
else
  echo "   ..  Frontend (checking)"
fi

echo ""
echo "> ENV CONFIG"
echo "   DB_NAME:     $(grep DB_NAME /app/backend/.env | cut -d= -f2)"
echo "   BACKEND_URL: $(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)"

echo ""
echo "> DATABASE STATE (collection counts)"
python3 - << 'PYEOF'
import asyncio, os, sys
sys.path.insert(0, '/app/backend')
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
async def main():
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(os.environ['MONGO_URL'])
        db = client[os.environ['DB_NAME']]
        names = await db.list_collection_names()
        if not names:
            print("   (kosong — belum ada collection)")
        for n in sorted(names):
            c = await db[n].count_documents({})
            print(f"   {n:<28} {c:>8}")
        client.close()
    except Exception as e:
        print(f"   ERROR: {e}")
asyncio.run(main())
PYEOF

echo ""
echo "> FILE SIZES (WARNING saja) — .jsx<=500, router .py<=800"
for f in /app/backend/routers/*.py; do
  [ -e "$f" ] || continue
  l=$(wc -l < "$f"); [ "$l" -gt 640 ] && echo "   ! $(basename $f): $l baris"
done
for f in $(find /app/frontend/src -name '*.jsx' 2>/dev/null); do
  l=$(wc -l < "$f"); [ "$l" -gt 425 ] && echo "   ! ${f#/app/frontend/src/}: $l baris"
done
echo "   (hanya tampil yang mendekati/melebihi batas)"

echo ""
echo "> QUICK COMPLIANCE"
python3 /app/scripts/validate_compliance.py --quick 2>/dev/null | grep -E "FAIL|SUMMARY" | head -20

echo ""
echo "> LAST SESSION HANDOFF"
[ -f /app/memory/SESSION_HANDOFF.md ] && grep -m1 "Status:" /app/memory/SESSION_HANDOFF.md | sed 's/^/   /'

echo ""
echo "================================================================"
echo "  cat /app/plan.md                 <- task & fase aktif"
echo "  cat /app/ENTITY_REGISTRY.md      <- SSOT collection"
echo "  cat /app/memory/SESSION_HANDOFF.md"
echo "================================================================"
echo ""
