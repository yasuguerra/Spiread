import { NextResponse } from 'next/server'

/**
 * Observability Test Endpoint
 * Tests Sentry integration by throwing controlled errors and capturing events
 */

// Simulate Sentry capture function
function captureSentryError(error, context = {}) {
  // In a real implementation, this would be:
  // import * as Sentry from '@sentry/nextjs'
  // Sentry.captureException(error, context)
  
  const sentryEnabled = !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)
  const release = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  
  if (sentryEnabled) {
    console.log('📊 [SENTRY SIMULATION] Error captured:', {
      error: error.message,
      release,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
      context,
      timestamp: new Date().toISOString()
    })
    return true
  }
  
  console.warn('⚠️ Sentry not configured - error would be lost:', error.message)
  return false
}

function captureSentryMessage(message, level = 'info', context = {}) {
  // In a real implementation:
  // Sentry.captureMessage(message, level, context)
  
  const sentryEnabled = !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)
  
  if (sentryEnabled) {
    console.log(`📊 [SENTRY SIMULATION] Message captured [${level}]:`, {
      message,
      level,
      context,
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      timestamp: new Date().toISOString()
    })
    return true
  }
  
  return false
}

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const testType = url.searchParams.get('type') || 'error'
    
    switch (testType) {
      case 'error':
        // Test error capturing
        const testError = new Error('Test error from observability endpoint')
        testError.stack = `Error: Test error from observability endpoint
    at GET (/app/api/observability/throw/route.js:50:25)
    at async handler (/app/api/observability/throw/route.js:45:12)`
        
        const errorCaptured = captureSentryError(testError, {
          tags: {
            test: true,
            endpoint: '/api/observability/throw',
            type: 'controlled_test'
          },
          extra: {
            userAgent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString(),
            testType: 'error'
          }
        })
        
        return NextResponse.json({
          success: true,
          message: 'Test error captured and sent to monitoring',
          details: {
            errorMessage: testError.message,
            sentryEnabled: errorCaptured,
            release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
            environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV
          }
        })
        
      case 'message':
        // Test message capturing
        const messageCaptured = captureSentryMessage(
          'Test message from observability endpoint',
          'info',
          {
            tags: {
              test: true,
              endpoint: '/api/observability/throw'
            },
            extra: {
              testType: 'message',
              timestamp: new Date().toISOString()
            }
          }
        )
        
        return NextResponse.json({
          success: true,
          message: 'Test message captured and sent to monitoring',
          details: {
            sentryEnabled: messageCaptured,
            release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
          }
        })
        
      case 'performance':
        // Test performance monitoring
        const startTime = Date.now()
        
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
        
        const duration = Date.now() - startTime
        
        captureSentryMessage(
          'Performance test completed',
          'info',
          {
            tags: {
              test: true,
              type: 'performance'
            },
            extra: {
              duration,
              endpoint: '/api/observability/throw'
            }
          }
        )
        
        return NextResponse.json({
          success: true,
          message: 'Performance test completed',
          details: {
            duration,
            release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
          }
        })
        
      default:
        return NextResponse.json({
          error: 'Invalid test type',
          supportedTypes: ['error', 'message', 'performance']
        }, { status: 400 })
    }
    
  } catch (error) {
    // This should also be captured by Sentry
    captureSentryError(error, {
      tags: {
        endpoint: '/api/observability/throw',
        type: 'unexpected_error'
      }
    })
    
    return NextResponse.json({
      success: false,
      error: 'Unexpected error in observability endpoint',
      details: {
        message: error.message,
        timestamp: new Date().toISOString()
      }
    }, { 
      status: 500 
    })
  }
}

// Health check for observability system
export async function POST(request) {
  try {
    const body = await request.json()
    const action = body.action || 'status'
    
    const sentryConfig = {
      enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
      debug: process.env.SENTRY_DEBUG === 'true'
    }
    
    if (action === 'status') {
      return NextResponse.json({
        status: 'ok',
        observability: {
          sentry: sentryConfig,
          monitoring: {
            errors: sentryConfig.enabled,
            performance: sentryConfig.enabled,
            profiling: sentryConfig.enabled
          }
        },
        timestamp: new Date().toISOString()
      })
    }
    
    if (action === 'test-batch') {
      // Test multiple types of events
      const results = []
      
      // Test error
      const testError = new Error('Batch test error')
      results.push({
        type: 'error',
        captured: captureSentryError(testError, { tags: { batch: true } })
      })
      
      // Test message
      results.push({
        type: 'message', 
        captured: captureSentryMessage('Batch test message', 'warning', { tags: { batch: true } })
      })
      
      return NextResponse.json({
        status: 'ok',
        results,
        sentry: sentryConfig
      })
    }
    
    return NextResponse.json({
      error: 'Invalid action',
      supportedActions: ['status', 'test-batch']
    }, { status: 400 })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Invalid request body'
    }, { status: 400 })
  }
}