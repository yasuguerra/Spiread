'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import GameShell from '../GameShell'

export default function ParImpar({ difficultyLevel = 1, durationMs, onFinish, onExit }) {
  return (
    <GameShell
      gameId="par_impar"
      difficultyLevel={difficultyLevel}
      durationMs={durationMs}
      onFinish={onFinish}
      onExit={onExit}
    >
      {(gameContext) => <ParImparGame gameContext={gameContext} />}
    </GameShell>
  )
}

function ParImparGame({ gameContext }) {
  const [currentNumber, setCurrentNumber] = useState(null)
  const [totalTrials, setTotalTrials] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [missedCount, setMissedCount] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [reactionTimes, setReactionTimes] = useState([])
  const [numberStartTime, setNumberStartTime] = useState(null)
  const [showFeedback, setShowFeedback] = useState(null)
  
  const { 
    gameState, 
    recordTrial, 
    getGameParameters, 
    handleGameEnd 
  } = gameContext

  const timeoutRef = useRef(null)
  const intervalRef = useRef(null)

  // Start number sequence when game begins
  useEffect(() => {
    if (gameState === 'playing') {
      startNumberSequence()
    } else {
      stopNumberSequence()
    }
    
    return () => stopNumberSequence()
  }, [gameState])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState !== 'playing' || !currentNumber) return
      
      switch (e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
          e.preventDefault()
          handleResponse('even')
          break
        case 'l':
        case 'arrowright':
          e.preventDefault()
          handleResponse('odd')
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, currentNumber])

  const startNumberSequence = () => {
    showNextNumber()
  }

  const stopNumberSequence = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (intervalRef.current) {
      clearTimeout(intervalRef.current)
      intervalRef.current = null
    }
  }

  const showNextNumber = () => {
    const params = getGameParameters()
    const { interstimulus_interval, numberRange, hasColorDistractors } = params
    
    // Generate random number within range
    const number = Math.floor(Math.random() * (numberRange[1] - numberRange[0] + 1)) + numberRange[0]
    
    setCurrentNumber({
      value: number,
      color: hasColorDistractors ? getRandomColor() : 'text-gray-800',
      isEven: number % 2 === 0
    })
    setNumberStartTime(Date.now())
    setShowFeedback(null)
    
    // Auto-advance after ISI (treat as miss if no response)
    timeoutRef.current = setTimeout(() => {
      handleTimeout()
    }, interstimulus_interval)
  }

  const getRandomColor = () => {
    const colors = [
      'text-red-600', 'text-blue-600', 'text-green-600', 
      'text-purple-600', 'text-orange-600', 'text-pink-600'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const handleResponse = (response) => {
    if (!currentNumber || !numberStartTime) return
    
    const reactionTime = Date.now() - numberStartTime
    const isCorrect = (response === 'even' && currentNumber.isEven) || 
                     (response === 'odd' && !currentNumber.isEven)
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    // Update stats
    setTotalTrials(prev => prev + 1)
    setReactionTimes(prev => [...prev, reactionTime])
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1)
      setCurrentStreak(prev => {
        const newStreak = prev + 1
        setBestStreak(current => Math.max(current, newStreak))
        return newStreak
      })
      setShowFeedback({ type: 'correct', rt: reactionTime })
    } else {
      setWrongCount(prev => prev + 1)
      setCurrentStreak(0)
      setShowFeedback({ type: 'wrong', rt: reactionTime })
    }
    
    // Record trial for adaptive difficulty
    recordTrial(isCorrect, reactionTime, {
      number: currentNumber.value,
      response,
      expected: currentNumber.isEven ? 'even' : 'odd'
    })
    
    // Schedule next number
    intervalRef.current = setTimeout(() => {
      showNextNumber()
    }, 500) // Brief pause to show feedback
  }

  const handleTimeout = () => {
    // Missed response
    setTotalTrials(prev => prev + 1)
    setMissedCount(prev => prev + 1)
    setCurrentStreak(0)
    setShowFeedback({ type: 'miss' })
    
    // Record as failed trial
    recordTrial(false, getGameParameters().interstimulus_interval, {
      number: currentNumber?.value,
      response: 'timeout'
    })
    
    // Schedule next number
    intervalRef.current = setTimeout(() => {
      showNextNumber()
    }, 300)
  }

  // Handle game end
  useEffect(() => {
    if (gameState === 'summary') {
      const accuracy = totalTrials > 0 ? correctCount / totalTrials : 0
      const avgReactionTime = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0
      
      const itemsPerMinute = totalTrials > 0 
        ? (totalTrials / (Date.now() - (Date.now() - totalTrials * getGameParameters().interstimulus_interval))) * 60000
        : 0

      const finalResults = {
        score: Math.min(100, Math.round(accuracy * 100 + (bestStreak / Math.max(1, totalTrials)) * 20)),
        metrics: {
          trials: totalTrials,
          correct: correctCount,
          wrong: wrongCount,
          misses: missedCount,
          mean_rt_ms: Math.round(avgReactionTime),
          items_per_min: Math.round(itemsPerMinute),
          current_isi_ms: getGameParameters().interstimulus_interval,
          best_streak: bestStreak
        }
      }

      handleGameEnd(finalResults)
    }
  }, [gameState])

  const accuracy = totalTrials > 0 ? (correctCount / totalTrials) * 100 : 0
  const avgReactionTime = reactionTimes.length > 0 
    ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
    : 0
  
  const params = getGameParameters()

  return (
    <div className="space-y-6">
      {/* Stats Panel */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalTrials}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{correctCount}</div>
              <div className="text-xs text-muted-foreground">Correctas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{wrongCount}</div>
              <div className="text-xs text-muted-foreground">Errores</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{missedCount}</div>
              <div className="text-xs text-muted-foreground">Perdidas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{currentStreak}</div>
              <div className="text-xs text-muted-foreground">Racha</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">{Math.round(accuracy)}%</div>
              <div className="text-xs text-muted-foreground">Precisión</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance indicators */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold">Tiempo promedio</div>
              <div className="text-lg text-blue-600">{Math.round(avgReactionTime)}ms</div>
            </div>
            <div>
              <div className="font-semibold">Mejor racha</div>
              <div className="text-lg text-green-600">{bestStreak}</div>
            </div>
            <div>
              <div className="font-semibold">Intervalo actual</div>
              <div className="text-lg text-purple-600">{params.interstimulus_interval}ms</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Game Area */}
      <Card>
        <CardContent className="p-8">
          <div className="relative min-h-[300px] flex items-center justify-center">
            {/* Central fixation point */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
            </div>

            {/* Number Display */}
            <AnimatePresence mode="wait">
              {currentNumber && (
                <motion.div
                  key={`${currentNumber.value}-${Date.now()}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.1 }}
                  className="text-center"
                >
                  <div 
                    className={`text-8xl font-bold ${currentNumber.color}`}
                  >
                    {currentNumber.value}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Feedback */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                >
                  {showFeedback.type === 'correct' && (
                    <Badge className="bg-green-600 text-white">
                      ✓ Correcto ({showFeedback.rt}ms)
                    </Badge>
                  )}
                  {showFeedback.type === 'wrong' && (
                    <Badge className="bg-red-600 text-white">
                      ✗ Error ({showFeedback.rt}ms)
                    </Badge>
                  )}
                  {showFeedback.type === 'miss' && (
                    <Badge className="bg-orange-600 text-white">
                      ⏰ Perdido
                    </Badge>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer hover:bg-blue-50 transition-colors"
          onClick={() => handleResponse('even')}
        >
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">PAR</div>
            <div className="text-sm text-muted-foreground">
              Presiona <kbd className="px-2 py-1 bg-gray-100 rounded">A</kbd> o <kbd className="px-2 py-1 bg-gray-100 rounded">←</kbd>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:bg-green-50 transition-colors"
          onClick={() => handleResponse('odd')}
        >
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">IMPAR</div>
            <div className="text-sm text-muted-foreground">
              Presiona <kbd className="px-2 py-1 bg-gray-100 rounded">L</kbd> o <kbd className="px-2 py-1 bg-gray-100 rounded">→</kbd>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <div className="font-medium">
              Responde lo más rápido posible: ¿El número es PAR o IMPAR?
            </div>
            <div className="flex justify-center gap-6 text-xs">
              <span>📊 Rango: {params.numberRange[0]}-{params.numberRange[1]}</span>
              <span>⚡ ISI: {params.interstimulus_interval}ms</span>
              <span>🎨 Colores: {params.hasColorDistractors ? 'Activados' : 'Desactivados'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}