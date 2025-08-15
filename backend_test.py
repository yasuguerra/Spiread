#!/usr/bin/env python3
"""
FINAL RELEASE CANDIDATE TESTING for Spiread v1.0.0-rc.1
FASE 6 — Sprint 3: PWA-SEO-LEGAL-RC - FINAL RELEASE CANDIDATE VALIDATION

This script conducts the FINAL comprehensive backend testing for Release Candidate v1.0.0-rc.1:

**CRITICAL RELEASE CANDIDATE VALIDATION:**
1. Go/No-Go Checklist Verification via GET /debug
2. Production Readiness Assessment for all critical endpoints
3. Release Tag Verification
4. Final Security & Performance Check

**SUCCESS CRITERIA:**
- ✅ Go/No-Go status shows "READY_FOR_RC" with 0 blockers
- ✅ All critical endpoints return HTTP 200 with valid content
- ✅ PWA functionality fully operational
- ✅ SEO and legal pages accessible
- ✅ Security headers and rate limiting active
- ✅ Release artifacts (tag, notes) properly created
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BASE_URL = "https://read-faster-2.preview.emergentagent.com"
API_BASE_URL = f"{BASE_URL}/api"

# Test configuration
TIMEOUT = 30
HEADERS = {
    'User-Agent': 'Spiread-Backend-Test/1.0.0-rc.1',
    'Accept': 'application/json, text/html, application/xml, text/plain, */*'
}

class BackendTester:
    def __init__(self):
        self.results = {
            'phase1_pwa': {},
            'phase2_seo_legal': {},
            'phase3_accessibility': {},
            'summary': {'passed': 0, 'failed': 0, 'total': 0}
        }
        
    def log(self, message, level="INFO"):
        """Log test messages with timestamp"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def test_endpoint(self, url, expected_status=200, expected_content_type=None, description=""):
        """Generic endpoint testing with comprehensive validation"""
        try:
            self.log(f"Testing {description}: {url}")
            response = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
            
            result = {
                'url': url,
                'status_code': response.status_code,
                'content_type': response.headers.get('content-type', ''),
                'content_length': len(response.content),
                'response_time': response.elapsed.total_seconds(),
                'success': response.status_code == expected_status
            }
            
            if expected_content_type and expected_content_type not in result['content_type']:
                result['success'] = False
                result['error'] = f"Expected content-type {expected_content_type}, got {result['content_type']}"
            
            if result['success']:
                self.log(f"✅ {description} - Status: {result['status_code']}, Size: {result['content_length']} bytes, Time: {result['response_time']:.2f}s")
            else:
                error_msg = result.get('error', f"Status {result['status_code']} != {expected_status}")
                self.log(f"❌ {description} - {error_msg}", "ERROR")
                
            return result, response
            
        except requests.exceptions.RequestException as e:
            self.log(f"❌ {description} - Network error: {str(e)}", "ERROR")
            return {'success': False, 'error': str(e), 'url': url}, None
    
    def test_go_no_go_checklist(self):
        """CRITICAL RELEASE CANDIDATE GO/NO-GO CHECKLIST VERIFICATION"""
        self.log("=" * 80)
        self.log("🚀 CRITICAL RELEASE CANDIDATE GO/NO-GO CHECKLIST VERIFICATION")
        self.log("=" * 80)
        
        # Test Go/No-Go Checklist via Debug Endpoint
        self.log("\n🔍 Testing Go/No-Go Checklist via GET /debug")
        result, response = self.test_endpoint(
            f"{BASE_URL}/debug",
            expected_status=200,
            expected_content_type="application/json",
            description="Go/No-Go Checklist"
        )
        
        if result['success'] and response:
            try:
                data = response.json()
                
                # Verify Go/No-Go object structure
                go_no_go = data.get('goNoGo', {})
                
                go_no_go_checks = {
                    'version_rc': go_no_go.get('version') == '1.0.0-rc.1',
                    'overall_status_ready': go_no_go.get('overall_status') == 'READY_FOR_RC',
                    'security_ok': go_no_go.get('security', {}).get('status') == 'OK',
                    'observability_ok': go_no_go.get('observability', {}).get('status') == 'OK',
                    'analytics_ok': go_no_go.get('analytics', {}).get('status') == 'OK',
                    'pwa_ok': go_no_go.get('pwa', {}).get('status') == 'OK',
                    'seo_legal_ok': go_no_go.get('seo_legal', {}).get('status') == 'OK',
                    'release_blockers_empty': len(go_no_go.get('release_blockers', [])) == 0,
                    'recommendations_present': len(go_no_go.get('recommendations', [])) > 0
                }
                
                result['go_no_go_validation'] = go_no_go_checks
                result['go_no_go_all_valid'] = all(go_no_go_checks.values())
                result['release_blockers_count'] = len(go_no_go.get('release_blockers', []))
                result['recommendations_count'] = len(go_no_go.get('recommendations', []))
                
                if result['go_no_go_all_valid']:
                    self.log("✅ GO/NO-GO CHECKLIST: READY FOR RELEASE CANDIDATE!")
                    self.log(f"   - Version: {go_no_go.get('version')}")
                    self.log(f"   - Overall Status: {go_no_go.get('overall_status')}")
                    self.log(f"   - Release Blockers: {result['release_blockers_count']}")
                    self.log(f"   - Recommendations: {result['recommendations_count']}")
                    self.log("   - All component checks: OK")
                else:
                    self.log("❌ GO/NO-GO CHECKLIST: NOT READY FOR RELEASE!")
                    for check, passed in go_no_go_checks.items():
                        status = "✅" if passed else "❌"
                        self.log(f"   {status} {check}")
                    
                    # Show blockers if any
                    blockers = go_no_go.get('release_blockers', [])
                    if blockers:
                        self.log(f"   🚨 RELEASE BLOCKERS ({len(blockers)}):")
                        for blocker in blockers:
                            self.log(f"      - {blocker}")
                        
            except json.JSONDecodeError:
                result['success'] = False
                result['error'] = "Invalid JSON response from debug endpoint"
                self.log("❌ Debug endpoint returned invalid JSON", "ERROR")
        
        self.results['go_no_go_checklist'] = result
        return result

    def test_phase1_pwa_hardening(self):
        """PHASE 1 - PWA HARDENING VERIFICATION"""
        self.log("=" * 60)
        self.log("PHASE 1 - PWA HARDENING VERIFICATION")
        self.log("=" * 60)
        
        # Test 1: Debug Endpoint PWA Status Block
        self.log("\n1. Testing Debug Endpoint PWA Status Block")
        result, response = self.test_endpoint(
            f"{BASE_URL}/debug",
            expected_status=200,
            expected_content_type="application/json",
            description="Debug Endpoint"
        )
        
        if result['success'] and response:
            try:
                data = response.json()
                
                # Verify PWA status block structure
                pwa_checks = {
                    'swVersion': data.get('pwa', {}).get('swVersion') == 'spiread-v1',
                    'installed': 'installed' in data.get('pwa', {}),
                    'caches_structure': all(key in data.get('pwa', {}).get('caches', {}) for key in ['shell', 'assets', 'data']),
                    'bgSync_structure': 'queueLengths' in data.get('pwa', {}).get('bgSync', {}),
                    'cache_versions': all(
                        version in str(data.get('pwa', {}).get('cacheVersions', {}))
                        for version in ['spiread-shell-v1', 'spiread-assets-v1', 'spiread-data-v1']
                    ),
                    'features_list': len(data.get('pwa', {}).get('features', [])) >= 6
                }
                
                result['pwa_validation'] = pwa_checks
                result['pwa_all_valid'] = all(pwa_checks.values())
                
                if result['pwa_all_valid']:
                    self.log("✅ PWA status block structure is PERFECT")
                    self.log(f"   - SW Version: {data.get('pwa', {}).get('swVersion')}")
                    self.log(f"   - Cache Versions: {data.get('pwa', {}).get('cacheVersions')}")
                    self.log(f"   - Features Count: {len(data.get('pwa', {}).get('features', []))}")
                else:
                    self.log("❌ PWA status block validation failed:")
                    for check, passed in pwa_checks.items():
                        status = "✅" if passed else "❌"
                        self.log(f"   {status} {check}")
                        
            except json.JSONDecodeError:
                result['success'] = False
                result['error'] = "Invalid JSON response"
                self.log("❌ Debug endpoint returned invalid JSON", "ERROR")
        
        self.results['phase1_pwa']['debug_endpoint'] = result
        
        # Test 2: Service Worker Delivery
        self.log("\n2. Testing Service Worker Delivery")
        result, response = self.test_endpoint(
            f"{BASE_URL}/sw.js",
            expected_status=200,
            expected_content_type="application/javascript",
            description="Service Worker"
        )
        
        if result['success'] and response:
            sw_content = response.text
            
            # Verify Service Worker content
            sw_checks = {
                'spiread_v1_version': 'spiread-v1' in sw_content,
                'cache_names': all(cache in sw_content for cache in ['spiread-shell-v1', 'spiread-assets-v1', 'spiread-data-v1']),
                'background_sync': 'addEventListener(\'sync\'' in sw_content,
                'offline_queue': 'offlineQueue' in sw_content and 'game_runs' in sw_content and 'session_schedules' in sw_content,
                'exponential_backoff': 'retryWithBackoff' in sw_content or 'exponential' in sw_content.lower(),
                'cache_management': all(method in sw_content for method in ['caches.open', 'cache.put', 'cache.match'])
            }
            
            result['sw_validation'] = sw_checks
            result['sw_all_valid'] = all(sw_checks.values())
            result['sw_size'] = len(sw_content)
            
            if result['sw_all_valid']:
                self.log(f"✅ Service Worker is production-ready ({result['sw_size']} characters)")
                self.log("   - All versioned cache names found")
                self.log("   - Background sync functionality confirmed")
                self.log("   - Exponential backoff logic implemented")
            else:
                self.log("❌ Service Worker validation failed:")
                for check, passed in sw_checks.items():
                    status = "✅" if passed else "❌"
                    self.log(f"   {status} {check}")
        
        self.results['phase1_pwa']['service_worker'] = result
        
        # Test 3: PWA Manifest
        self.log("\n3. Testing PWA Manifest")
        result, response = self.test_endpoint(
            f"{BASE_URL}/manifest.json",
            expected_status=200,
            expected_content_type="application/json",
            description="PWA Manifest"
        )
        
        if result['success'] and response:
            try:
                manifest = response.json()
                
                # Verify manifest structure
                manifest_checks = {
                    'name': manifest.get('name') == 'Spiread - Acelera tu lectura, mejora tu comprensión',
                    'short_name': manifest.get('short_name') == 'Spiread',
                    'start_url': manifest.get('start_url') == '/',
                    'display': manifest.get('display') == 'standalone',
                    'theme_color': 'theme_color' in manifest,
                    'background_color': 'background_color' in manifest,
                    'icons': len(manifest.get('icons', [])) >= 8,
                    'shortcuts': len(manifest.get('shortcuts', [])) >= 3,
                    'features': len(manifest.get('features', [])) >= 5,
                    'categories': len(manifest.get('categories', [])) >= 3
                }
                
                result['manifest_validation'] = manifest_checks
                result['manifest_all_valid'] = all(manifest_checks.values())
                result['icons_count'] = len(manifest.get('icons', []))
                
                if result['manifest_all_valid']:
                    self.log(f"✅ PWA Manifest is complete ({result['icons_count']} icons)")
                    self.log(f"   - Name: {manifest.get('name')}")
                    self.log(f"   - Display: {manifest.get('display')}")
                    self.log(f"   - Shortcuts: {len(manifest.get('shortcuts', []))}")
                else:
                    self.log("❌ PWA Manifest validation failed:")
                    for check, passed in manifest_checks.items():
                        status = "✅" if passed else "❌"
                        self.log(f"   {status} {check}")
                        
            except json.JSONDecodeError:
                result['success'] = False
                result['error'] = "Invalid JSON manifest"
                self.log("❌ Manifest returned invalid JSON", "ERROR")
        
        self.results['phase1_pwa']['manifest'] = result
        
        # Test 4: Offline Page
        self.log("\n4. Testing Offline Page")
        result, response = self.test_endpoint(
            f"{BASE_URL}/offline",
            expected_status=200,
            expected_content_type="text/html",
            description="Offline Page"
        )
        
        if result['success'] and response:
            html_content = response.text
            
            # Check for offline UX elements
            offline_checks = {
                'reintentar_button': 'Reintentar' in html_content,
                'sin_conexion_status': 'Sin Conexión' in html_content or 'sin conexión' in html_content.lower(),
                'funciones_disponibles': 'Funciones Disponibles' in html_content or 'funciones disponibles' in html_content.lower(),
                'offline_features': 'juegos' in html_content.lower() and 'offline' in html_content.lower(),
                'interactive_elements': 'button' in html_content.lower(),
                'proper_title': 'offline' in html_content.lower() or 'conexión' in html_content.lower()
            }
            
            result['offline_validation'] = offline_checks
            result['offline_all_valid'] = all(offline_checks.values())
            result['html_size'] = len(html_content)
            
            if result['offline_all_valid']:
                self.log(f"✅ Offline page UX is excellent ({result['html_size']} characters)")
                self.log("   - All UX elements verified")
                self.log("   - Interactive elements present")
                self.log("   - Offline features clearly presented")
            else:
                self.log("❌ Offline page validation failed:")
                for check, passed in offline_checks.items():
                    status = "✅" if passed else "❌"
                    self.log(f"   {status} {check}")
        
    def test_critical_production_endpoints(self):
        """PRODUCTION READINESS ASSESSMENT - All Critical Endpoints"""
        self.log("\n" + "=" * 80)
        self.log("🏭 PRODUCTION READINESS ASSESSMENT - CRITICAL ENDPOINTS")
        self.log("=" * 80)
        
        # Define all critical endpoints for production
        critical_endpoints = [
            ('/debug', 'application/json', 'System Status & Go/No-Go'),
            ('/sw.js', 'application/javascript', 'Service Worker (spiread-v1)'),
            ('/manifest.json', 'application/json', 'PWA Manifest'),
            ('/robots.txt', 'text/plain', 'SEO Robots File'),
            ('/sitemap.xml', 'application/xml', 'SEO Sitemap'),
            ('/', 'text/html', 'Main Page (OG/Meta Tags)'),
            ('/legal/privacy', 'text/html', 'Privacy Policy'),
            ('/legal/terms', 'text/html', 'Terms of Service'),
            ('/offline', 'text/html', 'Offline Experience')
        ]
        
        production_results = {}
        all_endpoints_working = True
        
        for endpoint, expected_content_type, description in critical_endpoints:
            self.log(f"\n🔍 Testing Critical Endpoint: {description}")
            result, response = self.test_endpoint(
                f"{BASE_URL}{endpoint}",
                expected_status=200,
                expected_content_type=expected_content_type,
                description=description
            )
            
            # Additional validation for specific endpoints
            if result['success'] and response:
                if endpoint == '/sw.js':
                    # Verify Service Worker contains spiread-v1
                    if 'spiread-v1' not in response.text:
                        result['success'] = False
                        result['error'] = 'Service Worker missing spiread-v1 version'
                        self.log("❌ Service Worker missing spiread-v1 version", "ERROR")
                    else:
                        self.log("✅ Service Worker contains spiread-v1 version")
                
                elif endpoint == '/debug':
                    # Verify debug endpoint has proper structure
                    try:
                        data = response.json()
                        if 'goNoGo' not in data:
                            result['success'] = False
                            result['error'] = 'Debug endpoint missing goNoGo object'
                            self.log("❌ Debug endpoint missing goNoGo object", "ERROR")
                        else:
                            self.log("✅ Debug endpoint has proper goNoGo structure")
                    except:
                        result['success'] = False
                        result['error'] = 'Debug endpoint invalid JSON'
                        self.log("❌ Debug endpoint returned invalid JSON", "ERROR")
                
                elif endpoint == '/manifest.json':
                    # Verify PWA manifest has required fields
                    try:
                        manifest = response.json()
                        required_fields = ['name', 'short_name', 'start_url', 'display', 'icons']
                        missing_fields = [field for field in required_fields if field not in manifest]
                        if missing_fields:
                            result['success'] = False
                            result['error'] = f'Manifest missing fields: {missing_fields}'
                            self.log(f"❌ Manifest missing fields: {missing_fields}", "ERROR")
                        else:
                            self.log("✅ PWA Manifest has all required fields")
                    except:
                        result['success'] = False
                        result['error'] = 'Manifest invalid JSON'
                        self.log("❌ Manifest returned invalid JSON", "ERROR")
            
            production_results[endpoint] = result
            if not result['success']:
                all_endpoints_working = False
        
        # Summary of critical endpoints
        working_count = sum(1 for r in production_results.values() if r['success'])
        total_count = len(production_results)
        
        self.log(f"\n📊 CRITICAL ENDPOINTS SUMMARY: {working_count}/{total_count} working")
        
        for endpoint, result in production_results.items():
            status = "✅" if result['success'] else "❌"
            self.log(f"  {status} {endpoint}")
        
        self.results['critical_production_endpoints'] = {
            'endpoints': production_results,
            'all_working': all_endpoints_working,
            'working_count': working_count,
            'total_count': total_count,
            'success_rate': (working_count / total_count * 100) if total_count > 0 else 0
        }
        
    def test_release_artifacts_and_security(self):
        """RELEASE TAG VERIFICATION & SECURITY CHECK"""
        self.log("\n" + "=" * 80)
        self.log("🏷️  RELEASE TAG VERIFICATION & SECURITY CHECK")
        self.log("=" * 80)
        
        # Test 1: Check for RELEASE_NOTES.md accessibility
        self.log("\n📋 Testing Release Notes Accessibility")
        result, response = self.test_endpoint(
            f"{BASE_URL}/RELEASE_NOTES.md",
            expected_status=200,
            expected_content_type="text/plain",
            description="Release Notes"
        )
        
        release_notes_working = result['success']
        if release_notes_working and response:
            content = response.text
            if 'v1.0.0-rc.1' in content:
                self.log("✅ Release notes contain v1.0.0-rc.1 tag")
            else:
                self.log("⚠️  Release notes accessible but missing v1.0.0-rc.1 tag")
        
        # Test 2: Security Headers Check
        self.log("\n🔒 Testing Security Headers")
        result, response = self.test_endpoint(
            f"{BASE_URL}/",
            expected_status=200,
            description="Security Headers Check"
        )
        
        security_headers = {}
        if result['success'] and response:
            headers = response.headers
            
            # Check for important security headers
            security_checks = {
                'content_security_policy': 'content-security-policy' in headers or 'csp' in str(headers).lower(),
                'x_frame_options': 'x-frame-options' in headers,
                'x_content_type_options': 'x-content-type-options' in headers,
                'referrer_policy': 'referrer-policy' in headers,
                'permissions_policy': 'permissions-policy' in headers or 'feature-policy' in headers
            }
            
            security_headers = {
                'checks': security_checks,
                'headers_present': sum(security_checks.values()),
                'total_checks': len(security_checks),
                'all_present': all(security_checks.values())
            }
            
            self.log(f"🔍 Security Headers Found: {security_headers['headers_present']}/{security_headers['total_checks']}")
            for header, present in security_checks.items():
                status = "✅" if present else "⚠️ "
                self.log(f"  {status} {header.replace('_', '-').upper()}")
        
        # Test 3: Rate Limiting Check (if implemented)
        self.log("\n⚡ Testing Rate Limiting")
        rate_limit_working = False
        try:
            # Make multiple rapid requests to test rate limiting
            rapid_requests = []
            for i in range(5):
                result, response = self.test_endpoint(
                    f"{BASE_URL}/debug",
                    expected_status=200,
                    description=f"Rate Limit Test {i+1}"
                )
                if response:
                    rapid_requests.append({
                        'status': response.status_code,
                        'headers': dict(response.headers)
                    })
            
            # Check if any rate limiting headers are present
            rate_limit_headers = ['x-ratelimit-limit', 'x-ratelimit-remaining', 'retry-after']
            rate_limit_found = any(
                any(header in req['headers'] for header in rate_limit_headers)
                for req in rapid_requests
            )
            
            if rate_limit_found:
                self.log("✅ Rate limiting headers detected")
                rate_limit_working = True
            else:
                self.log("⚠️  No rate limiting headers detected (may not be implemented)")
                
        except Exception as e:
            self.log(f"⚠️  Rate limiting test failed: {str(e)}")
        
        self.results['release_and_security'] = {
            'release_notes': release_notes_working,
            'security_headers': security_headers,
            'rate_limiting': rate_limit_working
        }
        
        return {
            'release_notes': release_notes_working,
            'security_headers': security_headers.get('all_present', False),
            'rate_limiting': rate_limit_working
        }
    
    def test_phase2_seo_legal(self):
        """PHASE 2 - SEO & LEGAL VERIFICATION"""
        self.log("\n" + "=" * 60)
        self.log("PHASE 2 - SEO & LEGAL VERIFICATION")
        self.log("=" * 60)
        
        # Test 1: robots.txt
        self.log("\n1. Testing robots.txt")
        result, response = self.test_endpoint(
            f"{BASE_URL}/robots.txt",
            expected_status=200,
            expected_content_type="text/plain",
            description="robots.txt"
        )
        
        if result['success'] and response:
            robots_content = response.text
            
            # Verify robots.txt content
            robots_checks = {
                'user_agent': 'User-agent:' in robots_content,
                'allow_rules': 'Allow:' in robots_content,
                'disallow_rules': 'Disallow:' in robots_content,
                'sitemap_reference': 'Sitemap:' in robots_content,
                'proper_structure': robots_content.count('User-agent:') >= 1
            }
            
            result['robots_validation'] = robots_checks
            result['robots_all_valid'] = all(robots_checks.values())
            
            if result['robots_all_valid']:
                self.log("✅ robots.txt is properly formatted")
                self.log(f"   - Content length: {len(robots_content)} characters")
                self.log("   - Contains proper allow/disallow rules")
                self.log("   - Sitemap reference included")
            else:
                self.log("❌ robots.txt validation failed:")
                for check, passed in robots_checks.items():
                    status = "✅" if passed else "❌"
                    self.log(f"   {status} {check}")
        
        self.results['phase2_seo_legal']['robots_txt'] = result
        
        # Test 2: sitemap.xml
        self.log("\n2. Testing sitemap.xml")
        result, response = self.test_endpoint(
            f"{BASE_URL}/sitemap.xml",
            expected_status=200,
            expected_content_type="application/xml",
            description="sitemap.xml"
        )
        
        if result['success'] and response:
            sitemap_content = response.text
            
            # Basic XML validation
            sitemap_checks = {
                'valid_xml_start': '<?xml' in sitemap_content,
                'has_urls': '<url>' in sitemap_content,
                'has_home_page': BASE_URL in sitemap_content,
                'has_legal_pages': 'legal' in sitemap_content,
                'proper_namespace': 'sitemaps.org' in sitemap_content
            }
            
            result['sitemap_validation'] = sitemap_checks
            result['sitemap_all_valid'] = all(sitemap_checks.values())
            result['content_size'] = len(sitemap_content)
            
            if result['sitemap_all_valid']:
                self.log(f"✅ sitemap.xml is properly formatted ({result['content_size']} characters)")
                self.log("   - Valid XML structure")
                self.log("   - Contains home and legal pages")
                self.log("   - Proper sitemap namespace")
            else:
                self.log("❌ sitemap.xml validation failed:")
                for check, passed in sitemap_checks.items():
                    status = "✅" if passed else "❌"
                    self.log(f"   {status} {check}")
        
        self.results['phase2_seo_legal']['sitemap_xml'] = result
        
        # Test 3: Meta Tags on Main Page
        self.log("\n3. Testing Meta Tags on Main Page")
        result, response = self.test_endpoint(
            f"{BASE_URL}/",
            expected_status=200,
            expected_content_type="text/html",
            description="Main Page Meta Tags"
        )
        
        if result['success'] and response:
            html_content = response.text
            
            # Check for essential meta tags
            meta_checks = {
                'title': '<title>' in html_content and 'Spiread' in html_content,
                'description': 'name="description"' in html_content,
                'og_title': 'property="og:title"' in html_content,
                'og_description': 'property="og:description"' in html_content,
                'og_image': 'property="og:image"' in html_content,
                'og_type': 'property="og:type"' in html_content,
                'twitter_card': 'name="twitter:card"' in html_content,
                'viewport': 'name="viewport"' in html_content
            }
            
            result['meta_validation'] = meta_checks
            result['meta_all_valid'] = all(meta_checks.values())
            
            if result['meta_all_valid']:
                self.log("✅ Meta tags are properly configured")
                self.log("   - All required OG and Twitter tags present")
                self.log("   - Title and description included")
                self.log("   - Viewport meta tag found")
            else:
                self.log("❌ Meta tags validation failed:")
                for check, passed in meta_checks.items():
                    status = "✅" if passed else "❌"
                    self.log(f"   {status} {check}")
        
        self.results['phase2_seo_legal']['meta_tags'] = result
        
        # Test 4: Legal Pages
        legal_pages = [
            ('/legal/privacy', 'Privacy Policy'),
            ('/legal/terms', 'Terms of Service')
        ]
        
        for page_url, page_name in legal_pages:
            self.log(f"\n4. Testing {page_name}")
            result, response = self.test_endpoint(
                f"{BASE_URL}{page_url}",
                expected_status=200,
                expected_content_type="text/html",
                description=page_name
            )
            
            if result['success'] and response:
                html_content = response.text
                
                # Check for legal page content
                legal_checks = {
                    'has_content': len(html_content) > 5000,  # Substantial content
                    'has_title': page_name.lower().replace(' ', '') in html_content.lower().replace(' ', ''),
                    'has_contact_info': 'email' in html_content.lower() or 'contacto' in html_content.lower(),
                    'has_date': 'actualizado' in html_content.lower() or 'updated' in html_content.lower(),
                    'proper_structure': '<h' in html_content and '<p' in html_content
                }
                
                result['legal_validation'] = legal_checks
                result['legal_all_valid'] = all(legal_checks.values())
                result['content_size'] = len(html_content)
                
                if result['legal_all_valid']:
                    self.log(f"✅ {page_name} is properly accessible ({result['content_size']} characters)")
                    self.log("   - Substantial content present")
                    self.log("   - Contact information included")
                    self.log("   - Proper page structure")
                else:
                    self.log(f"❌ {page_name} validation failed:")
                    for check, passed in legal_checks.items():
                        status = "✅" if passed else "❌"
                        self.log(f"   {status} {check}")
            
            # Store result with sanitized key
            key = page_url.replace('/', '_').replace('-', '_')
            self.results['phase2_seo_legal'][key] = result
    
    def test_phase3_accessibility_errors(self):
        """PHASE 3 - ACCESSIBILITY & ERROR PAGES"""
        self.log("\n" + "=" * 60)
        self.log("PHASE 3 - ACCESSIBILITY & ERROR PAGES")
        self.log("=" * 60)
        
        # Test 1: 404 Error Handling
        self.log("\n1. Testing 404 Error Handling")
        result, response = self.test_endpoint(
            f"{BASE_URL}/nonexistent-page-test-404",
            expected_status=404,
            expected_content_type="text/html",
            description="404 Error Page"
        )
        
        if result['success'] and response:
            html_content = response.text
            
            # Check for 404 page content
            error_checks = {
                'has_404_content': '404' in html_content,
                'has_error_message': 'no encontrada' in html_content.lower() or 'not found' in html_content.lower(),
                'has_navigation': 'inicio' in html_content.lower() or 'home' in html_content.lower(),
                'has_helpful_links': 'juegos' in html_content.lower() or 'games' in html_content.lower(),
                'proper_structure': '<h' in html_content and '<p' in html_content,
                'has_styling': 'class=' in html_content or 'style=' in html_content
            }
            
            result['error_validation'] = error_checks
            result['error_all_valid'] = all(error_checks.values())
            result['content_size'] = len(html_content)
            
            if result['error_all_valid']:
                self.log(f"✅ 404 Error page is properly structured ({result['content_size']} characters)")
                self.log("   - Clear error message")
                self.log("   - Navigation options provided")
                self.log("   - Helpful links included")
            else:
                self.log("❌ 404 Error page validation failed:")
                for check, passed in error_checks.items():
                    status = "✅" if passed else "❌"
                    self.log(f"   {status} {check}")
        
        self.results['phase3_accessibility']['error_404'] = result
        
        # Test 2: Content Accessibility Check
        self.log("\n2. Testing Content Accessibility")
        result, response = self.test_endpoint(
            f"{BASE_URL}/",
            expected_status=200,
            expected_content_type="text/html",
            description="Main Page Accessibility"
        )
        
        if result['success'] and response:
            html_content = response.text
            
            # Basic accessibility checks
            a11y_checks = {
                'has_lang_attr': 'lang=' in html_content,
                'has_title': '<title>' in html_content,
                'has_headings': '<h1' in html_content or '<h2' in html_content,
                'has_proper_html': '<html' in html_content and '<head' in html_content and '<body' in html_content,
                'has_meta_viewport': 'name="viewport"' in html_content,
                'has_semantic_structure': '<main' in html_content or '<section' in html_content or '<article' in html_content
            }
            
            result['a11y_validation'] = a11y_checks
            result['a11y_all_valid'] = all(a11y_checks.values())
            result['content_size'] = len(html_content)
            
            if result['a11y_all_valid']:
                self.log("✅ Content accessibility is properly implemented")
                self.log(f"   - Content size: {result['content_size']} characters")
                self.log("   - All accessibility checks passed")
                self.log("   - Proper HTML structure and semantics")
            else:
                self.log("❌ Content accessibility validation failed:")
                for check, passed in a11y_checks.items():
                    status = "✅" if passed else "❌"
                    self.log(f"   {status} {check}")
        
        self.results['phase3_accessibility']['content_accessibility'] = result
    
    def generate_release_candidate_summary(self):
        """Generate FINAL RELEASE CANDIDATE SUMMARY"""
        self.log("\n" + "=" * 80)
        self.log("🚀 FINAL RELEASE CANDIDATE v1.0.0-rc.1 SUMMARY")
        self.log("=" * 80)
        
    def generate_release_candidate_summary(self):
        """Generate FINAL RELEASE CANDIDATE SUMMARY"""
        self.log("\n" + "=" * 80)
        self.log("🚀 FINAL RELEASE CANDIDATE v1.0.0-rc.1 SUMMARY")
        self.log("=" * 80)
        
        # Count results
        total_tests = 0
        passed_tests = 0
        
        for phase, tests in self.results.items():
            if phase == 'summary':
                continue
                
            if isinstance(tests, dict):
                for test_name, result in tests.items():
                    if isinstance(result, dict):
                        total_tests += 1
                        if result.get('success', False):
                            passed_tests += 1
        
        self.results['summary'] = {
            'total': total_tests,
            'passed': passed_tests,
            'failed': total_tests - passed_tests,
            'success_rate': (passed_tests / total_tests * 100) if total_tests > 0 else 0
        }
        
        # Print summary by phase
        self.log(f"\nOVERALL RESULTS: {passed_tests}/{total_tests} tests passed ({self.results['summary']['success_rate']:.1f}%)")
        
        # Go/No-Go Summary
        go_no_go_result = self.results.get('go_no_go_checklist', {})
        if go_no_go_result.get('go_no_go_all_valid', False):
            self.log("✅ GO/NO-GO CHECKLIST: READY FOR RELEASE")
        else:
            self.log("❌ GO/NO-GO CHECKLIST: NOT READY FOR RELEASE")
        
        # Critical Endpoints Summary
        critical_endpoints = self.results.get('critical_production_endpoints', {})
        if critical_endpoints.get('all_working', False):
            self.log("✅ CRITICAL ENDPOINTS: ALL WORKING")
        else:
            working = critical_endpoints.get('working_count', 0)
            total = critical_endpoints.get('total_count', 0)
            self.log(f"❌ CRITICAL ENDPOINTS: {working}/{total} WORKING")
        
        # Phase summaries
        for phase_name, phase_key in [
            ("PWA HARDENING", "phase1_pwa"),
            ("SEO & LEGAL", "phase2_seo_legal"),
            ("ACCESSIBILITY", "phase3_accessibility")
        ]:
            phase_results = self.results.get(phase_key, {})
            if phase_results:
                phase_passed = sum(1 for r in phase_results.values() if isinstance(r, dict) and r.get('success', False))
                phase_total = len([r for r in phase_results.values() if isinstance(r, dict)])
                self.log(f"\n{phase_name}: {phase_passed}/{phase_total} tests passed")
                
                for test_name, result in phase_results.items():
                    if isinstance(result, dict):
                        status = "✅" if result.get('success', False) else "❌"
                        self.log(f"  {status} {test_name.replace('_', ' ').title()}")
        
        # Critical Issues
        critical_issues = []
        for phase, tests in self.results.items():
            if phase == 'summary':
                continue
            if isinstance(tests, dict):
                for test_name, result in tests.items():
                    if isinstance(result, dict) and not result.get('success', False):
                        critical_issues.append(f"{phase}.{test_name}: {result.get('error', 'Failed')}")
        
        if critical_issues:
            self.log(f"\nCRITICAL ISSUES FOUND ({len(critical_issues)}):")
            for issue in critical_issues:
                self.log(f"  ❌ {issue}")
        else:
            self.log("\n🎉 NO CRITICAL ISSUES FOUND - ALL TESTS PASSED!")
        
        # Production Readiness Assessment
        if self.results['summary']['success_rate'] >= 95:
            self.log("\n🚀 PRODUCTION READINESS: EXCELLENT - Ready for v1.0.0-rc.1 release")
        elif self.results['summary']['success_rate'] >= 85:
            self.log("\n⚠️  PRODUCTION READINESS: GOOD - Minor issues need attention")
        else:
            self.log("\n🚨 PRODUCTION READINESS: NEEDS WORK - Critical issues must be resolved")
        
        return self.results

