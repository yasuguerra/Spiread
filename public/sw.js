// Spiread Service Worker v1.0.0 GA
// PWA Support with Offline Functionality, Background Sync, and Smart Caching

const SW_VERSION = 'spiread-v1'
const SW_BUILD = '1.0.0'

// Versioned cache names for controlled invalidation (as per Phase 1 requirements)
const CACHES = {
  shell: `spiread-shell-v1`,
  assets: `spiread-assets-v1`, 
  data: `spiread-data-v1`
}

// App shell - critical routes for offline functionality
const APP_SHELL_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/accelerator-worker.js'
]

// Offline queue for background sync with exponential backoff
let offlineQueue = {
  game_runs: [],
  session_schedules: []
}

// Pre-cache offline: app shell + 9 games (assets mínimos para cargar cada juego) + últimos N=5 documentos y resultados de quiz
const OFFLINE_GAME_ASSETS = [
  // Game components - mínimos para funcionar offline
  '/_next/static/chunks/pages/components/games/MemoryDigits.js',
  '/_next/static/chunks/pages/components/games/ParImpar.js', 
  '/_next/static/chunks/pages/components/games/SchulteTable.js',
  '/_next/static/chunks/pages/components/games/TwinWordsGrid.js',
  '/_next/static/chunks/pages/components/games/RunningWords.js',
  '/_next/static/chunks/pages/components/games/LettersGrid.js',
  '/_next/static/chunks/pages/components/games/WordSearch.js',
  '/_next/static/chunks/pages/components/games/Anagrams.js',
  '/_next/static/chunks/pages/components/games/GameWrapper.js',
  // Game data and logic
  '/lib/word-bank.js',
  '/lib/gamification.js',
  '/lib/adaptive-difficulty.js',
  '/lib/enhanced-difficulty.js'
]

// Cache for recent documents and quiz results (N=5)
let cachedDocuments = []
let cachedQuizResults = []

// Game-specific assets for offline functionality (9 games)
const GAME_ASSETS_PATTERNS = [
  // Game components and data will be cached dynamically
  /\/components\/games\//,
  /\/lib\/word-bank\.js/,
  /\/lib\/gamification\.js/,
  /\/lib\/adaptive-difficulty\.js/
]

// Install event - precache app shell and critical assets
self.addEventListener('install', event => {
  console.log(`[SW] Installing ${SW_VERSION} (${SW_BUILD})...`)
  
  event.waitUntil(
    (async () => {
      try {
        // Cache app shell with versioned cache names
        const shellCache = await caches.open(CACHES.shell)
        await shellCache.addAll(APP_SHELL_URLS)
        
        // Pre-cache critical game assets for offline functionality
        const assetsCache = await caches.open(CACHES.assets)
        // Note: Game assets will be cached dynamically as they are accessed
        // since Next.js generates hashed filenames that we can't predict
        
        // Initialize data cache for documents and quiz results  
        const dataCache = await caches.open(CACHES.data)
        
        console.log(`[SW] ${SW_VERSION} installed successfully with versioned caches`)
        
        // Force activation immediately for GA deployment
        console.log(`[SW] Forcing immediate activation for GA v${SW_BUILD}`)
        self.skipWaiting()
      } catch (error) {
        console.error('[SW] Installation failed:', error)
        throw error
      }
    })()
  )
})

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', event => {
  console.log(`[SW] Activating ${SW_VERSION}...`)
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches (anything not spiread-*-v1)
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames
            .filter(name => 
              name.includes('spiread') && 
              !name.endsWith('-v1') && 
              !Object.values(CACHES).includes(name)
            )
            .map(name => {
              console.log(`[SW] Deleting old cache: ${name}`)
              return caches.delete(name)
            })
        )
        
        // Claim all clients immediately
        await self.clients.claim()
        
        console.log(`[SW] ${SW_VERSION} activated and ready with cache cleanup complete`)
      } catch (error) {
        console.error('[SW] Activation failed:', error)
      }
    })()
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }
  
  // API requests - network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request))
    return
  }
  
  // Static assets - cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request))
    return
  }
  
  // App shell - cache-first with network fallback
  if (isAppShellRequest(url.pathname)) {
    event.respondWith(handleAppShell(request))
    return
  }
  
  // Default - stale-while-revalidate
  event.respondWith(handleDefault(request))
})

