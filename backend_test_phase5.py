#!/usr/bin/env python3
"""
Phase 5 MVP+ Closure Sprint - Backend Testing
Testing Session Runner 2.0, i18n system, Accessibility features, and PWA components

Focus Areas:
1. Session Runner 2.0 Backend Integration
2. i18n System Backend Support  
3. Accessibility System Integration
4. PWA Functionality
5. Integration with Existing Systems
6. Performance and Error Handling
"""

import requests
import json
import time
import uuid
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://brain-games-2.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test user ID (UUID format for Supabase)
TEST_USER_ID = str(uuid.uuid4())

def test_health_endpoint():
    """Test basic health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health endpoint working: {data}")
            return True
        else:
            print(f"❌ Health endpoint failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False

def test_session_schedules_api():
    """Test Session Runner 2.0 backend integration - session_schedules table"""
    print("\n=== Testing Session Schedules API (Session Runner 2.0) ===")
    
    # Test GET endpoint
    print("Testing GET /api/sessionSchedules...")
    try:
        response = requests.get(f"{API_BASE}/sessionSchedules", 
                              params={"user_id": TEST_USER_ID}, 
                              timeout=10)
        print(f"GET Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ GET session schedules working")
        else:
            print(f"❌ GET session schedules failed: {response.text}")
    except Exception as e:
        print(f"❌ GET session schedules error: {e}")
    
    # Test POST endpoint - Session Runner 2.0 data structure
    print("Testing POST /api/sessionSchedules...")
    session_data = {
        "user_id": TEST_USER_ID,
        "template_type": "medium",
        "metrics": {
            "blocks": [
                {
                    "game": "par_impar",
                    "duration": 3,
                    "title": "Par/Impar",
                    "status": "completed",
                    "score": 85,
                    "levelStart": 1,
                    "levelEnd": 2,
                    "playedMs": 180000,
                    "plannedMs": 180000
                },
                {
                    "game": "rsvp",
                    "duration": 10,
                    "title": "Lectura RSVP",
                    "status": "completed",
                    "score": 120,
                    "levelStart": 2,
                    "levelEnd": 3,
                    "playedMs": 600000,
                    "plannedMs": 600000
                }
            ],
            "total_ms": 1800000,  # 30 minutes
            "total_score": 205,
            "avg_level": 2.5,
            "quits": 0,
            "paused_ms": 5000,
            "completed": True
        },
        "started_at": datetime.now().isoformat(),
        "completed_at": datetime.now().isoformat()
    }
    
    try:
        response = requests.post(f"{API_BASE}/sessionSchedules", 
                               json=session_data, 
                               timeout=10)
        print(f"POST Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ POST session schedule working")
            print(f"Created session: {data.get('id', 'No ID')}")
            return True
        else:
            print(f"❌ POST session schedule failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ POST session schedule error: {e}")
        return False

def test_settings_language_integration():
    """Test i18n system backend support - settings.language column"""
    print("\n=== Testing i18n System Backend Support ===")
    
    # Test language persistence in settings
    print("Testing language settings integration...")
    
    # Test Spanish language setting
    settings_data = {
        "user_id": TEST_USER_ID,
        "language": "es",
        "wpm_target": 300,
        "chunk_size": 1,
        "theme": "auto",
        "font_size": 16,
        "sound_enabled": True,
        "show_instructions": True,
        "progress": {
            "rsvp": {"lastLevel": 1, "lastBestScore": 0},
            "schulte": {"lastLevel": 1, "lastBestScore": 0}
        }
    }
    
    try:
        response = requests.post(f"{API_BASE}/settings", 
                               json=settings_data, 
                               timeout=10)
        print(f"POST Settings (ES) Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Spanish language setting saved")
        else:
            print(f"❌ Spanish language setting failed: {response.text}")
    except Exception as e:
        print(f"❌ Spanish language setting error: {e}")
    
    # Test English language setting
    settings_data["language"] = "en"
    try:
        response = requests.post(f"{API_BASE}/settings", 
                               json=settings_data, 
                               timeout=10)
        print(f"POST Settings (EN) Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ English language setting saved")
        else:
            print(f"❌ English language setting failed: {response.text}")
    except Exception as e:
        print(f"❌ English language setting error: {e}")
    
    # Test GET settings to verify language persistence
    try:
        response = requests.get(f"{API_BASE}/settings", 
                              params={"user_id": TEST_USER_ID}, 
                              timeout=10)
        print(f"GET Settings Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            language = data.get('language', 'not found')
            print(f"✅ Language retrieved: {language}")
            return language == "en"
        else:
            print(f"❌ GET settings failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ GET settings error: {e}")
        return False

def test_pwa_manifest():
    """Test PWA manifest.json accessibility and structure"""
    print("\n=== Testing PWA Manifest ===")
    
    try:
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        print(f"Manifest Status: {response.status_code}")
        if response.status_code == 200:
            manifest = response.json()
            
            # Check required PWA fields
            required_fields = ['name', 'short_name', 'start_url', 'display', 'icons']
            missing_fields = [field for field in required_fields if field not in manifest]
            
            if not missing_fields:
                print("✅ PWA manifest has all required fields")
                
                # Check icons
                icons = manifest.get('icons', [])
                if len(icons) >= 2:
                    print(f"✅ PWA manifest has {len(icons)} icons")
                else:
                    print(f"⚠️ PWA manifest has only {len(icons)} icons")
                
                # Check shortcuts
                shortcuts = manifest.get('shortcuts', [])
                if shortcuts:
                    print(f"✅ PWA manifest has {len(shortcuts)} shortcuts")
                else:
                    print("⚠️ PWA manifest has no shortcuts")
                
                # Check features
                features = manifest.get('features', [])
                if features:
                    print(f"✅ PWA manifest lists {len(features)} features")
                
                return True
            else:
                print(f"❌ PWA manifest missing fields: {missing_fields}")
                return False
        else:
            print(f"❌ PWA manifest not accessible: {response.text}")
            return False
    except Exception as e:
        print(f"❌ PWA manifest error: {e}")
        return False

def test_service_worker():
    """Test service worker registration and basic functionality"""
    print("\n=== Testing Service Worker ===")
    
    try:
        response = requests.get(f"{BASE_URL}/sw.js", timeout=10)
        print(f"Service Worker Status: {response.status_code}")
        if response.status_code == 200:
            sw_content = response.text
            
            # Check for key service worker features
            features_to_check = [
                ('CACHE_NAME', 'Cache naming'),
                ('install', 'Install event'),
                ('activate', 'Activate event'),
                ('fetch', 'Fetch event'),
                ('background-sync', 'Background sync'),
                ('offline', 'Offline support')
            ]
            
            found_features = []
            for feature, description in features_to_check:
                if feature in sw_content:
                    found_features.append(description)
                    print(f"✅ {description} implemented")
                else:
                    print(f"❌ {description} not found")
            
            if len(found_features) >= 4:
                print("✅ Service worker has core PWA functionality")
                return True
            else:
                print(f"⚠️ Service worker missing some features: {len(found_features)}/6")
                return False
        else:
            print(f"❌ Service worker not accessible: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Service worker error: {e}")
        return False

def test_game_runs_integration():
    """Test game runs API integration with new Phase 5 session types"""
    print("\n=== Testing Game Runs Integration ===")
    
    # Test game run from Session Runner 2.0
    game_run_data = {
        "userId": TEST_USER_ID,
        "game": "session_block",  # New session-based game type
        "difficultyLevel": 2,
        "durationMs": 180000,  # 3 minutes
        "score": 85,
        "metrics": {
            "blockType": "par_impar",
            "sessionId": f"session_{int(time.time())}_{TEST_USER_ID}",
            "templateType": "medium",
            "blockIndex": 0,
            "carryOverLevel": 2,
            "pausedMs": 1000,
            "completed": True
        }
    }
    
    try:
        response = requests.post(f"{API_BASE}/gameRuns", 
                               json=game_run_data, 
                               timeout=10)
        print(f"POST Game Run Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ Session-based game run created")
            return True
        else:
            print(f"❌ Session-based game run failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Session-based game run error: {e}")
        return False

def test_offline_queue_simulation():
    """Test offline queue functionality simulation"""
    print("\n=== Testing Offline Queue Simulation ===")
    
    # This simulates what would happen when the service worker queues requests
    print("Simulating offline queue behavior...")
    
    # Create multiple game runs that would be queued offline
    queued_runs = []
    for i in range(3):
        game_run = {
            "userId": TEST_USER_ID,
            "game": f"offline_test_{i}",
            "difficultyLevel": 1,
            "durationMs": 60000,
            "score": 50 + i * 10,
            "metrics": {
                "offline": True,
                "queuedAt": datetime.now().isoformat(),
                "syncAttempt": i + 1
            }
        }
        queued_runs.append(game_run)
    
    # Test batch processing (simulating sync when back online)
    successful_syncs = 0
    for i, run in enumerate(queued_runs):
        try:
            response = requests.post(f"{API_BASE}/gameRuns", 
                                   json=run, 
                                   timeout=5)
            if response.status_code == 200:
                successful_syncs += 1
                print(f"✅ Queued run {i+1} synced successfully")
            else:
                print(f"❌ Queued run {i+1} sync failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Queued run {i+1} sync error: {e}")
    
    if successful_syncs == len(queued_runs):
        print("✅ All offline queue items synced successfully")
        return True
    else:
        print(f"⚠️ Only {successful_syncs}/{len(queued_runs)} queue items synced")
        return False

def test_performance_targets():
    """Test performance targets < 2.5s LCP"""
    print("\n=== Testing Performance Targets ===")
    
    # Test main page load time
    start_time = time.time()
    try:
        response = requests.get(BASE_URL, timeout=10)
        load_time = time.time() - start_time
        
        print(f"Page load time: {load_time:.2f}s")
        if load_time < 2.5:
            print("✅ Page load time meets LCP target < 2.5s")
            performance_good = True
        else:
            print("⚠️ Page load time exceeds LCP target")
            performance_good = False
        
        # Test API response times
        api_start = time.time()
        health_response = requests.get(f"{API_BASE}/health", timeout=10)
        api_time = time.time() - api_start
        
        print(f"API response time: {api_time:.2f}s")
        if api_time < 1.0:
            print("✅ API response time is good")
            api_good = True
        else:
            print("⚠️ API response time could be improved")
            api_good = False
        
        return performance_good and api_good
        
    except Exception as e:
        print(f"❌ Performance test error: {e}")
        return False

def test_error_handling():
    """Test robust error handling for offline scenarios"""
    print("\n=== Testing Error Handling ===")
    
    # Test invalid endpoints
    try:
        response = requests.get(f"{API_BASE}/invalid_endpoint", timeout=5)
        if response.status_code == 404:
            print("✅ 404 error handling works")
            error_handling_good = True
        else:
            print(f"⚠️ Unexpected response for invalid endpoint: {response.status_code}")
            error_handling_good = False
    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
        error_handling_good = False
    
    # Test missing parameters
    try:
        response = requests.get(f"{API_BASE}/settings", timeout=5)  # Missing user_id
        if response.status_code == 400:
            print("✅ 400 error handling for missing parameters works")
            param_handling_good = True
        else:
            print(f"⚠️ Unexpected response for missing parameters: {response.status_code}")
            param_handling_good = False
    except Exception as e:
        print(f"❌ Parameter validation test failed: {e}")
        param_handling_good = False
    
    return error_handling_good and param_handling_good

def test_integration_with_existing_systems():
    """Test that Phase 5 additions don't break existing APIs"""
    print("\n=== Testing Integration with Existing Systems ===")
    
    # Test existing game runs still work
    legacy_game_run = {
        "userId": TEST_USER_ID,
        "game": "schulte",  # Existing game type
        "difficultyLevel": 3,
        "durationMs": 45000,
        "score": 120,
        "metrics": {
            "gridSize": 5,
            "accuracy": 0.95,
            "avgResponseTime": 1200
        }
    }
    
    try:
        response = requests.post(f"{API_BASE}/gameRuns", 
                               json=legacy_game_run, 
                               timeout=10)
        if response.status_code == 200:
            print("✅ Legacy game runs still work")
            legacy_good = True
        else:
            print(f"❌ Legacy game runs broken: {response.text}")
            legacy_good = False
    except Exception as e:
        print(f"❌ Legacy game runs error: {e}")
        legacy_good = False
    
    # Test existing settings still work
    legacy_settings = {
        "user_id": TEST_USER_ID,
        "wpm_target": 250,
        "chunk_size": 1,
        "theme": "dark"
    }
    
    try:
        response = requests.post(f"{API_BASE}/settings", 
                               json=legacy_settings, 
                               timeout=10)
        if response.status_code == 200:
            print("✅ Legacy settings still work")
            settings_good = True
        else:
            print(f"❌ Legacy settings broken: {response.text}")
            settings_good = False
    except Exception as e:
        print(f"❌ Legacy settings error: {e}")
        settings_good = False
    
    return legacy_good and settings_good

