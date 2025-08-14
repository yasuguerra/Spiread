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

# Get base URL from environment - testing localhost first due to external routing issues
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

# Test user ID - using proper UUID format for Supabase
TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"

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

    def test_documents_endpoints(self):
        """Test GET and POST /api/documents"""
        print("\n=== Testing Documents Endpoints ===")
        
        # Test GET documents
        response = self.make_request('GET', 'documents', params={'user_id': TEST_USER_ID})
        if response is None:
            self.log_result("GET Documents", False, "Request failed")
        elif response.status_code == 200:
            try:
                data = response.json()
                self.log_result("GET Documents", True, f"Retrieved {len(data)} documents")
            except json.JSONDecodeError:
                self.log_result("GET Documents", False, "Invalid JSON response")
        else:
            self.log_result("GET Documents", False, f"Status code: {response.status_code}, Response: {response.text[:200]}")
            
        # Test GET documents without user_id (should fail)
        response = self.make_request('GET', 'documents')
        if response and response.status_code == 400:
            self.log_result("GET Documents (no user_id)", True, "Correctly rejected request without user_id")
        else:
            self.log_result("GET Documents (no user_id)", False, "Should have returned 400 error")
            
        # Test POST documents
        document_data = {
            "user_id": TEST_USER_ID,
            "title": "Speed Reading Practice Text",
            "content": "This is a comprehensive speed reading practice document designed to help users improve their reading velocity and comprehension. The text contains various sentence structures and vocabulary to challenge different reading skills.",
            "document_type": "text",
            "word_count": 35
        }
        
        response = self.make_request('POST', 'documents', data=document_data)
        if response is None:
            self.log_result("POST Documents", False, "Request failed")
        elif response.status_code == 200:
            try:
                data = response.json()
                if 'id' in data and 'user_id' in data and 'title' in data:
                    self.log_result("POST Documents", True, f"Created document with ID: {data['id']}, Title: {data['title']}")
                else:
                    self.log_result("POST Documents", False, f"Missing required fields in response: {data}")
            except json.JSONDecodeError:
                self.log_result("POST Documents", False, "Invalid JSON response")
        else:
            self.log_result("POST Documents", False, f"Status code: {response.status_code}, Response: {response.text[:200]}")

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
            self.log_result("GET Game Runs", False, f"Status code: {response.status_code}, Response: {response.text[:200]}")
            
        # Test GET gameRuns without user_id (should fail)
        response = self.make_request('GET', 'gameRuns')
        if response and response.status_code == 400:
            self.log_result("GET Game Runs (no user_id)", True, "Correctly rejected request without user_id")
        else:
            self.log_result("GET Game Runs (no user_id)", False, "Should have returned 400 error")
        
        # Test POST gameRuns with all new game types from review request
        game_data_sets = [
            {
                "name": "shuttle game",
                "data": {
                    "userId": TEST_USER_ID,
                    "game": "shuttle", 
                    "difficultyLevel": 3,
                    "durationMs": 120000,
                    "score": 85,
                    "metrics": {
                        "tables_completed": 4,
                        "total_points": 340,
                        "avg_time_ms": 12000,
                        "total_mistakes": 2
                    }
                }
            },
            {
                "name": "twin_words game",
                "data": {
                    "userId": TEST_USER_ID, 
                    "game": "twin_words",
                    "difficultyLevel": 2,
                    "durationMs": 180000,
                    "score": 78,
                    "metrics": {
                        "rounds": 8,
                        "total_score": 45,
                        "accuracy_overall": 0.78,
                        "mean_rt_ms": 1200
                    }
                }
            },
            {
                "name": "par_impar game",
                "data": {
                    "userId": TEST_USER_ID,
                    "game": "par_impar", 
                    "difficultyLevel": 4,
                    "durationMs": 120000,
                    "score": 92,
                    "metrics": {
                        "trials": 150,
                        "correct": 138,
                        "wrong": 8,
                        "misses": 4,
                        "mean_rt_ms": 680,
                        "current_isi_ms": 800
                    }
                }
            },
            {
                "name": "memory_digits game",
                "data": {
                    "userId": TEST_USER_ID,
                    "game": "memory_digits",
                    "difficultyLevel": 5,
                    "durationMs": 240000,
                    "score": 75,
                    "metrics": {
                        "digits_shown": 6,
                        "exposure_ms": 3000,
                        "typed_correct": 12,
                        "total_trials": 16,
                        "longest_correct_digits": 7
                    }
                }
            }
        ]
        
        for game_set in game_data_sets:
            response = self.make_request('POST', 'gameRuns', data=game_set["data"])
            if response is None:
                self.log_result(f"POST Game Runs ({game_set['name']})", False, "Request failed")
            elif response.status_code == 200:
                try:
                    data = response.json()
                    if 'id' in data and 'userId' in data and 'game' in data:
                        self.log_result(f"POST Game Runs ({game_set['name']})", True, f"Created game run with ID: {data['id']}, Game: {data['game']}")
                    else:
                        self.log_result(f"POST Game Runs ({game_set['name']})", False, f"Missing required fields in response: {data}")
                except json.JSONDecodeError:
                    self.log_result(f"POST Game Runs ({game_set['name']})", False, "Invalid JSON response")
            else:
                self.log_result(f"POST Game Runs ({game_set['name']})", False, f"Status code: {response.status_code}, Response: {response.text[:200]}")

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
            self.log_result("GET Session Schedules", False, f"Status code: {response.status_code}, Response: {response.text[:200]}")
            
        # Test GET sessionSchedules without user_id (should fail)
        response = self.make_request('GET', 'sessionSchedules')
        if response and response.status_code == 400:
            self.log_result("GET Session Schedules (no user_id)", True, "Correctly rejected request without user_id")
        else:
            self.log_result("GET Session Schedules (no user_id)", False, "Should have returned 400 error")
        
        # Test POST sessionSchedules with exact data from review request
        schedule_data = {
            "userId": TEST_USER_ID,
            "template": "15min",
            "totalDurationMs": 900000,
            "blocks": [
                {"game": "par_impar", "score": 85, "duration_ms": 120000, "difficulty_before": 2, "difficulty_after": 3},
                {"game": "shuttle", "score": 78, "duration_ms": 300000, "difficulty_before": 3, "difficulty_after": 3},
                {"game": "twin_words", "score": 82, "duration_ms": 240000, "difficulty_before": 2, "difficulty_after": 3},
                {"game": "memory_digits", "score": 90, "duration_ms": 240000, "difficulty_before": 4, "difficulty_after": 5}
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
            self.log_result("POST Session Schedules", False, f"Status code: {response.status_code}, Response: {response.text[:200]}")

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

    def test_ai_summarize_endpoint(self):
        """Test AI Summarize endpoint (NEW)"""
        print("\n=== Testing AI Summarize Endpoint (NEW) ===")
        
        # Test GET endpoint for health check
        response = self.make_request('GET', 'ai/summarize')
        if response is None:
            self.log_result("GET AI Summarize Health", False, "Request failed")
        elif response.status_code == 200:
            try:
                data = response.json()
                if 'message' in data and 'usage' in data:
                    self.log_result("GET AI Summarize Health", True, f"Health check passed: {data['message']}")
                else:
                    self.log_result("GET AI Summarize Health", False, f"Unexpected response format: {data}")
            except json.JSONDecodeError:
                self.log_result("GET AI Summarize Health", False, "Invalid JSON response")
        else:
            self.log_result("GET AI Summarize Health", False, f"Status code: {response.status_code}")
        
        # Test POST with valid payload
        valid_payload = {
            "docId": "test-doc-1",
            "locale": "es",
            "userId": "test-user"
        }
        
        response = self.make_request('POST', 'ai/summarize', data=valid_payload)
        if response is None:
            self.log_result("POST AI Summarize (valid)", False, "Request failed")
        elif response.status_code == 200:
            try:
                data = response.json()
                required_fields = ['bullets', 'abstract']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    bullets_count = len(data['bullets']) if isinstance(data['bullets'], list) else 0
                    has_abstract = bool(data['abstract'])
                    self.log_result("POST AI Summarize (valid)", True, 
                                  f"Summary generated: {bullets_count} bullets, abstract: {has_abstract}, cached: {data.get('cached', False)}")
                else:
                    self.log_result("POST AI Summarize (valid)", False, f"Missing required fields: {missing_fields}")
            except json.JSONDecodeError:
                self.log_result("POST AI Summarize (valid)", False, "Invalid JSON response")
        else:
            self.log_result("POST AI Summarize (valid)", False, f"Status code: {response.status_code}, Response: {response.text[:200]}")
        
        # Test POST with invalid payload (missing docId)
        invalid_payload = {
            "locale": "es",
            "userId": TEST_USER_ID
        }
        
        response = self.make_request('POST', 'ai/summarize', data=invalid_payload)
        if response is None:
            self.log_result("POST AI Summarize (invalid)", False, "Request failed")
        elif response.status_code == 400:
            try:
                data = response.json()
                if 'error' in data:
                    self.log_result("POST AI Summarize (invalid)", True, f"Correctly rejected invalid payload: {data['error']}")
                else:
                    self.log_result("POST AI Summarize (invalid)", False, "400 response missing error field")
            except json.JSONDecodeError:
                self.log_result("POST AI Summarize (invalid)", False, "Invalid JSON in error response")
        else:
            self.log_result("POST AI Summarize (invalid)", False, f"Expected 400, got {response.status_code if response else 'no response'}")
        
        # Test with different locale
        english_payload = {
            "docId": "test-doc-2",
            "locale": "en",
            "userId": "test-user"
        }
        
        response = self.make_request('POST', 'ai/summarize', data=english_payload)
        if response is None:
            self.log_result("POST AI Summarize (English)", False, "Request failed")
        elif response.status_code == 200:
            try:
                data = response.json()
                if 'bullets' in data and 'abstract' in data:
                    self.log_result("POST AI Summarize (English)", True, "English locale summary generated successfully")
                else:
                    self.log_result("POST AI Summarize (English)", False, "Missing required response fields")
            except json.JSONDecodeError:
                self.log_result("POST AI Summarize (English)", False, "Invalid JSON response")
        else:
            self.log_result("POST AI Summarize (English)", False, f"Status code: {response.status_code}")

    def test_ai_questions_endpoint(self):
        """Test AI Questions Generation endpoint (NEW)"""
        print("\n=== Testing AI Questions Generation Endpoint (NEW) ===")
        
        # Test GET endpoint for health check
        response = self.make_request('GET', 'ai/questions')
        if response is None:
            self.log_result("GET AI Questions Health", False, "Request failed")
        elif response.status_code == 200:
            try:
                data = response.json()
                if 'message' in data and 'usage' in data:
                    self.log_result("GET AI Questions Health", True, f"Health check passed: {data['message']}")
                else:
                    self.log_result("GET AI Questions Health", False, f"Unexpected response format: {data}")
            except json.JSONDecodeError:
                self.log_result("GET AI Questions Health", False, "Invalid JSON response")
        else:
            self.log_result("GET AI Questions Health", False, f"Status code: {response.status_code}")
        
        # Test POST with valid payload
        valid_payload = {
            "docId": "test-doc-1",
            "locale": "es",
            "n": 3,
            "userId": "test-user"
        }
        
        response = self.make_request('POST', 'ai/questions', data=valid_payload)
        if response is None:
            self.log_result("POST AI Questions (valid)", False, "Request failed")
        elif response.status_code == 200:
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
                            
                            if choices_valid and correct_index_valid:
                                self.log_result("POST AI Questions (valid)", True, 
                                              f"Generated {len(questions)} questions with proper structure, cached: {data.get('cached', False)}")
                            else:
                                self.log_result("POST AI Questions (valid)", False, "Invalid question structure (choices or correctIndex)")
                        else:
                            self.log_result("POST AI Questions (valid)", False, f"Missing question fields: {missing_q_fields}")
                    else:
                        self.log_result("POST AI Questions (valid)", False, "No questions generated")
                else:
                    self.log_result("POST AI Questions (valid)", False, "Missing or invalid 'items' field in response")
            except json.JSONDecodeError:
                self.log_result("POST AI Questions (valid)", False, "Invalid JSON response")
        else:
            self.log_result("POST AI Questions (valid)", False, f"Status code: {response.status_code}, Response: {response.text[:200]}")
        
        # Test POST with invalid payload (missing docId)
        invalid_payload = {
            "locale": "es",
            "n": 3,
            "userId": "test-user"
        }
        
        response = self.make_request('POST', 'ai/questions', data=invalid_payload)
        if response and response.status_code == 400:
            try:
                data = response.json()
                if 'error' in data:
                    self.log_result("POST AI Questions (invalid)", True, f"Correctly rejected invalid payload: {data['error']}")
                else:
                    self.log_result("POST AI Questions (invalid)", False, "400 response missing error field")
            except json.JSONDecodeError:
                self.log_result("POST AI Questions (invalid)", False, "Invalid JSON in error response")
        else:
            self.log_result("POST AI Questions (invalid)", False, f"Expected 400, got {response.status_code if response else 'no response'}")
        
        # Test with different question count
        count_payload = {
            "docId": "test-doc-3",
            "locale": "es",
            "n": 5,
            "userId": "test-user"
        }
        
        response = self.make_request('POST', 'ai/questions', data=count_payload)
        if response is None:
            self.log_result("POST AI Questions (n=5)", False, "Request failed")
        elif response.status_code == 200:
            try:
                data = response.json()
                if 'items' in data and isinstance(data['items'], list):
                    actual_count = len(data['items'])
                    self.log_result("POST AI Questions (n=5)", True, f"Generated {actual_count} questions as requested")
                else:
                    self.log_result("POST AI Questions (n=5)", False, "Missing or invalid 'items' field")
            except json.JSONDecodeError:
                self.log_result("POST AI Questions (n=5)", False, "Invalid JSON response")
        else:
            self.log_result("POST AI Questions (n=5)", False, f"Status code: {response.status_code}")

    def test_ai_environment_config(self):
        """Test AI environment configuration"""
        print("\n=== Testing AI Environment Configuration ===")
        
        # Test if AI endpoints are accessible (indicates environment is configured)
        response = self.make_request('GET', 'ai/summarize')
        if response and response.status_code == 200:
            self.log_result("AI Environment Config", True, "AI endpoints are accessible, environment configured")
        else:
            self.log_result("AI Environment Config", False, "AI endpoints not accessible, check environment variables")

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
        print("🚀 Starting Spiread Backend API Tests (Focus: AI Endpoints)")
        print(f"📍 Testing against: {API_BASE}")
        print(f"👤 Test User ID: {TEST_USER_ID}")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all test suites - prioritizing AI endpoints as per review request
        self.test_health_endpoint()
        self.test_ai_summarize_endpoint()  # NEW AI ENDPOINT - HIGH PRIORITY
        self.test_ai_questions_endpoint()  # NEW AI ENDPOINT - HIGH PRIORITY
        self.test_ai_environment_config()  # NEW AI CONFIG TEST
        self.test_sessions_endpoints()
        self.test_settings_endpoints()
        self.test_documents_endpoints()  # Add documents test
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