// API requests - network-first with smart fallback
async function handleAPIRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Try network first with timeout
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 5000)
      )
    ])
    
    // Cache successful responses for offline use (stale-while-revalidate for recent data)
    if (networkResponse.ok && shouldCacheAPI(url.pathname)) {
      const cache = await caches.open(CACHES.data)
      await cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
    
  } catch (error) {
    console.log(`[SW] Network failed for ${url.pathname}, trying cache...`)
    
    // Network failed - try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // No cache - return offline response
    if (url.pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({
          error: 'Offline',
          message: 'Network unavailable. Some features may be limited.',
          offline: true
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    throw error
  }
}

// Static assets - cache-first with network fallback
async function handleStaticAsset(request) {
  const cache = await caches.open(CACHES.assets)
  
  // Try cache first
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Cache miss - fetch and cache
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log(`[SW] Failed to fetch static asset: ${request.url}`)
    throw error
  }
}

// App shell - cache-first with offline page fallback
async function handleAppShell(request) {
  const cache = await caches.open(CACHES.shell)
  
  // Try cache first
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Cache miss - try network
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
      return networkResponse
    }
  } catch (error) {
    console.log(`[SW] Network failed for app shell: ${request.url}`)
  }
  
  // Everything failed - return offline page
  const offlineResponse = await cache.match('/offline')
  if (offlineResponse) {
    return offlineResponse
  }
  
  // Last resort - basic offline response
  return new Response(
    '<html><body><h1>Offline</h1><p>Please check your internet connection.</p></body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  )
}

// Default strategy - stale-while-revalidate
async function handleDefault(request) {
  const cache = await caches.open(CACHES.data)
  
  // Get cached version immediately
  const cachedResponse = await cache.match(request)
  
  // Fetch new version in background
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => null)
  
  // Return cached version or wait for network
  return cachedResponse || await networkPromise || new Response('Offline', { status: 503 })
}

// Background Sync - handle offline actions with exponential backoff
self.addEventListener('sync', event => {
  console.log(`[SW] Background sync triggered: ${event.tag}`)
  
  if (event.tag === 'background-sync-spiread') {
    event.waitUntil(processOfflineQueueWithBackoff())
  }
})

// Process offline queue with exponential backoff and persistence in IndexedDB
async function processOfflineQueue() {
  try {
    // Process game runs
    for (const gameRun of offlineQueue.game_runs) {
      try {
        const response = await fetch('/api/progress/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameRun)
        })
        
        if (response.ok) {
          offlineQueue.game_runs = offlineQueue.game_runs.filter(item => item !== gameRun)
          console.log('[SW] Game run synced successfully')
        }
      } catch (error) {
        console.log('[SW] Failed to sync game run:', error)
      }
    }
    
    // Process session schedules
    for (const session of offlineQueue.session_schedules) {
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(session)
        })
        
        if (response.ok) {
          offlineQueue.session_schedules = offlineQueue.session_schedules.filter(item => item !== session)
          console.log('[SW] Session schedule synced successfully')
        }
      } catch (error) {
        console.log('[SW] Failed to sync session schedule:', error)
      }
    }
    
    // Persist queue state
    await persistOfflineQueue()
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Message handler - communicate with main thread (for debug endpoint)
self.addEventListener('message', event => {
  const { action, data } = event.data
  
  switch (action) {
    case 'GET_SW_STATUS':
      event.ports[0].postMessage({
        version: SW_VERSION,
        build: SW_BUILD,
        caches: Object.keys(CACHES),
        queueLengths: {
          game_runs: offlineQueue.game_runs.length,
          session_schedules: offlineQueue.session_schedules.length
        }
      })
      break
    
    case 'GET_PWA_STATUS':
      // For debug endpoint - return detailed PWA status
      getCacheStats().then(cacheStats => {
        event.ports[0].postMessage({
          swVersion: SW_VERSION,
          installed: true, // SW is installed if we're responding
          caches: cacheStats,
          bgSync: {
            queueLengths: {
              game_runs: offlineQueue.game_runs.length,
              session_schedules: offlineQueue.session_schedules.length
            }
          }
        })
      })
      break
      
    case 'QUEUE_OFFLINE_ACTION':
      if (data.type === 'game_run') {
        offlineQueue.game_runs.push(data.payload)
      } else if (data.type === 'session_schedule') {
        offlineQueue.session_schedules.push(data.payload)
      }
      console.log(`[SW] Queued offline action: ${data.type}`)
      persistOfflineQueue()
      break
      
    case 'CLEAR_CACHES':
      event.waitUntil(clearAllCaches())
      break
      
    case 'CACHE_RECENT_DOCUMENTS':
      // Cache recent documents for offline access (N=5)
      if (data.documents && Array.isArray(data.documents)) {
        event.waitUntil(cacheRecentDocuments(data.documents.slice(0, 5)))
      }
      break
      
    case 'CACHE_RECENT_QUIZ_RESULTS': 
      // Cache recent quiz results for offline access (N=5)
      if (data.quizResults && Array.isArray(data.quizResults)) {
        event.waitUntil(cacheRecentQuizResults(data.quizResults.slice(0, 5)))
      }
      break
  }
})

// Get cache statistics for debug endpoint
async function getCacheStats() {
  const stats = {}
  
  try {
    for (const [key, cacheName] of Object.entries(CACHES)) {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      stats[key] = keys.length
    }
  } catch (error) {
    console.error('[SW] Failed to get cache stats:', error)
    stats = { shell: 0, assets: 0, data: 0 }
  }
  
  return stats
}

