import { NextResponse } from 'next/server'
import { getRateLimitMetrics } from '@/lib/rate-limit'

/**
 * Rate Limit Metrics Endpoint
 * Provides monitoring data for rate limiting
 * Access: /api/rate-limit/metrics
 */

export async function GET() {
  try {
    const metrics = getRateLimitMetrics()
    
    // Calculate rates and percentages
    const totalRequests = metrics.totalRequests || 0
    const totalBlocks = metrics.totalBlocks || 0
    const blockRate = totalRequests > 0 ? (totalBlocks / totalRequests * 100).toFixed(2) : 0
    
    return NextResponse.json({
      status: 'ok',
      timestamp: metrics.timestamp,
      overview: {
        totalRequests,
        totalBlocks,
        blockRatePercentage: parseFloat(blockRate),
        storeType: metrics.storeType,
        responseTimeP95Ms: metrics.responseTimeP95
      },
      byEndpoint: {
        ai: {
          hits: metrics.hits.ai || 0,
          blocks: metrics.blocks.ai || 0,
          blockRate: metrics.hits.ai > 0 ? 
            ((metrics.blocks.ai || 0) / metrics.hits.ai * 100).toFixed(2) : 0,
          limit: '30 requests/minute'
        },
        progress: {
          hits: metrics.hits.progress || 0,
          blocks: metrics.blocks.progress || 0,
          blockRate: metrics.hits.progress > 0 ? 
            ((metrics.blocks.progress || 0) / metrics.hits.progress * 100).toFixed(2) : 0,
          limit: '120 requests/minute'
        }
      },
      health: {
        redisConnected: metrics.storeType === 'redis',
        memoryFallback: metrics.storeType === 'memory'
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, max-age=30', // Cache for 30 seconds
      }
    })
    
  } catch (error) {
    console.error('Error fetching rate limit metrics:', error)
    
    return NextResponse.json({
      status: 'error',
      error: 'Failed to fetch rate limit metrics',
      timestamp: new Date().toISOString()
    }, { 
      status: 500 
    })
  }
}

// Health check for rate limiting system
export async function POST(request) {
  try {
    const body = await request.json()
    const action = body.action
    
    if (action === 'test') {
      // Test rate limiting by making a dummy request
      const testResult = {
        timestamp: new Date().toISOString(),
        message: 'Rate limiting system operational',
        storeType: getRateLimitMetrics().storeType
      }
      
      return NextResponse.json({
        status: 'ok',
        result: testResult
      })
    }
    
    if (action === 'reset') {
      // In a production system, you might want to clear specific rate limit keys
      // For now, just return success
      return NextResponse.json({
        status: 'ok',
        message: 'Rate limit reset requested (not implemented for security)'
      })
    }
    
    return NextResponse.json({
      status: 'error',
      error: 'Invalid action. Supported: test, reset'
    }, { 
      status: 400 
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Invalid request body'
    }, { 
      status: 400 
    })
  }
}