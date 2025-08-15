/**
 * Plausible Analytics Adapter for Spiread
 * Privacy-focused web analytics
 */

import { AnalyticsAdapter, AnalyticsEvent, AnalyticsProps } from './adapter'

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, any> }) => void
  }
}

export class PlausibleAdapter implements AnalyticsAdapter {
  readonly name = 'plausible'
  private domain: string
  private apiHost: string
  private debug: boolean
  private initialized = false

  constructor(config: { domain: string; apiHost?: string; debug?: boolean }) {
    this.domain = config.domain
    this.apiHost = config.apiHost || 'https://plausible.io'
    this.debug = config.debug || false
  }

  async init(): Promise<void> {
    if (this.initialized) return

    try {
      // Load Plausible script dynamically
      const script = document.createElement('script')
      script.defer = true
      script.src = `${this.apiHost}/js/script.js`
      script.setAttribute('data-domain', this.domain)
      
      // Enable outbound link tracking and file downloads if needed
      script.setAttribute('data-api', `${this.apiHost}/api/event`)
      
      // Add privacy-focused attributes
      script.setAttribute('data-exclude', '/admin,/debug')
      
      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          this.initialized = true
          if (this.debug) {
            console.log('📊 Plausible analytics initialized', {
              domain: this.domain,
              apiHost: this.apiHost
            })
          }
          resolve()
        }
        
        script.onerror = (error) => {
          console.error('Failed to load Plausible script:', error)
          reject(error)
        }
        
        document.head.appendChild(script)
      })
      
      // Wait a moment for plausible to be available
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error('Plausible adapter initialization failed:', error)
      throw error
    }
  }

  track(event: AnalyticsEvent, props?: AnalyticsProps): void {
    if (!this.isReady()) {
      if (this.debug) {
        console.warn('Plausible not ready, queuing event:', event)
      }
      return
    }

    try {
      const eventName = this.formatEventName(event)
      
      if (this.debug) {
        console.log('📊 Tracking Plausible event:', eventName, props)
      }

      // Use Plausible's custom event tracking
      window.plausible?.(eventName, {
        props: this.sanitizeProps(props)
      })
      
    } catch (error) {
      console.error('Plausible tracking error:', error)
    }
  }

  isReady(): boolean {
    return this.initialized && typeof window.plausible === 'function'
  }

  private formatEventName(event: AnalyticsEvent): string {
    // Convert snake_case to Title Case for Plausible
    return event
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  private sanitizeProps(props?: AnalyticsProps): Record<string, any> | undefined {
    if (!props) return undefined

    // Plausible has limitations on prop values
    const sanitized: Record<string, any> = {}
    
    Object.entries(props).forEach(([key, value]) => {
      if (value === null || value === undefined) return
      
      // Convert booleans to strings for Plausible
      if (typeof value === 'boolean') {
        sanitized[key] = value ? 'true' : 'false'
        return
      }
      
      // Ensure numbers are within reasonable bounds
      if (typeof value === 'number') {
        sanitized[key] = Math.round(value * 100) / 100 // Round to 2 decimals
        return
      }
      
      // Truncate long strings
      if (typeof value === 'string') {
        sanitized[key] = value.length > 100 ? value.substring(0, 100) + '...' : value
        return
      }
      
      sanitized[key] = String(value)
    })
    
    return sanitized
  }
}

// Factory function for Plausible
export function createPlausibleAdapter(): PlausibleAdapter | null {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
  const apiHost = process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST
  const debug = process.env.NODE_ENV === 'development'

  if (!domain) {
    console.warn('Plausible domain not configured')
    return null
  }

  return new PlausibleAdapter({
    domain,
    apiHost,
    debug
  })
}