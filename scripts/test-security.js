#!/usr/bin/env node

/**
 * Security Headers Testing Tool for Spiread
 * Tests CSP, HSTS, and other security headers
 */

const https = require('https')
const http = require('http')

const REQUIRED_HEADERS = {
  'content-security-policy': 'CSP (Enforce Mode)',
  'content-security-policy-report-only': 'CSP (Report-Only Mode)', 
  'strict-transport-security': 'HSTS',
  'x-frame-options': 'Clickjacking Protection',
  'x-content-type-options': 'MIME Sniffing Protection',
  'referrer-policy': 'Referrer Policy',
  'permissions-policy': 'Feature Policy'
}

const CSP_DIRECTIVES = [
  'default-src',
  'script-src', 
  'style-src',
  'img-src',
  'connect-src',
  'worker-src',
  'frame-ancestors',
  'report-uri'
]

async function testSecurityHeaders(url) {
  console.log(`🔐 Testing security headers for: ${url}\n`)
  
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http
    
    const req = client.request(url, { method: 'HEAD' }, (res) => {
      const headers = res.headers
      const results = {
        url,
        timestamp: new Date().toISOString(),
        statusCode: res.statusCode,
        headers: {},
        csp: {},
        score: 0,
        maxScore: 0,
        issues: []
      }

      // Check required headers
      Object.entries(REQUIRED_HEADERS).forEach(([header, description]) => {
        results.maxScore += 10
        if (headers[header]) {
          results.headers[header] = {
            present: true,
            value: headers[header],
            description
          }
          results.score += 10
          console.log(`✅ ${description}: Present`)
        } else {
          results.headers[header] = {
            present: false,
            description
          }
          results.issues.push(`Missing ${description} header`)
          console.log(`❌ ${description}: Missing`)
        }
      })

      // Parse CSP if present
      const csp = headers['content-security-policy'] || headers['content-security-policy-report-only']
      if (csp) {
        console.log(`\n📋 CSP Analysis:`)
        CSP_DIRECTIVES.forEach(directive => {
          const regex = new RegExp(`${directive}\\s+([^;]+)`)
          const match = csp.match(regex)
          if (match) {
            results.csp[directive] = match[1].trim()
            console.log(`  ✅ ${directive}: ${match[1].trim()}`)
          } else {
            console.log(`  ⚠️  ${directive}: Not specified`)
          }
        })

        // Check for unsafe directives
        if (csp.includes("'unsafe-inline'") && csp.includes('script-src')) {
          results.issues.push("CSP allows unsafe-inline scripts")
          console.log(`  🚨 WARNING: unsafe-inline in script-src`)
        }
        if (csp.includes("'unsafe-eval'")) {
          results.issues.push("CSP allows unsafe-eval")
          console.log(`  🚨 WARNING: unsafe-eval detected`)
        }
      }

      // Check HSTS configuration
      const hsts = headers['strict-transport-security']
      if (hsts) {
        console.log(`\n🔒 HSTS Analysis:`)
        const maxAge = hsts.match(/max-age=(\d+)/)
        const includesSubdomains = hsts.includes('includeSubDomains')
        const preload = hsts.includes('preload')
        
        if (maxAge) {
          const days = Math.floor(parseInt(maxAge[1]) / (24 * 60 * 60))
          console.log(`  ✅ Max-Age: ${days} days`)
          if (days < 180) {
            results.issues.push("HSTS max-age should be at least 6 months")
          }
        }
        console.log(`  ${includesSubdomains ? '✅' : '⚠️'} Include Subdomains: ${includesSubdomains}`)
        console.log(`  ${preload ? '✅' : '⚠️'} Preload: ${preload}`)
      }

      console.log(`\n📊 Security Score: ${results.score}/${results.maxScore} (${Math.round(results.score/results.maxScore*100)}%)`)
      
      if (results.issues.length > 0) {
        console.log(`\n⚠️  Issues found:`)
        results.issues.forEach(issue => console.log(`  - ${issue}`))
      }

      resolve(results)
    })

    req.on('error', reject)
    req.end()
  })
}

// Test CSP report endpoint
async function testCspReport(baseUrl) {
  console.log(`\n🔍 Testing CSP Report endpoint...`)
  
  const testReport = {
    "csp-report": {
      "document-uri": `${baseUrl}/test`,
      "referrer": "",
      "blocked-uri": "https://evil.example.com/malicious.js",
      "violated-directive": "script-src 'self'",
      "original-policy": "default-src 'self'"
    }
  }

  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}/api/csp-report`)
    const client = url.protocol === 'https:' ? https : http
    
    const postData = JSON.stringify(testReport)
    
    const req = client.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/csp-report',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      if (res.statusCode === 204) {
        console.log(`✅ CSP Report endpoint working (204 No Content)`)
      } else {
        console.log(`⚠️  CSP Report endpoint returned: ${res.statusCode}`)
      }
      resolve(res.statusCode)
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

// Main test function
async function runSecurityTests() {
  const baseUrl = process.argv[2] || 'http://localhost:3000'
  
  try {
    // Test main page
    await testSecurityHeaders(baseUrl)
    
    // Test API endpoint
    console.log(`\n${'='.repeat(60)}`)
    await testSecurityHeaders(`${baseUrl}/api/health`)
    
    // Test debug endpoint
    console.log(`\n${'='.repeat(60)}`)
    await testSecurityHeaders(`${baseUrl}/debug`)
    
    // Test CSP report
    console.log(`\n${'='.repeat(60)}`)
    await testCspReport(baseUrl)
    
    console.log(`\n🎯 Security testing complete!`)
    console.log(`\n📚 Next steps:`)
    console.log(`  1. Review any issues found above`)
    console.log(`  2. Test PWA installation and functionality`)
    console.log(`  3. Test RSVP worker with CSP`)
    console.log(`  4. Run Lighthouse security audit`)
    
  } catch (error) {
    console.error('❌ Error running security tests:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  runSecurityTests()
}

module.exports = { testSecurityHeaders, testCspReport }