/**
 * Analytics Factory and Configuration
 * Auto-detects provider from environment and creates appropriate adapter
 */

import { AnalyticsAdapter, NullAnalyticsAdapter } from './adapter'
import { createPlausibleAdapter } from './plausible'
import { createPostHogAdapter } from './posthog'

// Global analytics instance
let analyticsInstance: AnalyticsAdapter | null = null

/**
 * Get the analytics provider from environment
 */
export function getAnalyticsProvider(): 'plausible' | 'posthog' | 'null' {
  // Explicit provider setting
  const explicitProvider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER
  if (explicitProvider === 'plausible' || explicitProvider === 'posthog') {
    return explicitProvider
  }
  
  // Auto-detect based on available environment variables
  if (process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) {
    return 'plausible'
  }
  
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return 'posthog'
  }
  
  // Default to null (disabled)
  return 'null'
}

/**
 * Create analytics adapter based on configuration
 */
export function createAnalyticsAdapter(): AnalyticsAdapter {
  // Check if analytics is explicitly disabled
  if (process.env.ANALYTICS_DISABLED === 'true' || process.env.NODE_ENV === 'test') {
    return new NullAnalyticsAdapter()
  }
  
  const provider = getAnalyticsProvider()
  
  switch (provider) {
    case 'plausible': {
      const adapter = createPlausibleAdapter()
      return adapter || new NullAnalyticsAdapter()
    }
    
    case 'posthog': {
      const adapter = createPostHogAdapter()
      return adapter || new NullAnalyticsAdapter()
    }
    
    default:
      return new NullAnalyticsAdapter()
  }
}

/**
 * Get the singleton analytics instance
 */
export function getAnalytics(): AnalyticsAdapter {
  if (!analyticsInstance) {
    analyticsInstance = createAnalyticsAdapter()
  }
  return analyticsInstance
}

/**
 * Initialize analytics (call once on app start)
 */
export async function initializeAnalytics(): Promise<void> {
  const analytics = getAnalytics()
  
  try {
    if (analytics.name !== 'null') {
      console.log(`📊 Initializing ${analytics.name} analytics...`)
      await analytics.init()
      console.log(`✅ ${analytics.name} analytics ready`)
    }
  } catch (error) {
    console.error('Analytics initialization failed:', error)
    // Fall back to null adapter
    analyticsInstance = new NullAnalyticsAdapter()
  }
}

/**
 * Reset analytics instance (useful for testing)
 */
export function resetAnalytics(): void {
  analyticsInstance = null
}

// Export types and interfaces
export type {
  AnalyticsEvent,
  AnalyticsProps,
  DeviceType,
  AnalyticsEventRecord,
  AnalyticsAdapter,
  PrivacyControls,
  AnalyticsConfig
} from './adapter'

// Export classes and utilities
export {
  NullAnalyticsAdapter,
  EVENT_SOURCES,
  getDeviceType,
  getPrivacyControls,
  shouldBlockAnalytics
} from './adapter'