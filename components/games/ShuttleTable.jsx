'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Grid3x3, Clock, Target, Zap, Eye } from 'lucide-react'
import { EnhancedAdaptiveDifficulty } from '@/lib/enhanced-difficulty'
import { loadGameProgress, saveGameProgress, generateSchulteNumbers } from '@/lib/progress-tracking'

const GAME_STATES = {
  READY: 'ready',
  PLAYING: 'playing',
  SUMMARY: 'summary'
}

export default function ShuttleTable({ userId = 'anonymous', onFinish, onExit, timeLimit = 60000 }) {
  const [gameState, setGameState] = useState(GAME_STATES.READY)
  const [currentTable, setCurrentTable] = useState([])
  const [layoutReady, setLayoutReady] = useState(false)
  const [currentTarget, setCurrentTarget] = useState(1)
  const [tablesCompleted, setTablesCompleted] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [currentTableScore, setCurrentTableScore] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [tableStartTime, setTableStartTime] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  const [gameStarted, setGameStarted] = useState(false)
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(null)
  const [containerRect, setContainerRect] = useState({ width: 400, height: 400 })
  const [tables, setTables] = useState([])

  const containerRef = useRef(null)
  const gameTimer = useRef(null)

  // Initialize game
  useEffect(() => {
    initializeGame()
    return () => {
      if (gameTimer.current) {
        clearInterval(gameTimer.current)
      }
    }
  }, [])

  // Measure container size
  useLayoutEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setContainerRect({ width: rect.width, height: rect.height })
    }
  }, [])

  const initializeGame = async () => {
    try {
      const progress = await loadGameProgress(userId, 'schulte')
      const difficulty = new EnhancedAdaptiveDifficulty('schulte', progress.last_level)
      setAdaptiveDifficulty(difficulty)
    } catch (error) {
      console.error('Error initializing game:', error)
      const difficulty = new EnhancedAdaptiveDifficulty('schulte', 1)
      setAdaptiveDifficulty(difficulty)
    }
  }

  const startGame = () => {
    setGameStarted(true)
    setGameState(GAME_STATES.PLAYING)
    setTablesCompleted(0)
    setTotalScore(0)
    setTables([])
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
    
    generateNewTable()
  }

  const generateNewTable = () => {
    if (!adaptiveDifficulty) return
    
    const params = adaptiveDifficulty.getGameParameters()
    setLayoutReady(false)
    
    // Generate values based on mode
    const values = generateSchulteNumbers(params.n, params.mode)
    
    // Create cells with positions
    const cells = computePositions(values, params)
    
    setCurrentTable(cells)
    setCurrentTarget(getInitialTarget(params))
    setTableStartTime(Date.now())
    setCurrentTableScore(0)
    setMistakes(0)
    
    // Mark layout as ready
    setTimeout(() => setLayoutReady(true), 100)
  }

  const getInitialTarget = (params) => {
    switch (params.mode) {
      case 'descending':
        return params.n
      case 'letters':
        return 'A'
      case 'multiples':
        return 3
      case 'primes':
        return 2
      case 'fibonacci':
        return 1
      default:
        return 1
    }
  }

  const getNextTarget = (current, params) => {
    switch (params.mode) {
      case 'descending':
        return current - 1
      case 'letters':
        return String.fromCharCode(current.charCodeAt(0) + 1)
      case 'multiples':
        return current + 3
      case 'primes':
        return getNextPrime(current)
      case 'fibonacci':
        return getNextFibonacci(current, params.n)
      default:
        return current + 1
    }
  }

  const isTableComplete = (target, params) => {
    switch (params.mode) {
      case 'descending':
        return target < 1
      case 'letters':
        return target.charCodeAt(0) > 'A'.charCodeAt(0) + params.n - 1
      case 'multiples':
        return target > params.n * 3
      case 'primes':
      case 'fibonacci':
        return target > Math.max(...currentTable.map(c => c.value))
      default:
        return target > params.n
    }
  }

  const computePositions = (values, params) => {
    if (!containerRect.width || !containerRect.height) {
      return values.map((value, index) => ({
        id: `cell-${value}-${Date.now()}-${index}`,
        value,
        position: null,
        size: 48
      }))
    }

    if (params.layout === 'grid') {
      const gridSize = Math.ceil(Math.sqrt(params.n))
      const cellSize = Math.min(containerRect.width, containerRect.height) / (gridSize + 1)
      
      return values.map((value, index) => {
        const row = Math.floor(index / gridSize)
        const col = index % gridSize
        
        return {
          id: `cell-${value}-${Date.now()}-${index}`,
          value,
          position: {
            x: (col + 1) * (containerRect.width / (gridSize + 1)),
            y: (row + 1) * (containerRect.height / (gridSize + 1))
          },
          size: cellSize * 0.8,
          style: params.hasDistractors ? getRandomStyle() : null
        }
      })
    } else {
      // Dispersed layout with collision avoidance
      const minDistance = 60
      const positions = []
      
      return values.map((value, index) => {
        let attempts = 0
        let position
        
        do {
          position = {
            x: Math.random() * (containerRect.width - 100) + 50,
            y: Math.random() * (containerRect.height - 100) + 50
          }
          attempts++
        } while (attempts < 50 && positions.some(pos => 
          Math.sqrt(Math.pow(pos.x - position.x, 2) + Math.pow(pos.y - position.y, 2)) < minDistance
        ))
        
        positions.push(position)
        
        return {
          id: `cell-${value}-${Date.now()}-${index}`,
          value,
          position,
          size: 48,
          style: params.hasDistractors ? getRandomStyle() : null
        }
      })
    }
  }

  const getRandomStyle = () => {
    const colors = ['text-red-600', 'text-blue-600', 'text-green-600', 'text-purple-600']
    const opacities = ['opacity-70', 'opacity-85', 'opacity-100']
    
    return {
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: opacities[Math.floor(Math.random() * opacities.length)]
    }
  }

  const handleCellClick = (clickedValue) => {
    if (!tableStartTime || !layoutReady || gameState !== GAME_STATES.PLAYING) return

    const params = adaptiveDifficulty.getGameParameters()
    const isCorrect = clickedValue === currentTarget
    
    if (isCorrect) {
      const nextTarget = getNextTarget(currentTarget, params)
      
      if (isTableComplete(nextTarget, params)) {
        completeTable()
      } else {
        setCurrentTarget(nextTarget)
      }
    } else {
      setMistakes(prev => prev + 1)
      // Flash error feedback could be added here
    }
  }

  const completeTable = () => {
    const now = Date.now()
    const tableTime = now - tableStartTime
    const params = adaptiveDifficulty.getGameParameters()
    
    // Calculate score
    const baseScore = params.n
    const timeBonus = Math.max(0, Math.min(params.n, (params.targetTime / tableTime) * params.n))
    const mistakePenalty = mistakes * 2
    const tableScore = Math.max(0, Math.round(baseScore + timeBonus - mistakePenalty))
    
    setCurrentTableScore(tableScore)
    setTotalScore(prev => prev + tableScore)
    setTablesCompleted(prev => prev + 1)
    
    // Record trial for adaptive difficulty
    const success = tableTime <= params.targetTime && mistakes <= 1
    const result = adaptiveDifficulty.recordTrial(success, tableTime, {
      n: params.n,
      layout: params.layout,
      mode: params.mode,
      mistakes,
      time_ms: tableTime,
      score: tableScore
    })

    // Record table data
    const tableData = {
      n: params.n,
      layout: params.layout,
      mode: params.mode,
      mistakes,
      time_ms: tableTime,
      score: tableScore,
      level: result.oldLevel,
      levelChanged: result.levelChanged,
      newLevel: result.newLevel
    }
    
    setTables(prev => [...prev, tableData])
    
    // Brief pause to show score, then generate new table
    setTimeout(() => {
      if (timeRemaining > 3000) {
        generateNewTable()
      } else {
        endGame()
      }
    }, 1000)
  }

  const endGame = async () => {
    if (gameTimer.current) {
      clearInterval(gameTimer.current)
    }
    
    setGameState(GAME_STATES.SUMMARY)
    
    // Save game run
    const gameData = {
      game: 'schulte',
      score: totalScore,
      duration_ms: timeLimit - timeRemaining,
      metrics: {
        total_tables: tablesCompleted,
        final_level: adaptiveDifficulty?.getCurrentLevel() || 1,
        average_time: tables.length > 0 ? tables.reduce((sum, t) => sum + t.time_ms, 0) / tables.length : 0,
        total_mistakes: tables.reduce((sum, t) => sum + t.mistakes, 0),
        tables: tables
      }
    }
    
    if (onFinish) {
      onFinish(gameData)
    }
    
    // Save progress
    try {
      await saveGameProgress(userId, 'schulte', {
        last_level: adaptiveDifficulty?.getCurrentLevel() || 1,
        last_best_score: Math.max(totalScore, 0),
        total_tables: tablesCompleted,
        best_table_time: tables.length > 0 ? Math.min(...tables.map(t => t.time_ms)) : null
      })
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000)
    return `${seconds}s`
  }

  const currentParams = adaptiveDifficulty?.getGameParameters() || { n: 9, layout: 'grid', hasGuide: true }
  const progress = timeLimit > 0 ? ((timeLimit - timeRemaining) / timeLimit) * 100 : 0

  // Helper functions for special number sequences
  const getNextPrime = (current) => {
    let next = current + 1
    while (!isPrime(next)) next++
    return next
  }

  const isPrime = (num) => {
    if (num < 2) return false
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false
    }
    return true
  }

  const getNextFibonacci = (current, maxN) => {
    const fibSeq = [1, 1]
    while (fibSeq[fibSeq.length - 1] < maxN * 10) {
      fibSeq.push(fibSeq[fibSeq.length - 1] + fibSeq[fibSeq.length - 2])
    }
    const currentIndex = fibSeq.indexOf(current)
    return currentIndex >= 0 && currentIndex < fibSeq.length - 1 ? fibSeq[currentIndex + 1] : current + 1
  }

  if (!gameStarted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="w-6 h-6 text-blue-500" />
            Schulte Table
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Encuentra números en orden secuencial lo más rápido posible
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
                {currentParams.n}
              </div>
              <div className="text-sm text-muted-foreground">Números</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {currentParams.layout === 'grid' ? 'Grilla' : 'Disperso'}
              </div>
              <div className="text-sm text-muted-foreground">Layout</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Características del Nivel:</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {currentParams.mode ? currentParams.mode : 'números'}
              </Badge>
              {currentParams.hasGuide ? (
                <Badge variant="secondary">
                  <Eye className="w-3 h-3 mr-1" />
                  Con guía visual
                </Badge>
              ) : (
                <Badge variant="destructive">
                  Sin guía visual
                </Badge>
              )}
              {currentParams.hasDistractors && (
                <Badge variant="outline">Distractores</Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Instrucciones:</div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Haz clic en los números/letras en orden secuencial</li>
              <li>• Mantén la mirada en el centro (punto rojo)</li>
              <li>• Usa visión periférica para encontrar objetivos</li>
              <li>• Completa tantas tablas como puedas en 60 segundos</li>
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
    const avgTime = tables.length > 0 ? tables.reduce((sum, t) => sum + t.time_ms, 0) / tables.length : 0
    const totalMistakes = tables.reduce((sum, t) => sum + t.mistakes, 0)

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
              <div className="text-3xl font-bold text-green-600">{tablesCompleted}</div>
              <div className="text-sm text-muted-foreground">Tablas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{(avgTime / 1000).toFixed(1)}s</div>
              <div className="text-sm text-muted-foreground">Tiempo Promedio</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{totalMistakes}</div>
              <div className="text-sm text-muted-foreground">Errores</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">Progreso del Nivel:</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Nivel Final: {adaptiveDifficulty?.getCurrentLevel() || 1}
              </Badge>
              <Badge variant="outline">
                Números: {currentParams.n}
              </Badge>
              <Badge variant="outline">
                {currentParams.layout === 'grid' ? 'Grilla' : 'Disperso'}
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-blue-500" />
            Tabla {tablesCompleted + 1} - Buscar: {currentTarget}
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(timeRemaining)}</span>
            </div>
            <Badge variant="outline">
              Nivel {adaptiveDifficulty?.getCurrentLevel() || 1}
            </Badge>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Game Stats */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{totalScore}</div>
            <div className="text-xs text-muted-foreground">Puntos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{tablesCompleted}</div>
            <div className="text-xs text-muted-foreground">Tablas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{currentParams.n}</div>
            <div className="text-xs text-muted-foreground">Números</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{mistakes}</div>
            <div className="text-xs text-muted-foreground">Errores</div>
          </div>
        </div>

        {/* Game Area */}
        <Card>
          <CardContent className="p-8">
            <div 
              ref={containerRef}
              className="relative min-h-[500px] bg-gray-50 rounded-lg border-2 border-dashed"
            >
              {/* Central fixation point - only show if hasGuide is true */}
              {currentParams.hasGuide && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="absolute w-12 h-12 border border-red-200 rounded-full"></div>
                </div>
              )}

              {/* Numbers Display */}
              <AnimatePresence>
                {layoutReady && currentTable.length > 0 && (
                  <div className="relative w-full h-[500px]">
                    {currentParams.layout === 'grid' ? (
                      // Grid Layout
                      <div 
                        className="grid gap-2 h-full w-full p-4"
                        style={{ 
                          gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(currentParams.n))}, 1fr)`
                        }}
                      >
                        {currentTable
                          .filter(cell => cell && cell.position)
                          .map((cell) => (
                            <motion.button
                              key={cell.id}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCellClick(cell.value)}
                              className={`
                                aspect-square flex items-center justify-center text-xl font-bold
                                bg-white border-2 rounded-lg shadow-md transition-all
                                ${cell.value === currentTarget 
                                  ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200' 
                                  : 'border-gray-300 hover:border-gray-400'
                                }
                                ${cell.style?.color || 'text-gray-800'}
                                ${cell.style?.opacity || ''}
                              `}
                            >
                              {cell.value}
                            </motion.button>
                          )
                        )}
                      </div>
                    ) : (
                      // Dispersed Layout
                      <>
                        {currentTable
                          .filter(cell => cell && cell.position && cell.position.x !== undefined && cell.position.y !== undefined)
                          .map((cell) => (
                            <motion.button
                              key={cell.id}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCellClick(cell.value)}
                              className={`
                                absolute flex items-center justify-center text-lg font-bold
                                bg-white border-2 rounded-lg shadow-md transition-all
                                ${cell.value === currentTarget 
                                  ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200' 
                                  : 'border-gray-300 hover:border-gray-400'
                                }
                                ${cell.style?.color || 'text-gray-800'}
                                ${cell.style?.opacity || ''}
                              `}
                              style={{
                                left: `${cell.position.x}px`,
                                top: `${cell.position.y}px`,
                                width: `${cell.size || 48}px`,
                                height: `${cell.size || 48}px`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              {cell.value}
                            </motion.button>
                          )
                        )}
                      </>
                    )}
                  </div>
                )}
                
                {/* Loading skeleton */}
                {!layoutReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gray-500">Generando tabla...</div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <div className="font-medium">
                {currentParams.hasGuide 
                  ? 'Mantén la mirada en el punto central rojo y usa la visión periférica'
                  : 'Usa toda tu visión periférica para encontrar el siguiente número'
                }
              </div>
              <div className="flex justify-center gap-6 text-xs">
                <span>🎯 Objetivo: {currentTarget}</span>
                <span>⚡ Layout: {currentParams.layout === 'grid' ? 'Grilla' : 'Disperso'}</span>
                <span>🎨 Modo: {currentParams.mode || 'números'}</span>
                {!currentParams.hasGuide && <span>👁️ Sin guía visual</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}