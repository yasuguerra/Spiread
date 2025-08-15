/**
 * PostHog Analytics Adapter for Spiread
 * Product analytics and feature flags
 */

import { AnalyticsAdapter, AnalyticsEvent, AnalyticsProps } from './adapter'

interface PostHogWindow {
  posthog?: {
    init: (apiKey: string, options?: any) => void
    capture: (event: string, properties?: any) => void
    identify: (distinctId?: string, properties?: any) => void
    isFeatureEnabled: (key: string) => boolean
    flush: () => void
    opt_out_capturing: () => void
    opt_in_capturing: () => void
  }
}

declare global {
  interface Window extends PostHogWindow {}
}

export class PostHogAdapter implements AnalyticsAdapter {
  readonly name = 'posthog'
  private apiKey: string
  private host: string
  private debug: boolean
  private initialized = false

  constructor(config: { apiKey: string; host?: string; debug?: boolean }) {
    this.apiKey = config.apiKey
    this.host = config.host || 'https://app.posthog.com'
    this.debug = config.debug || false
  }

  async init(): Promise<void> {
    if (this.initialized) return

    try {
      // Load PostHog script dynamically
      const script = document.createElement('script')
      script.src = `${this.host}/static/array.js`
      
      // Initialize PostHog array for queuing events before load
      ;(window as any).posthog = (window as any).posthog || []
      const posthog = (window as any).posthog
      
      // Queue initialization
      posthog.push(['init', this.apiKey, {
        api_host: this.host,
        // Privacy-focused configuration
        respect_dnt: true,
        opt_out_capturing_by_default: true, // Require explicit opt-in
        capture_pageview: false, // We'll manually track page views if needed
        capture_pageleave: false,
        disable_session_recording: true, // Privacy-focused
        disable_surveys: true,
        loaded: (ph: any) => {
          if (this.debug) {
            console.log('📊 PostHog analytics initialized', {
              apiKey: this.apiKey.substring(0, 8) + '...',
              host: this.host
            })
          }
          this.initialized = true
        }
      }])
      
      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          // PostHog will call the loaded callback when ready
          setTimeout(() => {
            if (this.initialized) {
              resolve()
            } else {
              reject(new Error('PostHog failed to initialize within timeout'))
            }
          }, 2000)
        }
        
        script.onerror = (error) => {
          console.error('Failed to load PostHog script:', error)
          reject(error)
        }
        
        document.head.appendChild(script)
      })
      
    } catch (error) {
      console.error('PostHog adapter initialization failed:', error)
      throw error
    }
  }

  track(event: AnalyticsEvent, props?: AnalyticsProps): void {
    if (!this.isReady()) {
      if (this.debug) {
        console.warn('PostHog not ready, queuing event:', event)
        // PostHog will queue events automatically
      }
    }

    try {
      const eventName = this.formatEventName(event)
      const properties = this.sanitizeProps(props)
      
      if (this.debug) {
        console.log('📊 Tracking PostHog event:', eventName, properties)
      }

      // PostHog uses capture for event tracking
      if (window.posthog?.capture) {
        window.posthog.capture(eventName, properties)
      } else {
        // If not loaded yet, queue the event
        ;(window as any).posthog = (window as any).posthog || []
        ;(window as any).posthog.push(['capture', eventName, properties])
      }
      
    } catch (error) {
      console.error('PostHog tracking error:', error)
    }
  }

  identify(uid?: string): void {
    if (!this.isReady()) return

    try {
      if (window.posthog?.identify) {
        // Only identify with anonymous ID, no PII
        window.posthog.identify(uid, {
          // Add any non-PII user properties if needed
        })
      }
    } catch (error) {
      console.error('PostHog identify error:', error)
    }
  }

  flush(): void {
    if (window.posthog?.flush) {
      window.posthog.flush()
    }
  }

  isReady(): boolean {
    return this.initialized && !!window.posthog?.capture
  }

  private formatEventName(event: AnalyticsEvent): string {
    // PostHog uses snake_case, which matches our event names
    return event
  }

  private sanitizeProps(props?: AnalyticsProps): Record<string, any> | undefined {
    if (!props) return undefined

    const sanitized: Record<string, any> = {}
    
    Object.entries(props).forEach(([key, value]) => {
      if (value === null || value === undefined) return
      
      // PostHog handles various types well
      if (typeof value === 'boolean' || typeof value === 'number') {
        sanitized[key] = value
        return
      }
      
      // Truncate very long strings
      if (typeof value === 'string') {
        sanitized[key] = value.length > 200 ? value.substring(0, 200) + '...' : value
        return
      }
      
      sanitized[key] = String(value)
    })
    
    return sanitized
  }
}

// Factory function for PostHog
export function createPostHogAdapter(): PostHogAdapter | null {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
  const debug = process.env.NODE_ENV === 'development'

  if (!apiKey) {
    console.warn('PostHog API key not configured')
    return null
  }

  return new PostHogAdapter({
    apiKey,
    host,
    debug
  })
}