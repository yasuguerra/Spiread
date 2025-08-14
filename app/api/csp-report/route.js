import { NextResponse } from 'next/server'

/**
 * CSP Report Endpoint
 * Handles Content Security Policy violation reports
 * Supports both legacy application/csp-report and modern application/reports+json
 */

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let report = null

    // Parse CSP report based on content type
    if (contentType.includes('application/csp-report')) {
      // Legacy CSP report format
      const body = await request.json()
      report = body['csp-report'] || body
    } else if (contentType.includes('application/reports+json')) {
      // Modern Reporting API format
      const reports = await request.json()
      report = reports[0]?.body || reports[0]
    } else {
      // Try to parse as JSON anyway
      const body = await request.json()
      report = body['csp-report'] || body
    }

    if (!report) {
      return NextResponse.json({ error: 'No report data found' }, { status: 400 })
    }

    // Sanitize and structure the report
    const sanitizedReport = {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || 'unknown',
      url: request.headers.get('referer') || 'unknown',
      type: 'csp-violation',
      violation: {
        documentURI: report['document-uri'] || report.documentURI,
        referrer: report.referrer,
        blockedURI: report['blocked-uri'] || report.blockedURI,
        violatedDirective: report['violated-directive'] || report.violatedDirective,
        originalPolicy: report['original-policy'] || report.originalPolicy,
        effectiveDirective: report['effective-directive'] || report.effectiveDirective,
        statusCode: report['status-code'] || report.statusCode,
        sourceFile: report['source-file'] || report.sourceFile,
        lineNumber: report['line-number'] || report.lineNumber,
        columnNumber: report['column-number'] || report.columnNumber,
        sample: report.sample
      }
    }

    // Log the violation
    const severity = determineSeverity(sanitizedReport.violation)
    const logMessage = `CSP Violation [${severity}]: ${sanitizedReport.violation.violatedDirective} - ${sanitizedReport.violation.blockedURI}`
    
    if (severity === 'critical') {
      console.error('🚨 CSP CRITICAL VIOLATION:', sanitizedReport)
    } else if (severity === 'warning') {
      console.warn('⚠️ CSP WARNING:', logMessage, sanitizedReport)
    } else {
      console.info('ℹ️ CSP INFO:', logMessage)
    }

    // In production, you might want to send to Sentry, database, or other logging service
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      // TODO: Send to Sentry if configured
      // Sentry.captureMessage(logMessage, { 
      //   level: severity === 'critical' ? 'error' : 'warning',
      //   extra: sanitizedReport 
      // })
    }

    // Store in database or file if needed
    if (shouldStore(sanitizedReport.violation)) {
      // TODO: Implement storage logic
      // await storeCspViolation(sanitizedReport)
    }

    // Return 204 No Content for optimal performance
    return new NextResponse(null, { status: 204 })

  } catch (error) {
    console.error('Error processing CSP report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Determine violation severity based on the blocked URI and directive
 */
function determineSeverity(violation) {
  const blockedURI = violation.blockedURI || ''
  const directive = violation.violatedDirective || ''

  // Critical violations - these indicate potential security issues
  if (
    blockedURI.includes('eval') ||
    blockedURI.includes('javascript:') ||
    directive.includes('script-src') && blockedURI.includes('unsafe-') ||
    blockedURI.includes('data:') && directive.includes('script-src')
  ) {
    return 'critical'
  }

  // Warning violations - these might be legitimate third-party resources
  if (
    directive.includes('connect-src') ||
    directive.includes('img-src') ||
    directive.includes('font-src') ||
    blockedURI.includes('google') ||
    blockedURI.includes('vercel') ||
    blockedURI.includes('sentry')
  ) {
    return 'warning'
  }

  // Info violations - typically benign
  return 'info'
}

/**
 * Determine if violation should be stored for analysis
 */
function shouldStore(violation) {
  const blockedURI = violation.blockedURI || ''
  
  // Don't store common browser extension violations
  if (
    blockedURI.includes('chrome-extension:') ||
    blockedURI.includes('moz-extension:') ||
    blockedURI.includes('safari-extension:') ||
    blockedURI.includes('extension://')
  ) {
    return false
  }

  // Don't store violations from known safe resources in development
  if (process.env.NODE_ENV === 'development') {
    return false
  }

  return true
}

// Handle GET requests for testing
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/csp-report',
    methods: ['POST'],
    description: 'Content Security Policy violation reporting endpoint',
    supportedContentTypes: [
      'application/csp-report',
      'application/reports+json',
      'application/json'
    ]
  })
}