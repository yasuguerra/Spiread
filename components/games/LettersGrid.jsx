'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GameShell from '../GameShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Timer, Trophy, Target, TrendingUp, Eye, Grid3X3, AlertCircle } from 'lucide-react'
import { WORD_BANK } from '@/lib/word-bank'
import { getLastLevel, setLastLevel, getLastBestScore, updateBestScore } from '@/lib/progress-tracking'

const GAME_CONFIG = {
  name: 'letters_grid',
  displayName: 'Letters Grid',
  description: 'Encuentra las letras objetivo en la cuadrícula',
  levels: {
    1: { N: 5, targets: 1, exposureTotal: 12000, goalRT: 2000 },
    2: { N: 6, targets: 1, exposureTotal: 11000, goalRT: 1900 },
    3: { N: 6, targets: 1, exposureTotal: 10000, goalRT: 1800 },
    4: { N: 7, targets: 2, exposureTotal: 10000, goalRT: 1800 },
    5: { N: 7, targets: 2, exposureTotal: 9000, goalRT: 1700 },
    6: { N: 8, targets: 2, exposureTotal: 9000, goalRT: 1700 },
    7: { N: 8, targets: 2, exposureTotal: 8000, goalRT: 1600 },
    8: { N: 9, targets: 2, exposureTotal: 8000, goalRT: 1600 },
    9: { N: 9, targets: 2, exposureTotal: 7000, goalRT: 1500 },
    10: { N: 10, targets: 3, exposureTotal: 7000, goalRT: 1500, useConfusables: true },
    11: { N: 10, targets: 3, exposureTotal: 6500, goalRT: 1400, useConfusables: true },
    12: { N: 11, targets: 3, exposureTotal: 6000, goalRT: 1400, useConfusables: true },
    13: { N: 11, targets: 3, exposureTotal: 5500, goalRT: 1300, useConfusables: true },
    14: { N: 12, targets: 3, exposureTotal: 5500, goalRT: 1300, useConfusables: true },
    15: { N: 12, targets: 3, exposureTotal: 5000, goalRT: 1200, useConfusables: true },
    16: { N: 13, targets: 3, exposureTotal: 5000, goalRT: 1200, useConfusables: true },
    17: { N: 13, targets: 3, exposureTotal: 4500, goalRT: 1100, useConfusables: true },
    18: { N: 14, targets: 3, exposureTotal: 4500, goalRT: 1100, useConfusables: true },
    19: { N: 14, targets: 3, exposureTotal: 4200, goalRT: 1000, useConfusables: true },
    20: { N: 15, targets: 3, exposureTotal: 4000, goalRT: 1000, useConfusables: true }
  }
}

