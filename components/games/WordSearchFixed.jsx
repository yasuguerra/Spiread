'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SessionManager from './common/SessionManager'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, CheckCircle, Target, Timer } from 'lucide-react'
import { updateGameProgress, GAME_IDS } from '@/lib/progress-tracking'

const GAME_CONFIG = {
  name: 'word_search',
  displayName: 'Word Search',
  description: 'Encuentra las palabras ocultas en la sopa de letras',
  levels: {
    1: { gridSize: 8, wordsCount: 3, diagonals: false, reverse: false, goalTimePerWord: 8000 },
    2: { gridSize: 8, wordsCount: 3, diagonals: false, reverse: false, goalTimePerWord: 7500 },
    3: { gridSize: 9, wordsCount: 4, diagonals: false, reverse: false, goalTimePerWord: 7000 },
    4: { gridSize: 9, wordsCount: 4, diagonals: false, reverse: false, goalTimePerWord: 6500 },
    5: { gridSize: 10, wordsCount: 5, diagonals: false, reverse: false, goalTimePerWord: 6000 },
    6: { gridSize: 10, wordsCount: 5, diagonals: false, reverse: false, goalTimePerWord: 5500 },
    7: { gridSize: 11, wordsCount: 6, diagonals: false, reverse: false, goalTimePerWord: 5000 },
    8: { gridSize: 11, wordsCount: 6, diagonals: true, reverse: true, goalTimePerWord: 5000 },
    9: { gridSize: 12, wordsCount: 7, diagonals: true, reverse: true, goalTimePerWord: 4500 },
    10: { gridSize: 12, wordsCount: 7, diagonals: true, reverse: true, goalTimePerWord: 4000 }
  }
}

const DIRECTIONS = {
  horizontal: [0, 1],
  vertical: [1, 0],
  diagonalDown: [1, 1],
  diagonalUp: [-1, 1]
}

// Simple word list for demo - replace with actual word bank
const WORD_BANK = {
  4: ['GATO', 'CASA', 'MESA', 'LUNA', 'FLOR', 'AGUA', 'CAMA', 'MANO'],
  5: ['VERDE', 'SALTO', 'FUEGO', 'PLAYA', 'RELOJ', 'LARGO', 'NEGRO', 'CAMPO'],
  6: ['CIUDAD', 'ESCUELA', 'ANIMAL', 'JARDIN', 'PUERTO', 'MUSICA', 'VIENTO', 'TIERRA'],
  7: ['VENTANA', 'PERSONA', 'CORTINA', 'GUITARRA', 'CAMINAR', 'ALEGRIA', 'MONTANA', 'PINTURA']
}

// Deterministic grid generator with seeded RNG
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

