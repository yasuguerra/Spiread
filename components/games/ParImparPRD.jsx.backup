'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, CheckCircle, XCircle } from 'lucide-react'
import GameShell from '@/components/GameShell'
import { getLastLevel, setLastLevel, updateGameProgress, GAME_IDS } from '@/lib/progress-tracking'
import { calculateLevelProgression, GAME_LEVEL_CONFIGS } from '@/lib/level-progression'

const GAME_STATES = {
  READY: 'ready',
  SHOWING: 'showing',
  SELECTING: 'selecting',
  FEEDBACK: 'feedback'
}

// Grid size configuration based on difficulty level
const getGridConfig = (level) => {
  if (level <= 3) return { rows: 3, cols: 3, size: 9 }    // 3x3 = 9 numbers
  if (level <= 6) return { rows: 4, cols: 4, size: 16 }   // 4x4 = 16 numbers
  if (level <= 9) return { rows: 5, cols: 4, size: 20 }   // 5x4 = 20 numbers
  if (level <= 12) return { rows: 5, cols: 5, size: 25 }  // 5x5 = 25 numbers
  if (level <= 15) return { rows: 6, cols: 5, size: 30 }  // 6x5 = 30 numbers
  return { rows: 6, cols: 6, size: 36 }                   // 6x6 = 36 numbers max
}

// Generate random numbers for the grid
const generateNumbers = (count, level) => {
  const numbers = []
  const minDigits = level <= 3 ? 1 : level <= 6 ? 2 : level <= 10 ? 3 : 4
  const maxDigits = Math.min(minDigits + 1, 4)
  
  for (let i = 0; i < count; i++) {
    const digits = Math.floor(Math.random() * (maxDigits - minDigits + 1)) + minDigits
    const min = Math.pow(10, digits - 1)
    const max = Math.pow(10, digits) - 1
    const value = Math.floor(Math.random() * (max - min + 1)) + min
    
    numbers.push({
      id: i,
      value,
      isEven: value % 2 === 0,
      selected: false,
      correct: false,
      feedback: null
    })
  }
  
  return numbers
}