export default function LettersGrid({ 
  level = 1, 
  onComplete,
  onScoreUpdate,
  timeRemaining, // Managed by GameShell now
  locale = 'es',
  onExit,
  onBackToGames,
  onViewStats
}) {
  const [gameState, setGameState] = useState('idle') // idle, showing, complete
  const [grid, setGrid] = useState([])
  const [targetLetters, setTargetLetters] = useState([])
  const [selectedCells, setSelectedCells] = useState(new Set())
  const [score, setScore] = useState(0)
  const [sessionData, setSessionData] = useState({
    totalScreens: 0,
    totalHits: 0,
    totalFalsePositives: 0,
    totalMisses: 0,
    responseTimes: [],
    accuracy: 0,
    avgResponseTime: 0,
    currentScreenIndex: 0,
    perfectScreens: 0
  })

  // Enhanced state for fixes and progressive difficulty
  const [gameStartTime, setGameStartTime] = useState(0)
  const [currentScreenStartTime, setCurrentScreenStartTime] = useState(0)
  const [screenTimeRemaining, setScreenTimeRemaining] = useState(0)
  const [difficultyModifier, setDifficultyModifier] = useState(1) // Progressive difficulty
  const [visualDistractors, setVisualDistractors] = useState([])
  const gameContextRef = useRef(null)

  const config = GAME_CONFIG.levels[Math.min(level, 20)]
  const lettersData = WORD_BANK.lettersGrid[locale] || WORD_BANK.lettersGrid.es
  const screenStartTime = useRef(null)

  // Generate random letters with optional confusables
  const generateLetters = useCallback((count, useConfusables = false) => {
    const availableLetters = lettersData.targets
    const selectedTargets = []
    
    for (let i = 0; i < count; i++) {
      const randomLetter = availableLetters[Math.floor(Math.random() * availableLetters.length)]
      selectedTargets.push(randomLetter)
    }

    if (useConfusables) {
      // Add some confusable letters to make it harder
      selectedTargets.forEach(letter => {
        if (lettersData.confusables[letter] && Math.random() < 0.3) {
          const confusables = lettersData.confusables[letter]
          const confusable = confusables[Math.floor(Math.random() * confusables.length)]
          if (Math.random() < 0.5) {
            selectedTargets.push(confusable)
          }
        }
      })
    }

    return selectedTargets
  }, [lettersData])

  // Generate grid
  const generateGrid = useCallback(() => {
    const { N, targets: targetCount, useConfusables } = config
    const targets = generateLetters(targetCount, useConfusables)
    
    // Calculate target positions (ensure at least one of each target)
    const targetPositions = new Map()
    targets.forEach(letter => {
      if (!targetPositions.has(letter)) {
        targetPositions.set(letter, [])
      }
    })

    // Place at least one of each unique target
    const uniqueTargets = [...new Set(targets)]
    uniqueTargets.forEach(letter => {
      const row = Math.floor(Math.random() * N)
      const col = Math.floor(Math.random() * N)
      targetPositions.get(letter).push({ row, col })
    })

    // Generate random additional targets (2-4 more per target letter)
    uniqueTargets.forEach(letter => {
      const additional = 2 + Math.floor(Math.random() * 3)
      for (let i = 0; i < additional; i++) {
        const row = Math.floor(Math.random() * N)
        const col = Math.floor(Math.random() * N)
        targetPositions.get(letter).push({ row, col })
      }
    })

    // Create grid
    const newGrid = Array(N).fill(null).map(() => Array(N).fill(''))
    
    // Fill with target letters
    targetPositions.forEach((positions, letter) => {
      positions.forEach(({ row, col }) => {
        newGrid[row][col] = letter
      })
    })

    // Fill remaining cells with random letters
    const allLetters = lettersData.targets
    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        if (newGrid[row][col] === '') {
          // Use confusables sometimes if enabled
          let randomLetter
          if (useConfusables && Math.random() < 0.4) {
            const targetLetter = uniqueTargets[Math.floor(Math.random() * uniqueTargets.length)]
            const confusables = lettersData.confusables[targetLetter]
            if (confusables && Math.random() < 0.6) {
              randomLetter = confusables[Math.floor(Math.random() * confusables.length)]
            } else {
              randomLetter = allLetters[Math.floor(Math.random() * allLetters.length)]
            }
          } else {
            randomLetter = allLetters[Math.floor(Math.random() * allLetters.length)]
          }
          newGrid[row][col] = randomLetter
        }
      }
    }

    return { grid: newGrid, targets: uniqueTargets, targetPositions }
  }, [config, generateLetters, lettersData])

  // Enhanced screen timing with visual countdown
  const startScreen = useCallback(() => {
    if (!gameContextRef.current || gameContextRef.current.gameState !== 'playing') return

    // Apply progressive difficulty modifier
    const adjustedConfig = {
      ...config,
      exposureTotal: Math.max(2000, config.exposureTotal - (sessionData.totalScreens * 200 * difficultyModifier))
    }

    const { grid: newGrid, targets, targetPositions } = generateGrid()
    setGrid(newGrid)
    setTargetLetters(targets)
    setSelectedCells(new Set())
    setGameState('showing')
    
    const screenStart = Date.now()
    setCurrentScreenStartTime(screenStart)
    setScreenTimeRemaining(adjustedConfig.exposureTotal)
    
    if (gameStartTime === 0) {
      setGameStartTime(screenStart)
    }

    // Visual countdown timer for screen
    const countdownInterval = setInterval(() => {
      const elapsed = Date.now() - screenStart
      const remaining = Math.max(0, adjustedConfig.exposureTotal - elapsed)
      setScreenTimeRemaining(remaining)
      
      if (remaining <= 0) {
        clearInterval(countdownInterval)
        completeScreen(newGrid, targets, targetPositions)
      }
    }, 50) // Update every 50ms for smooth countdown

    // Store interval ref for cleanup
    screenStartTime.current = screenStart
    
    return () => clearInterval(countdownInterval)
  }, [config, generateGrid, sessionData.totalScreens, difficultyModifier, gameStartTime])

  // Handle cell click
  const handleCellClick = useCallback((row, col) => {
    if (gameState !== 'showing') return

    const cellKey = `${row}-${col}`
    const newSelected = new Set(selectedCells)
    
    if (newSelected.has(cellKey)) {
      newSelected.delete(cellKey)
    } else {
      newSelected.add(cellKey)
    }
    
    setSelectedCells(newSelected)
  }, [gameState, selectedCells])

  // Enhanced screen completion with better scoring
  const completeScreen = useCallback((currentGrid, targets, targetPositions) => {
    const rt = Date.now() - currentScreenStartTime
    
    // Calculate hits, misses, false positives
    let hits = 0
    let falsePositives = 0
    const targetCells = new Set()
    
    // Build set of all target positions
    targetPositions.forEach((positions) => {
      positions.forEach(({ row, col }) => {
        targetCells.add(`${row}-${col}`)
      })
    })

    // Check selected cells
    selectedCells.forEach(cellKey => {
      if (targetCells.has(cellKey)) {
        hits++
      } else {
        falsePositives++
      }
    })

    const misses = targetCells.size - hits
    const isPerfectScreen = hits > 0 && falsePositives === 0 && misses === 0
    
    // Enhanced scoring system
    let screenScore = 0
    
    // Base score: +2 per hit, -1 per false positive
    screenScore += hits * 2
    screenScore -= falsePositives * 1
    
    // Perfect screen bonus
    if (isPerfectScreen) {
      screenScore += Math.floor(hits * 1.5) // 1.5x bonus for perfect
    }
    
    // Speed bonus for quick completion
    const speedThreshold = config.goalRT
    if (rt < speedThreshold) {
      const speedBonus = Math.floor((speedThreshold - rt) / 200) // +1 per 200ms faster
      screenScore += speedBonus
    }
    
    // Difficulty progression bonus
    if (sessionData.totalScreens >= 5) {
      screenScore += Math.floor(sessionData.totalScreens / 5) // Progressive difficulty bonus
    }
    
    screenScore = Math.max(0, screenScore)
    setScore(prev => prev + screenScore)

    // Enhanced session tracking
    const newResponseTimes = [...sessionData.responseTimes, rt]
    const avgResponseTime = newResponseTimes.reduce((a, b) => a + b, 0) / newResponseTimes.length
    const totalAttempts = sessionData.totalHits + sessionData.totalFalsePositives + sessionData.totalMisses + hits + falsePositives + misses
    const accuracy = totalAttempts > 0 ? (sessionData.totalHits + hits) / totalAttempts : 0

    setSessionData(prev => ({
      totalScreens: prev.totalScreens + 1,
      totalHits: prev.totalHits + hits,
      totalFalsePositives: prev.totalFalsePositives + falsePositives,
      totalMisses: prev.totalMisses + misses,
      responseTimes: newResponseTimes,
      accuracy,
      avgResponseTime,
      currentScreenIndex: prev.currentScreenIndex + 1,
      perfectScreens: prev.perfectScreens + (isPerfectScreen ? 1 : 0)
    }))

    // Adjust difficulty based on performance
    if (sessionData.totalScreens > 0 && sessionData.totalScreens % 3 === 0) {
      const recentAccuracy = accuracy
      if (recentAccuracy > 0.8) {
        setDifficultyModifier(prev => Math.min(2, prev + 0.2)) // Increase difficulty
      } else if (recentAccuracy < 0.5) {
        setDifficultyModifier(prev => Math.max(0.5, prev - 0.1)) // Decrease difficulty
      }
    }

    // Continue with next screen or complete
    setTimeout(() => {
      if (gameContextRef.current && gameContextRef.current.gameState === 'playing') {
        startScreen()
      } else {
        setGameState('complete')
      }
    }, 1500) // Brief pause to show results
  }, [selectedCells, currentScreenStartTime, config, sessionData, startScreen])

  // Auto-start first screen
  useEffect(() => {
    if (timeRemaining > 0 && gameState === 'idle') {
      startScreen()
    }
  }, [timeRemaining, gameState, startScreen])

  // Handle game completion
  useEffect(() => {
    if (timeRemaining <= 0 && gameState !== 'complete') {
      setGameState('complete')
      
      const meanRT = sessionData.responseTimes.length > 0 
        ? sessionData.responseTimes.reduce((a, b) => a + b, 0) / sessionData.responseTimes.length 
        : 0

      const metrics = {
        N: config.N,
        targets: targetLetters,
        hits: sessionData.totalHits,
        falsePositives: sessionData.totalFalsePositives,
        misses: sessionData.totalMisses,
        exposure_ms: config.exposureTotal,
        mean_rt_ms: meanRT,
        totalScreens: sessionData.totalScreens,
        accuracy: sessionData.accuracy
      }

      onComplete?.(score, metrics)
    }
  }, [timeRemaining, gameState, score, sessionData, config, targetLetters, onComplete])

  const renderContent = () => {
    if (gameState === 'showing') {
      return (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <div className="flex justify-center gap-2 flex-wrap">
              {targetLetters.map((letter, index) => (
                <Badge key={index} variant="secondary" className="text-lg px-3 py-1">
                  Buscar: {letter.toUpperCase()}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Haz clic en todas las letras objetivo
            </p>
          </div>
          
          <div className="flex justify-center">
            <div 
              className="grid gap-1 p-4 bg-gray-50 rounded-lg"
              style={{ 
                gridTemplateColumns: `repeat(${config.N}, 1fr)`,
                maxWidth: '500px'
              }}
            >
              {grid.map((row, rowIndex) =>
                row.map((letter, colIndex) => {
                  const cellKey = `${rowIndex}-${colIndex}`
                  const isSelected = selectedCells.has(cellKey)
                  const isTarget = targetLetters.includes(letter.toLowerCase())
                  
                  return (
                    <button
                      key={cellKey}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      className={`
                        w-8 h-8 border border-gray-300 rounded text-sm font-mono
                        transition-all duration-150 hover:scale-105
                        ${isSelected 
                          ? 'bg-blue-500 text-white border-blue-600' 
                          : 'bg-white hover:bg-gray-100'
                        }
                      `}
                      style={{ fontSize: `${Math.max(10, 20 - config.N)}px` }}
                    >
                      {letter.toUpperCase()}
                    </button>
                  )
                })
              )}
            </div>
          </div>
          
          <div className="text-center text-xs text-muted-foreground">
            Seleccionadas: {selectedCells.size} • Tiempo restante: {Math.ceil(config.exposureTotal / 1000)}s
          </div>
        </div>
      )
    }

    if (gameState === 'complete') {
      return (
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold">¡Tiempo completado!</h3>
          <div className="space-y-2">
            <p className="text-lg">Puntuación final: <span className="font-bold text-blue-600">{score}</span></p>
            <p className="text-sm text-muted-foreground">
              Precisión: {(sessionData.accuracy * 100).toFixed(1)}% • 
              Pantallas: {sessionData.totalScreens} •
              Aciertos: {sessionData.totalHits}
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="text-center">
        <p className="text-muted-foreground">Preparando juego...</p>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{GAME_CONFIG.displayName}</h2>
            <p className="text-sm text-muted-foreground mb-4">{GAME_CONFIG.description}</p>
            <p className="text-xs text-muted-foreground">
              Nivel {level} • Grid {config.N}×{config.N} • {config.targets} objetivos
              {config.useConfusables && " • Con confusables"}
            </p>
          </div>
          
          <div className="min-h-[400px] flex items-center justify-center">
            {renderContent()}
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Puntuación: {score} • Precisión: {(sessionData.accuracy * 100).toFixed(1)}%
          </div>
        </div>
      </CardContent>
    </Card>
  )
}