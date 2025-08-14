#!/usr/bin/env node

/**
 * Rate Limit Testing Script for Spiread APIs
 * Tests rate limiting behavior for /api/ai/* and /api/progress/*
 */

const https = require('https')
const http = require('http')

// Test configurations
const TESTS = {
  ai: {
    endpoint: '/api/ai/health',
    limit: 30,
    windowMs: 60000, // 1 minute
    testRequests: 35 // Exceed limit to test blocking
  },
  progress: {
    endpoint: '/api/progress/get',
    limit: 120,
    windowMs: 60000,
    testRequests: 125 // Exceed limit to test blocking
  }
}

class RateLimitTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
    this.client = baseUrl.startsWith('https:') ? https : http
    this.results = {}
  }

  async makeRequest(endpoint, headers = {}) {
    return new Promise((resolve) => {
      const startTime = Date.now()
      
      const req = this.client.request(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'RateLimit-Tester/1.0',
          ...headers
        }
      }, (res) => {
        const responseTime = Date.now() - startTime
        
        resolve({
          statusCode: res.statusCode,
          responseTime,
          headers: {
            rateLimitLimit: res.headers['x-ratelimit-limit'],
            rateLimitRemaining: res.headers['x-ratelimit-remaining'],
            rateLimitReset: res.headers['x-ratelimit-reset'],
            retryAfter: res.headers['retry-after']
          }
        })
      })

      req.on('error', (error) => {
        resolve({
          statusCode: 0,
          error: error.message,
          responseTime: Date.now() - startTime
        })
      })

      req.end()
    })
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async testEndpoint(testName, config) {
    console.log(`\n🧪 Testing ${testName.toUpperCase()} endpoint: ${config.endpoint}`)
    console.log(`   Limit: ${config.limit} requests/minute`)
    console.log(`   Test requests: ${config.testRequests}`)
    console.log(`   ${'='.repeat(50)}`)

    const results = {
      testName,
      config,
      requests: [],
      summary: {
        total: 0,
        successful: 0,
        rateLimited: 0,
        errors: 0,
        avgResponseTime: 0,
        firstBlockedAt: null
      }
    }

    // Make requests rapidly to test rate limiting
    for (let i = 1; i <= config.testRequests; i++) {
      const result = await this.makeRequest(config.endpoint, {
        'X-Test-Request': i.toString()
      })

      results.requests.push({
        requestNumber: i,
        ...result
      })

      // Log progress every 10 requests or on status changes
      if (i % 10 === 0 || result.statusCode === 429) {
        const status = result.statusCode === 200 ? '✅' : 
                     result.statusCode === 429 ? '🚫' : '❌'
        console.log(`   ${status} Request ${i}: ${result.statusCode} (${result.responseTime}ms)` + 
                   (result.headers.rateLimitRemaining ? ` - ${result.headers.rateLimitRemaining} remaining` : ''))
        
        if (result.statusCode === 429 && !results.summary.firstBlockedAt) {
          results.summary.firstBlockedAt = i
          console.log(`   🔥 First rate limit block at request ${i}`)
        }
      }

      // Small delay to avoid overwhelming the server
      if (i < config.testRequests) {
        await this.sleep(50) // 50ms between requests
      }
    }

    // Calculate summary statistics
    results.summary.total = results.requests.length
    results.summary.successful = results.requests.filter(r => r.statusCode === 200).length
    results.summary.rateLimited = results.requests.filter(r => r.statusCode === 429).length
    results.summary.errors = results.requests.filter(r => r.statusCode !== 200 && r.statusCode !== 429).length
    
    const responseTimes = results.requests.filter(r => r.responseTime).map(r => r.responseTime)
    results.summary.avgResponseTime = responseTimes.length > 0 ? 
      Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0

    // Display results
    console.log(`\n📊 Results for ${testName.toUpperCase()}:`)
    console.log(`   Total requests: ${results.summary.total}`)
    console.log(`   Successful (200): ${results.summary.successful}`)
    console.log(`   Rate limited (429): ${results.summary.rateLimited}`)
    console.log(`   Errors: ${results.summary.errors}`)
    console.log(`   Average response time: ${results.summary.avgResponseTime}ms`)
    
    if (results.summary.firstBlockedAt) {
      console.log(`   First blocked at request: ${results.summary.firstBlockedAt}`)
      
      // Validate rate limiting behavior
      if (results.summary.firstBlockedAt <= config.limit + 2) {
        console.log(`   ✅ Rate limiting working correctly`)
      } else {
        console.log(`   ⚠️  Rate limiting may be too lenient`)
      }
    } else {
      console.log(`   ⚠️  No rate limiting detected`)
    }

    this.results[testName] = results
    return results
  }

  async testRateLimitMetrics() {
    console.log(`\n📈 Testing Rate Limit Metrics endpoint...`)
    
    const result = await this.makeRequest('/api/rate-limit/metrics')
    
    if (result.statusCode === 200) {
      console.log(`   ✅ Metrics endpoint accessible`)
      // Note: Can't parse JSON easily in this simple script
    } else {
      console.log(`   ❌ Metrics endpoint failed: ${result.statusCode}`)
    }

    return result
  }

  async generateReport() {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📋 RATE LIMIT TEST REPORT`)
    console.log(`${'='.repeat(60)}`)
    console.log(`Timestamp: ${new Date().toISOString()}`)
    console.log(`Base URL: ${this.baseUrl}`)
    
    let allTestsPassed = true
    
    Object.entries(this.results).forEach(([testName, results]) => {
      const config = results.config
      const summary = results.summary
      
      console.log(`\n${testName.toUpperCase()} Endpoint:`)
      console.log(`  Expected behavior: Block after ${config.limit} requests`)
      console.log(`  Actual behavior: ${summary.firstBlockedAt ? 
        `Blocked at request ${summary.firstBlockedAt}` : 'No blocking detected'}`)
      
      const passed = summary.rateLimited > 0 && summary.firstBlockedAt && 
                    summary.firstBlockedAt <= config.limit + 5 // Allow small tolerance
      
      console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`)
      
      if (!passed) {
        allTestsPassed = false
      }
    })

    console.log(`\n${'='.repeat(60)}`)
    console.log(`Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
    console.log(`${'='.repeat(60)}`)

    if (allTestsPassed) {
      console.log(`\n🎉 Rate limiting is working correctly!`)
      console.log(`   • API endpoints are properly protected`)
      console.log(`   • Rate limits are enforced as expected`)
      console.log(`   • 429 responses are returned when limits exceeded`)
    } else {
      console.log(`\n⚠️  Rate limiting needs attention:`)
      console.log(`   • Check rate limit configuration`)
      console.log(`   • Verify middleware is applied to correct routes`)
      console.log(`   • Test Redis connection if using Redis backend`)
    }

    return allTestsPassed
  }
}

async function runTests() {
  const baseUrl = process.argv[2] || 'http://localhost:3000'
  
  console.log(`🚀 Starting rate limit tests against: ${baseUrl}`)
  
  const tester = new RateLimitTester(baseUrl)
  
  try {
    // Test AI endpoint
    await tester.testEndpoint('ai', TESTS.ai)
    
    // Wait a moment before next test
    await tester.sleep(2000)
    
    // Test Progress endpoint  
    await tester.testEndpoint('progress', TESTS.progress)
    
    // Test metrics endpoint
    await tester.testRateLimitMetrics()
    
    // Generate final report
    const allPassed = await tester.generateReport()
    
    process.exit(allPassed ? 0 : 1)
    
  } catch (error) {
    console.error('❌ Error running rate limit tests:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  runTests()
}

module.exports = RateLimitTester