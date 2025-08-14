// This file configures the initialization of Sentry for edge features (middleware, edge routes).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also applied to Node.js-based middlewares.
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
  
  // Privacy and PII protection
  sendDefaultPii: false,
  
  // Debug mode
  debug: process.env.SENTRY_DEBUG === 'true',
  
  // Data scrubbing for server-side
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
      }
      
      // Remove sensitive query parameters
      if (event.request.query_string) {
        const params = new URLSearchParams(event.request.query_string)
        params.delete('token')
        params.delete('key')
        params.delete('password')
        params.delete('auth')
        event.request.query_string = params.toString()
      }
    }
    
    // Don't send events in development unless debug is enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null
    }
    
    return event
  },
})