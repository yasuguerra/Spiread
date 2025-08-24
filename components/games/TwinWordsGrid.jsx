'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Timer, Target } from 'lucide-react'
import GameTopBar from '@/components/ui/GameTopBar'
import { selectPairs, getDifficultyLevel, getFontStyling, GamePair } from '@/lib/twinwords/selectPairs'
import { t } from '@/locales/es'

export default function TwinWordsGrid({ 
  difficultyLevel = 1, 
  durationMs = 60000, 
  onFinish, 
  onExit 
}) {
  const [gameState, setGameState] = useState('ready')
  const [currentRound, setCurrentRound] = useState(0)
  const [currentPairs, setCurrentPairs] = useState([])
  const [selectedPairs, setSelectedPairs] = useState(new Set())
  const [foundTargets, setFoundTargets] = useState(new Set()) // Track found incorrect pairs
  const [roundStartTime, setRoundStartTime] = useState(null)
  const [totalScore, setTotalScore] = useState(0)
  const [roundScores, setRoundScores] = useState([])
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0)
  const [subtletyLevel, setSubtletyLevel] = useState(1)
  const [level, setLevel] = useState(difficultyLevel) // Added level for GameTopBar
  const [timeRemaining, setTimeRemaining] = useState(durationMs)
  const [reactionTimes, setReactionTimes] = useState([])
  
  const gameTimer = useRef(null)
  const roundTimer = useRef(null)

  // Update difficulty based on consecutive correct answers
  useEffect(() => {
    const newLevel = getDifficultyLevel(consecutiveCorrect)
    if (newLevel !== subtletyLevel) {
      setSubtletyLevel(newLevel)
    }
  }, [consecutiveCorrect, subtletyLevel])

  // Game timer
  useEffect(() => {
    if (gameState === 'playing') {
      gameTimer.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1000) {
            endGame()
            return 0
          }
          return prev - 1000
        })
      }, 1000)
    }

    return () => {
      if (gameTimer.current) {
        clearInterval(gameTimer.current)
      }
    }
  }, [gameState])

  // Generate new round
  const generateRound = () => {
    const pairs = selectPairs({
      level: subtletyLevel,
      count: 8, // 4 pairs, 8 cards total
      ratioIdentical: 0.5 // 50% identical pairs
    })
    
    setCurrentPairs(pairs)
    setSelectedPairs(new Set())
    setFoundTargets(new Set()) // Reset found targets for new round
    setRoundStartTime(Date.now())
  }

  // Start game
  const startGame = () => {
    setGameState('playing')
    setCurrentRound(1)
    setTotalScore(0)
    setRoundScores([])
    setConsecutiveCorrect(0)
    setSubtletyLevel(1)
    setTimeRemaining(durationMs)
    generateRound()
  }

  // Handle pair selection
  const handlePairClick = (index) => {
    if (gameState !== 'playing' || selectedPairs.has(index)) return
    
    const clickedPair = currentPairs[index]
    
    // Only select pairs that are NOT identical (targets)
    if (!clickedPair.identical) {
      const newSelected = new Set(selectedPairs)
      const newFoundTargets = new Set(foundTargets)
      
      newSelected.add(index)
      newFoundTargets.add(index)
      
      setSelectedPairs(newSelected)
      setFoundTargets(newFoundTargets)
      
      const reactionTime = Date.now() - roundStartTime
      setReactionTimes(prev => [...prev, reactionTime])
      
      // Correct selection - add points
      setTotalScore(prev => prev + 10)
      setConsecutiveCorrect(prev => prev + 1)
      setRoundScores(prev => [...prev, { 
        round: currentRound, 
        score: 10, 
        correct: true, 
        time: reactionTime,
        pairIndex: index
      }])
      
      // Check if all targets (incorrect pairs) have been found
      const targets = currentPairs.filter(p => !p.identical)
      const targetsTotal = targets.length
      const targetsFound = newFoundTargets.size
      
      if (targetsFound === targetsTotal) {
        // Round complete! All incorrect pairs found
        setTimeout(() => {
          if (currentRound < 20) { // Max 20 rounds
            setCurrentRound(prev => prev + 1)
            setLevel(prev => prev + 1) // Increase level for GameTopBar
            generateRound()
          } else {
            endGame()
          }
        }, 1500)
      }
    } else {
      // Wrong selection - clicked an identical pair
      const reactionTime = Date.now() - roundStartTime
      setReactionTimes(prev => [...prev, reactionTime])
      
      setConsecutiveCorrect(0)
      setTotalScore(prev => Math.max(0, prev - 5)) // Penalty for wrong selection
      setRoundScores(prev => [...prev, { 
        round: currentRound, 
        score: -5, 
        correct: false, 
        time: reactionTime,
        pairIndex: index
      }])
    }
  }

  // End game
  const endGame = () => {
    setGameState('finished')
    if (gameTimer.current) {
      clearInterval(gameTimer.current)
    }
    
    const avgReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length 
      : 0
    
    const accuracy = roundScores.length > 0 
      ? roundScores.filter(r => r.correct).length / roundScores.length 
      : 0
    
    onFinish?.({
      score: totalScore,
      rounds: currentRound,
      accuracy,
      avgReactionTime,
      finalDifficulty: subtletyLevel,
      consecutiveCorrect
    })
  }

  // Get styling based on current difficulty
  const fontStyling = getFontStyling(subtletyLevel)

  // Format time
  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000)
    return `${seconds}s`
  }

  if (gameState === 'ready') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">{t('twinwords.title')}</h1>
              <p className="text-gray-600">
                {t('twinwords.instruction')} ¡Busca las diferencias sutiles entre las palabras!
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• {t('twinwords.examples.accents')}</p>
                <p>• {t('twinwords.examples.similar')}</p>
                <p>• {t('twinwords.examples.minimal')}</p>
              </div>
              <Button onClick={startGame} className="w-full">
                {t('twinwords.startGame')} ({formatTime(durationMs)})
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gameState === 'finished') {
    const accuracy = roundScores.length > 0 
      ? roundScores.filter(r => r.correct).length / roundScores.length * 100 
      : 0
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">¡Juego Completado!</h1>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{totalScore}</div>
                  <div className="text-sm text-blue-800">Puntuación</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{accuracy.toFixed(1)}%</div>
                  <div className="text-sm text-green-800">Precisión</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Rondas:</span>
                  <span className="font-semibold">{currentRound}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dificultad Final:</span>
                  <Badge variant="outline">Nivel {subtletyLevel}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Mejor Racha:</span>
                  <span className="font-semibold">{Math.max(...[0, ...roundScores.map((_, i) => {
                    let streak = 0
                    for (let j = i; j >= 0 && roundScores[j].correct; j--) streak++
                    return streak
                  })])}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={startGame} className="flex-1">
                  Jugar de Nuevo
                </Button>
                <Button onClick={onExit} variant="outline" className="flex-1">
                  Salir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        {/* GameTopBar */}
        <div className="py-4">
          <GameTopBar
            onBack={onExit}
            level={level}
            timeLeftSec={Math.ceil(timeRemaining / 1000)}
            score={totalScore}
          />
        </div>
      </div>
      
      <div className="mx-auto max-w-[480px] px-3 overflow-x-hidden">
        
        {/* Progress indicators */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="outline">Ronda {currentRound}</Badge>
          <Badge variant="outline">Dificultad {subtletyLevel}</Badge>
          <Badge variant="outline">Racha {consecutiveCorrect}</Badge>
        </div>

        {/* Instructions */}
        <div className="mb-4 text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border">
          <p className="text-lg font-medium text-muted-foreground">
            {t('twinwords.instruction')}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Encontrados: {foundTargets.size}/{currentPairs.filter(p => !p.identical).length}
          </p>
        </div>

        {/* Word Grid */}
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(clamp(120px,25vw,160px),1fr))]">
          <AnimatePresence mode="wait">
            {currentPairs.map((pair, index) => (
              <motion.div
                key={`${currentRound}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-200 min-h-[clamp(100px,20vw,120px)] ${
                    foundTargets.has(index)
                      ? 'ring-2 ring-green-500 bg-green-50' 
                      : !pair.identical
                      ? 'border-orange-300 hover:shadow-md hover:scale-105'
                      : 'border-gray-200 hover:shadow-md hover:scale-105'
                  }`}
                  onClick={() => handlePairClick(index)}
                  style={{ touchAction: 'manipulation' }}
                >
                  <CardContent className="p-4 h-full flex flex-col justify-center items-center text-center relative">
                    <div className={`${fontStyling.fontSize} ${fontStyling.fontWeight} ${fontStyling.letterSpacing} ${fontStyling.lineHeight} space-y-2`}>
                      <div className="border-b border-gray-200 pb-2">
                        {pair.left}
                      </div>
                      <div>
                        {pair.right}
                      </div>
                    </div>
                    {pair.kind && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {pair.kind}
                      </Badge>
                    )}
                    {foundTargets.has(index) && (
                      <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-green-500" />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Progress display */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Progreso: {foundTargets.size}/{currentPairs.filter(p => !p.identical).length} objetivos encontrados
          </p>
        </div>

        {/* Round feedback */}
        {roundScores.length > 0 && (
          <div className="mt-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2"
            >
              {roundScores[roundScores.length - 1].correct ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-semibold">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-600 font-semibold">Try again!</span>
                </>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
