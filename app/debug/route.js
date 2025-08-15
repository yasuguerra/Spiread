import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // Get build and deployment info
    const buildInfo = {
      version: process.env.APP_VERSION || '1.0.0',
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local',
      environment: process.env.NODE_ENV || 'development',
      vercelEnv: process.env.VERCEL_ENV || 'local',
      buildTime: process.env.BUILD_TIME || new Date().toISOString(),
      region: process.env.VERCEL_REGION || 'local'
    }

    // Feature flags
    const features = {
      aiEnabled: process.env.AI_ENABLED === 'true',
      pwaEnabled: process.env.PWA_ENABLED === 'true',
      stripeEnabled: process.env.STRIPE_ENABLED === 'true',
      analyticsEnabled: process.env.ANALYTICS_DISABLED !== 'true',
      sentryEnabled: process.env.SENTRY_ENABLED === 'true',
      cspEnabled: true // CSP is always enabled via middleware
    }

    // Security configuration
    const security = {
      cspMode: process.env.NODE_ENV === 'development' ? 'Report-Only' : 'Enforce',
      httpsOnly: process.env.NODE_ENV === 'production',
      securityHeaders: {
        hsts: 'max-age=31536000; includeSubDomains; preload',
        frameOptions: 'DENY',
        contentTypeOptions: 'nosniff',
        referrerPolicy: 'strict-origin-when-cross-origin'
      },
      allowedOrigins: {
        supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        sentry: !!process.env.SENTRY_DSN,
        analytics: !!(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || process.env.NEXT_PUBLIC_POSTHOG_HOST)
      },
      rateLimiting: {
        enabled: true,
        storage: process.env.UPSTASH_REDIS_REST_URL ? 'redis' : 'memory',
        limits: {
          ai: '30 requests/minute',
          progress: '120 requests/minute'
        }
      }
    }

    // AI Configuration (without sensitive keys)
    const aiConfig = {
      provider: process.env.AI_PROVIDER || 'openai',
      maxCallsPerDay: parseInt(process.env.AI_MAX_CALLS_PER_DAY) || 100,
      maxTokensPerMonth: parseInt(process.env.AI_MAX_TOKENS_PER_MONTH) || 100000,
      emergentKeyConfigured: !!process.env.EMERGENT_LLM_KEY
    }

    // Observability configuration
    const observability = {
      sentry: {
        enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
        release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
        profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
        debug: process.env.SENTRY_DEBUG === 'true',
        piiScrubbing: 'enabled',
        sourcemaps: process.env.NODE_ENV === 'production' ? 'enabled' : 'development'
      },
      monitoring: {
        errors: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
        performance: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1') > 0,
        profiling: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1') > 0
      }
    }

    // PWA configuration and status (as per Phase 1 specifications)
    const pwa = {
      swVersion: 'spiread-v1',
      installed: false, // Cannot detect on server-side reliably
      caches: {
        shell: 'unknown', // Will be populated by client-side SW communication
        assets: 'unknown',
        data: 'unknown'
      },
      bgSync: {
        queueLengths: {
          game_runs: 'unknown', // Will be populated by client-side SW communication
          session_schedules: 'unknown'
        }
      },
      // Additional PWA info
      manifest: {
        available: true,
        url: '/manifest.json'
      },
      offlineSupport: {
        enabled: true,
        offlinePage: '/offline',
        backgroundSync: true,
        version: '1.0.0-rc.1'
      },
      cacheVersions: {
        shell: 'spiread-shell-v1',
        assets: 'spiread-assets-v1',
        data: 'spiread-data-v1'
      },
      features: [
        'Offline gameplay - 9 games work without internet',
        'Background sync - data syncs when connection restored', 
        'App shell caching - instant loading',
        'Smart caching strategies - network-first APIs, cache-first assets',
        'Pre-cache offline - games, documents, quizzes (last N=5)',
        'BG Sync - exponential backoff, IndexedDB persistence'
      ]
    }

    // Analytics configuration
    let analytics = {
      provider: 'null',
      enabled: false,
      consent: false,
      dnt: false,
      gpc: false,
      lastEventsCount: 0,
      lastEvents: []
    }

    // Try to get analytics status (client-side code)
    try {
      // Import analytics status function (dynamic import for server-side safety)
      const analyticsModule = await import('@/lib/analytics/track')
      const status = analyticsModule.getAnalyticsStatus()
      
      analytics = {
        provider: status.provider || 'null',
        enabled: status.enabled || false,
        consent: status.consent || false,
        dnt: status.doNotTrack || false,
        gpc: status.globalPrivacyControl || false,
        lastEventsCount: status.bufferSize || 0,
        lastEvents: (status.lastEvents || []).slice(0, 10)
      }
    } catch (error) {
      // Analytics status not available on server-side, provide basic info
      const provider = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? 'plausible' :
                      process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'posthog' : 'null'
      
      analytics = {
        provider,
        enabled: process.env.ANALYTICS_DISABLED !== 'true' && provider !== 'null',
        consent: false, // Cannot check on server-side
        dnt: false,
        gpc: false,
        lastEventsCount: 0,
        lastEvents: []
      }
    }

    // Database status (without connection string)
    const databaseConfig = {
      supabaseUrlConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKeyConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKeyConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }

    // Check AI health endpoint
    let aiHealthStatus = 'unknown'
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const healthResponse = await fetch(`${baseUrl}/api/ai/health`, {
        headers: { 'User-Agent': 'Spiread-Debug' }
      })
      aiHealthStatus = healthResponse.ok ? 'healthy' : 'unhealthy'
    } catch (error) {
      aiHealthStatus = 'unreachable'
    }

    // System info
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    }

    // Check request headers for security verification
    const requestHeaders = {
      userAgent: request.headers.get('user-agent')?.substring(0, 100),
      acceptLanguage: request.headers.get('accept-language'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer')
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      build: buildInfo,
      features,
      security,
      observability,
      pwa,
      analytics,
      ai: {
        ...aiConfig,
        healthStatus: aiHealthStatus
      },
      database: databaseConfig,
      system: systemInfo,
      request: requestHeaders
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      build: {
        version: process.env.APP_VERSION || '1.0.0',
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local',
        environment: process.env.NODE_ENV || 'development'
      }
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}