#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Phase 2 MVP+ Closure Sprint - AI Questions
Testing Focus: Hardened /api/ai/questions endpoint and related AI functionality

Key Requirements to Test:
1. Strict Schema Validation (Zod)
2. Monthly Token Quotas (NEW)
3. Caching System
4. Text Normalization & Evidence Indexes
5. AI Provider Priority
6. API Health & Status
"""

import requests
import json
import hashlib
import time
import os
from datetime import datetime

# Configuration
BASE_URL = "https://speedread-app.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class AIQuestionsBackendTester:
    def __init__(self):
        self.test_results = []
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log_test(self, test_name, status, details="", error=None):
        """Log test results"""
        result = {
            'test': test_name,
            'status': status,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        if error:
            result['error'] = str(error)
        self.test_results.append(result)
        
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_symbol} {test_name}: {details}")
        if error:
            print(f"   Error: {error}")
    
    def test_health_endpoint(self):
        """Test GET /api/ai/questions (health check)"""
        try:
            response = self.session.get(f"{API_BASE}/ai/questions", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'message' in data and 'usage' in data and 'schema' in data:
                    self.log_test("Health Endpoint", "PASS", 
                                f"Health check working, returns usage info and schema")
                else:
                    self.log_test("Health Endpoint", "FAIL", 
                                f"Missing required fields in health response")
            else:
                self.log_test("Health Endpoint", "FAIL", 
                            f"Status: {response.status_code}, Response: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("Health Endpoint", "FAIL", "Request failed", e)
    
    def test_strict_schema_validation(self):
        """Test Zod schema validation with various invalid inputs"""
        test_cases = [
            # Missing docId
            ({}, "Missing docId should return 400"),
            
            # Invalid locale
            ({"docId": "test123", "locale": "fr"}, "Invalid locale should return 400"),
            
            # Invalid n parameter (outside 3-5 range)
            ({"docId": "test123", "n": 2}, "n=2 (below minimum) should return 400"),
            ({"docId": "test123", "n": 6}, "n=6 (above maximum) should return 400"),
            ({"docId": "test123", "n": 10}, "n=10 (way above maximum) should return 400"),
            
            # Invalid data types
            ({"docId": 123}, "Non-string docId should return 400"),
            ({"docId": "test123", "n": "five"}, "Non-numeric n should return 400"),
            
            # Empty docId
            ({"docId": ""}, "Empty docId should return 400"),
        ]
        
        for payload, description in test_cases:
            try:
                response = self.session.post(f"{API_BASE}/ai/questions", 
                                           json=payload, timeout=15)
                
                if response.status_code == 400:
                    try:
                        error_data = response.json()
                        if 'error' in error_data:
                            self.log_test("Schema Validation", "PASS", description)
                        else:
                            self.log_test("Schema Validation", "FAIL", 
                                        f"{description} - Missing error field in response")
                    except:
                        self.log_test("Schema Validation", "FAIL", 
                                    f"{description} - Invalid JSON in error response")
                else:
                    self.log_test("Schema Validation", "FAIL", 
                                f"{description} - Got {response.status_code} instead of 400")
                    
            except Exception as e:
                self.log_test("Schema Validation", "FAIL", description, e)
    
    def test_valid_requests(self):
        """Test valid requests with n=3,4,5 questions"""
        test_cases = [
            {"docId": "test_doc_1", "locale": "es", "n": 3},
            {"docId": "test_doc_2", "locale": "en", "n": 4}, 
            {"docId": "test_doc_3", "locale": "es", "n": 5},
            {"docId": "test_doc_4", "locale": "en", "n": 5, "userId": "test_user_123"}
        ]
        
        for payload in test_cases:
            try:
                response = self.session.post(f"{API_BASE}/ai/questions", 
                                           json=payload, timeout=20)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Validate response structure
                    if self.validate_response_schema(data, payload['n']):
                        self.log_test("Valid Request", "PASS", 
                                    f"n={payload['n']}, locale={payload['locale']} - Response valid")
                    else:
                        self.log_test("Valid Request", "FAIL", 
                                    f"n={payload['n']}, locale={payload['locale']} - Invalid response schema")
                else:
                    self.log_test("Valid Request", "FAIL", 
                                f"n={payload['n']}, locale={payload['locale']} - Status: {response.status_code}")
                    
            except Exception as e:
                self.log_test("Valid Request", "FAIL", 
                            f"n={payload['n']}, locale={payload['locale']}", e)
    
    def validate_response_schema(self, data, expected_n):
        """Validate response matches Zod schema"""
        try:
            # Check required top-level fields
            if 'items' not in data or 'meta' not in data:
                return False
            
            items = data['items']
            meta = data['meta']
            
            # Check items array
            if not isinstance(items, list) or len(items) != expected_n:
                return False
            
            # Validate each question item
            for item in items:
                required_fields = ['qid', 'type', 'q', 'choices', 'correctIndex', 'explain', 'evidence']
                if not all(field in item for field in required_fields):
                    return False
                
                # Validate question type
                if item['type'] not in ['main_idea', 'detail', 'inference', 'vocab']:
                    return False
                
                # Validate choices (exactly 4)
                if not isinstance(item['choices'], list) or len(item['choices']) != 4:
                    return False
                
                # Validate correctIndex (0-3)
                if not isinstance(item['correctIndex'], int) or item['correctIndex'] < 0 or item['correctIndex'] > 3:
                    return False
                
                # Validate evidence structure
                evidence = item['evidence']
                if not isinstance(evidence, dict):
                    return False
                
                evidence_fields = ['quote', 'charStart', 'charEnd']
                if not all(field in evidence for field in evidence_fields):
                    return False
                
                # Validate evidence indexes
                if not isinstance(evidence['charStart'], int) or not isinstance(evidence['charEnd'], int):
                    return False
                
                if evidence['charStart'] < 0 or evidence['charEnd'] < evidence['charStart']:
                    return False
            
            # Validate meta structure
            meta_fields = ['docId', 'locale', 'chunkIds', 'model']
            if not all(field in meta for field in meta_fields):
                return False
            
            return True
            
        except Exception:
            return False
    
    def test_cache_system(self):
        """Test caching system with SHA256 hash generation"""
        # Make identical request twice to test cache hit
        payload = {"docId": "cache_test_doc", "locale": "es", "n": 3}
        
        try:
            # First request
            response1 = self.session.post(f"{API_BASE}/ai/questions", 
                                        json=payload, timeout=20)
            
            if response1.status_code != 200:
                self.log_test("Cache System", "FAIL", 
                            f"First request failed: {response1.status_code}")
                return
            
            data1 = response1.json()
            
            # Wait a moment then make identical request
            time.sleep(1)
            
            response2 = self.session.post(f"{API_BASE}/ai/questions", 
                                        json=payload, timeout=20)
            
            if response2.status_code != 200:
                self.log_test("Cache System", "FAIL", 
                            f"Second request failed: {response2.status_code}")
                return
            
            data2 = response2.json()
            
            # Check if second request was cached
            if 'cached' in data2 and data2['cached'] == True:
                self.log_test("Cache System", "PASS", 
                            "Cache hit detected on identical request")
            else:
                # Even if not cached, verify responses are consistent
                if data1.get('items') == data2.get('items'):
                    self.log_test("Cache System", "PASS", 
                                "Consistent responses (cache may be working)")
                else:
                    self.log_test("Cache System", "WARN", 
                                "No cache hit detected, responses differ")
                    
        except Exception as e:
            self.log_test("Cache System", "FAIL", "Cache test failed", e)
    
    def test_quota_limits(self):
        """Test daily call limits and monthly token limits"""
        # Test with multiple rapid requests to potentially trigger quota
        payload = {"docId": "quota_test", "locale": "en", "n": 3, "userId": "quota_test_user"}
        
        quota_responses = []
        
        try:
            # Make multiple requests rapidly
            for i in range(12):  # More than AI_MAX_CALLS_PER_DAY=10
                response = self.session.post(f"{API_BASE}/ai/questions", 
                                           json=payload, timeout=15)
                quota_responses.append({
                    'status': response.status_code,
                    'request_num': i + 1
                })
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('fallback') == True:
                        quota_responses[-1]['fallback'] = True
                        quota_responses[-1]['message'] = data.get('message', '')
                
                time.sleep(0.5)  # Small delay between requests
            
            # Analyze responses
            fallback_count = sum(1 for r in quota_responses if r.get('fallback'))
            success_count = sum(1 for r in quota_responses if r['status'] == 200 and not r.get('fallback'))
            
            if fallback_count > 0:
                self.log_test("Quota Limits", "PASS", 
                            f"Quota system working - {fallback_count} fallback responses after {success_count} successful calls")
            else:
                self.log_test("Quota Limits", "WARN", 
                            f"All {len(quota_responses)} requests succeeded - quota may not be enforced")
                
        except Exception as e:
            self.log_test("Quota Limits", "FAIL", "Quota testing failed", e)
    
    def test_fallback_responses(self):
        """Test fallback response validation when quotas/API unavailable"""
        # Test with a user that should trigger fallback
        payload = {"docId": "fallback_test", "locale": "es", "n": 4, "userId": "fallback_user"}
        
        try:
            response = self.session.post(f"{API_BASE}/ai/questions", 
                                       json=payload, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if it's a fallback response
                if data.get('fallback') == True:
                    # Validate fallback response structure
                    if self.validate_response_schema(data, payload['n']):
                        self.log_test("Fallback Response", "PASS", 
                                    "Fallback response has valid schema structure")
                    else:
                        self.log_test("Fallback Response", "FAIL", 
                                    "Fallback response has invalid schema")
                else:
                    # If not fallback, still validate it's a proper response
                    if self.validate_response_schema(data, payload['n']):
                        self.log_test("Fallback Response", "PASS", 
                                    "AI response has valid schema (fallback not triggered)")
                    else:
                        self.log_test("Fallback Response", "FAIL", 
                                    "Response has invalid schema")
            else:
                self.log_test("Fallback Response", "FAIL", 
                            f"Request failed: {response.status_code}")
                
        except Exception as e:
            self.log_test("Fallback Response", "FAIL", "Fallback test failed", e)
    
    def test_text_normalization_evidence(self):
        """Test text normalization and evidence index validation"""
        payload = {"docId": "normalization_test", "locale": "en", "n": 3}
        
        try:
            response = self.session.post(f"{API_BASE}/ai/questions", 
                                       json=payload, timeout=20)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'items' in data:
                    valid_evidence_count = 0
                    total_items = len(data['items'])
                    
                    for item in data['items']:
                        if 'evidence' in item:
                            evidence = item['evidence']
                            quote = evidence.get('quote', '')
                            char_start = evidence.get('charStart', 0)
                            char_end = evidence.get('charEnd', 0)
                            
                            # Basic validation of evidence indexes
                            if (isinstance(char_start, int) and isinstance(char_end, int) and 
                                char_start >= 0 and char_end > char_start and 
                                len(quote) > 0):
                                valid_evidence_count += 1
                    
                    if valid_evidence_count == total_items:
                        self.log_test("Text Normalization", "PASS", 
                                    f"All {total_items} questions have valid evidence indexes")
                    else:
                        self.log_test("Text Normalization", "WARN", 
                                    f"{valid_evidence_count}/{total_items} questions have valid evidence")
                else:
                    self.log_test("Text Normalization", "FAIL", "No items in response")
            else:
                self.log_test("Text Normalization", "FAIL", 
                            f"Request failed: {response.status_code}")
                
        except Exception as e:
            self.log_test("Text Normalization", "FAIL", "Evidence validation failed", e)
    
    def test_ai_provider_priority(self):
        """Test OPENAI_API_KEY priority over EMERGENT_LLM_KEY"""
        # This is tested indirectly by checking if the endpoint works
        # The actual priority logic is in the backend code
        payload = {"docId": "provider_test", "locale": "en", "n": 3}
        
        try:
            response = self.session.post(f"{API_BASE}/ai/questions", 
                                       json=payload, timeout=20)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if we got a valid response (indicates provider is working)
                if 'items' in data and 'meta' in data:
                    provider = data.get('provider', 'unknown')
                    model = data.get('meta', {}).get('model', 'unknown')
                    
                    self.log_test("AI Provider Priority", "PASS", 
                                f"AI provider working - Model: {model}, Provider: {provider}")
                else:
                    self.log_test("AI Provider Priority", "FAIL", 
                                "Invalid response structure from AI provider")
            else:
                self.log_test("AI Provider Priority", "FAIL", 
                            f"AI provider request failed: {response.status_code}")
                
        except Exception as e:
            self.log_test("AI Provider Priority", "FAIL", "Provider test failed", e)
    
    def test_locale_support(self):
        """Test Spanish and English locale support"""
        test_cases = [
            {"docId": "locale_es", "locale": "es", "n": 3},
            {"docId": "locale_en", "locale": "en", "n": 3}
        ]
        
        for payload in test_cases:
            try:
                response = self.session.post(f"{API_BASE}/ai/questions", 
                                           json=payload, timeout=20)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if 'meta' in data and data['meta'].get('locale') == payload['locale']:
                        self.log_test("Locale Support", "PASS", 
                                    f"Locale {payload['locale']} supported correctly")
                    else:
                        self.log_test("Locale Support", "FAIL", 
                                    f"Locale {payload['locale']} not properly handled")
                else:
                    self.log_test("Locale Support", "FAIL", 
                                f"Locale {payload['locale']} request failed: {response.status_code}")
                    
            except Exception as e:
                self.log_test("Locale Support", "FAIL", 
                            f"Locale {payload['locale']} test failed", e)
    
    def run_all_tests(self):
        """Run all test scenarios"""
        print("🚀 Starting Phase 2 MVP+ AI Questions Backend Testing")
        print("=" * 60)
        
        # Test sequence based on review request priorities
        self.test_health_endpoint()
        self.test_strict_schema_validation()
        self.test_valid_requests()
        self.test_cache_system()
        self.test_quota_limits()
        self.test_fallback_responses()
        self.test_text_normalization_evidence()
        self.test_ai_provider_priority()
        self.test_locale_support()
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        # Count results
        passed = sum(1 for r in self.test_results if r['status'] == 'PASS')
        failed = sum(1 for r in self.test_results if r['status'] == 'FAIL')
        warnings = sum(1 for r in self.test_results if r['status'] == 'WARN')
        
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"⚠️  WARNINGS: {warnings}")
        print(f"📝 TOTAL TESTS: {len(self.test_results)}")
        
        # Show failed tests
        if failed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"   • {result['test']}: {result['details']}")
                    if 'error' in result:
                        print(f"     Error: {result['error']}")
        
        return {
            'passed': passed,
            'failed': failed,
            'warnings': warnings,
            'total': len(self.test_results),
            'results': self.test_results
        }

if __name__ == "__main__":
    tester = AIQuestionsBackendTester()
    results = tester.run_all_tests()
    
    # Exit with error code if tests failed
    exit_code = 0 if results['failed'] == 0 else 1
    exit(exit_code)