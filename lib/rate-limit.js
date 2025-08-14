/**
 * Rate Limiting Implementation for Spiread APIs
 * Supports Upstash Redis (preferred) and in-memory token bucket (fallback)
 * 
 * Rate Limits:
 * - /api/ai/*: 30 requests/minute
 * - /api/progress/*: 120 requests/minute
 * 
 * Key: IP + userId for authenticated users, IP only for anonymous
 */

import { NextResponse } from 'next/server'

// Rate limit configurations
const RATE_LIMITS = {
  '/api/ai/': {
    requests: 30,
    windowMs: 60 * 1000, // 1 minute
    message: 'AI API rate limit exceeded. Try again later.',
    retryAfter: 60
  },
  '/api/progress/': {
    requests: 120,
    windowMs: 60 * 1000, // 1 minute  
    message: 'Progress API rate limit exceeded. Try again later.',
    retryAfter: 60
  }
}

// In-memory store for fallback (when Redis unavailable)
const memoryStore = new Map()

// Metrics collection
const metrics = {
  hits: new Map(),
  blocks: new Map(),
  responseTimes: []
}

/**
 * Redis client setup (Upstash)
 */
let redisClient = null

async function getRedisClient() {
  if (redisClient) return redisClient

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!redisUrl || !redisToken) {
    console.warn('Redis credentials not configured, using in-memory rate limiting')
    return null
  }

  try {
    // Use Upstash REST API for serverless compatibility
    redisClient = {
      async get(key) {
        const response = await fetch(`${redisUrl}/get/${key}`, {
          headers: { Authorization: `Bearer ${redisToken}` }
        })
        const data = await response.json()
        return data.result
      },

      async set(key, value, options = {}) {
        const params = new URLSearchParams()
        if (options.ex) params.append('EX', options.ex.toString())
        
        const response = await fetch(`${redisUrl}/set/${key}?${params}`, {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${redisToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(value)
        })
        return response.ok
      },

      async incr(key) {
        const response = await fetch(`${redisUrl}/incr/${key}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${redisToken}` }
        })
        const data = await response.json()
        return data.result
      },

      async expire(key, seconds) {
        const response = await fetch(`${redisUrl}/expire/${key}/${seconds}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${redisToken}` }
        })
        return response.ok
      }
    }
    
    // Test connection
    await redisClient.set('rate_limit_test', 'ok', { ex: 1 })
    console.log('✅ Redis rate limiting enabled')
    return redisClient

  } catch (error) {
    console.warn('Redis connection failed, using in-memory rate limiting:', error.message)
    redisClient = null
    return null
  }
}

/**
 * Get rate limit key for request
 */
function getRateLimitKey(request, rateLimitPath) {
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown'
  
  // Try to get userId from request (if available)
  let userId = null
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      // In a real app, you'd decode the JWT to get userId
      // For now, use a hash of the token
      userId = authHeader.slice(7).substring(0, 8)
    }
  } catch (error) {
    // Ignore auth parsing errors
  }

  const keyParts = ['rate_limit', rateLimitPath.replace('/', ''), ip]
  if (userId) keyParts.push(userId)
  
  return keyParts.join(':')
}

/**
 * Redis-based rate limiting
 */
async function checkRateLimitRedis(key, limit, windowMs) {
  const redis = await getRedisClient()
  if (!redis) return null

  try {
    const current = await redis.incr(key)
    
    if (current === 1) {
      // First request in window, set expiration
      await redis.expire(key, Math.ceil(windowMs / 1000))
    }

    return {
      count: current,
      remaining: Math.max(0, limit - current),
      resetTime: Date.now() + windowMs
    }
  } catch (error) {
    console.error('Redis rate limit error:', error)
    return null
  }
}

/**
 * In-memory token bucket rate limiting (fallback)
 */
