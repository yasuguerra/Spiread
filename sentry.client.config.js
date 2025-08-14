// This file configures the initialization of Sentry on the browser side.
// The config you add here will be used whenever a page is visited.
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
  
  // Profiling (if supported)
  profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
  
  // Privacy and PII protection
  sendDefaultPii: false,
  
  // Debug mode
  debug: process.env.SENTRY_DEBUG === 'true',
  
  // Integrations configuration
  integrations: [
    // Disable Session Replay for privacy
    new Sentry.BrowserTracing({
      // Set sampling rate for the browser tracing integration
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/app\.spiread\.com/,
      ],
    }),
  ],
  
  // Data scrubbing and filtering
  beforeSend(event, hint) {
    // Remove PII from headers
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
      delete event.request.headers['set-cookie']
      delete event.request.headers['Authorization']
      delete event.request.headers['Cookie']
      delete event.request.headers['Set-Cookie']
    }
    
    // Scrub sensitive data from URL
    if (event.request?.url) {
      const url = new URL(event.request.url)
      // Remove sensitive query parameters
      url.searchParams.delete('token')
      url.searchParams.delete('key')
      url.searchParams.delete('password')
      event.request.url = url.toString()
    }
    
    // Don't send events for certain paths or in development
    if (event.request?.url) {
      const url = event.request.url
      if (
        url.includes('/api/csp-report') ||
        url.includes('/_next/static/') ||
        (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG)
      ) {
        return null
      }
    }
    
    // Filter out common browser extension errors
    if (event.exception?.values?.[0]?.value) {
      const errorMessage = event.exception.values[0].value
      if (
        errorMessage.includes('chrome-extension://') ||
        errorMessage.includes('moz-extension://') ||
        errorMessage.includes('safari-extension://') ||
        errorMessage.includes('Non-Error promise rejection captured')
      ) {
        return null
      }
    }
    
    return event
  },
  
  // Ignore certain errors
  ignoreErrors: [
    // Random plugins/extensions
    'top.GLOBALS',
    // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'http://tt.epicplay.com',
    "Can't find variable: ZiteReader",
    'jigsaw is not defined',
    'ComboSearch is not defined',
    'http://loading.retry.widdit.com/',
    'atomicFindClose',
    // Facebook borked
    'fb_xd_fragment',
    // ISP "optimizing" proxy - `Cache-Control: no-transform` seems to
    // reduce this. (thanks @acdha)
    // See http://stackoverflow.com/questions/4113268
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
    // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
    'conduitPage',
    // Network errors
    'Network request failed',
    'NetworkError when attempting to fetch resource',
    'Load failed',
    // CSP violations (handled separately)
    'Content Security Policy',
    // PWA/Service Worker common errors
    'ServiceWorker script evaluation failed',
    'Failed to register a ServiceWorker'
  ],
  
  // Don't capture unhandled promise rejections from user interactions
  captureUnhandledRejections: false,
})