'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Grid3x3, 
  Timer, 
  Target,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react'

import { getDifficultyParams, calculateSchulteScore } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

export default function SchulteTable({ onGameFinish, difficultyLevel = 1, durationMs }) {
  const [grid, setGrid] = useState([])
  const [gridSize, setGridSize] = useState(3)
  const [currentNumber, setCurrentNumber] = useState(1)
  const [gameStartTime, setGameStartTime] = useState(null)
  const [gameEndTime, setGameEndTime] = useState(null)
  const [mistakes, setMistakes] = useState(0)
  const [clickTimes, setClickTimes] = useState([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  
  const { sessionId } = useAppStore()
  const lastClickTimeRef = useRef(null)

  // Get grid size based on difficulty
  useEffect(() => {
    const params = getDifficultyParams('schulte', difficultyLevel)
    setGridSize(params.gridSize)
  }, [difficultyLevel])

  // Generate new grid
  const generateGrid = () => {
    const totalNumbers = gridSize * gridSize
    const numbers = Array.from({ length: totalNumbers }, (_, i) => i + 1)
    
    // Shuffle array
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
    }
    
    // Create 2D grid
    const newGrid = []
    for (let i = 0; i < gridSize; i++) {
      newGrid.push(numbers.slice(i * gridSize, (i + 1) * gridSize))
    }
    
    setGrid(newGrid)
    setCurrentNumber(1)
    setMistakes(0)
    setClickTimes([])
    setGameStartTime(null)
    setGameEndTime(null)
    setIsCompleted(false)
    lastClickTimeRef.current = null
  }

  // Initialize grid on component mount or gridSize change
  useEffect(() => {
    generateGrid()
  }, [gridSize])

  // Start game
  const startGame = () => {
    setShowInstructions(false)
    setGameStartTime(Date.now())
    lastClickTimeRef.current = Date.now()
  }

  // Handle cell click
  const handleCellClick = (number) => {
    if (!gameStartTime || isCompleted) return
    
    const now = Date.now()
    
    if (number === currentNumber) {
      // Correct click
      const interClickTime = lastClickTimeRef.current ? now - lastClickTimeRef.current : 0
      setClickTimes(prev => [...prev, interClickTime])
      
      if (currentNumber === gridSize * gridSize) {
        // Game completed
        setGameEndTime(now)
        setIsCompleted(true)
        handleGameCompletion(now)
      } else {
        setCurrentNumber(prev => prev + 1)
      }
      
      lastClickTimeRef.current = now
    } else {
      // Wrong click
      setMistakes(prev => prev + 1)
    }
  }

  // Handle game completion
  const handleGameCompletion = async (endTime) => {
    const totalTime = endTime - gameStartTime
    const avgInterClickTime = clickTimes.length > 0 
      ? clickTimes.reduce((a, b) => a + b, 0) / clickTimes.length 
      : 0

    const metrics = {
      grid: `${gridSize}x${gridSize}`,
      total_time_ms: totalTime,
      mistakes,
      avg_inter_click_ms: Math.round(avgInterClickTime)
    }

    const gameScore = calculateSchulteScore(metrics)

    // Save game run
    try {
      await supabase.from('gameRuns').insert({
        id: `gr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: sessionId,
        game: 'schulte',
        difficultyLevel,
        durationMs: totalTime,
        score: gameScore,
        metrics
      })
    } catch (error) {
      console.error('Error saving Schulte game run:', error)
    }

    // Call completion callback
    if (onGameFinish) {
      onGameFinish({
        game: 'schulte',
        score: gameScore,
        metrics,
        durationMs: totalTime,
        difficultyLevel
      })
    }
  }

  const progress = ((currentNumber - 1) / (gridSize * gridSize)) * 100
  const totalTime = gameEndTime && gameStartTime ? gameEndTime - gameStartTime : 0

  if (showInstructions) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5" />
            Tabla de Schulte {gridSize}×{gridSize}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Entrenamiento de Campo Visual</h3>
              <p className="text-muted-foreground">
                Encuentra los números del 1 al {gridSize * gridSize} en orden, manteniendo la fijación en el centro.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-blue-900">Instrucciones:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Mantén la mirada fija en el centro de la retícula</li>
                <li>• Usa únicamente la visión periférica para localizar números</li>
                <li>• Haz clic en los números del 1 al {gridSize * gridSize} en orden</li>
                <li>• Ve lo más rápido posible sin cometer errores</li>
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{gridSize}×{gridSize}</div>
                <div className="text-xs text-muted-foreground">Tamaño</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">Nivel {difficultyLevel}</div>
                <div className="text-xs text-muted-foreground">Dificultad</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{gridSize * gridSize}</div>
                <div className="text-xs text-muted-foreground">Números</div>
              </div>
            </div>

            <Button onClick={startGame} size="lg" className="mt-8">
              <Timer className="w-4 h-4 mr-2" />
              Comenzar Entrenamiento
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Game Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Grid3x3 className="w-5 h-5" />
              Tabla de Schulte {gridSize}×{gridSize}
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Nivel {difficultyLevel}
              </Badge>
              <Badge variant="secondary">
                Siguiente: {currentNumber}
              </Badge>
              {mistakes > 0 && (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {mistakes} errores
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progreso: {currentNumber - 1} de {gridSize * gridSize}</span>
              <span>
                {gameStartTime && !gameEndTime && (
                  `Tiempo: ${Math.round((Date.now() - gameStartTime) / 1000)}s`
                )}
                {totalTime > 0 && `Tiempo total: ${Math.round(totalTime / 1000)}s`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schulte Grid */}
      <Card>
        <CardContent className="p-8">
          <div className="relative">
            {/* Central Fixation Point */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-1 h-1 bg-red-500 rounded-full z-10"></div>
              <div className="absolute w-8 h-8 border border-red-200 rounded-full"></div>
            </div>

            {/* Grid */}
            <div 
              className="gameWrap"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                gap: 'clamp(4px, 2vw, 8px)',
                maxWidth: 'min(90vw, 480px)',
                margin: '0 auto'
              }}
            >
              {grid.flat().map((number, index) => (
                <motion.button
                  key={`${number}-${index}`}
                  onClick={() => handleCellClick(number)}
                  disabled={isCompleted}
                  className={`
                    cell
                    ${number < currentNumber 
                      ? 'bg-green-100 border-green-300 text-green-700' 
                      : number === currentNumber
                        ? 'bg-blue-100 border-blue-400 text-blue-700 shadow-lg scale-105'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }
                    ${!isCompleted && 'hover:shadow-md active:scale-95'}
                  `}
                  whileHover={{ scale: isCompleted ? 1 : 1.05 }}
                  whileTap={{ scale: isCompleted ? 1 : 0.95 }}
                >
                  {number}
                </motion.button>
              ))}
            </div>

            {/* Completion Overlay */}
            <AnimatePresence>
              {isCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm"
                >
                  <div className="text-center bg-white rounded-lg p-6 shadow-lg">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-green-800 mb-2">
                      ¡Completado!
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Tiempo: {Math.round(totalTime / 1000)}s</div>
                      <div>Errores: {mistakes}</div>
                      <div>
                        Promedio: {clickTimes.length > 0 
                          ? Math.round(clickTimes.reduce((a, b) => a + b, 0) / clickTimes.length) 
                          : 0}ms/clic
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button 
          variant="outline" 
          onClick={generateGrid}
          disabled={gameStartTime && !isCompleted}
        >
          Nueva Tabla
        </Button>
        
        {isCompleted && (
          <Button onClick={() => setShowInstructions(true)}>
            Volver al Menú
          </Button>
        )}
      </div>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Objetivo:</strong> Mantén la fijación en el punto central y usa la visión periférica
            </p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <span>🎯 Buscar: <strong>{currentNumber}</strong></span>
              <span>⏱️ Velocidad: Importante</span>
              <span>🎯 Precisión: Crítica</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}