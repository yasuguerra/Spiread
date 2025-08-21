'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GameShell from '../GameShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Eye, Timer, Trophy, Target, TrendingUp, AlertCircle } from 'lucide-react'
import { getLastLevel, setLastLevel, getLastBestScore, updateBestScore } from '@/lib/progress-tracking'
import { GAME_LEVEL_CONFIGS, calculateLevelProgression } from '@/lib/level-progression'

// PR C - TwinWords with 60s gameplay and adaptive difficulty
export default function TwinWordsGridPRC({ onExit, onBackToGames, onViewStats }) {
  // Game state
  const [score, setScore] = useState(0)
  const [pairs, setPairs] = useState([])
  const [selectedCards, setSelectedCards] = useState([])
  const [mistakes, setMistakes] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [currentPairsCount, setCurrentPairsCount] = useState(4)
  const [correctPairs, setCorrectPairs] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [currentLevel, setCurrentLevel] = useState(1)
  
  // Performance tracking for adaptive difficulty 
  const [recentPerformance, setRecentPerformance] = useState([]) // Last 10s window
  const [avgSolveTime, setAvgSolveTime] = useState(0)
  const [pairStartTimes, setPairStartTimes] = useState({}) // Track when each pair appeared
  
  // Game context reference
  const gameContextRef = useRef(null)
  const performanceWindowRef = useRef([])
  const lastLevelUpdateRef = useRef(Date.now())

  // Initialize level from localStorage
  useEffect(() => {
    const savedLevel = getLastLevel('twinwords')
    if (savedLevel > 0) {
      setCurrentLevel(savedLevel)
    }
  }, [])

  // Update pairs count when level changes
  useEffect(() => {
    const pairsCount = calculatePairsCount(currentLevel)
    setCurrentPairsCount(pairsCount)
  }, [currentLevel])

  // Handle game completion
  const handleGameEnd = (gameResult) => {
    // Save final level and best score
    setLastLevel('twinwords', currentLevel)
    const previousBest = getLastBestScore('twinwords')
    if (score > previousBest) {
      updateBestScore('twinwords', score)
    }

    // Call parent completion handler if provided
    if (onExit) {
      onExit(gameResult)
    }
  }

  // PR C: Word pairs database
  const WORD_PAIRS = [
    // Similar words for difficulty
    ['casa', 'caza'], ['peso', 'beso'], ['mano', 'mono'], ['gato', 'dato'],
    ['mesa', 'meta'], ['piso', 'paso'], ['rama', 'dama'], ['cola', 'copa'],
    ['amor', 'amos'], ['luna', 'lupa'], ['vida', 'vino'], ['agua', 'agus'],
    ['papel', 'papul'], ['madre', 'madro'], ['padre', 'padru'], ['verde', 'varde'],
    ['rojo', 'rojs'], ['azul', 'azol'], ['negro', 'negru'], ['blanco', 'blenco'],
    // Accent differences  
    ['médico', 'medico'], ['rápido', 'rapido'], ['fácil', 'facil'], ['difícil', 'dificil'],
    ['música', 'musica'], ['público', 'publico'], ['único', 'unico'], ['práctico', 'practico'],
    // Letter swaps
    ['forma', 'froma'], ['tiempo', 'tiempi'], ['mundo', 'mundi'], ['grande', 'grende'],
    ['pequeño', 'peqeño'], ['ciudad', 'ciduad'], ['persona', 'presona'], ['trabajo', 'trabojo']
  ]

  // PR C: Calculate pairs count based on level
  const calculatePairsCount = (level) => {
    return Math.min(10, 4 + Math.floor(level / 2)) // 4 + floor(level/2), max 10
  }

  // PR C: Generate random pairs for current difficulty
  const generatePairs = (pairsCount) => {
    const selectedPairs = []
    const usedWords = new Set()
    
    while (selectedPairs.length < pairsCount) {
      const randomPair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)]
      const word = randomPair[Math.floor(Math.random() * 2)] // Pick one word from pair
      
      if (!usedWords.has(word)) {
        // Add the word and its pair
        selectedPairs.push({
          id: `pair-${selectedPairs.length}`,
          word1: randomPair[0],
          word2: randomPair[1],
          positions: [],
          solved: false,
          startTime: Date.now()
        })
        usedWords.add(randomPair[0])
        usedWords.add(randomPair[1])
      }
    }
    
    // Create grid positions - ensure minimum spacing for peripheral vision
    const allCards = []
    selectedPairs.forEach((pair, pairIndex) => {
      // Add both words of the pair to the grid
      allCards.push({ 
        id: `${pair.id}-1`, 
        word: pair.word1, 
        pairId: pair.id,
        pairIndex,
        isMatched: false 
      })
      allCards.push({ 
        id: `${pair.id}-2`, 
        word: pair.word2, 
        pairId: pair.id,
        pairIndex,
        isMatched: false 
      })
    })
    
    // Shuffle positions
    const shuffledCards = allCards.sort(() => Math.random() - 0.5)
    
    return { pairs: selectedPairs, cards: shuffledCards }
  }

  // PR C: Initialize game with current level
  const initializeRound = (level = 1) => {
    const pairsCount = calculatePairsCount(level)
    setCurrentPairsCount(pairsCount)
    
    const { pairs: newPairs, cards } = generatePairs(pairsCount)
    setPairs(newPairs)
    
    // Set start times for performance tracking
    const startTimes = {}
    newPairs.forEach(pair => {
      startTimes[pair.id] = Date.now()
    })
    setPairStartTimes(startTimes)
    
    setSelectedCards([])
  }

  useEffect(() => {
    initializeRound()
  }, [])

  // PR C: Handle card selection
  const handleCardClick = (card) => {
    if (!gameContextRef.current || gameContextRef.current.gameState !== 'playing') return
    if (card.isMatched) return // Already matched
    if (selectedCards.some(c => c.id === card.id)) return // Already selected

    const newSelected = [...selectedCards, card]
    setSelectedCards(newSelected)

    // Check if we have a pair
    if (newSelected.length === 2) {
      const [card1, card2] = newSelected
      const currentTime = Date.now()
      
      setTotalAttempts(totalAttempts + 1)
      
      if (card1.pairId === card2.pairId) {
        // Correct pair!
        const pairStartTime = pairStartTimes[card1.pairId] || currentTime
        const solveTime = currentTime - pairStartTime
        
        // PR C: Scoring - +1 base, +2 if solved ≤2s
        let points = 1
        if (solveTime <= 2000) {
          points += 2 // +2 extra for fast solve
        }
        
        setScore(score + points)
        setCorrectPairs(correctPairs + 1)
        
        // Mark cards as matched
        setPairs(prevPairs => 
          prevPairs.map(pair => 
            pair.id === card1.pairId ? { ...pair, solved: true } : pair
          )
        )
        
        // Track performance for adaptive difficulty
        trackPerformance(true, solveTime)
        
        // Generate new pair immediately to maintain pairsCount
        setTimeout(() => {
          regeneratePair(card1.pairId)
        }, 500)
        
      } else {
        // Wrong pair - penalty
        setScore(Math.max(0, score - 1)) // -1 point, minimum 0
        setMistakes(mistakes + 1)
        trackPerformance(false, 0)
      }
      
      // Clear selection after brief delay
      setTimeout(() => {
        setSelectedCards([])
      }, 800)
      
      // Update accuracy
      const newAccuracy = totalAttempts > 0 ? (correctPairs / (totalAttempts + 1)) * 100 : 100
      setAccuracy(newAccuracy)
    }
  }

  // PR C: Track performance for adaptive difficulty
  const trackPerformance = (success, solveTime) => {
    const now = Date.now()
    const performance = {
      timestamp: now,
      success,
      solveTime,
      accuracy: success ? 100 : 0
    }
    
    performanceWindowRef.current.push(performance)
    
    // Keep only last 10 seconds of performance data
    performanceWindowRef.current = performanceWindowRef.current.filter(
      p => now - p.timestamp <= 10000
    )
    
    setRecentPerformance([...performanceWindowRef.current])
    
    // Update average solve time
    const successfulAttempts = performanceWindowRef.current.filter(p => p.success)
    if (successfulAttempts.length > 0) {
      const avgTime = successfulAttempts.reduce((sum, p) => sum + p.solveTime, 0) / successfulAttempts.length
      setAvgSolveTime(avgTime)
    }
    
    // Check for level adjustment (every 1 second minimum)
    if (now - lastLevelUpdateRef.current >= 1000) {
      checkLevelAdjustment()
      lastLevelUpdateRef.current = now
    }
  }

  // PR C: Adaptive difficulty level adjustment
  const checkLevelAdjustment = () => {
    if (!gameContextRef.current) return
    
    const recentData = performanceWindowRef.current
    if (recentData.length < 3) return // Need minimum data
    
    const recentSuccesses = recentData.filter(p => p.success).length
    const recentAccuracy = (recentSuccesses / recentData.length) * 100
    const recentErrors = recentData.filter(p => !p.success).length
    
    // Use our new level progression system
    const performance = {
      accuracy: recentAccuracy / 100, // Convert to 0-1 range
      averageTime: avgSolveTime,
      score: score,
      mistakes: mistakes
    }
    
    const levelProgression = calculateLevelProgression('twinwords', currentLevel, performance)
    
    if (levelProgression.levelChanged) {
      const newLevel = levelProgression.newLevel
      setCurrentLevel(newLevel)
      setLastLevel('twinwords', newLevel)
      
      const newPairsCount = calculatePairsCount(newLevel)
      if (newPairsCount !== currentPairsCount) {
        setCurrentPairsCount(newPairsCount)
        setTimeout(() => initializeRound(newLevel), 100)
      }
      
      // Clear performance window after level change
      performanceWindowRef.current = []
      setRecentPerformance([])
    }
  }

  // PR C: Regenerate single pair to maintain pairs count
  const regeneratePair = (solvedPairId) => {
    if (!gameContextRef.current || gameContextRef.current.gameState !== 'playing') return
    
    // Generate one new pair to replace the solved one
    const availablePairs = WORD_PAIRS.filter(wordPair => {
      // Make sure we don't duplicate existing pairs
      return !pairs.some(existingPair => 
        existingPair.id !== solvedPairId && 
        (existingPair.word1 === wordPair[0] || existingPair.word1 === wordPair[1])
      )
    })
    
    if (availablePairs.length === 0) {
      // If no unique pairs available, recycle from existing ones
      const randomPair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)]
      const newPair = {
        id: `pair-${Date.now()}`,
        word1: randomPair[0],
        word2: randomPair[1],
        solved: false,
        startTime: Date.now()
      }
      
      setPairs(prevPairs => 
        prevPairs.map(p => p.id === solvedPairId ? newPair : p)
      )
      
      // Update start time tracking
      setPairStartTimes(prev => ({
        ...prev,
        [newPair.id]: Date.now()
      }))
    }
  }

  // Get all cards for display
  const getAllCards = () => {
    const allCards = []
    pairs.forEach((pair, pairIndex) => {
      if (!pair.solved) {
        allCards.push({ 
          id: `${pair.id}-1`, 
          word: pair.word1, 
          pairId: pair.id,
          pairIndex,
          isMatched: false 
        })
        allCards.push({ 
          id: `${pair.id}-2`, 
          word: pair.word2, 
          pairId: pair.id,
          pairIndex,
          isMatched: false 
        })
      }
    })
    return allCards.sort(() => Math.random() - 0.5)
  }

  return (
    <GameShell
      gameId="twin_words"
      gameName="Palabras Gemelas"           // PR A integration
      gameKey="twinwords"                   // PR A integration
      durationMs={60000}                    // PR C: 60 seconds fixed duration
      initialLevel={currentLevel}           // Use our saved level
      onFinish={handleGameEnd}
      onExit={onExit}
      onBackToGames={onBackToGames}         // PR A integration
      onViewStats={onViewStats}             // PR A integration
    >
      {(gameContext) => {
        gameContextRef.current = gameContext
        const { gameState, timeElapsed } = gameContext
        const allCards = getAllCards()

        return (
          <div className="space-y-6" data-testid="twinwords-game">
            
            {/* Game Ready State */}
            {gameState === 'idle' && (
              <motion.div 
                className="text-center space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                    <Eye className="w-8 h-8 text-purple-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Palabras Gemelas
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    Encuentra y empareja las palabras duplicadas en la pantalla
                  </p>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <Badge variant="secondary" className="px-3 py-1">
                    <Timer className="w-4 h-4 mr-1" />
                    60 segundos
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1">
                    <Trophy className="w-4 h-4 mr-1" />
                    Nivel {currentLevel}
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1">
                    <Target className="w-4 h-4 mr-1" />
                    {currentPairsCount} pares
                  </Badge>
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

            {/* Game Playing State */}
            {gameState === 'playing' && (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Game HUD */}
                <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
                  <Badge variant="outline" className="px-3 py-2" data-testid="hud-score">
                    <Trophy className="w-4 h-4 mr-2" />
                    Puntos: {score}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-2" data-testid="hud-timer">
                    <Timer className="w-4 h-4 mr-2" />
                    {Math.ceil((60000 - timeElapsed) / 1000)}s
                  </Badge>
                  <Badge variant="outline" className="px-3 py-2">
                    <Target className="w-4 h-4 mr-2" />
                    Nivel: {currentLevel}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-2">
                    <Eye className="w-4 h-4 mr-2" />
                    {currentPairsCount} pares
                  </Badge>
                  {accuracy < 100 && (
                    <Badge 
                      variant={accuracy >= 80 ? "secondary" : "destructive"}
                      className="px-3 py-2"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {accuracy.toFixed(0)}% precisión
                    </Badge>
                  )}
                </div>

                {/* Help text */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    💡 Empareja palabras iguales · +1 punto (+2 si ≤2s) · -1 por error
                  </p>
                </div>

                {/* Twin Words Board */}
                <Card className="max-w-4xl mx-auto">
                  <div className="p-6">
                    <div 
                      className="grid gap-3 justify-center"
                      data-testid="twinwords-board"
                      style={{
                        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(allCards.length))}, minmax(120px, 1fr))`,
                        maxWidth: '600px',
                        margin: '0 auto'
                      }}
                    >
                      <AnimatePresence>
                        {allCards.map((card) => {
                          const isSelected = selectedCards.some(c => c.id === card.id)
                          
                          return (
                            <motion.button
                              key={card.id}
                              onClick={() => handleCardClick(card)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className={`
                                relative p-4 rounded-lg border-2 transition-all duration-200
                                min-h-[60px] flex items-center justify-center
                                font-medium text-sm
                                ${isSelected 
                                  ? 'border-purple-500 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 shadow-md' 
                                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm'}
                                ${card.isMatched ? 'opacity-50' : ''}
                              `}
                              data-testid="twinwords-card"
                              aria-label={`Word: ${card.word}`}
                              disabled={card.isMatched}
                            >
                              <span className="text-center leading-tight">
                                {card.word}
                              </span>
                              
                              {isSelected && (
                                <motion.div
                                  className="absolute inset-0 border-2 border-purple-500 rounded-lg"
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.2 }}
                                />
                              )}
                            </motion.button>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                </Card>

                {/* Progress indicators */}
                <div className="text-center space-y-2">
                  <div className="flex justify-center space-x-6 text-sm">
                    <span className="text-green-600">✓ Pares: {correctPairs}</span>
                    {mistakes > 0 && <span className="text-red-600">✗ Errores: {mistakes}</span>}
                  </div>
                  
                  {/* Performance indicator for level adjustment */}
                  {recentPerformance.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Rendimiento reciente: {recentPerformance.filter(p => p.success).length}/{recentPerformance.length}
                      {avgSolveTime > 0 && ` · ${(avgSolveTime/1000).toFixed(1)}s promedio`}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Pause state */}
            {gameState === 'paused' && (
              <motion.div 
                className="text-center space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-6xl">⏸️</div>
                <h3 className="text-2xl font-semibold">Juego Pausado</h3>
                <p className="text-muted-foreground">
                  Presiona SPACE para continuar o ESC para salir
                </p>
                <div className="space-x-4">
                  <Button onClick={gameContext.resumeGame}>
                    Continuar
                  </Button>
                  <Button variant="outline" onClick={gameContext.stopGame}>
                    Terminar
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )
      }}
    </GameShell>
  )
}