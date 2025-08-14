# Security Implementation Documentation - Spiread

## Overview
This document describes the comprehensive security implementation for Spiread, including Content Security Policy (CSP), security headers, and monitoring systems.

## Content Security Policy (CSP)

### Implementation Strategy
- **Development**: CSP Report-Only mode for testing and violation detection
- **Production**: CSP Enforce mode with strict policies
- **Dynamic Configuration**: Origins automatically configured from environment variables

### CSP Directives

#### Core Directives
```
default-src 'self'                    // Default source for all resources
base-uri 'self'                       // Restrict base element URLs
object-src 'none'                     // Block plugins (Flash, etc)
frame-ancestors 'none'                // Prevent clickjacking
form-action 'self'                    // Restrict form submissions
```

#### Script Sources
```javascript
// Production
script-src 'self' 'strict-dynamic' 'wasm-unsafe-eval' 'nonce-{generated}'

// Development (adds unsafe-eval for Next.js hot reloading)
script-src 'self' 'strict-dynamic' 'wasm-unsafe-eval' 'unsafe-eval' 'nonce-{generated}'
```

**Allowed Script Sources:**
- `'self'` - Same origin scripts
- `'strict-dynamic'` - Scripts loaded by trusted scripts
- `'wasm-unsafe-eval'` - WebAssembly support
- `'nonce-{random}'` - Inline scripts with nonce (if needed)
- `https://vercel-insights.com` - Analytics
- Sentry domain (if configured)
- Analytics domain (if configured)

#### Style Sources
```
style-src 'self' 'unsafe-inline'
```
Note: `unsafe-inline` required for Tailwind CSS and Next.js inline styles

#### Resource Sources
```
img-src 'self' data: https: blob:     // Images from anywhere over HTTPS
font-src 'self' data:                 // Fonts from self or data URIs
media-src 'self' blob:                // Audio/video
manifest-src 'self'                   // PWA manifest
worker-src 'self' blob:               // Service Workers and Web Workers
```

#### Network Sources
```javascript
connect-src 'self' {SUPABASE_URL} {SENTRY_URL} {ANALYTICS_URL} wss:
```

**Dynamically Added:**
- Supabase URL for database connections
- Sentry URL for error reporting
- Analytics domain (Plausible/PostHog)
- Vercel Insights for performance monitoring
- WebSocket connections (`wss:`)

### Environment-Based Configuration

The CSP automatically includes origins based on environment variables:

```javascript
// Supabase
NEXT_PUBLIC_SUPABASE_URL → connect-src

// Sentry
SENTRY_DSN → script-src, connect-src

// Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN → script-src, connect-src
NEXT_PUBLIC_POSTHOG_HOST → script-src, connect-src
```

## Security Headers

### HTTP Strict Transport Security (HSTS)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
- Forces HTTPS for 1 year
- Applies to all subdomains
- Eligible for browser preload lists

### Content Type Protection
```
X-Content-Type-Options: nosniff
```
Prevents MIME type sniffing attacks

### Clickjacking Protection
```
X-Frame-Options: DENY
```
Prevents the site from being embedded in frames

### Referrer Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
Controls referrer information sent with requests

### Permissions Policy
```javascript
Permissions-Policy: camera=(), microphone=(), geolocation=(), 
                   payment=(), usb=(), fullscreen=(self),
                   accelerometer=(), gyroscope=(), magnetometer=()
```
Disables unnecessary browser APIs, allows fullscreen for PWA

### Additional Headers
```
X-DNS-Prefetch-Control: on
X-Permitted-Cross-Domain-Policies: none
```

## CSP Violation Reporting

### Endpoint: `/api/csp-report`
Accepts CSP violation reports in multiple formats:
- Legacy: `application/csp-report`
- Modern: `application/reports+json`  
- Fallback: `application/json`

### Violation Processing
1. **Parsing**: Supports both legacy and modern report formats
2. **Sanitization**: Cleans and structures violation data
3. **Severity Classification**:
   - **Critical**: `eval`, `javascript:`, unsafe inline scripts
   - **Warning**: Third-party resources, font/image violations
   - **Info**: Browser extensions, benign violations

4. **Logging**: Console logging with appropriate levels
5. **Storage**: Optional database/Sentry integration (configurable)
6. **Response**: Returns 204 No Content for performance

### Violation Filtering
- **Browser Extensions**: Automatically filtered out
- **Development**: Violations not stored to reduce noise
- **Known Safe Resources**: Classified as warnings instead of errors

## Compatibility

### PWA Support
- `manifest-src 'self'` - PWA manifest access
- `Service-Worker-Allowed: /` - Service worker scope
- Cache-Control headers optimized for PWA resources

