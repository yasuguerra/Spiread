#!/usr/bin/env node

/**
 * Production Validation Script for Spiread v1.0.0 GA
 * 
 * This script validates the production deployment at app.spiread.com
 * and ensures all systems are operational for General Availability.
 */

const https = require('https');
const http = require('http');

const PROD_URL = 'https://app.spiread.com';
const TIMEOUT = 30000;

class ProductionValidator {
  constructor() {
    this.results = {
      preflight: {},
      endpoints: {},
      pwa: {},
      security: {},
      observability: {},
      analytics: {},
      overall: 'PENDING'
    };
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const emoji = {
      'INFO': '📝',
      'SUCCESS': '✅',
      'ERROR': '❌',
      'WARNING': '⚠️'
    }[level] || '📝';
    
    console.log(`[${timestamp}] ${emoji} ${message}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        timeout: TIMEOUT,
        headers: {
          'User-Agent': 'Spiread-Production-Validator/1.0.0',
          'Accept': 'application/json, text/html, application/xml, text/plain, */*',
          ...options.headers
        }
      };

      const protocol = url.startsWith('https:') ? https : http;
      
      const req = protocol.get(url, requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            contentLength: data.length
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', (err) => {
        reject(err);
      });
    });
  }

  async validatePreflight() {
    this.log('🚀 Starting Production Preflight Checks', 'INFO');
    
    try {
      // Check if domain resolves and is accessible
      const response = await this.makeRequest(`${PROD_URL}/debug`);
      
      if (response.statusCode === 200) {
        this.log('✅ Domain accessible and /debug endpoint responding', 'SUCCESS');
        
        try {
          const debugData = JSON.parse(response.data);
          
          // Verify version
          const version = debugData.goNoGo?.version;
          if (version === '1.0.0') {
            this.log(`✅ Version correct: ${version}`, 'SUCCESS');
            this.results.preflight.version = 'PASS';
          } else {
            this.log(`❌ Version incorrect: expected 1.0.0, got ${version}`, 'ERROR');
            this.results.preflight.version = 'FAIL';
          }
          
          // Check Go/No-Go status
          const overallStatus = debugData.goNoGo?.overall_status;
          if (overallStatus === 'READY_FOR_RC') {
            this.log('✅ Go/No-Go status ready for production', 'SUCCESS');
            this.results.preflight.goNoGo = 'PASS';
          } else {
            this.log(`⚠️ Go/No-Go status: ${overallStatus}`, 'WARNING');
            this.results.preflight.goNoGo = 'WARNING';
          }
          
        } catch (parseError) {
          this.log('❌ Failed to parse debug response JSON', 'ERROR');
          this.results.preflight.debugParsing = 'FAIL';
        }
        
      } else {
        this.log(`❌ Domain not accessible: HTTP ${response.statusCode}`, 'ERROR');
        this.results.preflight.accessibility = 'FAIL';
      }
      
    } catch (error) {
      this.log(`❌ Preflight failed: ${error.message}`, 'ERROR');
      this.results.preflight.connectivity = 'FAIL';
    }
  }

  async validateCriticalEndpoints() {
    this.log('🔍 Validating Critical Production Endpoints', 'INFO');
    
    const endpoints = [
      { path: '/', expectedStatus: 200, contentType: 'text/html', description: 'Main Page' },
      { path: '/debug', expectedStatus: 200, contentType: 'application/json', description: 'Debug Status' },
      { path: '/sw.js', expectedStatus: 200, contentType: 'application/javascript', description: 'Service Worker' },
      { path: '/manifest.json', expectedStatus: 200, contentType: 'application/json', description: 'PWA Manifest' },
      { path: '/robots.txt', expectedStatus: 200, contentType: 'text/plain', description: 'SEO Robots' },
      { path: '/sitemap.xml', expectedStatus: 200, contentType: 'application/xml', description: 'SEO Sitemap' },
      { path: '/legal/privacy', expectedStatus: 200, contentType: 'text/html', description: 'Privacy Policy' },
      { path: '/legal/terms', expectedStatus: 200, contentType: 'text/html', description: 'Terms of Service' },
      { path: '/offline', expectedStatus: 200, contentType: 'text/html', description: 'Offline Page' }
    ];

    let passCount = 0;
    const totalCount = endpoints.length;

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(`${PROD_URL}${endpoint.path}`);
        
        const statusOk = response.statusCode === endpoint.expectedStatus;
        const contentTypeOk = response.headers['content-type']?.includes(endpoint.contentType.split('/')[0]);
        
        if (statusOk && contentTypeOk) {
          this.log(`✅ ${endpoint.description}: ${response.statusCode} (${response.contentLength} bytes)`, 'SUCCESS');
          passCount++;
          this.results.endpoints[endpoint.path] = 'PASS';
        } else {
          this.log(`❌ ${endpoint.description}: ${response.statusCode}, content-type: ${response.headers['content-type']}`, 'ERROR');
          this.results.endpoints[endpoint.path] = 'FAIL';
        }
        
      } catch (error) {
        this.log(`❌ ${endpoint.description}: ${error.message}`, 'ERROR');
        this.results.endpoints[endpoint.path] = 'FAIL';
      }
    }

    const successRate = (passCount / totalCount * 100).toFixed(1);
    this.log(`📊 Endpoints Success Rate: ${successRate}% (${passCount}/${totalCount})`, 
             successRate >= 90 ? 'SUCCESS' : 'ERROR');
    
    this.results.endpoints.successRate = successRate;
  }

  async validatePWA() {
    this.log('📱 Validating PWA Functionality', 'INFO');
    
    try {
      // Check Service Worker
      const swResponse = await this.makeRequest(`${PROD_URL}/sw.js`);
      
      if (swResponse.statusCode === 200) {
        const swContent = swResponse.data;
        
        // Check for spiread-v1
        if (swContent.includes('spiread-v1')) {
          this.log('✅ Service Worker contains spiread-v1 version', 'SUCCESS');
          this.results.pwa.swVersion = 'PASS';
        } else {
          this.log('❌ Service Worker missing spiread-v1 version', 'ERROR');
          this.results.pwa.swVersion = 'FAIL';
        }
        
        // Check for GA v1.0.0
        if (swContent.includes('1.0.0')) {
          this.log('✅ Service Worker updated to GA v1.0.0', 'SUCCESS');
          this.results.pwa.gaBuild = 'PASS';
        } else {
          this.log('❌ Service Worker not updated to GA build', 'ERROR');
          this.results.pwa.gaBuild = 'FAIL';
        }
        
        // Check for skipWaiting and clients.claim
        if (swContent.includes('skipWaiting') && swContent.includes('clients.claim')) {
          this.log('✅ Service Worker has immediate activation code', 'SUCCESS');
          this.results.pwa.immediateActivation = 'PASS';
        } else {
          this.log('❌ Service Worker missing immediate activation', 'ERROR');
          this.results.pwa.immediateActivation = 'FAIL';
        }
        
      } else {
        this.log(`❌ Service Worker not accessible: ${swResponse.statusCode}`, 'ERROR');
        this.results.pwa.accessibility = 'FAIL';
      }
      
      // Check PWA Manifest
      const manifestResponse = await this.makeRequest(`${PROD_URL}/manifest.json`);
      
      if (manifestResponse.statusCode === 200) {
        try {
          const manifest = JSON.parse(manifestResponse.data);
          
          const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
          const missingFields = requiredFields.filter(field => !manifest[field]);
          
          if (missingFields.length === 0) {
            this.log('✅ PWA Manifest has all required fields', 'SUCCESS');
            this.results.pwa.manifestValid = 'PASS';
          } else {
            this.log(`❌ PWA Manifest missing fields: ${missingFields.join(', ')}`, 'ERROR');
            this.results.pwa.manifestValid = 'FAIL';
          }
          
        } catch (parseError) {
          this.log('❌ PWA Manifest invalid JSON', 'ERROR');
          this.results.pwa.manifestParsing = 'FAIL';
        }
      }
      
    } catch (error) {
      this.log(`❌ PWA validation failed: ${error.message}`, 'ERROR');
      this.results.pwa.overall = 'FAIL';
    }
  }

  async validateSecurity() {
    this.log('🔒 Validating Security Headers and Configuration', 'INFO');
    
    try {
      const response = await this.makeRequest(`${PROD_URL}/`);
      const headers = response.headers;
      
      // Check security headers
      const securityHeaders = {
        'strict-transport-security': 'HSTS',
        'x-frame-options': 'Frame Protection',
        'x-content-type-options': 'Content Sniffing Protection',
        'referrer-policy': 'Referrer Policy',
        'content-security-policy': 'CSP Enforcement',
        'permissions-policy': 'Permissions Policy'
      };
      
      let securityScore = 0;
      const totalHeaders = Object.keys(securityHeaders).length;
      
      for (const [header, description] of Object.entries(securityHeaders)) {
        if (headers[header] || headers[header.replace('-', '_')]) {
          this.log(`✅ ${description} header present`, 'SUCCESS');
          securityScore++;
          this.results.security[header] = 'PASS';
        } else {
          this.log(`❌ ${description} header missing`, 'ERROR');
          this.results.security[header] = 'FAIL';
        }
      }
      
      const securityPercentage = (securityScore / totalHeaders * 100).toFixed(1);
      this.log(`🛡️ Security Headers Score: ${securityPercentage}% (${securityScore}/${totalHeaders})`, 
               securityPercentage >= 80 ? 'SUCCESS' : 'WARNING');
      
      this.results.security.score = securityPercentage;
      
    } catch (error) {
      this.log(`❌ Security validation failed: ${error.message}`, 'ERROR');
      this.results.security.overall = 'FAIL';
    }
  }

  async generateReport() {
    this.log('📋 Generating Production Validation Report', 'INFO');
    
    const report = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'production',
      url: PROD_URL,
      validation: this.results
    };
    
    // Determine overall status
    const hasFailures = Object.values(this.results).some(category => 
      typeof category === 'object' && Object.values(category).includes('FAIL')
    );
    
    if (hasFailures) {
      this.results.overall = 'FAIL';
      this.log('❌ Production validation FAILED - Issues detected', 'ERROR');
    } else {
      this.results.overall = 'PASS';
      this.log('✅ Production validation PASSED - Ready for GA', 'SUCCESS');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 PRODUCTION VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(JSON.stringify(report, null, 2));
    console.log('='.repeat(80));
    
    return report;
  }

  async run() {
    this.log('🚀 Starting Spiread v1.0.0 Production Validation', 'INFO');
    console.log(`Target URL: ${PROD_URL}`);
    console.log('='.repeat(80));
    
    await this.validatePreflight();
    await this.validateCriticalEndpoints();
    await this.validatePWA();
    await this.validateSecurity();
    
    const report = await this.generateReport();
    
    // Exit with appropriate code
    process.exit(this.results.overall === 'PASS' ? 0 : 1);
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ProductionValidator();
  validator.run().catch(error => {
    console.error('❌ Production validation crashed:', error);
    process.exit(1);
  });
}

module.exports = ProductionValidator;