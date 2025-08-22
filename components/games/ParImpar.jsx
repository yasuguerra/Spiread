'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, Target, Zap, CheckCircle, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { EnhancedAdaptiveDifficulty } from '@/lib/enhanced-difficulty'
import { loadGameProgress, saveGameProgress, generateNumberGrid, calculateAccuracy } from '@/lib/progress-tracking'

const GAME_STATES = {
  READY: 'ready',
  SHOWING: 'showing',
  SELECTING: 'selecting',
  FEEDBACK: 'feedback',
  SUMMARY: 'summary'
}

export default function ParImpar({ userId = 'anonymous', onFinish, onExit, timeLimit = 60000 }) {
  const [gameState, setGameState] = useState(GAME_STATES.READY)
  const [currentNumbers, setCurrentNumbers] = useState([])
  const [currentRule, setCurrentRule] = useState('even') // 'even' or 'odd'
  const [currentRound, setCurrentRound] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [rounds, setRounds] = useState([])
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  const [gameStarted, setGameStarted] = useState(false)
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(null)
  const [selections, setSelections] = useState([])
  const [showStartTime, setShowStartTime] = useState(null)
  const [roundStartTime, setRoundStartTime] = useState(null)
  
  const gameTimer = useRef(null)
  const selectionTimes = useRef([])

  // Initialize game
  useEffect(() => {
    initializeGame()
    return () => {
      if (gameTimer.current) {
        clearInterval(gameTimer.current)
      }
    }
  }, [])

  const initializeGame = async () => {
    try {
      const progress = await loadGameProgress(userId, 'par_impar')
      const difficulty = new EnhancedAdaptiveDifficulty('par_impar', progress.last_level)
      setAdaptiveDifficulty(difficulty)
    } catch (error) {
      console.error('Error initializing game:', error)
      const difficulty = new EnhancedAdaptiveDifficulty('par_impar', 1)
      setAdaptiveDifficulty(difficulty)
    }
  }

  const startGame = () => {
    setGameStarted(true)
    setCurrentRound(1)
    setTotalScore(0)
    setRounds([])
    setTimeRemaining(timeLimit)
    
    // Start game timer
    gameTimer.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          endGame()
          return 0
        }
        return prev - 100
      })
    }, 100)
    
    startNewRound()
  }

  const startNewRound = () => {
    if (!adaptiveDifficulty) return
    
    const params = adaptiveDifficulty.getGameParameters()
    
    // Alternate rule each round
    const newRule = currentRound % 2 === 1 ? 'even' : 'odd'
    setCurrentRule(newRule)
    
    // Generate number grid
    const numbers = generateNumberGrid(params.k, params.digitsLen, params.hasDistractors)
    setCurrentNumbers(numbers)
    setSelections([])
    
    setGameState(GAME_STATES.SHOWING)
    setShowStartTime(Date.now())
    
    // Show numbers for exposure time, then allow selection
    setTimeout(() => {
      setGameState(GAME_STATES.SELECTING)
      setRoundStartTime(Date.now())
      selectionTimes.current = []
    }, params.exposureTotal)
  }

  const handleNumberClick = (numberId) => {
    if (gameState !== GAME_STATES.SELECTING) return
    
    const selectionTime = Date.now()
    selectionTimes.current.push(selectionTime - roundStartTime)
    
    setCurrentNumbers(prev => 
      prev.map(num => 
        num.id === numberId 
          ? { ...num, selected: !num.selected }
          : num
      )
    )
  }

  const submitSelections = () => {
    if (gameState !== GAME_STATES.SELECTING) return
    
    const submissionTime = Date.now()
    const totalRoundTime = submissionTime - roundStartTime
    
    // Calculate accuracy and scoring
    const targets = currentNumbers.filter(num => 
      currentRule === 'even' ? num.isEven : num.isOdd
    ).length
    
    const selectedNumbers = currentNumbers.filter(num => num.selected)
    const accuracy = calculateAccuracy(currentNumbers, targets, currentRule)
    
    // Calculate score
    let roundScore = accuracy.hits // +1 per correct
    roundScore -= accuracy.falsePositives // -1 per false positive
    
    // Combo bonus for perfect rounds
    if (accuracy.accuracy === 1.0 && accuracy.falsePositives === 0) {
      roundScore += targets // Perfect bonus
    }
    
    roundScore = Math.max(0, roundScore)
    
    // Calculate mean reaction time
    const meanRt = selectionTimes.current.length > 0 
      ? selectionTimes.current.reduce((sum, rt) => sum + rt, 0) / selectionTimes.current.length
      : totalRoundTime
    
    // Record trial for adaptive difficulty
    const params = adaptiveDifficulty.getGameParameters()
    const performanceGood = accuracy.accuracy >= 0.85 && meanRt <= params.goalRt
    const result = adaptiveDifficulty.recordTrial(performanceGood, meanRt, {
      accuracy: accuracy.accuracy,
      meanRt
    })
    
    // Record round data
    const roundData = {
      round: currentRound,
      rule: currentRule,
      targets: targets,
      selected: selectedNumbers.length,
      hits: accuracy.hits,
      falsePositives: accuracy.falsePositives,
      misses: accuracy.misses,
      accuracy: accuracy.accuracy,
      score: roundScore,
      meanRt,
      totalTime: totalRoundTime,
      level: result.oldLevel,
      levelChanged: result.levelChanged,
      newLevel: result.newLevel,
      k: params.k,
      digitsLen: params.digitsLen
    }
    
    setRounds(prev => [...prev, roundData])
    setTotalScore(prev => prev + roundScore)
    setGameState(GAME_STATES.FEEDBACK)
    
    // Show feedback briefly
    setTimeout(() => {
      if (timeRemaining > 3000) { // Continue if time remains
        setCurrentRound(prev => prev + 1)
        startNewRound()
      } else {
        endGame()
      }
    }, 1500)
  }

  const endGame = async () => {
    if (gameTimer.current) {
      clearInterval(gameTimer.current)
    }
    
    setGameState(GAME_STATES.SUMMARY)
    
    // Save game run
    const gameData = {
      game: 'par_impar',
      score: totalScore,
      duration_ms: timeLimit - timeRemaining,
      metrics: {
        total_rounds: rounds.length,
        final_level: adaptiveDifficulty?.getCurrentLevel() || 1,
        average_accuracy: rounds.length > 0 ? rounds.reduce((sum, r) => sum + r.accuracy, 0) / rounds.length : 0,
        average_rt: rounds.length > 0 ? rounds.reduce((sum, r) => sum + r.meanRt, 0) / rounds.length : 0,
        total_hits: rounds.reduce((sum, r) => sum + r.hits, 0),
        total_false_positives: rounds.reduce((sum, r) => sum + r.falsePositives, 0),
        rounds: rounds
      }
    }
    
    if (onFinish) {
      onFinish(gameData)
    }
    
    // Save progress
    try {
      await saveGameProgress(userId, 'par_impar', {
        last_level: adaptiveDifficulty?.getCurrentLevel() || 1,
        last_best_score: Math.max(totalScore, 0),
        total_rounds: rounds.length,
        best_accuracy: rounds.length > 0 ? Math.max(...rounds.map(r => r.accuracy)) : 0
      })
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000)
    return `${seconds}s`
  }

  const getTargetCount = () => {
    return currentNumbers.filter(num => 
      currentRule === 'even' ? num.isEven : num.isOdd
    ).length
  }

  const getSelectedCount = () => {
    return currentNumbers.filter(num => num.selected).length
  }

  const currentParams = adaptiveDifficulty?.getGameParameters() || { k: 8, digitsLen: 3, exposureTotal: 12000, goalRt: 900 }
  const progress = timeLimit > 0 ? ((timeLimit - timeRemaining) / timeLimit) * 100 : 0

  if (!gameStarted) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-3 py-4 sm:max-w-2xl sm:px-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                Par / Impar
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Selecciona números pares o impares según la regla que aparece
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {adaptiveDifficulty?.getCurrentLevel() || 1}
                  </div>
                  <div className="text-sm text-muted-foreground">Nivel</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {currentParams.k}
                  </div>
                  <div className="text-sm text-muted-foreground">Números</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {currentParams.digitsLen}
                  </div>
                  <div className="text-sm text-muted-foreground">Dígitos</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Instrucciones:</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Los números aparecen brevemente</li>
                  <li>• Luego selecciona todos los números PARES o IMPARES</li>
                  <li>• La regla alterna cada ronda</li>
                  <li>• Sé rápido y preciso para máxima puntuación</li>
                </ul>
              </div>
              
              <Button onClick={startGame} className="w-full" size="lg">
                <Zap className="w-4 h-4 mr-2" />
                Comenzar Juego (60s)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (gameState === GAME_STATES.SUMMARY) {
    const avgAccuracy = rounds.length > 0 ? rounds.reduce((sum, r) => sum + r.accuracy, 0) / rounds.length * 100 : 0
    const avgRt = rounds.length > 0 ? rounds.reduce((sum, r) => sum + r.meanRt, 0) / rounds.length : 0
    const totalHits = rounds.reduce((sum, r) => sum + r.hits, 0)
    const totalFP = rounds.reduce((sum, r) => sum + r.falsePositives, 0)

    return (
      <div className="w-full min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-3 py-4 sm:max-w-2xl sm:px-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6 text-green-500" />
                Resumen Final
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{totalScore}</div>
                  <div className="text-sm text-muted-foreground">Puntuación</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{rounds.length}</div>
                  <div className="text-sm text-muted-foreground">Rondas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{avgAccuracy.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Precisión</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{(avgRt / 1000).toFixed(1)}s</div>
                  <div className="text-sm text-muted-foreground">Tiempo Promedio</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{totalHits}</div>
                  <div className="text-sm text-muted-foreground">Aciertos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{totalFP}</div>
                  <div className="text-sm text-muted-foreground">Falsos Positivos</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-medium">Progreso del Nivel:</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Nivel Final: {adaptiveDifficulty?.getCurrentLevel() || 1}
                  </Badge>
                  <Badge variant="outline">
                    Números: {currentParams.k}
                  </Badge>
                  <Badge variant="outline">
                    Dígitos: {currentParams.digitsLen}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => startGame()} className="flex-1">
                  Jugar de Nuevo
                </Button>
                <Button onClick={onExit} variant="outline" className="flex-1">
                  Salir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Calculate grid columns based on number count and screen size
  const getGridCols = () => {
    const numCount = currentNumbers.length
    // For mobile (≤480px), prefer 3 cols max to keep cells large
    if (numCount <= 9) return 3
    if (numCount <= 12) return 3  // Still 3 for readability
    return Math.min(4, Math.ceil(Math.sqrt(numCount)))  // Cap at 4 cols
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Mobile-optimized container */}
      <div className="max-w-lg mx-auto px-3 py-4 sm:max-w-2xl sm:px-6">
        
        {/* Stats bar - single row */}
        <div className="grid grid-cols-4 gap-2 mb-4 text-center">
          <div>
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{totalScore}</div>
            <div className="text-xs text-muted-foreground">Puntos</div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-green-600">{adaptiveDifficulty?.getCurrentLevel() || 1}</div>
            <div className="text-xs text-muted-foreground">Nivel</div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-purple-600">{currentNumbers.length}</div>
            <div className="text-xs text-muted-foreground">Números</div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-orange-600">{formatTime(timeRemaining)}</div>
            <div className="text-xs text-muted-foreground">Tiempo</div>
          </div>
        </div>

        {/* Single instruction banner - compact on mobile */}
        <Card className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="px-4 py-3 sm:p-6 text-center">
            <div className="space-y-1 sm:space-y-2">
              <div className="text-sm sm:text-lg font-medium text-muted-foreground">
                Selecciona todos los números:
              </div>
              <div className={`text-2xl sm:text-4xl font-bold ${
                currentRule === 'even' ? 'text-blue-600' : 'text-purple-600'
              }`}>
                {currentRule === 'even' ? 'PARES' : 'IMPARES'}
              </div>
              {gameState === GAME_STATES.SELECTING && (
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Objetivos: {getTargetCount()} | Seleccionados: {getSelectedCount()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grid container - centered with no overflow */}
        <div className="gridWrap max-w-md mx-auto px-3 mb-4 overflow-hidden">
          <div className="min-h-[320px] sm:min-h-[400px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {gameState === GAME_STATES.SHOWING && (
                <motion.div
                  key="showing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full"
                >
                  <div 
                    className="grid gap-3 justify-items-center align-items-center mx-auto w-fit"
                    style={{
                      gridTemplateColumns: `repeat(${getGridCols()}, minmax(clamp(56px, 10vw, 72px), 1fr))`
                    }}
                  >
                    {currentNumbers.map((num) => (
                      <motion.div
                        key={num.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`
                          cell aspect-square flex items-center justify-center font-bold
                          bg-white border-2 rounded-lg shadow-md touch-manipulation
                          ${num.style?.color || 'text-gray-800'}
                          ${num.style?.opacity || ''}
                        `}
                        style={{
                          minWidth: 'clamp(56px, 10vw, 72px)',
                          fontSize: 'clamp(24px, 7vw, 40px)',
                          lineHeight: 1,
                          userSelect: 'none',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        {num.value}
                      </motion.div>
                    ))}
                  </div>
                  <div className="text-center text-muted-foreground text-sm mt-4">
                    Memoriza los números...
                  </div>
                </motion.div>
              )}

              {gameState === GAME_STATES.SELECTING && (
                <motion.div
                  key="selecting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full"
                >
                  <div 
                    className="grid gap-3 justify-items-center align-items-center mx-auto w-fit"
                    style={{
                      gridTemplateColumns: `repeat(${getGridCols()}, minmax(clamp(56px, 10vw, 72px), 1fr))`
                    }}
                  >
                    {currentNumbers.map((num) => (
                      <motion.button
                        key={num.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleNumberClick(num.id)}
                        className={`
                          cell aspect-square flex items-center justify-center font-bold
                          border-2 rounded-lg shadow-md transition-all touch-manipulation
                          ${num.selected 
                            ? 'bg-blue-500 text-white border-blue-600 ring-2 ring-blue-300' 
                            : 'bg-white border-gray-300 hover:border-gray-400 active:scale-95'
                          }
                          ${!num.selected && (num.style?.color || 'text-gray-800')}
                          ${!num.selected && (num.style?.opacity || '')}
                        `}
                        style={{
                          minWidth: 'clamp(56px, 10vw, 72px)',
                          fontSize: 'clamp(24px, 7vw, 40px)',
                          lineHeight: 1,
                          userSelect: 'none',
                          WebkitTapHighlightColor: 'transparent',
                          touchAction: 'manipulation'
                        }}
                        aria-label={`Número ${num.value}`}
                      >
                        {num.value}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {gameState === GAME_STATES.FEEDBACK && rounds.length > 0 && (
                <motion.div
                  key="feedback"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="space-y-2">
                    <div className={`text-6xl ${
                      rounds[rounds.length - 1].accuracy >= 0.8 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {rounds[rounds.length - 1].accuracy >= 0.8 ? '✓' : '○'}
                    </div>
                    <div className="text-2xl font-bold">
                      {(rounds[rounds.length - 1].accuracy * 100).toFixed(0)}% Precisión
                    </div>
                    <div className="text-lg">
                      +{rounds[rounds.length - 1].score} puntos
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-bold text-green-600">{rounds[rounds.length - 1].hits}</div>
                      <div>Aciertos</div>
                    </div>
                    <div>
                      <div className="font-bold text-red-600">{rounds[rounds.length - 1].falsePositives}</div>
                      <div>Falsos +</div>
                    </div>
                    <div>
                      <div className="font-bold text-orange-600">{rounds[rounds.length - 1].misses}</div>
                      <div>Perdidos</div>
                    </div>
                  </div>
                  
                  {rounds[rounds.length - 1].levelChanged && (
                    <Badge variant="default" className="bg-blue-500">
                      ¡Nivel {rounds[rounds.length - 1].newLevel}!
                    </Badge>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer CTA - full width, never overlaps grid */}
        {gameState === GAME_STATES.SELECTING && (
          <div className="footerCta max-w-md mx-auto px-3">
            <Button 
              onClick={submitSelections} 
              className="w-full h-12 text-lg font-semibold"
              style={{
                marginBottom: 'calc(8px + env(safe-area-inset-bottom))'
              }}
            >
              Confirmar Selección
            </Button>
          </div>
        )}

        {/* Progress indicator */}
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <span>Ronda {currentRound}</span>
            <span>Nivel {adaptiveDifficulty?.getCurrentLevel() || 1}</span>
          </div>
        </div>
      </div>
    </div>
  )
}