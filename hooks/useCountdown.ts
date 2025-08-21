import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseCountdownOptions {
  durationSec: number
  autostart?: boolean
  onTick?: (timeLeft: number) => void
  onEnd?: () => void
  syncVisibility?: boolean
}

export interface CountdownState {
  timeLeft: number
  isRunning: boolean
  isPaused: boolean
  isEnded: boolean
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  stop: () => void
}

export function useCountdown({
  durationSec,
  autostart = false,
  onTick,
  onEnd,
  syncVisibility = true
}: UseCountdownOptions): CountdownState {
  const [timeLeft, setTimeLeft] = useState(durationSec * 1000) // Store in milliseconds for precision
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isEnded, setIsEnded] = useState(false)
  
  const startTimeRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number | null>(null)
  const pausedTimeRef = useRef<number>(0)

  // Handle visibility change for tab switching
  const handleVisibilityChange = useCallback(() => {
    if (!syncVisibility || !isRunning) return
    
    if (document.hidden) {
      // Tab is hidden - pause the timer
      if (!isPaused) {
        setIsPaused(true)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
      }
    } else {
      // Tab is visible - resume if we were running
      if (isPaused && isRunning) {
        setIsPaused(false)
        startTimeRef.current = performance.now() - pausedTimeRef.current
        requestFrame()
      }
    }
  }, [syncVisibility, isRunning, isPaused])

  // Main animation frame function
  const requestFrame = useCallback(() => {
    if (!isRunning || isPaused) return

    const updateTimer = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime
        lastUpdateRef.current = currentTime
      }

      const elapsed = currentTime - startTimeRef.current
      const remaining = Math.max(0, durationSec * 1000 - elapsed)
      
      // Clamp frame delta to avoid timer drift on slow tabs (max 100ms jump)
      const deltaTime = currentTime - (lastUpdateRef.current || currentTime)
      if (deltaTime > 100) {
        startTimeRef.current = currentTime - pausedTimeRef.current
      }
      
      lastUpdateRef.current = currentTime
      pausedTimeRef.current = elapsed
      
      setTimeLeft(remaining)
      onTick?.(Math.ceil(remaining / 1000)) // Call onTick with seconds

      if (remaining <= 0) {
        setIsEnded(true)
        setIsRunning(false)
        setIsPaused(false)
        onEnd?.()
        return
      }

      if (isRunning && !isPaused) {
        animationFrameRef.current = requestAnimationFrame(updateTimer)
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateTimer)
  }, [durationSec, isRunning, isPaused, onTick, onEnd])

  // Control functions
  const start = useCallback(() => {
    if (isEnded) return
    
    setIsRunning(true)
    setIsPaused(false)
    startTimeRef.current = null
    pausedTimeRef.current = 0
    requestFrame()
  }, [isEnded, requestFrame])

  const pause = useCallback(() => {
    if (!isRunning || isEnded) return
    
    setIsPaused(true)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [isRunning, isEnded])

  const resume = useCallback(() => {
    if (!isRunning || !isPaused || isEnded) return
    
    setIsPaused(false)
    if (startTimeRef.current && pausedTimeRef.current) {
      startTimeRef.current = performance.now() - pausedTimeRef.current
    }
    requestFrame()
  }, [isRunning, isPaused, isEnded, requestFrame])

  const reset = useCallback(() => {
    setTimeLeft(durationSec * 1000)
    setIsRunning(false)
    setIsPaused(false)
    setIsEnded(false)
    startTimeRef.current = null
    pausedTimeRef.current = 0
    lastUpdateRef.current = null
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [durationSec])

  const stop = useCallback(() => {
    setIsRunning(false)
    setIsPaused(false)
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  // Set up visibility change listener
  useEffect(() => {
    if (syncVisibility) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [handleVisibilityChange, syncVisibility])

  // Auto-start if requested
  useEffect(() => {
    if (autostart && !isRunning && !isEnded) {
      start()
    }
  }, [autostart, isRunning, isEnded, start])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Reset when duration changes
  useEffect(() => {
    reset()
  }, [durationSec, reset])

  return {
    timeLeft: Math.ceil(timeLeft / 1000), // Return seconds to consumers
    isRunning,
    isPaused,
    isEnded,
    start,
    pause,
    resume,
    reset,
    stop
  }
}
