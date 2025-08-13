'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  Square, 
  Timer,
  Trophy,
  TrendingUp,
  Target,
  ArrowLeft
} from 'lucide-react'

import { GAME_STATES, AUTO_PAUSE_DELAY } from '@/lib/constants'
import { AdaptiveDifficulty } from '@/lib/adaptive-difficulty'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

export default function GameShell({ 
  gameId, 
  difficultyLevel = 3, 
  durationMs,
  onFinish,
  onExit,
  children 
}) {
  const [gameState, setGameState] = useState(GAME_STATES.IDLE)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [gameResults, setGameResults] = useState(null)
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(null)
  const [isTabVisible, setIsTabVisible] = useState(true)
  
  const timerRef = useRef(null)
  const pauseTimeoutRef = useRef(null)
  const { sessionId } = useAppStore()

  // Initialize adaptive difficulty
  useEffect(() => {
    const adaptive = new AdaptiveDifficulty(gameId, difficultyLevel)
    setAdaptiveDifficulty(adaptive)
  }, [gameId, difficultyLevel])

  // Tab visibility handling for auto-pause
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden
      setIsTabVisible(visible)
      
      if (!visible && gameState === GAME_STATES.PLAYING) {
        // Auto-pause after delay
        pauseTimeoutRef.current = setTimeout(() => {
          if (!document.hidden) return // Tab became visible again
          pauseGame('auto')
        }, AUTO_PAUSE_DELAY)
      } else if (visible && pauseTimeoutRef.current) {
        // Tab became visible, cancel auto-pause
        clearTimeout(pauseTimeoutRef.current)
        pauseTimeoutRef.current = null
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
    }
  }, [gameState])

  // Timer management
  useEffect(() => {
    if (gameState === GAME_STATES.PLAYING && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 100
          
          // Check if duration limit reached
          if (durationMs && newTime >= durationMs) {
            handleGameEnd({ reason: 'timeout' })
            return durationMs
          }
          
          return newTime
        })
      }, 100)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current) 
      }
    }
  }, [gameState, isPaused, durationMs])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (gameState === GAME_STATES.PLAYING) {
            togglePause()
          } else if (gameState === GAME_STATES.IDLE) {
            startGame()
          }
          break
        case 'Escape':
          e.preventDefault()
          if (onExit) {
            onExit()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, onExit])

  const startGame = () => {
    setGameState(GAME_STATES.PLAYING)
    setStartTime(Date.now())
    setTimeElapsed(0)
    setIsPaused(false)
    setGameResults(null)
  }

  const pauseGame = (reason = 'manual') => {
    setIsPaused(true)
    setGameState(GAME_STATES.PAUSED)
  }

  const resumeGame = () => {
    setIsPaused(false)
    setGameState(GAME_STATES.PLAYING)
  }

  const togglePause = () => {
    if (isPaused) {
      resumeGame()
    } else {
      pauseGame()
    }
  }

  const stopGame = () => {
    handleGameEnd({ reason: 'manual_stop' })
  }

  const handleGameEnd = async (endData = {}) => {
    const now = Date.now()
    setEndTime(now)
    setGameState(GAME_STATES.SUMMARY)
    
    const results = {
      gameId,
      startTime,
      endTime: now,
      duration: timeElapsed,
      difficultyLevel: adaptiveDifficulty?.currentLevel || difficultyLevel,
      adaptiveStats: adaptiveDifficulty?.getStats(),
      ...endData
    }
    
    setGameResults(results)
    
    // Save to database
    await saveGameRun(results)
    
    // Notify parent
    if (onFinish) {
      onFinish(results)
    }
  }

  const saveGameRun = async (results) => {
    try {
      await supabase.from('gameRuns').insert({
        id: `gr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: sessionId,
        game: gameId,
        difficultyLevel: results.difficultyLevel,
        durationMs: results.duration,
        score: results.score || 0,
        metrics: results.metrics || {},
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error saving game run:', error)
    }
  }

  // Record trial in adaptive difficulty system
  const recordTrial = (success, responseTime = null, metadata = {}) => {
    if (!adaptiveDifficulty) return

    const result = adaptiveDifficulty.recordTrial(success, responseTime, metadata)
    
    if (result.levelChanged) {
      console.log(`Difficulty adjusted: ${result.oldLevel} → ${result.newLevel} (${result.reason})`)
    }
    
    return result
  }

  // Get current game parameters based on adaptive difficulty
  const getGameParameters = () => {
    return adaptiveDifficulty?.getGameParameters() || {}
  }

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return minutes > 0 ? `${minutes}:${(seconds % 60).toString().padStart(2, '0')}` : `${seconds}s`
  }

  const progress = durationMs ? (timeElapsed / durationMs) * 100 : 0

  // Game shell context to pass to children
  const gameContext = {
    gameState,
    timeElapsed,
    isPaused,
    isTabVisible,
    adaptiveDifficulty,
    startGame,
    pauseGame,
    resumeGame,
    stopGame,
    handleGameEnd,
    recordTrial,
    getGameParameters
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Game Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5" />
                {gameId.charAt(0).toUpperCase() + gameId.slice(1).replace('_', ' ')}
              </CardTitle>
              {onExit && (
                <Button size="sm" variant="outline" onClick={onExit}>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Salir
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Nivel {adaptiveDifficulty?.currentLevel || difficultyLevel}
              </Badge>
              <Badge variant="secondary">
                {formatTime(timeElapsed)}
              </Badge>
              {gameState === GAME_STATES.PAUSED && (
                <Badge variant="destructive">
                  PAUSADO
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        {(durationMs || adaptiveDifficulty) && (
          <CardContent>
            <div className="space-y-4">
              {durationMs && (
                <>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progreso: {formatTime(timeElapsed)} / {formatTime(durationMs)}</span>
                    <span>{Math.round(progress)}% completado</span>
                  </div>
                </>
              )}
              
              {adaptiveDifficulty && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-lg">{adaptiveDifficulty.getStats().recentAccuracy * 100}%</div>
                    <div className="text-muted-foreground">Precision</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{adaptiveDifficulty.getStats().consecutiveSuccesses}</div>
                    <div className="text-muted-foreground">Racha</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{adaptiveDifficulty.getStats().totalTrials}</div>
                    <div className="text-muted-foreground">Intentos</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{adaptiveDifficulty.getStats().avgResponseTime}ms</div>
                    <div className="text-muted-foreground">Tiempo</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Game Content */}
      <AnimatePresence mode="wait">
        {gameState === GAME_STATES.IDLE && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="p-12 text-center">
                <div className="space-y-6">
                  <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <Play className="w-10 h-10 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">¿Listo para entrenar?</h2>
                    <p className="text-muted-foreground">
                      {durationMs 
                        ? `Sesión de ${formatTime(durationMs)} a nivel ${adaptiveDifficulty?.currentLevel || difficultyLevel}`
                        : `Entrenamiento adaptativo a nivel ${adaptiveDifficulty?.currentLevel || difficultyLevel}`
                      }
                    </p>
                  </div>
                  <Button onClick={startGame} size="lg">
                    <Play className="w-4 h-4 mr-2" />
                    Comenzar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {(gameState === GAME_STATES.PLAYING || gameState === GAME_STATES.PAUSED) && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Game Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-center gap-2">
                  <Button 
                    onClick={togglePause}
                    disabled={gameState !== GAME_STATES.PLAYING && gameState !== GAME_STATES.PAUSED}
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Continuar
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pausar
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" onClick={stopGame}>
                    <Square className="w-4 h-4 mr-2" />
                    Terminar
                  </Button>
                </div>
                
                <div className="text-center text-xs text-muted-foreground mt-2">
                  Atajos: <kbd>Espacio</kbd> = Pausar | <kbd>Esc</kbd> = Salir
                </div>
              </CardContent>
            </Card>

            {/* Game Component with Context */}
            <div className={isPaused ? 'opacity-50 pointer-events-none' : ''}>
              {children(gameContext)}
            </div>
          </motion.div>
        )}

        {gameState === GAME_STATES.SUMMARY && gameResults && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Resumen de Sesión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {formatTime(gameResults.duration)}
                    </div>
                    <div className="text-sm text-muted-foreground">Duración</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {gameResults.score || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Puntuación</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {gameResults.difficultyLevel}
                    </div>
                    <div className="text-sm text-muted-foreground">Nivel Final</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {Math.round((gameResults.adaptiveStats?.recentAccuracy || 0) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Precisión</div>
                  </div>
                </div>

                {gameResults.adaptiveStats && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Progreso Adaptativo</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>• Total de intentos: {gameResults.adaptiveStats.totalTrials}</div>
                      <div>• Racha máxima: {gameResults.adaptiveStats.consecutiveSuccesses}</div>
                      <div>• Precisión general: {Math.round(gameResults.adaptiveStats.overallAccuracy * 100)}%</div>
                      <div>• Tiempo promedio: {gameResults.adaptiveStats.avgResponseTime}ms</div>
                    </div>
                  </div>
                )}

                <div className="flex justify-center gap-4">
                  <Button onClick={() => setGameState(GAME_STATES.IDLE)}>
                    <Target className="w-4 h-4 mr-2" />
                    Jugar de Nuevo
                  </Button>
                  {onExit && (
                    <Button variant="outline" onClick={onExit}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Ver Progreso
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}