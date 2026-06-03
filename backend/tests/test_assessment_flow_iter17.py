"""
Backend API tests for iteration 17:
Full assessment flow:
1. Template editing for published templates (KN3 ERP & RFID Discovery)
2. Toggle publish/unpublish
3. Create session (assign assessment)
4. Save answers (token-based public flow)
5. Submit assessment
6. Admin view results + PDF export
"""
import pytest
import requests
import os

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
        return (d.get("data", {}).get("access_token") or
                d.get("data", {}).get("token") or
                d.get("access_token") or
                d.get("token"))
    pytest.skip(f"Login failed: {resp.status_code} - {resp.text[:200]}")


@pytest.fixture(scope="module")
def admin_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


# ── 1. Template Listing & KN3 verification ────────────────────────────────────

class TestTemplateListAndKN3:
    """Template list, KN3 template details, question/domain counts."""

    def test_templates_list_200(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"

    def test_kn3_template_exists(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        templates = resp.json().get("data", [])
        kn3 = next((t for t in templates if "kn3" in t.get("id", "").lower() or
                    "erp" in str(t.get("name", {}).get("id", "")).lower()), None)
        assert kn3 is not None, f"KN3/ERP template not found in: {[t.get('id') for t in templates]}"
        print(f"KN3 template: id={kn3.get('id')}, domains={kn3.get('domain_count')}, questions={kn3.get('question_count')}")

    def test_kn3_has_82_questions(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        templates = resp.json().get("data", [])
        kn3 = next((t for t in templates if "kn3" in t.get("id", "").lower()), None)
        if not kn3:
            pytest.skip("KN3 template not found")
        qc = kn3.get("question_count", 0)
        assert qc == 82, f"Expected 82 questions, got {qc}"

    def test_kn3_has_14_domains(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        templates = resp.json().get("data", [])
        kn3 = next((t for t in templates if "kn3" in t.get("id", "").lower()), None)
        if not kn3:
            pytest.skip("KN3 template not found")
        dc = kn3.get("domain_count", 0)
        assert dc == 14, f"Expected 14 domains, got {dc}"

    def test_kn3_get_template_detail(self, admin_headers):
        """GET /api/assessment/templates/kn3-erp-discovery-v1 should return full template."""
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        templates = resp.json().get("data", [])
        kn3 = next((t for t in templates if "kn3" in t.get("id", "").lower()), None)
        if not kn3:
            pytest.skip("KN3 template not found")
        tpl_id = kn3.get("id")
        detail_resp = requests.get(f"{BASE_URL}/api/assessment/templates/{tpl_id}", headers=admin_headers)
        assert detail_resp.status_code == 200, f"GET template detail failed: {detail_resp.status_code}"
        detail = detail_resp.json().get("data", {})
        # Verify it has either sections or domains
        sections = detail.get("sections") or detail.get("domains") or []
        assert len(sections) > 0, "KN3 template has no sections/domains in detail"
        print(f"KN3 detail: {len(sections)} sections, first section: {sections[0].get('title', {}).get('id', '?') if sections else 'N/A'}")

    def test_kn3_questions_have_text(self, admin_headers):
        """All questions in KN3 template should have non-empty text or prompt."""
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        templates = resp.json().get("data", [])
        kn3 = next((t for t in templates if "kn3" in t.get("id", "").lower()), None)
        if not kn3:
            pytest.skip("KN3 template not found")
        tpl_id = kn3.get("id")
        detail_resp = requests.get(f"{BASE_URL}/api/assessment/templates/{tpl_id}", headers=admin_headers)
        detail = detail_resp.json().get("data", {})
        sections = detail.get("sections") or detail.get("domains") or []
        empty_text = 0
        total_q = 0
        for sec in sections:
            for q in sec.get("questions", []):
                total_q += 1
                text = q.get("text") or q.get("prompt") or {}
                if isinstance(text, dict):
                    text_str = text.get("id", "") or text.get("en", "") or ""
                else:
                    text_str = str(text)
                if not text_str.strip():
                    empty_text += 1
        print(f"KN3 questions: total={total_q}, empty_text={empty_text}")
        assert empty_text == 0, f"{empty_text} questions have empty text/prompt in KN3 template"


# ── 2. Template Edit (KN3 published template) ─────────────────────────────────

class TestTemplateEditing:
    """Test that published templates can be edited (auto-unpublishes)."""

    def test_edit_published_template_success(self, admin_headers):
        """Edit a published template — should succeed and auto-unpublish."""
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        templates = resp.json().get("data", [])
        # Find any published template (prefer KN3)
        published_tpl = next((t for t in templates if t.get("published")), None)
        if not published_tpl:
            pytest.skip("No published templates found to edit")

        tpl_id = published_tpl.get("id")
        was_published = published_tpl.get("published")
        print(f"Editing template: {tpl_id}, was_published={was_published}")

        # Minimal edit: just update description (send as string — tests backend acceptance of str description)
        patch_resp = requests.put(
            f"{BASE_URL}/api/assessment/templates/{tpl_id}",
            headers=admin_headers,
            json={"description": "Test description update (iter17)"}
        )
        assert patch_resp.status_code == 200, f"Edit failed: {patch_resp.status_code} - {patch_resp.text[:300]}"
        result = patch_resp.json().get("data", {})
        print(f"After edit: published={result.get('published')}")

    def test_edit_kn3_template_with_sections(self, admin_headers):
        """Edit KN3 template sections (description only) — should succeed, auto-unpublish if was published."""
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        templates = resp.json().get("data", [])
        kn3 = next((t for t in templates if "kn3" in t.get("id", "").lower()), None)
        if not kn3:
            pytest.skip("KN3 template not found")
        tpl_id = kn3.get("id")

        # GET the full template detail first
        detail_resp = requests.get(f"{BASE_URL}/api/assessment/templates/{tpl_id}", headers=admin_headers)
        detail = detail_resp.json().get("data", {})
        sections = detail.get("sections") or detail.get("domains") or []

        if not sections:
            pytest.skip("KN3 template has no sections to edit")

        # Send back the same sections (no-op edit, just to test endpoint works)
        edit_resp = requests.put(
            f"{BASE_URL}/api/assessment/templates/{tpl_id}",
            headers=admin_headers,
            json={
                "name": detail.get("name") or {"id": "ERP & RFID Discovery Questionnaire", "en": "ERP & RFID Discovery"},
                "description": "KN3 ERP & RFID Discovery Assessment Template",
                "sections": [
                    {
                        "id": s.get("id"),
                        "title": s.get("title") or {"id": "Section", "en": "Section"},
                        "description": s.get("description"),
                        "color": s.get("color"),
                        "icon": s.get("icon"),
                        "questions": [
                            {
                                "id": q.get("id"),
                                "text": q.get("text") or q.get("prompt") or {"id": "", "en": ""},
                                "type": q.get("type", "text"),
                                "options": q.get("options"),
                                "required": q.get("required", True),
                                "weight": q.get("weight", 1.0),
                                "hint": q.get("hint"),
                                "show_if": q.get("show_if"),
                                "scale_labels": q.get("scale_labels"),
                            }
                            for q in s.get("questions", [])
                        ]
                    }
                    for s in sections
                ]
            }
        )
        assert edit_resp.status_code == 200, f"KN3 edit failed: {edit_resp.status_code} - {edit_resp.text[:300]}"
        updated = edit_resp.json().get("data", {})
        print(f"KN3 edit OK: published={updated.get('published')}")
        # Verify questions are preserved
        updated_sections = updated.get("sections") or updated.get("domains") or []
        updated_q_count = sum(len(s.get("questions", [])) for s in updated_sections)
        print(f"Updated question count: {updated_q_count}")
        assert updated_q_count == 82, f"Question count changed after edit: {updated_q_count}"


# ── 3. Toggle Publish ─────────────────────────────────────────────────────────

class TestTogglePublish:
    """Test toggle publish/unpublish on templates."""

    def test_toggle_publish_kn3(self, admin_headers):
        """Toggle publish state of KN3 template."""
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        templates = resp.json().get("data", [])
        kn3 = next((t for t in templates if "kn3" in t.get("id", "").lower()), None)
        if not kn3:
            pytest.skip("KN3 template not found")

        tpl_id = kn3.get("id")
        before_state = kn3.get("published")

        toggle_resp = requests.post(
            f"{BASE_URL}/api/assessment/templates/{tpl_id}/publish",
            headers=admin_headers
        )
        assert toggle_resp.status_code == 200, f"Toggle publish failed: {toggle_resp.status_code} - {toggle_resp.text[:300]}"
        new_state = toggle_resp.json().get("data", {}).get("published")
        assert new_state != before_state, f"Published state did not toggle: was {before_state}, now {new_state}"
        print(f"KN3 publish toggled: {before_state} → {new_state}")

    def test_toggle_publish_again_kn3(self, admin_headers):
        """Toggle KN3 back to published state."""
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        templates = resp.json().get("data", [])
        kn3 = next((t for t in templates if "kn3" in t.get("id", "").lower()), None)
        if not kn3:
            pytest.skip("KN3 template not found")
        tpl_id = kn3.get("id")
        current_state = kn3.get("published")

        # If currently unpublished, toggle to publish
        if not current_state:
            toggle_resp = requests.post(
                f"{BASE_URL}/api/assessment/templates/{tpl_id}/publish",
                headers=admin_headers
            )
            assert toggle_resp.status_code == 200, f"Re-publish failed: {toggle_resp.status_code}"
            new_state = toggle_resp.json().get("data", {}).get("published")
            assert new_state is True, f"Expected published=True after toggle, got {new_state}"
            print(f"KN3 re-published: {new_state}")
        else:
            print(f"KN3 already published: {current_state}")


# ── 4. Create Session + Assign Assessment ─────────────────────────────────────

class TestCreateSession:
    """Create session and assign assessment to client."""

    def test_create_simple_session(self, admin_headers):
        """Create a minimal session using first available published template."""
        resp = requests.get(f"{BASE_URL}/api/assessment/templates", headers=admin_headers)
        templates = resp.json().get("data", [])
        published = [t for t in templates if t.get("published")]
        if not published:
            pytest.skip("No published templates available")
        tpl_id = published[0].get("id")
        tpl_name = str(published[0].get("name", {}).get("id", "Unknown"))

        session_resp = requests.post(
            f"{BASE_URL}/api/assessment/sessions",
            headers=admin_headers,
            json={
                "template_id": tpl_id,
                "client_name": "TEST_Client_Iter17",
                "project_name": "TEST_Project_Iter17",
            }
        )
        assert session_resp.status_code == 201, f"Create session failed: {session_resp.status_code} - {session_resp.text[:300]}"
        data = session_resp.json().get("data", {})
        assert data.get("id"), "Session ID missing"
        assert data.get("token"), "Session token missing"
        assert data.get("share_url"), "Share URL missing"
        print(f"Session created: id={data['id']}, token={data['token'][:8]}..., template={tpl_name}")

    def test_session_appears_in_list(self, admin_headers):
        """After creation, session should appear in admin list."""
        resp = requests.get(f"{BASE_URL}/api/assessment/sessions", headers=admin_headers)
        assert resp.status_code == 200, f"List sessions failed: {resp.status_code}"
        sessions = resp.json().get("data", [])
        test_sessions = [s for s in sessions if "TEST_Client_Iter17" in str(s.get("client_name", ""))]
        assert len(test_sessions) > 0, "Test session not found in list after creation"
        print(f"Test sessions in list: {len(test_sessions)}")


# ── 5. Full Flow: Token-based answer + submit ─────────────────────────────────

class TestFullAssessmentFlow:
    """Complete assessment flow: create template → create session → answer → submit → PDF."""

    @pytest.fixture(scope="class")
    def test_template_id(self, admin_headers):
        """Create a minimal test template with non-required questions."""
        payload = {
            "name": {"id": "TEST_Iter17_Template", "en": "Test Iter17 Template"},
            "description": "Auto-test template for iteration 17",
            "category": "custom",
            "sections": [
                {
                    "title": {"id": "Domain Test", "en": "Test Domain"},
                    "description": None,
                    "questions": [
                        {
                            "text": {"id": "Pertanyaan pertama (tidak wajib)", "en": "First question (optional)"},
                            "type": "text",
                            "required": False,
                            "weight": 1.0
                        },
                        {
                            "text": {"id": "Pertanyaan kedua (tidak wajib)", "en": "Second question (optional)"},
                            "type": "yesno",
                            "required": False,
                            "weight": 1.0
                        }
                    ]
                }
            ]
        }
        resp = requests.post(f"{BASE_URL}/api/assessment/templates", headers=admin_headers, json=payload)
        assert resp.status_code == 201, f"Create test template failed: {resp.status_code} - {resp.text[:200]}"
        tpl_id = resp.json()["data"]["id"]

        # Publish it
        pub_resp = requests.post(f"{BASE_URL}/api/assessment/templates/{tpl_id}/publish", headers=admin_headers)
        assert pub_resp.status_code == 200, f"Publish failed: {pub_resp.status_code}"
        print(f"Test template created+published: {tpl_id}")
        yield tpl_id

        # Cleanup
        requests.delete(f"{BASE_URL}/api/assessment/templates/{tpl_id}", headers=admin_headers)
        print(f"Test template deleted: {tpl_id}")

    @pytest.fixture(scope="class")
    def test_session(self, admin_headers, test_template_id):
        """Create a test session."""
        resp = requests.post(
            f"{BASE_URL}/api/assessment/sessions",
            headers=admin_headers,
            json={
                "template_id": test_template_id,
                "client_name": "TEST_Flow_Client",
                "project_name": "TEST_Flow_Project"
            }
        )
        assert resp.status_code == 201, f"Create session failed: {resp.status_code} - {resp.text[:200]}"
        data = resp.json()["data"]
        print(f"Test session created: id={data['id']}, token={data['token'][:8]}...")
        yield data

        # Cleanup: delete session
        session_id = data.get("id")
        if session_id:
            requests.delete(f"{BASE_URL}/api/assessment/sessions/{session_id}", headers=admin_headers)
            print(f"Test session deleted: {session_id}")

    def test_get_session_by_token(self, test_session):
        """Public token endpoint should return session with template."""
        token = test_session.get("token")
        resp = requests.get(f"{BASE_URL}/api/assessment/{token}")
        assert resp.status_code == 200, f"Get session by token failed: {resp.status_code} - {resp.text[:200]}"
        data = resp.json().get("data", {})
        assert data.get("template"), "Template missing from session response"
        assert data.get("status") == "draft", f"Expected status=draft, got {data.get('status')}"
        print(f"Session by token: status={data.get('status')}, template_id={data.get('template_id')}")

    def test_save_answers_via_token(self, admin_headers, test_session):
        """Save answers using public token endpoint."""
        token = test_session.get("token")

        # Get session to find question IDs
        sess_resp = requests.get(f"{BASE_URL}/api/assessment/{token}")
        data = sess_resp.json().get("data", {})
        template = data.get("template", {})
        sections = template.get("sections") or template.get("domains") or []

        answers = []
        for sec in sections:
            for q in sec.get("questions", []):
                qid = q.get("id")
                qtype = q.get("type", "text")
                val = "yes" if qtype == "yesno" else "Test answer"
                answers.append({"question_id": qid, "value": val})

        assert len(answers) > 0, "No questions found to answer"

        save_resp = requests.post(
            f"{BASE_URL}/api/assessment/{token}/answers",
            json=answers
        )
        assert save_resp.status_code == 200, f"Save answers failed: {save_resp.status_code} - {save_resp.text[:200]}"
        saved = save_resp.json().get("data", {}).get("saved", 0)
        assert saved == len(answers), f"Expected {len(answers)} answers saved, got {saved}"
        print(f"Saved {saved} answers via token")

    def test_submit_session_via_token(self, test_session):
        """Submit session via public token endpoint."""
        token = test_session.get("token")
        submit_resp = requests.post(f"{BASE_URL}/api/assessment/{token}/submit")
        assert submit_resp.status_code == 200, f"Submit failed: {submit_resp.status_code} - {submit_resp.text[:200]}"
        result = submit_resp.json().get("data", {})
        assert result.get("status") == "submitted", f"Expected status=submitted, got {result.get('status')}"
        print(f"Session submitted: status={result.get('status')}")

    def test_session_status_after_submit(self, test_session):
        """After submit, GET session should show status=submitted."""
        token = test_session.get("token")
        resp = requests.get(f"{BASE_URL}/api/assessment/{token}")
        assert resp.status_code == 200
        data = resp.json().get("data", {})
        assert data.get("status") == "submitted", f"Session status not 'submitted': {data.get('status')}"
        print(f"Session status confirmed: {data.get('status')}")

    def test_admin_view_session_detail(self, admin_headers, test_session):
        """Admin GET /sessions/{id}/detail should return full session with answers."""
        session_id = test_session.get("id")
        resp = requests.get(
            f"{BASE_URL}/api/assessment/sessions/{session_id}/detail",
            headers=admin_headers
        )
        assert resp.status_code == 200, f"Session detail failed: {resp.status_code} - {resp.text[:200]}"
        data = resp.json().get("data", {})
        assert data.get("status") == "submitted"
        assert data.get("template"), "No template in session detail"
        assert isinstance(data.get("answers_map"), dict), "No answers_map in session detail"
        print(f"Session detail: status={data.get('status')}, answers_count={len(data.get('answers_map', {}))}")

    def test_pdf_export(self, test_session):
        """PDF export should return PDF content for submitted session."""
        token = test_session.get("token")
        resp = requests.get(f"{BASE_URL}/api/assessment/{token}/export?locale=id")
        assert resp.status_code == 200, f"PDF export failed: {resp.status_code} - {resp.text[:200]}"
        ct = resp.headers.get("content-type", "")
        assert "pdf" in ct.lower(), f"Expected PDF content-type, got {ct}"
        assert len(resp.content) > 100, "PDF content too small"
        print(f"PDF exported: {len(resp.content)} bytes, content-type={ct}")

    def test_cannot_submit_twice(self, test_session):
        """Submitting an already-submitted session should return 409."""
        token = test_session.get("token")
        resp = requests.post(f"{BASE_URL}/api/assessment/{token}/submit")
        assert resp.status_code == 409, f"Expected 409 for duplicate submit, got {resp.status_code}"
        print(f"Duplicate submit blocked: {resp.status_code}")


# ── 6. Admin Session List + Stats ─────────────────────────────────────────────

class TestAdminSessionsAndStats:
    """Admin sessions list, stats, and session detail."""

    def test_sessions_list_200(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/assessment/sessions", headers=admin_headers)
        assert resp.status_code == 200
        sessions = resp.json().get("data", [])
        print(f"Total sessions in list: {len(sessions)}")

    def test_sessions_have_progress(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/assessment/sessions", headers=admin_headers)
        sessions = resp.json().get("data", [])
        for s in sessions[:3]:  # Check first 3
            progress = s.get("progress")
            assert progress is not None, f"Session {s.get('id')} missing progress"
            assert "percent" in progress, f"Progress missing 'percent' for session {s.get('id')}"

    def test_stats_endpoint(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/assessment/stats", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json().get("data", {})
        assert "total_sessions" in data
        assert "submitted_sessions" in data
        assert "total_templates" in data
        print(f"Stats: {data}")

    def test_session_detail_with_submitted(self, admin_headers):
        """Get session detail for a submitted session."""
        resp = requests.get(f"{BASE_URL}/api/assessment/sessions", headers=admin_headers)
        sessions = resp.json().get("data", [])
        submitted = [s for s in sessions if s.get("status") == "submitted"]
        if not submitted:
            pytest.skip("No submitted sessions found")
        session_id = submitted[0].get("id")
        detail_resp = requests.get(
            f"{BASE_URL}/api/assessment/sessions/{session_id}/detail",
            headers=admin_headers
        )
        assert detail_resp.status_code == 200, f"Session detail failed: {detail_resp.status_code}"
        data = detail_resp.json().get("data", {})
        assert data.get("status") == "submitted"
        assert data.get("template") is not None
        print(f"Submitted session detail OK: session_id={session_id}")
