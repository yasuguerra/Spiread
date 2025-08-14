#!/usr/bin/env python3
"""
Spiread AI Endpoints Test Suite
Focused testing of the new AI features
"""

import requests
import json
import time
from datetime import datetime

# Get base URL - testing localhost due to external routing issues
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

# Test user ID - using proper UUID format for Supabase
TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"

class AITester:
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

    def test_ai_summarize_endpoint(self):
        """Test AI Summarize endpoint comprehensively"""
        print("\n=== Testing AI Summarize Endpoint ===")
        
        # Test 1: GET health check
        response = self.make_request('GET', 'ai/summarize')
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'message' in data and 'usage' in data:
                    self.log_result("AI Summarize Health Check", True, f"Health: {data['message']}")
                else:
                    self.log_result("AI Summarize Health Check", False, f"Unexpected response: {data}")
            except json.JSONDecodeError:
                self.log_result("AI Summarize Health Check", False, "Invalid JSON response")
        else:
            self.log_result("AI Summarize Health Check", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: Valid payload
        valid_payload = {
            "docId": "test-doc-1",
            "locale": "es",
            "userId": TEST_USER_ID
        }
        
        response = self.make_request('POST', 'ai/summarize', data=valid_payload)
        if response and response.status_code == 200:
            try:
                data = response.json()
                required_fields = ['bullets', 'abstract']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    bullets_count = len(data['bullets']) if isinstance(data['bullets'], list) else 0
                    has_abstract = bool(data['abstract'])
                    fallback = data.get('fallback', False)
                    cached = data.get('cached', False)
                    
                    self.log_result("AI Summarize Valid Request", True, 
                                  f"Bullets: {bullets_count}, Abstract: {has_abstract}, Fallback: {fallback}, Cached: {cached}")
                else:
                    self.log_result("AI Summarize Valid Request", False, f"Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                self.log_result("AI Summarize Valid Request", False, "Invalid JSON response")
        else:
            self.log_result("AI Summarize Valid Request", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 3: Invalid payload (missing docId)
        invalid_payload = {
            "locale": "es",
            "userId": TEST_USER_ID
        }
        
        response = self.make_request('POST', 'ai/summarize', data=invalid_payload)
        if response and response.status_code == 400:
            try:
                data = response.json()
                if 'error' in data:
                    self.log_result("AI Summarize Invalid Request", True, f"Validation works: {data['error']}")
                else:
                    self.log_result("AI Summarize Invalid Request", False, "400 response missing error field")
            except json.JSONDecodeError:
                self.log_result("AI Summarize Invalid Request", False, "Invalid JSON in error response")
        else:
            self.log_result("AI Summarize Invalid Request", False, f"Expected 400, got {response.status_code if response else 'No response'}")
        
        # Test 4: English locale
        english_payload = {
            "docId": "test-doc-2",
            "locale": "en",
            "userId": TEST_USER_ID
        }
        
        response = self.make_request('POST', 'ai/summarize', data=english_payload)
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'bullets' in data and 'abstract' in data:
                    self.log_result("AI Summarize English Locale", True, "English locale works")
                else:
                    self.log_result("AI Summarize English Locale", False, "Missing required response fields")
            except json.JSONDecodeError:
                self.log_result("AI Summarize English Locale", False, "Invalid JSON response")
        else:
            self.log_result("AI Summarize English Locale", False, f"Status: {response.status_code if response else 'No response'}")

    def test_ai_questions_endpoint(self):
        """Test AI Questions Generation endpoint comprehensively"""
        print("\n=== Testing AI Questions Generation Endpoint ===")
        
        # Test 1: GET health check
        response = self.make_request('GET', 'ai/questions')
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'message' in data and 'usage' in data:
                    self.log_result("AI Questions Health Check", True, f"Health: {data['message']}")
                else:
                    self.log_result("AI Questions Health Check", False, f"Unexpected response: {data}")
            except json.JSONDecodeError:
                self.log_result("AI Questions Health Check", False, "Invalid JSON response")
        else:
            self.log_result("AI Questions Health Check", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 2: Valid payload
        valid_payload = {
            "docId": "test-doc-1",
            "locale": "es",
            "n": 3,
            "userId": TEST_USER_ID
        }
        
        response = self.make_request('POST', 'ai/questions', data=valid_payload)
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'items' in data and isinstance(data['items'], list):
                    questions = data['items']
                    if len(questions) > 0:
                        # Check question structure
                        first_q = questions[0]
                        required_q_fields = ['q', 'choices', 'correctIndex', 'explain']
                        missing_q_fields = [field for field in required_q_fields if field not in first_q]
                        
                        if not missing_q_fields:
                            choices_valid = isinstance(first_q['choices'], list) and len(first_q['choices']) == 4
                            correct_index_valid = isinstance(first_q['correctIndex'], int) and 0 <= first_q['correctIndex'] <= 3
                            fallback = data.get('fallback', False)
                            cached = data.get('cached', False)
                            
                            if choices_valid and correct_index_valid:
                                self.log_result("AI Questions Valid Request", True, 
                                              f"Generated {len(questions)} questions, Fallback: {fallback}, Cached: {cached}")
                            else:
                                self.log_result("AI Questions Valid Request", False, "Invalid question structure (choices or correctIndex)")
                        else:
                            self.log_result("AI Questions Valid Request", False, f"Missing question fields: {missing_q_fields}")
                    else:
                        self.log_result("AI Questions Valid Request", False, "No questions generated")
                else:
                    self.log_result("AI Questions Valid Request", False, "Missing or invalid 'items' field in response")
            except json.JSONDecodeError:
                self.log_result("AI Questions Valid Request", False, "Invalid JSON response")
        else:
            self.log_result("AI Questions Valid Request", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test 3: Invalid payload (missing docId)
        invalid_payload = {
            "locale": "es",
            "n": 3,
            "userId": TEST_USER_ID
        }
        
        response = self.make_request('POST', 'ai/questions', data=invalid_payload)
        if response and response.status_code == 400:
            try:
                data = response.json()
                if 'error' in data:
                    self.log_result("AI Questions Invalid Request", True, f"Validation works: {data['error']}")
                else:
                    self.log_result("AI Questions Invalid Request", False, "400 response missing error field")
            except json.JSONDecodeError:
                self.log_result("AI Questions Invalid Request", False, "Invalid JSON in error response")
        else:
            self.log_result("AI Questions Invalid Request", False, f"Expected 400, got {response.status_code if response else 'No response'}")
        
        # Test 4: Different question count
        count_payload = {
            "docId": "test-doc-3",
            "locale": "es",
            "n": 5,
            "userId": TEST_USER_ID
        }
        
        response = self.make_request('POST', 'ai/questions', data=count_payload)
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'items' in data and isinstance(data['items'], list):
                    actual_count = len(data['items'])
                    self.log_result("AI Questions Custom Count", True, f"Requested 5, got {actual_count} questions")
                else:
                    self.log_result("AI Questions Custom Count", False, "Missing or invalid 'items' field")
            except json.JSONDecodeError:
                self.log_result("AI Questions Custom Count", False, "Invalid JSON response")
        else:
            self.log_result("AI Questions Custom Count", False, f"Status: {response.status_code if response else 'No response'}")

    def test_environment_configuration(self):
        """Test AI environment configuration"""
        print("\n=== Testing AI Environment Configuration ===")
        
        # Test if AI endpoints are accessible (indicates environment is configured)
        response = self.make_request('GET', 'ai/summarize')
        if response and response.status_code == 200:
            self.log_result("AI Environment Variables", True, "AI endpoints accessible, environment configured")
        else:
            self.log_result("AI Environment Variables", False, "AI endpoints not accessible, check environment variables")

    def run_ai_tests(self):
        """Run all AI endpoint tests"""
        print("🤖 Starting Spiread AI Endpoints Test Suite")
        print(f"📍 Testing against: {API_BASE}")
        print(f"👤 Test User ID: {TEST_USER_ID}")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run AI-specific test suites
        self.test_environment_configuration()
        self.test_ai_summarize_endpoint()
        self.test_ai_questions_endpoint()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 AI ENDPOINTS TEST SUMMARY")
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
        
        print("\n🎯 AI ENDPOINTS STATUS:")
        if self.failed_tests == 0:
            print("✅ All AI endpoints are working correctly")
        else:
            critical_failures = [r for r in self.test_results if "❌ FAIL" in r['status'] and 'Health' not in r['test']]
            if critical_failures:
                print("❌ Some AI functionality issues found:")
                for failure in critical_failures:
                    print(f"  - {failure['test']}: {failure['message']}")
            else:
                print("⚠️  Minor issues found but core AI functionality works")
            
        return self.failed_tests == 0

if __name__ == "__main__":
    tester = AITester()
    success = tester.run_ai_tests()
    
    if success:
        print("\n🎉 All AI endpoint tests passed successfully!")
        exit(0)
    else:
        print(f"\n⚠️  {tester.failed_tests} AI test(s) failed. Check the details above.")
        exit(1)