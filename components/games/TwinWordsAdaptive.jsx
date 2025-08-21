'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SessionManager from './common/SessionManager'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Target, Timer } from 'lucide-react'
import { updateGameProgress, GAME_IDS, getGameProgress } from '@/lib/progress-tracking'
import { adaptTwinWordsComplexity } from '@/lib/adaptive'
import { compareTexts } from '@/lib/text-normalize'

const GAME_CONFIG = {
  name: 'twin_words_adaptive',
  displayName: 'Twin Words (Adaptativo)',
  description: 'Encuentra las diferencias entre pares de palabras con dificultad adaptativa',
  baseConfig: {
    pairsPerRound: 8,
    roundTimeMs: 5000,
    defaultTimePressure: 1.0
  }
}

export default function TwinWordsAdaptive({ 
  level = 1,
  durationSec = 120,
  onComplete,
  onExit 
}) {
  const [gameStarted, setGameStarted] = useState(false)
  const [currentRound, setCurrentRound] = useState(0)
  const [currentPairs, setCurrentPairs] = useState([])
  const [selectedPairs, setSelectedPairs] = useState(new Set())
  const [roundStartTime, setRoundStartTime] = useState(null)
  const [score, setScore] = useState(0)
  const [sessionData, setSessionData] = useState({
    totalRounds: 0,
    correctIdentifications: 0,
    totalIdentifications: 0,
    reactionTimes: [],
    accuracy: 0,
    avgRT: 0,
    adaptiveParams: {
      useConfusableFonts: false,
      useAccents: false,
      timePressure: 1.0
    }
  })
  const [adaptiveParams, setAdaptiveParams] = useState({
    useConfusableFonts: false,
    useAccents: false,
    timePressure: 1.0
  })

  // Get adaptive parameters based on recent performance
  useEffect(() => {
    const gameProgress = getGameProgress(GAME_IDS.TWIN_WORDS)
    const recentSessions = gameProgress.recentSessions
    const adapted = adaptTwinWordsComplexity(recentSessions)
    
    setAdaptiveParams(adapted)
    setSessionData(prev => ({
      ...prev,
      adaptiveParams: adapted
    }))
  }, [])

  // Word pairs dataset with varying difficulty
  const getWordDatabase = useCallback(() => {
    const basic = [
      // Basic pairs without accents
      { word1: 'casa', word2: 'casa', identical: true, difficulty: 1 },
      { word1: 'cosa', word2: 'casa', identical: false, difficulty: 1 },
      { word1: 'peso', word2: 'piso', identical: false, difficulty: 1 },
      { word1: 'perro', word2: 'perno', identical: false, difficulty: 1 },
      { word1: 'carro', word2: 'corro', identical: false, difficulty: 1 },
      { word1: 'mano', word2: 'nano', identical: false, difficulty: 1 },
      { word1: 'gato', word2: 'gato', identical: true, difficulty: 1 },
      { word1: 'dato', word2: 'gato', identical: false, difficulty: 1 },
      { word1: 'mesa', word2: 'meta', identical: false, difficulty: 1 },
      { word1: 'luna', word2: 'lupa', identical: false, difficulty: 1 }
    ]

    const withAccents = [
      // Pairs with accents
      { word1: 'más', word2: 'mas', identical: false, difficulty: 2 },
      { word1: 'papá', word2: 'papa', identical: false, difficulty: 2 },
      { word1: 'sólo', word2: 'solo', identical: false, difficulty: 2 },
      { word1: 'café', word2: 'cafe', identical: false, difficulty: 2 },
      { word1: 'inglés', word2: 'ingles', identical: false, difficulty: 2 },
      { word1: 'corazón', word2: 'corazon', identical: false, difficulty: 2 },
      { word1: 'canción', word2: 'cancion', identical: false, difficulty: 2 },
      { word1: 'niño', word2: 'nino', identical: false, difficulty: 2 }
    ]

    const confusable = [
      // Confusable fonts (b/d, p/q, etc.)
      { word1: 'boda', word2: 'doda', identical: false, difficulty: 3, confusable: true },
      { word1: 'pato', word2: 'qato', identical: false, difficulty: 3, confusable: true },
      { word1: 'rubo', word2: 'rudo', identical: false, difficulty: 3, confusable: true },
      { word1: 'plata', word2: 'qlata', identical: false, difficulty: 3, confusable: true },
      { word1: 'banco', word2: 'danco', identical: false, difficulty: 3, confusable: true }
    ]

    let database = [...basic]
    
    if (adaptiveParams.useAccents) {
      database = [...database, ...withAccents]
    }
    
    if (adaptiveParams.useConfusableFonts) {
      database = [...database, ...confusable]
    }

    return database
  }, [adaptiveParams])

  // Generate a round of word pairs
  const generateRound = useCallback(() => {
    const database = getWordDatabase()
    const pairs = []
    
    // Ensure mix of identical and different pairs
    const identicalCount = Math.floor(GAME_CONFIG.baseConfig.pairsPerRound * 0.4) // 40% identical
    const differentCount = GAME_CONFIG.baseConfig.pairsPerRound - identicalCount

    // Get identical pairs
    const identicalPairs = database.filter(p => p.identical)
    for (let i = 0; i < identicalCount && i < identicalPairs.length; i++) {
      pairs.push({
        ...identicalPairs[i % identicalPairs.length],
        id: `pair-${i}`
      })
    }

    // Get different pairs
    const differentPairs = database.filter(p => !p.identical)
    for (let i = 0; i < differentCount && i < differentPairs.length; i++) {
      pairs.push({
        ...differentPairs[i % differentPairs.length],
        id: `pair-${identicalCount + i}`
      })
    }

    // Shuffle pairs
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
    }

    return pairs
  }, [getWordDatabase])

  // Start a new round
  const startRound = useCallback(() => {
    if (!gameStarted) return

    setCurrentRound(prev => prev + 1)
    const pairs = generateRound()
    setCurrentPairs(pairs)
    setSelectedPairs(new Set())
    
    const adjustedTime = GAME_CONFIG.baseConfig.roundTimeMs * adaptiveParams.timePressure
    setRoundStartTime(Date.now())
    
    // Auto-submit after time limit
    setTimeout(() => {
      submitRound()
    }, adjustedTime)
  }, [gameStarted, generateRound, adaptiveParams.timePressure])

  // Handle pair selection
  const handlePairClick = useCallback((pairId) => {
    setSelectedPairs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(pairId)) {
        newSet.delete(pairId)
      } else {
        newSet.add(pairId)
      }
      return newSet
    })
  }, [])

  // Submit current round
  const submitRound = useCallback(() => {
    if (!roundStartTime) return

    const reactionTime = Date.now() - roundStartTime
    
    // Calculate accuracy
    let correct = 0
    let total = currentPairs.length

    currentPairs.forEach(pair => {
      const isSelected = selectedPairs.has(pair.id)
      const shouldBeSelected = !pair.identical // Select different pairs
      
      if (isSelected === shouldBeSelected) {
        correct++
      }
    })

    const accuracy = total > 0 ? correct / total : 0
    const roundScore = Math.max(0, correct * 2 - (total - correct)) // +2 per correct, -1 per incorrect

    // Update session data
    setSessionData(prev => ({
      ...prev,
      totalRounds: prev.totalRounds + 1,
      correctIdentifications: prev.correctIdentifications + correct,
      totalIdentifications: prev.totalIdentifications + total,
      reactionTimes: [...prev.reactionTimes, reactionTime],
      accuracy: (prev.correctIdentifications + correct) / (prev.totalIdentifications + total),
      avgRT: [...prev.reactionTimes, reactionTime].reduce((sum, rt) => sum + rt, 0) / (prev.reactionTimes.length + 1)
    }))

    setScore(prev => prev + roundScore)
    
    // Start next round after brief pause
    setTimeout(() => {
      startRound()
    }, 1000)
  }, [currentPairs, selectedPairs, roundStartTime, startRound])

  // Auto-start first round when game starts
  useEffect(() => {
    if (gameStarted && currentRound === 0) {
      startRound()
    }
  }, [gameStarted, currentRound, startRound])

  // Handle session end
  const handleSessionEnd = useCallback((summary) => {
    const finalSummary = {
      ...summary,
      gameId: GAME_IDS.TWIN_WORDS,
      score: score,
      level: level,
      accuracy: sessionData.accuracy,
      extras: {
        totalRounds: sessionData.totalRounds,
        avgRT: sessionData.avgRT,
        adaptiveParams: sessionData.adaptiveParams,
        useConfusableFonts: adaptiveParams.useConfusableFonts,
        useAccents: adaptiveParams.useAccents,
        timePressure: adaptiveParams.timePressure
      }
    }

    // Save progress
    updateGameProgress(GAME_IDS.TWIN_WORDS, finalSummary)
    
    onComplete?.(score, {
      rounds: sessionData.totalRounds,
      accuracy: sessionData.accuracy,
      avgRT: sessionData.avgRT
    })
  }, [score, sessionData, level, adaptiveParams, onComplete])

  // Handle session start
  const handleSessionStart = useCallback(() => {
    setGameStarted(true)
  }, [])

  // Render current content
  const renderContent = () => {
    if (!gameStarted) {
      return (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground mb-4">
            Encuentra las diferencias entre pares de palabras
          </p>
          
          {/* Show adaptive parameters */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Badge variant="outline">
              Nivel adaptativo {level}
            </Badge>
            {adaptiveParams.useAccents && (
              <Badge variant="secondary">Con acentos</Badge>
            )}
            {adaptiveParams.useConfusableFonts && (
              <Badge variant="secondary">Fuentes confusas</Badge>
            )}
            <Badge variant="outline">
              {(adaptiveParams.timePressure * 100).toFixed(0)}% presión temporal
            </Badge>
          </div>

          <Button onClick={handleSessionStart}>
            Comenzar Juego
          </Button>
        </div>
      )
    }

    if (currentPairs.length > 0) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">
              Selecciona los pares que son DIFERENTES
            </div>
            <div className="text-sm text-muted-foreground">
              Round {currentRound} • Haz clic en los pares que no son idénticos
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {currentPairs.map((pair) => (
              <motion.div
                key={pair.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedPairs.has(pair.id) 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md hover:bg-gray-50'
                  }`}
                  onClick={() => handlePairClick(pair.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className={`text-xl font-bold ${
                        adaptiveParams.useConfusableFonts && pair.confusable 
                          ? 'font-mono' 
                          : ''
                      }`}>
                        {pair.word1}
                      </div>
                      
                      <div className="text-gray-400">
                        {pair.identical ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                      </div>
                      
                      <div className={`text-xl font-bold ${
                        adaptiveParams.useConfusableFonts && pair.confusable 
                          ? 'font-mono' 
                          : ''
                      }`}>
                        {pair.word2}
                      </div>
                    </div>
                    
                    {selectedPairs.has(pair.id) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 text-center"
                      >
                        <Badge variant="default">Diferente</Badge>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Button onClick={submitRound} className="mx-auto">
              Confirmar Selección
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="text-center">
        <p className="text-muted-foreground">Preparando round...</p>
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
      className="w-full max-w-6xl mx-auto"
    >
      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">{GAME_CONFIG.description}</p>
              <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                <span>Nivel {level}</span>
                <span>•</span>
                <span>{GAME_CONFIG.baseConfig.pairsPerRound} pares por round</span>
                <span>•</span>
                <span>Dificultad adaptativa</span>
              </div>
            </div>
            
            <div className="min-h-[400px] flex items-center justify-center">
              {renderContent()}
            </div>

            {gameStarted && (
              <div className="flex justify-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold">{sessionData.totalRounds}</div>
                  <div className="text-muted-foreground">Rounds</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{(sessionData.accuracy * 100).toFixed(1)}%</div>
                  <div className="text-muted-foreground">Precisión</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{sessionData.avgRT.toFixed(0)}ms</div>
                  <div className="text-muted-foreground">TR Promedio</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </SessionManager>
  )
}
