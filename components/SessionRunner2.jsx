'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Play, Pause, Square, SkipForward, Clock, 
  Target, CheckCircle, AlertCircle, ArrowLeft 
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

// Session Templates
const SESSION_TEMPLATES = {
  short: {
    id: 'short',
    title: 'Sesión Rápida',
    duration: 15,
    description: 'Calentamiento perfecto para comenzar el día',
    blocks: [
      { game: 'par_impar', duration: 2, title: 'Par/Impar' },
      { game: 'rsvp', duration: 5, title: 'Lectura RSVP' },
      { game: 'twin_words', duration: 4, title: 'Palabras Gemelas' },
      { game: 'schulte', duration: 4, title: 'Tabla Schulte' }
    ]
  },
  medium: {
    id: 'medium',
    title: 'Sesión Completa',
    duration: 30,
    description: 'Entrenamiento equilibrado para desarrollo cognitivo',
    blocks: [
      { game: 'par_impar', duration: 3, title: 'Par/Impar' },
      { game: 'rsvp', duration: 10, title: 'Lectura RSVP' },
      { game: 'word_search', duration: 7, title: 'Sopa de Letras' },
      { game: 'twin_words', duration: 5, title: 'Palabras Gemelas' },
      { game: 'schulte', duration: 5, title: 'Tabla Schulte' }
    ]
  },
  long: {
    id: 'long',
    title: 'Sesión Master',
    duration: 60,
    description: 'Entrenamiento intensivo completo',
    blocks: [
      { game: 'par_impar', duration: 5, title: 'Calentamiento' },
      { game: 'rsvp', duration: 20, title: 'Lectura Intensiva' },
      { game: 'running_words', duration: 10, title: 'Memoria Secuencial' },
      { game: 'letters_grid', duration: 10, title: 'Atención Visual' },
      { game: 'twin_words', duration: 10, title: 'Discriminación' },
      { game: 'cooldown', duration: 5, title: 'Resumen y Metas' }
    ]
  }
}

