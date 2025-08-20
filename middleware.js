import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { rateLimitCheck } from './lib/rate-limit'

/**
 * Security Middleware for Spiread
 * Implements CSP (Report-Only -> Enforce), HSTS, security headers, and API rate limiting
 * Compatible with PWA, Service Worker, RSVP Worker, and third-party integrations
 */

export async function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static assets
  if (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/_next/image/') ||
    pathname.startsWith('/favicon.ico') ||
    (pathname.includes('.') && !pathname.includes('/api/'))
  ) {
    return NextResponse.next()
  }

  // Apply rate limiting to specific API routes
  if (pathname.startsWith('/api/ai/') || pathname.startsWith('/api/progress/')) {
    const rateLimitResult = await rateLimitCheck(request)
    
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response
    }
    
    // Continue with rate limit headers
    const response = NextResponse.next()
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }
    return response
  }

  const response = NextResponse.next()

  // Generate nonce for inline scripts (if needed)
  const nonce = Buffer.from(uuidv4()).toString('base64')
  
  // Get environment-based origins
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  let sentryDomain = ''
  try {
    if (process.env.SENTRY_DSN && process.env.SENTRY_DSN.startsWith('http')) {
      const url = new URL(process.env.SENTRY_DSN)
      sentryDomain = url.hostname
    }
  } catch (error) {
    console.warn('Invalid SENTRY_DSN URL, skipping Sentry configuration')
  }
  
  // Analytics domains
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
  const plausibleApiHost = process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST || 'https://plausible.io'
  const postHogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
  const analyticsProvider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER
  
  let analyticsDomains = []
  if (analyticsProvider === 'plausible' && plausibleDomain) {
    analyticsDomains.push(plausibleApiHost)
  } else if (analyticsProvider === 'posthog') {
    analyticsDomains.push(postHogHost)
  } else {
    // Auto-detect based on env vars
    if (plausibleDomain) analyticsDomains.push(plausibleApiHost)
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) analyticsDomains.push(postHogHost)
  }
  
  // Build dynamic CSP origins
  const connectSrcOrigins = [
    "'self'",
    supabaseUrl,
    sentryDomain && `https://${sentryDomain}`,
    ...analyticsDomains,
    'https://vitals.vercel-insights.com',
    'https://vercel-insights.com',
    'wss:', // WebSocket support for Supabase realtime
  ].filter(Boolean).join(' ')

  const scriptSrcOrigins = [
    "'self'",
    "'unsafe-inline'", // EMERGENCY FIX: Allow inline scripts for Vercel
    "'unsafe-eval'", // EMERGENCY FIX: Allow eval for Next.js
    "'strict-dynamic'",
    "'wasm-unsafe-eval'", // Required for WebAssembly
    // Add Sentry, Analytics if they inject scripts
    sentryDomain && `https://${sentryDomain}`,
    ...analyticsDomains,
    'https://vercel-insights.com',
    'https://*.vercel.app', // Allow Vercel domain scripts
    'https://*.vercel-insights.com',
  ].filter(Boolean).join(' ')

  // CSP Policy (comprehensive for Spiread)
  const cspDirectives = [
    "default-src 'self'",
    "base-uri 'self'", 
    "object-src 'none'",
    `script-src ${scriptSrcOrigins} 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
    "img-src 'self' data: https: blob:", // Icons, PWA assets, external images
    "font-src 'self' data:", // Font files and data URIs
    `connect-src ${connectSrcOrigins}`,
    "worker-src 'self' blob:", // Service Worker + RSVP Worker
    "frame-src 'self'", // If any iframes needed
    "manifest-src 'self'", // PWA manifest
    "media-src 'self' blob:", // Audio/video if needed
    "frame-ancestors 'none'", // Prevent embedding
    "form-action 'self'", // Only allow forms to same origin
    // Only add upgrade-insecure-requests in production
    ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
    "report-uri /api/csp-report"
  ].join('; ')

  // Determine CSP mode based on environment
  const isDevelopment = process.env.NODE_ENV === 'development'
  // EMERGENCY FIX: Use Report-Only mode in production until CSP is properly configured
  const cspHeaderName = 'Content-Security-Policy-Report-Only'
  
  // Remove any existing CSP headers to prevent conflicts
  response.headers.delete('Content-Security-Policy')
  response.headers.delete('Content-Security-Policy-Report-Only')
  
  // Set our CSP header
  response.headers.set(cspHeaderName, cspDirectives)

  // Security Headers
  const securityHeaders = {
    // HSTS - Force HTTPS for 1 year, include subdomains, preload
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Feature permissions policy
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'fullscreen=(self)', // Allow fullscreen for PWA
      'accelerometer=()', // Disable unnecessary sensors
      'gyroscope=()',
      'magnetometer=()'
    ].join(', '),
    
    // Additional security headers
    'X-DNS-Prefetch-Control': 'on', // Allow DNS prefetching for performance
    'X-Permitted-Cross-Domain-Policies': 'none',
  }

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // PWA and caching headers (preserve existing functionality)
  if (pathname === '/manifest.json') {
    response.headers.set('Cache-Control', 'public, max-age=86400') // 1 day
  }
  
  if (pathname.includes('sw.js') || pathname.includes('service-worker')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Service-Worker-Allowed', '/')
  }

  // Add nonce to response for script tags (if needed)
  if (pathname.startsWith('/') && !pathname.startsWith('/api/')) {
    response.headers.set('X-CSP-Nonce', nonce)
  }

  return response
}

// Configure middleware to run on all routes except static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes (they get minimal headers)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Files with extensions (images, css, js, etc)
     */
    '/',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]*$).*)',
  ],
}