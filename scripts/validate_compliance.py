#!/usr/bin/env python3
"""
Kubus Teknologi Indonesia — Compliance Validator
Jalankan sebelum mark task DONE:
  python3 /app/scripts/validate_compliance.py [--quick]
"""
import re, sys
from pathlib import Path
from collections import defaultdict

ROOT = Path("/app")
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend" / "src"

MAX_ROUTER, MAX_COMPONENT, MAX_UTIL, MAX_CSS = 800, 500, 300, 400
results = []

def add(status, cat, msg): results.append((status, cat, msg))
def ok(c, m): add("PASS", c, m)
def warn(c, m): add("WARN", c, m)
def fail(c, m): add("FAIL", c, m)
def section(t): add("INFO", "", "="*60); add("INFO", "", f"  {t}"); add("INFO", "", "="*60)

# SSOT: forbidden bare names (harus pakai domain prefix — lihat ENTITY_REGISTRY.md)
FORBIDDEN = {
  "users", "services", "cases", "projects", "invoices", "messages", "leads",
  "team", "clients", "blog", "posts", "sessions", "templates", "documents",
  "files", "content", "milestones", "approvals", "threads", "conversations",
}
VALID_PREFIXES = ("system_", "cms_", "crm_", "assessment_", "pm_", "billing_",
                  "chat_", "ai_", "audit_", "status_")

def iter_files(base, exts):
    for e in exts:
        for f in base.rglob(f"*{e}"):
            if "node_modules" in str(f): continue
            yield f

def check_file_sizes():
    section("CHECK: FILE SIZE LIMITS")
    any_issue = False
    rdir = BACKEND / "routers"
    if rdir.exists():
        for f in sorted(rdir.glob("*.py")):
            n = len(f.read_text().splitlines())
            if n > MAX_ROUTER: fail("FILE_SIZE", f"{f.relative_to(ROOT)}: {n} > {MAX_ROUTER}"); any_issue = True
            elif n > MAX_ROUTER*0.8: warn("FILE_SIZE", f"{f.relative_to(ROOT)}: {n} (mendekati {MAX_ROUTER})")
    if FRONTEND.exists():
        for f in sorted(FRONTEND.rglob("*.jsx")):
            n = len(f.read_text().splitlines())
            if n > MAX_COMPONENT: fail("FILE_SIZE", f"{f.relative_to(ROOT)}: {n} > {MAX_COMPONENT}"); any_issue = True
            elif n > MAX_COMPONENT*0.85: warn("FILE_SIZE", f"{f.relative_to(ROOT)}: {n} (mendekati {MAX_COMPONENT})")
    if not any_issue: ok("FILE_SIZE", "Semua file dalam batas")

def check_debug():
    section("CHECK: DEBUG STATEMENTS")
    found = []
    if FRONTEND.exists():
        for f in iter_files(FRONTEND, [".js", ".jsx"]):
            for i, line in enumerate(f.read_text().splitlines(), 1):
                s = line.strip()
                if s.startswith("//") or s.startswith("*"): continue
                if "console.log" in line and "// ok" not in line.lower():
                    found.append(f"{f.relative_to(ROOT)}:{i}")
    rdir = BACKEND / "routers"
    if rdir.exists():
        for f in rdir.glob("*.py"):
            for i, line in enumerate(f.read_text().splitlines(), 1):
                if line.strip().startswith("#"): continue
                if re.match(r"\s*print\s*\(", line) and "# ok" not in line.lower():
                    found.append(f"{f.relative_to(ROOT)}:{i}")
    if found:
        for x in found: fail("DEBUG", x)
    else: ok("DEBUG", "Tidak ada console.log/print debug")

def check_duplicate_endpoints():
    section("CHECK: DUPLICATE ENDPOINTS")
    m = defaultdict(list)
    # Prefix-aware: resolve each router variable's APIRouter(prefix=...) so that
    # identical decorator paths under different prefixes are not false positives.
    router_def = re.compile(r'(\w+)\s*=\s*APIRouter\(([^)]*)\)')
    prefix_in = re.compile(r'prefix=[\'"]([^\'"]*)[\'"]')
    deco = re.compile(r'@(\w+)\.(get|post|put|patch|delete)\([\'"](.*?)[\'"]')
    rdir = BACKEND / "routers"
    files = list(rdir.glob("*.py")) if rdir.exists() else []
    if (BACKEND / "server.py").exists(): files.append(BACKEND / "server.py")
    for f in files:
        text = f.read_text()
        prefixes = {}
        for rm in router_def.finditer(text):
            pm = prefix_in.search(rm.group(2))
            prefixes[rm.group(1)] = pm.group(1) if pm else ""
        for dm in deco.finditer(text):
            var, method, path = dm.group(1), dm.group(2).upper(), dm.group(3)
            full = prefixes.get(var, "") + path
            m[f"{method} {full}"].append(f.name)
    dups = {k: v for k, v in m.items() if len(v) > 1}
    if dups:
        for e, fs in dups.items(): fail("DUPLICATE_ENDPOINT", f"{e} -> {', '.join(fs)}")
    else: ok("DUPLICATE_ENDPOINT", f"Tidak ada duplikat ({len(m)} endpoint)")

