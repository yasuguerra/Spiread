/**
 * Analytics Types and Interfaces for Spiread
 * Privacy-first product analytics with consent management
 */

// Core event types tracked by Spiread
export type AnalyticsEvent =
  | 'onboarding_done'
  | 'rsvp_started'
  | 'game_run_saved'
  | 'quiz_completed'
  | 'install_pwa'
  | 'streak_increment'
  | 'session_completed'

// Props for events (no PII allowed)
export type AnalyticsProps = Record<string, string | number | boolean | null>

// Device detection helper type
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

// Event with timestamp for local buffer
export interface AnalyticsEventRecord {
  event: AnalyticsEvent
  props?: AnalyticsProps
  timestamp: string
  provider?: string
  sent: boolean
}

// Core adapter interface
export interface AnalyticsAdapter {
  readonly name: string
  
  // Initialize the adapter (load scripts, configure)
  init(): Promise<void> | void
  
  // Track an event with optional properties
  track(event: AnalyticsEvent, props?: AnalyticsProps): Promise<void> | void
  
  // Optional: identify user (only with consent and no PII)
  identify?(uid?: string): Promise<void> | void
  
  // Optional: flush pending events
  flush?(): Promise<void> | void
  
  // Optional: check if adapter is ready/loaded
  isReady?(): boolean
}

// Null adapter for when analytics is disabled
export class NullAnalyticsAdapter implements AnalyticsAdapter {
  readonly name = 'null'
  
  init(): void {
    // No-op
  }
  
  track(): void {
    // No-op
  }
  
  isReady(): boolean {
    return true
  }
}

// Privacy controls interface
export interface PrivacyControls {
  hasConsent: boolean
  doNotTrack: boolean
  globalPrivacyControl: boolean
  analyticsDisabled: boolean
}

// Analytics configuration
export interface AnalyticsConfig {
  provider: 'plausible' | 'posthog' | 'null'
  enabled: boolean
  domain?: string
  apiHost?: string
  apiKey?: string
  debug?: boolean
}

// Event mapping for documentation
export const EVENT_SOURCES: Record<AnalyticsEvent, string> = {
  onboarding_done: 'OnboardingTest.jsx → handleComplete()',
  rsvp_started: 'RSVPReader.jsx → startReading()',
  game_run_saved: 'GameShell.jsx → handleGameFinish()',
  quiz_completed: 'AIToolsPanel.jsx → handleQuizComplete()', 
  install_pwa: 'PWA install handler → handleInstall()',
  streak_increment: 'Gamification system → updateStreak()',
  session_completed: 'SessionRunner.jsx → handleSessionComplete()'
}

// Device detection utility
export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// Privacy checks utility
export function getPrivacyControls(): PrivacyControls {
  const hasConsent = typeof window !== 'undefined' && 
    (localStorage.getItem('spiread_analytics_consent') === 'true')
  
  const doNotTrack = typeof navigator !== 'undefined' && 
    (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes')
  
  const globalPrivacyControl = typeof navigator !== 'undefined' && 
    'globalPrivacyControl' in navigator && 
    (navigator as any).globalPrivacyControl === true
  
  const analyticsDisabled = process.env.ANALYTICS_DISABLED === 'true' ||
    process.env.NODE_ENV === 'test'
  
  return {
    hasConsent,
    doNotTrack,
    globalPrivacyControl,
    analyticsDisabled
  }
}

// Check if analytics should be blocked
export function shouldBlockAnalytics(controls?: PrivacyControls): boolean {
  const privacyControls = controls || getPrivacyControls()
  
  return (
    !privacyControls.hasConsent ||
    privacyControls.doNotTrack ||
    privacyControls.globalPrivacyControl ||
    privacyControls.analyticsDisabled
  )
}