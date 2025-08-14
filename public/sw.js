// Spiread Service Worker - PWA Support with Offline Functionality
// Version: 1.0.0

const CACHE_NAME = 'spiread-v1.0.0'
const OFFLINE_URL = '/offline'

// Files to cache for app shell
const STATIC_CACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/accelerator-worker.js',
  // Add other static assets as needed
]

// Dynamic cache names
const CACHES = {
  static: `${CACHE_NAME}-static`,
  dynamic: `${CACHE_NAME}-dynamic`,
  documents: `${CACHE_NAME}-documents`,
  gameData: `${CACHE_NAME}-game-data`,
  apiCache: `${CACHE_NAME}-api`
}

// Background sync queue for offline actions
let syncQueue = []

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...')
  
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