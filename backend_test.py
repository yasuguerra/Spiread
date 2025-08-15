#!/usr/bin/env python3
"""
FASE 6 — Sprint 3: PWA-SEO-LEGAL-RC - PHASE 1 PWA HARDENING BACKEND TESTING

Comprehensive backend testing of PWA hardening implementation focusing on:
1. Debug Endpoint PWA Status - GET /debug
2. Service Worker Delivery - GET /sw.js  
3. Offline Page Accessibility - GET /offline
4. PWA Manifest - GET /manifest.json

Testing Context: Phase 1 of PWA Hardening for v1.0.0-rc.1 release candidate
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://read-faster-2.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

def log_test(test_name, status, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    {details}")

def test_debug_endpoint_pwa_status():
    """
    Test GET /debug endpoint and verify PWA status block structure
    Expected PWA block structure:
    {
      "swVersion": "spiread-v1", 
      "installed": true|false,
      "caches": {"shell": N, "assets": N, "data": N},
      "bgSync": {"queueLengths": {"game_runs": N, "session_schedules": N}}
    }
    """
    print("\n=== TESTING DEBUG ENDPOINT PWA STATUS ===")
    
    try:
        # Test GET /debug endpoint
        response = requests.get(f"{BASE_URL}/debug", timeout=10)
        
        if response.status_code != 200:
            log_test("Debug endpoint accessibility", "FAIL", f"HTTP {response.status_code}")
            return False
            
        log_test("Debug endpoint accessibility", "PASS", f"HTTP {response.status_code}")
        
        # Parse JSON response
        try:
            data = response.json()
        except json.JSONDecodeError as e:
            log_test("Debug endpoint JSON parsing", "FAIL", f"Invalid JSON: {e}")
            return False
            
        log_test("Debug endpoint JSON parsing", "PASS")
        
        # Verify PWA block exists
        if 'pwa' not in data:
            log_test("PWA block presence", "FAIL", "Missing 'pwa' key in response")
            return False
            
        log_test("PWA block presence", "PASS")
        pwa_block = data['pwa']
        
        # Verify PWA block structure - swVersion
        if 'swVersion' not in pwa_block:
            log_test("PWA swVersion field", "FAIL", "Missing 'swVersion' field")
            return False
            
        if pwa_block['swVersion'] != 'spiread-v1':
            log_test("PWA swVersion value", "FAIL", f"Expected 'spiread-v1', got '{pwa_block['swVersion']}'")
            return False
            
        log_test("PWA swVersion field", "PASS", f"Value: {pwa_block['swVersion']}")
        
        # Verify PWA block structure - installed
        if 'installed' not in pwa_block:
            log_test("PWA installed field", "FAIL", "Missing 'installed' field")
            return False
            
        if not isinstance(pwa_block['installed'], bool):
            log_test("PWA installed type", "FAIL", f"Expected boolean, got {type(pwa_block['installed'])}")
            return False
            
        log_test("PWA installed field", "PASS", f"Value: {pwa_block['installed']}")
        
        # Verify PWA block structure - caches
        if 'caches' not in pwa_block:
            log_test("PWA caches field", "FAIL", "Missing 'caches' field")
            return False
            
        caches = pwa_block['caches']
        required_cache_keys = ['shell', 'assets', 'data']
        
        for cache_key in required_cache_keys:
            if cache_key not in caches:
                log_test(f"PWA caches.{cache_key}", "FAIL", f"Missing '{cache_key}' in caches")
                return False
                
        log_test("PWA caches structure", "PASS", f"Keys: {list(caches.keys())}")
        
        # Verify PWA block structure - bgSync
        if 'bgSync' not in pwa_block:
            log_test("PWA bgSync field", "FAIL", "Missing 'bgSync' field")
            return False
            
        bg_sync = pwa_block['bgSync']
        
        if 'queueLengths' not in bg_sync:
            log_test("PWA bgSync.queueLengths", "FAIL", "Missing 'queueLengths' in bgSync")
            return False
            
        queue_lengths = bg_sync['queueLengths']
        required_queues = ['game_runs', 'session_schedules']
        
        for queue_name in required_queues:
            if queue_name not in queue_lengths:
                log_test(f"PWA bgSync.queueLengths.{queue_name}", "FAIL", f"Missing '{queue_name}' queue")
                return False
                
        log_test("PWA bgSync structure", "PASS", f"Queues: {list(queue_lengths.keys())}")
        
        # Verify additional PWA information
        if 'cacheVersions' in pwa_block:
            cache_versions = pwa_block['cacheVersions']
            expected_versions = {
                'shell': 'spiread-shell-v1',
                'assets': 'spiread-assets-v1', 
                'data': 'spiread-data-v1'
            }
            
            for cache_type, expected_version in expected_versions.items():
                if cache_type in cache_versions:
                    if cache_versions[cache_type] == expected_version:
                        log_test(f"PWA cache version {cache_type}", "PASS", f"Version: {cache_versions[cache_type]}")
                    else:
                        log_test(f"PWA cache version {cache_type}", "FAIL", f"Expected {expected_version}, got {cache_versions[cache_type]}")
                        
        # Verify PWA features list
        if 'features' in pwa_block and isinstance(pwa_block['features'], list):
            log_test("PWA features list", "PASS", f"Features count: {len(pwa_block['features'])}")
            
        print(f"\n📋 PWA Block Structure:")
        print(json.dumps(pwa_block, indent=2))
        
        return True
        
    except requests.exceptions.RequestException as e:
        log_test("Debug endpoint request", "FAIL", f"Request error: {e}")
        return False

def test_service_worker_delivery():
    """
    Test GET /sw.js and verify Service Worker code and versioning
    Expected: SW_VERSION = 'spiread-v1', cache names, background sync functionality
    """
    print("\n=== TESTING SERVICE WORKER DELIVERY ===")
    
    try:
        # Test GET /sw.js endpoint
        response = requests.get(f"{BASE_URL}/sw.js", timeout=10)
        
        if response.status_code != 200:
            log_test("Service Worker accessibility", "FAIL", f"HTTP {response.status_code}")
            return False
            
        log_test("Service Worker accessibility", "PASS", f"HTTP {response.status_code}")
        
        # Verify content type
        content_type = response.headers.get('content-type', '')
        if 'javascript' not in content_type.lower() and 'text' not in content_type.lower():
            log_test("Service Worker content type", "WARN", f"Unexpected content-type: {content_type}")
        else:
            log_test("Service Worker content type", "PASS", f"Content-Type: {content_type}")
        
        # Get Service Worker code
        sw_code = response.text
        
        if not sw_code or len(sw_code) < 100:
            log_test("Service Worker content", "FAIL", "Empty or too short Service Worker code")
            return False
            
        log_test("Service Worker content", "PASS", f"Code length: {len(sw_code)} characters")
        
        # Verify SW_VERSION = 'spiread-v1'
        if "SW_VERSION = 'spiread-v1'" not in sw_code:
            log_test("Service Worker version", "FAIL", "SW_VERSION = 'spiread-v1' not found")
            return False
            
        log_test("Service Worker version", "PASS", "SW_VERSION = 'spiread-v1' found")
        
        # Verify versioned cache names
        expected_cache_names = [
            'spiread-shell-v1',
            'spiread-assets-v1',
            'spiread-data-v1'
        ]
        
        for cache_name in expected_cache_names:
            if cache_name not in sw_code:
                log_test(f"Cache name {cache_name}", "FAIL", f"Cache name '{cache_name}' not found in SW code")
                return False
            else:
                log_test(f"Cache name {cache_name}", "PASS", "Found in Service Worker")
        
        # Verify background sync functionality
        bg_sync_indicators = [
            'addEventListener(\'sync\'',
            'background-sync',
            'offlineQueue',
            'game_runs',
            'session_schedules'
        ]
        
        for indicator in bg_sync_indicators:
            if indicator not in sw_code:
                log_test(f"Background sync indicator '{indicator}'", "WARN", "Not found in SW code")
            else:
                log_test(f"Background sync indicator '{indicator}'", "PASS", "Found in Service Worker")
        
        # Verify exponential backoff implementation
        if 'exponential' in sw_code.lower() or 'backoff' in sw_code.lower():
            log_test("Exponential backoff", "PASS", "Backoff logic found in Service Worker")
        else:
            log_test("Exponential backoff", "WARN", "Backoff logic not clearly identified")
        
        # Verify cache management
        cache_management_indicators = [
            'caches.open',
            'cache.put',
            'cache.match',
            'caches.delete'
        ]
        
        for indicator in cache_management_indicators:
            if indicator not in sw_code:
                log_test(f"Cache management '{indicator}'", "WARN", "Not found in SW code")
            else:
                log_test(f"Cache management '{indicator}'", "PASS", "Found in Service Worker")
        
        return True
        
    except requests.exceptions.RequestException as e:
        log_test("Service Worker request", "FAIL", f"Request error: {e}")
        return False

def test_offline_page_accessibility():
    """
    Test GET /offline and verify enhanced offline page with UX improvements
    """
    print("\n=== TESTING OFFLINE PAGE ACCESSIBILITY ===")
    
    try:
        # Test GET /offline endpoint
        response = requests.get(f"{BASE_URL}/offline", timeout=10)
        
        if response.status_code != 200:
            log_test("Offline page accessibility", "FAIL", f"HTTP {response.status_code}")
            return False
            
        log_test("Offline page accessibility", "PASS", f"HTTP {response.status_code}")
        
        # Verify content type
        content_type = response.headers.get('content-type', '')
        if 'html' not in content_type.lower():
            log_test("Offline page content type", "WARN", f"Expected HTML, got: {content_type}")
        else:
            log_test("Offline page content type", "PASS", f"Content-Type: {content_type}")
        
        # Get page content
        page_content = response.text
        
        if not page_content or len(page_content) < 100:
            log_test("Offline page content", "FAIL", "Empty or too short offline page content")
            return False
            
        log_test("Offline page content", "PASS", f"Content length: {len(page_content)} characters")
        
        # Verify UX elements mentioned in test_result.md
        ux_elements = [
            'Reintentar',  # Retry button
            'Sin Conexión',  # Connection status
            'Offline',  # Offline indicator
            'Funciones Disponibles',  # Available features
            'juegos',  # Games mention
            'RSVP',  # RSVP reader
            'Sincronización',  # Auto-sync
            'Estadísticas'  # Local stats
        ]
        
        for element in ux_elements:
            if element in page_content:
                log_test(f"UX element '{element}'", "PASS", "Found in offline page")
            else:
                log_test(f"UX element '{element}'", "WARN", "Not found in offline page")
        
        # Verify offline features display
        offline_features = [
            '9 games',  # 9 games offline support
            'offline',  # Offline functionality
            'connection',  # Connection detection
            'sync'  # Synchronization
        ]
        
        features_found = 0
        for feature in offline_features:
            if feature.lower() in page_content.lower():
                features_found += 1
                
        if features_found >= 2:
            log_test("Offline features display", "PASS", f"Found {features_found} offline feature indicators")
        else:
            log_test("Offline features display", "WARN", f"Only found {features_found} offline feature indicators")
        
        # Check for interactive elements
        interactive_elements = [
            'button',
            'onclick',
            'addEventListener',
            'handleRetry'
        ]
        
        interactive_found = 0
        for element in interactive_elements:
            if element in page_content:
                interactive_found += 1
                
        if interactive_found >= 1:
            log_test("Interactive elements", "PASS", f"Found {interactive_found} interactive elements")
        else:
            log_test("Interactive elements", "WARN", "No interactive elements found")
        
        return True
        
    except requests.exceptions.RequestException as e:
        log_test("Offline page request", "FAIL", f"Request error: {e}")
        return False

def test_pwa_manifest():
    """
    Test GET /manifest.json and verify PWA manifest availability and validity
    """
    print("\n=== TESTING PWA MANIFEST ===")
    
    try:
        # Test GET /manifest.json endpoint
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        
        if response.status_code != 200:
            log_test("PWA manifest accessibility", "FAIL", f"HTTP {response.status_code}")
            return False
            
        log_test("PWA manifest accessibility", "PASS", f"HTTP {response.status_code}")
        
        # Verify content type
        content_type = response.headers.get('content-type', '')
        if 'json' not in content_type.lower():
            log_test("PWA manifest content type", "WARN", f"Expected JSON, got: {content_type}")
        else:
            log_test("PWA manifest content type", "PASS", f"Content-Type: {content_type}")
        
        # Parse JSON manifest
        try:
            manifest = response.json()
        except json.JSONDecodeError as e:
            log_test("PWA manifest JSON parsing", "FAIL", f"Invalid JSON: {e}")
            return False
            
        log_test("PWA manifest JSON parsing", "PASS")
        
        # Verify required PWA manifest fields
        required_fields = [
            'name',
            'short_name', 
            'start_url',
            'display',
            'background_color',
            'theme_color',
            'icons'
        ]
        
        for field in required_fields:
            if field not in manifest:
                log_test(f"PWA manifest field '{field}'", "FAIL", f"Missing required field")
                return False
            else:
                log_test(f"PWA manifest field '{field}'", "PASS", f"Value: {manifest[field]}")
        
        # Verify icons array
        if not isinstance(manifest['icons'], list) or len(manifest['icons']) == 0:
            log_test("PWA manifest icons", "FAIL", "Icons must be a non-empty array")
            return False
            
        log_test("PWA manifest icons", "PASS", f"Found {len(manifest['icons'])} icons")
        
        # Verify icon structure
        for i, icon in enumerate(manifest['icons'][:3]):  # Check first 3 icons
            required_icon_fields = ['src', 'sizes', 'type']
            for field in required_icon_fields:
                if field not in icon:
                    log_test(f"Icon {i+1} field '{field}'", "WARN", f"Missing field in icon")
                else:
                    log_test(f"Icon {i+1} field '{field}'", "PASS", f"Value: {icon[field]}")
        
        # Verify PWA-specific fields
        pwa_fields = {
            'display': ['standalone', 'fullscreen', 'minimal-ui'],
            'orientation': ['portrait', 'landscape', 'portrait-primary'],
            'scope': ['/']
        }
        
        for field, valid_values in pwa_fields.items():
            if field in manifest:
                if isinstance(valid_values, list) and manifest[field] not in valid_values:
                    log_test(f"PWA field '{field}' value", "WARN", f"Unexpected value: {manifest[field]}")
                else:
                    log_test(f"PWA field '{field}'", "PASS", f"Value: {manifest[field]}")
        
        # Verify additional PWA features
        optional_fields = ['shortcuts', 'screenshots', 'features', 'categories']
        
        for field in optional_fields:
            if field in manifest:
                if isinstance(manifest[field], list):
                    log_test(f"PWA optional field '{field}'", "PASS", f"Found {len(manifest[field])} items")
                else:
                    log_test(f"PWA optional field '{field}'", "PASS", f"Value: {manifest[field]}")
        
        print(f"\n📋 PWA Manifest Summary:")
        print(f"   Name: {manifest.get('name', 'N/A')}")
        print(f"   Short Name: {manifest.get('short_name', 'N/A')}")
        print(f"   Start URL: {manifest.get('start_url', 'N/A')}")
        print(f"   Display: {manifest.get('display', 'N/A')}")
        print(f"   Icons: {len(manifest.get('icons', []))}")
        print(f"   Shortcuts: {len(manifest.get('shortcuts', []))}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        log_test("PWA manifest request", "FAIL", f"Request error: {e}")
        return False

def test_pwa_headers_and_caching():
    """
    Test PWA-related endpoints for proper headers and caching policies
    """
    print("\n=== TESTING PWA HEADERS AND CACHING ===")
    
    endpoints_to_test = [
        ('/debug', 'Debug endpoint'),
        ('/sw.js', 'Service Worker'),
        ('/offline', 'Offline page'),
        ('/manifest.json', 'PWA manifest')
    ]
    
    all_passed = True
    
    for endpoint, description in endpoints_to_test:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            
            if response.status_code == 200:
                log_test(f"{description} headers", "PASS", f"HTTP {response.status_code}")
                
                # Check for security headers
                security_headers = [
                    'x-frame-options',
                    'x-content-type-options',
                    'referrer-policy'
                ]
                
                for header in security_headers:
                    if header in response.headers:
                        log_test(f"{description} {header}", "PASS", f"Value: {response.headers[header]}")
                    else:
                        log_test(f"{description} {header}", "WARN", "Header not present")
                
                # Check caching headers
                cache_headers = ['cache-control', 'expires', 'etag', 'last-modified']
                cache_found = False
                
                for header in cache_headers:
                    if header in response.headers:
                        log_test(f"{description} caching", "PASS", f"{header}: {response.headers[header]}")
                        cache_found = True
                        break
                
                if not cache_found:
                    log_test(f"{description} caching", "WARN", "No caching headers found")
                    
            else:
                log_test(f"{description} headers", "FAIL", f"HTTP {response.status_code}")
                all_passed = False
                
        except requests.exceptions.RequestException as e:
            log_test(f"{description} headers request", "FAIL", f"Request error: {e}")
            all_passed = False
    
    return all_passed

def main():
    """
    Main test execution function
    """
    print("🚀 FASE 6 — Sprint 3: PWA-SEO-LEGAL-RC - PHASE 1 PWA HARDENING BACKEND TESTING")
    print("=" * 80)
    print(f"Testing PWA hardening implementation at: {BASE_URL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    # Track test results
    test_results = {}
    
    # Execute all tests
    test_results['debug_endpoint'] = test_debug_endpoint_pwa_status()
    test_results['service_worker'] = test_service_worker_delivery()
    test_results['offline_page'] = test_offline_page_accessibility()
    test_results['pwa_manifest'] = test_pwa_manifest()
    test_results['headers_caching'] = test_pwa_headers_and_caching()
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 TEST SUMMARY")
    print("=" * 80)
    
    passed_tests = sum(1 for result in test_results.values() if result)
    total_tests = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name.replace('_', ' ').title()}")
    
    print(f"\nOverall Result: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL PWA HARDENING BACKEND TESTS PASSED!")
        return 0
    else:
        print("⚠️  Some PWA hardening tests failed or had warnings")
        return 1

if __name__ == "__main__":
    sys.exit(main())