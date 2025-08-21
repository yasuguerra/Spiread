'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GameShell from '../GameShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Grid3x3, Timer, Trophy, Target } from 'lucide-react'
import { setLastLevel, updateGameProgress, GAME_IDS } from '@/lib/progress-tracking'
import { calculateLevelProgression, getEyeGuideConfig, getLevelDisplayInfo, GAME_LEVEL_CONFIGS } from '@/lib/level-progression'

// PR B - SchulteTable with UX polish, responsive mobile, EndScreen integration
export default function SchulteTablePRB({ onExit, onBackToGames, onViewStats }) {
  const [currentNumber, setCurrentNumber] = useState(1)
  const [numbers, setNumbers] = useState([])
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [tablesCompleted, setTablesCompleted] = useState(0)
  const [showGuide, setShowGuide] = useState(true) // PR B: Hide guide at level ≥3
  
  // New states for enhanced features
  const [bestScore, setBestScore] = useState(0)
  const [bestLevel, setBestLevel] = useState(1)
  const [continuousMode, setContinuousMode] = useState(false)
  const [sessionScore, setSessionScore] = useState(0) // Accumulated score in continuous mode
  const [sessionTables, setSessionTables] = useState(0) // Tables completed in session
  
  // Game context from GameShell
  const gameContextRef = useRef(null)

  // Load saved data from localStorage
  useEffect(() => {
    const savedBestScore = localStorage.getItem('schulte_best_score')
    const savedBestLevel = localStorage.getItem('schulte_best_level')
    const savedContinuousMode = localStorage.getItem('schulte_continuous_mode')
    
    if (savedBestScore) setBestScore(parseInt(savedBestScore))
    if (savedBestLevel) setBestLevel(parseInt(savedBestLevel))
    if (savedContinuousMode) setContinuousMode(savedContinuousMode === 'true')
  }, [])

  // Save best score and level when they change
  useEffect(() => {
    localStorage.setItem('schulte_best_score', bestScore.toString())
  }, [bestScore])

  useEffect(() => {
    localStorage.setItem('schulte_best_level', bestLevel.toString())
  }, [bestLevel])

  useEffect(() => {
    localStorage.setItem('schulte_continuous_mode', continuousMode.toString())
  }, [continuousMode])

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
    
    // Reset per-table stats but preserve session stats in continuous mode
    if (!continuousMode) {
      setSessionScore(0)
      setSessionTables(0)
    }
    
    // PR B: Eye guide rules - more sophisticated
    // Level 1-2: Full eye guide with tips
    // Level 3-4: Minimal eye guide (just target number highlight)
    // Level 5+: No eye guide at all (pure training)
    const eyeGuideLevel = getEyeGuideLevel(level)
    setShowGuide(eyeGuideLevel > 0)
  }

  // Helper function to determine eye guide level
  const getEyeGuideLevel = (level) => {
    const config = getEyeGuideConfig('schulte', level)
    return config.enabled ? (config.type === 'full' ? 2 : 1) : 0
  }

  // Get current eye guide level for display
  const currentEyeGuideLevel = gameContextRef.current 
    ? getEyeGuideLevel(gameContextRef.current.currentLevel) 
    : 2

  // Get level display info
  const levelInfo = gameContextRef.current 
    ? getLevelDisplayInfo('schulte', gameContextRef.current.currentLevel)
    : { description: 'Nivel 1 (Guía Completa)' }

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
      setSessionScore(sessionScore + points) // Track session total
      setCurrentNumber(currentNumber + 1)
      
      // If table completed, generate new one
      if (currentNumber >= 25) {
        const newTablesCompleted = tablesCompleted + 1
        const newSessionTables = sessionTables + 1
        
        setTablesCompleted(newTablesCompleted)
        setSessionTables(newSessionTables)
        
        // Update best score if current is better
        const currentTotalScore = continuousMode ? sessionScore + points : score + points
        if (currentTotalScore > bestScore) {
          setBestScore(currentTotalScore)
        }
        
        // Update best level if current is better
        if (currentLevel > bestLevel) {
          setBestLevel(currentLevel)
        }
        
        if (continuousMode) {
          // In continuous mode, immediately start new table
          initializeTable(currentLevel)
        } else {
          // In normal mode, table completion ends the game
          initializeTable(currentLevel)
        }
      } else {
        setStartTime(timeNow) // Reset timer for next number
      }
      
    } else {
      // Wrong number - penalty
      setMistakes(mistakes + 1)
      setScore(Math.max(0, score - 5)) // -5 points penalty, minimum 0
      setSessionScore(Math.max(0, sessionScore - 5)) // Also apply to session score
    }
  }

  // PR B: Handle game end
  const handleGameEnd = (gameContext) => {
    const finalScore = score
    const completionRate = (currentNumber - 1) / 25
    const accuracy = mistakes > 0 ? ((currentNumber - 1 - mistakes) / Math.max(currentNumber - 1, 1)) : 1
    
    // Use the new level progression system
    const currentLevel = gameContext.currentLevel
    const performance = {
      accuracy,
      completionRate,
      tablesCompleted,
      score: finalScore
    }
    
    const progression = calculateLevelProgression('schulte', currentLevel, performance)
    
    // Update progress tracking with new system
    const sessionSummary = {
      gameId: GAME_IDS.SCHULTE,
      score: finalScore,
      level: progression.newLevel,
      accuracy: accuracy,
      durationSec: 60, // Fixed 60-second duration
      timestamp: Date.now(),
      extras: {
        mistakes: mistakes,
        tablesCompleted: tablesCompleted,
        completionRate: completionRate,
        avgResponseTime: tablesCompleted > 0 ? (60000 / Math.max(currentNumber - 1, 1)) : 0,
        eyeGuideEnabled: currentEyeGuideLevel > 0,
        eyeGuideType: currentEyeGuideLevel === 2 ? 'full' : currentEyeGuideLevel === 1 ? 'minimal' : 'none',
        numbersFound: currentNumber - 1,
        levelProgression: progression
      }
    }
    
    // Persist the progress
    updateGameProgress(GAME_IDS.SCHULTE, sessionSummary)
    
    return {
      score: finalScore,
      level: progression.newLevel,
      levelChanged: progression.levelChanged,
      levelDirection: progression.direction,
      previousLevel: progression.previousLevel,
      mistakes: mistakes,
      tablesCompleted: tablesCompleted,
      completionRate: completionRate,
      accuracy: accuracy,
      gameSpecificData: {
        avgResponseTime: tablesCompleted > 0 ? (60000 / Math.max(currentNumber - 1, 1)) : 0,
        accuracy: accuracy * 100,
        eyeGuideEnabled: currentEyeGuideLevel > 0,
        eyeGuideType: currentEyeGuideLevel === 2 ? 'full' : currentEyeGuideLevel === 1 ? 'minimal' : 'none',
        numbersFound: currentNumber - 1,
        levelProgression: progression
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
                    {levelInfo.description}
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1">
                    <Target className="w-4 h-4 mr-1" />
                    5×5 Grid
                  </Badge>
                </div>

                {/* Best Score Display */}
                {bestScore > 0 && (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Mejor puntuación</p>
                    <div className="flex justify-center space-x-4">
                      <Badge variant="outline" className="px-3 py-1">
                        <Trophy className="w-4 h-4 mr-1" />
                        {bestScore} puntos
                      </Badge>
                      <Badge variant="outline" className="px-3 py-1">
                        <Target className="w-4 h-4 mr-1" />
                        Nivel {bestLevel}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Continuous Mode Toggle */}
                <div className="flex items-center justify-center space-x-3">
                  <label className="text-sm font-medium">Modo Continuo</label>
                  <Button
                    variant={continuousMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setContinuousMode(!continuousMode)}
                  >
                    {continuousMode ? "Activado" : "Desactivado"}
                  </Button>
                </div>
                
                {continuousMode && (
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    En modo continuo, las tablas se regeneran automáticamente y tu puntuación se acumula sin interrupciones.
                  </p>
                )}

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
                  {continuousMode && (
                    <Badge variant="outline" className="px-3 py-2 bg-green-50 border-green-200">
                      <Trophy className="w-4 h-4 mr-2 text-green-600" />
                      Sesión: {sessionScore}
                    </Badge>
                  )}
                  <Badge variant="outline" className="px-3 py-2">
                    <Grid3x3 className="w-4 h-4 mr-2" />
                    Tablas: {continuousMode ? sessionTables : tablesCompleted}
                  </Badge>
                  {mistakes > 0 && (
                    <Badge variant="destructive" className="px-3 py-2">
                      Errores: {mistakes}
                    </Badge>
                  )}
                </div>

                {/* PR B: Dynamic guide visual based on level */}
                {showGuide && currentEyeGuideLevel > 0 && (
                  <motion.div 
                    className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {currentEyeGuideLevel === 2 ? (
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        💡 <strong>Nivel {currentLevel} - Guía Completa:</strong> Busca el número <span className="font-bold text-lg">{currentNumber}</span> en la tabla. 
                        {currentNumber <= 5 && " ¡Empieza por las esquinas!"}
                        {currentNumber > 5 && currentNumber <= 13 && " Busca en los bordes primero."}
                        {currentNumber > 13 && " Revisa el centro de la tabla."}
                      </p>
                    ) : (
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        🎯 <strong>Nivel {currentLevel} - Guía Mínima:</strong> Encuentra el número <span className="font-bold text-lg">{currentNumber}</span>
                      </p>
                    )}
                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                      {levelInfo.eyeGuideStatus === 'enabled' 
                        ? `Guía se desactiva en nivel ${GAME_LEVEL_CONFIGS.schulte?.eyeGuideDisableLevel || 5}` 
                        : 'Modo experto activado - Sin guía visual'}
                    </div>
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