def check_forbidden_collections():
    section("CHECK: SSOT COLLECTION NAMES")
    pat = re.compile(r'db\.([a-z_]+)')
    found = []
    rdir = BACKEND / "routers"
    files = list(rdir.glob("*.py")) if rdir.exists() else []
    for f in files:
        for coll in set(pat.findall(f.read_text())):
            if coll in FORBIDDEN:
                found.append(f"{f.name}: db.{coll} (pakai prefix domain — lihat ENTITY_REGISTRY.md)")
    if found:
        for x in found: fail("FORBIDDEN_COLLECTION", x)
    else: ok("FORBIDDEN_COLLECTION", "Tidak ada nama collection terlarang")

def check_api_prefix():
    section("CHECK: API PREFIX /api")
    issues = []
    rdir = BACKEND / "routers"
    if rdir.exists():
        prefix_pat = re.compile(r'APIRouter\(prefix=[\'"]([^\'"]+)[\'"]')
        for f in rdir.glob("*.py"):
            c = f.read_text()
            for mt in prefix_pat.finditer(c):
                if not mt.group(1).startswith("/api"):
                    issues.append(f"{f.name}: prefix '{mt.group(1)}' bukan /api")
    if issues:
        for x in issues: warn("API_PREFIX", x)
    else: ok("API_PREFIX", "Prefix /api OK")

def check_testids():
    section("CHECK: DATA-TESTID COVERAGE")
    total, missing = 0, []
    if FRONTEND.exists():
        for f in FRONTEND.rglob("*.jsx"):
            c = f.read_text(); n = c.count("data-testid"); total += n
            if "features/" in str(f) and n == 0:
                missing.append(str(f.relative_to(ROOT)))
    if missing:
        for x in missing: warn("TESTID", f"{x}: tidak ada data-testid")
    else: ok("TESTID", f"OK (total {total} testid)")

def check_required_docs():
    section("CHECK: REQUIRED DOCS")
    req = [ROOT/"ENTITY_REGISTRY.md", ROOT/"plan.md", ROOT/"memory/PRD.md",
           ROOT/"memory/SESSION_HANDOFF.md", ROOT/"docs/KTI_00_AGENT_QUICK_START.md",
           ROOT/"docs/KTI_09_NAVIGATION_MAP.md"]
    for d in req:
        (ok if d.exists() else fail)("DOCS", f"{d.relative_to(ROOT)} {'OK' if d.exists() else 'TIDAK ADA'}")

def check_env():
    section("CHECK: ENV VARS")
    be = BACKEND/".env"; fe = ROOT/"frontend/.env"
    if be.exists():
        c = be.read_text()
        (ok if "MONGO_URL" in c else fail)("ENV", "backend MONGO_URL")
        (ok if "DB_NAME" in c else warn)("ENV", "backend DB_NAME")
    else: fail("ENV", "backend/.env tidak ada")
    if fe.exists():
        (ok if "REACT_APP_BACKEND_URL" in fe.read_text() else fail)("ENV", "frontend REACT_APP_BACKEND_URL")
    else: fail("ENV", "frontend/.env tidak ada")

def check_tech_debt():
    section("CHECK: TECH DEBT MARKERS")
    marks = []
    for base, exts, com in [(BACKEND/"routers", [".py"], "#"), (FRONTEND, [".jsx",".js"], "//")]:
        if not base.exists(): continue
        for f in iter_files(base, exts):
            for i, line in enumerate(f.read_text().splitlines(), 1):
                if re.search(rf'{re.escape(com)}\s*(TODO|FIXME|HACK|XXX|BUG)\b', line, re.I):
                    marks.append(f"{f.relative_to(ROOT)}:{i}")
    if marks:
        for x in marks[:15]: warn("TECH_DEBT", x)
    else: ok("TECH_DEBT", "Bersih")

def run(quick=False):
    check_file_sizes(); check_debug(); check_duplicate_endpoints()
    check_forbidden_collections(); check_required_docs(); check_env()
    if not quick:
        check_api_prefix(); check_testids(); check_tech_debt()

def report():
    counts = {"PASS":0,"FAIL":0,"WARN":0,"INFO":0}
    for s, c, m in results:
        counts[s] = counts.get(s,0)+1
        if s == "INFO": print(f"\n{m}")
        elif s == "PASS": print(f"  [PASS] [{c}] {m}")
        elif s == "WARN": print(f"  [WARN] [{c}] {m}")
        elif s == "FAIL": print(f"  [FAIL] [{c}] {m}")
    print("\n" + "="*60)
    print(f"  SUMMARY: {counts['PASS']} PASS | {counts['FAIL']} FAIL | {counts['WARN']} WARN")
    print("="*60)
    return counts["FAIL"]

if __name__ == "__main__":
    run(quick="--quick" in sys.argv)
    sys.exit(1 if report() > 0 else 0)
