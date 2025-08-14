'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WORD_BANK } from '@/lib/word-bank'

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
    10: { gridSize: 12, wordsCount: 7, diagonals: true, reverse: true, goalTimePerWord: 4000 },
    11: { gridSize: 12, wordsCount: 8, diagonals: true, reverse: true, goalTimePerWord: 4000 },
    12: { gridSize: 13, wordsCount: 8, diagonals: true, reverse: true, goalTimePerWord: 3500 },
    13: { gridSize: 13, wordsCount: 9, diagonals: true, reverse: true, goalTimePerWord: 3500 },
    14: { gridSize: 13, wordsCount: 9, diagonals: true, reverse: true, goalTimePerWord: 3000 },
    15: { gridSize: 14, wordsCount: 10, diagonals: true, reverse: true, goalTimePerWord: 3000 },
    16: { gridSize: 14, wordsCount: 10, diagonals: true, reverse: true, goalTimePerWord: 2800 },
    17: { gridSize: 14, wordsCount: 10, diagonals: true, reverse: true, goalTimePerWord: 2600 },
    18: { gridSize: 14, wordsCount: 10, diagonals: true, reverse: true, goalTimePerWord: 2400 },
    19: { gridSize: 14, wordsCount: 10, diagonals: true, reverse: true, goalTimePerWord: 2200 },
    20: { gridSize: 14, wordsCount: 10, diagonals: true, reverse: true, goalTimePerWord: 2000 }
  }
}

const DIRECTIONS = {
  horizontal: [0, 1],
  vertical: [1, 0],
  diagonalDown: [1, 1],
  diagonalUp: [-1, 1]
}

