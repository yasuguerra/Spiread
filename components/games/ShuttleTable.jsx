'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import GameShell from '../GameShell'

export default function ShuttleTable({ difficultyLevel = 1, durationMs, onFinish, onExit }) {
  return (
    <GameShell
      gameId="shuttle"
      difficultyLevel={difficultyLevel}
      durationMs={durationMs}
      onFinish={onFinish}
      onExit={onExit}
    >
      {(gameContext) => <ShuttleGame gameContext={gameContext} />}
    </GameShell>
  )
}

function ShuttleGame({ gameContext }) {
  const [currentTable, setCurrentTable] = useState([])
  const [layoutReady, setLayoutReady] = useState(false)
  const [currentNumber, setCurrentNumber] = useState(1)
  const [tablesCompleted, setTablesCompleted] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [currentPoints, setCurrentPoints] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [tableStartTime, setTableStartTime] = useState(null)
  const [streak, setStreak] = useState(0)
  const [clickTimes, setClickTimes] = useState([])
  const [containerRect, setContainerRect] = useState({ width: 400, height: 400 })
  
  const { 
    gameState, 
    recordTrial, 
    getGameParameters, 
    handleGameEnd,
    timeElapsed 
  } = gameContext

  const lastClickRef = useRef(null)
  const containerRef = useRef(null)

  // Measure container size
  useLayoutEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setContainerRect({ width: rect.width, height: rect.height })
    }
  }, [])

  // Generate new table when game starts or table completes
  useEffect(() => {
    if (gameState === 'playing' && currentTable.length === 0) {
      generateNewTable()
    }
  }, [gameState])

  const generateCells = (numbersCount, layout) => {
    // Generate numbers
    const numbers = Array.from({ length: numbersCount }, (_, i) => i + 1)
    
    // Shuffle
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
    }

    // Create cells with stable IDs but no positions yet
    return numbers.map((number, index) => ({
      id: `cell-${number}-${Date.now()}-${index}`,
      value: number,
      color: getRandomColor(),
      position: null // Will be calculated later
    }))
  }

  const computePositions = (cells, layout, params) => {
    if (!containerRect.width || !containerRect.height) {
      return cells // Return cells without positions if container not ready
    }

    if (layout === 'grid') {
      const gridSize = Math.ceil(Math.sqrt(params.numbersCount))
      const cellSize = Math.min(containerRect.width, containerRect.height) / (gridSize + 1)
      
      return cells.map((cell, index) => {
        const row = Math.floor(index / gridSize)
        const col = index % gridSize
        
        return {
          ...cell,
          position: {
            x: (col + 1) * (containerRect.width / (gridSize + 1)),
            y: (row + 1) * (containerRect.height / (gridSize + 1))
          },
          size: cellSize * 0.8
        }
      })
    } else {
      // Dispersed layout with collision avoidance
      const minDistance = 60
      const positions = []
      
      return cells.map((cell, index) => {
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
          ...cell,
          position,
          size: 48
        }
      })
    }
  }

  const generateNewTable = () => {
    const params = getGameParameters()
    const { numbersCount, layout, hasColorDistractors, isDescending } = params
    
    setLayoutReady(false)
    
    // Generate cells without positions first
    const cells = generateCells(numbersCount, layout)
    
    // Compute positions
    const cellsWithPositions = computePositions(cells, layout, params)
    
    setCurrentTable(cellsWithPositions)
    setCurrentNumber(isDescending ? numbersCount : 1)
    setTableStartTime(Date.now())
    setCurrentPoints(0)
    setMistakes(0)
    setClickTimes([])
    lastClickRef.current = Date.now()
    
    // Mark layout as ready after positions are computed
    setTimeout(() => setLayoutReady(true), 100)
  }

  const getRandomColor = () => {
    const colors = [
      'text-red-600', 'text-blue-600', 'text-green-600', 
      'text-purple-600', 'text-orange-600', 'text-pink-600'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const handleNumberClick = (clickedNumber) => {
    if (!tableStartTime || !layoutReady) return

    const now = Date.now()
    const params = getGameParameters()
    const { targetTime, isDescending, numbersCount } = params
    
    const expectedNumber = currentNumber
    const isCorrect = clickedNumber === expectedNumber

    if (isCorrect) {
      // Correct click
      const interClickTime = lastClickRef.current ? now - lastClickRef.current : 0
      setClickTimes(prev => [...prev, interClickTime])
      
      const nextNumber = isDescending ? currentNumber - 1 : currentNumber + 1
      const isTableComplete = isDescending ? nextNumber < 1 : nextNumber > numbersCount
      
      if (isTableComplete) {
        // Table completed
        completeTable(now)
      } else {
        setCurrentNumber(nextNumber)
      }
      
      lastClickRef.current = now
    } else {
      // Wrong click
      setMistakes(prev => prev + 1)
      recordTrial(false, now - lastClickRef.current, { 
        expected: expectedNumber, 
        clicked: clickedNumber 
      })
    }
  }

  const completeTable = (completionTime) => {
    const params = getGameParameters()
    const { targetTime, numbersCount } = params
    
    const tableTime = completionTime - tableStartTime
    const wasWithinTarget = tableTime <= targetTime
    
    // Calculate points
    const basePoints = numbersCount
    const timeBonus = Math.max(0, Math.min(numbersCount, (targetTime / tableTime) * numbersCount))
    const streakMultiplier = 1 + Math.floor(streak / 3) * 0.1
    const mistakePenalty = mistakes * 2
    
    const tablePoints = Math.round((basePoints + timeBonus) * streakMultiplier - mistakePenalty)
    const finalPoints = Math.max(0, tablePoints)
    
    setCurrentPoints(finalPoints)
    setTotalPoints(prev => prev + finalPoints)
    setTablesCompleted(prev => prev + 1)
    
    // Update streak
    if (wasWithinTarget && mistakes === 0) {
      setStreak(prev => prev + 1)
    } else {
      setStreak(0)
    }
    
    // Record trial for adaptive difficulty
    const success = wasWithinTarget && mistakes <= 1
    recordTrial(success, tableTime, {
      numbersCount,
      layout: params.layout,
      mistakes,
      time: tableTime,
      points: finalPoints
    })

    // Brief pause to show points, then generate new table
    setTimeout(() => {
      generateNewTable()
    }, 1500)
  }

  // Check for game end conditions
  useEffect(() => {
    if (gameState === 'playing' && timeElapsed > 0) {
      // Game ends when time limit reached (handled by GameShell)
      // or manually stopped
    }
  }, [timeElapsed, gameState])

  // Game end handler
  useEffect(() => {
    if (gameState === 'summary') {
      const avgClickTime = clickTimes.length > 0 
        ? clickTimes.reduce((a, b) => a + b, 0) / clickTimes.length 
        : 0

      const finalResults = {
        score: Math.min(100, Math.round(totalPoints / Math.max(1, tablesCompleted) * 2)),
        metrics: {
          tables_completed: tablesCompleted,
          total_points: totalPoints,
          avg_time_ms: avgClickTime,
          total_mistakes: mistakes,
          final_streak: streak
        }
      }

      handleGameEnd(finalResults)
    }
  }, [gameState])

  const progress = getGameParameters().numbersCount > 0 
    ? ((getGameParameters().isDescending 
        ? getGameParameters().numbersCount - currentNumber + 1
        : currentNumber - 1) / getGameParameters().numbersCount) * 100
    : 0

  const params = getGameParameters()

  return (
    <div className="space-y-6">
      {/* Game Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{tablesCompleted}</div>
              <div className="text-xs text-muted-foreground">Tablas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalPoints}</div>
              <div className="text-xs text-muted-foreground">Puntos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{streak}</div>
              <div className="text-xs text-muted-foreground">Racha</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{params.numbersCount || 9}</div>
              <div className="text-xs text-muted-foreground">Números</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{mistakes}</div>
              <div className="text-xs text-muted-foreground">Errores</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current target and progress */}
      <Card>
        <CardContent className="p-4 text-center">
          <div className="space-y-2">
            <div className="text-lg font-medium">
              Buscar: <span className="text-3xl font-bold text-blue-600">{currentNumber}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {currentPoints > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-green-600 font-bold"
              >
                +{currentPoints} puntos!
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Game Area */}
      <Card>
        <CardContent className="p-8">
          <div className="relative min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed">
            {/* Central fixation point */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="absolute w-12 h-12 border border-red-200 rounded-full"></div>
            </div>

            {/* Numbers Display */}
            <AnimatePresence>
              {currentTable.length > 0 && (
                <div className="relative w-full h-[400px]">
                  {params.layout === 'grid' ? (
                    // Grid Layout
                    <div 
                      className="grid gap-4 h-full w-full p-4"
                      style={{ 
                        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(params.numbersCount))}, 1fr)`
                      }}
                    >
                      {currentTable.flat().map((cell, index) => (
                        cell && (
                          <motion.button
                            key={`${cell.number}-${index}`}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleNumberClick(cell.number)}
                            className={`
                              aspect-square flex items-center justify-center text-xl font-bold
                              bg-white border-2 rounded-lg shadow-md transition-all
                              ${cell.number === currentNumber 
                                ? 'border-blue-400 bg-blue-50' 
                                : 'border-gray-300 hover:border-gray-400'
                              }
                              ${cell.color}
                            `}
                          >
                            {cell.number}
                          </motion.button>
                        )
                      ))}
                    </div>
                  ) : (
                    // Dispersed Layout
                    <>
                      {currentTable.map((cell, index) => (
                        <motion.button
                          key={`${cell.number}-${index}`}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleNumberClick(cell.number)}
                          className={`
                            absolute w-12 h-12 flex items-center justify-center text-lg font-bold
                            bg-white border-2 rounded-lg shadow-md transition-all
                            ${cell.number === currentNumber 
                              ? 'border-blue-400 bg-blue-50' 
                              : 'border-gray-300 hover:border-gray-400'
                            }
                            ${cell.color}
                          `}
                          style={{
                            left: `${cell.position.x}%`,
                            top: `${cell.position.y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          {cell.number}
                        </motion.button>
                      ))}
                    </>
                  )}
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
              Mantén la mirada en el punto central rojo y usa la visión periférica
            </div>
            <div className="flex justify-center gap-6 text-xs">
              <span>🎯 Buscar: {params.isDescending ? 'Descendente' : 'Ascendente'}</span>
              <span>⚡ Layout: {params.layout === 'grid' ? 'Grilla' : 'Disperso'}</span>
              <span>🎨 Colores: {params.hasColorDistractors ? 'Activados' : 'Desactivados'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}