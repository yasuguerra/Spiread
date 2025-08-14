import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

/**
 * Security Middleware for Spiread
 * Implements CSP (Report-Only -> Enforce), HSTS, and other security headers
 * Compatible with PWA, Service Worker, RSVP Worker, and third-party integrations
 */

export function middleware(request) {
  const response = NextResponse.next()
  
  // Skip middleware for static assets and API routes that don't need CSP
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/_next/image/') ||
    pathname.includes('.') && !pathname.includes('/api/')
  ) {
    return response
  }

  // Generate nonce for inline scripts (if needed)
  const nonce = Buffer.from(uuidv4()).toString('base64')
  
  // Get environment-based origins
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const sentryDomain = process.env.SENTRY_DSN ? 
    new URL(process.env.SENTRY_DSN).hostname : ''
  const analyticsDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 
    process.env.NEXT_PUBLIC_POSTHOG_HOST || ''
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.spiread.com'
  
  // Build dynamic CSP origins
  const connectSrcOrigins = [
    "'self'",
    supabaseUrl,
    sentryDomain && `https://${sentryDomain}`,
    analyticsDomain && `https://${analyticsDomain}`,
    'https://vitals.vercel-insights.com',
    'https://vercel-insights.com',
    'wss:', // WebSocket support for Supabase realtime
  ].filter(Boolean).join(' ')

  const scriptSrcOrigins = [
    "'self'",
    "'strict-dynamic'",
    "'wasm-unsafe-eval'", // Required for some WebAssembly usage
    // Add Sentry, Analytics if they inject scripts
    sentryDomain && `https://${sentryDomain}`,
    analyticsDomain && `https://${analyticsDomain}`,
    'https://vercel-insights.com',
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
    "upgrade-insecure-requests", // Force HTTPS
    "report-uri /api/csp-report"
  ].join('; ')

  // Determine CSP mode based on environment
  const isDevelopment = process.env.NODE_ENV === 'development'
  const cspMode = isDevelopment ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy'
  
  // Set CSP header
  response.headers.set(cspMode, cspDirectives)

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

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes that don't need full CSP)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc)
     */
    '/((?!api/csp-report|_next/static|_next/image|favicon.ico|.*\\.[^/]*$).*)',
  ],
}