export default function ParImparPRD({ 
  onBackToGames, 
  onViewStats,
  onExit,
  gameName = "Par / Impar",
  gameKey = "parimpar"
}) {
  const [internalGameState, setInternalGameState] = useState(GAME_STATES.READY)
  const [currentNumbers, setCurrentNumbers] = useState([])
  const [currentRule, setCurrentRule] = useState('even') // 'even' or 'odd'
  const [currentRound, setCurrentRound] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [rounds, setRounds] = useState([])
  const [showDuration, setShowDuration] = useState(3000) // Show numbers for 3s initially
  const [gameStarted, setGameStarted] = useState(false)
  const [roundStartTime, setRoundStartTime] = useState(null)
  const [countdown, setCountdown] = useState(0) // For countdown timer
  const [reactionTimes, setReactionTimes] = useState([]) // Track reaction times
  
  const roundTimer = useRef(null)
  const countdownTimer = useRef(null)
  const gameContextRef = useRef(null)

  // Initialize level from localStorage
  useEffect(() => {
    const savedLevel = getLastLevel(gameKey)
    if (savedLevel > 0) {
      setLevel(savedLevel)
    }
  }, [gameKey])

  const startNewRound = () => {
    if (!gameContextRef.current || gameContextRef.current.gameState !== 'playing') return
    
    const gridConfig = getGridConfig(level)
    const numbers = generateNumbers(gridConfig.size, level)
    
    // Alternate rule each round (even/odd)
    const newRule = currentRound % 2 === 0 ? 'even' : 'odd'
    setCurrentRule(newRule)
    setCurrentNumbers(numbers)
    setInternalGameState(GAME_STATES.SHOWING)
    
    // Calculate show duration based on level (3000ms to 1500ms)
    const duration = Math.max(1500, 3000 - (level - 1) * 100)
    setShowDuration(duration)
    setCountdown(Math.ceil(duration / 1000))
    
    // Start countdown
    countdownTimer.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    // Show numbers then allow selection
    roundTimer.current = setTimeout(() => {
      setInternalGameState(GAME_STATES.SELECTING)
      setRoundStartTime(Date.now())
      setCountdown(0)
    }, duration)
  }

  const handleNumberClick = (numberId) => {
    if (internalGameState !== GAME_STATES.SELECTING) return
    
    const clickTime = Date.now()
    const reactionTime = clickTime - roundStartTime
    
    setCurrentNumbers(prev => 
      prev.map(num => 
        num.id === numberId 
          ? { ...num, selected: !num.selected, clickTime: reactionTime }
          : num
      )
    )
    
    // Track reaction times for the first click on each number
    const number = currentNumbers.find(n => n.id === numberId)
    if (number && !number.selected) {
      setReactionTimes(prev => [...prev, reactionTime])
    }
  }

  const processRound = () => {
    if (internalGameState !== GAME_STATES.SELECTING) return
    
    const selectionTime = Date.now() - roundStartTime
    const targets = currentNumbers.filter(num => 
      currentRule === 'even' ? num.isEven : !num.isEven
    )
    const selected = currentNumbers.filter(num => num.selected)
    
    // Calculate accuracy
    const correctSelections = selected.filter(num =>
      currentRule === 'even' ? num.isEven : !num.isEven
    )
    const incorrectSelections = selected.filter(num =>
      currentRule === 'even' ? !num.isEven : num.isEven
    )
    const missedTargets = targets.filter(num => !num.selected)
    
    const hits = correctSelections.length
    const falsePositives = incorrectSelections.length
    const misses = missedTargets.length
    const accuracy = targets.length > 0 ? hits / targets.length : 0
    
    // Calculate score: +1 per correct, +2 if solved quickly (< 2s), -1 per error
    let roundScore = hits
    if (selectionTime < 2000 && accuracy === 1.0 && falsePositives === 0) {
      roundScore += hits // Double points for quick perfect rounds
    }
    roundScore -= falsePositives
    roundScore = Math.max(0, roundScore)
    
    // Show immediate feedback
    const numbersWithFeedback = currentNumbers.map(num => ({
      ...num,
      correct: currentRule === 'even' ? num.isEven : !num.isEven,
      feedback: num.selected ? 
        (currentRule === 'even' ? num.isEven : !num.isEven) ? 'correct' : 'incorrect'
        : (currentRule === 'even' ? num.isEven : !num.isEven) ? 'missed' : null
    }))
    
    setCurrentNumbers(numbersWithFeedback)
    setInternalGameState(GAME_STATES.FEEDBACK)
    
    // Record round data
    const roundData = {
      round: currentRound + 1,
      rule: currentRule,
      level,
      targets: targets.length,
      hits,
      falsePositives,
      misses,
      accuracy,
      score: roundScore,
      time: selectionTime,
      gridSize: getGridConfig(level).size
    }
    
    setRounds(prev => [...prev, roundData])
    setTotalScore(prev => prev + roundScore)
    
    // Check for level progression using unified system
    const performance = {
      accuracy,
      time: selectionTime,
      score: roundScore,
      isCorrect: accuracy >= 0.8,
      consecutiveCorrect: rounds.filter(r => r.accuracy >= 0.8).length
    }
    
    const levelResult = calculateLevelProgression(gameKey, level, performance)
    
    if (levelResult.levelChanged) {
      setLevel(levelResult.newLevel)
      setLastLevel(gameKey, levelResult.newLevel)
    }
    
    // Continue to next round after brief feedback
    setTimeout(() => {
      setCurrentRound(prev => prev + 1)
      startNewRound()
    }, 1500)
  }

  const handleGameStart = () => {
    setGameStarted(true)
    setCurrentRound(0)
    setTotalScore(0)
    setRounds([])
    startNewRound()
  }

  const handleGameEnd = (gameData) => {
    // Check for final level progression based on overall performance
    const avgAccuracy = rounds.length > 0 ? rounds.reduce((sum, r) => sum + r.accuracy, 0) / rounds.length : 0
    const avgTime = rounds.length > 0 ? rounds.reduce((sum, r) => sum + r.time, 0) / rounds.length : 0
    const totalHits = rounds.reduce((sum, r) => sum + r.hits, 0)
    const totalFP = rounds.reduce((sum, r) => sum + r.falsePositives, 0)
    
    // Final level check based on overall session performance
    const finalPerformance = {
      accuracy: avgAccuracy,
      time: avgTime,
      score: totalScore,
      isCorrect: avgAccuracy >= 0.75,
      consecutiveCorrect: rounds.filter(r => r.accuracy >= 0.8).length,
      sessionComplete: true
    }
    
    const finalLevelResult = calculateLevelProgression(gameKey, level, finalPerformance)
    
    const finalLevel = finalLevelResult.newLevel
    setLevel(finalLevel)
    setLastLevel(gameKey, finalLevel)
    
    // Update progress tracking with new system
    const sessionSummary = {
      gameId: GAME_IDS.PAR_IMPAR,
      score: totalScore,
      level: finalLevel,
      accuracy: avgAccuracy,
      durationSec: 60, // Fixed 60-second duration
      timestamp: Date.now(),
      extras: {
        totalRounds: rounds.length,
        avgTime: avgTime,
        totalHits: totalHits,
        totalFP: totalFP,
        bestRoundScore: rounds.length > 0 ? Math.max(...rounds.map(r => r.score)) : 0,
        levelProgression: finalLevelResult.levelChanged ? (finalLevelResult.newLevel > level ? 'up' : 'down') : 'none',
        currentRule: currentRule,
        gridConfig: getGridConfig(level)
      }
    }

    // Persist the progress
    updateGameProgress(GAME_IDS.PAR_IMPAR, sessionSummary)
    
    const finalGameData = {
      ...gameData,
      score: totalScore,
      metrics: {
        total_rounds: rounds.length,
        final_level: finalLevel,
        average_accuracy: avgAccuracy,
        average_time: avgTime,
        total_hits: totalHits,
        total_false_positives: totalFP,
        best_round_score: rounds.length > 0 ? Math.max(...rounds.map(r => r.score)) : 0,
        level_progression: finalLevelResult.levelChanged ? (finalLevelResult.newLevel > level ? 'up' : 'down') : 'none'
      }
    }
    
    return finalGameData
  }

  const gridConfig = getGridConfig(level)
  const targetCount = currentNumbers.filter(num => 
    currentRule === 'even' ? num.isEven : !num.isEven
  ).length
  const selectedCount = currentNumbers.filter(num => num.selected).length

  return (
    <GameShell
      gameId="par_impar"
      gameName="Par / Impar"
      gameKey="parimpar"
      durationMs={60000} // 60 seconds
      initialLevel={level}
      onFinish={handleGameEnd}
      onExit={onExit}
      onBackToGames={onBackToGames}
      onViewStats={onViewStats}
    >
      {(gameContext) => {
        gameContextRef.current = gameContext
        const { gameState, timeElapsed } = gameContext

        // Auto-start first round when game starts
        if (gameContext.gameState === 'playing' && !gameStarted) {
          handleGameStart()
        }

        return (
        <div className="gameWrap">
        {/* Game Status */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calculator className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold">Ronda {currentRound + 1}</h2>
          </div>
          
          {internalGameState !== GAME_STATES.READY && (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="min-w-0">
                <div className="text-xl font-bold text-blue-600 truncate">{totalScore}</div>
                <div className="text-xs text-muted-foreground">Puntos</div>
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold text-green-600 truncate">{level}</div>
                <div className="text-xs text-muted-foreground">Nivel</div>
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold text-purple-600 truncate">{gridConfig.size}</div>
                <div className="text-xs text-muted-foreground">Números</div>
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold text-orange-600 truncate">{Math.round(showDuration/1000)}s</div>
                <div className="text-xs text-muted-foreground">Tiempo</div>
              </div>
            </div>
          )}
        </div>

        {/* Rule Display */}
        {gameContext.gameState === 'playing' && (
          <div className="instruction-banner mb-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                Selecciona todos los números:
              </div>
              <div className={`text-2xl font-bold ${
                currentRule === 'even' ? 'text-blue-600' : 'text-purple-600'
              }`}>
                {currentRule === 'even' ? 'PARES' : 'IMPARES'}
              </div>
              {internalGameState === GAME_STATES.SELECTING && (
                <div className="text-xs text-muted-foreground">
                  Objetivos: {targetCount} | Seleccionados: {selectedCount}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Game Area */}
        <div className="grid-container">
          <div className="min-h-[320px] flex items-center justify-center"
              <motion.div
                key="selecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full"
              >
                <div className="grid gap-3 justify-items-center">
                  {currentNumbers.map((num) => (
                    <motion.button
                      key={num.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleNumberClick(num.id)}
                      className={`
                        cell
                        ${num.selected 
                          ? 'bg-blue-500 text-white border-blue-600 ring-2 ring-blue-300' 
                          : 'bg-white border-gray-300 hover:border-gray-400'
                        }
                      `}
                      aria-label={`Número ${num.value}`}
                    >
                      {num.value}
                    </motion.button>
                  ))}
                </div>
                <div className="text-center mt-4 space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Toca los números {currentRule === 'even' ? 'PARES' : 'IMPARES'}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer CTA - properly contained */}
        {internalGameState === GAME_STATES.SELECTING && (
          <div className="footerCta">
            <button
              onClick={processRound}
              className="w-full h-12 bg-green-600 text-white rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Confirmar Selección
            </button>
          </div>
        )}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6"
              >
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto">
                    <Calculator className="w-8 h-8 text-orange-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Par / Impar
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    Observa los números y luego selecciona solo los pares o impares según la regla
                  </p>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg max-w-sm mx-auto">
                  <div className="text-sm space-y-2 text-left">
                    <div className="font-medium">Cómo jugar:</div>
                    <ul className="space-y-1 text-xs">
                      <li>• Los números aparecen brevemente</li>
                      <li>• Selecciona PARES o IMPARES según la regla</li>
                      <li>• Feedback inmediato: verde ✓, rojo ✗</li>
                      <li>• Grids más grandes conforme avanzas</li>
                    </ul>
                  </div>
                </div>

                <Button 
                  onClick={gameContext.startGame} 
                  size="lg"
                  className="px-8 py-3 text-lg"
                >
                  Empezar Juego
                </Button>
              </motion.div>
            )}

            {gameContext.gameState === 'playing' && gameStarted && (
              <>
                {/* Stats during game */}
                {internalGameState !== GAME_STATES.READY && (
                  <div className="grid grid-cols-4 gap-4 text-center max-w-md mx-auto">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{totalScore}</div>
                      <div className="text-sm text-muted-foreground">Puntos</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{level}</div>
                      <div className="text-sm text-muted-foreground">Nivel</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{gridConfig.size}</div>
                      <div className="text-sm text-muted-foreground">Números</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{Math.round(showDuration/1000)}s</div>
                      <div className="text-sm text-muted-foreground">Tiempo</div>
                    </div>
                  </div>
                )}

                {/* Rule Display */}
                {internalGameState !== GAME_STATES.READY && (
                  <div className="text-center p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border">
                    <div className="space-y-2">
                      <div className="text-lg font-medium text-muted-foreground">
                        Selecciona todos los números:
                      </div>
                      <div className={`text-4xl font-bold ${
                        currentRule === 'even' ? 'text-blue-600' : 'text-purple-600'
                      }`}>
                        {currentRule === 'even' ? 'PARES' : 'IMPARES'}
                      </div>
                      {internalGameState === GAME_STATES.SELECTING && (
                        <div className="text-sm text-muted-foreground">
                          Objetivos: {targetCount} | Seleccionados: {selectedCount}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {internalGameState === GAME_STATES.READY && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <Calculator className="w-16 h-16 text-orange-600 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Par / Impar</h3>
                  <p className="text-muted-foreground max-w-md">
                    Observa los números y luego selecciona solo los pares o impares según la regla
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg max-w-sm mx-auto">
                  <div className="text-sm space-y-2 text-left">
                    <div className="font-medium">Cómo jugar:</div>
                    <ul className="space-y-1 text-xs">
                      <li>• Los números aparecen brevemente</li>
                      <li>• Selecciona PARES o IMPARES según la regla</li>
                      <li>• Feedback inmediato: verde ✓, rojo ✗</li>
                      <li>• Grids más grandes conforme avanzas</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {internalGameState === GAME_STATES.SHOWING && (
              <motion.div
                key="showing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-2xl"
              >
                <div 
                  className={`grid gap-3 p-4 bg-white rounded-lg border-2 border-dashed border-blue-300`}
                  style={{
                    gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
                    gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`
                  }}
                >
                  {currentNumbers.map((num) => (
                    <motion.div
                      key={num.id}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: num.id * 0.02 }}
                      className="aspect-square flex items-center justify-center text-lg font-bold bg-gray-100 border-2 border-gray-300 rounded-lg shadow-sm"
                      style={{
                        fontSize: `clamp(0.8rem, ${Math.max(0.8, 2.5 - gridConfig.size * 0.03)}rem, 1.5rem)`
                      }}
                    >
                      {num.value}
                    </motion.div>
                  ))}
                </div>
                <div className="text-center mt-4 space-y-2">
                  <div className="text-muted-foreground">
                    Memoriza los números...
                  </div>
                  {countdown > 0 && (
                    <div className="text-3xl font-bold text-orange-600">
                      {countdown}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {internalGameState === GAME_STATES.SELECTING && (
              <motion.div
                key="selecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-2xl"
              >
                <div 
                  className="grid gap-3 p-4"
                  style={{
                    gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
                    gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`
                  }}
                >
                  {currentNumbers.map((num) => (
                    <motion.button
                      key={num.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleNumberClick(num.id)}
                      className={`
                        aspect-square flex items-center justify-center font-bold
                        border-2 rounded-lg shadow-md transition-all duration-200
                        ${num.selected 
                          ? 'bg-blue-500 text-white border-blue-600 ring-2 ring-blue-300 shadow-lg transform scale-105' 
                          : 'bg-white border-gray-300 hover:border-gray-400 hover:shadow-lg'
                        }
                      `}
                      style={{
                        fontSize: `clamp(0.8rem, ${Math.max(0.8, 2.5 - gridConfig.size * 0.03)}rem, 1.5rem)`,
                        minHeight: '44px', // Ensure tap target size
                        minWidth: '44px'
                      }}
                    >
                      {num.value}
                    </motion.button>
                  ))}
                </div>
                <div className="text-center mt-4 space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Toca los números {currentRule === 'even' ? 'PARES' : 'IMPARES'}
                  </div>
                  <button
                    onClick={processRound}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Confirmar Selección
                  </button>
                  
                  {/* Reaction time and accuracy info */}
                  {reactionTimes.length > 0 && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        Tiempo de reacción promedio: {Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)}ms
                      </div>
                      <div>
                        Objetivos: {targetCount} | Seleccionados: {selectedCount}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {internalGameState === GAME_STATES.FEEDBACK && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl"
              >
                <div 
                  className="grid gap-3 p-4"
                  style={{
                    gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
                    gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`
                  }}
                >
                  {currentNumbers.map((num) => (
                    <motion.div
                      key={num.id}
                      initial={{ scale: 1 }}
                      animate={{ scale: num.feedback ? 1.1 : 1 }}
                      className={`
                        aspect-square flex items-center justify-center font-bold
                        border-2 rounded-lg
                        ${num.feedback === 'correct' 
                          ? 'bg-green-500 text-white border-green-600 shadow-lg' 
                          : num.feedback === 'incorrect'
                          ? 'bg-red-500 text-white border-red-600 shadow-lg'
                          : num.feedback === 'missed'
                          ? 'bg-orange-300 text-gray-800 border-orange-400'
                          : num.correct
                          ? 'bg-green-100 border-green-300 text-green-800'
                          : 'bg-gray-100 border-gray-300 text-gray-600'
                        }
                      `}
                      style={{
                        fontSize: `clamp(0.8rem, ${Math.max(0.8, 2.5 - gridConfig.size * 0.03)}rem, 1.5rem)`
                      }}
                    >
                      {num.value}
                      <div className="absolute -top-1 -right-1">
                        {num.feedback === 'correct' && <CheckCircle className="w-4 h-4 text-green-700" />}
                        {num.feedback === 'incorrect' && <XCircle className="w-4 h-4 text-red-700" />}
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {rounds.length > 0 && (
                  <div className="text-center mt-4 space-y-2">
                    <div className={`text-4xl ${
                      rounds[rounds.length - 1].accuracy >= 0.8 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {rounds[rounds.length - 1].accuracy >= 0.8 ? '✓' : '○'}
                    </div>
                    <div className="text-lg font-bold">
                      {(rounds[rounds.length - 1].accuracy * 100).toFixed(0)}% Precisión
                    </div>
                    <div className="text-sm text-muted-foreground">
                      +{rounds[rounds.length - 1].score} puntos
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Instructions */}
        {internalGameState !== GAME_STATES.READY && (
          <div className="text-center text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <div className="font-medium mb-1">
              {internalGameState === GAME_STATES.SHOWING && "Observa y memoriza los números..."}
              {internalGameState === GAME_STATES.SELECTING && `Selecciona todos los números ${currentRule === 'even' ? 'PARES' : 'IMPARES'}`}
              {internalGameState === GAME_STATES.FEEDBACK && "Calculando resultados..."}
            </div>
            <div className="flex justify-center gap-4 text-xs">
              <span>🎯 {currentRule === 'even' ? 'Pares' : 'Impares'}</span>
              <span>📊 Nivel {level}</span>
              <span>🔢 {gridConfig.size} números</span>
            </div>
          </div>
        )}
        </div>
        )
      }}
    </GameShell>
  )
}
