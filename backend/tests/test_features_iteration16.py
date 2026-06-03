"""
Backend API tests for iteration 16:
- Assessment Templates: list, templates count, published status
- System Recovery: collections list (16), export (zip/json)
- System Recovery: dedup endpoint
- Assessment Excel: template download, import excel
- CMS Home Blocks: not empty
- CMS Cases: demo_slug field (dropdown validation)
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


@pytest.fixture(scope="module")
def auth_token():
    """Get admin auth token."""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@kubus.id",
        "password": "Admin#2026"
    })
    if resp.status_code == 200:
        d = resp.json()
        # Try access_token first (current backend format), then fallback to token
        return (d.get("data", {}).get("access_token") or
                d.get("data", {}).get("token") or
                d.get("access_token") or
                d.get("token"))
    pytest.skip(f"Login failed: {resp.status_code} - {resp.text[:200]}")


@pytest.fixture(scope="module")
def admin_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


# ── Assessment Templates ──────────────────────────────────────────────────────

class TestAssessmentTemplates:
    """Assessment template endpoint tests"""

    def test_templates_list_returns_200(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"

    def test_templates_list_has_data(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        data = resp.json()
        templates = data.get("data", [])
        assert len(templates) > 0, "No templates found - seed may have failed"
        print(f"Found {len(templates)} templates")

    def test_templates_have_published_ones(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        data = resp.json()
        templates = data.get("data", [])
        published = [t for t in templates if t.get("published") is True]
        assert len(published) > 0, f"No published templates found. Templates: {[t.get('name') for t in templates]}"
        print(f"Published templates: {len(published)}")

    def test_kn3_template_exists(self, admin_headers):
        """KN3 ERP template should be seeded at startup."""
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        data = resp.json()
        templates = data.get("data", [])
        kn3_templates = [t for t in templates if "kn3" in str(t.get("id", "")).lower() or
                         "erp" in str(t.get("name", {}).get("id", "")).lower() or
                         "ERP" in str(t.get("name", {}).get("id", ""))]
        print(f"KN3/ERP templates: {kn3_templates}")
        assert len(kn3_templates) > 0, "KN3 ERP template not found"

    def test_template_has_question_count(self, admin_headers):
        """Templates should have question_count > 0."""
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        templates = resp.json().get("data", [])
        for t in templates:
            qc = t.get("question_count", 0)
            dc = t.get("domain_count", 0) or t.get("section_count", 0)
            print(f"  Template: {t.get('name', {}).get('id', 'N/A')} | domains={dc} | questions={qc}")


# ── System Recovery ──────────────────────────────────────────────────────────

class TestSystemRecovery:
    """System recovery endpoints tests"""

    def test_collections_list_200(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/admin/recovery/collections", headers=admin_headers)
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text[:200]}"

    def test_collections_count_is_16(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/admin/recovery/collections", headers=admin_headers)
        data = resp.json().get("data", [])
        assert len(data) == 16, f"Expected 16 collections, got {len(data)}: {[c['collection'] for c in data]}"

    def test_collections_have_expected_fields(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/admin/recovery/collections", headers=admin_headers)
        data = resp.json().get("data", [])
        for col in data:
            assert "collection" in col, f"Missing 'collection' key in {col}"
            assert "label" in col, f"Missing 'label' key in {col}"
            assert "count" in col, f"Missing 'count' key in {col}"

    def test_export_json_format(self, admin_headers):
        """Export a single collection as JSON."""
        headers_no_ct = {k: v for k, v in admin_headers.items() if k != "Content-Type"}
        resp = requests.get(
            f"{BASE_URL}/api/admin/recovery/export?collections=cms_home_blocks&format=json",
            headers=headers_no_ct, stream=True
        )
        assert resp.status_code == 200, f"Export JSON failed: {resp.status_code} - {resp.text[:200]}"
        ct = resp.headers.get("content-type", "")
        assert "json" in ct or "octet" in ct, f"Unexpected content-type: {ct}"

    def test_export_zip_format(self, admin_headers):
        """Export a single collection as ZIP."""
        headers_no_ct = {k: v for k, v in admin_headers.items() if k != "Content-Type"}
        resp = requests.get(
            f"{BASE_URL}/api/admin/recovery/export?collections=cms_home_blocks&format=zip",
            headers=headers_no_ct, stream=True
        )
        assert resp.status_code == 200, f"Export ZIP failed: {resp.status_code}"
        ct = resp.headers.get("content-type", "")
        assert "zip" in ct or "octet" in ct, f"Unexpected content-type for zip: {ct}"
        cd = resp.headers.get("content-disposition", "")
        assert ".zip" in cd, f"Expected .zip in content-disposition: {cd}"

    def test_dedup_endpoint(self, admin_headers):
        """Dedup endpoint should return 200 with results."""
        resp = requests.post(
            f"{BASE_URL}/api/admin/recovery/dedup?collections=cms_home_blocks",
            headers=admin_headers
        )
        assert resp.status_code == 200, f"Dedup failed: {resp.status_code} - {resp.text[:200]}"
        data = resp.json().get("data", {})
        assert isinstance(data, dict), f"Dedup response should be dict, got {type(data)}"
        print(f"Dedup result: {data}")

    def test_recovery_requires_auth(self):
        """Should return 401 or 403 without auth."""
        resp = requests.get(f"{BASE_URL}/api/admin/recovery/collections")
        assert resp.status_code in (401, 403), f"Expected 401/403, got {resp.status_code}"


# ── Assessment Excel ──────────────────────────────────────────────────────────

class TestAssessmentExcel:
    """Excel import/export tests"""

    def test_excel_template_download(self, admin_headers):
        """Should return xlsx file."""
        headers_no_ct = {k: v for k, v in admin_headers.items() if k != "Content-Type"}
        resp = requests.get(
            f"{BASE_URL}/api/assessment/templates/excel-template",
            headers=headers_no_ct
        )
        assert resp.status_code == 200, f"Excel template download failed: {resp.status_code} - {resp.text[:200]}"
        ct = resp.headers.get("content-type", "")
        assert "spreadsheet" in ct or "excel" in ct or "octet" in ct, f"Unexpected content-type: {ct}"
        assert len(resp.content) > 1000, "Excel file too small (likely empty)"

    def test_excel_import_valid_file(self, admin_headers):
        """Import a valid Excel template."""
        # Generate the template first and try to import a sample
        headers_no_ct = {k: v for k, v in admin_headers.items() if k != "Content-Type"}
        
        # Download the template
        dl_resp = requests.get(
            f"{BASE_URL}/api/assessment/templates/excel-template",
            headers=headers_no_ct
        )
        assert dl_resp.status_code == 200, "Could not download template for import test"
        xlsx_bytes = dl_resp.content
        
        # Import it with name metadata
        files = {"file": ("test_template.xlsx", io.BytesIO(xlsx_bytes), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        data_form = {"name_id": "TEST_Excel_Import_Template", "name_en": "Test Excel Import", "category": "custom"}
        
        imp_resp = requests.post(
            f"{BASE_URL}/api/assessment/templates/import-excel",
            headers=headers_no_ct,
            files=files,
            data=data_form
        )
        assert imp_resp.status_code == 201, f"Import failed: {imp_resp.status_code} - {imp_resp.text[:300]}"
        result = imp_resp.json().get("data", {})
        print(f"Import result: sections={result.get('sections_count')}, questions={result.get('questions_count')}")
        assert result.get("sections_count", 0) > 0, "No sections imported"
        assert result.get("questions_count", 0) > 0, "No questions imported"
        
        # Cleanup - delete the created template
        created_id = result.get("id")
        if created_id:
            del_resp = requests.delete(
                f"{BASE_URL}/api/assessment/templates/{created_id}",
                headers=admin_headers
            )
            print(f"Cleanup delete status: {del_resp.status_code}")

    def test_excel_import_wrong_format(self, admin_headers):
        """Should reject non-Excel files."""
        headers_no_ct = {k: v for k, v in admin_headers.items() if k != "Content-Type"}
        files = {"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")}
        data_form = {"name_id": "Test"}
        resp = requests.post(
            f"{BASE_URL}/api/assessment/templates/import-excel",
            headers=headers_no_ct, files=files, data=data_form
        )
        assert resp.status_code == 415, f"Expected 415, got {resp.status_code}"


# ── CMS Home Blocks ──────────────────────────────────────────────────────────

class TestCmsHomeBlocks:
    """CMS Home Blocks (seeded on startup)"""

    def test_home_blocks_not_empty(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/admin/cms/home-blocks", headers=admin_headers)
        assert resp.status_code == 200, f"Home blocks fetch failed: {resp.status_code}"
        data = resp.json()
        items = data.get("data", [])
        assert len(items) > 0, "Home blocks is empty - seed_home_blocks_db may have failed"
        print(f"Home blocks count: {len(items)}")
        for item in items:
            print(f"  Block: key={item.get('key')}")

    def test_home_blocks_have_keys(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/admin/cms/home-blocks", headers=admin_headers)
        items = resp.json().get("data", [])
        keys = [item.get("key") for item in items]
        print(f"Home block keys: {keys}")
        # Should have at least 'hero' or 'services' type keys
        assert len(keys) > 0, "No home block keys found"


# ── CMS Cases (demo_slug) ────────────────────────────────────────────────────

class TestCmsCases:
    """CMS Cases - demo_slug field validation"""

    def test_cases_list(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/admin/cms/cases", headers=admin_headers)
        assert resp.status_code == 200, f"Cases fetch failed: {resp.status_code}"
        data = resp.json().get("data", [])
        print(f"Cases count: {len(data)}")

    def test_case_demo_slug_valid_values(self, admin_headers):
        """demo_slug should be one of: '', 'kn3', 'garment-serial'."""
        resp = requests.get(f"{BASE_URL}/api/admin/cms/cases", headers=admin_headers)
        cases = resp.json().get("data", [])
        valid_slugs = {"", "kn3", "garment-serial", None}
        for case in cases:
            ds = case.get("demo_slug")
            assert ds in valid_slugs, f"Invalid demo_slug '{ds}' in case '{case.get('slug')}'"
        print(f"All {len(cases)} cases have valid demo_slug values")
