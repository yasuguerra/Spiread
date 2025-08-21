'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import SessionManager from './common/SessionManager'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Target, Zap, CheckCircle, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInputDebounce } from '@/hooks/useInputDebounce'
import { updateGameProgress, GAME_IDS } from '@/lib/progress-tracking'

const GAME_CONFIG = {
  name: 'par_impar',
  displayName: 'Par/Impar',
  description: 'Selecciona los números pares o impares según la regla',
  levels: {
    1: { k: 8, digitsLen: 1, exposureMs: 2000, goalRT: 3000 },
    2: { k: 10, digitsLen: 1, exposureMs: 1800, goalRT: 2800 },
    3: { k: 12, digitsLen: 1, exposureMs: 1600, goalRT: 2600 },
    4: { k: 12, digitsLen: 2, exposureMs: 2200, goalRT: 3200 },
    5: { k: 15, digitsLen: 2, exposureMs: 2000, goalRT: 3000 },
    6: { k: 18, digitsLen: 2, exposureMs: 1800, goalRT: 2800 },
    7: { k: 20, digitsLen: 2, exposureMs: 1600, goalRT: 2600 },
    8: { k: 20, digitsLen: 3, exposureMs: 2400, goalRT: 3400 },
    9: { k: 25, digitsLen: 3, exposureMs: 2200, goalRT: 3200 },
    10: { k: 30, digitsLen: 3, exposureMs: 2000, goalRT: 3000 }
  }
}

const GAME_STATES = {
  IDLE: 'idle',
  SHOWING: 'showing', 
  SELECTING: 'selecting',
  FEEDBACK: 'feedback'
}

