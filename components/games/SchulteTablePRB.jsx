'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GameShell from '../GameShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Grid3x3, Timer, Trophy, Target } from 'lucide-react'

// PR B - SchulteTable with UX polish, responsive mobile, EndScreen integration
export default function SchulteTablePRB({ onExit, onBackToGames, onViewStats }) {
  const [currentNumber, setCurrentNumber] = useState(1)
  const [numbers, setNumbers] = useState([])
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [tablesCompleted, setTablesCompleted] = useState(0)
  const [showGuide, setShowGuide] = useState(true) // PR B: Hide guide at level ≥3
  
  // Game context from GameShell
  const gameContextRef = useRef(null)

  // PR B: Generate grid numbers
  const generateGrid = (size = 5) => {
    const gridNumbers = Array.from({ length: size * size }, (_, i) => i + 1)
    return gridNumbers.sort(() => Math.random() - 0.5)
  }

  // PR B: Initialize new table
  const initializeTable = (level = 1) => {
    setNumbers(generateGrid(5))
    setCurrentNumber(1)
    setStartTime(Date.now())
    
    // PR B: Hide guide visual from level ≥3
    setShowGuide(level < 3)
  }

  useEffect(() => {
    initializeTable()
  }, [])

  // PR B: Handle number click
  const handleNumberClick = (number) => {
    if (!gameContextRef.current) return
    
    const { gameState, currentLevel } = gameContextRef.current

    if (gameState !== 'playing') return

    if (number === currentNumber) {
      // Correct number
      const timeNow = Date.now()
      const responseTime = timeNow - startTime
      
      // PR B: Scoring - faster response = more points
      const basePoints = 10
      const speedBonus = Math.max(0, Math.floor((3000 - responseTime) / 100)) // Bonus for speed
      const points = basePoints + speedBonus
      
      setScore(score + points)
      setCurrentNumber(currentNumber + 1)
      
      // If table completed, generate new one
      if (currentNumber >= 25) {
        setTablesCompleted(tablesCompleted + 1)
        initializeTable(currentLevel)
      } else {
        setStartTime(timeNow) // Reset timer for next number
      }
      
    } else {
      // Wrong number - penalty
      setMistakes(mistakes + 1)
      setScore(Math.max(0, score - 5)) // -5 points penalty, minimum 0
    }
  }

  // PR B: Handle game end
  const handleGameEnd = (gameContext) => {
    const finalScore = score
    const level = Math.floor(tablesCompleted / 2) + 1 // Level based on tables completed
    
    return {
      score: finalScore,
      level: level,
      mistakes: mistakes,
      tablesCompleted: tablesCompleted,
      gameSpecificData: {
        avgResponseTime: tablesCompleted > 0 ? (60000 / Math.max(currentNumber - 1, 1)) : 0,
        accuracy: mistakes > 0 ? ((currentNumber - 1 - mistakes) / Math.max(currentNumber - 1, 1) * 100) : 100
      }
    }
  }

  return (
    <GameShell
      gameId="schulte_table"
      gameName="Tabla de Schulte"           // PR A integration
      gameKey="schulte"                     // PR A integration  
      durationMs={60000}                    // PR B: 60 seconds duration
      onFinish={handleGameEnd}
      onExit={onExit}
      onBackToGames={onBackToGames}         // PR A integration
      onViewStats={onViewStats}             // PR A integration
    >
      {(gameContext) => {
        // Store game context for access in event handlers
        gameContextRef.current = gameContext
        const { gameState, timeElapsed, currentLevel } = gameContext

        return (
          <div className="space-y-6" data-testid="schulte-game">
            
            {/* Game Ready State */}
            {gameState === 'idle' && (
              <motion.div 
                className="text-center space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                    <Grid3x3 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Tabla de Schulte
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    Encuentra los números en orden ascendente (1, 2, 3...) lo más rápido posible
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
                    5×5 Grid
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
                  <Badge variant="outline" className="px-3 py-2">
                    <Target className="w-4 h-4 mr-2" />
                    Busca: <span className="text-2xl font-bold text-blue-600 ml-1">{currentNumber}</span>
                  </Badge>
                  <Badge variant="outline" className="px-3 py-2">
                    <Trophy className="w-4 h-4 mr-2" />
                    Puntos: {score}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-2">
                    <Grid3x3 className="w-4 h-4 mr-2" />
                    Tablas: {tablesCompleted}
                  </Badge>
                  {mistakes > 0 && (
                    <Badge variant="destructive" className="px-3 py-2">
                      Errores: {mistakes}
                    </Badge>
                  )}
                </div>

                {/* PR B: Guide visual (hidden at level ≥3) */}
                {showGuide && currentLevel < 3 && (
                  <motion.div 
                    className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💡 <strong>Tip:</strong> Busca el número {currentNumber} en la tabla. 
                      {currentNumber <= 5 && " ¡Empieza por las esquinas!"}
                    </p>
                  </motion.div>
                )}

                {/* PR B: Schulte Grid - Responsive mobile design */}
                <Card className="max-w-md mx-auto">
                  <div className="p-4">
                    <div 
                      className="grid grid-cols-5 gap-2 w-full max-w-sm mx-auto"
                      data-testid="schulte-grid"
                      style={{
                        aspectRatio: '1/1' // Ensure square grid
                      }}
                    >
                      {numbers.map((number, index) => (
                        <motion.button
                          key={`${number}-${index}`}
                          onClick={() => handleNumberClick(number)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`
                            aspect-square flex items-center justify-center
                            font-bold rounded-lg border-2 transition-all duration-200
                            min-h-[40px] min-w-[40px]
                            ${number === currentNumber 
                              ? 'border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-md' 
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm'}
                          `}
                          style={{
                            // PR B: Responsive typography with clamp
                            fontSize: 'clamp(1.25rem, 6vw, 2.25rem)'
                          }}
                          data-testid="schulte-cell"
                          aria-label={`Number ${number}`}
                        >
                          {number}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Progress hint */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Progreso: {currentNumber - 1}/25 números encontrados
                  </p>
                  <div className="w-full max-w-sm mx-auto mt-2">
                    <div 
                      className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                    >
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${((currentNumber - 1) / 25) * 100}%` }}
                      />
                    </div>
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