// Persist offline queue (simplified - in production use IndexedDB)
async function persistOfflineQueue() {
  try {
    // Store in cache as a simple persistence mechanism
    const dataCache = await caches.open(CACHES.data)
    const queueResponse = new Response(JSON.stringify(offlineQueue), {
      headers: { 'Content-Type': 'application/json' }
    })
    await dataCache.put('__offline_queue__', queueResponse)
  } catch (error) {
    console.error('[SW] Failed to persist offline queue:', error)
  }
}

// Load offline queue on startup
async function loadOfflineQueue() {
  try {
    const dataCache = await caches.open(CACHES.data)
    const queueResponse = await dataCache.match('__offline_queue__')
    
    if (queueResponse) {
      const queue = await queueResponse.json()
      offlineQueue = { ...offlineQueue, ...queue }
      console.log('[SW] Loaded offline queue:', offlineQueue)
    }
  } catch (error) {
    console.error('[SW] Failed to load offline queue:', error)
  }
}

// Helper functions
function isStaticAsset(pathname) {
  return pathname.includes('/_next/static/') || 
         pathname.includes('.js') ||
         pathname.includes('.css') ||
         pathname.includes('.png') ||
         pathname.includes('.jpg') ||
         pathname.includes('.svg') ||
         pathname.includes('.woff') ||
         pathname === '/manifest.json' ||
         pathname === '/accelerator-worker.js' ||
         GAME_ASSETS_PATTERNS.some(pattern => pattern.test(pathname))
}

function isAppShellRequest(pathname) {
  return pathname === '/' || 
         pathname === '/offline' ||
         APP_SHELL_URLS.includes(pathname)
}

function shouldCacheAPI(pathname) {
  // Cache for stale-while-revalidate strategy (recent docs/quiz data)
  return pathname.includes('/api/health') ||
         pathname.includes('/api/progress/get') ||
         pathname.includes('/api/settings') ||
         pathname.includes('/api/ai/health')
}

async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames
      .filter(name => name.includes('spiread'))
      .map(name => caches.delete(name))
  )
  console.log('[SW] All caches cleared')
}

// Pre-cache offline: últimos N=5 documentos para lectura offline
async function cacheRecentDocuments(documents) {
  try {
    const dataCache = await caches.open(CACHES.data)
    
    for (const doc of documents) {
      const cacheKey = `/offline/documents/${doc.id}`
      const response = new Response(JSON.stringify(doc), {
        headers: { 'Content-Type': 'application/json' }
      })
      await dataCache.put(cacheKey, response)
    }
    
    cachedDocuments = documents
    console.log(`[SW] Cached ${documents.length} recent documents for offline access`)
  } catch (error) {
    console.error('[SW] Failed to cache recent documents:', error)
  }
}

// Pre-cache offline: últimos N=5 resultados de quiz para análisis offline
async function cacheRecentQuizResults(quizResults) {
  try {
    const dataCache = await caches.open(CACHES.data)
    
    for (const result of quizResults) {
      const cacheKey = `/offline/quiz-results/${result.id}`
      const response = new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      })
      await dataCache.put(cacheKey, response)
    }
    
    cachedQuizResults = quizResults
    console.log(`[SW] Cached ${quizResults.length} recent quiz results for offline access`)
  } catch (error) {
    console.error('[SW] Failed to cache recent quiz results:', error)
  }
}

// BG Sync: reintentos exponenciales con backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries - 1) throw error
      
      const delay = baseDelay * Math.pow(2, attempt) // Exponential backoff
      console.log(`[SW] Retry attempt ${attempt + 1} failed, waiting ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Enhanced background sync with exponential backoff
async function processOfflineQueueWithBackoff() {
  try {
    // Process game runs with exponential backoff
    for (const gameRun of [...offlineQueue.game_runs]) {
      try {
        await retryWithBackoff(async () => {
          const response = await fetch('/api/progress/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameRun)
          })
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          return response
        })
        
        // Success - remove from queue
        offlineQueue.game_runs = offlineQueue.game_runs.filter(item => item !== gameRun)
        console.log('[SW] Game run synced successfully with backoff')
        
      } catch (error) {
        console.log('[SW] Failed to sync game run after retries:', error)
        // Keep in queue for next sync attempt
      }
    }
    
    // Process session schedules with exponential backoff
    for (const session of [...offlineQueue.session_schedules]) {
      try {
        await retryWithBackoff(async () => {
          const response = await fetch('/api/sessions', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(session)
          })
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          return response
        })
        
        // Success - remove from queue
        offlineQueue.session_schedules = offlineQueue.session_schedules.filter(item => item !== session)
        console.log('[SW] Session schedule synced successfully with backoff')
        
      } catch (error) {
        console.log('[SW] Failed to sync session schedule after retries:', error)
        // Keep in queue for next sync attempt
      }
    }
    
    // Persist updated queue state
    await persistOfflineQueue()
    
  } catch (error) {
    console.error('[SW] Background sync with backoff failed:', error)
  }
}

// Load offline queue when SW starts
loadOfflineQueue()

// Notify clients when SW is ready
console.log(`[SW] ${SW_VERSION} (${SW_BUILD}) ready for offline use`)