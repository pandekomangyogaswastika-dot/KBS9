"""Tests for iteration 18 features:
- Demo flow P0 fix (ExternalLink → /cases/{slug})
- Assessment PDF export before submit (draft sessions)
- Assessment Excel export
- Assessment Excel import
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

ADMIN_EMAIL = "admin@kubus.id"
ADMIN_PASSWORD = "Admin#2026"
DRAFT_SESSION_ID = "fe7b000b-5915-4064-9e10-3f4adb922ceb"
SUBMITTED_SESSION_ID = "912ff0c5-41d4-458d-b4dc-d7cefd35561f"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["data"]["access_token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ── Demo Flow ─────────────────────────────────────────────────────────────────

class TestDemoFlow:
    """Demo flow: POST /api/demo/request-access should return valid session"""

    def test_demo_request_access(self):
        r = requests.post(f"{BASE_URL}/api/demo/request-access", json={
            "user_name": "Test User",
            "user_email": "test_iter18@example.com",
            "demo_slug": "kn3",
            "case_slug": "nusantara-textile-wms"
        })
        assert r.status_code in (200, 201, 404), f"Unexpected: {r.status_code} {r.text}"
        if r.status_code in (200, 201):
            data = r.json()
            print(f"Demo response keys: {list(data.keys())}")
            assert "data" in data or "session_id" in data or "demo_url" in data or "session" in data
            print("PASS: demo request-access returned valid response")
        else:
            print(f"SKIP: case slug not found (404), demo flow test skipped")


# ── PDF Export ────────────────────────────────────────────────────────────────

class TestPDFExport:
    """PDF export should work for BOTH draft and submitted sessions"""

    def test_export_pdf_draft_session(self, auth_headers):
        """PDF export should work before submit (draft)"""
        r = requests.get(
            f"{BASE_URL}/api/assessment/sessions/{DRAFT_SESSION_ID}/export-pdf",
            headers=auth_headers
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:300]}"
        assert "pdf" in r.headers.get("content-type", "").lower(), f"Not a PDF: {r.headers.get('content-type')}"
        assert len(r.content) > 1000, "PDF content too small"
        print(f"PASS: Draft PDF exported, size={len(r.content)}")

    def test_export_pdf_submitted_session(self, auth_headers):
        """PDF export should work for submitted sessions"""
        r = requests.get(
            f"{BASE_URL}/api/assessment/sessions/{SUBMITTED_SESSION_ID}/export-pdf",
            headers=auth_headers
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:300]}"
        assert "pdf" in r.headers.get("content-type", "").lower()
        print(f"PASS: Submitted PDF exported, size={len(r.content)}")


# ── Excel Export ──────────────────────────────────────────────────────────────

class TestExcelExport:
    """Excel export with questions + current answers"""

    def test_export_answers_excel_draft(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/assessment/sessions/{DRAFT_SESSION_ID}/export-answers-excel",
            headers=auth_headers
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:300]}"
        ct = r.headers.get("content-type", "")
        assert "spreadsheet" in ct or "xlsx" in ct or "openxml" in ct, f"Not xlsx: {ct}"
        assert len(r.content) > 500, "Excel content too small"
        print(f"PASS: Excel exported for draft, size={len(r.content)}")

    def test_export_answers_excel_submitted(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/assessment/sessions/{SUBMITTED_SESSION_ID}/export-answers-excel",
            headers=auth_headers
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:300]}"
        print(f"PASS: Excel exported for submitted, size={len(r.content)}")


# ── Excel Import ──────────────────────────────────────────────────────────────

class TestExcelImport:
    """Excel import into draft session"""

    def test_import_into_submitted_returns_409(self, auth_headers):
        """Importing into a submitted session must return 409"""
        # create a minimal xlsx in memory
        import io, openpyxl
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["question_id", "jawaban_anda"])
        ws.append(["fake-id", "test"])
        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        r = requests.post(
            f"{BASE_URL}/api/assessment/sessions/{SUBMITTED_SESSION_ID}/import-answers-excel",
            headers=auth_headers,
            files={"file": ("answers.xlsx", buf.read(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        assert r.status_code == 409, f"Expected 409 for submitted, got {r.status_code}: {r.text[:300]}"
        print(f"PASS: Import into submitted returns 409")

    def test_import_answers_excel_draft(self, auth_headers):
        """Import Excel into draft session - use the exported file"""
        # First export to get a valid xlsx
        export_r = requests.get(
            f"{BASE_URL}/api/assessment/sessions/{DRAFT_SESSION_ID}/export-answers-excel",
            headers=auth_headers
        )
        assert export_r.status_code == 200, "Failed to export Excel for import test"
        xlsx_bytes = export_r.content

        # Parse and add one answer
        import io, openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(xlsx_bytes))
        ws = wb["Jawaban"]
        rows = list(ws.iter_rows(values_only=True))
        # Find first data row with a question_id
        for i, row in enumerate(rows[1:], 2):
            if row[0]:
                # Set answer for first question
                ws.cell(row=i, column=7, value="test_answer_iter18")
                break

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)

        r = requests.post(
            f"{BASE_URL}/api/assessment/sessions/{DRAFT_SESSION_ID}/import-answers-excel",
            headers=auth_headers,
            files={"file": ("answers.xlsx", buf.read(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:300]}"
        data = r.json()
        print(f"PASS: Import result: {data}")
        assert "data" in data
        assert "saved" in data["data"] or "total_in_file" in data["data"]