export default function WordSearchFixed({ 
  level = 1,
  durationSec = 120,
  onComplete,
  onExit 
}) {
  const [gameState, setGameState] = useState('idle') // idle, playing, complete
  const [grid, setGrid] = useState([])
  const [words, setWords] = useState([])
  const [foundWords, setFoundWords] = useState(new Set())
  const [wordPositions, setWordPositions] = useState(new Map())
  const [selection, setSelection] = useState({ start: null, end: null, cells: [] })
  const [isSelecting, setIsSelecting] = useState(false)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [currentRound, setCurrentRound] = useState(0)
  const [sessionData, setSessionData] = useState({
    totalRounds: 0,
    totalWordsFound: 0,
    wordFindTimes: [],
    invalidSelections: 0,
    accuracy: 0,
    avgFindTime: 0
  })

  const gridRef = useRef(null)
  const roundStartTime = useRef(null)
  const config = GAME_CONFIG.levels[Math.min(level, 10)]

  // Get words for current round
  const getWordsForRound = useCallback((seed) => {
    const rng = seedRandom(seed)
    const allWords = []
    
    // Collect words from different lengths
    for (let length = 4; length <= 7; length++) {
      if (WORD_BANK[length]) {
        allWords.push(...WORD_BANK[length])
      }
    }
    
    // Deterministic shuffle and selection
    const shuffled = [...allWords]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    return shuffled.slice(0, config.wordsCount)
  }, [config.wordsCount])

  // Place word in grid
  const placeWord = useCallback((grid, word, gridSize, diagonals, reverse, rng) => {
    const directions = [
      DIRECTIONS.horizontal,
      DIRECTIONS.vertical
    ]
    
    if (diagonals) {
      directions.push(DIRECTIONS.diagonalDown, DIRECTIONS.diagonalUp)
    }

    // Try placements deterministically
    for (let attempts = 0; attempts < 100; attempts++) {
      const direction = directions[Math.floor(rng() * directions.length)]
      const [dr, dc] = direction
      
      // Randomly decide if word should be reversed
      const actualWord = (reverse && rng() < 0.3) ? word.split('').reverse().join('') : word
      
      // Find valid starting position
      const maxRow = dr >= 0 ? gridSize - actualWord.length : actualWord.length - 1
      const maxCol = dc >= 0 ? gridSize - actualWord.length : actualWord.length - 1
      const minRow = dr < 0 ? actualWord.length - 1 : 0
      const minCol = dc < 0 ? actualWord.length - 1 : 0
      
      if (maxRow < minRow || maxCol < minCol) continue
      
      const startRow = minRow + Math.floor(rng() * (maxRow - minRow + 1))
      const startCol = minCol + Math.floor(rng() * (maxCol - minCol + 1))
      
      // Check if word can be placed
      let canPlace = true
      const positions = []
      
      for (let i = 0; i < actualWord.length; i++) {
        const row = startRow + i * dr
        const col = startCol + i * dc
        
        if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
          canPlace = false
          break
        }
        
        if (grid[row][col] !== '' && grid[row][col] !== actualWord[i].toUpperCase()) {
          canPlace = false
          break
        }
        
        positions.push({ row, col, letter: actualWord[i].toUpperCase() })
      }
      
      if (canPlace) {
        // Place the word
        positions.forEach(({ row, col, letter }) => {
          grid[row][col] = letter
        })
        
        return { positions, word: actualWord, originalWord: word }
      }
    }
    
    return null
  }, [])

  // Generate new round
  const generateRound = useCallback(() => {
    const seed = Date.now() + currentRound // Deterministic with round variation
    const rng = seedRandom(seed)
    const { gridSize } = config
    const roundWords = getWordsForRound(seed)
    const newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''))
    const newWordPositions = new Map()
    const placedWords = []

    // Place words
    roundWords.forEach(word => {
      const placement = placeWord(newGrid, word, gridSize, config.diagonals, config.reverse, rng)
      if (placement) {
        newWordPositions.set(word, placement.positions)
        placedWords.push(word)
      }
    })

    // Fill empty cells with random letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (newGrid[row][col] === '') {
          newGrid[row][col] = alphabet[Math.floor(rng() * alphabet.length)]
        }
      }
    }

    return { grid: newGrid, words: placedWords, wordPositions: newWordPositions }
  }, [config, currentRound, getWordsForRound, placeWord])

  // Start new round
  const startRound = useCallback(() => {
    if (!gameStarted) return

    setCurrentRound(prev => prev + 1)
    
    const { grid: newGrid, words: newWords, wordPositions: newWordPositions } = generateRound()
    setGrid(newGrid)
    setWords(newWords)
    setWordPositions(newWordPositions)
    setFoundWords(new Set())
    setSelection({ start: null, end: null, cells: [] })
    setGameState('playing')
    roundStartTime.current = Date.now()
  }, [gameStarted, generateRound])

  // Get cell coordinates from a pointer event (with normalization)
  const getCellFromEvent = useCallback((e) => {
    if (!gridRef.current) return null
    
    const rect = gridRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const cellWidth = rect.width / config.gridSize
    const cellHeight = rect.height / config.gridSize

    const col = Math.floor(x / cellWidth)
    const row = Math.floor(y / cellHeight)

    if (row >= 0 && row < config.gridSize && col >= 0 && col < config.gridSize) {
      return { row, col }
    }

    return null
  }, [config.gridSize])

  // Get cells in a straight line between two points (FIXED ALGORITHM)
  const getLineCells = useCallback((start, end) => {
    const cells = []
    const dx = end.col - start.col
    const dy = end.row - start.row
    
    // Only allow straight lines (horizontal, vertical, diagonal)
    if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) {
      return [start] // Invalid line, return just start
    }
    
    const steps = Math.max(Math.abs(dx), Math.abs(dy))
    if (steps === 0) return [start]
    
    const stepX = steps > 0 ? dx / steps : 0
    const stepY = steps > 0 ? dy / steps : 0
    
    for (let i = 0; i <= steps; i++) {
      const row = Math.round(start.row + i * stepY)
      const col = Math.round(start.col + i * stepX)
      
      // Bounds check
      if (row >= 0 && row < config.gridSize && col >= 0 && col < config.gridSize) {
        cells.push({ row, col })
      }
    }
    
    return cells
  }, [config.gridSize])

  // Handle pointer down on cell
  const handlePointerDown = useCallback((e) => {
    if (gameState !== 'playing' || !gridRef.current) return

    const startCell = getCellFromEvent(e)
    if (!startCell) return

    gridRef.current.setPointerCapture(e.pointerId)
    setIsSelecting(true)
    setSelection({
      start: startCell,
      end: startCell,
      cells: [startCell]
    })
  }, [gameState, getCellFromEvent])

  // Handle pointer move for selection
  const handlePointerMove = useCallback((e) => {
    if (!isSelecting || !selection.start) return
    
    const currentCell = getCellFromEvent(e)
    if (!currentCell) return

    // Calculate cells in selection line
    const cells = getLineCells(selection.start, currentCell)
    setSelection(prev => ({
      ...prev,
      end: currentCell,
      cells
    }))
  }, [isSelecting, selection.start, getCellFromEvent, getLineCells])

  // Handle pointer up (complete selection)
  const handlePointerUp = useCallback((e) => {
    if (!isSelecting || !selection.start || !gridRef.current) return
    
    gridRef.current.releasePointerCapture(e.pointerId)
    setIsSelecting(false)
    
    // Check if selection matches any unfound word
    const selectedText = selection.cells
      .map(({ row, col }) => grid[row]?.[col] || '')
      .join('')
      .toLowerCase()
    
    const selectedTextReverse = selectedText.split('').reverse().join('')
    
    let foundWord = null
    for (const word of words) {
      if (!foundWords.has(word) && (word.toLowerCase() === selectedText || word.toLowerCase() === selectedTextReverse)) {
        foundWord = word
        break
      }
    }
    
    if (foundWord) {
      // Word found!
      const newFoundWords = new Set(foundWords)
      newFoundWords.add(foundWord)
      setFoundWords(newFoundWords)
      
      // Calculate score (word length + bonus)
      const wordScore = foundWord.length + 2
      setScore(prev => prev + wordScore)
      
      // Update session data
      const wordFindTime = Date.now() - roundStartTime.current
      setSessionData(prev => ({
        ...prev,
        totalWordsFound: prev.totalWordsFound + 1,
        wordFindTimes: [...prev.wordFindTimes, wordFindTime]
      }))
      
      // Check if round complete
      if (newFoundWords.size === words.length) {
        setTimeout(() => {
          startRound()
        }, 1000)
      }
    } else {
      // Invalid selection
      setSessionData(prev => ({
        ...prev,
        invalidSelections: prev.invalidSelections + 1
      }))
    }
    
    setSelection({ start: null, end: null, cells: [] })
  }, [isSelecting, selection, grid, words, foundWords, startRound])

  // Auto-start first round when game starts
  useEffect(() => {
    if (gameStarted && gameState === 'idle') {
      startRound()
    }
  }, [gameStarted, gameState, startRound])

  // Handle session end
  const handleSessionEnd = useCallback((summary) => {
    const finalSummary = {
      ...summary,
      gameId: GAME_IDS.WORD_SEARCH,
      score: score,
      level: level,
      accuracy: sessionData.accuracy,
      extras: {
        totalRounds: sessionData.totalRounds,
        avgFindTime: sessionData.avgFindTime,
        gridSize: config.gridSize,
        wordsCount: config.wordsCount
      }
    }

    // Save progress
    updateGameProgress(GAME_IDS.WORD_SEARCH, finalSummary)
    
    onComplete?.(score, {
      rounds: sessionData.totalRounds,
      wordsFound: sessionData.totalWordsFound,
      accuracy: sessionData.accuracy
    })
  }, [score, sessionData, level, config, onComplete])

  // Handle session start
  const handleSessionStart = useCallback(() => {
    setGameStarted(true)
    setGameState('idle')
  }, [])

  // Check if cell is selected
  const isCellSelected = useCallback((row, col) => {
    return selection.cells.some(cell => cell.row === row && cell.col === col)
  }, [selection.cells])

  // Check if cell is part of found word
  const isCellFound = useCallback((row, col) => {
    for (const [word, positions] of wordPositions.entries()) {
      if (foundWords.has(word)) {
        return positions.some(pos => pos.row === row && pos.col === col)
      }
    }
    return false
  }, [wordPositions, foundWords])

  // Render current content
  const renderContent = () => {
    if (!gameStarted) {
      return (
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Encuentra las palabras ocultas en la sopa de letras
          </p>
          <Button onClick={handleSessionStart}>
            Comenzar Juego
          </Button>
        </div>
      )
    }

    if (gameState === 'playing' && grid.length > 0) {
      return (
        <div className="space-y-6">
          {/* Words to find */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">Encuentra estas palabras:</div>
            <div className="flex flex-wrap justify-center gap-2">
              {words.map(word => (
                <Badge 
                  key={word}
                  variant={foundWords.has(word) ? "default" : "outline"}
                  className={foundWords.has(word) ? "bg-green-600" : ""}
                >
                  {foundWords.has(word) && <CheckCircle className="w-3 h-3 mr-1" />}
                  {word}
                </Badge>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="flex justify-center">
            <div 
              ref={gridRef}
              className="grid gap-0.5 border border-gray-300 p-2 rounded user-select-none"
              style={{ 
                gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`,
                width: 'min(400px, 80vw)',
                height: 'min(400px, 80vw)'
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {grid.map((row, rowIndex) =>
                row.map((letter, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      aspect-square flex items-center justify-center text-sm font-bold
                      border border-gray-200 cursor-pointer transition-colors
                      ${isCellFound(rowIndex, colIndex) 
                        ? 'bg-green-100 text-green-800' 
                        : isCellSelected(rowIndex, colIndex)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-white hover:bg-gray-50'
                      }
                    `}
                  >
                    {letter}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Arrastra para seleccionar palabras en línea recta
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
                <span>{config.gridSize}×{config.gridSize} cuadrícula</span>
                <span>•</span>
                <span>{config.wordsCount} palabra{config.wordsCount > 1 ? 's' : ''}</span>
                {config.diagonals && (
                  <>
                    <span>•</span>
                    <span>Con diagonales</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="min-h-[500px] flex items-center justify-center">
              {renderContent()}
            </div>

            {gameStarted && (
              <div className="flex justify-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold">{foundWords.size}</div>
                  <div className="text-muted-foreground">Encontradas</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{words.length}</div>
                  <div className="text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{sessionData.totalRounds}</div>
                  <div className="text-muted-foreground">Rounds</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </SessionManager>
  )
}