export default function WordSearch({ 
  level = 1, 
  onComplete,
  onScoreUpdate,
  timeRemaining,
  locale = 'es'
}) {
  const [gameState, setGameState] = useState('idle') // idle, playing, complete
  const [grid, setGrid] = useState([])
  const [words, setWords] = useState([])
  const [foundWords, setFoundWords] = useState(new Set())
  const [wordPositions, setWordPositions] = useState(new Map())
  const [selection, setSelection] = useState({ start: null, end: null, cells: [] })
  const [isSelecting, setIsSelecting] = useState(false)
  const [score, setScore] = useState(0)
  const [sessionData, setSessionData] = useState({
    totalRounds: 0,
    totalWordsShown: 0,
    totalWordsFound: 0,
    invalidSelections: 0,
    wordFindTimes: [],
    accuracy: 0
  })

  const config = GAME_CONFIG.levels[Math.min(level, 20)]
  const wordsData = WORD_BANK.wordSearch[locale] || WORD_BANK.wordSearch.es
  const roundStartTime = useRef(null)

  // Get words for current round
  const getWordsForRound = useCallback(() => {
    const allWords = []
    // Collect words from different lengths (4-8 chars for variety)
    for (let length = 4; length <= 8; length++) {
      if (wordsData[length]) {
        allWords.push(...wordsData[length])
      }
    }
    
    // Shuffle and pick required number
    const shuffled = allWords.sort(() => Math.random() - 0.5)
    return shuffled.slice(0, config.wordsCount)
  }, [config.wordsCount, wordsData])

  // Place word in grid
  const placeWord = useCallback((grid, word, gridSize, diagonals, reverse) => {
    const directions = [
      DIRECTIONS.horizontal,
      DIRECTIONS.vertical
    ]
    
    if (diagonals) {
      directions.push(DIRECTIONS.diagonalDown, DIRECTIONS.diagonalUp)
    }

    // Try random placements
    for (let attempts = 0; attempts < 100; attempts++) {
      const direction = directions[Math.floor(Math.random() * directions.length)]
      const [dr, dc] = direction
      
      // Randomly decide if word should be reversed
      const actualWord = (reverse && Math.random() < 0.3) ? word.split('').reverse().join('') : word
      
      // Find valid starting position
      const maxRow = dr >= 0 ? gridSize - actualWord.length : actualWord.length - 1
      const maxCol = dc >= 0 ? gridSize - actualWord.length : actualWord.length - 1
      const minRow = dr < 0 ? actualWord.length - 1 : 0
      const minCol = dc < 0 ? actualWord.length - 1 : 0
      
      if (maxRow < minRow || maxCol < minCol) continue
      
      const startRow = minRow + Math.floor(Math.random() * (maxRow - minRow + 1))
      const startCol = minCol + Math.floor(Math.random() * (maxCol - minCol + 1))
      
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
    const { gridSize } = config
    const roundWords = getWordsForRound()
    const newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''))
    const newWordPositions = new Map()
    const placedWords = []

    // Place words
    roundWords.forEach(word => {
      const placement = placeWord(newGrid, word, gridSize, config.diagonals, config.reverse)
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
          newGrid[row][col] = alphabet[Math.floor(Math.random() * alphabet.length)]
        }
      }
    }

    return { grid: newGrid, words: placedWords, wordPositions: newWordPositions }
  }, [config, getWordsForRound, placeWord])

  // Start new round
  const startRound = useCallback(() => {
    if (timeRemaining <= 0) return

    const { grid: newGrid, words: newWords, wordPositions: newWordPositions } = generateRound()
    setGrid(newGrid)
    setWords(newWords)
    setWordPositions(newWordPositions)
    setFoundWords(new Set())
    setSelection({ start: null, end: null, cells: [] })
    setGameState('playing')
    roundStartTime.current = Date.now()
  }, [generateRound, timeRemaining])

  // Handle mouse down on cell
  const handleMouseDown = useCallback((row, col) => {
    if (gameState !== 'playing') return
    
    setIsSelecting(true)
    setSelection({
      start: { row, col },
      end: { row, col },
      cells: [{ row, col }]
    })
  }, [gameState])

  // Handle mouse enter on cell (for selection)
  const handleMouseEnter = useCallback((row, col) => {
    if (!isSelecting || !selection.start) return
    
    // Calculate cells in selection line
    const cells = getLineCells(selection.start, { row, col })
    setSelection(prev => ({
      ...prev,
      end: { row, col },
      cells
    }))
  }, [isSelecting, selection.start])

  // Get cells in a straight line between two points
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
    
    const stepX = dx / steps
    const stepY = dy / steps
    
    for (let i = 0; i <= steps; i++) {
      const row = Math.round(start.row + i * stepY)
      const col = Math.round(start.col + i * stepX)
      cells.push({ row, col })
    }
    
    return cells
  }, [])

  // Handle mouse up (complete selection)
  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !selection.start) return
    
    setIsSelecting(false)
    
    // Check if selection matches any unfound word
    const selectedText = selection.cells
      .map(({ row, col }) => grid[row]?.[col] || '')
      .join('')
      .toLowerCase()
    
    const selectedTextReverse = selectedText.split('').reverse().join('')
    
    let foundWord = null
    for (const word of words) {
      if (!foundWords.has(word) && (word === selectedText || word === selectedTextReverse)) {
        foundWord = word
        break
      }
    }
    
    if (foundWord) {
      // Word found!
      const newFoundWords = new Set(foundWords)
      newFoundWords.add(foundWord)
      setFoundWords(newFoundWords)
      
      // Calculate score
      const wordScore = foundWord.length
      setScore(prev => prev + wordScore)
      onScoreUpdate?.(score + wordScore)
      
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
          if (timeRemaining > 2) {
            // Update session for completed round
            setSessionData(prev => ({
              ...prev,
              totalRounds: prev.totalRounds + 1,
              totalWordsShown: prev.totalWordsShown + words.length,
              accuracy: (prev.totalWordsFound + 1) / (prev.totalWordsShown + words.length)
            }))
            startRound()
          } else {
            setGameState('complete')
          }
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
  }, [isSelecting, selection, grid, words, foundWords, score, onScoreUpdate, timeRemaining, startRound])

  // Auto-start first round
  useEffect(() => {
    if (timeRemaining > 0 && gameState === 'idle') {
      startRound()
    }
  }, [timeRemaining, gameState, startRound])

  // Handle game completion
  useEffect(() => {
    if (timeRemaining <= 0 && gameState !== 'complete') {
      setGameState('complete')
      
      const meanTimePerWord = sessionData.wordFindTimes.length > 0 
        ? sessionData.wordFindTimes.reduce((a, b) => a + b, 0) / sessionData.wordFindTimes.length 
        : 0

      const metrics = {
        gridSize: `${config.gridSize}x${config.gridSize}`,
        wordsShown: sessionData.totalWordsShown + words.length,
        wordsFound: sessionData.totalWordsFound,
        invalidSelections: sessionData.invalidSelections,
        time_per_word_ms: meanTimePerWord,
        totalRounds: sessionData.totalRounds + (words.length > 0 ? 1 : 0),
        accuracy: sessionData.accuracy
      }

      onComplete?.(score, metrics)
    }
  }, [timeRemaining, gameState, score, sessionData, config, words.length, onComplete])

  const renderContent = () => {
    if (gameState === 'playing') {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="flex justify-center gap-2 flex-wrap mb-2">
              {words.map((word, index) => (
                <Badge 
                  key={word} 
                  variant={foundWords.has(word) ? "default" : "outline"}
                  className={foundWords.has(word) ? "bg-green-500" : ""}
                >
                  {word.toUpperCase()}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Encontradas: {foundWords.size}/{words.length}
            </p>
          </div>
          
          <div className="flex justify-center">
            <div 
              className="grid gap-0 p-2 bg-gray-50 rounded-lg border-2 select-none"
              style={{ 
                gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`,
                maxWidth: '400px'
              }}
              onMouseLeave={() => setIsSelecting(false)}
            >
              {grid.map((row, rowIndex) =>
                row.map((letter, colIndex) => {
                  const isSelected = selection.cells.some(
                    cell => cell.row === rowIndex && cell.col === colIndex
                  )
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`
                        w-6 h-6 border border-gray-200 flex items-center justify-center
                        text-xs font-mono cursor-pointer transition-colors
                        ${isSelected 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white hover:bg-gray-100'
                        }
                      `}
                      onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                      onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                      onMouseUp={handleMouseUp}
                    >
                      {letter}
                    </div>
                  )
                })
              )}
            </div>
          </div>
          
          <div className="text-center text-xs text-muted-foreground">
            Arrastra para seleccionar palabras • Puntuación: {score}
          </div>
        </div>
      )
    }

    if (gameState === 'complete') {
      return (
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold">¡Tiempo completado!</h3>
          <div className="space-y-2">
            <p className="text-lg">Puntuación final: <span className="font-bold text-blue-600">{score}</span></p>
            <p className="text-sm text-muted-foreground">
              Palabras encontradas: {sessionData.totalWordsFound} • 
              Rondas: {sessionData.totalRounds} •
              Precisión: {(sessionData.accuracy * 100).toFixed(1)}%
            </p>
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{GAME_CONFIG.displayName}</h2>
            <p className="text-sm text-muted-foreground mb-4">{GAME_CONFIG.description}</p>
            <p className="text-xs text-muted-foreground">
              Nivel {level} • Grid {config.gridSize}×{config.gridSize} • {config.wordsCount} palabras
              {config.diagonals && " • Diagonales"}{config.reverse && " • Reverso"}
            </p>
          </div>
          
          <div className="min-h-[400px] flex items-center justify-center">
            {renderContent()}
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Puntuación: {score} • Encontradas: {sessionData.totalWordsFound}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}