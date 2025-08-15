// Spiread Service Worker v1.0.0-rc.1
// PWA Support with Offline Functionality, Background Sync, and Smart Caching

const SW_VERSION = 'spiread-v1'
const SW_BUILD = '1.0.0-rc.1'

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

// Game assets - ensure all 9 games work offline
const GAME_ASSETS = [
  // Core game components will be cached dynamically
  // as they are accessed
]

// API endpoints to cache (with stale-while-revalidate)
const CACHE_API_PATTERNS = [
  /^\/api\/health$/,
  /^\/api\/ai\/health$/,
  /^\/api\/progress\/get$/,
  /^\/api\/settings$/
]

// Offline queue for background sync
let offlineQueue = {
  gameRuns: [],
  sessionSchedules: [],
  settings: []
}

// Install event - precache app shell and critical assets
self.addEventListener('install', event => {
  console.log(`[SW] Installing ${SW_VERSION} (${SW_BUILD})...`)
  
  event.waitUntil(
    (async () => {
      try {
        // Cache app shell
        const shellCache = await caches.open(CACHES.shell)
        await shellCache.addAll(APP_SHELL_URLS)
        
        console.log(`[SW] ${SW_VERSION} installed successfully`)
        
        // Force activation to clean old caches
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
        // Clean up old caches
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames
            .filter(name => !name.startsWith(SW_VERSION) && name.includes('spiread'))
            .map(name => {
              console.log(`[SW] Deleting old cache: ${name}`)
              return caches.delete(name)
            })
        )
        
        // Claim all clients immediately
        await self.clients.claim()
        
        console.log(`[SW] ${SW_VERSION} activated and ready`)
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
    
    // Cache successful responses for offline use
    if (networkResponse.ok && shouldCacheAPI(url.pathname)) {
      const cache = await caches.open(CACHES.api)
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

// Background Sync - handle offline actions
self.addEventListener('sync', event => {
  console.log(`[SW] Background sync triggered: ${event.tag}`)
  
  if (event.tag === 'background-sync-spiread') {
    event.waitUntil(processOfflineQueue())
  }
})

// Process offline queue with exponential backoff
async function processOfflineQueue() {
  try {
    // Process game runs
    for (const gameRun of offlineQueue.gameRuns) {
      try {
        const response = await fetch('/api/progress/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameRun)
        })
        
        if (response.ok) {
          offlineQueue.gameRuns = offlineQueue.gameRuns.filter(item => item !== gameRun)
          console.log('[SW] Game run synced successfully')
        }
      } catch (error) {
        console.log('[SW] Failed to sync game run:', error)
      }
    }
    
    // Process session schedules
    for (const session of offlineQueue.sessionSchedules) {
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(session)
        })
        
        if (response.ok) {
          offlineQueue.sessionSchedules = offlineQueue.sessionSchedules.filter(item => item !== session)
          console.log('[SW] Session schedule synced successfully')
        }
      } catch (error) {
        console.log('[SW] Failed to sync session schedule:', error)
      }
    }
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Message handler - communicate with main thread
self.addEventListener('message', event => {
  const { action, data } = event.data
  
  switch (action) {
    case 'GET_SW_STATUS':
      event.ports[0].postMessage({
        version: SW_VERSION,
        build: SW_BUILD,
        caches: Object.keys(CACHES),
        queueLengths: {
          gameRuns: offlineQueue.gameRuns.length,
          sessionSchedules: offlineQueue.sessionSchedules.length
        }
      })
      break
      
    case 'QUEUE_OFFLINE_ACTION':
      if (data.type === 'game_run') {
        offlineQueue.gameRuns.push(data.payload)
      } else if (data.type === 'session_schedule') {
        offlineQueue.sessionSchedules.push(data.payload)
      }
      console.log(`[SW] Queued offline action: ${data.type}`)
      break
      
    case 'CLEAR_CACHES':
      event.waitUntil(clearAllCaches())
      break
  }
})

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
         pathname === '/accelerator-worker.js'
}

function isAppShellRequest(pathname) {
  return pathname === '/' || 
         pathname === '/offline' ||
         APP_SHELL_URLS.includes(pathname)
}

function shouldCacheAPI(pathname) {
  return CACHE_API_PATTERNS.some(pattern => pattern.test(pathname))
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

// Notify clients when SW is ready
self.addEventListener('ready', () => {
  console.log(`[SW] ${SW_VERSION} (${SW_BUILD}) ready for offline use`)
})
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(CACHES.static).then(cache => {
        console.log('[SW] Caching static files')
        return cache.addAll(STATIC_CACHE_URLS)
      }),
      // Initialize other caches
      caches.open(CACHES.dynamic),
      caches.open(CACHES.documents),
      caches.open(CACHES.gameData),
      caches.open(CACHES.apiCache)
    ]).then(() => {
      console.log('[SW] Service worker installed successfully')
      self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!Object.values(CACHES).includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] Service worker activated')
      self.clients.claim()
    })
  )
})

// Fetch event - network-first with cache fallback
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return handleNonGetRequest(event)
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request))
  } else if (isDocumentRequest(url)) {
    event.respondWith(handleDocumentRequest(request))
  } else {
    event.respondWith(handleDynamicRequest(request))
  }
})

