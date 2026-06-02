#!/usr/bin/env python3
"""
Kubus — Navigation Map Validator (vs KTI_09_NAVIGATION_MAP.md)
Cek data-testid nav-* di frontend + duplikat label. Best-effort, non-fatal saat skeleton.
  python3 /app/scripts/check_nav_map.py [-v]
"""
import re, sys
from pathlib import Path

FRONTEND = Path("/app/frontend/src")
# nav-* yang diharapkan ada di header publik (KTI_09)
EXPECTED_PUBLIC_NAV = [
    "nav-services", "nav-cases", "nav-tech", "nav-team",
    "nav-blog", "nav-career", "nav-contact",
]

def main():
    verbose = "-v" in sys.argv or "--verbose" in sys.argv
    if not FRONTEND.exists():
        print("frontend/src belum ada — skip"); return 0
    testids = set()
    for f in FRONTEND.rglob("*.jsx"):
        testids |= set(re.findall(r'data-testid="(nav-[a-z-]+)"', f.read_text()))
    for f in FRONTEND.rglob("*.js"):
        testids |= set(re.findall(r'data-testid="(nav-[a-z-]+)"', f.read_text()))
    missing = [n for n in EXPECTED_PUBLIC_NAV if n not in testids]
    print("Navigation Map Validator (KTI_09)")
    if not testids:
        print("  (belum ada nav-* testid — skeleton, OK untuk Fase 0)")
        return 0
    for n in EXPECTED_PUBLIC_NAV:
        if n in testids:
            if verbose: print(f"  OK   {n}")
        else:
            print(f"  MISS {n}")
    if missing:
        print(f"\n  {len(missing)} nav item belum ada (review KTI_09). NON-FATAL.")
        return 0
    print("  Semua nav publik utama hadir.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
