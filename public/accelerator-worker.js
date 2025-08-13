// Accelerator Reading Web Worker
let chunks = []
let currentIndex = 0
let wpm = 250
let chunkSize = 1
let isRunning = false
let intervalId = null

// Message handling from main thread
self.addEventListener('message', function(e) {
  const { type, payload } = e.data
  
  switch (type) {
    case 'INIT':
      chunks = payload.chunks || []
      currentIndex = 0
      wpm = payload.wpm || 250
      chunkSize = payload.chunkSize || 1
      break
      
    case 'PLAY':
      if (!isRunning && chunks.length > 0) {
        startReading()
      }
      break
      
    case 'PAUSE':
      pauseReading()
      break
      
    case 'SEEK':
      currentIndex = Math.max(0, Math.min(chunks.length - 1, payload.index))
      if (isRunning) {
        sendTick()
      }
      break
      
    case 'SET_WPM':
      wpm = payload.wpm
      if (isRunning) {
        // Restart with new WPM
        pauseReading()
        startReading()
      }
      break
      
    case 'SET_CHUNK_SIZE':
      chunkSize = payload.chunkSize
      break
      
    default:
      console.warn('Unknown message type:', type)
  }
})

function startReading() {
  if (isRunning) return
  
  isRunning = true
  
  // Calculate interval based on WPM and chunk size
  const wordsPerSecond = wpm / 60
  const intervalMs = (1000 * chunkSize) / wordsPerSecond
  
  sendTick() // Send immediate tick
  
  intervalId = setInterval(() => {
    currentIndex++
    
    if (currentIndex >= chunks.length) {
      // Reading finished
      pauseReading()
      self.postMessage({ type: 'END' })
      return
    }
    
    sendTick()
  }, intervalMs)
}

function pauseReading() {
  isRunning = false
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function sendTick() {
  if (currentIndex < chunks.length) {
    const chunk = chunks[currentIndex]
    self.postMessage({
      type: 'TICK',
      payload: {
        index: currentIndex,
        chunk: chunk,
        progress: (currentIndex / chunks.length) * 100
      }
    })
  }
}

// Handle visibility change (when tab loses focus)
self.addEventListener('message', function(e) {
  if (e.data.type === 'VISIBILITY_CHANGE' && !e.data.payload.visible && isRunning) {
    // Auto-pause when tab is hidden for more than 2 seconds
    setTimeout(() => {
      if (!e.data.payload.visible && isRunning) {
        pauseReading()
        self.postMessage({ type: 'AUTO_PAUSED' })
      }
    }, 2000)
  }
})