'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Timer, Home, BarChart3, Settings, Pause, Play, SkipForward } from 'lucide-react'

/**
 * SessionShell - Unified mobile-first wrapper for all games
 * Provides consistent single-column layout, countdown, safe areas
 */
export default function SessionShell({
  children,
  gameTitle,
  gameConfig,
  level,
  timeLimit = 120, // 2 minutes default
  onComplete,
  onExit,
  onBackToGames,
  onViewStats,
  className = ''
}) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [ready, setReady] = useState(false)
  
  const gameTimer = useRef(null)
  const lastTimestamp = useRef(null)
  const sessionStartTime = useRef(null)

  // Mobile-first initialization
  useEffect(() => {
    // Immediate client-side ready flag to prevent SSR issues
    setReady(true)
    
    // Handle visibility changes for mobile apps
    const handleVisibilityChange = () => {
      if (document.hidden && sessionStarted) {
        setIsPaused(true)
      } else if (!document.hidden && sessionStarted) {
        setIsPaused(false)
        lastTimestamp.current = Date.now() // Reset timestamp after pause
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [sessionStarted])

  // Game timer with mobile-optimized performance
  useEffect(() => {
    if (!sessionStarted || !ready) return

    lastTimestamp.current = Date.now()
    sessionStartTime.current = Date.now()

    gameTimer.current = setInterval(() => {
      if (isPaused) return

      const now = Date.now()
      const delta = Math.max(0, Math.min(200, now - lastTimestamp.current)) // Clamp delta
      lastTimestamp.current = now

      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - delta)
        if (newTime === 0 && onComplete) {
          onComplete({
            totalTime: timeLimit,
            sessionDuration: now - sessionStartTime.current,
            completed: false
          })
        }
        return newTime
      })
    }, 50) // 50ms for smooth mobile countdown

    return () => {
      if (gameTimer.current) {
        clearInterval(gameTimer.current)
      }
    }
  }, [sessionStarted, isPaused, ready, timeLimit, onComplete])

  const startSession = () => {
    if (!ready) return
    setSessionStarted(true)
    setTimeRemaining(timeLimit)
  }

  const togglePause = () => {
    setIsPaused(prev => {
      if (!prev) {
        // Pausing - record timestamp
        lastTimestamp.current = Date.now()
      } else {
        // Resuming - reset timestamp
        lastTimestamp.current = Date.now()
      }
      return !prev
    })
  }

  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Mobile-first responsive classes
  const containerClasses = [
    'w-full',
    'max-w-[480px]', // Mobile-first max width
    'mx-auto',
    'min-h-screen',
    'flex',
    'flex-col',
    'bg-gradient-to-br from-blue-50 to-indigo-100',
    'relative',
    className
  ].join(' ')

  return (
    <div className={containerClasses}>
      {/* Fixed Header - Single Column */}
      <motion.header 
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="px-4 py-3 flex items-center justify-between min-h-[64px]">
          {/* Left: Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToGames}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Home className="h-4 w-4" />
            <span className="text-sm font-medium">Juegos</span>
          </Button>

          {/* Center: Game info */}
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {gameTitle}
            </h1>
            {level && (
              <Badge variant="secondary" className="text-xs mt-1">
                Nivel {level}
              </Badge>
            )}
          </div>

          {/* Right: Timer */}
          <div className="flex items-center gap-2">
            {sessionStarted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePause}
                className="p-2"
              >
                {isPaused ? (
                  <Play className="h-4 w-4 text-green-600" />
                ) : (
                  <Pause className="h-4 w-4 text-blue-600" />
                )}
              </Button>
            )}
            <div className="flex items-center gap-1 text-sm font-mono">
              <Timer className="h-4 w-4 text-gray-500" />
              <span className={`font-bold ${timeRemaining < 30000 ? 'text-red-500' : 'text-gray-700'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {sessionStarted && (
          <div className="px-4 pb-2">
            <Progress 
              value={(timeRemaining / timeLimit) * 100} 
              className="h-1"
            />
          </div>
        )}
      </motion.header>

      {/* Main Content - Single Column with Safe Areas */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 pb-safe-bottom">
          {!sessionStarted ? (
            /* Start Screen */
            <Card className="mt-8">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {gameTitle}
                </CardTitle>
                {gameConfig?.description && (
                  <p className="text-gray-600 mt-2">
                    {gameConfig.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Game config display */}
                {gameConfig && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">Nivel</div>
                      <div className="text-blue-600">{level}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">Tiempo</div>
                      <div className="text-blue-600">{Math.round(timeLimit / 1000)}s</div>
                    </div>
                  </div>
                )}

                {/* Start button - Mobile optimized */}
                <Button
                  onClick={startSession}
                  disabled={!ready}
                  className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                >
                  {ready ? 'Comenzar Juego' : 'Preparando...'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Game Content */
            <div className="space-y-4">
              {/* Pause overlay */}
              <AnimatePresence>
                {isPaused && (
                  <motion.div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card className="mx-4 max-w-sm">
                      <CardContent className="p-6 text-center space-y-4">
                        <div className="text-xl font-bold text-gray-900">
                          Juego Pausado
                        </div>
                        <p className="text-gray-600">
                          Toca el botón de play para continuar
                        </p>
                        <Button
                          onClick={togglePause}
                          className="w-full"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Continuar
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Game component with props */}
              {ready && (
                <div className="min-h-[calc(100vh-200px)]">
                  {children && typeof children === 'function' 
                    ? children({ 
                        timeRemaining, 
                        isPaused, 
                        sessionStarted, 
                        ready,
                        onComplete: (results) => {
                          setSessionStarted(false)
                          if (onComplete) onComplete(results)
                        }
                      })
                    : children
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom CTA - Safe Area Support */}
      {sessionStarted && (
        <motion.footer 
          className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t p-4 pb-safe-bottom"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onViewStats}
              className="flex-1 min-h-[48px]"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Estadísticas
            </Button>
            <Button
              variant="outline"
              onClick={onExit}
              className="flex-1 min-h-[48px]"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          </div>
        </motion.footer>
      )}
    </div>
  )
}