// Deterministic number grid generator with seed
function generateNumberGrid(k, digitsLen, seed = Date.now()) {
  const rng = seedRandom(seed)
  const numbers = []
  const min = Math.pow(10, digitsLen - 1)
  const max = Math.pow(10, digitsLen) - 1
  
  for (let i = 0; i < k; i++) {
    const num = Math.floor(rng() * (max - min + 1) + min)
    numbers.push({
      id: i,
      value: num,
      isEven: num % 2 === 0,
      isOdd: num % 2 === 1,
      selected: false,
      row: Math.floor(i / Math.ceil(Math.sqrt(k))),
      col: i % Math.ceil(Math.sqrt(k))
    })
  }
  
  return numbers
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

export default function ParImparFixed({ 
  level = 1,
  durationSec = 120,
  onComplete,
  onExit 
}) {
  const [gameState, setGameState] = useState(GAME_STATES.IDLE)
  const [currentNumbers, setCurrentNumbers] = useState([])
  const [currentRule, setCurrentRule] = useState('even')
  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [selections, setSelections] = useState([])
  const [roundStartTime, setRoundStartTime] = useState(null)
  const [sessionData, setSessionData] = useState({
    totalRounds: 0,
    correctSelections: 0,
    totalSelections: 0,
    reactionTimes: [],
    accuracy: 0,
    medianRT: 0
  })

  const config = GAME_CONFIG.levels[Math.min(level, 10)]
  const gridSize = Math.ceil(Math.sqrt(config.k))
  
  // Anti-holding guard using input debounce
  const { debouncedInput, cancelDebounce } = useInputDebounce(150) // 150ms debounce
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (gameState !== GAME_STATES.SELECTING) return
      
      // Debounced number selection with keyboard
      debouncedInput(() => {
        const key = event.key
        if (key >= '0' && key <= '9') {
          // Find number with matching value
          const targetNumber = currentNumbers.find(num => 
            num.value.toString().endsWith(key)
          )
          if (targetNumber) {
            handleNumberSelection(targetNumber.id)
          }
        } else if (key === 'Enter' || key === ' ') {
          submitSelections()
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      cancelDebounce()
    }
  }, [gameState, currentNumbers, debouncedInput, cancelDebounce])

  // Generate a new round
  const generateRound = useCallback(() => {
    const seed = Date.now() + currentRound // Deterministic with round variation
    const numbers = generateNumberGrid(config.k, config.digitsLen, seed)
    
    // Alternate rule each round
    const rule = currentRound % 2 === 0 ? 'even' : 'odd'
    
    setCurrentNumbers(numbers)
    setCurrentRule(rule)
    setSelections([])
    
    return { numbers, rule }
  }, [config, currentRound])

  // Start a new round
  const startRound = useCallback(() => {
    if (!gameStarted) return
    
    setCurrentRound(prev => prev + 1)
    const { numbers, rule } = generateRound()
    
    setGameState(GAME_STATES.SHOWING)
    
    // Show grid for exposure time, then allow selection
    setTimeout(() => {
      setGameState(GAME_STATES.SELECTING)
      setRoundStartTime(Date.now())
    }, config.exposureMs)
    
  }, [gameStarted, generateRound, config.exposureMs])

  // Handle number selection
  const handleNumberSelection = useCallback((numberId) => {
    if (gameState !== GAME_STATES.SELECTING) return
    
    const selectionTime = Date.now()
    const reactionTime = selectionTime - roundStartTime
    
    setCurrentNumbers(prev => 
      prev.map(num => 
        num.id === numberId 
          ? { ...num, selected: !num.selected }
          : num
      )
    )
    
    // Record reaction time for this selection
    setSelections(prev => {
      const existing = prev.find(s => s.numberId === numberId)
      if (existing) {
        // Remove selection (toggle off)
        return prev.filter(s => s.numberId !== numberId)
      } else {
        // Add selection
        return [...prev, { numberId, reactionTime }]
      }
    })
  }, [gameState, roundStartTime])

  // Submit current selections
  const submitSelections = useCallback(() => {
    if (gameState !== GAME_STATES.SELECTING) return
    
    const submissionTime = Date.now()
    const totalRoundTime = submissionTime - roundStartTime
    
    // Calculate accuracy
    const targets = currentNumbers.filter(num => 
      currentRule === 'even' ? num.isEven : num.isOdd
    )
    const selectedNumbers = currentNumbers.filter(num => num.selected)
    const correctSelections = selectedNumbers.filter(num =>
      currentRule === 'even' ? num.isEven : num.isOdd
    )
    
    const hits = correctSelections.length
    const falsePositives = selectedNumbers.length - hits
    const misses = targets.length - hits
    const accuracy = targets.length > 0 ? hits / targets.length : 0
    
    // Calculate score
    let roundScore = hits * 2 - falsePositives // +2 per correct, -1 per false positive
    if (accuracy === 1.0 && falsePositives === 0) {
      roundScore += targets.length // Perfect bonus
    }
    roundScore = Math.max(0, roundScore)
    
    // Get reaction times for this round
    const roundReactionTimes = selections.map(s => s.reactionTime)
    const avgRT = roundReactionTimes.length > 0 
      ? roundReactionTimes.reduce((sum, rt) => sum + rt, 0) / roundReactionTimes.length
      : totalRoundTime

    // Update session data
    setSessionData(prev => {
      const newReactionTimes = [...prev.reactionTimes, ...roundReactionTimes]
      const newTotalSelections = prev.totalSelections + selectedNumbers.length
      const newCorrectSelections = prev.correctSelections + hits
      
      return {
        totalRounds: prev.totalRounds + 1,
        correctSelections: newCorrectSelections,
        totalSelections: newTotalSelections,
        reactionTimes: newReactionTimes,
        accuracy: newTotalSelections > 0 ? newCorrectSelections / newTotalSelections : 0,
        medianRT: calculateMedian(newReactionTimes)
      }
    })
    
    setScore(prev => prev + roundScore)
    setGameState(GAME_STATES.FEEDBACK)
    
    // Show feedback briefly, then start next round
    setTimeout(() => {
      startRound()
    }, 1500)
    
  }, [gameState, roundStartTime, currentNumbers, currentRule, selections, startRound])

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
      gameId: GAME_IDS.PAR_IMPAR,
      score: score,
      level: level,
      accuracy: sessionData.accuracy,
      extras: {
        totalRounds: sessionData.totalRounds,
        medianRT: sessionData.medianRT,
        avgAccuracy: sessionData.accuracy,
        k: config.k,
        digitsLen: config.digitsLen
      }
    }

    // Save progress
    updateGameProgress(GAME_IDS.PAR_IMPAR, finalSummary)
    
    onComplete?.(score, {
      rounds: sessionData.totalRounds,
      accuracy: sessionData.accuracy,
      medianRT: sessionData.medianRT
    })
  }, [score, sessionData, level, config, onComplete])

  // Handle session start
  const handleSessionStart = useCallback(() => {
    setGameStarted(true)
    setGameState(GAME_STATES.IDLE)
  }, [])

  // Utility function to calculate median
  function calculateMedian(arr) {
    if (arr.length === 0) return 0
    const sorted = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid]
  }

  // Render current content
  const renderContent = () => {
    if (!gameStarted) {
      return (
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Selecciona los números {currentRule === 'even' ? 'pares' : 'impares'}
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
            Regla: Seleccionar números <span className="text-blue-600">
              {currentRule === 'even' ? 'PARES' : 'IMPARES'}
            </span>
          </div>
          <div 
            className="grid gap-2 mx-auto max-w-md"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
          >
            {currentNumbers.map(num => (
              <div 
                key={num.id}
                className="aspect-square flex items-center justify-center text-lg font-bold bg-blue-100 rounded"
              >
                {num.value}
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Memoriza la posición de los números {currentRule === 'even' ? 'pares' : 'impares'}...
          </div>
        </div>
      )
    }

    if (gameState === GAME_STATES.SELECTING) {
      return (
        <div className="text-center space-y-4">
          <div className="text-lg font-semibold">
            Selecciona los números <span className="text-blue-600">
              {currentRule === 'even' ? 'PARES' : 'IMPARES'}
            </span>
          </div>
          <div 
            className="grid gap-2 mx-auto max-w-md"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
          >
            {currentNumbers.map(num => (
              <Button
                key={num.id}
                variant={num.selected ? "default" : "outline"}
                className={`aspect-square text-lg font-bold ${
                  num.selected ? 'bg-blue-600 text-white' : 'bg-white hover:bg-blue-50'
                }`}
                onClick={() => handleNumberSelection(num.id)}
              >
                {num.value}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Button onClick={submitSelections} className="mx-auto">
              Confirmar Selección
            </Button>
            <div className="text-sm text-muted-foreground">
              Haz clic en los números {currentRule === 'even' ? 'pares' : 'impares'} y confirma
            </div>
          </div>
        </div>
      )
    }

    if (gameState === GAME_STATES.FEEDBACK) {
      const lastSelection = selections.length > 0
      return (
        <div className="text-center space-y-4">
          <div className="text-lg font-semibold">
            {lastSelection ? '¡Bien!' : 'Próximo round'}
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
                <span>{config.k} números</span>
                <span>•</span>
                <span>{config.digitsLen} dígito{config.digitsLen > 1 ? 's' : ''}</span>
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
                  <div className="font-semibold">{sessionData.medianRT}ms</div>
                  <div className="text-muted-foreground">TR Mediana</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </SessionManager>
  )
}
