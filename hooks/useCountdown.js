import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useCountdown - Mobile-optimized countdown hook with visibility pause
 * Designed for games that need precise timing with mobile app lifecycle support
 */
export function useCountdown(initialTime = 60000, options = {}) {
  const {
    onComplete,
    onTick,
    interval = 50, // 50ms for smooth mobile updates
    autoStart = false,
    pauseOnVisibilityChange = true
  } = options

  const [timeRemaining, setTimeRemaining] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [ready, setReady] = useState(false)

  const timerRef = useRef(null)
  const lastTimestamp = useRef(null)
  const startTime = useRef(null)

  // Client-side ready flag
  useEffect(() => {
    setReady(true)
  }, [])

  // Visibility change handler for mobile apps
  useEffect(() => {
    if (!pauseOnVisibilityChange) return

    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        setIsPaused(true)
      } else if (!document.hidden && isRunning && isPaused) {
        setIsPaused(false)
        lastTimestamp.current = Date.now() // Reset timestamp after pause
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isRunning, isPaused, pauseOnVisibilityChange])

  // Main timer effect
  useEffect(() => {
    if (!isRunning || !ready) return

    lastTimestamp.current = Date.now()

    timerRef.current = setInterval(() => {
      if (isPaused) return

      const now = Date.now()
      const delta = Math.max(0, Math.min(200, now - lastTimestamp.current)) // Clamp delta for mobile
      lastTimestamp.current = now

      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - delta)
        
        // Call onTick callback
        if (onTick) {
          onTick(newTime, delta)
        }

        // Handle completion
        if (newTime === 0 && prev > 0) {
          setIsRunning(false)
          if (onComplete) {
            onComplete({
              totalTime: initialTime,
              elapsedTime: startTime.current ? now - startTime.current : 0
            })
          }
        }

        return newTime
      })
    }, interval)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning, isPaused, ready, interval, onTick, onComplete, initialTime])

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && ready && !isRunning) {
      start()
    }
  }, [autoStart, ready, isRunning])

  const start = useCallback(() => {
    if (!ready) return
    
    setIsRunning(true)
    setIsPaused(false)
    startTime.current = Date.now()
    lastTimestamp.current = Date.now()
  }, [ready])

  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    if (isRunning) {
      setIsPaused(false)
      lastTimestamp.current = Date.now()
    }
  }, [isRunning])

  const reset = useCallback((newTime = initialTime) => {
    setTimeRemaining(newTime)
    setIsRunning(false)
    setIsPaused(false)
    startTime.current = null
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }, [initialTime])

  const addTime = useCallback((ms) => {
    setTimeRemaining(prev => prev + ms)
  }, [])

  const setTime = useCallback((ms) => {
    setTimeRemaining(ms)
  }, [])

  // Format time for display
  const formatTime = useCallback((ms = timeRemaining) => {
    const seconds = Math.ceil(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [timeRemaining])

  // Get progress percentage
  const getProgress = useCallback(() => {
    return ((timeRemaining / initialTime) * 100)
  }, [timeRemaining, initialTime])

  return {
    timeRemaining,
    isRunning,
    isPaused,
    ready,
    start,
    pause,
    resume,
    reset,
    addTime,
    setTime,
    formatTime,
    getProgress,
    // Computed values
    isComplete: timeRemaining === 0,
    elapsedTime: initialTime - timeRemaining,
    percentComplete: ((initialTime - timeRemaining) / initialTime) * 100
  }
}
