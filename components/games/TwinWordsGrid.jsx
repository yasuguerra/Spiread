'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Timer, Target } from 'lucide-react'
import { selectPairs, getDifficultyLevel, getFontStyling, GamePair } from '@/lib/twinwords/selectPairs'

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
  const [roundStartTime, setRoundStartTime] = useState(null)
  const [totalScore, setTotalScore] = useState(0)
  const [roundScores, setRoundScores] = useState([])
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0)
  const [subtletyLevel, setSubtletyLevel] = useState(1)
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
    
    const newSelected = new Set(selectedPairs)
    newSelected.add(index)
    setSelectedPairs(newSelected)
    
    // If we've selected 2 pairs, check if they match
    if (newSelected.size === 2) {
      const [first, second] = Array.from(newSelected)
      const pair1 = currentPairs[first]
      const pair2 = currentPairs[second]
      
      const isCorrectMatch = pair1.identical === pair2.identical
      const reactionTime = Date.now() - roundStartTime
      
      setReactionTimes(prev => [...prev, reactionTime])
      
      if (isCorrectMatch) {
        setTotalScore(prev => prev + 10)
        setConsecutiveCorrect(prev => prev + 1)
        setRoundScores(prev => [...prev, { round: currentRound, score: 10, correct: true, time: reactionTime }])
      } else {
        setConsecutiveCorrect(0)
        setRoundScores(prev => [...prev, { round: currentRound, score: 0, correct: false, time: reactionTime }])
      }
      
      // Move to next round after brief delay
      setTimeout(() => {
        if (currentRound < 20) { // Max 20 rounds
          setCurrentRound(prev => prev + 1)
          generateRound()
        } else {
          endGame()
        }
      }, 1500)
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
              <h1 className="text-2xl font-bold">Twin Words</h1>
              <p className="text-gray-600">
                Select pairs of words that are identical or different. 
                Look carefully for subtle differences!
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Accents: esta vs está</p>
                <p>• Look-alikes: rn vs m</p>
                <p>• Minimal pairs: casa vs caza</p>
              </div>
              <Button onClick={startGame} className="w-full">
                Start Game ({formatTime(durationMs)})
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
              <h1 className="text-2xl font-bold">Game Complete!</h1>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{totalScore}</div>
                  <div className="text-sm text-blue-800">Score</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{accuracy.toFixed(1)}%</div>
                  <div className="text-sm text-green-800">Accuracy</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Rounds:</span>
                  <span className="font-semibold">{currentRound}</span>
                </div>
                <div className="flex justify-between">
                  <span>Final Difficulty:</span>
                  <Badge variant="outline">Level {subtletyLevel}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Best Streak:</span>
                  <span className="font-semibold">{Math.max(...[0, ...roundScores.map((_, i) => {
                    let streak = 0
                    for (let j = i; j >= 0 && roundScores[j].correct; j--) streak++
                    return streak
                  })])}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={startGame} className="flex-1">
                  Play Again
                </Button>
                <Button onClick={onExit} variant="outline" className="flex-1">
                  Exit
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
      <div className="mx-auto max-w-4xl p-4">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              <span className="font-semibold">{totalScore}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Round {currentRound}</Badge>
            <Badge variant="outline">Level {subtletyLevel}</Badge>
            <Badge variant="outline">Streak {consecutiveCorrect}</Badge>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4 text-center">
          <p className="text-gray-600">
            Select two pairs that are both <strong>identical</strong> or both <strong>different</strong>
          </p>
        </div>

        {/* Word Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
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
                  className={`cursor-pointer transition-all duration-200 min-h-[120px] ${
                    selectedPairs.has(index) 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md hover:scale-105'
                  }`}
                  onClick={() => handlePairClick(index)}
                >
                  <CardContent className="p-4 h-full flex flex-col justify-center items-center text-center">
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
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Selected indicator */}
        {selectedPairs.size > 0 && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Selected {selectedPairs.size}/2 pairs
            </p>
          </div>
        )}

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