function checkRateLimitMemory(key, limit, windowMs) {
  const now = Date.now()
  
  if (!memoryStore.has(key)) {
    memoryStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return {
      count: 1,
      remaining: limit - 1,
      resetTime: now + windowMs
    }
  }

  const bucket = memoryStore.get(key)
  
  // Reset if window expired
  if (now >= bucket.resetTime) {
    bucket.count = 1
    bucket.resetTime = now + windowMs
  } else {
    bucket.count++
  }

  return {
    count: bucket.count,
    remaining: Math.max(0, limit - bucket.count),
    resetTime: bucket.resetTime
  }
}

/**
 * Update metrics
 */
function updateMetrics(rateLimitPath, blocked, responseTime) {
  const path = rateLimitPath.replace('/', '')
  
  // Count hits
  const hits = metrics.hits.get(path) || 0
  metrics.hits.set(path, hits + 1)
  
  // Count blocks
  if (blocked) {
    const blocks = metrics.blocks.get(path) || 0
    metrics.blocks.set(path, blocks + 1)
  }
  
  // Track response times (keep last 100)
  if (responseTime) {
    metrics.responseTimes.push(responseTime)
    if (metrics.responseTimes.length > 100) {
      metrics.responseTimes.shift()
    }
  }
}

/**
 * Main rate limiting function
 */
export async function rateLimitCheck(request) {
  const startTime = Date.now()
  const pathname = new URL(request.url).pathname

  // Find matching rate limit configuration
  let rateLimitConfig = null
  let rateLimitPath = null

  for (const [path, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(path)) {
      rateLimitConfig = config
      rateLimitPath = path
      break
    }
  }

  // No rate limit configured for this path
  if (!rateLimitConfig) {
    return { allowed: true }
  }

  const key = getRateLimitKey(request, rateLimitPath)
  
  // Try Redis first, fallback to memory
  let result = await checkRateLimitRedis(key, rateLimitConfig.requests, rateLimitConfig.windowMs)
  if (!result) {
    result = checkRateLimitMemory(key, rateLimitConfig.requests, rateLimitConfig.windowMs)
  }

  const responseTime = Date.now() - startTime
  const blocked = result.count > rateLimitConfig.requests

  // Update metrics
  updateMetrics(rateLimitPath, blocked, responseTime)

  if (blocked) {
    console.warn(`Rate limit exceeded for ${pathname}: ${result.count}/${rateLimitConfig.requests}`)
    
    return {
      allowed: false,
      response: NextResponse.json({
        error: rateLimitConfig.message,
        code: 'RATE_LIMIT_EXCEEDED',
        limit: rateLimitConfig.requests,
        current: result.count,
        resetTime: result.resetTime
      }, {
        status: 429,
        headers: {
          'Retry-After': rateLimitConfig.retryAfter.toString(),
          'X-RateLimit-Limit': rateLimitConfig.requests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
        }
      })
    }
  }

  return {
    allowed: true,
    headers: {
      'X-RateLimit-Limit': rateLimitConfig.requests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
    }
  }
}

/**
 * Get current metrics
 */
export function getRateLimitMetrics() {
  const p95ResponseTime = metrics.responseTimes.length > 0 ? 
    metrics.responseTimes.sort((a, b) => a - b)[Math.floor(metrics.responseTimes.length * 0.95)] : 0

  return {
    timestamp: new Date().toISOString(),
    hits: Object.fromEntries(metrics.hits),
    blocks: Object.fromEntries(metrics.blocks),
    responseTimeP95: p95ResponseTime,
    storeType: redisClient ? 'redis' : 'memory',
    totalRequests: Array.from(metrics.hits.values()).reduce((a, b) => a + b, 0),
    totalBlocks: Array.from(metrics.blocks.values()).reduce((a, b) => a + b, 0)
  }
}

/**
 * Clean up expired entries from memory store (periodic cleanup)
 */
export function cleanupMemoryStore() {
  const now = Date.now()
  let cleaned = 0
  
  for (const [key, bucket] of memoryStore.entries()) {
    if (now >= bucket.resetTime) {
      memoryStore.delete(key)
      cleaned++
    }
  }
  
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired rate limit entries`)
  }
}

// Auto cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupMemoryStore, 5 * 60 * 1000)
}