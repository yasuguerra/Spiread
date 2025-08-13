'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'
import GameShell from '../GameShell'

export default function TwinWordsGrid({ difficultyLevel = 1, durationMs, onFinish, onExit }) {
  return (
    <GameShell
      gameId="twin_words"
      difficultyLevel={difficultyLevel}
      durationMs={durationMs}
      onFinish={onFinish}
      onExit={onExit}
    >
      {(gameContext) => <TwinWordsGame gameContext={gameContext} />}
    </GameShell>
  )
}

function TwinWordsGame({ gameContext }) {
  const [currentRound, setCurrentRound] = useState(0)
  const [currentPairs, setCurrentPairs] = useState([])
  const [selectedPairs, setSelectedPairs] = useState(new Set())
  const [roundStartTime, setRoundStartTime] = useState(null)
  const [totalScore, setTotalScore] = useState(0)
  const [roundScores, setRoundScores] = useState([])
  const [isShowingResults, setIsShowingResults] = useState(false)
  const [roundTimer, setRoundTimer] = useState(0)
  
  const { 
    gameState, 
    recordTrial, 
    getGameParameters, 
    handleGameEnd 
  } = gameContext

  // Word pairs dataset with micro-differences
  const wordDatabase = [
    // Spanish pairs
    { word1: 'casa', word2: 'casa', identical: true },
    { word1: 'cosa', word2: 'casa', identical: false },
    { word1: 'peso', word2: 'piso', identical: false },
    { word1: 'perro', word2: 'perno', identical: false },
    { word1: 'carro', word2: 'corro', identical: false },
    { word1: 'mano', word2: 'nano', identical: false },
    { word1: 'claro', word2: 'daro', identical: false },
    { word1: 'tiempo', word2: 'tiempo', identical: true },
    { word1: 'tiempo', word2: 'tiernpo', identical: false },
    { word1: 'persona', word2: 'persorna', identical: false },
    { word1: 'momento', word2: 'mornento', identical: false },
    { word1: 'trabajo', word2: 'trabajo', identical: true },
    { word1: 'trabajo', word2: 'trabaja', identical: false },
    { word1: 'problema', word2: 'problerna', identical: false },
    { word1: 'gobierno', word2: 'gobiemo', identical: false },
    { word1: 'desarrollo', word2: 'desarroilo', identical: false },
    
    // Accent differences
    { word1: 'médico', word2: 'medico', identical: false },
    { word1: 'rápido', word2: 'rapido', identical: false },
    { word1: 'teléfono', word2: 'telefono', identical: false },
    { word1: 'música', word2: 'musica', identical: false },
    { word1: 'público', word2: 'publico', identical: false },
    
    // Case differences
    { word1: 'CASA', word2: 'casa', identical: false },
    { word1: 'Mundo', word2: 'mundo', identical: false },
    { word1: 'TIEMPO', word2: 'tiempo', identical: false },
    
    // More subtle differences
    { word1: 'leer', word2: 'leer', identical: true },
    { word1: 'leer', word2: 'beer', identical: false },
    { word1: 'escribir', word2: 'escribir', identical: true },
    { word1: 'escribir', word2: 'escnbir', identical: false },
    { word1: 'estudiar', word2: 'estudiar', identical: true },
    { word1: 'estudiar', word2: 'estuciar', identical: false }
  ]

  // Generate new round when game starts
  useEffect(() => {
    if (gameState === 'playing' && currentPairs.length === 0) {
      generateNewRound()
    }
  }, [gameState])

  // Round timer
  useEffect(() => {
    if (gameState === 'playing' && roundStartTime && !isShowingResults) {
      const params = getGameParameters()
      const interval = setInterval(() => {
        const elapsed = Date.now() - roundStartTime
        const remaining = Math.max(0, params.exposureTime - elapsed)
        setRoundTimer(remaining)
        
        if (remaining === 0) {
          finishRound()
        }
      }, 100)
      
      return () => clearInterval(interval)
    }
  }, [gameState, roundStartTime, isShowingResults])

  const generateNewRound = () => {
    const params = getGameParameters()
    const { pairsCount, difficultyRatio, subtletyLevel } = params
    
    // Filter words by subtlety level
    let availablePairs = wordDatabase.filter(pair => {
      if (pair.identical) return true
      
      // More subtle differences at higher levels
      const wordLength = Math.max(pair.word1.length, pair.word2.length)
      const isSubtle = pair.word1.toLowerCase() !== pair.word2.toLowerCase() &&
                      (pair.word1.includes('m') || pair.word1.includes('n') || 
                       pair.word1.includes('rn') || pair.word1.includes('cl') ||
                       pair.word1.includes('í') || pair.word1.includes('é'))
      
      if (subtletyLevel >= 4) return isSubtle
      if (subtletyLevel >= 3) return wordLength >= 6
      if (subtletyLevel >= 2) return wordLength >= 4
      return true
    })

    // Shuffle and select pairs
    availablePairs = [...availablePairs].sort(() => Math.random() - 0.5)
    
    // Calculate how many should be different
    const differentCount = Math.round(pairsCount * difficultyRatio)
    const identicalCount = pairsCount - differentCount
    
    const selectedPairs = []
    const identicalPairs = availablePairs.filter(p => p.identical).slice(0, identicalCount)
    const differentPairs = availablePairs.filter(p => !p.identical).slice(0, differentCount)
    
    selectedPairs.push(...identicalPairs, ...differentPairs)
    
    // Shuffle final pairs
    const shuffledPairs = selectedPairs.sort(() => Math.random() - 0.5)
    
    setCurrentPairs(shuffledPairs)
    setSelectedPairs(new Set())
    setRoundStartTime(Date.now())
    setIsShowingResults(false)
    setRoundTimer(params.exposureTime)
  }

  const handlePairClick = (pairIndex) => {
    if (isShowingResults) return
    
    const newSelected = new Set(selectedPairs)
    if (newSelected.has(pairIndex)) {
      newSelected.delete(pairIndex)
    } else {
      newSelected.add(pairIndex)
    }
    setSelectedPairs(newSelected)
  }

  const finishRound = () => {
    setIsShowingResults(true)
    
    const roundEndTime = Date.now()
    const reactionTime = roundEndTime - roundStartTime
    
    // Calculate score
    let score = 0
    let hits = 0
    let falsePositives = 0
    let misses = 0
    
    currentPairs.forEach((pair, index) => {
      const isSelected = selectedPairs.has(index)
      const shouldBeSelected = !pair.identical
      
      if (isSelected && shouldBeSelected) {
        hits++
        score += 1
      } else if (isSelected && !shouldBeSelected) {
        falsePositives++
        score -= 1
      } else if (!isSelected && shouldBeSelected) {
        misses++
      }
      // Correct rejections (not selected and identical) don't change score
    })
    
    const accuracy = currentPairs.length > 0 
      ? (hits + (currentPairs.length - selectedPairs.size - misses)) / currentPairs.length 
      : 0
    
    const roundResult = {
      round: currentRound + 1,
      score,
      hits,
      falsePositives,
      misses,
      accuracy,
      reactionTime,
      pairs: currentPairs.length
    }
    
    setRoundScores(prev => [...prev, roundResult])
    setTotalScore(prev => prev + Math.max(0, score))
    
    // Record trial for adaptive difficulty
    const success = accuracy >= 0.8 && reactionTime <= getGameParameters().exposureTime * 1.2
    recordTrial(success, reactionTime, roundResult)
    
    // Auto-advance to next round after showing results
    setTimeout(() => {
      setCurrentRound(prev => prev + 1)
      generateNewRound()
    }, 2000)
  }

  // Handle game end
  useEffect(() => {
    if (gameState === 'summary') {
      const avgAccuracy = roundScores.length > 0
        ? roundScores.reduce((sum, r) => sum + r.accuracy, 0) / roundScores.length
        : 0
      
      const avgReactionTime = roundScores.length > 0
        ? roundScores.reduce((sum, r) => sum + r.reactionTime, 0) / roundScores.length
        : 0

      const finalResults = {
        score: Math.min(100, Math.max(0, Math.round(avgAccuracy * 100))),
        metrics: {
          rounds: roundScores.length,
          total_score: totalScore,
          accuracy_overall: avgAccuracy,
          mean_rt_ms: avgReactionTime,
          rounds_data: roundScores
        }
      }

      handleGameEnd(finalResults)
    }
  }, [gameState])

  const params = getGameParameters()
  const timeLeft = Math.max(0, Math.ceil(roundTimer / 1000))

  return (
    <div className="space-y-6">
      {/* Round Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{currentRound + 1}</div>
              <div className="text-xs text-muted-foreground">Ronda</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalScore}</div>
              <div className="text-xs text-muted-foreground">Puntos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{selectedPairs.size}</div>
              <div className="text-xs text-muted-foreground">Seleccionados</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{timeLeft}s</div>
              <div className="text-xs text-muted-foreground">Tiempo</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{Math.round(params.difficultyRatio * 100)}%</div>
              <div className="text-xs text-muted-foreground">Diferentes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Selecciona los pares que son DIFERENTES
            </h3>
            <p className="text-sm text-muted-foreground">
              Haz clic en las tarjetas que contengan palabras diferentes. 
              ¡Presta atención a acentos, mayúsculas y letras similares!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pairs Grid */}
      <Card>
        <CardContent className="p-6">
          <div 
            className="grid gap-4 max-w-4xl mx-auto"
            style={{ 
              gridTemplateColumns: `repeat(${Math.min(4, Math.ceil(Math.sqrt(currentPairs.length)))}, 1fr)` 
            }}
          >
            <AnimatePresence>
              {currentPairs.map((pair, index) => (
                <motion.div
                  key={`${pair.word1}-${pair.word2}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePairClick(index)}
                  className={`
                    relative p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${selectedPairs.has(index) 
                      ? 'border-blue-500 bg-blue-50 shadow-lg' 
                      : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
                    }
                    ${isShowingResults && !pair.identical 
                      ? 'ring-2 ring-green-400' 
                      : ''
                    }
                    ${isShowingResults && pair.identical && selectedPairs.has(index)
                      ? 'ring-2 ring-red-400'
                      : ''
                    }
                  `}
                >
                  <div className="space-y-3 text-center">
                    <div className="text-lg font-mono font-semibold">
                      {pair.word1}
                    </div>
                    <div className="border-t border-gray-200" />
                    <div className="text-lg font-mono font-semibold">
                      {pair.word2}
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  {selectedPairs.has(index) && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  
                  {/* Results indicators */}
                  {isShowingResults && (
                    <div className="absolute top-2 left-2">
                      {!pair.identical ? (
                        <Badge variant="destructive" className="text-xs">
                          Diferente
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Igual
                        </Badge>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {isShowingResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-center"
            >
              <div className="inline-flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm">
                  <span className="font-semibold text-green-600">Aciertos: {roundScores[roundScores.length - 1]?.hits || 0}</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-red-600">Falsos +: {roundScores[roundScores.length - 1]?.falsePositives || 0}</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-orange-600">Perdidos: {roundScores[roundScores.length - 1]?.misses || 0}</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-blue-600">
                    Precisión: {Math.round((roundScores[roundScores.length - 1]?.accuracy || 0) * 100)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Manual finish button (if time runs out) */}
      {gameState === 'playing' && !isShowingResults && (
        <div className="text-center">
          <Button onClick={finishRound} variant="outline">
            Finalizar Ronda
          </Button>
        </div>
      )}

      {/* Game info */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <div>
              <strong>Objetivo:</strong> Encuentra todas las palabras diferentes en cada ronda
            </div>
            <div className="flex justify-center gap-6 text-xs">
              <span>🎯 Pares: {params.pairsCount}</span>
              <span>⏱️ Tiempo: {Math.round(params.exposureTime / 1000)}s</span>
              <span>🎚️ Nivel: {params.subtletyLevel}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}