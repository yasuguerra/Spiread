#!/usr/bin/env python3
"""
Campayo Spreeder Pro Backend API Test Suite
Tests all backend APIs including new gameRuns and sessionSchedules endpoints
"""

import requests
import json
import time
import os
from datetime import datetime

# Get base URL from environment - using external URL as specified in review request
BASE_URL = "https://readfast-trainer.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test user ID
TEST_USER_ID = "test_user"

class BackendTester:
    def __init__(self):
        self.passed_tests = 0
        self.failed_tests = 0
        self.test_results = []
        
    def log_result(self, test_name, success, message="", response_data=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            'test': test_name,
            'status': status,
            'message': message,
            'response_data': response_data,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        if success:
            self.passed_tests += 1
            print(f"{status}: {test_name}")
            if message:
                print(f"    {message}")
        else:
            self.failed_tests += 1
            print(f"{status}: {test_name}")
            print(f"    ERROR: {message}")
            
    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{API_BASE}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, params=params, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None

    def test_health_endpoint(self):
        """Test GET /api/health"""
        print("\n=== Testing Health Endpoint ===")
        
        response = self.make_request('GET', 'health')
        if response is None:
            self.log_result("Health Endpoint", False, "Request failed")
            return
            
        if response.status_code == 200:
            try:
                data = response.json()
                if 'status' in data and data['status'] == 'healthy':
                    self.log_result("Health Endpoint", True, f"Status: {data['status']}")
                else:
                    self.log_result("Health Endpoint", False, f"Unexpected response: {data}")
            except json.JSONDecodeError:
                self.log_result("Health Endpoint", False, "Invalid JSON response")
        else:
            self.log_result("Health Endpoint", False, f"Status code: {response.status_code}")

    def test_sessions_endpoints(self):
        """Test GET and POST /api/sessions"""
        print("\n=== Testing Sessions Endpoints ===")
        
        # Test GET sessions
        response = self.make_request('GET', 'sessions', params={'user_id': TEST_USER_ID})
        if response is None:
            self.log_result("GET Sessions", False, "Request failed")
        elif response.status_code == 200:
            try:
                data = response.json()
                self.log_result("GET Sessions", True, f"Retrieved {len(data)} sessions")
            except json.JSONDecodeError:
                self.log_result("GET Sessions", False, "Invalid JSON response")
        else:
            self.log_result("GET Sessions", False, f"Status code: {response.status_code}")
            
        # Test GET sessions without user_id (should fail)
        response = self.make_request('GET', 'sessions')
        if response and response.status_code == 400:
            self.log_result("GET Sessions (no user_id)", True, "Correctly rejected request without user_id")
        else:
            self.log_result("GET Sessions (no user_id)", False, "Should have returned 400 error")
        
        # Test POST sessions
        session_data = {
            "user_id": TEST_USER_ID,
            "wpm_start": 250,
            "wpm_end": 320,
            "comprehension_score": 85,
            "exercise_type": "rsvp",
            "duration_seconds": 180,
            "text_length": 500
        }
        
        response = self.make_request('POST', 'sessions', data=session_data)
        if response is None:
            self.log_result("POST Sessions", False, "Request failed")
        elif response.status_code == 200:
            try:
                data = response.json()
                if 'id' in data and 'user_id' in data:
                    self.log_result("POST Sessions", True, f"Created session with ID: {data['id']}")
                else:
                    self.log_result("POST Sessions", False, f"Missing required fields in response: {data}")
            except json.JSONDecodeError:
                self.log_result("POST Sessions", False, "Invalid JSON response")
        else:
            self.log_result("POST Sessions", False, f"Status code: {response.status_code}")

    def test_settings_endpoints(self):
        """Test GET and POST /api/settings"""
        print("\n=== Testing Settings Endpoints ===")
        
        # Test GET settings
        response = self.make_request('GET', 'settings', params={'user_id': TEST_USER_ID})
        if response is None:
            self.log_result("GET Settings", False, "Request failed")
        elif response.status_code == 200:
            try:
                data = response.json()
                self.log_result("GET Settings", True, f"Retrieved settings: {len(data) if data else 0} fields")
            except json.JSONDecodeError:
                self.log_result("GET Settings", False, "Invalid JSON response")
        else:
            self.log_result("GET Settings", False, f"Status code: {response.status_code}")
            
        # Test POST settings
        settings_data = {
            "user_id": TEST_USER_ID,
            "wpm_target": 400,
            "chunk_size": 3,
            "theme": "dark",
            "language": "en",
            "font_size": 16,
            "sound_enabled": True,
            "show_instructions": False
        }
        
        response = self.make_request('POST', 'settings', data=settings_data)
        if response is None:
            self.log_result("POST Settings", False, "Request failed")
        elif response.status_code == 200:
            try:
                data = response.json()
                if 'user_id' in data:
                    self.log_result("POST Settings", True, f"Updated settings for user: {data['user_id']}")
                else:
                    self.log_result("POST Settings", False, f"Missing user_id in response: {data}")
            except json.JSONDecodeError:
                self.log_result("POST Settings", False, "Invalid JSON response")
        else:
            self.log_result("POST Settings", False, f"Status code: {response.status_code}")

    def test_game_runs_endpoints(self):
        """Test GET and POST /api/gameRuns (NEW ENDPOINTS)"""
        print("\n=== Testing Game Runs Endpoints (NEW) ===")
        
        # Test GET gameRuns
        response = self.make_request('GET', 'gameRuns', params={'user_id': TEST_USER_ID})
        if response is None:
            self.log_result("GET Game Runs", False, "Request failed")
        elif response.status_code == 200:
            try:
                data = response.json()
                self.log_result("GET Game Runs", True, f"Retrieved {len(data)} game runs")
            except json.JSONDecodeError:
                self.log_result("GET Game Runs", False, "Invalid JSON response")
        else:
            self.log_result("GET Game Runs", False, f"Status code: {response.status_code}")
            
        # Test GET gameRuns without user_id (should fail)
        response = self.make_request('GET', 'gameRuns')
        if response and response.status_code == 400:
            self.log_result("GET Game Runs (no user_id)", True, "Correctly rejected request without user_id")
        else:
            self.log_result("GET Game Runs (no user_id)", False, "Should have returned 400 error")
        
        # Test POST gameRuns with sample data from review request
        game_run_data = {
            "userId": TEST_USER_ID,
            "game": "accelerator",
            "difficultyLevel": 2,
            "durationMs": 180000,
            "score": 85,
            "metrics": {
                "wpm_avg": 320,
                "chunk": 2,
                "pauses": 3
            }
        }
        
        response = self.make_request('POST', 'gameRuns', data=game_run_data)
        if response is None:
            self.log_result("POST Game Runs", False, "Request failed")
        elif response.status_code == 200:
            try:
                data = response.json()
                if 'id' in data and 'userId' in data and 'game' in data:
                    self.log_result("POST Game Runs", True, f"Created game run with ID: {data['id']}, Game: {data['game']}")
                else:
                    self.log_result("POST Game Runs", False, f"Missing required fields in response: {data}")
            except json.JSONDecodeError:
                self.log_result("POST Game Runs", False, "Invalid JSON response")
        else:
            self.log_result("POST Game Runs", False, f"Status code: {response.status_code}")

    def test_session_schedules_endpoints(self):
        """Test GET and POST /api/sessionSchedules (NEW ENDPOINTS)"""
        print("\n=== Testing Session Schedules Endpoints (NEW) ===")
        
        # Test GET sessionSchedules
        response = self.make_request('GET', 'sessionSchedules', params={'user_id': TEST_USER_ID})
        if response is None:
            self.log_result("GET Session Schedules", False, "Request failed")
        elif response.status_code == 200:
            try:
                data = response.json()
                self.log_result("GET Session Schedules", True, f"Retrieved {len(data)} session schedules")
            except json.JSONDecodeError:
                self.log_result("GET Session Schedules", False, "Invalid JSON response")
        else:
            self.log_result("GET Session Schedules", False, f"Status code: {response.status_code}")
            
        # Test GET sessionSchedules without user_id (should fail)
        response = self.make_request('GET', 'sessionSchedules')
        if response and response.status_code == 400:
            self.log_result("GET Session Schedules (no user_id)", True, "Correctly rejected request without user_id")
        else:
            self.log_result("GET Session Schedules (no user_id)", False, "Should have returned 400 error")
        
        # Test POST sessionSchedules with sample data from review request
        schedule_data = {
            "userId": TEST_USER_ID,
            "template": "15min",
            "totalDurationMs": 900000,
            "blocks": [
                {
                    "game": "accelerator",
                    "score": 85,
                    "duration_ms": 300000
                }
            ]
        }
        
        response = self.make_request('POST', 'sessionSchedules', data=schedule_data)
        if response is None:
            self.log_result("POST Session Schedules", False, "Request failed")
        elif response.status_code == 200:
            try:
                data = response.json()
                if 'id' in data and 'userId' in data and 'template' in data:
                    self.log_result("POST Session Schedules", True, f"Created schedule with ID: {data['id']}, Template: {data['template']}")
                else:
                    self.log_result("POST Session Schedules", False, f"Missing required fields in response: {data}")
            except json.JSONDecodeError:
                self.log_result("POST Session Schedules", False, "Invalid JSON response")
        else:
            self.log_result("POST Session Schedules", False, f"Status code: {response.status_code}")

    def test_cors_headers(self):
        """Test CORS headers are present"""
        print("\n=== Testing CORS Headers ===")
        
        response = self.make_request('GET', 'health')
        if response is None:
            self.log_result("CORS Headers", False, "Request failed")
            return
            
        cors_headers = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods',
            'Access-Control-Allow-Headers'
        ]
        
        missing_headers = []
        for header in cors_headers:
            if header not in response.headers:
                missing_headers.append(header)
                
        if not missing_headers:
            self.log_result("CORS Headers", True, "All required CORS headers present")
        else:
            self.log_result("CORS Headers", False, f"Missing headers: {missing_headers}")

    def test_error_handling(self):
        """Test error handling for invalid endpoints"""
        print("\n=== Testing Error Handling ===")
        
        # Test invalid endpoint
        response = self.make_request('GET', 'invalid_endpoint')
        if response and response.status_code == 404:
            try:
                data = response.json()
                if 'error' in data:
                    self.log_result("Invalid Endpoint Error", True, f"Correctly returned 404 with error: {data['error']}")
                else:
                    self.log_result("Invalid Endpoint Error", False, "404 response missing error field")
            except json.JSONDecodeError:
                self.log_result("Invalid Endpoint Error", False, "Invalid JSON in error response")
        else:
            self.log_result("Invalid Endpoint Error", False, f"Expected 404, got {response.status_code if response else 'no response'}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Campayo Spreeder Pro Backend API Tests")
        print(f"📍 Testing against: {API_BASE}")
        print(f"👤 Test User ID: {TEST_USER_ID}")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all test suites
        self.test_health_endpoint()
        self.test_sessions_endpoints()
        self.test_settings_endpoints()
        self.test_game_runs_endpoints()  # NEW
        self.test_session_schedules_endpoints()  # NEW
        self.test_cors_headers()
        self.test_error_handling()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"⏱️  Duration: {duration:.2f} seconds")
        print(f"📈 Success Rate: {(self.passed_tests / (self.passed_tests + self.failed_tests) * 100):.1f}%")
        
        if self.failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result['status']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n🎯 CRITICAL FINDINGS:")
        critical_issues = []
        
        # Check for critical API failures
        for result in self.test_results:
            if "❌ FAIL" in result['status']:
                if any(keyword in result['test'].lower() for keyword in ['post', 'create', 'health']):
                    critical_issues.append(f"  - {result['test']}: {result['message']}")
        
        if critical_issues:
            print("❌ Critical backend functionality issues found:")
            for issue in critical_issues:
                print(issue)
        else:
            print("✅ All critical backend APIs are working properly")
            
        return self.failed_tests == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All backend tests passed successfully!")
        exit(0)
    else:
        print(f"\n⚠️  {tester.failed_tests} test(s) failed. Check the details above.")
        exit(1)