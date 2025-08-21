'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SessionManager from './common/SessionManager'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Timer, Trophy, Target, TrendingUp, Eye, Grid3X3, AlertCircle } from 'lucide-react'
import { updateGameProgress, GAME_IDS } from '@/lib/progress-tracking'

const GAME_CONFIG = {
  name: 'letters_grid',
  displayName: 'Letters Grid',
  description: 'Encuentra las letras objetivo en la cuadrícula',
  levels: {
    1: { N: 5, targets: 1, exposureMs: 12000, goalRT: 2000 },
    2: { N: 6, targets: 1, exposureMs: 11000, goalRT: 1900 },
    3: { N: 6, targets: 1, exposureMs: 10000, goalRT: 1800 },
    4: { N: 7, targets: 2, exposureMs: 10000, goalRT: 1800 },
    5: { N: 7, targets: 2, exposureMs: 9000, goalRT: 1700 },
    6: { N: 8, targets: 2, exposureMs: 9000, goalRT: 1700 },
    7: { N: 8, targets: 2, exposureMs: 8000, goalRT: 1600 },
    8: { N: 9, targets: 2, exposureMs: 8000, goalRT: 1600 },
    9: { N: 9, targets: 2, exposureMs: 7000, goalRT: 1500 },
    10: { N: 10, targets: 3, exposureMs: 7000, goalRT: 1500, useConfusables: true }
  }
}

const GAME_STATES = {
  IDLE: 'idle',
  SHOWING: 'showing',
  SEARCHING: 'searching',
  FEEDBACK: 'feedback'
}

// Letter sets for different difficulty levels
const LETTER_SETS = {
  basic: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'],
  confusable: ['P', 'R', 'B', 'D', 'Q', 'O', 'C', 'G', 'U', 'V', 'W', 'M', 'N', 'H', 'A', 'E']
}

// Deterministic grid generator
function generateLetterGrid(N, targets, useConfusables = false, seed = Date.now()) {
  const rng = seedRandom(seed)
  const letterSet = useConfusables ? LETTER_SETS.confusable : LETTER_SETS.basic
  const gridSize = N
  const totalCells = N * N
  
  // Select target letters
  const targetLetters = []
  for (let i = 0; i < targets; i++) {
    let letter
    do {
      letter = letterSet[Math.floor(rng() * letterSet.length)]
    } while (targetLetters.includes(letter))
    targetLetters.push(letter)
  }
  
  // Generate grid
  const grid = []
  const targetPositions = []
  
  // Place target letters first
  for (const letter of targetLetters) {
    let position
    do {
      position = Math.floor(rng() * totalCells)
    } while (grid[position])
    
    grid[position] = { 
      letter, 
      isTarget: true, 
      id: position,
      row: Math.floor(position / N),
      col: position % N
    }
    targetPositions.push(position)
  }
  
  // Fill remaining cells
  for (let i = 0; i < totalCells; i++) {
    if (!grid[i]) {
      let letter
      do {
        letter = letterSet[Math.floor(rng() * letterSet.length)]
      } while (targetLetters.includes(letter)) // Avoid target letters as distractors
      
      grid[i] = {
        letter,
        isTarget: false,
        id: i,
        row: Math.floor(i / N),
        col: i % N
      }
    }
  }
  
  return { grid, targetLetters, targetPositions }
}

// Simple seeded random number generator
function seedRandom(seed) {
  let m = 0x80000000
  let a = 1103515245
  let c = 12345
  let state = seed ? seed : Math.floor(Math.random() * (m - 1))
  
  return function() {
    state = (a * state + c) % m
    return state / (m - 1)
  }
}

