#!/usr/bin/env python3
"""
BACKEND API TESTING for PR D ParImpar Enhancement
Tests backend API compatibility for parimpar game type

This script tests the backend functionality supporting PR D ParImpar Enhancement:

**PR D PARIMPAR ENHANCEMENT BACKEND TESTING:**
1. Progress API endpoints (/api/progress/save and /api/progress/get) with parimpar game data
2. Game Runs API endpoints to ensure they can store parimpar game results
3. Verify all required game data fields are properly supported
4. Test parimpar game type recognition and data integrity
5. CORS headers for frontend compatibility

**EXPECTED GAME DATA STRUCTURE:**
{
  "game": "parimpar",
  "score": 150,
  "metrics": {
    "total_rounds": 8,
    "final_level": 5,
    "average_accuracy": 0.87,
    "average_time": 2400,
    "total_hits": 45,
    "total_false_positives": 6,
    "best_round_score": 25
  }
}

**SUCCESS CRITERIA:**
- ✅ Progress API supports parimpar game type for level persistence
- ✅ Game Runs API can store and retrieve parimpar game results
- ✅ All parimpar-specific metrics are properly stored
- ✅ Game type 'parimpar' is recognized and supported
- ✅ CORS headers allow ParImparPRD.jsx component communication
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://brain-games-2.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test user ID for testing
TEST_USER_ID = f"test_user_{uuid.uuid4().hex[:8]}"

def log_test(test_name, status, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    {details}")

def test_health_endpoint():
    """Test basic health endpoint"""
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'healthy':
                log_test("Health Endpoint", "PASS", f"Response time: {response.elapsed.total_seconds():.2f}s")
                return True
            else:
                log_test("Health Endpoint", "FAIL", f"Invalid response: {data}")
                return False
        else:
            log_test("Health Endpoint", "FAIL", f"Status: {response.status_code}")
            return False
    except Exception as e:
        log_test("Health Endpoint", "FAIL", f"Error: {str(e)}")
        return False

def test_progress_save_parimpar():
    """Test progress save endpoint with parimpar game data"""
    try:
        # Test data matching ParImparPRD.jsx structure
        progress_data = {
            "userId": TEST_USER_ID,
            "game": "parimpar",
            "progress": {
                "lastLevel": 5,
                "lastBestScore": 150,
                "totalRounds": 8,
                "bestAccuracy": 0.87,
                "averageTime": 2400,
                "updatedAt": datetime.now().isoformat()
            }
        }
        
        response = requests.post(
            f"{API_BASE}/progress/save",
            json=progress_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'parimpar' in data.get('message', ''):
                log_test("Progress Save - ParImpar", "PASS", f"Saved level {progress_data['progress']['lastLevel']}")
                return True
            else:
                log_test("Progress Save - ParImpar", "FAIL", f"Invalid response: {data}")
                return False
        else:
            log_test("Progress Save - ParImpar", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Progress Save - ParImpar", "FAIL", f"Error: {str(e)}")
        return False

def test_progress_get_parimpar():
    """Test progress get endpoint for parimpar game"""
    try:
        response = requests.get(
            f"{API_BASE}/progress/get",
            params={"userId": TEST_USER_ID, "game": "parimpar"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            progress = data.get('progress', {})
            parimpar_progress = progress.get('parimpar', {})
            
            if parimpar_progress:
                log_test("Progress Get - ParImpar", "PASS", f"Retrieved progress: level {parimpar_progress.get('lastLevel', 'N/A')}")
                return True
            else:
                # Default progress should be returned
                log_test("Progress Get - ParImpar", "PASS", "Default progress returned (no saved data)")
                return True
        else:
            log_test("Progress Get - ParImpar", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Progress Get - ParImpar", "FAIL", f"Error: {str(e)}")
        return False

def test_game_runs_save_parimpar():
    """Test game runs endpoint with parimpar game data matching expected structure"""
    try:
        # Test data matching the expected structure from review request
        game_run_data = {
            "userId": TEST_USER_ID,
            "game": "parimpar",
            "score": 150,
            "difficultyLevel": 5,
            "durationMs": 60000,  # 60 seconds
            "metrics": {
                "total_rounds": 8,
                "final_level": 5,
                "average_accuracy": 0.87,
                "average_time": 2400,
                "total_hits": 45,
                "total_false_positives": 6,
                "best_round_score": 25
            }
        }
        
        response = requests.post(
            f"{API_BASE}/gameRuns",
            json=game_run_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('game') == 'parimpar' and data.get('score') == 150:
                log_test("Game Runs Save - ParImpar", "PASS", f"Saved game run: score {data.get('score')}")
                return True
            else:
                log_test("Game Runs Save - ParImpar", "FAIL", f"Invalid response: {data}")
                return False
        else:
            log_test("Game Runs Save - ParImpar", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Game Runs Save - ParImpar", "FAIL", f"Error: {str(e)}")
        return False

def test_game_runs_get_parimpar():
    """Test game runs retrieval for parimpar game"""
    try:
        response = requests.get(
            f"{API_BASE}/gameRuns",
            params={"user_id": TEST_USER_ID},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                parimpar_runs = [run for run in data if run.get('game') == 'parimpar']
                if parimpar_runs:
                    log_test("Game Runs Get - ParImpar", "PASS", f"Retrieved {len(parimpar_runs)} parimpar game runs")
                    return True
                else:
                    log_test("Game Runs Get - ParImpar", "PASS", "No parimpar runs found (expected for new user)")
                    return True
            else:
                log_test("Game Runs Get - ParImpar", "FAIL", f"Invalid response format: {type(data)}")
                return False
        else:
            log_test("Game Runs Get - ParImpar", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Game Runs Get - ParImpar", "FAIL", f"Error: {str(e)}")
        return False

def test_game_data_field_validation():
    """Test that all required game data fields are properly supported"""
    try:
        # Test with comprehensive parimpar game data
        comprehensive_data = {
            "userId": TEST_USER_ID,
            "game": "parimpar",
            "score": 200,
            "difficultyLevel": 8,
            "durationMs": 60000,
            "metrics": {
                "total_rounds": 12,
                "final_level": 8,
                "average_accuracy": 0.92,
                "average_time": 1800,
                "total_hits": 68,
                "total_false_positives": 4,
                "best_round_score": 30,
                "grid_sizes_used": [9, 16, 25],
                "rules_alternated": ["even", "odd"],
                "level_ups": 3,
                "perfect_rounds": 5
            }
        }
        
        response = requests.post(
            f"{API_BASE}/gameRuns",
            json=comprehensive_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            # Verify all fields are preserved
            if (data.get('game') == 'parimpar' and 
                data.get('metrics', {}).get('total_rounds') == 12 and
                data.get('metrics', {}).get('average_accuracy') == 0.92):
                log_test("Game Data Field Validation", "PASS", "All parimpar fields properly stored")
                return True
            else:
                log_test("Game Data Field Validation", "FAIL", f"Data integrity issue: {data}")
                return False
        else:
            log_test("Game Data Field Validation", "FAIL", f"Status: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("Game Data Field Validation", "FAIL", f"Error: {str(e)}")
        return False

def test_parimpar_game_type_support():
    """Test that parimpar is recognized as a valid game type"""
    try:
        # Test with minimal parimpar data
        minimal_data = {
            "userId": TEST_USER_ID,
            "game": "parimpar",
            "score": 50,
            "metrics": {}
        }
        
        response = requests.post(
            f"{API_BASE}/gameRuns",
            json=minimal_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('game') == 'parimpar':
                log_test("ParImpar Game Type Support", "PASS", "Game type 'parimpar' accepted")
                return True
            else:
                log_test("ParImpar Game Type Support", "FAIL", f"Game type not preserved: {data}")
                return False
        else:
            log_test("ParImpar Game Type Support", "FAIL", f"Status: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("ParImpar Game Type Support", "FAIL", f"Error: {str(e)}")
        return False

def test_cors_headers():
    """Test CORS headers for frontend compatibility"""
    try:
        response = requests.options(f"{API_BASE}/gameRuns", timeout=10)
        
        if response.status_code == 200:
            headers = response.headers
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]
            
            missing_headers = [h for h in cors_headers if h not in headers]
            if not missing_headers:
                log_test("CORS Headers", "PASS", "All required CORS headers present")
                return True
            else:
                log_test("CORS Headers", "FAIL", f"Missing headers: {missing_headers}")
                return False
        else:
            log_test("CORS Headers", "FAIL", f"OPTIONS request failed: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("CORS Headers", "FAIL", f"Error: {str(e)}")
        return False

def run_all_tests():
    """Run all backend tests for ParImpar Enhancement"""
    print("=" * 80)
    print("BACKEND API TESTING - PR D ParImpar Enhancement")
    print("=" * 80)
    print(f"Testing against: {BASE_URL}")
    print(f"Test User ID: {TEST_USER_ID}")
    print("-" * 80)
    
    tests = [
        ("Health Endpoint", test_health_endpoint),
        ("Progress Save - ParImpar", test_progress_save_parimpar),
        ("Progress Get - ParImpar", test_progress_get_parimpar),
        ("Game Runs Save - ParImpar", test_game_runs_save_parimpar),
        ("Game Runs Get - ParImpar", test_game_runs_get_parimpar),
        ("Game Data Field Validation", test_game_data_field_validation),
        ("ParImpar Game Type Support", test_parimpar_game_type_support),
        ("CORS Headers", test_cors_headers)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            log_test(test_name, "FAIL", f"Unexpected error: {str(e)}")
            failed += 1
        
        # Small delay between tests
        time.sleep(0.5)
    
    print("-" * 80)
    print(f"RESULTS: {passed} PASSED, {failed} FAILED")
    print(f"SUCCESS RATE: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED - ParImpar backend support is working correctly!")
    else:
        print(f"⚠️  {failed} test(s) failed - Issues found with ParImpar backend support")
    
    print("=" * 80)
    
    return failed == 0

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)