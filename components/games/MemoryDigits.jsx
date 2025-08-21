'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Brain, Clock, Target, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { EnhancedAdaptiveDifficulty } from '@/lib/enhanced-difficulty'
import { loadGameProgress, saveGameProgress, generateRandomNumber, getLastLevel, setLastLevel, getLastBestScore, updateBestScore } from '@/lib/progress-tracking'
import { GAME_LEVEL_CONFIGS, calculateLevelProgression } from '@/lib/level-progression'

const GAME_STATES = {
  READY: 'ready',
  SHOWING: 'showing',
  INPUT: 'input',
  FEEDBACK: 'feedback',
  SUMMARY: 'summary'
}

export default function MemoryDigits({ userId = 'anonymous', onFinish, onExit, timeLimit = 60000 }) {
  const [gameState, setGameState] = useState(GAME_STATES.READY)
  const [currentNumber, setCurrentNumber] = useState('')
  const [userInput, setUserInput] = useState('')
  const [currentRound, setCurrentRound] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [rounds, setRounds] = useState([])
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  const [gameStarted, setGameStarted] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [accuracy, setAccuracy] = useState(100)
  
  // Refs for precise timing
  const showStartTime = useRef(null)
  const inputStartTime = useRef(null)
  const gameTimer = useRef(null)
  const inputRef = useRef(null)

  // Initialize game
  useEffect(() => {
    initializeGame()
    return () => {
      if (gameTimer.current) {
        clearInterval(gameTimer.current)
      }
    }
  }, [])

  // Load saved level
  useEffect(() => {
    const savedLevel = getLastLevel('memorydigits')
    if (savedLevel > 0) {
      setCurrentLevel(savedLevel)
    }
  }, [])

  const initializeGame = async () => {
    try {
      const savedLevel = getLastLevel('memorydigits')
      const startLevel = savedLevel > 0 ? savedLevel : 1
      setCurrentLevel(startLevel)
      
      const progress = await loadGameProgress(userId, 'memory_digits')
      const difficulty = new EnhancedAdaptiveDifficulty('memory_digits', startLevel)
      setAdaptiveDifficulty(difficulty)
    } catch (error) {
      console.error('Error initializing game:', error)
      const difficulty = new EnhancedAdaptiveDifficulty('memory_digits', currentLevel)
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
    const number = generateRandomNumber(params.digitsLen)
    
    setCurrentNumber(number.toString())
    setUserInput('')
    setGameState(GAME_STATES.SHOWING)
    
    // Show number for exactly 500ms
    showStartTime.current = Date.now()
    setTimeout(() => {
      setGameState(GAME_STATES.INPUT)
      inputStartTime.current = Date.now()
      // Focus input field
      setTimeout(() => inputRef.current?.focus(), 50)
    }, 500)
  }

  const handleInputSubmit = () => {
    if (gameState !== GAME_STATES.INPUT || !userInput.trim()) return
    
    const responseTime = Date.now() - inputStartTime.current
    const isCorrect = userInput.trim() === currentNumber
    const params = adaptiveDifficulty.getGameParameters()
    
    // Calculate score
    let roundScore = 0
    if (isCorrect) {
      roundScore = params.digitsLen
      
      // Speed bonus
      const speedBonus = Math.ceil(Math.max(0, (params.goalRt - responseTime) / params.goalRt * params.digitsLen))
      roundScore += Math.max(0, speedBonus)
    }
    
    // Record trial
    const result = adaptiveDifficulty.recordTrial(isCorrect, responseTime)
    
    // Record round data
    const roundData = {
      round: currentRound,
      number: currentNumber,
      userInput: userInput.trim(),
      correct: isCorrect,
      responseTime,
      score: roundScore,
      level: result.oldLevel,
      digitsLen: params.digitsLen,
      levelChanged: result.levelChanged,
      newLevel: result.newLevel
    }
    
    setRounds(prev => [...prev, roundData])
    setTotalScore(prev => prev + roundScore)
    setGameState(GAME_STATES.FEEDBACK)
    
    // Show feedback briefly
    setTimeout(() => {
      if (timeRemaining > 2000) { // Continue if time remains
        setCurrentRound(prev => prev + 1)
        startNewRound()
      } else {
        endGame()
      }
    }, 800)
  }

  const endGame = async () => {
    if (gameTimer.current) {
      clearInterval(gameTimer.current)
    }
    
    setGameState(GAME_STATES.SUMMARY)
    
    // Save game run to database
    const gameData = {
      game: 'memory_digits',
      score: totalScore,
      duration_ms: timeLimit - timeRemaining,
      metrics: {
        total_rounds: rounds.length,
        final_level: adaptiveDifficulty?.getCurrentLevel() || 1,
        average_rt: rounds.length > 0 ? rounds.reduce((sum, r) => sum + r.responseTime, 0) / rounds.length : 0,
        accuracy: rounds.length > 0 ? rounds.filter(r => r.correct).length / rounds.length : 0,
        rounds: rounds
      }
    }
    
    // Save to game_runs (this would be handled by parent component)
    if (onFinish) {
      onFinish(gameData)
    }
    
    // Save progress
    try {
      await saveGameProgress(userId, 'memory_digits', {
        last_level: adaptiveDifficulty?.getCurrentLevel() || 1,
        last_best_score: Math.max(totalScore, 0),
        total_rounds: rounds.length,
        average_rt: rounds.length > 0 ? rounds.reduce((sum, r) => sum + r.responseTime, 0) / rounds.length : 0
      })
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && gameState === GAME_STATES.INPUT) {
      handleInputSubmit()
    }
  }

  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000)
    return `${seconds}s`
  }

  const currentParams = adaptiveDifficulty?.getGameParameters() || { digitsLen: 3, goalRt: 3500 }
  const progress = timeLimit > 0 ? ((timeLimit - timeRemaining) / timeLimit) * 100 : 0

  if (!gameStarted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            Recuerda el Número
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Memoriza números que aparecen por 500ms y escríbelos exactamente
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {adaptiveDifficulty?.getCurrentLevel() || 1}
              </div>
              <div className="text-sm text-muted-foreground">Nivel</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currentParams.digitsLen}
              </div>
              <div className="text-sm text-muted-foreground">Dígitos</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Instrucciones:</div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Un número aparecerá por exactamente 500ms</li>
              <li>• Escríbelo tan rápido y preciso como puedas</li>
              <li>• 3 aciertos consecutivos rápidos = subir nivel</li>
              <li>• Tienes 60 segundos para máxima puntuación</li>
            </ul>
          </div>
          
          <Button onClick={startGame} className="w-full" size="lg">
            <Zap className="w-4 h-4 mr-2" />
            Comenzar Juego (60s)
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (gameState === GAME_STATES.SUMMARY) {
    const accuracy = rounds.length > 0 ? rounds.filter(r => r.correct).length / rounds.length * 100 : 0
    const avgRt = rounds.length > 0 ? rounds.reduce((sum, r) => sum + r.responseTime, 0) / rounds.length : 0

    return (
      <Card className="w-full max-w-2xl mx-auto">
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
              <div className="text-3xl font-bold text-purple-600">{accuracy.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Precisión</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{(avgRt / 1000).toFixed(1)}s</div>
              <div className="text-sm text-muted-foreground">Tiempo Promedio</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">Progreso del Nivel:</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Nivel Final: {adaptiveDifficulty?.getCurrentLevel() || 1}
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
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Ronda {currentRound}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(timeRemaining)}</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{totalScore}</div>
            <div className="text-xs text-muted-foreground">Puntos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {adaptiveDifficulty?.getCurrentLevel() || 1}
            </div>
            <div className="text-xs text-muted-foreground">Nivel</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {currentParams.digitsLen}
            </div>
            <div className="text-xs text-muted-foreground">Dígitos</div>
          </div>
        </div>

        {/* Game Display */}
        <div className="min-h-[200px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed">
          <AnimatePresence mode="wait">
            {gameState === GAME_STATES.SHOWING && (
              <motion.div
                key="showing"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="text-center"
              >
                <div className="text-6xl font-mono font-bold text-blue-600 tracking-wider">
                  {currentNumber}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Memoriza este número...
                </div>
              </motion.div>
            )}

            {gameState === GAME_STATES.INPUT && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
              >
                <div className="text-lg font-medium">
                  ¿Cuál era el número?
                </div>
                <Input
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe el número..."
                  className="text-center text-2xl font-mono"
                  maxLength={currentParams.digitsLen}
                />
                <Button onClick={handleInputSubmit} disabled={!userInput.trim()}>
                  Confirmar
                </Button>
              </motion.div>
            )}

            {gameState === GAME_STATES.FEEDBACK && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                {rounds[rounds.length - 1]?.correct ? (
                  <div className="space-y-2">
                    <div className="text-4xl text-green-600">✓</div>
                    <div className="text-lg font-bold text-green-600">¡Correcto!</div>
                    <div className="text-sm">
                      +{rounds[rounds.length - 1]?.score} puntos
                    </div>
                    {rounds[rounds.length - 1]?.levelChanged && (
                      <Badge variant="default" className="bg-blue-500">
                        ¡Nivel {rounds[rounds.length - 1]?.newLevel}!
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-4xl text-red-600">✗</div>
                    <div className="text-lg font-bold text-red-600">Incorrecto</div>
                    <div className="text-sm">
                      Era: <span className="font-mono">{currentNumber}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-muted-foreground">
          {gameState === GAME_STATES.SHOWING && "Observa atentamente..."}
          {gameState === GAME_STATES.INPUT && "Escribe el número y presiona Enter"}
          {gameState === GAME_STATES.FEEDBACK && "Preparando siguiente ronda..."}
        </div>
      </CardContent>
    </Card>
  )
}