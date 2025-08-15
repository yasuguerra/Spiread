'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import GameShell from '../GameShell'
import { Button } from '@/components/ui/button'

// Simple example of how to use the updated GameShell with PR A
export default function SchulteTableExample({ onExit, onBackToGames, onViewStats }) {
  const [currentNumber, setCurrentNumber] = useState(1)
  const [numbers, setNumbers] = useState([])
  const [score, setScore] = useState(0)
  
  // Generate grid numbers
  const generateGrid = (size = 5) => {
    const gridNumbers = Array.from({ length: size * size }, (_, i) => i + 1)
    return gridNumbers.sort(() => Math.random() - 0.5)
  }

  useEffect(() => {
    setNumbers(generateGrid(5))
  }, [])

  const handleNumberClick = (number) => {
    if (number === currentNumber) {
      setScore(score + 10)
      setCurrentNumber(currentNumber + 1)
      
      // If all numbers found, generate new grid
      if (currentNumber >= 25) {
        setNumbers(generateGrid(5))
        setCurrentNumber(1)
      }
    }
  }

  const handleGameEnd = (endData) => {
    return {
      score: score,
      level: Math.floor(score / 100) + 1,
      ...endData
    }
  }

  return (
    <GameShell
      gameId="schulte_table"
      gameName="Tabla de Schulte"  // PR A - Add game name
      gameKey="schulte"            // PR A - Add game key
      durationMs={60000}           // PR A - 60 seconds default
      onFinish={handleGameEnd}
      onExit={onExit}
      onBackToGames={onBackToGames}  // PR A - Add callback
      onViewStats={onViewStats}      // PR A - Add callback
    >
      {({ gameState, startGame, handleGameEnd: endGame }) => (
        <div className="space-y-4">
          
          {gameState === 'idle' && (
            <div className="text-center space-y-4">
              <div className="text-2xl font-bold text-blue-600">
                Tabla de Schulte
              </div>
              <div className="text-muted-foreground">
                Encuentra los números en orden ascendente (1, 2, 3...)
              </div>
              <Button onClick={startGame} size="lg">
                Empezar Juego
              </Button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-semibold">
                  Busca el número: <span className="text-2xl text-blue-600">{currentNumber}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Puntuación: {score}
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                {numbers.map((number, index) => (
                  <motion.button
                    key={`${number}-${index}`}
                    onClick={() => handleNumberClick(number)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      aspect-square flex items-center justify-center
                      text-lg font-bold rounded-lg border-2 transition-colors
                      ${number === currentNumber 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 bg-white hover:border-gray-400'}
                    `}
                  >
                    {number}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </GameShell>
  )
}