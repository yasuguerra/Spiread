'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Timer, Trophy, Target, Pause, Play, Square, ArrowLeft } from 'lucide-react'
import { useCountdown } from '@/hooks/useCountdown'
import { SessionSummary } from '@/lib/progress-tracking'

export type SessionState = 'idle' | 'running' | 'paused' | 'ended'

export interface SessionManagerProps {
  gameTitle: string
  durationSec: number
  currentScore: number
  currentLevel?: number
  maxScore?: number
  accuracy?: number
  children: ReactNode
  onSessionEnd: (summary: SessionSummary) => void
  onExit?: () => void
  autoStart?: boolean
  showAccuracy?: boolean
  showLevel?: boolean
  className?: string
}

export interface SummaryDialogProps {
  isOpen: boolean
  onClose: () => void
  onRestart: () => void
  onExit: () => void
  summary: SessionSummary | null
  gameTitle: string
}

export function SummaryDialog({
  isOpen,
  onClose,
  onRestart,
  onExit,
  summary,
  gameTitle
}: SummaryDialogProps) {
  if (!summary) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPerformanceColor = (accuracy?: number) => {
    if (!accuracy) return 'text-muted-foreground'
    if (accuracy >= 0.9) return 'text-green-600'
    if (accuracy >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Sesión Completada
          </DialogTitle>
          <DialogDescription>
            Resumen de tu sesión de {gameTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Score */}
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{summary.score}</div>
            <div className="text-sm text-muted-foreground">Puntuación Final</div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {summary.level && (
              <div className="text-center p-3 border rounded-lg">
                <div className="text-lg font-semibold">{summary.level}</div>
                <div className="text-xs text-muted-foreground">Nivel</div>
              </div>
            )}
            
            <div className="text-center p-3 border rounded-lg">
              <div className="text-lg font-semibold">{formatTime(Math.round(summary.durationSec))}</div>
              <div className="text-xs text-muted-foreground">Tiempo</div>
            </div>

            {summary.accuracy !== undefined && (
              <div className="text-center p-3 border rounded-lg">
                <div className={`text-lg font-semibold ${getPerformanceColor(summary.accuracy)}`}>
                  {Math.round(summary.accuracy * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Precisión</div>
              </div>
            )}

            {summary.streak && (
              <div className="text-center p-3 border rounded-lg">
                <div className="text-lg font-semibold text-orange-600">{summary.streak}</div>
                <div className="text-xs text-muted-foreground">Mejor Racha</div>
              </div>
            )}
          </div>

          {/* Performance Message */}
          {summary.accuracy !== undefined && (
            <div className="text-center text-sm">
              {summary.accuracy >= 0.9 && (
                <span className="text-green-600">¡Excelente precisión! 🎯</span>
              )}
              {summary.accuracy >= 0.7 && summary.accuracy < 0.9 && (
                <span className="text-yellow-600">¡Buen trabajo! 👍</span>
              )}
              {summary.accuracy < 0.7 && (
                <span className="text-red-600">Sigue practicando 💪</span>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onExit} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Salir
          </Button>
          <Button onClick={onRestart} className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Jugar de Nuevo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function SessionManager({
  gameTitle,
  durationSec,
  currentScore,
  currentLevel,
  maxScore,
  accuracy,
  children,
  onSessionEnd,
  onExit,
  autoStart = false,
  showAccuracy = false,
  showLevel = false,
  className = ''
}: SessionManagerProps) {
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [showSummary, setShowSummary] = useState(false)
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [inputBlocked, setInputBlocked] = useState(false)

  const countdown = useCountdown({
    durationSec,
    autostart: autoStart,
    onTick: (timeLeft) => {
      // Optionally handle tick events
    },
    onEnd: handleSessionEnd,
    syncVisibility: true
  })

  function handleSessionEnd() {
    if (sessionState === 'ended') return // Prevent double-ending
    
    setSessionState('ended')
    setInputBlocked(true)
    
    const endTime = Date.now()
    const actualDuration = sessionStartTime ? (endTime - sessionStartTime) / 1000 : durationSec
    
    const summary: SessionSummary = {
      gameId: '', // Will be set by the individual game
      score: currentScore,
      level: currentLevel,
      accuracy: accuracy,
      durationSec: actualDuration,
      timestamp: endTime,
      extras: {}
    }
    
    setSessionSummary(summary)
    onSessionEnd(summary)
    setShowSummary(true)
  }

  const handleStart = useCallback(() => {
    setSessionState('running')
    setSessionStartTime(Date.now())
    setInputBlocked(false)
    countdown.start()
  }, [countdown])

  const handlePause = useCallback(() => {
    if (sessionState !== 'running') return
    setSessionState('paused')
    setInputBlocked(true)
    countdown.pause()
  }, [sessionState, countdown])

  const handleResume = useCallback(() => {
    if (sessionState !== 'paused') return
    setSessionState('running')
    setInputBlocked(false)
    countdown.resume()
  }, [sessionState, countdown])

  const handleStop = useCallback(() => {
    countdown.stop()
    handleSessionEnd()
  }, [countdown])

  const handleRestart = useCallback(() => {
    setSessionState('idle')
    setShowSummary(false)
    setSessionSummary(null)
    setSessionStartTime(null)
    setInputBlocked(false)
    countdown.reset()
  }, [countdown])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent keyboard controls if input is focused or game is ended
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (sessionState === 'ended') return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          if (sessionState === 'idle' || sessionState === 'paused') {
            if (sessionState === 'idle') {
              handleStart()
            } else {
              handleResume()
            }
          } else if (sessionState === 'running') {
            handlePause()
          }
          break
        
        case 'Escape':
          e.preventDefault()
          if (sessionState === 'running' || sessionState === 'paused') {
            handleStop()
          } else {
            onExit?.()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [sessionState, handleStart, handlePause, handleResume, handleStop, onExit])

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && sessionState === 'idle') {
      handleStart()
    }
  }, [autoStart, sessionState, handleStart])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    const progress = (countdown.timeLeft / durationSec) * 100
    if (progress <= 10) return 'text-red-600'
    if (progress <= 25) return 'text-yellow-600'
    return 'text-foreground'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Session Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">{gameTitle}</h2>
              {showLevel && currentLevel && (
                <Badge variant="secondary">Nivel {currentLevel}</Badge>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className="flex items-center gap-2">
                <Timer className={`w-4 h-4 ${getTimerColor()}`} />
                <span className={`font-mono text-lg ${getTimerColor()}`}>
                  {formatTime(countdown.timeLeft)}
                </span>
              </div>

              {/* Score */}
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold">{currentScore}</span>
                {maxScore && <span className="text-muted-foreground">/ {maxScore}</span>}
              </div>

              {/* Accuracy */}
              {showAccuracy && accuracy !== undefined && (
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold">{Math.round(accuracy * 100)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Timer Progress Bar */}
          <div className="mt-2">
            <Progress 
              value={(countdown.timeLeft / durationSec) * 100} 
              className="h-2"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {sessionState === 'idle' && (
                <Button onClick={handleStart} size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar
                </Button>
              )}
              
              {sessionState === 'running' && (
                <Button onClick={handlePause} variant="outline" size="sm">
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
              )}
              
              {sessionState === 'paused' && (
                <Button onClick={handleResume} size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Continuar
                </Button>
              )}
              
              {(sessionState === 'running' || sessionState === 'paused') && (
                <Button onClick={handleStop} variant="destructive" size="sm">
                  <Square className="w-4 h-4 mr-2" />
                  Terminar
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              {sessionState === 'idle' && 'Presiona Espacio para iniciar'}
              {sessionState === 'paused' && 'Juego pausado - Espacio para continuar'}
              {sessionState === 'running' && 'Espacio: pausar • Esc: terminar'}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Game Content */}
      <div className={`${inputBlocked ? 'pointer-events-none opacity-50' : ''}`}>
        {children}
      </div>

      {/* Summary Dialog */}
      <SummaryDialog
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        onRestart={handleRestart}
        onExit={() => {
          setShowSummary(false)
          onExit?.()
        }}
        summary={sessionSummary}
        gameTitle={gameTitle}
      />
    </div>
  )
}