// Handle API requests with cache-first for specific endpoints
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  try {
    // For game progress and settings - try cache first, then network
    if (url.pathname.includes('/progress/get') || url.pathname.includes('/settings')) {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        // Try to update in background
        fetch(request).then(response => {
          if (response.ok) {
            caches.open(CACHES.apiCache).then(cache => {
              cache.put(request, response.clone())
            })
          }
        }).catch(() => {})
        
        return cachedResponse
      }
    }

    // Network first for most API requests
    const response = await fetch(request)
    
    if (response.ok) {
      // Cache successful responses for offline access
      if (shouldCacheApiResponse(url)) {
        const cache = await caches.open(CACHES.apiCache)
        cache.put(request, response.clone())
      }
    }
    
    return response
  } catch (error) {
    console.log('[SW] API request failed, trying cache:', error)
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for critical endpoints
    return new Response(
      JSON.stringify({ 
        error: 'offline', 
        message: 'Request failed and no cached version available',
        timestamp: Date.now()
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle static assets - cache first
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHES.static)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.log('[SW] Static asset failed:', error)
    return new Response('Asset not available offline', { status: 404 })
  }
}

// Handle document/page requests - network first with offline fallback
async function handleDocumentRequest(request) {
  try {
    const response = await fetch(request)
    
    // Cache successful page responses
    if (response.ok) {
      const cache = await caches.open(CACHES.dynamic)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('[SW] Document request failed, trying cache:', error)
    
    // Try cached version
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback to offline page
    return caches.match(OFFLINE_URL) || new Response('Offline', { status: 503 })
  }
}

// Handle dynamic requests - network first
async function handleDynamicRequest(request) {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(CACHES.dynamic)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Not available offline', { status: 503 })
  }
}

// Handle non-GET requests (POST, PUT, etc.)
function handleNonGetRequest(event) {
  const { request } = event
  
  // For game runs, progress updates, etc. - queue for background sync if offline
  if (request.method === 'POST' || request.method === 'PUT') {
    event.respondWith(
      fetch(request).catch(async error => {
        console.log('[SW] POST request failed, queuing for sync:', error)
        
        // Queue the request for background sync
        const body = await request.text()
        syncQueue.push({
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: body,
          timestamp: Date.now()
        })
        
        // Store queue in IndexedDB or localStorage
        await storeOfflineActions(syncQueue)
        
        // Return success response so app continues working
        return new Response(
          JSON.stringify({ 
            success: true, 
            queued: true,
            message: 'Action queued for sync when online' 
          }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      })
    )
  }
}

// Background sync for queued actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered')
    event.waitUntil(syncQueuedActions())
  }
})

// Sync queued actions when back online
async function syncQueuedActions() {
  try {
    const queue = await getStoredOfflineActions()
    
    for (const action of queue) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        })
        
        if (response.ok) {
          console.log('[SW] Synced action:', action.url)
          // Remove from queue
          syncQueue = syncQueue.filter(item => item.timestamp !== action.timestamp)
        }
      } catch (error) {
        console.error('[SW] Failed to sync action:', error)
      }
    }
    
    // Update stored queue
    await storeOfflineActions(syncQueue)
    
    // Notify clients about sync completion
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ 
          type: 'SYNC_COMPLETE',
          synced: queue.length - syncQueue.length,
          remaining: syncQueue.length 
        })
      })
    })
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Helper functions
function isStaticAsset(url) {
  return url.pathname.includes('/static/') || 
         url.pathname.includes('/_next/') ||
         url.pathname.includes('/icons/') ||
         url.pathname.includes('/images/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.jpeg') ||
         url.pathname.endsWith('.svg')
}

function isDocumentRequest(url) {
  return url.pathname === '/' || 
         (!url.pathname.includes('.') && !url.pathname.startsWith('/api/'))
}

function shouldCacheApiResponse(url) {
  // Cache responses for settings, progress, and non-sensitive data
  return url.pathname.includes('/progress/get') ||
         url.pathname.includes('/settings') ||
         url.pathname.includes('/ai/health')
}

// Store offline actions (simplified - in production use IndexedDB)
async function storeOfflineActions(actions) {
  try {
    // For now use a simple approach - in production, use IndexedDB
    self.localStorage?.setItem('spiread_offline_queue', JSON.stringify(actions))
  } catch (error) {
    console.error('[SW] Failed to store offline actions:', error)
  }
}

async function getStoredOfflineActions() {
  try {
    const stored = self.localStorage?.getItem('spiread_offline_queue')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('[SW] Failed to get stored actions:', error)
    return []
  }
}

// Handle messages from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_DOCUMENTS') {
    // Cache recent documents for offline access
    cacheUserDocuments(event.data.documents)
  }
})

// Cache user documents for offline reading
async function cacheUserDocuments(documents) {
  try {
    const cache = await caches.open(CACHES.documents)
    
    for (const doc of documents) {
      const cacheKey = `/documents/${doc.id}`
      const response = new Response(JSON.stringify(doc), {
        headers: { 'Content-Type': 'application/json' }
      })
      await cache.put(cacheKey, response)
    }
    
    console.log('[SW] Cached documents for offline access:', documents.length)
  } catch (error) {
    console.error('[SW] Failed to cache documents:', error)
  }
}

// Register for background sync
self.addEventListener('online', () => {
  console.log('[SW] Back online, triggering sync')
  self.registration.sync.register('background-sync')
})