def main():
    """Main test execution for Release Candidate v1.0.0-rc.1"""
    print("🚀 Spiread v1.0.0-rc.1 FINAL RELEASE CANDIDATE TESTING")
    print("FASE 6 — Sprint 3: PWA-SEO-LEGAL-RC - FINAL RELEASE CANDIDATE VALIDATION")
    print(f"Testing against: {BASE_URL}")
    print("=" * 80)
    
    tester = BackendTester()
    
    try:
        # CRITICAL RELEASE CANDIDATE TESTS
        tester.log("🎯 Starting FINAL Release Candidate Testing...")
        
        # 1. Go/No-Go Checklist Verification
        go_no_go_result = tester.test_go_no_go_checklist()
        
        # 2. Production Readiness Assessment
        critical_endpoints_working = tester.test_critical_production_endpoints()
        
        # 3. Release Tag Verification & Security Check
        security_results = tester.test_release_artifacts_and_security()
        
        # 4. Execute comprehensive phase testing
        tester.test_phase1_pwa_hardening()
        tester.test_phase2_seo_legal()
        tester.test_phase3_accessibility_errors()
        
        # Generate final Release Candidate summary
        results = tester.generate_release_candidate_summary()
        
        # FINAL RELEASE CANDIDATE DECISION
        tester.log("\n" + "=" * 80)
        tester.log("🏁 FINAL RELEASE CANDIDATE DECISION")
        tester.log("=" * 80)
        
        # Check all success criteria
        go_no_go_ready = go_no_go_result.get('go_no_go_all_valid', False)
        all_endpoints_ok = critical_endpoints_working
        overall_success_rate = results['summary']['success_rate']
        
        success_criteria = {
            'go_no_go_ready': go_no_go_ready,
            'critical_endpoints_working': all_endpoints_ok,
            'overall_success_high': overall_success_rate >= 95
        }
        
        all_criteria_met = all(success_criteria.values())
        
        tester.log(f"📊 SUCCESS CRITERIA EVALUATION:")
        for criterion, met in success_criteria.items():
            status = "✅" if met else "❌"
            tester.log(f"  {status} {criterion.replace('_', ' ').title()}")
        
        if all_criteria_met:
            tester.log("\n🎉 RELEASE CANDIDATE v1.0.0-rc.1: APPROVED FOR PRODUCTION DEPLOYMENT!")
            tester.log("   All success criteria met. Ready for production release.")
            final_exit_code = 0
        else:
            tester.log("\n🚨 RELEASE CANDIDATE v1.0.0-rc.1: NOT READY FOR PRODUCTION")
            tester.log("   Critical issues must be resolved before deployment.")
            final_exit_code = 1
        
        # Save results to file
        results['release_candidate_decision'] = {
            'approved': all_criteria_met,
            'success_criteria': success_criteria,
            'overall_success_rate': overall_success_rate,
            'timestamp': datetime.now().isoformat()
        }
        
        with open('/app/release_candidate_test_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        tester.log(f"\n📄 Detailed results saved to: /app/release_candidate_test_results.json")
        
        sys.exit(final_exit_code)
            
    except KeyboardInterrupt:
        tester.log("\nTesting interrupted by user", "WARNING")
        sys.exit(2)
    except Exception as e:
        tester.log(f"Testing failed with error: {str(e)}", "ERROR")
        sys.exit(3)

if __name__ == "__main__":
    main()