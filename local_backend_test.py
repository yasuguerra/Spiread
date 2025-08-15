#!/usr/bin/env python3
"""
LOCAL BACKEND TESTING for Spiread v1.0.0-rc.1
FINAL GO/NO-GO VERIFICATION - LOCAL TESTING

This script conducts comprehensive backend testing on localhost:3000 to verify
all functionality is working correctly before external deployment.
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration for local testing
BASE_URL = "http://localhost:3000"
API_BASE_URL = f"{BASE_URL}/api"

# Test configuration
TIMEOUT = 10
HEADERS = {
    'User-Agent': 'Spiread-Backend-Test/1.0.0-rc.1',
    'Accept': 'application/json, text/html, application/xml, text/plain, */*'
}

class LocalBackendTester:
    def __init__(self):
        self.results = {
            'go_no_go': {},
            'critical_endpoints': {},
            'pwa_hardening': {},
            'seo_legal': {},
            'accessibility': {},
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
        """CRITICAL GO/NO-GO CHECKLIST VERIFICATION"""
        self.log("=" * 80)
        self.log("🚀 CRITICAL GO/NO-GO CHECKLIST VERIFICATION (LOCAL)")
        self.log("=" * 80)
        
        result, response = self.test_endpoint(
            f"{BASE_URL}/debug",
            expected_status=200,
            expected_content_type="application/json",
            description="Go/No-Go Checklist"
        )
        
        if result['success'] and response:
            try:
                data = response.json()
                go_no_go = data.get('goNoGo', {})
                
                go_no_go_checks = {
                    'version_rc': go_no_go.get('version') == '1.0.0-rc.1',
                    'overall_status_ready': go_no_go.get('overall_status') == 'READY_FOR_RC',
                    'security_ok': go_no_go.get('checks', {}).get('security', {}).get('status') == 'OK',
                    'observability_ok': go_no_go.get('checks', {}).get('observability', {}).get('status') == 'OK',
                    'analytics_ok': go_no_go.get('checks', {}).get('analytics', {}).get('status') == 'OK',
                    'pwa_ok': go_no_go.get('checks', {}).get('pwa', {}).get('status') == 'OK',
                    'seo_legal_ok': go_no_go.get('checks', {}).get('seo_legal', {}).get('status') == 'OK',
                    'release_blockers_empty': len(go_no_go.get('release_blockers', [])) == 0,
                }
                
                result['go_no_go_validation'] = go_no_go_checks
                result['go_no_go_all_valid'] = all(go_no_go_checks.values())
                result['release_blockers_count'] = len(go_no_go.get('release_blockers', []))
                
                if result['go_no_go_all_valid']:
                    self.log("✅ GO/NO-GO CHECKLIST: READY FOR RELEASE CANDIDATE!")
                    self.log(f"   - Version: {go_no_go.get('version')}")
                    self.log(f"   - Overall Status: {go_no_go.get('overall_status')}")
                    self.log(f"   - Release Blockers: {result['release_blockers_count']}")
                    self.log("   - All component checks: OK")
                else:
                    self.log("❌ GO/NO-GO CHECKLIST: NOT READY FOR RELEASE!")
                    for check, passed in go_no_go_checks.items():
                        status = "✅" if passed else "❌"
                        self.log(f"   {status} {check}")
                    
                    blockers = go_no_go.get('release_blockers', [])
                    if blockers:
                        self.log(f"   🚨 RELEASE BLOCKERS ({len(blockers)}):")
                        for blocker in blockers:
                            self.log(f"      - {blocker}")
                        
            except json.JSONDecodeError:
                result['success'] = False
                result['error'] = "Invalid JSON response from debug endpoint"
                self.log("❌ Debug endpoint returned invalid JSON", "ERROR")
        
        self.results['go_no_go'] = result
        return result

    def test_critical_endpoints(self):
        """Test all critical endpoints for production readiness"""
        self.log("\n" + "=" * 80)
        self.log("🏭 CRITICAL ENDPOINTS VERIFICATION (LOCAL)")
        self.log("=" * 80)
        
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
        
        endpoint_results = {}
        all_working = True
        
        for endpoint, expected_content_type, description in critical_endpoints:
            result, response = self.test_endpoint(
                f"{BASE_URL}{endpoint}",
                expected_status=200,
                expected_content_type=expected_content_type,
                description=description
            )
            
            # Additional validation for specific endpoints
            if result['success'] and response:
                if endpoint == '/sw.js':
                    if 'spiread-v1' not in response.text:
                        result['success'] = False
                        result['error'] = 'Service Worker missing spiread-v1 version'
                        self.log("❌ Service Worker missing spiread-v1 version", "ERROR")
                    else:
                        self.log("✅ Service Worker contains spiread-v1 version")
                
                elif endpoint == '/debug':
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
            
            endpoint_results[endpoint] = result
            if not result['success']:
                all_working = False
        
        working_count = sum(1 for r in endpoint_results.values() if r['success'])
        total_count = len(endpoint_results)
        
        self.log(f"\n📊 CRITICAL ENDPOINTS SUMMARY: {working_count}/{total_count} working")
        
        for endpoint, result in endpoint_results.items():
            status = "✅" if result['success'] else "❌"
            self.log(f"  {status} {endpoint}")
        
        self.results['critical_endpoints'] = {
            'endpoints': endpoint_results,
            'all_working': all_working,
            'working_count': working_count,
            'total_count': total_count,
            'success_rate': (working_count / total_count * 100) if total_count > 0 else 0
        }
        
        return all_working

    def test_pwa_hardening_details(self):
        """Detailed PWA hardening verification"""
        self.log("\n" + "=" * 80)
        self.log("🔧 PWA HARDENING DETAILED VERIFICATION")
        self.log("=" * 80)
        
        # Test Service Worker content
        result, response = self.test_endpoint(
            f"{BASE_URL}/sw.js",
            expected_status=200,
            description="Service Worker Content Analysis"
        )
        
        if result['success'] and response:
            sw_content = response.text
            
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
        
        self.results['pwa_hardening']['service_worker'] = result
        
        # Test PWA Manifest details
        result, response = self.test_endpoint(
            f"{BASE_URL}/manifest.json",
            expected_status=200,
            description="PWA Manifest Analysis"
        )
        
        if result['success'] and response:
            try:
                manifest = response.json()
                
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
        
        self.results['pwa_hardening']['manifest'] = result

    def generate_final_summary(self):
        """Generate final summary and decision"""
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
                    if isinstance(result, dict) and 'success' in result:
                        total_tests += 1
                        if result.get('success', False):
                            passed_tests += 1
        
        self.results['summary'] = {
            'total': total_tests,
            'passed': passed_tests,
            'failed': total_tests - passed_tests,
            'success_rate': (passed_tests / total_tests * 100) if total_tests > 0 else 0
        }
        
        self.log(f"\nOVERALL RESULTS: {passed_tests}/{total_tests} tests passed ({self.results['summary']['success_rate']:.1f}%)")
        
        # Go/No-Go Summary
        go_no_go_result = self.results.get('go_no_go', {})
        if go_no_go_result.get('go_no_go_all_valid', False):
            self.log("✅ GO/NO-GO CHECKLIST: READY FOR RELEASE")
        else:
            self.log("❌ GO/NO-GO CHECKLIST: NOT READY FOR RELEASE")
        
        # Critical Endpoints Summary
        critical_endpoints = self.results.get('critical_endpoints', {})
        if critical_endpoints.get('all_working', False):
            self.log("✅ CRITICAL ENDPOINTS: ALL WORKING")
        else:
            working = critical_endpoints.get('working_count', 0)
            total = critical_endpoints.get('total_count', 0)
            self.log(f"❌ CRITICAL ENDPOINTS: {working}/{total} WORKING")
        
        # Final decision
        go_no_go_ready = go_no_go_result.get('go_no_go_all_valid', False)
        all_endpoints_ok = critical_endpoints.get('all_working', False)
        overall_success_rate = self.results['summary']['success_rate']
        
        success_criteria = {
            'go_no_go_ready': go_no_go_ready,
            'critical_endpoints_working': all_endpoints_ok,
            'overall_success_high': overall_success_rate >= 90
        }
        
        all_criteria_met = all(success_criteria.values())
        
        self.log(f"\n📊 SUCCESS CRITERIA EVALUATION:")
        for criterion, met in success_criteria.items():
            status = "✅" if met else "❌"
            self.log(f"  {status} {criterion.replace('_', ' ').title()}")
        
        if all_criteria_met:
            self.log("\n🎉 LOCAL TESTING: RELEASE CANDIDATE v1.0.0-rc.1 APPROVED!")
            self.log("   All local functionality working correctly.")
            final_decision = "APPROVED_LOCAL"
        else:
            self.log("\n🚨 LOCAL TESTING: RELEASE CANDIDATE v1.0.0-rc.1 HAS ISSUES")
            self.log("   Critical issues found in local testing.")
            final_decision = "ISSUES_FOUND"
        
        return {
            'decision': final_decision,
            'success_criteria': success_criteria,
            'overall_success_rate': overall_success_rate,
            'results': self.results
        }

def main():
    """Main test execution for local Release Candidate testing"""
    print("🚀 Spiread v1.0.0-rc.1 LOCAL RELEASE CANDIDATE TESTING")
    print("FINAL GO/NO-GO VERIFICATION - LOCAL TESTING")
    print(f"Testing against: {BASE_URL}")
    print("=" * 80)
    
    tester = LocalBackendTester()
    
    try:
        # Execute comprehensive local testing
        tester.log("🎯 Starting LOCAL Release Candidate Testing...")
        
        # 1. Go/No-Go Checklist Verification
        go_no_go_result = tester.test_go_no_go_checklist()
        
        # 2. Critical Endpoints Verification
        critical_endpoints_working = tester.test_critical_endpoints()
        
        # 3. PWA Hardening Details
        tester.test_pwa_hardening_details()
        
        # Generate final summary and decision
        final_results = tester.generate_final_summary()
        
        # Save results
        with open('/app/local_test_results.json', 'w') as f:
            json.dump(final_results, f, indent=2)
        
        tester.log(f"\n📄 Detailed results saved to: /app/local_test_results.json")
        
        # Exit with appropriate code
        if final_results['decision'] == 'APPROVED_LOCAL':
            sys.exit(0)
        else:
            sys.exit(1)
            
    except KeyboardInterrupt:
        tester.log("\nTesting interrupted by user", "WARNING")
        sys.exit(2)
    except Exception as e:
        tester.log(f"Testing failed with error: {str(e)}", "ERROR")
        sys.exit(3)

if __name__ == "__main__":
    main()