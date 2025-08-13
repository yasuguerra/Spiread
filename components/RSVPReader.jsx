'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  SkipBack, 
  Settings,
  Upload,
  BookOpen,
  Zap,
  Timer
} from 'lucide-react'

import { useRSVPStore, useAppStore } from '@/lib/store'
import { saveReadingSession } from '@/lib/supabase'

export default function RSVPReader() {
  const [inputText, setInputText] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [startWpm, setStartWpm] = useState(250)
  
  const intervalRef = useRef(null)
  const { sessionId } = useAppStore()
  
  const {
    isActive,
    words,
    currentIndex,
    wpm,
    chunkSize,
    fontSize,
    loadText,
    start,
    pause,
    stop,
    setWpm,
    setChunkSize,
    getNextChunk,
    advance,
    getProgress
  } = useRSVPStore()

  // Sample texts for quick testing
  const sampleTexts = {
    'beginner': `La lectura rápida es una habilidad que puede desarrollarse con práctica constante. 
    Muchas personas leen a una velocidad de 200-300 palabras por minuto, pero con entrenamiento 
    adecuado es posible alcanzar velocidades de 500-800 palabras por minuto sin sacrificar 
    la comprensión. Los ejercicios de RSVP ayudan a entrenar los ojos para procesar texto 
    de manera más eficiente.`,
    
    'intermediate': `El método Campayo revoluciona el aprendizaje acelerado mediante técnicas específicas 
    que potencian las capacidades mentales. La lectura fotográfica permite procesar información 
    visual a velocidades extraordinarias, mientras que la reducción de la subvocalización 
    elimina el cuello de botella que limita la velocidad de lectura tradicional. Los ejercicios 
    de campo visual periférico expanden la capacidad de procesamiento simultáneo de múltiples 
    palabras, creando lectores exponencialmente más eficientes.`,
    
    'advanced': `La neuronalplasticidad cerebral constituye el fundamento científico que sustenta 
    las metodologías avanzadas de lectura rápida. Los estudios de neuroimagen demuestran que 
    el entrenamiento sistemático modifica las conexiones sinápticas en las áreas corticales 
    asociadas con el procesamiento visual y lingüístico. La sincronización hemisférica 
    optimiza los recursos cognitivos disponibles, mientras que la supresión del diálogo 
    interno libera ancho de banda mental para el análisis semántico paralelo de estructuras 
    sintácticas complejas.`
  }

  // RSVP display logic
  const startReading = useCallback(() => {
    if (words.length === 0) return
    
    setSessionStartTime(Date.now())
    setStartWpm(wpm)
    start()
    
    const interval = Math.floor(60000 / (wpm * chunkSize))
    
    intervalRef.current = setInterval(() => {
      if (!advance()) {
        // Reading finished
        handleReadingComplete()
      }
    }, interval)
  }, [words.length, wpm, chunkSize, start, advance])

  const pauseReading = useCallback(() => {
    pause()
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [pause])

  const stopReading = useCallback(() => {
    stop()
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (sessionStartTime) {
      handleReadingComplete()
    }
  }, [stop, sessionStartTime])

  const handleReadingComplete = async () => {
    if (!sessionStartTime || !sessionId) return
    
    const endTime = Date.now()
    const durationSeconds = Math.floor((endTime - sessionStartTime) / 1000)
    
    try {
      await saveReadingSession(sessionId, {
        wpmStart: startWpm,
        wpm_end: wpm,
        comprehensionScore: 0, // TODO: Add comprehension test
        exerciseType: 'rsvp',
        durationSeconds,
        textLength: words.length
      })
    } catch (error) {
      console.error('Error saving reading session:', error)
    }
    
    setSessionStartTime(null)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Update interval when wpm or chunkSize changes
  useEffect(() => {
    if (isActive && intervalRef.current) {
      clearInterval(intervalRef.current)
      const interval = Math.floor(60000 / (wpm * chunkSize))
      intervalRef.current = setInterval(() => {
        if (!advance()) {
          handleReadingComplete()
        }
      }, interval)
    }
  }, [wpm, chunkSize, isActive, advance])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      switch (event.key.toLowerCase()) {
        case 'f':
        case ' ':
          event.preventDefault()
          if (isActive) {
            pauseReading()
          } else if (words.length > 0) {
            startReading()
          }
          break
        case 'j':
          event.preventDefault()
          stopReading()
          break
        case 'arrowleft':
          event.preventDefault()
          setWpm(Math.max(50, wpm - 25))
          break
        case 'arrowright':
          event.preventDefault()
          setWpm(Math.min(1000, wpm + 25))
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          event.preventDefault()
          setChunkSize(parseInt(event.key))
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isActive, words.length, wpm, startReading, pauseReading, stopReading, setWpm, setChunkSize])

  const loadSampleText = (difficulty) => {
    const text = sampleTexts[difficulty]
    setInputText(text)
    loadText(text)
  }

  const handleTextLoad = () => {
    if (inputText.trim()) {
      loadText(inputText)
    }
  }

  const currentChunk = getNextChunk()

  return (
    <div className="space-y-6">
      {/* RSVP Display Area */}
      <Card className="min-h-[400px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Lector RSVP
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {wpm} WPM
              </Badge>
              <Badge variant="secondary">
                Chunk: {chunkSize}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {words.length > 0 && (
            <div className="space-y-2">
              <Progress value={getProgress()} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Palabra {currentIndex + 1} de {words.length}</span>
                <span>{Math.round(getProgress())}% completado</span>
              </div>
            </div>
          )}

          {/* Main Display */}
          <div className="flex items-center justify-center min-h-[200px] bg-muted/50 rounded-lg border-2 border-dashed">
            <AnimatePresence mode="wait">
              {currentChunk ? (
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  transition={{ duration: 0.1 }}
                  className="text-center"
                >
                  {/* Fixation Point */}
                  <div className="mb-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full mx-auto"></div>
                  </div>
                  
                  {/* Text Display */}
                  <div 
                    className="font-mono font-bold text-center"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {currentChunk}
                  </div>
                </motion.div>
              ) : words.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Carga un texto para comenzar a leer</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-4">🎉</div>
                  <p className="text-lg font-medium">¡Lectura completada!</p>
                  <p className="text-muted-foreground">Excelente trabajo</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={stopReading}
              disabled={!words.length}
            >
              <Square className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setWmp(Math.max(50, wpm - 25))}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={isActive ? pauseReading : startReading}
              disabled={!words.length}
              className="px-6"
            >
              {isActive ? (
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
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setWmp(Math.min(1000, wpm + 25))}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                /* TODO: Add quick comprehension test */
              }}
              disabled={words.length === 0}
            >
              <Timer className="w-4 h-4" />
            </Button>
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <div>Atajos: <kbd>F</kbd> o <kbd>Espacio</kbd> = Play/Pausa | <kbd>J</kbd> = Stop | <kbd>←→</kbd> = ±25 WPM</div>
            <div><kbd>1-5</kbd> = Tamaño de chunk | <kbd>+</kbd><kbd>-</kbd> = ±10 WPM</div>
          </div>
        </CardContent>
      </Card>

      {/* Text Input and Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cargar Texto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sample Texts */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Textos de Ejemplo:</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadSampleText('beginner')}
                >
                  Principiante
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadSampleText('intermediate')}
                >
                  Intermedio
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadSampleText('advanced')}
                >
                  Avanzado
                </Button>
              </div>
            </div>

            {/* Custom Text */}
            <div className="space-y-2">
              <label className="text-sm font-medium">O ingresa tu propio texto:</label>
              <Textarea
                placeholder="Pega aquí el texto que quieres leer..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[120px]"
              />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {inputText.split(/\s+/).filter(w => w.length > 0).length} palabras
                </span>
                <Button onClick={handleTextLoad} disabled={!inputText.trim()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Cargar Texto
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* WPM Control */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Velocidad (WPM)</label>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {wmp}
                </span>
              </div>
              <Slider
                value={[wpm]}
                onValueChange={([value]) => setWmp(value)}
                max={1000}
                min={50}
                step={25}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50</span>
                <span>1000</span>
              </div>
            </div>

            {/* Chunk Size */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Palabras por Grupo</label>
              <Select value={chunkSize.toString()} onValueChange={(value) => setChunkSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 palabra</SelectItem>
                  <SelectItem value="2">2 palabras</SelectItem>
                  <SelectItem value="3">3 palabras</SelectItem>
                  <SelectItem value="4">4 palabras</SelectItem>
                  <SelectItem value="5">5 palabras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Tamaño de Fuente</label>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {fontSize}px
                </span>
              </div>
              <Slider
                value={[fontSize]}
                onValueChange={([value]) => {
                  // Update font size in store
                  // This would need to be added to the store
                }}
                max={48}
                min={12}
                step={2}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}