export default function SessionRunner2({ template, onExit, onComplete }) {
  const { userProfile } = useAppStore()
  const [sessionState, setSessionState] = useState('ready') // ready, running, paused, complete
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0)
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0)
  const [sessionTimeElapsed, setSessionTimeElapsed] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionData, setSessionData] = useState({
    sessionId: null,
    startTime: null,
    blocks: [],
    totalScore: 0,
    quits: 0,
    pausedMs: 0
  })
  const [gameProgress, setGameProgress] = useState({}) // Track levels for carry-over

  const sessionTemplate = SESSION_TEMPLATES[template]
  const timerRef = useRef(null)
  const pauseStartTime = useRef(null)
  const focusLostTime = useRef(null)

  // Initialize session
  useEffect(() => {
    if (sessionTemplate && userProfile?.id) {
      const sessionId = `session_${Date.now()}_${userProfile.id}`
      setSessionData(prev => ({
        ...prev,
        sessionId,
        startTime: new Date().toISOString(),
        blocks: sessionTemplate.blocks.map(block => ({
          ...block,
          status: 'pending',
          score: 0,
          levelStart: 1,
          levelEnd: 1,
          playedMs: 0,
          plannedMs: block.duration * 60 * 1000
        }))
      }))
      setBlockTimeRemaining(sessionTemplate.blocks[0].duration * 60 * 1000)
    }
  }, [sessionTemplate, userProfile])

  // Session timer
  useEffect(() => {
    if (sessionState === 'running' && !isPaused) {
      timerRef.current = setInterval(() => {
        setBlockTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1000)
          if (newTime === 0) {
            nextBlock()
          }
          return newTime
        })
        setSessionTimeElapsed(prev => prev + 1000)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }

    return () => clearInterval(timerRef.current)
  }, [sessionState, isPaused])

  // Handle focus loss for auto-pause
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && sessionState === 'running' && !isPaused) {
        focusLostTime.current = Date.now()
      } else if (!document.hidden && focusLostTime.current) {
        const focusLostDuration = Date.now() - focusLostTime.current
        if (focusLostDuration > 2000) { // Auto-pause after 2s
          pauseSession()
        }
        focusLostTime.current = null
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [sessionState, isPaused])

  const startSession = () => {
    setSessionState('running')
    setCurrentBlockIndex(0)
    saveSessionProgress()
  }

  const pauseSession = () => {
    setIsPaused(true)
    setSessionState('paused')
    pauseStartTime.current = Date.now()
  }

  const resumeSession = () => {
    if (pauseStartTime.current) {
      const pauseDuration = Date.now() - pauseStartTime.current
      setSessionData(prev => ({
        ...prev,
        pausedMs: prev.pausedMs + pauseDuration
      }))
    }
    setIsPaused(false)
    setSessionState('running')
  }

  const nextBlock = useCallback(() => {
    const currentBlock = sessionData.blocks[currentBlockIndex]
    if (currentBlock) {
      // Update current block as completed
      setSessionData(prev => ({
        ...prev,
        blocks: prev.blocks.map((block, index) => 
          index === currentBlockIndex 
            ? { ...block, status: 'completed', playedMs: block.plannedMs }
            : block
        )
      }))
    }

    if (currentBlockIndex + 1 < sessionTemplate.blocks.length) {
      setCurrentBlockIndex(prev => prev + 1)
      const nextBlock = sessionTemplate.blocks[currentBlockIndex + 1]
      setBlockTimeRemaining(nextBlock.duration * 60 * 1000)
      
      // Carry over difficulty level if same game
      const nextLevel = gameProgress[nextBlock.game] || 1
      setSessionData(prev => ({
        ...prev,
        blocks: prev.blocks.map((block, index) => 
          index === currentBlockIndex + 1 
            ? { ...block, levelStart: nextLevel }
            : block
        )
      }))
    } else {
      completeSession()
    }
    
    saveSessionProgress()
  }, [currentBlockIndex, sessionData.blocks, sessionTemplate.blocks, gameProgress])

  const skipBlock = () => {
    setSessionData(prev => ({
      ...prev,
      quits: prev.quits + 1
    }))
    nextBlock()
  }

  const completeSession = async () => {
    setSessionState('complete')
    
    // Calculate final metrics
    const totalScore = sessionData.blocks.reduce((sum, block) => sum + (block.score || 0), 0)
    const avgLevel = sessionData.blocks.length > 0 
      ? sessionData.blocks.reduce((sum, block) => sum + (block.levelEnd || 1), 0) / sessionData.blocks.length 
      : 1

    const finalSessionData = {
      ...sessionData,
      totalMs: sessionTimeElapsed,
      totalScore,
      avgLevel,
      completedAt: new Date().toISOString()
    }

    // Save final session
    await saveSessionToDatabase(finalSessionData)
    onComplete?.(finalSessionData)
  }

  const exitSession = async () => {
    const partialSessionData = {
      ...sessionData,
      totalMs: sessionTimeElapsed,
      totalScore: sessionData.blocks.reduce((sum, block) => sum + (block.score || 0), 0),
      exitedAt: new Date().toISOString(),
      completed: false
    }

    await saveSessionToDatabase(partialSessionData)
    onExit?.()
  }

  const saveSessionProgress = async () => {
    // Save progress to localStorage for resume capability
    if (sessionData.sessionId) {
      const progressData = {
        ...sessionData,
        currentBlockIndex,
        blockTimeRemaining,
        sessionTimeElapsed,
        gameProgress,
        timestamp: Date.now()
      }
      localStorage.setItem(`session_${sessionData.sessionId}`, JSON.stringify(progressData))
    }
  }

  const saveSessionToDatabase = async (finalData) => {
    if (!userProfile?.id) return

    try {
      const sessionRecord = {
        user_id: userProfile.id,
        template_type: template,
        metrics: {
          blocks: finalData.blocks,
          total_ms: finalData.totalMs || sessionTimeElapsed,
          total_score: finalData.totalScore || 0,
          avg_level: finalData.avgLevel || 1,
          quits: finalData.quits || 0,
          paused_ms: finalData.pausedMs || 0,
          completed: finalData.completed !== false
        },
        started_at: finalData.startTime,
        completed_at: finalData.completedAt || finalData.exitedAt || new Date().toISOString()
      }

      const { error } = await supabase
        .from('session_schedules')
        .insert(sessionRecord)

      if (error) {
        console.error('Error saving session:', error)
      } else {
        // Clear saved progress
        localStorage.removeItem(`session_${sessionData.sessionId}`)
      }
    } catch (error) {
      console.error('Error in saveSessionToDatabase:', error)
    }
  }

  // Handle game completion within block
  const handleGameComplete = (gameScore, gameMetrics) => {
    const currentBlock = sessionData.blocks[currentBlockIndex]
    if (currentBlock) {
      const levelEnd = gameMetrics?.level || gameProgress[currentBlock.game] || 1
      
      // Update game progress for carry-over
      setGameProgress(prev => ({
        ...prev,
        [currentBlock.game]: levelEnd
      }))

      // Update block data
      setSessionData(prev => ({
        ...prev,
        blocks: prev.blocks.map((block, index) => 
          index === currentBlockIndex 
            ? { 
                ...block, 
                score: gameScore, 
                levelEnd, 
                playedMs: (block.duration * 60 * 1000) - blockTimeRemaining,
                status: 'completed'
              }
            : block
        )
      }))
    }
  }

  if (!sessionTemplate) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Plantilla no encontrada</h3>
          <Button onClick={onExit} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentBlock = sessionData.blocks[currentBlockIndex] || sessionTemplate.blocks[0]
  const sessionProgress = (sessionTimeElapsed / (sessionTemplate.duration * 60 * 1000)) * 100
  const blockProgress = currentBlock ? ((currentBlock.duration * 60 * 1000 - blockTimeRemaining) / (currentBlock.duration * 60 * 1000)) * 100 : 0

  const renderSessionReady = () => (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{sessionTemplate.title}</h2>
        <p className="text-muted-foreground">{sessionTemplate.description}</p>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          {sessionTemplate.duration} minutos
        </Badge>
      </div>

      <div className="grid gap-3 max-w-md mx-auto">
        {sessionTemplate.blocks.map((block, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">{block.title}</div>
              <div className="text-sm text-muted-foreground">{block.duration} min</div>
            </div>
          </div>
        ))}
      </div>

      <Button size="lg" onClick={startSession} className="px-8">
        <Play className="w-5 h-5 mr-2" />
        Comenzar Sesión
      </Button>
    </div>
  )

  const renderSessionRunning = () => (
    <div className="space-y-6">
      {/* Session Progress */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Bloque {currentBlockIndex + 1}: {currentBlock?.title}
          </h3>
          <Badge variant="outline">
            {Math.ceil(blockTimeRemaining / 1000 / 60)} min restantes
          </Badge>
        </div>
        
        <Progress value={sessionProgress} className="h-2" />
        <div className="text-sm text-muted-foreground">
          Progreso de sesión: {Math.round(sessionProgress)}%
        </div>
      </div>

      {/* Block Progress */}
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Bloque actual</span>
          <span className="text-sm text-muted-foreground">
            {Math.ceil(blockTimeRemaining / 1000)}s
          </span>
        </div>
        <Progress value={blockProgress} className="h-1" />
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={exitSession}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Salir y Guardar
        </Button>
        
        {!isPaused ? (
          <Button variant="outline" onClick={pauseSession}>
            <Pause className="w-4 h-4 mr-2" />
            Pausar
          </Button>
        ) : (
          <Button onClick={resumeSession}>
            <Play className="w-4 h-4 mr-2" />
            Continuar
          </Button>
        )}
        
        <Button variant="outline" onClick={skipBlock}>
          <SkipForward className="w-4 h-4 mr-2" />
          Saltar Bloque
        </Button>
      </div>

      {/* Game Component would render here */}
      <div className="min-h-[400px] flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center space-y-2">
          <Target className="w-12 h-12 mx-auto text-primary" />
          <h4 className="text-lg font-semibold">
            {currentBlock?.title}
          </h4>
          <p className="text-muted-foreground">
            Juego en progreso... ({Math.ceil(blockTimeRemaining / 1000)}s)
          </p>
        </div>
      </div>
    </div>
  )

  const renderSessionComplete = () => (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
        <h3 className="text-2xl font-bold">¡Sesión Completada!</h3>
        <p className="text-muted-foreground">
          Has terminado tu sesión de {sessionTemplate.title}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <div className="bg-muted rounded-lg p-4">
          <div className="text-2xl font-bold text-primary">
            {Math.round(sessionTimeElapsed / 1000 / 60)}
          </div>
          <div className="text-sm text-muted-foreground">Minutos</div>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <div className="text-2xl font-bold text-green-500">
            {sessionData.totalScore || 0}
          </div>
          <div className="text-sm text-muted-foreground">Puntuación</div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold">Bloques completados:</h4>
        <div className="space-y-1">
          {sessionData.blocks.map((block, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span>{block.title}</span>
              <Badge variant={block.status === 'completed' ? 'default' : 'secondary'}>
                {block.status === 'completed' ? '✓' : '○'} {block.score || 0} pts
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={onExit} className="px-8">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Inicio
      </Button>
    </div>
  )

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Session Runner 2.0
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        {sessionState === 'ready' && renderSessionReady()}
        {(sessionState === 'running' || sessionState === 'paused') && renderSessionRunning()}
        {sessionState === 'complete' && renderSessionComplete()}
      </CardContent>
    </Card>
  )
}