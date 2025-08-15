import { NextResponse } from 'next/server'

/**
 * Analytics Testing Endpoint
 * Test analytics tracking and consent functionality
 */

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const testType = url.searchParams.get('type') || 'status'
    
    // Import analytics functions
    const { getAnalyticsStatus, track } = await import('@/lib/analytics/track')
    
    switch (testType) {
      case 'status': {
        const status = getAnalyticsStatus()
        return NextResponse.json({
          success: true,
          analytics: status,
          timestamp: new Date().toISOString()
        })
      }
      
      case 'track': {
        // Test tracking an event
        const success = await track('onboarding_done', {
          lang: 'test',
          baselineWpm: 200,
          goalWpm: 400
        })
        
        return NextResponse.json({
          success,
          message: success ? 'Event tracked successfully' : 'Event blocked (privacy controls)',
          timestamp: new Date().toISOString()
        })
      }
      
      case 'consent': {
        // Show consent status
        const { getConsentStatus } = await import('@/lib/analytics/track')
        const hasConsent = getConsentStatus()
        
        return NextResponse.json({
          success: true,
          consent: hasConsent,
          message: hasConsent ? 'User has granted analytics consent' : 'No analytics consent',
          timestamp: new Date().toISOString()
        })
      }
      
      default:
        return NextResponse.json({
          error: 'Invalid test type',
          supportedTypes: ['status', 'track', 'consent']
        }, { status: 400 })
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Analytics test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { 
      status: 500 
    })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const action = body.action
    
    if (action === 'batch-test') {
      // Test multiple events
      const { trackBatch } = await import('@/lib/analytics/track')
      
      const events = [
        { event: 'rsvp_started', props: { lang: 'test', docLen: 1000, device: 'test' } },
        { event: 'game_run_saved', props: { gameKey: 'test', score: 100, level: 5, durationSec: 60 } },
        { event: 'quiz_completed', props: { questions: 5, correct: 4, docLen: 500 } }
      ]
      
      const successCount = await trackBatch(events)
      
      return NextResponse.json({
        success: true,
        eventsTracked: successCount,
        totalEvents: events.length,
        message: `${successCount}/${events.length} events tracked`,
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      error: 'Invalid action',
      supportedActions: ['batch-test']
    }, { status: 400 })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Invalid request body',
      details: error.message
    }, { status: 400 })
  }
}