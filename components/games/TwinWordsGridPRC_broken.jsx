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
  const [roundsCompleted, setRoundsCompleted] = useState(0)
  const [allCards, setAllCards] = useState([]) // All cards for current round
  const [matchedPairs, setMatchedPairs] = useState(new Set()) // Track which pairs are matched
  
  // Enhanced features for adaptive difficulty and streak tracking
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [difficultyLevel, setDifficultyLevel] = useState(1) // 1=basic, 2=accents, 3=font similarity, 4=extreme
  const [adaptiveSimilarity, setAdaptiveSimilarity] = useState(false)
  
  // Performance tracking for adaptive difficulty 
  const [recentPerformance, setRecentPerformance] = useState([])
  const [avgSolveTime, setAvgSolveTime] = useState(0)
  const [roundStartTime, setRoundStartTime] = useState(Date.now())
  const [gameStartTime, setGameStartTime] = useState(0)
  
  // Game context reference
  const gameContextRef = useRef(null)
  const performanceWindowRef = useRef([])
  const lastLevelUpdateRef = useRef(Date.now())

  // Load best streak from localStorage
  useEffect(() => {
    const savedBestStreak = localStorage.getItem('twinwords_best_streak')
    if (savedBestStreak) {
      setBestStreak(parseInt(savedBestStreak))
    }
  }, [])

  // Save best streak when it changes
  useEffect(() => {
    localStorage.setItem('twinwords_best_streak', bestStreak.toString())
  }, [bestStreak])

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

  // PR C: Enhanced word pairs database with difficulty categorization
  const WORD_PAIRS = {
    basic: [
      // High contrast pairs - very different
      ['gato', 'mesa'], ['sol', 'agua'], ['casa', 'libro'], ['carro', 'flor'],
      ['perro', 'luna'], ['niño', 'árbol'], ['mano', 'cielo'], ['fuego', 'hielo'],
      ['día', 'noche'], ['amor', 'odio'], ['alto', 'bajo'], ['grande', 'pequeño'],
      ['nuevo', 'viejo'], ['bueno', 'malo'], ['blanco', 'negro'], ['caliente', 'frío']
    ],
    accents: [
      // Accent differences
      ['médico', 'medico'], ['rápido', 'rapido'], ['fácil', 'facil'], ['difícil', 'dificil'],
      ['música', 'musica'], ['público', 'publico'], ['único', 'unico'], ['práctico', 'practico'],
      ['teléfono', 'telefono'], ['matemática', 'matematica'], ['automático', 'automatico'],
      ['fantástico', 'fantastico'], ['histórico', 'historico'], ['económico', 'economico']
    ],
    fontSimilar: [
      // Similar fonts/letters (m/n, b/d, p/q, etc.)
      ['casa', 'caza'], ['peso', 'beso'], ['mano', 'nano'], ['gato', 'dato'],
      ['mesa', 'meta'], ['piso', 'paso'], ['rama', 'dama'], ['cola', 'copa'],
      ['amor', 'anor'], ['luna', 'lupa'], ['vida', 'vina'], ['agua', 'aqua'],
      ['boca', 'poca'], ['dedo', 'bebo'], ['modo', 'nodo'], ['papel', 'lapel']
    ],
    extreme: [
      // Very similar - letter swaps, minimal differences
      ['forma', 'froma'], ['tiempo', 'tiempi'], ['mundo', 'mundi'], ['grande', 'grende'],
      ['pequeño', 'peqeño'], ['ciudad', 'ciduad'], ['persona', 'presona'], ['trabajo', 'trabojo'],
      ['ejemplo', 'ejempio'], ['momento', 'memento'], ['problema', 'problena'], ['sistema', 'sistena'],
      ['gobierno', 'gobiermo'], ['elemento', 'elemanto'], ['proyecto', 'proyecti'], ['desarrollo', 'desarollo']
    ]
  }

  // Get word pairs based on current difficulty level
  const getWordPairsForDifficulty = (diffLevel) => {
    switch(diffLevel) {
      case 1: return WORD_PAIRS.basic
      case 2: return [...WORD_PAIRS.basic, ...WORD_PAIRS.accents]
      case 3: return [...WORD_PAIRS.accents, ...WORD_PAIRS.fontSimilar]
      case 4: return [...WORD_PAIRS.fontSimilar, ...WORD_PAIRS.extreme]
      default: return WORD_PAIRS.basic
    }
  }

  // Adaptive difficulty adjustment based on performance
  const adjustDifficulty = (recentSolveTime, accuracy) => {
    const performanceWindow = performanceWindowRef.current
    performanceWindow.push({ time: recentSolveTime, accuracy })
    
    // Keep only last 5 rounds for performance calculation
    if (performanceWindow.length > 5) {
      performanceWindow.shift()
    }
    
    if (performanceWindow.length >= 3) {
      const avgTime = performanceWindow.reduce((sum, p) => sum + p.time, 0) / performanceWindow.length
      const avgAcc = performanceWindow.reduce((sum, p) => sum + p.accuracy, 0) / performanceWindow.length
      
      // Increase difficulty if performing well consistently
      if (avgAcc >= 90 && avgTime < 3000 && difficultyLevel < 4) {
        setDifficultyLevel(prev => Math.min(4, prev + 1))
        setAdaptiveSimilarity(true)
        performanceWindowRef.current = [] // Reset tracking
      }
      // Decrease difficulty if struggling
      else if (avgAcc < 70 && difficultyLevel > 1) {
        setDifficultyLevel(prev => Math.max(1, prev - 1))
        performanceWindowRef.current = [] // Reset tracking
      }
    }
  }

  // PR C: Calculate pairs count based on level
  const calculatePairsCount = (level) => {
    return Math.min(10, 4 + Math.floor(level / 2)) // 4 + floor(level/2), max 10
  }

  // PR C: Generate random pairs using adaptive difficulty
  const generatePairs = (pairsCount) => {
    const selectedPairs = []
    const usedWords = new Set()
    const availablePairs = getWordPairsForDifficulty(difficultyLevel)
    
    while (selectedPairs.length < pairsCount && usedWords.size < availablePairs.length * 2) {
      const randomPair = availablePairs[Math.floor(Math.random() * availablePairs.length)]
      const word1 = randomPair[0]
      const word2 = randomPair[1]
      
      if (!usedWords.has(word1) && !usedWords.has(word2)) {
        // Add the word pair
        selectedPairs.push({
          id: `pair-${selectedPairs.length}`,
          word1: word1,
          word2: word2,
          positions: [],
          solved: false,
          startTime: Date.now()
        })
        usedWords.add(word1)
        usedWords.add(word2)
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
        matched: false
      })
      allCards.push({ 
        id: `${pair.id}-2`, 
        word: pair.word2, 
        pairId: pair.id,
        matched: false
      })
    })
    
    // Shuffle all cards for random positioning
    for (let i = allCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCards[i], allCards[j]] = [allCards[j], allCards[i]]
    }
    
    setAllCards(allCards)
    setMatchedPairs(new Set())
    setRoundStartTime(Date.now())
    
    return selectedPairs
  }
  }

  // PR C: Initialize game with current level - CLASSIC MEMORY GAME STYLE
  const initializeRound = (level = 1) => {
    const pairsCount = calculatePairsCount(level)
    setCurrentPairsCount(pairsCount)
    setRoundStartTime(Date.now())
    setMatchedPairs(new Set())
    setSelectedCards([])
    
    // Generate word pairs for this round
    const { pairs: newPairs, cards } = generatePairs(pairsCount)
    setPairs(newPairs)
    setAllCards(cards) // Set all cards that will remain stable during this round
    
    console.log(`🎮 New Round: Level ${level}, ${pairsCount} pairs, ${cards.length} total cards`)
  }

  useEffect(() => {
    initializeRound(currentLevel)
  }, []) // Only run once on mount

  // Check if round is complete (all pairs matched)
  useEffect(() => {
    if (matchedPairs.size === currentPairsCount && currentPairsCount > 0) {
      // Round completed! Start new round after brief delay
      const roundTime = Date.now() - roundStartTime
      console.log(`🎉 Round completed in ${roundTime}ms`)
      
      setTimeout(() => {
        setRoundsCompleted(prev => prev + 1)
        initializeRound(currentLevel)
      }, 1500)
    }
  }, [matchedPairs.size, currentPairsCount, currentLevel, roundStartTime])


  // PR C: Handle level progression monitoring (every 10 seconds to avoid interrupting gameplay)
  useEffect(() => {
    if (!gameContextRef.current || gameContextRef.current.gameState !== 'playing') return
    if (gameStartTime === 0) return // Wait until game has actually started
    
    const levelCheck = setInterval(() => {
      if (totalAttempts > 0) {
        const levelData = calculateLevelProgression({
          correctAnswers: correctPairs,
          totalAttempts: totalAttempts,
          accuracy: accuracy,
          currentLevel: currentLevel,
          gameType: 'twin-words',
          timeSpent: Date.now() - gameStartTime
        })
        
        if (levelData.level !== currentLevel) {
          console.log(`🎉 Level progression: ${currentLevel} → ${levelData.level}`)
          setCurrentLevel(levelData.level)
          // Note: Level change is automatically tracked by the level state change
        }
      }
    }, 10000) // Check every 10 seconds (reduced from 1 second to avoid interrupting gameplay)
    
    return () => clearInterval(levelCheck)
  }, [correctPairs, totalAttempts, accuracy, currentLevel, gameStartTime])

  // PR C: Handle card selection - CLASSIC MEMORY GAME LOGIC
  const handleCardClick = (card) => {
    if (!gameContextRef.current || gameContextRef.current.gameState !== 'playing') return
    if (matchedPairs.has(card.pairId)) return // Already matched
    if (selectedCards.some(c => c.id === card.id)) return // Already selected
    if (selectedCards.length >= 2) return // Can only select 2 cards at a time

    const newSelected = [...selectedCards, card]
    setSelectedCards(newSelected)

    // Check if we have a pair selected
    if (newSelected.length === 2) {
      const [card1, card2] = newSelected
      const currentTime = Date.now()
      
      setTotalAttempts(totalAttempts + 1)
      
      if (card1.pairId === card2.pairId) {
        // ✅ CORRECT PAIR!
        const solveTime = currentTime - roundStartTime
        
        // Scoring: +10 base points, +5 bonus if quick (< 3s)
        let points = 10
        if (solveTime <= 3000) {
          points += 5 // Quick solve bonus
        }
        
        // Streak tracking - consecutive correct matches
        const newStreak = currentStreak + 1
        setCurrentStreak(newStreak)
        
        // Update best streak if needed
        if (newStreak > bestStreak) {
          setBestStreak(newStreak)
        }
        
        // Streak bonus scoring
        if (newStreak >= 5) {
          points += Math.floor(newStreak / 5) * 2 // +2 points every 5 streaks
        }
        
        setScore(score + points)
        setCorrectPairs(correctPairs + 1)
        
        // Mark this pair as matched
        setMatchedPairs(prev => new Set([...prev, card1.pairId]))
        
        // Track performance for adaptive difficulty
        const roundTime = currentTime - roundStartTime
        adjustDifficulty(roundTime, 100) // 100% accuracy for correct match
        
        console.log(`✅ Pair matched! PairId: ${card1.pairId}, Score: +${points}, Streak: ${newStreak}`)
        
        // Clear selection after brief delay
        setTimeout(() => {
          setSelectedCards([])
        }, 500)
        
      } else {
        // ❌ WRONG PAIR - reset streak
        setCurrentStreak(0)
        setScore(Math.max(0, score - 2)) // -2 points penalty
        setMistakes(mistakes + 1)
        
        // Track performance for adaptive difficulty
        const roundTime = currentTime - roundStartTime
        adjustDifficulty(roundTime, 0) // 0% accuracy for wrong match
        
        console.log(`❌ Wrong pair: ${card1.word} ≠ ${card2.word}, Streak reset`)
        
        // Clear selection after showing mistake
        setTimeout(() => {
          setSelectedCards([])
        }, 1000)
      }
      
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
    
    // Check for level adjustment (every 10 seconds minimum for stability)
    if (now - lastLevelUpdateRef.current >= 10000) {
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
      setCurrentPairsCount(newPairsCount)
      
      // STABLE DISPLAY FIX: Don't reinitialize the round when level changes
      // This prevents the constant word changing that was disrupting gameplay
      // The current pairs will remain stable until naturally completed
      // New pair count will take effect in the next natural game cycle
      
      // REMOVED: setTimeout(() => initializeRound(newLevel), 100)
      
      // Clear performance window after level change
      performanceWindowRef.current = []
      setRecentPerformance([])
    }
  }

  // PR C: Regenerate single pair to maintain pairs count
  // NOTE: Currently disabled for traditional stable display experience
  // This function is preserved for future "Continuous Flow Mode" at higher levels
  const regeneratePair = (solvedPairId) => {
    if (!gameContextRef.current || gameContextRef.current.gameState !== 'playing') return
    
    // FUTURE FEATURE: Advanced Continuous Flow Mode
    // This regeneration logic could be activated at higher levels (8+) to create
    // a more challenging, continuously evolving word grid experience
    
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
    } else {
      // Use available unique pair
      const randomPair = availablePairs[Math.floor(Math.random() * availablePairs.length)]
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

  // Get all cards for display (from the stable allCards array)
  const getAllCards = () => {
    return allCards.map(card => ({
      ...card,
      isMatched: matchedPairs.has(card.pairId),
      isSelected: selectedCards.some(c => c.id === card.id)
    }))
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
        
        // Initialize gameStartTime when game starts playing
        if (gameState === 'playing' && gameStartTime === 0) {
          setGameStartTime(Date.now())
        }
        
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
                  {currentStreak > 0 && (
                    <Badge variant="default" className="px-3 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      🔥 Racha: {currentStreak}
                    </Badge>
                  )}
                  {difficultyLevel > 1 && (
                    <Badge variant="secondary" className="px-3 py-2">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Dificultad: {difficultyLevel}
                    </Badge>
                  )}
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