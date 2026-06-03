#!/usr/bin/env python3
"""
Backend API Testing for KBS8 Platform
Tests public endpoints, authentication, and role-based access
"""

import requests
import sys
from datetime import datetime

class KBS8APITester:
    def __init__(self, base_url="https://kbs8-system.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.client_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, description=""):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        if description:
            print(f"   Description: {description}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"   ✅ PASSED - Status: {response.status_code}")
                try:
                    resp_json = response.json()
                    if 'data' in resp_json:
                        print(f"   Response data keys: {list(resp_json.get('data', {}).keys())}")
                except:
                    pass
            else:
                print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.text[:200]}")
                except:
                    pass
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint
                })

            return success, response.json() if response.text else {}

        except requests.exceptions.Timeout:
            print(f"   ❌ FAILED - Request timeout")
            self.failed_tests.append({
                "test": name,
                "error": "Timeout",
                "endpoint": endpoint
            })
            return False, {}
        except Exception as e:
            print(f"   ❌ FAILED - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e),
                "endpoint": endpoint
            })
            return False, {}

    def test_health_check(self):
        """Test backend health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "/api/health",
            200,
            description="Verify backend is running and healthy"
        )
        if success and response.get('data', {}).get('status') == 'healthy':
            print("   ✅ Backend is healthy")
            return True
        return False

    def test_services_endpoint(self):
        """Test public services endpoint"""
        success, response = self.run_test(
            "Public Services",
            "GET",
            "/api/services",
            200,
            description="Fetch public services list"
        )
        if success:
            services = response.get('data', [])
            print(f"   ✅ Found {len(services)} services")
            return True
        return False

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "/api/auth/login",
            200,
            data={"email": "admin@kubus.id", "password": "Admin#2026"},
            description="Login as admin user"
        )
        if success and 'data' in response:
            data = response['data']
            if 'access_token' in data:
                self.admin_token = data['access_token']
                print(f"   ✅ Admin token obtained")
                print(f"   User: {data.get('user', {}).get('name', 'N/A')}")
                print(f"   Role: {data.get('user', {}).get('role', 'N/A')}")
                return True
        return False

    def test_client_login(self):
        """Test client login"""
        success, response = self.run_test(
            "Client Login",
            "POST",
            "/api/auth/login",
            200,
            data={"email": "client@kubus.id", "password": "Client#2026"},
            description="Login as client user"
        )
        if success and 'data' in response:
            data = response['data']
            if 'access_token' in data:
                self.client_token = data['access_token']
                print(f"   ✅ Client token obtained")
                print(f"   User: {data.get('user', {}).get('name', 'N/A')}")
                print(f"   Role: {data.get('user', {}).get('role', 'N/A')}")
                return True
        return False

    def test_admin_dashboard_stats(self):
        """Test admin dashboard stats endpoint"""
        if not self.admin_token:
            print("   ⚠️  SKIPPED - No admin token")
            return False
        
        success, response = self.run_test(
            "Admin Dashboard Stats",
            "GET",
            "/api/admin/stats",
            200,
            token=self.admin_token,
            description="Fetch admin dashboard statistics"
        )
        return success

    def test_admin_users_list(self):
        """Test admin users list endpoint"""
        if not self.admin_token:
            print("   ⚠️  SKIPPED - No admin token")
            return False
        
        success, response = self.run_test(
            "Admin Users List",
            "GET",
            "/api/admin/users",
            200,
            token=self.admin_token,
            description="Fetch system users list"
        )
        if success:
            users = response.get('data', [])
            print(f"   ✅ Found {len(users)} users")
        return success

    def test_client_projects(self):
        """Test client projects endpoint"""
        if not self.client_token:
            print("   ⚠️  SKIPPED - No client token")
            return False
        
        success, response = self.run_test(
            "Client Projects",
            "GET",
            "/api/projects/my",
            200,
            token=self.client_token,
            description="Fetch client's projects"
        )
        if success:
            projects = response.get('data', [])
            print(f"   ✅ Found {len(projects)} projects")
        return success

    def test_assessment_templates_list(self):
        """Test assessment templates list - should include KN3 ERP Discovery"""
        if not self.admin_token:
            print("   ⚠️  SKIPPED - No admin token")
            return False
        
        success, response = self.run_test(
            "Assessment Templates List",
            "GET",
            "/api/assessment/templates",
            200,
            token=self.admin_token,
            description="Fetch assessment templates (should include KN3 ERP Discovery)"
        )
        if success:
            templates = response.get('data', [])
            print(f"   ✅ Found {len(templates)} templates")
            # Check for KN3 template
            kn3_template = None
            for t in templates:
                if 'kn3' in t.get('id', '').lower() or 'erp' in str(t.get('name', '')).lower():
                    kn3_template = t
                    print(f"   ✅ Found KN3 ERP Discovery template: {t.get('id')}")
                    print(f"      Domains: {t.get('section_count', 0)}, Questions: {t.get('question_count', 0)}")
                    self.kn3_template_id = t.get('id')
                    break
            if not kn3_template:
                print(f"   ⚠️  KN3 ERP Discovery template not found in {len(templates)} templates")
        return success

    def test_create_assessment_session(self):
        """Test creating assessment session with KN3 template"""
        if not self.admin_token or not hasattr(self, 'kn3_template_id'):
            print("   ⚠️  SKIPPED - No admin token or KN3 template ID")
            return False
        
        # Get client user ID first
        success, response = self.run_test(
            "Get Client User ID",
            "GET",
            "/api/admin/users",
            200,
            token=self.admin_token,
            description="Get client user ID for session creation"
        )
        
        client_user_id = None
        if success:
            users = response.get('data', [])
            for u in users:
                if u.get('email') == 'client@kubus.id':
                    client_user_id = u.get('id')
                    break
        
        if not client_user_id:
            print("   ⚠️  Could not find client user ID")
            return False
        
        success, response = self.run_test(
            "Create Assessment Session",
            "POST",
            "/api/assessment/sessions",
            201,
            data={
                "template_id": self.kn3_template_id,
                "client_name": "Test Client Company",
                "client_user_id": client_user_id,
                "project_name": "KN3 ERP Discovery Test",
                "contact_person": "Test Contact",
                "contact_email": "client@kubus.id",
                "locale": "id"
            },
            token=self.admin_token,
            description="Create new assessment session with KN3 template"
        )
        if success:
            session = response.get('data', {})
            self.test_session_id = session.get('id')
            self.test_session_token = session.get('token')
            print(f"   ✅ Session created: {self.test_session_id}")
            print(f"   Token: {self.test_session_token}")
            print(f"   Share URL: {session.get('share_url')}")
        return success

    def test_client_assessments_list(self):
        """Test client can see their assessments"""
        if not self.client_token:
            print("   ⚠️  SKIPPED - No client token")
            return False
        
        success, response = self.run_test(
            "Client Assessments List",
            "GET",
            "/api/assessment/my",
            200,
            token=self.client_token,
            description="Client fetches their assigned assessments"
        )
        if success:
            assessments = response.get('data', [])
            print(f"   ✅ Found {len(assessments)} assessments for client")
            if assessments:
                for a in assessments:
                    template_name = a.get('template_name')
                    # Verify template_name is a string, not dict
                    if isinstance(template_name, str):
                        print(f"      ✅ template_name is string: {template_name}")
                    else:
                        print(f"      ❌ template_name is NOT string: {type(template_name)} - {template_name}")
                    print(f"      - {a.get('client_name')} ({a.get('status')})")
                    # Store first session ID for further testing
                    if not hasattr(self, 'client_session_id'):
                        self.client_session_id = a.get('id')
        return success

    def test_session_detail(self):
        """Test getting session detail with 3-view structure"""
        if not self.admin_token or not hasattr(self, 'test_session_id'):
            print("   ⚠️  SKIPPED - No admin token or session ID")
            return False
        
        success, response = self.run_test(
            "Get Session Detail",
            "GET",
            f"/api/assessment/sessions/{self.test_session_id}/detail",
            200,
            token=self.admin_token,
            description="Get session detail (should show domains for 3 views)"
        )
        if success:
            data = response.get('data', {})
            template = data.get('template', {})
            domains = template.get('domains', [])
            progress = data.get('progress', {})
            print(f"   ✅ Session detail retrieved")
            print(f"      Template: {template.get('name', {}).get('id', 'N/A')}")
            print(f"      Domains: {len(domains)}")
            print(f"      Progress: {progress.get('percent', 0)}%")
            if domains:
                print(f"      First domain: {domains[0].get('title', {}).get('id', 'N/A')}")
        return success

    def test_client_session_detail(self):
        """Test client can access their session detail"""
        if not self.client_token or not hasattr(self, 'client_session_id'):
            print("   ⚠️  SKIPPED - No client token or session ID")
            return False
        
        success, response = self.run_test(
            "Client Session Detail",
            "GET",
            f"/api/assessment/sessions/{self.client_session_id}/detail",
            200,
            token=self.client_token,
            description="Client fetches session detail with template and questions"
        )
        if success:
            data = response.get('data', {})
            template = data.get('template', {})
            domains = template.get('domains', [])
            progress = data.get('progress', {})
            print(f"   ✅ Client session detail retrieved")
            print(f"      Template: {template.get('name', {}).get('id', 'N/A')}")
            print(f"      Domains: {len(domains)}")
            print(f"      Progress: {progress.get('percent', 0)}%")
            # Store first question ID for answer testing
            if domains and domains[0].get('questions'):
                self.test_question_id = domains[0]['questions'][0].get('id')
                print(f"      First question ID: {self.test_question_id}")
        return success

    def test_save_answers(self):
        """Test saving answers (auto-save functionality)"""
        if not self.client_token or not hasattr(self, 'client_session_id') or not hasattr(self, 'test_question_id'):
            print("   ⚠️  SKIPPED - No client token, session ID, or question ID")
            return False
        
        success, response = self.run_test(
            "Save Answers (Auto-save)",
            "PATCH",
            f"/api/assessment/sessions/{self.client_session_id}/answers",
            200,
            data=[
                {
                    "question_id": self.test_question_id,
                    "value": "Test answer from backend test",
                    "skipped": False
                }
            ],
            token=self.client_token,
            description="Test auto-save functionality by saving an answer"
        )
        if success:
            saved_count = response.get('data', {}).get('saved', 0)
            print(f"   ✅ Saved {saved_count} answer(s)")
        return success

    def test_admin_sessions_list(self):
        """Test admin can see all sessions"""
        if not self.admin_token:
            print("   ⚠️  SKIPPED - No admin token")
            return False
        
        success, response = self.run_test(
            "Admin Sessions List",
            "GET",
            "/api/assessment/sessions",
            200,
            token=self.admin_token,
            description="Admin fetches all assessment sessions"
        )
        if success:
            sessions = response.get('data', [])
            print(f"   ✅ Found {len(sessions)} sessions")
            if sessions:
                for s in sessions[:3]:  # Show first 3
                    template_name = s.get('template_name')
                    # Verify template_name is a string, not dict
                    if isinstance(template_name, str):
                        print(f"      ✅ template_name is string: {template_name}")
                    else:
                        print(f"      ❌ template_name is NOT string: {type(template_name)} - {template_name}")
                    print(f"      - {s.get('client_name')} ({s.get('status')})")
        return success

    def test_export_pdf(self):
        """Test PDF export functionality"""
        if not hasattr(self, 'test_session_token'):
            print("   ⚠️  SKIPPED - No session token")
            return False
        
        # Note: We're just testing if the endpoint responds, not downloading the actual PDF
        success, response = self.run_test(
            "Export PDF",
            "GET",
            f"/api/assessment/{self.test_session_token}/export",
            200,
            description="Test PDF export endpoint"
        )
        if success:
            print(f"   ✅ PDF export endpoint accessible")
        return success

    def test_public_content_endpoints(self):
        """Test various public content endpoints"""
        endpoints = [
            ("/api/cases", "Cases"),
            ("/api/blog", "Blog"),
            ("/api/tech", "Tech Stack"),
            ("/api/team", "Team"),
        ]
        
        all_passed = True
        for endpoint, name in endpoints:
            success, response = self.run_test(
                f"Public {name}",
                "GET",
                endpoint,
                200,
                description=f"Fetch public {name.lower()} content"
            )
            if not success:
                all_passed = False
        
        return all_passed

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed} ✅")
        print(f"Failed: {len(self.failed_tests)} ❌")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"\n{i}. {test.get('test', 'Unknown')}")
                print(f"   Endpoint: {test.get('endpoint', 'N/A')}")
                if 'expected' in test:
                    print(f"   Expected: {test['expected']}, Got: {test['actual']}")
                if 'error' in test:
                    print(f"   Error: {test['error']}")
        
        print("\n" + "="*60)
        return len(self.failed_tests) == 0

def main():
    print("="*60)
    print("🚀 KBS8 Platform - Backend API Testing")
    print("="*60)
    print(f"Base URL: https://kbs8-system.preview.emergentagent.com")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

    tester = KBS8APITester()

    # Run tests in order
    print("\n📋 PHASE 1: Public Endpoints")
    print("-" * 60)
    tester.test_health_check()
    tester.test_services_endpoint()
    tester.test_public_content_endpoints()

    print("\n📋 PHASE 2: Authentication")
    print("-" * 60)
    admin_login_success = tester.test_admin_login()
    client_login_success = tester.test_client_login()

    print("\n📋 PHASE 3: Admin Endpoints")
    print("-" * 60)
    if admin_login_success:
        tester.test_admin_dashboard_stats()
        tester.test_admin_users_list()
    else:
        print("⚠️  Skipping admin tests - login failed")

    print("\n📋 PHASE 4: Client Endpoints")
    print("-" * 60)
    if client_login_success:
        tester.test_client_projects()
    else:
        print("⚠️  Skipping client tests - login failed")

    print("\n📋 PHASE 5: Assessment Module (KN3 ERP Discovery)")
    print("-" * 60)
    if admin_login_success:
        tester.test_assessment_templates_list()
        tester.test_admin_sessions_list()
        tester.test_create_assessment_session()
        tester.test_session_detail()
        tester.test_export_pdf()
    else:
        print("⚠️  Skipping assessment tests - admin login failed")
    
    if client_login_success:
        tester.test_client_assessments_list()
        tester.test_client_session_detail()
        tester.test_save_answers()
    else:
        print("⚠️  Skipping client assessment tests - client login failed")

    # Print summary
    all_passed = tester.print_summary()
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
