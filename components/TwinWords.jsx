'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Eye, 
  Timer, 
  CheckCircle, 
  XCircle,
  Target,
  Zap,
  Brain
} from 'lucide-react'

import { getDifficultyParams, calculateTwinWordsScore } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

export default function TwinWords({ onGameFinish, difficultyLevel = 1, durationMs }) {
  const [wordPairs, setWordPairs] = useState([])
  const [currentPairIndex, setCurrentPairIndex] = useState(0)
  const [showWords, setShowWords] = useState(false)
  const [gameStartTime, setGameStartTime] = useState(null)
  const [gameEndTime, setGameEndTime] = useState(null)
  const [responses, setResponses] = useState([])
  const [reactionTimes, setReactionTimes] = useState([])
  const [showInstructions, setShowInstructions] = useState(true)
  const [currentShowTime, setCurrentShowTime] = useState(null)
  const [isCompleted, setIsCompleted] = useState(false)
  
  const { sessionId } = useAppStore()
  const timeoutRef = useRef(null)

  // Game parameters based on difficulty
  const [gameParams, setGameParams] = useState({
    exposureMs: 1200,
    wordLength: 5,
    subtlety: 1
  })

  useEffect(() => {
    const params = getDifficultyParams('twin_words', difficultyLevel)
    setGameParams(params)
  }, [difficultyLevel])

  // Word pairs with micro-differences - improved difficulty progression
  const generateWordPairs = () => {
    // Basic pairs for easier levels
    const easyPairs = [
      // Very obvious differences for beginners
      { word1: 'casa', word2: 'mesa', identical: false }, // c/m clearly different
      { word1: 'gato', word2: 'pato', identical: false }, // g/p clearly different
      { word1: 'sol', word2: 'sal', identical: false }, // o/a clearly different
      { word1: 'mar', word2: 'par', identical: false }, // m/p clearly different
      { word1: 'luz', word2: 'paz', identical: false }, // l/p clearly different
      
      // Identical pairs
      { word1: 'casa', word2: 'casa', identical: true },
      { word1: 'gato', word2: 'gato', identical: true },
      { word1: 'libro', word2: 'libro', identical: true },
      { word1: 'mundo', word2: 'mundo', identical: true },
      { word1: 'tiempo', word2: 'tiempo', identical: true }
    ]

    // Medium difficulty pairs
    const mediumPairs = [
      // Single letter differences
      { word1: 'cosa', word2: 'casa', identical: false }, // o/a
      { word1: 'peso', word2: 'piso', identical: false }, // e/i
      { word1: 'carro', word2: 'corro', identical: false }, // a/o
      { word1: 'mano', word2: 'nano', identical: false }, // m/n
      { word1: 'bueno', word2: 'nuevo', identical: false }, // b/n
      
      // Add more identical pairs for balance
      { word1: 'papel', word2: 'papel', identical: true },
      { word1: 'mesa', word2: 'mesa', identical: true },
      { word1: 'agua', word2: 'agua', identical: true }
    ]
    
    // Hard difficulty pairs  
    const hardPairs = [
      // Subtle differences (rn/m, cl/d, etc.)
      { word1: 'perro', word2: 'perno', identical: false }, // rr/rn
      { word1: 'claro', word2: 'daro', identical: false }, // cl/d
      { word1: 'tiempo', word2: 'tiernpo', identical: false }, // m/rn
      { word1: 'persona', word2: 'persorna', identical: false }, // o/or
      { word1: 'momento', word2: 'mornento', identical: false }, // m/rn
      { word1: 'trabajo', word2: 'trabaja', identical: false }, // o/a
      { word1: 'problema', word2: 'problerna', identical: false }, // m/rn
      { word1: 'gobierno', word2: 'gobiemo', identical: false }, // rn/m
      { word1: 'desarrollo', word2: 'desarroilo', identical: false }, // ll/il
      
      // Accent differences
      { word1: 'médico', word2: 'medico', identical: false },
      { word1: 'rápido', word2: 'rapido', identical: false },
      { word1: 'teléfono', word2: 'telefono', identical: false },
      
      // Case differences
      { word1: 'CASA', word2: 'casa', identical: false },
      { word1: 'Mundo', word2: 'mundo', identical: false },
      { word1: 'TIEMPO', word2: 'tiempo', identical: false }
    ]

    // Select pairs based on difficulty level
    let availablePairs = []
    // Use the passed difficultyLevel parameter directly
    const currentDifficulty = difficultyLevel || 1
    
    if (currentDifficulty <= 2) {
      // Easy: mostly obvious differences and identical pairs
      availablePairs = [...easyPairs, ...easyPairs] // Double easy pairs for more practice
    } else if (currentDifficulty <= 4) {
      // Medium: mix of easy and medium
      availablePairs = [...easyPairs, ...mediumPairs]
    } else {
      // Hard: all difficulty levels with emphasis on harder pairs
      availablePairs = [...easyPairs.slice(5), ...mediumPairs, ...hardPairs]
    }

    // Filter by word length based on difficulty
    const filteredPairs = availablePairs.filter(pair => {
      const avgLength = (pair.word1.length + pair.word2.length) / 2
      return avgLength >= Math.max(3, gameParams.wordLength - 2) && 
             avgLength <= gameParams.wordLength + 2
    })

    // Ensure good balance of identical vs different pairs
    const identicalPairs = filteredPairs.filter(p => p.identical)
    const differentPairs = filteredPairs.filter(p => !p.identical)
    
    // Take balanced selection (50/50 split roughly)
    const numPairs = 20
    const numIdentical = Math.min(Math.floor(numPairs * 0.4), identicalPairs.length) // 40% identical
    const numDifferent = numPairs - numIdentical
    
    const selectedIdentical = identicalPairs.sort(() => Math.random() - 0.5).slice(0, numIdentical)
    const selectedDifferent = differentPairs.sort(() => Math.random() - 0.5).slice(0, numDifferent)
    
    // Combine and shuffle
    const finalPairs = [...selectedIdentical, ...selectedDifferent]
    return finalPairs.sort(() => Math.random() - 0.5)
  }

  // Initialize game
  const initializeGame = () => {
    const pairs = generateWordPairs()
    setWordPairs(pairs)
    setCurrentPairIndex(0)
    setResponses([])
    setReactionTimes([])
    setGameStartTime(null)
    setGameEndTime(null)
    setIsCompleted(false)
    setShowWords(false)
  }

  useEffect(() => {
    initializeGame()
  }, [gameParams])

  // Start game
  const startGame = () => {
    setShowInstructions(false)
    setGameStartTime(Date.now())
    showNextPair()
  }

  // Show next word pair
  const showNextPair = () => {
    if (currentPairIndex >= wordPairs.length) {
      endGame()
      return
    }

    setShowWords(true)
    setCurrentShowTime(Date.now())

    // Hide words after exposure time
    timeoutRef.current = setTimeout(() => {
      setShowWords(false)
    }, gameParams.exposureMs)
  }

  // Handle user response
  const handleResponse = (userAnswer) => {
    if (!currentShowTime || currentPairIndex >= wordPairs.length) return

    const now = Date.now()
    const reactionTime = now - currentShowTime
    const correctAnswer = wordPairs[currentPairIndex].identical
    const isCorrect = userAnswer === correctAnswer

    setResponses(prev => [...prev, isCorrect])
    setReactionTimes(prev => [...prev, reactionTime])

    // Clear timeout if still active
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Move to next pair
    setCurrentPairIndex(prev => prev + 1)
    
    // Show next pair after a brief delay
    setTimeout(() => {
      showNextPair()
    }, 500)
  }

  // End game
  const endGame = async () => {
    setGameEndTime(Date.now())
    setIsCompleted(true)
    
    const totalTime = Date.now() - gameStartTime
    const correct = responses.filter(r => r).length
    const wrong = responses.filter(r => !r).length
    const avgReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
      : 0

    const metrics = {
      shown: wordPairs.length,
      correct,
      wrong,
      exposure_ms: gameParams.exposureMs,
      mean_rt_ms: Math.round(avgReactionTime)
    }

    const gameScore = calculateTwinWordsScore(metrics)

    // Save game run
    try {
      await supabase.from('gameRuns').insert({
        id: `gr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: sessionId,
        game: 'twin_words',
        difficultyLevel,
        durationMs: totalTime,
        score: gameScore,
        metrics
      })
    } catch (error) {
      console.error('Error saving Twin Words game run:', error)
    }

    // Call completion callback
    if (onGameFinish) {
      onGameFinish({
        game: 'twin_words',
        score: gameScore,
        metrics,
        durationMs: totalTime,
        difficultyLevel
      })
    }
  }

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showInstructions || isCompleted) return
      
      switch (e.key.toLowerCase()) {
        case 's':
        case 'arrowleft':
          e.preventDefault()
          handleResponse(true) // Same
          break
        case 'd':
        case 'arrowright':
          e.preventDefault()
          handleResponse(false) // Different
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showInstructions, isCompleted, currentShowTime])

  const currentPair = wordPairs[currentPairIndex]
  const progress = (currentPairIndex / wordPairs.length) * 100
  const correct = responses.filter(r => r).length
  const accuracy = responses.length > 0 ? (correct / responses.length) * 100 : 0

  if (showInstructions) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Palabras Gemelas - Nivel {difficultyLevel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Entrenamiento de Discriminación Visual</h3>
              <p className="text-muted-foreground">
                Determina si dos palabras son idénticas o tienen diferencias sutiles.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-purple-900">Instrucciones:</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Se mostrarán dos palabras por {gameParams.exposureMs}ms</li>
                <li>• Decide si son IGUALES o DIFERENTES</li>
                <li>• Haz clic en los botones o usa las teclas S (Iguales) / D (Diferentes)</li>
                <li>• ¡Presta atención a detalles como acentos, mayúsculas y letras similares!</li>
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{gameParams.exposureMs}ms</div>
                <div className="text-xs text-muted-foreground">Exposición</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">20</div>
                <div className="text-xs text-muted-foreground">Pares</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">Nivel {difficultyLevel}</div>
                <div className="text-xs text-muted-foreground">Dificultad</div>
              </div>
            </div>

            <Button onClick={startGame} size="lg" className="mt-8">
              <Timer className="w-4 h-4 mr-2" />
              Comenzar Entrenamiento
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isCompleted) {
    const avgReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
      : 0

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Entrenamiento Completado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-green-600" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{Math.round(accuracy)}%</div>
                <div className="text-sm text-muted-foreground">Precisión</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{Math.round(avgReactionTime)}ms</div>
                <div className="text-sm text-muted-foreground">Tiempo Promedio</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{correct}</div>
                <div className="text-muted-foreground">Correctas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{responses.length - correct}</div>
                <div className="text-muted-foreground">Incorrectas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{responses.length}</div>
                <div className="text-muted-foreground">Total</div>
              </div>
            </div>

            <Button onClick={() => setShowInstructions(true)} className="mt-6">
              Volver al Menú
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Game Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Palabras Gemelas
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="outline">Nivel {difficultyLevel}</Badge>
              <Badge variant="secondary">{gameParams.exposureMs}ms</Badge>
              <Badge variant="outline">
                {Math.round(accuracy)}% precisión
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progreso: {currentPairIndex} de {wordPairs.length}</span>
              <span>Correctas: {correct}/{responses.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Word Display */}
      <Card>
        <CardContent className="p-12">
          <div className="text-center space-y-8">
            {/* Fixation Point */}
            <div className="w-2 h-2 bg-red-500 rounded-full mx-auto"></div>

            {/* Word Pair Display */}
            <div className="min-h-[200px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {showWords && currentPair ? (
                  <motion.div
                    key={currentPairIndex}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    className="space-y-8"
                  >
                    <div className="text-4xl font-bold text-gray-800">
                      {currentPair.word1}
                    </div>
                    <div className="text-4xl font-bold text-gray-800">
                      {currentPair.word2}
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-6xl text-gray-300">+</div>
                )}
              </AnimatePresence>
            </div>

            {/* Response Buttons */}
            {!showWords && currentPairIndex < wordPairs.length && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center gap-8"
              >
                <Button
                  size="lg"
                  onClick={() => handleResponse(true)}
                  className="px-8 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  IGUALES (S)
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleResponse(false)}
                  className="px-8 bg-red-600 hover:bg-red-700"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  DIFERENTES (D)
                </Button>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Mantén la atención:</strong> Las diferencias pueden ser muy sutiles
            </p>
            <div className="flex items-center justify-center gap-6 text-xs">
              <span>👀 Fíjate en: acentos, mayúsculas, letras similares (m/n, rn/m, cl/d)</span>
              <span>⌨️ Atajos: <kbd>S</kbd> = Iguales | <kbd>D</kbd> = Diferentes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}