### Web Workers
- `worker-src 'self' blob:` - Service Workers and RSVP accelerator worker
- Blob URLs supported for dynamic worker creation

### Third-Party Integrations
- **Supabase**: Database connections and real-time updates
- **Sentry**: Error tracking and performance monitoring  
- **Analytics**: Plausible or PostHog tracking
- **Vercel**: Insights and analytics

### Next.js Compatibility
- `'unsafe-eval'` in development for hot reloading
- `'unsafe-inline'` for styles (Tailwind requirement)
- Nonce generation for inline scripts if needed
- Static asset exclusions in middleware

## Testing

### Automated Testing
Script: `scripts/test-security.js`

```bash
# Test localhost
node scripts/test-security.js

# Test production
node scripts/test-security.js https://app.spiread.com
```

**Tests Include:**
- Security header presence and values
- CSP directive parsing and validation
- HSTS configuration analysis
- CSP report endpoint functionality
- Scoring and issue identification

### Manual Testing
1. Open browser developer tools
2. Navigate to site with CSP enabled
3. Check for CSP violations in console
4. Test PWA installation
5. Verify RSVP worker functionality
6. Test offline capabilities

### Lighthouse Security Audit
```bash
npm run lighthouse
```
Should achieve ≥90 Best Practices score

## Environment Configuration

### Required Environment Variables
```bash
# App
NEXT_PUBLIC_BASE_URL=https://app.spiread.com

# Supabase (automatically added to CSP)
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co

# Optional Sentry (automatically added if present)
SENTRY_DSN=https://key@sentry.io/project

# Optional Analytics (automatically added if present)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=app.spiread.com
# OR
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### CSP Modes
- **Development**: `NODE_ENV=development` → Report-Only mode
- **Production**: `NODE_ENV=production` → Enforce mode

## Monitoring

### Debug Endpoint: `/debug`
Returns security configuration and status:

```json
{
  "security": {
    "cspMode": "Report-Only",
    "httpsOnly": false,
    "securityHeaders": {...},
    "allowedOrigins": {...}
  }
}
```

### CSP Violation Monitoring
All violations logged to console with severity levels:
- 🚨 **Critical**: Requires immediate attention
- ⚠️ **Warning**: Should be reviewed
- ℹ️ **Info**: Informational only

### Production Monitoring
In production, consider:
- Forwarding violations to Sentry
- Database storage for violation analysis
- Alert thresholds for critical violations
- Regular security header audits

## Best Practices

### CSP Updates
1. Always test in Report-Only mode first
2. Monitor violations for at least 24 hours
3. Whitelist legitimate resources before enforcing
4. Use nonces instead of unsafe-inline when possible

### Security Headers
1. Keep HSTS max-age long (1+ year)
2. Include preload directive for HSTS
3. Regularly audit Permissions Policy
4. Test all headers with security scanners

### Incident Response
1. Monitor CSP violation logs
2. Investigate critical violations immediately
3. Update policies as needed for legitimate resources
4. Document all policy changes

## Troubleshooting

### Common Issues

#### CSP Blocking Legitimate Resources
1. Check violation reports in `/api/csp-report` logs
2. Add required domains to appropriate directive
3. Test in Report-Only mode first

#### PWA Installation Issues
1. Verify `manifest-src 'self'` in CSP
2. Check Service-Worker-Allowed header
3. Ensure manifest.json is accessible

#### RSVP Worker Not Loading
1. Verify `worker-src 'self' blob:` in CSP
2. Check for worker script violations
3. Ensure accelerator-worker.js is served correctly

#### Development Hot Reload Issues
1. Ensure `'unsafe-eval'` in development script-src
2. Check for Next.js specific violations
3. Verify nonce generation if using inline scripts

### Security Scanner Results
If security scanners report issues:
1. Verify all required headers are present
2. Check CSP directive completeness
3. Ensure HSTS configuration is correct
4. Test with multiple security tools

## Future Enhancements

### Planned Improvements
1. **CSP Level 3**: Implement `'strict-dynamic'` fully
2. **Reporting API**: Migrate to modern Reporting API v1
3. **Subresource Integrity**: Add SRI for critical resources
4. **Certificate Transparency**: Monitor CT logs
5. **Security Automation**: Automated security testing in CI/CD

### Advanced Features
1. **CSP Nonces**: Dynamic nonce injection for inline scripts
2. **Hash-based CSP**: Pre-computed hashes for static resources
3. **Worker CSP**: Separate policies for service workers
4. **Trusted Types**: Prevent DOM XSS attacks

This security implementation provides comprehensive protection while maintaining full application functionality and performance.