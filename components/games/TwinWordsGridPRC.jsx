'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GameShell from '../GameShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Eye, Timer, Trophy, Target, TrendingUp, AlertCircle } from 'lucide-react'
import { getLastLevel, setLastLevel, getLastBestScore, updateBestScore, updateGameProgress, GAME_IDS } from '@/lib/progress-tracking'

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
  
  // Refs
  const gameContextRef = useRef(null)
  const performanceWindowRef = useRef([])
  const pairStartTimes = useRef({})

  // PR C: Enhanced word pairs database with difficulty categorization
  const WORD_PAIRS = [
    ['gato', 'mesa'], ['sol', 'agua'], ['casa', 'libro'], ['carro', 'flor'],
    ['perro', 'luna'], ['niño', 'árbol'], ['mano', 'cielo'], ['fuego', 'hielo'],
    ['día', 'noche'], ['amor', 'odio'], ['alto', 'bajo'], ['grande', 'pequeño'],
    ['nuevo', 'viejo'], ['bueno', 'malo'], ['blanco', 'negro'], ['caliente', 'frío']
  ]

  // Calculate pairs count based on level (simplified)
  const calculatePairsCount = (level) => {
    return Math.min(4 + Math.floor(level / 2), 8)
  }

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
    // Save final level and best score (backward compatibility)
    setLastLevel('twinwords', currentLevel)
    const previousBest = getLastBestScore('twinwords')
    if (score > previousBest) {
      updateBestScore('twinwords', score)
    }

    // Update progress tracking with new system
    const sessionSummary = {
      gameId: GAME_IDS.TWIN_WORDS,
      score: score,
      level: currentLevel,
      streak: currentStreak,
      accuracy: accuracy / 100,
      durationSec: 60, // Fixed 60-second duration
      timestamp: Date.now(),
      extras: {
        correctPairs: correctPairs,
        mistakes: mistakes,
        totalAttempts: totalAttempts,
        roundsCompleted: roundsCompleted,
        difficultyLevel: difficultyLevel,
        avgSolveTime: avgSolveTime,
        bestStreak: bestStreak,
        adaptiveSimilarity: adaptiveSimilarity
      }
    }

    // Persist the progress
    updateGameProgress(GAME_IDS.TWIN_WORDS, sessionSummary)

    // Call parent completion handler if provided
    if (onExit) {
      onExit(gameResult)
    }
  }

  // Initialize round with pairs
  const initializeRound = () => {
    const selectedPairs = WORD_PAIRS.slice(0, currentPairsCount)
    const generatedPairs = selectedPairs.map((pair, index) => ({
      id: `pair-${index}`,
      word1: pair[0],
      word2: pair[1],
      solved: false,
      startTime: Date.now()
    }))
    
    setPairs(generatedPairs)
    
    // Create all cards (2 cards per pair)
    const cards = []
    generatedPairs.forEach((pair, pairIndex) => {
      cards.push({
        id: `card-${pairIndex}-1`,
        word: pair.word1,
        pairId: pair.id,
        isMatched: false
      })
      cards.push({
        id: `card-${pairIndex}-2`, 
        word: pair.word2,
        pairId: pair.id,
        isMatched: false
      })
    })
    
    // Shuffle cards
    const shuffledCards = cards.sort(() => Math.random() - 0.5)
    setAllCards(shuffledCards)
    setMatchedPairs(new Set())
  }

  // Get all cards for display
  const getAllCards = () => {
    return allCards.map(card => ({
      ...card,
      isMatched: matchedPairs.has(card.pairId),
      isSelected: selectedCards.some(c => c.id === card.id)
    }))
  }

  // Handle card click
  const handleCardClick = (card) => {
    if (card.isMatched || selectedCards.length >= 2) return
    
    const newSelected = [...selectedCards, card]
    setSelectedCards(newSelected)
    
    if (newSelected.length === 2) {
      const [first, second] = newSelected
      
      if (first.word === second.word && first.id !== second.id) {
        // Match found
        setScore(prev => prev + 1)
        setCorrectPairs(prev => prev + 1)
        setMatchedPairs(prev => new Set([...prev, first.pairId]))
        
        setTimeout(() => {
          setSelectedCards([])
        }, 500)
      } else {
        // No match
        setMistakes(prev => prev + 1)
        setTimeout(() => {
          setSelectedCards([])
        }, 1000)
      }
    }
  }

  // Initialize on component mount
  useEffect(() => {
    initializeRound()
  }, [])

  return (
    <GameShell
      gameId="twin_words"
      gameName="Palabras Gemelas"
      gameKey="twinwords"
      durationMs={60000}
      initialLevel={currentLevel}
      onFinish={handleGameEnd}
      onExit={onExit}
      onBackToGames={onBackToGames}
      onViewStats={onViewStats}
    >
      {(gameContext) => {
        gameContextRef.current = gameContext
        const { gameState, timeElapsed } = gameContext

        // Initialize gameStartTime when game starts playing
        if (gameState === 'playing' && gameStartTime === 0) {
          setGameStartTime(Date.now())
        }

        const displayCards = getAllCards()

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
                </div>

                {/* Help text */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    💡 Empareja palabras iguales · +1 punto · Encuentra todos los pares
                  </p>
                </div>

                {/* Twin Words Board */}
                <Card className="max-w-4xl mx-auto">
                  <div className="p-6">
                    <div
                      className="grid gap-3 justify-center"
                      data-testid="twinwords-board"
                      style={{
                        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(displayCards.length))}, minmax(120px, 1fr))`,
                        maxWidth: '600px',
                        margin: '0 auto'
                      }}
                    >
                      <AnimatePresence>
                        {displayCards.map((card) => {
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