export default function LettersGridFixed({ 
  level = 1,
  durationSec = 120,
  onComplete,
  onExit 
}) {
  const [gameState, setGameState] = useState(GAME_STATES.IDLE)
  const [grid, setGrid] = useState([])
  const [targetLetters, setTargetLetters] = useState([])
  const [targetPositions, setTargetPositions] = useState([])
  const [selectedPositions, setSelectedPositions] = useState([])
  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [roundStartTime, setRoundStartTime] = useState(null)
  const [sessionData, setSessionData] = useState({
    totalRounds: 0,
    correctFinds: 0,
    totalFinds: 0,
    reactionTimes: [],
    accuracy: 0,
    avgRT: 0
  })

  const config = GAME_CONFIG.levels[Math.min(level, 10)]
  const gridSize = config.N

  // Generate a new round synchronously 
  const generateRound = useCallback(() => {
    const seed = Date.now() + currentRound // Deterministic with round variation
    const { grid: newGrid, targetLetters: targets, targetPositions: positions } = 
      generateLetterGrid(config.N, config.targets, config.useConfusables, seed)
    
    setGrid(newGrid)
    setTargetLetters(targets)
    setTargetPositions(positions)
    setSelectedPositions([])
    
    return { grid: newGrid, targetLetters: targets }
  }, [config, currentRound])

  // Start a new round
  const startRound = useCallback(() => {
    if (!gameStarted) return
    
    setCurrentRound(prev => prev + 1)
    
    // Generate grid synchronously - no async delays
    generateRound()
    
    setGameState(GAME_STATES.SHOWING)
    
    // Show grid for exposure time, then allow searching
    setTimeout(() => {
      setGameState(GAME_STATES.SEARCHING)
      setRoundStartTime(Date.now())
    }, config.exposureMs)
    
  }, [gameStarted, generateRound, config.exposureMs])

  // Handle cell selection
  const handleCellClick = useCallback((cellId) => {
    if (gameState !== GAME_STATES.SEARCHING) return
    
    const selectionTime = Date.now()
    const reactionTime = selectionTime - roundStartTime
    const cell = grid[cellId]
    
    if (!cell) return
    
    setSelectedPositions(prev => {
      if (prev.includes(cellId)) {
        // Deselect
        return prev.filter(id => id !== cellId)
      } else {
        // Select
        return [...prev, cellId]
      }
    })
    
    // If this was a target, record the reaction time
    if (cell.isTarget) {
      setSessionData(prev => ({
        ...prev,
        reactionTimes: [...prev.reactionTimes, reactionTime]
      }))
    }
  }, [gameState, grid, roundStartTime])

  // Submit current selections
  const submitSelections = useCallback(() => {
    if (gameState !== GAME_STATES.SEARCHING) return
    
    const submissionTime = Date.now()
    const totalRoundTime = submissionTime - roundStartTime
    
    // Calculate accuracy
    const correctSelections = selectedPositions.filter(pos => 
      targetPositions.includes(pos)
    ).length
    const falsePositives = selectedPositions.length - correctSelections
    const missedTargets = targetPositions.length - correctSelections
    
    const accuracy = targetPositions.length > 0 ? correctSelections / targetPositions.length : 0
    
    // Calculate score
    let roundScore = correctSelections * 3 - falsePositives // +3 per correct, -1 per false positive
    if (accuracy === 1.0 && falsePositives === 0) {
      roundScore += targetPositions.length * 2 // Perfect bonus
    }
    roundScore = Math.max(0, roundScore)
    
    // Update session data
    setSessionData(prev => {
      const newTotalFinds = prev.totalFinds + selectedPositions.length
      const newCorrectFinds = prev.correctFinds + correctSelections
      const avgRT = prev.reactionTimes.length > 0 
        ? prev.reactionTimes.reduce((sum, rt) => sum + rt, 0) / prev.reactionTimes.length
        : 0
      
      return {
        totalRounds: prev.totalRounds + 1,
        correctFinds: newCorrectFinds,
        totalFinds: newTotalFinds,
        reactionTimes: prev.reactionTimes, // Already updated in handleCellClick
        accuracy: newTotalFinds > 0 ? newCorrectFinds / newTotalFinds : 0,
        avgRT
      }
    })
    
    setScore(prev => prev + roundScore)
    setGameState(GAME_STATES.FEEDBACK)
    
    // Show feedback briefly, then start next round
    setTimeout(() => {
      startRound()
    }, 1500)
    
  }, [gameState, selectedPositions, targetPositions, roundStartTime, startRound])

  // Auto-start first round when game starts  
  useEffect(() => {
    if (gameStarted && gameState === GAME_STATES.IDLE) {
      startRound()
    }
  }, [gameStarted, gameState, startRound])

  // Handle session end
  const handleSessionEnd = useCallback((summary) => {
    const finalSummary = {
      ...summary,
      gameId: GAME_IDS.LETTERS_GRID,
      score: score,
      level: level,
      accuracy: sessionData.accuracy,
      extras: {
        totalRounds: sessionData.totalRounds,
        avgRT: sessionData.avgRT,
        gridSize: config.N,
        targets: config.targets
      }
    }

    // Save progress
    updateGameProgress(GAME_IDS.LETTERS_GRID, finalSummary)
    
    onComplete?.(score, {
      rounds: sessionData.totalRounds,
      accuracy: sessionData.accuracy,
      avgRT: sessionData.avgRT
    })
  }, [score, sessionData, level, config, onComplete])

  // Handle session start
  const handleSessionStart = useCallback(() => {
    setGameStarted(true)
    setGameState(GAME_STATES.IDLE)
  }, [])

  // Render current content
  const renderContent = () => {
    if (!gameStarted) {
      return (
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Encuentra las letras objetivo en la cuadrícula
          </p>
          <Button onClick={handleSessionStart}>
            Comenzar Juego
          </Button>
        </div>
      )
    }

    if (gameState === GAME_STATES.SHOWING) {
      return (
        <div className="text-center space-y-4">
          <div className="text-lg font-semibold">
            Memoriza las posiciones de: <span className="text-blue-600">
              {targetLetters.join(', ')}
            </span>
          </div>
          <div 
            className="grid gap-1 mx-auto max-w-md border border-gray-300 p-2 rounded"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
          >
            {grid.map((cell, index) => (
              <div 
                key={index}
                className={`aspect-square flex items-center justify-center text-lg font-bold border border-gray-200 rounded ${
                  cell.isTarget ? 'bg-blue-100 text-blue-800' : 'bg-gray-50'
                }`}
              >
                {cell.letter}
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Observa y memoriza las posiciones...
          </div>
        </div>
      )
    }

    if (gameState === GAME_STATES.SEARCHING) {
      return (
        <div className="text-center space-y-4">
          <div className="text-lg font-semibold">
            Encuentra: <span className="text-blue-600">
              {targetLetters.join(', ')}
            </span>
          </div>
          <div 
            className="grid gap-1 mx-auto max-w-md border border-gray-300 p-2 rounded"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
          >
            {grid.map((cell, index) => (
              <Button
                key={index}
                variant={selectedPositions.includes(index) ? "default" : "outline"}
                className={`aspect-square text-lg font-bold border border-gray-200 p-0 h-auto ${
                  selectedPositions.includes(index) 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white hover:bg-blue-50'
                }`}
                onClick={() => handleCellClick(index)}
              >
                {cell.letter}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Button onClick={submitSelections} className="mx-auto">
              Confirmar Selección
            </Button>
            <div className="text-sm text-muted-foreground">
              Haz clic en las letras {targetLetters.join(', ')} y confirma
            </div>
          </div>
        </div>
      )
    }

    if (gameState === GAME_STATES.FEEDBACK) {
      return (
        <div className="text-center space-y-4">
          <div className="text-lg font-semibold">
            ¡Bien!
          </div>
          <div className="text-sm text-muted-foreground">
            Preparando siguiente round...
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
    <SessionManager
      gameTitle={GAME_CONFIG.displayName}
      durationSec={durationSec}
      currentScore={score}
      currentLevel={level}
      accuracy={sessionData.accuracy * 100}
      onSessionEnd={handleSessionEnd}
      onExit={onExit}
      autoStart={false}
      showAccuracy={true}
      showLevel={true}
      className="w-full max-w-4xl mx-auto"
    >
      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">{GAME_CONFIG.description}</p>
              <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                <span>Nivel {level}</span>
                <span>•</span>
                <span>{config.N}×{config.N} cuadrícula</span>
                <span>•</span>
                <span>{config.targets} objetivo{config.targets > 1 ? 's' : ''}</span>
              </div>
            </div>
            
            <div className="min-h-[400px] flex items-center justify-center">
              {renderContent()}
            </div>

            {gameStarted && (
              <div className="flex justify-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold">{sessionData.totalRounds}</div>
                  <div className="text-muted-foreground">Rounds</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{(sessionData.accuracy * 100).toFixed(1)}%</div>
                  <div className="text-muted-foreground">Precisión</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{sessionData.avgRT.toFixed(0)}ms</div>
                  <div className="text-muted-foreground">TR Promedio</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </SessionManager>
  )
}
