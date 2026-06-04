"""Backend tests for PDF Config and PDF Export features - Iteration 19"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

ADMIN_CREDS = {"email": "admin@kubus.id", "password": "Admin#2026"}
SUBMITTED_SESSION = "912ff0c5-41d4-458d-b4dc-d7cefd35561f"
DRAFT_SESSION = "fe7b000b-5915-4064-9e10-3f4adb922ceb"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return r.json()["data"]["access_token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


class TestPDFConfig:
    """GET /api/admin/pdf-config"""

    def test_get_config_returns_200(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/admin/pdf-config", headers=auth_headers)
        assert r.status_code == 200

    def test_get_config_has_required_keys(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/admin/pdf-config", headers=auth_headers)
        data = r.json()["data"]
        for key in ["company_name", "brand_color", "show_cover", "show_scoring", "show_summary"]:
            assert key in data, f"Missing key: {key}"

    def test_put_config_and_verify(self, auth_headers):
        new_name = "TEST_CompanyPDF"
        r = requests.put(
            f"{BASE_URL}/api/admin/pdf-config",
            headers=auth_headers,
            json={"data": {"company_name": new_name}},
        )
        assert r.status_code == 200
        saved = r.json()["data"]
        assert saved["company_name"] == new_name

        # Verify persistence
        r2 = requests.get(f"{BASE_URL}/api/admin/pdf-config", headers=auth_headers)
        assert r2.json()["data"]["company_name"] == new_name


class TestPDFPreview:
    """GET /api/admin/pdf-config/preview"""

    def test_preview_returns_pdf(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/admin/pdf-config/preview", headers=auth_headers)
        assert r.status_code == 200
        assert r.headers.get("Content-Type", "").startswith("application/pdf")
        assert len(r.content) > 3000, f"PDF too small: {len(r.content)} bytes"

    def test_preview_with_session_id(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/admin/pdf-config/preview?session_id={SUBMITTED_SESSION}",
            headers=auth_headers,
        )
        assert r.status_code == 200
        assert len(r.content) > 3000


class TestPDFExport:
    """GET /api/assessment/sessions/{session_id}/export-pdf"""

    def test_export_submitted_session(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/assessment/sessions/{SUBMITTED_SESSION}/export-pdf",
            headers=auth_headers,
        )
        assert r.status_code == 200
        assert len(r.content) > 2000

    def test_export_draft_session_no_409(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/assessment/sessions/{DRAFT_SESSION}/export-pdf",
            headers=auth_headers,
        )
        assert r.status_code != 409, "Draft session should not return 409"
        assert r.status_code == 200
        assert len(r.content) > 2000
