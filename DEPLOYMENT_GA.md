# Spiread v1.0.0 GA Deployment Instructions

## 🚀 General Availability Deployment to Production

This document provides step-by-step instructions for deploying Spiread v1.0.0 GA to production at `https://app.spiread.com`.

---

## Prerequisites

### 1. Environment Variables (Production)
Ensure the following environment variables are configured in your production deployment (Vercel):

```bash
# App Configuration
NEXT_PUBLIC_APP_NAME=Spiread
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_BASE_URL=https://app.spiread.com

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Feature Flags
AI_ENABLED=true
PWA_ENABLED=true
ANALYTICS_ENABLED=true

# AI Configuration
EMERGENT_LLM_KEY=your_emergent_llm_key
AI_QUOTA_MONTHLY=10000

# Observability (Sentry)
SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Analytics (Plausible)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=app.spiread.com
PLAUSIBLE_API_KEY=your_plausible_api_key

# Rate Limiting (Upstash Redis - Optional)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Testing (for smoke tests)
SMOKE_TEST_EMAIL=smoke.test@spiread.com
SMOKE_TEST_PASSWORD=your_test_password
```

### 2. Domain Configuration
- DNS for `app.spiread.com` pointing to Vercel
- SSL certificate configured
- CDN/cache purging access

---

## Deployment Steps

### Step 1: Pre-deployment Verification

```bash
# 1. Verify current tag
git describe --exact-match --tags HEAD
# Should output: v1.0.0

# 2. Check debug endpoint locally
curl -s http://localhost:3000/debug | jq '.goNoGo.version'
# Should output: "1.0.0"

# 3. Verify Service Worker version
curl -s http://localhost:3000/sw.js | head -1
# Should output: // Spiread Service Worker v1.0.0 GA
```

### Step 2: Deploy to Production

#### Option A: Automated Deployment (Recommended)
```bash
# Push the v1.0.0 tag to trigger automated deployment
git push origin v1.0.0

# Monitor the GitHub Action
# https://github.com/your-org/spiread/actions
```

#### Option B: Manual Deployment via Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod --yes

# Wait for deployment to complete
```

### Step 3: Post-deployment Validation

#### Automated Validation
```bash
# Run the production validation script
node scripts/validate-production.js
```

#### Manual Verification Checklist

**1. Basic Connectivity**
- [ ] `https://app.spiread.com` loads successfully
- [ ] `https://app.spiread.com/debug` returns status 200
- [ ] Version shows `1.0.0` in debug endpoint

**2. PWA Functionality**
- [ ] Service Worker registers: `spiread-v1` 
- [ ] PWA installable (browser install prompt appears)
- [ ] Offline functionality works (disable network, games still playable)
- [ ] Background sync operates (offline game completion syncs when online)

**3. Core Features**
- [ ] All 9 games visible on home page
- [ ] Game interaction works (Space to pause, Esc to exit)
- [ ] Language switching (ES ↔ EN) works
- [ ] Gamification header displays (XP, level, streak)

**4. Security & Compliance**
- [ ] Security headers present (check network inspector)
- [ ] Rate limiting active (check debug endpoint)
- [ ] Analytics consent banner appears
- [ ] Legal pages accessible (`/legal/privacy`, `/legal/terms`)

**5. SEO & Metadata**
- [ ] `robots.txt` accessible and properly formatted
- [ ] `sitemap.xml` accessible and contains correct URLs
- [ ] Open Graph meta tags present in page source
- [ ] Page title correct: "Spiread — Acelera tu lectura, mejora tu comprensión"

---

## Testing Suite

### Automated Tests

#### 1. Lighthouse CI
```bash
# Run Lighthouse against production
npx @lhci/cli@0.12.x autorun --config=lighthouserc.prod.json
```

**Expected Scores:**
- Performance: ≥ 90
- PWA: ≥ 90  
- Best Practices: ≥ 90
- Accessibility: ≥ 90

#### 2. Playwright Smoke Tests
```bash
# Set environment variables
export PROD_BASE_URL=https://app.spiread.com
export SMOKE_TEST_EMAIL=your_test_email
export SMOKE_TEST_PASSWORD=your_test_password

# Run smoke tests
npx playwright test tests/smoke/prod-smoke.spec.js
```

### Manual Testing Scenarios

#### PWA Installation & Offline Testing
1. **Install PWA:**
   - Visit `https://app.spiread.com` in Chrome/Edge
   - Click install prompt or browser menu → "Install Spiread"
   - Verify app appears in applications/desktop

2. **Offline Functionality:**
   - Open installed PWA
   - Enable airplane mode / disconnect network
   - Try to play any game (should work offline)
   - Complete a short game session
   - Reconnect network
   - Verify game progress syncs automatically

