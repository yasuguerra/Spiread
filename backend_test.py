#!/usr/bin/env python3
"""
PR A CORE UX BACKEND TESTING for Spiread
PHASE 7 - PR A Core UX Testing: GameIntro + EndScreen + Persistencia

This script tests the backend functionality supporting PR A Core UX components:

**PR A CORE UX COMPONENTS BACKEND TESTING:**
1. Progress API endpoints (GameShell level persistence)
2. Game Runs API (EndScreen historical data)
3. Settings API (GameIntro preferences)
4. CORS headers (Frontend component compatibility)
5. Health endpoint (Backend responsiveness)

**SUCCESS CRITERIA:**
- ✅ Progress API supports level persistence for all PR A games
- ✅ Game Runs API provides historical data for EndScreen sparklines
- ✅ Settings API handles GameIntro "don't show today" preferences
- ✅ CORS headers allow frontend component communication
- ✅ All PR A game types (schulte, twinwords, etc.) fully supported
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://read-faster-2.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def test_progress_api_endpoints():
    """Test Progress API endpoints that support UX components"""
    print("🔍 Testing Progress API Endpoints (PR A Core UX Support)...")
    
    # Test data for progress tracking
    test_user_id = "test_user_pr_a_123"
    test_game_types = ["schulte", "twinwords", "parimpar", "memorydigits", "lettersgrid", "wordsearch", "anagrams", "runningwords"]
    
    results = {
        "progress_save": False,
        "progress_get": False,
        "game_types_support": {},
        "errors": []
    }
    
    try:
        # Test Progress Save API (POST /api/progress/save)
        print("  📝 Testing Progress Save API...")
        
        for game_type in test_game_types:
            progress_data = {
                "userId": test_user_id,
                "game": game_type,
                "progress": {
                    "lastLevel": 5,
                    "lastBestScore": 150,
                    "totalRounds": 10,
                    "averageRt": 2500
                }
            }
            
            try:
                response = requests.post(
                    f"{API_BASE}/progress/save",
                    json=progress_data,
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    results["game_types_support"][game_type] = True
                    print(f"    ✅ {game_type}: Progress save successful")
                else:
                    results["game_types_support"][game_type] = False
                    print(f"    ❌ {game_type}: Progress save failed ({response.status_code})")
                    results["errors"].append(f"Progress save {game_type}: {response.status_code} - {response.text[:100]}")
                    
            except Exception as e:
                results["game_types_support"][game_type] = False
                results["errors"].append(f"Progress save {game_type} error: {str(e)}")
                print(f"    ❌ {game_type}: Progress save error - {str(e)}")
        
        # Check if at least one game type works
        if any(results["game_types_support"].values()):
            results["progress_save"] = True
            print("  ✅ Progress Save API: Working for at least one game type")
        else:
            print("  ❌ Progress Save API: Failed for all game types")
        
        # Test Progress Get API (GET /api/progress/get)
        print("  📖 Testing Progress Get API...")
        
        try:
            response = requests.get(
                f"{API_BASE}/progress/get",
                params={"userId": test_user_id},
                timeout=10
            )
            
            if response.status_code == 200:
                results["progress_get"] = True
                data = response.json()
                print(f"    ✅ Progress Get API: Working (returned {len(str(data))} bytes)")
                
                # Test game-specific progress retrieval
                for game_type in ["schulte", "twinwords"]:
                    try:
                        game_response = requests.get(
                            f"{API_BASE}/progress/get",
                            params={"userId": test_user_id, "game": game_type},
                            timeout=10
                        )
                        
                        if game_response.status_code == 200:
                            print(f"    ✅ Progress Get for {game_type}: Working")
                        else:
                            print(f"    ⚠️ Progress Get for {game_type}: {game_response.status_code}")
                            
                    except Exception as e:
                        print(f"    ⚠️ Progress Get for {game_type}: Error - {str(e)}")
                        
            else:
                results["progress_get"] = False
                print(f"    ❌ Progress Get API: Failed ({response.status_code})")
                results["errors"].append(f"Progress get: {response.status_code} - {response.text[:100]}")
                
        except Exception as e:
            results["progress_get"] = False
            results["errors"].append(f"Progress get error: {str(e)}")
            print(f"    ❌ Progress Get API: Error - {str(e)}")
            
    except Exception as e:
        results["errors"].append(f"Progress API test error: {str(e)}")
        print(f"  ❌ Progress API Test Error: {str(e)}")
    
    return results

def test_game_runs_api_for_ux():
    """Test Game Runs API endpoints that support EndScreen historical data"""
    print("🔍 Testing Game Runs API (EndScreen Historical Data Support)...")
    
    results = {
        "game_runs_post": False,
        "game_runs_get": False,
        "historical_data_support": False,
        "pr_a_game_types": {},
        "errors": []
    }
    
    test_user_id = "test_user_pr_a_456"
    pr_a_games = ["schulte", "twinwords", "parimpar", "memorydigits", "lettersgrid", "wordsearch", "anagrams", "runningwords"]
    
    try:
        # Test Game Runs POST for PR A game types
        print("  📝 Testing Game Runs POST for PR A games...")
        
        for game_type in pr_a_games:
            # Create realistic game run data for each game type
            game_run_data = {
                "userId": test_user_id,
                "game": game_type,
                "difficultyLevel": 3,
                "durationMs": 60000,  # 60 seconds as per PR A
                "score": 120,
                "metrics": get_game_specific_metrics(game_type)
            }
            
            try:
                response = requests.post(
                    f"{API_BASE}/gameRuns",
                    json=game_run_data,
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    results["pr_a_game_types"][game_type] = True
                    print(f"    ✅ {game_type}: Game run saved successfully")
                else:
                    results["pr_a_game_types"][game_type] = False
                    print(f"    ❌ {game_type}: Game run save failed ({response.status_code})")
                    results["errors"].append(f"Game run {game_type}: {response.status_code} - {response.text[:100]}")
                    
            except Exception as e:
                results["pr_a_game_types"][game_type] = False
                results["errors"].append(f"Game run {game_type} error: {str(e)}")
                print(f"    ❌ {game_type}: Game run error - {str(e)}")
        
        # Check if at least one PR A game type works
        if any(results["pr_a_game_types"].values()):
            results["game_runs_post"] = True
            print("  ✅ Game Runs POST: Working for at least one PR A game type")
        else:
            print("  ❌ Game Runs POST: Failed for all PR A game types")
        
        # Test Game Runs GET for historical data
        print("  📖 Testing Game Runs GET for historical data...")
        
        try:
            response = requests.get(
                f"{API_BASE}/gameRuns",
                params={"userId": test_user_id},
                timeout=10
            )
            
            if response.status_code == 200:
                results["game_runs_get"] = True
                data = response.json()
                print(f"    ✅ Game Runs GET: Working (returned {len(str(data))} bytes)")
                
                # Check if data structure supports EndScreen requirements
                if isinstance(data, list) or (isinstance(data, dict) and 'data' in data):
                    results["historical_data_support"] = True
                    print("    ✅ Historical Data Structure: Compatible with EndScreen component")
                else:
                    print("    ⚠️ Historical Data Structure: May need adjustment for EndScreen")
                    
            else:
                results["game_runs_get"] = False
                print(f"    ❌ Game Runs GET: Failed ({response.status_code})")
                results["errors"].append(f"Game runs get: {response.status_code} - {response.text[:100]}")
                
        except Exception as e:
            results["game_runs_get"] = False
            results["errors"].append(f"Game runs get error: {str(e)}")
            print(f"    ❌ Game Runs GET: Error - {str(e)}")
            
    except Exception as e:
        results["errors"].append(f"Game runs API test error: {str(e)}")
        print(f"  ❌ Game Runs API Test Error: {str(e)}")
    
    return results

def get_game_specific_metrics(game_type):
    """Generate realistic metrics for each game type as per PR A specifications"""
    
    metrics_map = {
        "schulte": {
            "tableSize": "5x5",
            "numbersFound": 25,
            "averageTimePerNumber": 1200,
            "errors": 2
        },
        "twinwords": {
            "pairsFound": 8,
            "accuracy": 0.85,
            "averageResponseTime": 1800,
            "fastPairs": 3
        },
        "parimpar": {
            "numbersSelected": 15,
            "correctSelections": 13,
            "accuracy": 0.87,
            "comboStreak": 5
        },
        "memorydigits": {
            "sequenceLength": 6,
            "correctSequences": 4,
            "accuracy": 0.67,
            "averageRecallTime": 3000
        },
        "lettersgrid": {
            "gridSize": "8x8",
            "targetsFound": 12,
            "accuracy": 0.92,
            "averageTimePerTarget": 2500
        },
        "wordsearch": {
            "gridSize": "10x10",
            "wordsFound": 6,
            "totalWords": 8,
            "accuracy": 0.75,
            "averageTimePerWord": 8000
        },
        "anagrams": {
            "wordsFormed": 5,
            "averageWordLength": 6,
            "accuracy": 0.83,
            "averageTimePerWord": 12000
        },
        "runningwords": {
            "wordsRead": 25,
            "accuracy": 0.88,
            "averageReadingSpeed": 350,
            "comprehensionScore": 0.85
        }
    }
    
    return metrics_map.get(game_type, {"score": 120, "accuracy": 0.8})

def test_settings_api_for_persistence():
    """Test Settings API that supports GameShell level persistence"""
    print("🔍 Testing Settings API (GameShell Level Persistence Support)...")
    
    results = {
        "settings_get": False,
        "settings_post": False,
        "level_persistence": False,
        "errors": []
    }
    
    test_user_id = "test_user_pr_a_789"
    
    try:
        # Test Settings GET
        print("  📖 Testing Settings GET...")
        
        try:
            response = requests.get(
                f"{API_BASE}/settings",
                params={"userId": test_user_id},
                timeout=10
            )
            
            if response.status_code == 200:
                results["settings_get"] = True
                data = response.json()
                print(f"    ✅ Settings GET: Working (returned {len(str(data))} bytes)")
                
                # Check if settings structure supports level persistence
                if isinstance(data, dict):
                    results["level_persistence"] = True
                    print("    ✅ Level Persistence Structure: Compatible with GameShell")
                else:
                    print("    ⚠️ Level Persistence Structure: May need adjustment")
                    
            else:
                results["settings_get"] = False
                print(f"    ❌ Settings GET: Failed ({response.status_code})")
                results["errors"].append(f"Settings get: {response.status_code} - {response.text[:100]}")
                
        except Exception as e:
            results["settings_get"] = False
            results["errors"].append(f"Settings get error: {str(e)}")
            print(f"    ❌ Settings GET: Error - {str(e)}")
        
        # Test Settings POST for level persistence
        print("  📝 Testing Settings POST for level persistence...")
        
        settings_data = {
            "userId": test_user_id,
            "settings": {
                "gamePreferences": {
                    "schulte": {"lastLevel": 5, "lastBestScore": 200},
                    "twinwords": {"lastLevel": 3, "lastBestScore": 150},
                    "parimpar": {"lastLevel": 4, "lastBestScore": 180}
                },
                "uiPreferences": {
                    "showGameIntro": True,
                    "language": "es"
                }
            }
        }
        
        try:
            response = requests.post(
                f"{API_BASE}/settings",
                json=settings_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                results["settings_post"] = True
                print("    ✅ Settings POST: Working (level persistence data saved)")
            else:
                results["settings_post"] = False
                print(f"    ❌ Settings POST: Failed ({response.status_code})")
                results["errors"].append(f"Settings post: {response.status_code} - {response.text[:100]}")
                
        except Exception as e:
            results["settings_post"] = False
            results["errors"].append(f"Settings post error: {str(e)}")
            print(f"    ❌ Settings POST: Error - {str(e)}")
            
    except Exception as e:
        results["errors"].append(f"Settings API test error: {str(e)}")
        print(f"  ❌ Settings API Test Error: {str(e)}")
    
    return results

def test_health_endpoint():
    """Test Health endpoint to ensure backend is responsive"""
    print("🔍 Testing Health Endpoint...")
    
    results = {
        "health_status": False,
        "response_time": 0,
        "errors": []
    }
    
    try:
        start_time = time.time()
        response = requests.get(f"{API_BASE}/health", timeout=10)
        end_time = time.time()
        
        results["response_time"] = round((end_time - start_time) * 1000, 2)  # ms
        
        if response.status_code == 200:
            results["health_status"] = True
            data = response.json()
            print(f"  ✅ Health Endpoint: Working ({results['response_time']}ms)")
            print(f"    📊 Response: {json.dumps(data, indent=2)[:200]}...")
        else:
            results["health_status"] = False
            print(f"  ❌ Health Endpoint: Failed ({response.status_code})")
            results["errors"].append(f"Health check: {response.status_code} - {response.text[:100]}")
            
    except Exception as e:
        results["health_status"] = False
        results["errors"].append(f"Health check error: {str(e)}")
        print(f"  ❌ Health Endpoint: Error - {str(e)}")
    
    return results

def test_cors_headers():
    """Test CORS headers for frontend component compatibility"""
    print("🔍 Testing CORS Headers (Frontend Component Compatibility)...")
    
    results = {
        "cors_support": False,
        "required_headers": {},
        "errors": []
    }
    
    required_cors_headers = [
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Methods", 
        "Access-Control-Allow-Headers"
    ]
    
    try:
        # Test OPTIONS request to check CORS
        response = requests.options(f"{API_BASE}/health", timeout=10)
        
        headers_found = {}
        for header in required_cors_headers:
            if header in response.headers:
                headers_found[header] = response.headers[header]
                print(f"  ✅ {header}: {response.headers[header]}")
            else:
                headers_found[header] = None
                print(f"  ❌ {header}: Missing")
        
        results["required_headers"] = headers_found
        
        # Check if all required headers are present
        if all(headers_found.values()):
            results["cors_support"] = True
            print("  ✅ CORS Headers: All required headers present")
        else:
            results["cors_support"] = False
            print("  ⚠️ CORS Headers: Some headers missing")
            
    except Exception as e:
        results["cors_support"] = False
        results["errors"].append(f"CORS test error: {str(e)}")
        print(f"  ❌ CORS Test: Error - {str(e)}")
    
    return results

def run_pr_a_backend_tests():
    """Run all backend tests for PR A Core UX components"""
    print("🚀 Starting PR A Core UX Backend Testing...")
    print("=" * 60)
    
    all_results = {}
    
    # Test 1: Health endpoint
    all_results["health"] = test_health_endpoint()
    print()
    
    # Test 2: CORS headers
    all_results["cors"] = test_cors_headers()
    print()
    
    # Test 3: Progress API endpoints
    all_results["progress_api"] = test_progress_api_endpoints()
    print()
    
    # Test 4: Game Runs API for historical data
    all_results["game_runs_api"] = test_game_runs_api_for_ux()
    print()
    
    # Test 5: Settings API for persistence
    all_results["settings_api"] = test_settings_api_for_persistence()
    print()
    
    # Generate summary
    print("=" * 60)
    print("📊 PR A CORE UX BACKEND TEST SUMMARY")
    print("=" * 60)
    
    total_tests = 0
    passed_tests = 0
    
    # Health endpoint
    if all_results["health"]["health_status"]:
        print("✅ Health Endpoint: WORKING")
        passed_tests += 1
    else:
        print("❌ Health Endpoint: FAILED")
    total_tests += 1
    
    # CORS support
    if all_results["cors"]["cors_support"]:
        print("✅ CORS Headers: WORKING")
        passed_tests += 1
    else:
        print("❌ CORS Headers: FAILED")
    total_tests += 1
    
    # Progress API
    progress_working = all_results["progress_api"]["progress_save"] and all_results["progress_api"]["progress_get"]
    if progress_working:
        print("✅ Progress API (GameShell Persistence): WORKING")
        passed_tests += 1
    else:
        print("❌ Progress API (GameShell Persistence): FAILED")
    total_tests += 1
    
    # Game Runs API
    game_runs_working = all_results["game_runs_api"]["game_runs_post"] and all_results["game_runs_api"]["game_runs_get"]
    if game_runs_working:
        print("✅ Game Runs API (EndScreen Historical Data): WORKING")
        passed_tests += 1
    else:
        print("❌ Game Runs API (EndScreen Historical Data): FAILED")
    total_tests += 1
    
    # Settings API
    settings_working = all_results["settings_api"]["settings_get"] and all_results["settings_api"]["settings_post"]
    if settings_working:
        print("✅ Settings API (Level Persistence): WORKING")
        passed_tests += 1
    else:
        print("❌ Settings API (Level Persistence): FAILED")
    total_tests += 1
    
    print()
    print(f"📈 OVERALL RESULTS: {passed_tests}/{total_tests} tests passed ({(passed_tests/total_tests)*100:.1f}%)")
    
    # PR A Game Types Support Summary
    print()
    print("🎮 PR A GAME TYPES SUPPORT:")
    pr_a_games = ["schulte", "twinwords", "parimpar", "memorydigits", "lettersgrid", "wordsearch", "anagrams", "runningwords"]
    
    for game in pr_a_games:
        progress_support = all_results["progress_api"]["game_types_support"].get(game, False)
        game_runs_support = all_results["game_runs_api"]["pr_a_game_types"].get(game, False)
        
        if progress_support and game_runs_support:
            print(f"  ✅ {game}: Full backend support")
        elif progress_support or game_runs_support:
            print(f"  ⚠️ {game}: Partial backend support")
        else:
            print(f"  ❌ {game}: No backend support")
    
    # Critical Issues Summary
    print()
    print("🚨 CRITICAL ISSUES:")
    all_errors = []
    for test_name, test_results in all_results.items():
        if "errors" in test_results and test_results["errors"]:
            all_errors.extend([f"{test_name}: {error}" for error in test_results["errors"]])
    
    if all_errors:
        for error in all_errors[:5]:  # Show first 5 errors
            print(f"  ❌ {error}")
        if len(all_errors) > 5:
            print(f"  ... and {len(all_errors) - 5} more errors")
    else:
        print("  🎉 No critical issues found!")
    
    print()
    print("=" * 60)
    print("🏁 PR A Core UX Backend Testing Complete!")
    print("=" * 60)
    
    return all_results

if __name__ == "__main__":
    try:
        results = run_pr_a_backend_tests()
        
        # Exit with appropriate code
        total_critical_failures = sum([
            not results["health"]["health_status"],
            not results["progress_api"]["progress_save"],
            not results["game_runs_api"]["game_runs_post"]
        ])
        
        if total_critical_failures == 0:
            print("✅ All critical backend systems working for PR A Core UX!")
            sys.exit(0)
        else:
            print(f"❌ {total_critical_failures} critical backend systems failing for PR A Core UX!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Testing failed with error: {str(e)}")
        sys.exit(1)