#!/usr/bin/env python3
"""
Backend Test Suite for Phase 1 Foundation & DB Alignment
Tests Progress API endpoints, AI Health endpoint, and database case conversion
"""

import requests
import json
import uuid
import time
from typing import Dict, Any

# Get base URL from environment
BASE_URL = "https://9e4ce5d7-7807-40c0-a91d-572ca135d2c7.preview.emergentagent.com"

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_user_id = str(uuid.uuid4())
        self.results = []
        
    def log_result(self, test_name: str, success: bool, details: str):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        self.results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
    
    def test_progress_save_endpoint(self):
        """Test POST /api/progress/save endpoint"""
        print("\n=== Testing Progress Save Endpoint ===")
        
        # Test data as specified in review request
        test_data = {
            "userId": self.test_user_id,
            "game": "memory_digits",
            "progress": {
                "lastLevel": 5,
                "lastBestScore": 280,
                "totalRounds": 15,
                "averageRt": 2800
            }
        }
        
        try:
            # Test successful save
            response = requests.post(
                f"{self.base_url}/api/progress/save",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'progress' in data:
                    self.log_result(
                        "Progress Save - Valid Data",
                        True,
                        f"Successfully saved progress. Response: {data.get('message', 'No message')}"
                    )
                else:
                    self.log_result(
                        "Progress Save - Valid Data",
                        False,
                        f"Invalid response format: {data}"
                    )
            else:
                self.log_result(
                    "Progress Save - Valid Data",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Progress Save - Valid Data",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test missing userId parameter
        try:
            invalid_data = {
                "game": "memory_digits",
                "progress": {"lastLevel": 1, "lastBestScore": 100}
            }
            
            response = requests.post(
                f"{self.base_url}/api/progress/save",
                json=invalid_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 400:
                self.log_result(
                    "Progress Save - Missing userId",
                    True,
                    "Correctly returned 400 error for missing userId"
                )
            else:
                self.log_result(
                    "Progress Save - Missing userId",
                    False,
                    f"Expected 400, got {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Progress Save - Missing userId",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test invalid progress structure
        try:
            invalid_progress_data = {
                "userId": self.test_user_id,
                "game": "memory_digits",
                "progress": {"invalidField": "test"}  # Missing required fields
            }
            
            response = requests.post(
                f"{self.base_url}/api/progress/save",
                json=invalid_progress_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 400:
                self.log_result(
                    "Progress Save - Invalid Progress Structure",
                    True,
                    "Correctly returned 400 error for invalid progress structure"
                )
            else:
                self.log_result(
                    "Progress Save - Invalid Progress Structure",
                    False,
                    f"Expected 400, got {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Progress Save - Invalid Progress Structure",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_progress_get_endpoint(self):
        """Test GET /api/progress/get endpoint"""
        print("\n=== Testing Progress Get Endpoint ===")
        
        # Test getting all progress for user
        try:
            response = requests.get(
                f"{self.base_url}/api/progress/get",
                params={'userId': self.test_user_id},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'progress' in data:
                    self.log_result(
                        "Progress Get - All Progress",
                        True,
                        f"Successfully retrieved progress: {len(data['progress'])} games"
                    )
                else:
                    self.log_result(
                        "Progress Get - All Progress",
                        False,
                        f"Invalid response format: {data}"
                    )
            else:
                self.log_result(
                    "Progress Get - All Progress",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Progress Get - All Progress",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test getting specific game progress
        try:
            response = requests.get(
                f"{self.base_url}/api/progress/get",
                params={'userId': self.test_user_id, 'game': 'memory_digits'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'progress' in data and 'memory_digits' in data['progress']:
                    self.log_result(
                        "Progress Get - Specific Game",
                        True,
                        f"Successfully retrieved memory_digits progress"
                    )
                else:
                    self.log_result(
                        "Progress Get - Specific Game",
                        False,
                        f"Invalid response format or missing game data: {data}"
                    )
            else:
                self.log_result(
                    "Progress Get - Specific Game",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Progress Get - Specific Game",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test missing userId parameter
        try:
            response = requests.get(
                f"{self.base_url}/api/progress/get",
                timeout=10
            )
            
            if response.status_code == 400:
                self.log_result(
                    "Progress Get - Missing userId",
                    True,
                    "Correctly returned 400 error for missing userId"
                )
            else:
                self.log_result(
                    "Progress Get - Missing userId",
                    False,
                    f"Expected 400, got {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Progress Get - Missing userId",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_ai_health_endpoint(self):
        """Test GET /api/ai/health endpoint"""
        print("\n=== Testing AI Health Endpoint ===")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/ai/health",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ['ok', 'provider', 'model', 'aiEnabled', 'timestamp', 'quotas', 'features']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Check that API keys are not exposed
                    response_str = json.dumps(data)
                    if 'sk-' not in response_str and 'key' not in response_str.lower():
                        # Check quota configuration
                        quotas = data.get('quotas', {})
                        if 'maxCallsPerDay' in quotas and 'maxTokensPerMonth' in quotas:
                            self.log_result(
                                "AI Health - Complete Response",
                                True,
                                f"Health check passed. Provider: {data.get('provider')}, AI Enabled: {data.get('aiEnabled')}"
                            )
                        else:
                            self.log_result(
                                "AI Health - Complete Response",
                                False,
                                f"Missing quota configuration: {quotas}"
                            )
                    else:
                        self.log_result(
                            "AI Health - Complete Response",
                            False,
                            "API keys exposed in response"
                        )
                else:
                    self.log_result(
                        "AI Health - Complete Response",
                        False,
                        f"Missing required fields: {missing_fields}"
                    )
            else:
                self.log_result(
                    "AI Health - Complete Response",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "AI Health - Complete Response",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test runtime configuration (should prevent 502 errors)
        try:
            response = requests.get(
                f"{self.base_url}/api/ai/health",
                timeout=10
            )
            
            if response.status_code != 502:
                self.log_result(
                    "AI Health - Runtime Configuration",
                    True,
                    f"No 502 error, runtime='nodejs' working correctly (status: {response.status_code})"
                )
            else:
                self.log_result(
                    "AI Health - Runtime Configuration",
                    False,
                    "502 error indicates runtime configuration issue"
                )
                
        except Exception as e:
            self.log_result(
                "AI Health - Runtime Configuration",
                False,
                f"Request failed: {str(e)}"
            )
    
    def test_case_conversion_round_trip(self):
        """Test database case conversion round-trip"""
        print("\n=== Testing Database Case Conversion ===")
        
        # Test with complex nested data
        complex_data = {
            "userId": self.test_user_id,
            "game": "memory_digits",
            "progress": {
                "lastLevel": 8,
                "lastBestScore": 450,
                "totalRounds": 25,
                "averageRt": 2200,
                "nestedData": {
                    "subField": "test",
                    "anotherField": 123
                },
                "arrayData": [
                    {"itemName": "test1", "itemValue": 100},
                    {"itemName": "test2", "itemValue": 200}
                ]
            }
        }
        
        try:
            # Save complex data
            save_response = requests.post(
                f"{self.base_url}/api/progress/save",
                json=complex_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if save_response.status_code == 200:
                # Retrieve the data
                get_response = requests.get(
                    f"{self.base_url}/api/progress/get",
                    params={'userId': self.test_user_id, 'game': 'memory_digits'},
                    timeout=10
                )
                
                if get_response.status_code == 200:
                    retrieved_data = get_response.json()
                    
                    # Check if nested data is preserved
                    progress = retrieved_data.get('progress', {}).get('memory_digits', {})
                    
                    if (progress.get('lastLevel') == 8 and 
                        progress.get('lastBestScore') == 450 and
                        'nestedData' in progress and
                        'arrayData' in progress):
                        self.log_result(
                            "Case Conversion - Round Trip",
                            True,
                            "Complex nested data preserved through camelCase/snake_case conversion"
                        )
                    else:
                        self.log_result(
                            "Case Conversion - Round Trip",
                            False,
                            f"Data corruption in round-trip conversion: {progress}"
                        )
                else:
                    self.log_result(
                        "Case Conversion - Round Trip",
                        False,
                        f"Failed to retrieve saved data: {get_response.status_code}"
                    )
            else:
                self.log_result(
                    "Case Conversion - Round Trip",
                    False,
                    f"Failed to save complex data: {save_response.status_code}"
                )
                
        except Exception as e:
            self.log_result(
                "Case Conversion - Round Trip",
                False,
                f"Round-trip test failed: {str(e)}"
            )
    
    def test_cors_headers(self):
        """Test CORS headers on all endpoints"""
        print("\n=== Testing CORS Headers ===")
        
        endpoints = [
            "/api/progress/save",
            "/api/progress/get",
            "/api/ai/health"
        ]
        
        for endpoint in endpoints:
            try:
                # Test OPTIONS request
                options_response = requests.options(
                    f"{self.base_url}{endpoint}",
                    timeout=10
                )
                
                headers = options_response.headers
                cors_headers = [
                    'Access-Control-Allow-Origin',
                    'Access-Control-Allow-Methods',
                    'Access-Control-Allow-Headers'
                ]
                
                missing_headers = [h for h in cors_headers if h not in headers]
                
                if not missing_headers and options_response.status_code == 200:
                    self.log_result(
                        f"CORS Headers - {endpoint}",
                        True,
                        "All required CORS headers present"
                    )
                else:
                    self.log_result(
                        f"CORS Headers - {endpoint}",
                        False,
                        f"Missing headers: {missing_headers}, Status: {options_response.status_code}"
                    )
                    
            except Exception as e:
                self.log_result(
                    f"CORS Headers - {endpoint}",
                    False,
                    f"OPTIONS request failed: {str(e)}"
                )
    
    def run_all_tests(self):
        """Run all Phase 1 Foundation & DB Alignment tests"""
        print("🚀 Starting Phase 1 Foundation & DB Alignment Backend Tests")
        print(f"Base URL: {self.base_url}")
        print(f"Test User ID: {self.test_user_id}")
        
        # Run all test suites
        self.test_progress_save_endpoint()
        self.test_progress_get_endpoint()
        self.test_ai_health_endpoint()
        self.test_case_conversion_round_trip()
        self.test_cors_headers()
        
        # Summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for r in self.results if r['success'])
        total = len(self.results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['details']}")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)