3. **Service Worker Update:**
   - Check DevTools → Application → Service Workers
   - Verify `spiread-v1` is registered and active
   - No old service workers should be present

#### RLS Security Testing
```bash
# Create two test accounts with different data
# Verify no data leakage between users
# Check that each user only sees their own progress
```

#### Analytics Testing
1. **With Consent:**
   - Accept analytics in consent banner
   - Perform actions (play games, navigate pages)
   - Verify events are tracked (check analytics dashboard)

2. **Without Consent:**
   - Decline analytics or enable DNT
   - Perform same actions
   - Verify no events are tracked

---

## Observability & Monitoring

### Sentry Configuration
After deployment, verify Sentry is capturing errors:

```bash
# Trigger test error
curl -X POST https://app.spiread.com/api/observability/throw \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "message": "Production deployment verification"}'

# Check Sentry dashboard for the error
# Verify sourcemaps resolve correctly
# Confirm no PII is captured
```

### Analytics Dashboard
- Verify events are appearing in Plausible/PostHog
- Check that consent is being respected
- Monitor key metrics:
  - Page views
  - Game completions
  - PWA installations
  - Session durations

### Alert Configuration
Set up alerts for:
- Error rate > 1%
- 5xx responses > 0.1%
- P95 response time > 2s
- PWA install rate drop > 50%

---

## Go/No-Go Checklist

### ✅ Pre-deployment Checks
- [ ] DNS pointing to Vercel correctly
- [ ] Environment variables configured
- [ ] Sentry DSN and analytics keys set
- [ ] v1.0.0 tag created and verified

### ✅ Post-deployment Validation
- [ ] All critical endpoints return 200
- [ ] Debug endpoint shows version 1.0.0
- [ ] PWA functionality fully operational
- [ ] Security headers active
- [ ] Rate limiting operational
- [ ] Legal pages accessible
- [ ] Lighthouse scores ≥ 90% across all categories

### ✅ Final Verification
- [ ] Manual testing complete
- [ ] Smoke tests passing
- [ ] Observability confirming no errors
- [ ] Analytics tracking correctly
- [ ] RLS verified (no data leaks)

---

## Rollback Procedures

If issues are detected after deployment:

### 1. Immediate Rollback (Vercel)
```bash
# Via Vercel dashboard:
# 1. Go to project deployments
# 2. Find previous stable deployment (v1.0.0-rc.1)
# 3. Click "Promote to Production"
```

### 2. Service Worker Cleanup
If users have cached the problematic SW:
```bash
# Create hotfix with cache cleanup
# Update SW to force cache invalidation
# Deploy hotfix with skipWaiting() + clients.claim()
```

### 3. Database Rollback (if needed)
```bash
# Revert any database migrations if necessary
# Run down migrations in reverse order
```

### 4. DNS/CDN Rollback
```bash
# Purge CDN cache
# Verify DNS propagation
```

---

## Success Criteria

✅ **Production URL accessible**: `https://app.spiread.com`  
✅ **Debug endpoint operational**: Shows version 1.0.0, all systems OK  
✅ **PWA fully functional**: Installable, offline, background sync  
✅ **Security hardened**: All headers, rate limiting, CSP enforcement  
✅ **Observability active**: Sentry capturing errors, analytics tracking  
✅ **Performance targets met**: Lighthouse scores ≥ 90%  
✅ **Legal compliance**: Privacy policy, terms, consent management  

---

## Support & Troubleshooting

### Common Issues

**1. 502 Bad Gateway**
- Check Vercel function limits (10s default, extend if needed)
- Verify environment variables are set
- Check Vercel deployment logs

**2. Service Worker Not Updating**
- Force cache refresh with DevTools
- Check SW registration in browser console
- Verify SW file is served correctly

**3. PWA Not Installable**
- Verify manifest.json is accessible
- Check all PWA criteria in Lighthouse audit
- Ensure HTTPS is properly configured

**4. Analytics Not Working**
- Check consent status in browser storage
- Verify API keys in environment variables
- Check for ad blockers or privacy extensions

### Debug Endpoints
- **System Status**: `https://app.spiread.com/debug`
- **PWA Manifest**: `https://app.spiread.com/manifest.json`
- **Service Worker**: `https://app.spiread.com/sw.js`
- **Robots**: `https://app.spiread.com/robots.txt`
- **Sitemap**: `https://app.spiread.com/sitemap.xml`

### Contact Information
- **Technical Issues**: Create GitHub issue
- **Production Emergencies**: Alert on-call engineer
- **Deployment Questions**: Check deployment logs and monitoring

---

**🎉 Spiread v1.0.0 General Availability Deployment Complete!**

The application is now live and ready for production use with full PWA capabilities, comprehensive security, privacy-first analytics, and robust observability.