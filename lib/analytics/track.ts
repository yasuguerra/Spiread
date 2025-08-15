/**
 * Analytics Tracking Helper with Privacy Controls
 * Main interface for tracking events throughout the application
 */

import { AnalyticsEvent, AnalyticsProps, AnalyticsEventRecord, shouldBlockAnalytics, getPrivacyControls } from './adapter'
import { getAnalytics } from './index'

// Local event buffer for debugging and monitoring
const eventBuffer: AnalyticsEventRecord[] = []
const MAX_BUFFER_SIZE = 20

/**
 * Main tracking function - respects all privacy controls
 * This is the primary interface used throughout the application
 */
export async function track(
  event: AnalyticsEvent, 
  props?: AnalyticsProps,
  options?: { force?: boolean }
): Promise<boolean> {
  try {
    const privacyControls = getPrivacyControls()
    const analytics = getAnalytics()
    
    // Create event record for buffer
    const eventRecord: AnalyticsEventRecord = {
      event,
      props,
      timestamp: new Date().toISOString(),
      provider: analytics.name,
      sent: false
    }
    
    // Add to local buffer for debugging (always)
    addToBuffer(eventRecord)
    
    // Check privacy controls (unless forced)
    if (!options?.force && shouldBlockAnalytics(privacyControls)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 [BLOCKED] Analytics event: ${event}`, {
          reason: getBlockingReason(privacyControls),
          props
        })
      }
      return false
    }
    
    // Track the event
    await analytics.track(event, props)
    eventRecord.sent = true
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 [SENT] Analytics event: ${event}`, {
        provider: analytics.name,
        props
      })
    }
    
    return true
    
  } catch (error) {
    console.error(`Analytics tracking error for event ${event}:`, error)
    return false
  }
}

/**
 * Track multiple events in batch (useful for complex interactions)
 */
export async function trackBatch(
  events: Array<{ event: AnalyticsEvent; props?: AnalyticsProps }>
): Promise<number> {
  let successCount = 0
  
  for (const { event, props } of events) {
    const success = await track(event, props)
    if (success) successCount++
  }
  
  return successCount
}

/**
 * Get consent status from localStorage/settings
 */
export function getConsentStatus(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('spiread_analytics_consent') === 'true'
}

/**
 * Set consent status
 */
export function setConsentStatus(consent: boolean): void {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('spiread_analytics_consent', consent.toString())
  
  if (consent) {
    console.log('📊 Analytics consent granted')
  } else {
    console.log('📊 Analytics consent revoked')
  }
}

/**
 * Get current analytics status for debugging
 */
export function getAnalyticsStatus() {
  const privacyControls = getPrivacyControls()
  const analytics = getAnalytics()
  
  return {
    provider: analytics.name,
    enabled: !shouldBlockAnalytics(privacyControls),
    consent: privacyControls.hasConsent,
    doNotTrack: privacyControls.doNotTrack,
    globalPrivacyControl: privacyControls.globalPrivacyControl,
    analyticsDisabled: privacyControls.analyticsDisabled,
    bufferSize: eventBuffer.length,
    lastEvents: getRecentEvents(10)
  }
}

/**
 * Get recent events from buffer
 */
export function getRecentEvents(limit: number = 10): AnalyticsEventRecord[] {
  return eventBuffer
    .slice(-limit)
    .reverse() // Most recent first
}

/**
 * Clear event buffer (useful for testing)
 */
export function clearEventBuffer(): void {
  eventBuffer.length = 0
}

/**
 * Helper function to add event to buffer with size management
 */
function addToBuffer(eventRecord: AnalyticsEventRecord): void {
  eventBuffer.push(eventRecord)
  
  // Keep buffer size limited
  if (eventBuffer.length > MAX_BUFFER_SIZE) {
    eventBuffer.shift() // Remove oldest event
  }
}

/**
 * Get human-readable reason for why analytics was blocked
 */
function getBlockingReason(privacyControls: ReturnType<typeof getPrivacyControls>): string {
  if (!privacyControls.hasConsent) return 'no-consent'
  if (privacyControls.doNotTrack) return 'do-not-track'
  if (privacyControls.globalPrivacyControl) return 'global-privacy-control'
  if (privacyControls.analyticsDisabled) return 'analytics-disabled'
  return 'unknown'
}

// Export convenience functions for common tracking patterns

/**
 * Track user onboarding completion
 */
export function trackOnboardingDone(baselineWpm: number, goalWpm: number, lang: string = 'es') {
  return track('onboarding_done', {
    lang,
    baselineWpm,
    goalWpm
  })
}

/**
 * Track RSVP reading session start
 */
export function trackRSVPStarted(docLength: number, lang: string = 'es', device?: string, pwaInstalled?: boolean) {
  return track('rsvp_started', {
    lang,
    docLen: docLength,
    device: device || 'unknown',
    pwaInstalled: pwaInstalled || false
  })
}

/**
 * Track game completion
 */
export function trackGameRunSaved(
  gameKey: string, 
  score: number, 
  level: number, 
  durationSec: number,
  device?: string
) {
  return track('game_run_saved', {
    gameKey,
    score,
    level,
    durationSec,
    device: device || 'unknown'
  })
}

/**
 * Track AI quiz completion
 */
export function trackQuizCompleted(questions: number, correct: number, docLength: number) {
  return track('quiz_completed', {
    questions,
    correct,
    docLen: docLength
  })
}

/**
 * Track PWA installation
 */
export function trackPWAInstall(device?: string) {
  return track('install_pwa', {
    device: device || 'unknown'
  })
}

/**
 * Track streak increment
 */
export function trackStreakIncrement(streakDays: number) {
  return track('streak_increment', {
    streakDays
  })
}

/**
 * Track session completion
 */
export function trackSessionCompleted(template: string, blocks: number, totalDurationSec: number) {
  return track('session_completed', {
    template,
    blocks,
    totalDurationSec
  })
}