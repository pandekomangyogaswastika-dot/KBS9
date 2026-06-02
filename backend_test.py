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

    # Print summary
    all_passed = tester.print_summary()
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
