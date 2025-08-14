// This file configures the initialization of Sentry on the server side.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Release and environment configuration  
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
  
  // Performance monitoring
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  
  // Profiling (Node.js only)
  profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
  
  // Privacy and PII protection
  sendDefaultPii: false,
  
  // Debug mode
  debug: process.env.SENTRY_DEBUG === 'true',
  
  // Server-side integrations
  integrations: [
    // Enable HTTP integration for API tracing
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  
  // Data scrubbing for server-side requests
  beforeSend(event, hint) {
    // Remove PII from request data
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
        delete event.request.headers['set-cookie']
        delete event.request.headers['Authorization']
        delete event.request.headers['Cookie']
        delete event.request.headers['Set-Cookie']
        delete event.request.headers['x-api-key']
        delete event.request.headers['X-API-Key']
      }
      
      // Scrub sensitive request bodies for AI and Progress APIs
      if (event.request.url && (
        event.request.url.includes('/api/ai/') || 
        event.request.url.includes('/api/progress/')
      )) {
        delete event.request.data
        event.request.data = '[Redacted for privacy]'
      }
      
      // Remove sensitive query parameters
      if (event.request.query_string) {
        const params = new URLSearchParams(event.request.query_string)
        params.delete('token')
        params.delete('key')
        params.delete('password')
        params.delete('auth')
        params.delete('text') // Don't log user text content
        event.request.query_string = params.toString()
      }
    }
    
    // Remove sensitive context data
    if (event.contexts?.trace?.data) {
      const traceData = event.contexts.trace.data
      if (traceData['http.request.body']) {
        delete traceData['http.request.body']
      }
    }
    
    // Don't send events in development unless debug is enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null
    }
    
    // Don't capture CSP violations (handled separately)
    if (event.request?.url?.includes('/api/csp-report')) {
      return null
    }
    
    return event
  },
  
  // Ignore common errors that aren't actionable
  ignoreErrors: [
    // Network errors
    'Network request failed',
    'fetch failed',
    'ECONNRESET',
    'ENOTFOUND',
    'ECONNREFUSED',
    // Rate limiting
    'Rate limit exceeded',
    // Authentication errors (expected)
    'Unauthorized',
    'Authentication failed'
  ],
})