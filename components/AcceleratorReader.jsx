'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  SkipBack, 
  ChevronLeft,
  ChevronRight,
  Zap,
  BookOpen,
  Target,
  CheckCircle
} from 'lucide-react'

import { useAppStore } from '@/lib/store'
import { tokenizeText, createChunks, calculateAcceleratorScore } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export default function AcceleratorReader({ onGameFinish, difficultyLevel = 1, durationMs }) {
  const [inputText, setInputText] = useState('')
  const [chunks, setChunks] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wpm, setWpm] = useState(300)
  const [chunkSize, setChunkSize] = useState(2)
  const [progress, setProgress] = useState(0)
  const [gameStartTime, setGameStartTime] = useState(null)
  const [sessionMetrics, setSessionMetrics] = useState({
    pauses: 0,
    regressions: 0,
    totalTime: 0
  })
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizScore, setQuizScore] = useState(0)
  
  const workerRef = useRef(null)
  const { sessionId } = useAppStore()
  
  // Sample text for testing
  const sampleText = `La velocidad de lectura es una habilidad fundamental que puede transformar la capacidad de aprendizaje y productividad personal. Los estudios demuestran que una persona promedio lee entre 200 y 250 palabras por minuto, pero con técnicas adecuadas es posible incrementar significativamente esta velocidad sin comprometer la comprensión.

El método de presentación visual rápida secuencial, conocido como RSVP, permite eliminar los movimientos sacádicos innecesarios del ojo, que tradicionalmente consumen tiempo valioso durante la lectura. Este enfoque, combinado con las técnicas desarrolladas por Ramón Campayo, puede multiplicar la eficiencia lectora hasta alcanzar velocidades superiores a 800 palabras por minuto.

El entrenamiento sistemático incluye ejercicios específicos para expandir el campo visual periférico, reducir la subvocalización mental, y mejorar la capacidad de procesamiento simultáneo de múltiples elementos textuales. La práctica regular de estos ejercicios, incluso por períodos cortos de 15 minutos diarios, genera mejoras sustanciales y duraderas en la velocidad de comprensión lectora.`

  // Quiz questions (placeholder - will be replaced with LLM generated)
  const quizQuestions = [
    {
      question: "¿Cuál es la velocidad de lectura promedio mencionada?",
      options: ["150-200 palabras/min", "200-250 palabras/min", "300-350 palabras/min", "400-500 palabras/min"],
      correct: 1
    },
    {
      question: "¿Qué significa RSVP en el contexto del texto?",
      options: ["Respuesta Visual Rápida", "Presentación Visual Rápida Secuencial", "Reconocimiento Visual Progresivo", "Registro Visual Periférico"],
      correct: 1
    },
    {
      question: "¿Cuántos minutos de práctica diaria se recomiendan?",
      options: ["5 minutos", "10 minutos", "15 minutos", "30 minutos"],
      correct: 2
    }
  ]

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker('/accelerator-worker.js')
    
    workerRef.current.addEventListener('message', (e) => {
      const { type, payload } = e.data
      
      switch (type) {
        case 'TICK':
          setCurrentIndex(payload.index)
          setProgress(payload.progress)
          break
          
        case 'END':
          handleReadingComplete()
          break
          
        case 'AUTO_PAUSED':
          setIsPlaying(false)
          setSessionMetrics(prev => ({ ...prev, pauses: prev.pauses + 1 }))
          break
      }
    })

    // Handle visibility change
    const handleVisibilityChange = () => {
      workerRef.current?.postMessage({
        type: 'VISIBILITY_CHANGE',
        payload: { visible: !document.hidden }
      })
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      workerRef.current?.terminate()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Load text and create chunks
  const loadText = useCallback((text) => {
    const words = tokenizeText(text)
    const newChunks = createChunks(words, chunkSize)
    setChunks(newChunks)
    setCurrentIndex(0)
    setProgress(0)
    
    // Initialize worker with chunks
    workerRef.current?.postMessage({
      type: 'INIT',
      payload: { chunks: newChunks, wpm, chunkSize }
    })
  }, [chunkSize, wpm])

  // Load sample text on mount
  useEffect(() => {
    loadText(sampleText)
  }, [loadText])

  // Update worker when WPM changes
  useEffect(() => {
    workerRef.current?.postMessage({
      type: 'SET_WPM',
      payload: { wpm }
    })
  }, [wpm])

  // Start/pause reading
  const toggleReading = () => {
    if (!gameStartTime) {
      setGameStartTime(Date.now())
    }

    if (isPlaying) {
      workerRef.current?.postMessage({ type: 'PAUSE' })
      setSessionMetrics(prev => ({ ...prev, pauses: prev.pauses + 1 }))
    } else {
      workerRef.current?.postMessage({ type: 'PLAY' })
    }
    setIsPlaying(!isPlaying)
  }

  // Stop reading
  const stopReading = () => {
    workerRef.current?.postMessage({ type: 'PAUSE' })
    setIsPlaying(false)
    setCurrentIndex(0)
    setProgress(0)
  }

  // Skip backward/forward
  const skipBackward = () => {
    const newIndex = Math.max(0, currentIndex - 1)
    setCurrentIndex(newIndex)
    setSessionMetrics(prev => ({ ...prev, regressions: prev.regressions + 1 }))
    workerRef.current?.postMessage({
      type: 'SEEK',
      payload: { index: newIndex }
    })
  }

  const skipForward = () => {
    const newIndex = Math.min(chunks.length - 1, currentIndex + 1)
    setCurrentIndex(newIndex)
    workerRef.current?.postMessage({
      type: 'SEEK',
      payload: { index: newIndex }
    })
  }

  // Handle reading completion
  const handleReadingComplete = () => {
    setIsPlaying(false)
    const totalTime = Date.now() - gameStartTime
    setSessionMetrics(prev => ({ ...prev, totalTime }))
    setShowQuiz(true)
  }

  // Handle quiz completion
  const handleQuizSubmit = async () => {
    // Calculate quiz score
    const correctAnswers = quizQuestions.filter((q, index) => 
      quizAnswers[index] === q.correct
    ).length
    const score = Math.round((correctAnswers / quizQuestions.length) * 100)
    setQuizScore(score)

    // Calculate game metrics
    const metrics = {
      wpm_avg: wpm,
      chunk: chunkSize,
      pauses: sessionMetrics.pauses,
      regressions: sessionMetrics.regressions,
      quiz_score: score,
      duration_ms: sessionMetrics.totalTime
    }

    const gameScore = calculateAcceleratorScore(metrics)

    // Save game run
    try {
      await supabase.from('gameRuns').insert({
        id: `gr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: sessionId,
        game: 'accelerator',
        difficultyLevel,
        durationMs: sessionMetrics.totalTime,
        score: gameScore,
        metrics
      })
    } catch (error) {
      console.error('Error saving game run:', error)
    }

    // Call completion callback
    if (onGameFinish) {
      onGameFinish({
        game: 'accelerator',
        score: gameScore,
        metrics,
        durationMs: sessionMetrics.totalTime,
        difficultyLevel
      })
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          toggleReading()
          break
        case 'arrowleft':
          e.preventDefault()
          skipBackward()
          break
        case 'arrowright':
          e.preventDefault()
          skipForward()
          break
        case '-':
          e.preventDefault()
          setWpm(Math.max(100, wpm - 10))
          break
        case '=':
        case '+':
          e.preventDefault()
          setWpm(Math.min(1000, wpm + 10))
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, wpm, currentIndex, chunks.length])

  const currentChunk = chunks[currentIndex] || []

  if (showQuiz) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Test de Comprensión
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center mb-6">
            <p className="text-lg text-muted-foreground">
              Responde las siguientes preguntas sobre el texto que acabas de leer.
            </p>
          </div>

          {quizQuestions.map((question, index) => (
            <Card key={index} className="p-4">
              <div className="space-y-4">
                <h3 className="font-medium">
                  {index + 1}. {question.question}
                </h3>
                <RadioGroup
                  value={quizAnswers[index]?.toString()}
                  onValueChange={(value) => setQuizAnswers(prev => ({
                    ...prev,
                    [index]: parseInt(value)
                  }))}
                >
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={optionIndex.toString()} 
                        id={`q${index}-${optionIndex}`}
                      />
                      <Label 
                        htmlFor={`q${index}-${optionIndex}`}
                        className="cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </Card>
          ))}

          <div className="text-center">
            <Button
              onClick={handleQuizSubmit}
              disabled={Object.keys(quizAnswers).length < quizQuestions.length}
              size="lg"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalizar Test
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Reading Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Acelerador de Lectura
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {wpm} WPM
              </Badge>
              <Badge variant="secondary">
                Chunk: {chunkSize}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Chunk {currentIndex + 1} de {chunks.length}</span>
              <span>{Math.round(progress)}% completado</span>
            </div>
          </div>

          {/* Text Display */}
          <div className="min-h-[300px] border-2 border-dashed rounded-lg p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Reading Area */}
            <div className="text-center space-y-8">
              {/* Fixation Point */}
              <div className="w-2 h-2 bg-red-500 rounded-full mx-auto"></div>
              
              {/* Current Chunk Display */}
              <AnimatePresence mode="wait">
                {currentChunk.length > 0 && (
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.1 }}
                    className="min-h-[100px] flex items-center justify-center"
                  >
                    <div 
                      className="bg-yellow-200 bg-opacity-80 px-4 py-2 rounded-lg font-bold text-center"
                      style={{ fontSize: '24px' }}
                    >
                      {currentChunk.join(' ')}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Context Text */}
              <div className="text-sm text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                {chunks.map((chunk, index) => {
                  if (Math.abs(index - currentIndex) > 3) return null
                  return (
                    <span 
                      key={index}
                      className={`${
                        index === currentIndex 
                          ? 'bg-yellow-200 font-medium' 
                          : index < currentIndex 
                            ? 'text-gray-400' 
                            : 'text-gray-600'
                      }`}
                    >
                      {chunk.join(' ')}{' '}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button size="sm" variant="outline" onClick={skipBackward}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => setWpm(Math.max(100, wpm - 100))}>
              -100
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => setWpm(Math.max(100, wpm - 10))}>
              -10
            </Button>
            
            <Button onClick={toggleReading} className="px-8">
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar
                </>
              )}
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => setWpm(Math.min(1000, wpm + 10))}>
              +10
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => setWpm(Math.min(1000, wpm + 100))}>
              +100
            </Button>
            
            <Button size="sm" variant="outline" onClick={skipForward}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Keyboard shortcuts */}
          <div className="text-xs text-muted-foreground text-center">
            Atajos: <kbd>Espacio</kbd> = Play/Pausa | <kbd>←→</kbd> = Avanzar/Retroceder | <kbd>+/-</kbd> = Velocidad
          </div>
        </CardContent>
      </Card>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text Input */}
        <Card>
          <CardHeader>
            <CardTitle>Cargar Texto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Pega aquí el texto que quieres leer..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {inputText.split(/\s+/).filter(w => w.length > 0).length} palabras
              </span>
              <Button 
                onClick={() => loadText(inputText)}
                disabled={!inputText.trim()}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Cargar Texto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* WPM Control */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Velocidad (WPM)</label>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {wpm}
                </span>
              </div>
              <Slider
                value={[wpm]}
                onValueChange={([value]) => setWpm(value)}
                max={1000}
                min={100}
                step={25}
                className="w-full"
              />
            </div>

            {/* Chunk Size */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Palabras por Grupo</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(size => (
                  <Button
                    key={size}
                    size="sm"
                    variant={chunkSize === size ? 'default' : 'outline'}
                    onClick={() => {
                      setChunkSize(size)
                      if (chunks.length > 0) {
                        loadText(sampleText) // Reload with new chunk size
                      }
                    }}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="pt-4 border-t space-y-2">
              <div className="text-sm font-medium">Métricas de Sesión</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Pausas:</span>
                  <span className="ml-2 font-mono">{sessionMetrics.pauses}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Regresos:</span>
                  <span className="ml-2 font-mono">{sessionMetrics.regressions}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}