'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { generateGrid, getGridConfig } from '@/lib/letters/generateGrid'
import { useCountdown } from '@/hooks/useCountdown'
import HeaderBar from './common/HeaderBar'
import SummaryDialog from './common/SummaryDialog'

// Mobile-first container styles
const containerStyles = {
  width: '100%',
  maxWidth: '480px',
  margin: '0 auto',
  padding: '0 1rem',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
}

const gridContainerStyles = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem 0'
}

export default function LettersGrid({ 
  level = 1,
  onComplete,
  onScoreUpdate,
  onExit,
  onBackToGames
}) {
  // Game state
  const [phase, setPhase] = useState<GamePhase>('ready')
  const [grid, setGrid] = useState([])
  const [gridConfig, setGridConfig] = useState(() => getGridConfig(level))
  const [selectedCells, setSelectedCells] = useState(new Set())
  const [gameStats, setGameStats] = useState({
    hits: 0,
    misses: 0,
    falsePositives: 0,
    totalTargets: 0,
    accuracy: 0,
    avgResponseTime: 0,
    selections: []
  })
  const [isGridReady, setIsGridReady] = useState(false)
  
  // Refs for timing
  const gameStartTimeRef = useRef(0)
  const selectionTimesRef = useRef([])
  
  // Countdown for showing phase (brief target exposure)
  const showingCountdown = useCountdown({
    durationSec: 3,
    autostart: false,
    onEnd: () => {
      setPhase('playing')
      gameStartTimeRef.current = performance.now()
    }
  })
  
  // Countdown for playing phase
  const playingCountdown = useCountdown({
    durationSec: 15,
    autostart: false,
    onEnd: () => {
      endGame()
    }
  })

  // Initialize grid synchronously on mount
  useEffect(() => {
    const config = getGridConfig(level)
    setGridConfig(config)
    
    // Generate grid synchronously
    const newGrid = generateGrid({
      rows: config.rows,
      cols: config.cols,
      targetLetter: config.targetLetter,
      targetCount: config.targetCount,
      confusables: config.confusables
    })
    
    setGrid(newGrid)
    setGameStats(prev => ({
      ...prev,
      totalTargets: config.targetCount
    }))
    
    // Mark grid as ready after next paint
    requestAnimationFrame(() => {
      setIsGridReady(true)
    })
  }, [level])

  const startGame = useCallback(() => {
    setPhase('showing')
    setSelectedCells(new Set())
    selectionTimesRef.current = []
    showingCountdown.start()
  }, [showingCountdown])

  const startPlaying = useCallback(() => {
    setPhase('playing')
    playingCountdown.start()
    gameStartTimeRef.current = performance.now()
  }, [playingCountdown])

  const handleCellClick = useCallback((cell) => {
    if (phase !== 'playing') return

    const selectionTime = performance.now() - gameStartTimeRef.current
    selectionTimesRef.current.push(selectionTime)

    const newSelectedCells = new Set(selectedCells)
    const wasSelected = selectedCells.has(cell.id)

    if (wasSelected) {
      // Deselect
      newSelectedCells.delete(cell.id)
    } else {
      // Select
      newSelectedCells.add(cell.id)
    }

    setSelectedCells(newSelectedCells)

    // Update stats
    const selection = {
      cellId: cell.id,
      timestamp: selectionTime,
      isCorrect: cell.isTarget
    }

    setGameStats(prev => {
      const newSelections = [...prev.selections]
      const existingIndex = newSelections.findIndex(s => s.cellId === cell.id)
      
      if (wasSelected && existingIndex >= 0) {
        // Remove selection
        newSelections.splice(existingIndex, 1)
      } else if (!wasSelected) {
        // Add selection
        newSelections.push(selection)
      }

      // Calculate stats
      const hits = newSelections.filter(s => s.isCorrect).length
      const falsePositives = newSelections.filter(s => !s.isCorrect).length
      const misses = gridConfig.targetCount - hits
      const accuracy = gridConfig.targetCount > 0 ? (hits / gridConfig.targetCount) * 100 : 0
      const avgResponseTime = selectionTimesRef.current.length > 0 
        ? selectionTimesRef.current.reduce((a, b) => a + b, 0) / selectionTimesRef.current.length 
        : 0

      const newStats = {
        hits,
        misses,
        falsePositives,
        totalTargets: gridConfig.targetCount,
        accuracy,
        avgResponseTime,
        selections: newSelections
      }

      // Update score callback
      if (onScoreUpdate) {
        const score = hits * 100 - falsePositives * 25
        onScoreUpdate(Math.max(0, score))
      }

      return newStats
    })
  }, [phase, selectedCells, gridConfig.targetCount, onScoreUpdate])

  const endGame = useCallback(() => {
    setPhase('summary')
    playingCountdown.stop()
    
    if (onComplete) {
      onComplete(gameStats)
    }
  }, [gameStats, onComplete, playingCountdown])

  const resetGame = useCallback(() => {
    setPhase('ready')
    setSelectedCells(new Set())
    setGameStats({
      hits: 0,
      misses: 0,
      falsePositives: 0,
      totalTargets: gridConfig.targetCount,
      accuracy: 0,
      avgResponseTime: 0,
      selections: []
    })
    selectionTimesRef.current = []
    showingCountdown.reset()
    playingCountdown.reset()
  }, [gridConfig.targetCount, showingCountdown, playingCountdown])

  // Skeleton grid for loading state
  const SkeletonGrid = () => (
    <div 
      className="grid gap-2 w-full max-w-sm mx-auto"
      style={{
        gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
        aspectRatio: '1'
      }}
    >
      {Array.from({ length: gridConfig.rows * gridConfig.cols }).map((_, i) => (
        <div
          key={i}
          className="aspect-square bg-gray-200 rounded animate-pulse"
        />
      ))}
    </div>
  )

  // Game grid
  const GameGrid = () => (
    <div 
      className="grid gap-2 w-full max-w-sm mx-auto"
      style={{
        gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
        aspectRatio: '1'
      }}
    >
      {grid.map((cell) => {
        const isSelected = selectedCells.has(cell.id)
        const isTarget = cell.isTarget
        const showTargets = phase === 'showing' || phase === 'summary'
        
        return (
          <button
            key={cell.id}
            onClick={() => handleCellClick(cell)}
            disabled={phase !== 'playing'}
            className={`
              aspect-square rounded font-bold text-lg flex items-center justify-center
              transition-all duration-150 border-2 touch-manipulation
              ${phase === 'playing' ? 'cursor-pointer' : 'cursor-default'}
              ${isSelected 
                ? (isTarget ? 'bg-green-500 border-green-600 text-white' : 'bg-red-500 border-red-600 text-white')
                : 'bg-white border-gray-300 text-gray-800 hover:border-gray-400'
              }
              ${showTargets && isTarget ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
            `}
            style={{
              fontSize: `clamp(1rem, ${100 / gridConfig.cols}vw, 1.5rem)`,
              minHeight: '2.5rem'
            }}
          >
            {cell.char}
          </button>
        )
      })}
    </div>
  )

  // Footer with controls
  const FooterCTA = () => {
    if (phase === 'ready') {
      return (
        <div className="p-4 space-y-3">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Encuentra todas las letras <span className="font-bold text-blue-600">{gridConfig.targetLetter}</span>
            </p>
            <p className="text-xs text-gray-500">
              {gridConfig.targetCount} objetivo{gridConfig.targetCount > 1 ? 's' : ''} en total
            </p>
          </div>
          <button
            onClick={startGame}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Comenzar
          </button>
        </div>
      )
    }

    if (phase === 'showing') {
      return (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-600 mb-2">Memoriza las posiciones...</p>
          <div className="text-2xl font-bold text-blue-600">
            {showingCountdown.timeLeft > 0 ? Math.ceil(showingCountdown.timeLeft / 1000) : '¡Ya!'}
          </div>
        </div>
      )
    }

    if (phase === 'playing') {
      return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm">
              <span className="text-green-600">✓ {gameStats.hits}</span>
              <span className="text-red-600 ml-3">✗ {gameStats.falsePositives}</span>
            </div>
            <div className="text-sm font-medium">
              {Math.ceil(playingCountdown.timeLeft / 1000)}s
            </div>
          </div>
          <button
            onClick={endGame}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-gray-700 transition-colors"
          >
            Terminar
          </button>
        </div>
      )
    }

    return null
  }

  return (
    <div style={containerStyles}>
      <HeaderBar
        title="Letters Grid"
      />

      <div style={gridContainerStyles}>
        {!isGridReady ? (
          <SkeletonGrid />
        ) : (
          <GameGrid />
        )}
      </div>

      <FooterCTA />

      {phase === 'summary' && (
        <SummaryDialog
          onClose={resetGame}
          stats={{
            score: Math.max(0, gameStats.hits * 100 - gameStats.falsePositives * 25),
            correct: gameStats.hits,
            incorrect: gameStats.falsePositives,
            missed: gameStats.misses,
            accuracy: gameStats.accuracy / 100,
            medianRT: gameStats.avgResponseTime,
            total: gameStats.totalTargets,
            selected: gameStats.hits + gameStats.falsePositives,
            targets: gameStats.totalTargets
          }}
        />
      )}
    </div>
  )
}