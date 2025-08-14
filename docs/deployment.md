# Deployment Guide - Spiread Production on Vercel

## Overview
This guide covers deploying Spiread to production on Vercel with the custom domain `app.spiread.com`.

## Prerequisites
- Vercel CLI installed: `npm i -g vercel`
- Domain `app.spiread.com` configured in Vercel project settings
- Supabase project configured for production
- Environment variables prepared

## 1. Vercel Configuration

The `vercel.json` file is already configured with:
- Custom domain alias: `app.spiread.com`
- Extended timeouts for AI endpoints (5 minutes)
- Proper headers and CORS configuration
- Framework optimization for Next.js

## 2. Environment Variables Setup

### Required Variables (copy from .env.example):
```bash
# App Configuration
NEXT_PUBLIC_APP_NAME=Spiread
NEXT_PUBLIC_BASE_URL=https://app.spiread.com
APP_VERSION=1.0.0

# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI Configuration
AI_ENABLED=true
EMERGENT_LLM_KEY=sk-emergent-your-key
AI_MAX_CALLS_PER_DAY=100
AI_MAX_TOKENS_PER_MONTH=100000

# Feature Flags
PWA_ENABLED=true
STRIPE_ENABLED=false
```

### Setting Environment Variables in Vercel:
```bash
# Set all environment variables
vercel env add NEXT_PUBLIC_APP_NAME
vercel env add NEXT_PUBLIC_BASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
# ... etc for all variables
```

## 3. Deployment Commands

### First Deployment:
```bash
# Link project to Vercel
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Subsequent Deployments:
```bash
# Deploy to production
vercel --prod
```

## 4. Domain Configuration

1. In Vercel dashboard, go to your project
2. Navigate to Settings > Domains
3. Add `app.spiread.com`
4. Configure DNS records as instructed by Vercel

### DNS Configuration:
```
CNAME: app.spiread.com -> cname.vercel-dns.com
```

## 5. Post-Deployment Verification

### Health Checks:
- Visit `https://app.spiread.com/debug` to verify deployment
- Check AI endpoints: `https://app.spiread.com/api/ai/health`
- Verify PWA functionality and installation prompts
- Test all 9 games functionality

### Key URLs to Test:
- Main app: `https://app.spiread.com`
- Debug endpoint: `https://app.spiread.com/debug`
- AI health: `https://app.spiread.com/api/ai/health`
- Basic health: `https://app.spiread.com/api/health`

## 6. Environment-Specific Configuration

### Production Environment Variables:
Vercel automatically sets:
- `NODE_ENV=production`
- `VERCEL_ENV=production`
- `VERCEL_GIT_COMMIT_SHA=<commit-sha>`

### Build Configuration:
The build process includes:
- Next.js optimization
- Static generation where possible
- Service worker compilation for PWA
- Sourcemap generation for debugging

## 7. Monitoring & Observability

### Built-in Monitoring:
- Debug endpoint provides system status
- Version information in footer
- Error boundaries for graceful failures

### Vercel Analytics:
```bash
# Enable Vercel Analytics (optional)
vercel env add NEXT_PUBLIC_VERCEL_ANALYTICS_ID
```

## 8. Rollback Procedures

### In case of issues:
```bash
# Rollback to previous deployment
vercel rollback

# Or deploy specific commit
vercel --prod --meta gitCommitSha=<previous-sha>
```

## 9. Performance Optimization

### Vercel Configuration Optimizations:
- Function timeout extended for AI operations
- Proper caching headers set
- Edge locations optimized for global access
- Static assets CDN enabled

### Next.js Optimizations:
- App directory structure
- Static generation for marketing pages
- Dynamic imports for game components
- Optimized bundle splitting

## 10. Security Considerations

### Headers (see security implementation in later PRs):
- CSP implementation planned
- Security headers configuration
- Rate limiting for API endpoints
- CORS properly configured

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check environment variables are set
   - Verify Node.js version compatibility
   - Review build logs in Vercel dashboard

2. **Domain Issues:**
   - Verify DNS configuration
   - Check domain ownership
   - Allow 24-48 hours for DNS propagation

3. **API Issues:**
   - Confirm Supabase connection
   - Verify AI service configuration
   - Check function timeout settings

4. **PWA Issues:**
   - Verify service worker registration
   - Check manifest.json accessibility
   - Confirm HTTPS configuration

### Support Resources:
- Vercel documentation: https://vercel.com/docs
- Next.js deployment guide: https://nextjs.org/docs/deployment
- Supabase production guide: https://supabase.com/docs

## Success Criteria

Deployment is successful when:
- [x] App loads at `https://app.spiread.com`
- [x] Debug endpoint shows correct version and status
- [x] All 9 games are accessible and functional
- [x] AI endpoints respond correctly
- [x] PWA installation works
- [x] Footer shows version v1.0.0
- [x] No console errors on production