def run_phase5_tests():
    """Run all Phase 5 backend tests"""
    print("🚀 Starting Phase 5 MVP+ Closure Sprint Backend Testing")
    print(f"Testing against: {BASE_URL}")
    print(f"Test User ID: {TEST_USER_ID}")
    
    test_results = {}
    
    # Core functionality tests
    test_results['health'] = test_health_endpoint()
    test_results['session_schedules'] = test_session_schedules_api()
    test_results['i18n_backend'] = test_settings_language_integration()
    test_results['pwa_manifest'] = test_pwa_manifest()
    test_results['service_worker'] = test_service_worker()
    test_results['game_runs_integration'] = test_game_runs_integration()
    test_results['offline_queue'] = test_offline_queue_simulation()
    test_results['performance'] = test_performance_targets()
    test_results['error_handling'] = test_error_handling()
    test_results['existing_systems'] = test_integration_with_existing_systems()
    
    # Summary
    print("\n" + "="*60)
    print("PHASE 5 BACKEND TESTING SUMMARY")
    print("="*60)
    
    passed = sum(1 for result in test_results.values() if result)
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 All Phase 5 backend tests PASSED!")
    elif passed >= total * 0.8:
        print("⚠️ Most Phase 5 backend tests passed - minor issues to address")
    else:
        print("❌ Significant Phase 5 backend issues found - requires attention")
    
    return test_results

if __name__ == "__main__":
    results = run_phase5_tests()