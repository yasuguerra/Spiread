'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle } from 'lucide-react'
import GameShell from '../GameShell'

export default function MemoryDigits({ difficultyLevel = 1, durationMs, onFinish, onExit }) {
  return (
    <GameShell
      gameId="memory_digits"
      difficultyLevel={difficultyLevel}
      durationMs={durationMs}
      onFinish={onFinish}
      onExit={onExit}
    >
      {(gameContext) => <MemoryGame gameContext={gameContext} />}
    </GameShell>
  )
}

function MemoryGame({ gameContext }) {
  const [phase, setPhase] = useState('waiting') // 'waiting', 'showing', 'input', 'feedback'
  const [currentNumber, setCurrentNumber] = useState('')
  const [userInput, setUserInput] = useState('')
  const [totalTrials, setTotalTrials] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [currentDigits, setCurrentDigits] = useState(3)
  const [longestCorrect, setLongestCorrect] = useState(0)
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0)
  const [showTime, setShowTime] = useState(0)
  const [inputStartTime, setInputStartTime] = useState(null)
  const [reactionTimes, setReactionTimes] = useState([])
  const [feedback, setFeedback] = useState(null)
  
  const { 
    gameState, 
    recordTrial, 
    getGameParameters, 
    handleGameEnd 
  } = gameContext

  const inputRef = useRef(null)
  const timeoutRef = useRef(null)

  // Start first trial when game begins
  useEffect(() => {
    if (gameState === 'playing' && phase === 'waiting') {
      setTimeout(() => {
        startNewTrial()
      }, 1000)
    }
  }, [gameState])

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const startNewTrial = () => {
    const params = getGameParameters()
    const { digitsCount, exposureTime, hasDecoyDigits } = params
    
    // Generate random number with specified digit count
    let number = ''
    for (let i = 0; i < digitsCount; i++) {
      const digit = Math.floor(Math.random() * 10)
      number += digit.toString()
    }
    
    setCurrentNumber(number)
    setCurrentDigits(digitsCount)
    setUserInput('')
    setPhase('showing')
    setShowTime(exposureTime)
    setFeedback(null)
    
    // Hide number after exposure time
    timeoutRef.current = setTimeout(() => {
      setPhase('input')
      setInputStartTime(Date.now())
      
      // Focus input after brief delay
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    }, exposureTime)
  }

  const handleSubmit = () => {
    if (!userInput.trim()) return
    
    const reactionTime = inputStartTime ? Date.now() - inputStartTime : 0
    const isCorrect = userInput.trim() === currentNumber
    
    setTotalTrials(prev => prev + 1)
    setReactionTimes(prev => [...prev, reactionTime])
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1)
      setConsecutiveCorrect(prev => prev + 1)
      setLongestCorrect(prev => Math.max(prev, currentDigits))
      setFeedback({ type: 'correct', rt: reactionTime })
      
      // Check if should increase difficulty (3-down rule)
      if (consecutiveCorrect + 1 >= 3) {
        // Will be handled by adaptive difficulty system
      }
    } else {
      setConsecutiveCorrect(0)
      setFeedback({ type: 'wrong', rt: reactionTime, correct: currentNumber })
    }
    
    // Record trial for adaptive difficulty
    recordTrial(isCorrect, reactionTime, {
      digits_shown: currentDigits,
      typed_correct: isCorrect,
      typed_value: userInput.trim(),
      exposure_time: getGameParameters().exposureTime
    })
    
    setPhase('feedback')
    
    // Auto-advance to next trial
    setTimeout(() => {
      startNewTrial()
    }, 2000)
  }

  // Handle enter key in input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  // Handle game end
  useEffect(() => {
    if (gameState === 'summary') {
      const accuracy = totalTrials > 0 ? correctCount / totalTrials : 0
      const avgReactionTime = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0

      const finalResults = {
        score: Math.min(100, Math.round(accuracy * 70 + (longestCorrect / 12) * 30)),
        metrics: {
          digits_shown: currentDigits,
          exposure_ms: getGameParameters().exposureTime,
          typed_correct: correctCount,
          total_trials: totalTrials,
          mean_rt_ms: Math.round(avgReactionTime),
          longest_correct_digits: longestCorrect
        }
      }

      handleGameEnd(finalResults)
    }
  }, [gameState])

  const accuracy = totalTrials > 0 ? (correctCount / totalTrials) * 100 : 0
  const params = getGameParameters()

  return (
    <div className="space-y-6">
      {/* Stats Panel */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalTrials}</div>
              <div className="text-xs text-muted-foreground">Intentos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{correctCount}</div>
              <div className="text-xs text-muted-foreground">Correctos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{currentDigits}</div>
              <div className="text-xs text-muted-foreground">Dígitos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{longestCorrect}</div>
              <div className="text-xs text-muted-foreground">Máximo</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{Math.round(accuracy)}%</div>
              <div className="text-xs text-muted-foreground">Precisión</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Memoriza el número y escríbelo exactamente
            </h3>
            <p className="text-sm text-muted-foreground">
              El número aparecerá por {Math.round(params.exposureTime / 1000)} segundos. 
              Luego deberás escribirlo de memoria.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Game Area */}
      <Card>
        <CardContent className="p-8">
          <div className="min-h-[300px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {phase === 'waiting' && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="text-2xl text-muted-foreground">
                    Preparándose...
                  </div>
                </motion.div>
              )}

              {phase === 'showing' && (
                <motion.div
                  key="showing"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="text-center"
                >
                  <div className="text-6xl font-mono font-bold text-blue-600 mb-4">
                    {currentNumber}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Memoriza este número ({currentDigits} dígitos)
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline">
                      {Math.round(showTime / 1000)}s restantes
                    </Badge>
                  </div>
                </motion.div>
              )}

              {phase === 'input' && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-6 w-full max-w-md"
                >
                  <div className="text-xl font-semibold">
                    ¿Cuál era el número?
                  </div>
                  
                  <div className="space-y-4">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Escribe el número..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="text-center text-2xl font-mono"
                      maxLength={currentDigits}
                    />
                    
                    <Button 
                      onClick={handleSubmit}
                      disabled={!userInput.trim()}
                      size="lg"
                    >
                      Confirmar
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Esperando {currentDigits} dígitos
                  </div>
                </motion.div>
              )}

              {phase === 'feedback' && feedback && (
                <motion.div
                  key="feedback"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4"
                >
                  {feedback.type === 'correct' ? (
                    <>
                      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        ¡Correcto!
                      </div>
                      <div className="text-lg font-mono">
                        {currentNumber}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Tiempo: {feedback.rt}ms
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle className="w-8 h-8 text-red-600" />
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        Incorrecto
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          Tu respuesta: <span className="font-mono">{userInput}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Correcto: <span className="font-mono text-green-600">{feedback.correct}</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Tiempo: {feedback.rt}ms
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Progress indicators */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Racha consecutiva:</span>
              <span className="font-semibold">{consecutiveCorrect}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (consecutiveCorrect / 3) * 100)}%` }}
              />
            </div>
            
            <div className="text-xs text-center text-muted-foreground">
              {consecutiveCorrect < 3 
                ? `${3 - consecutiveCorrect} aciertos más para subir nivel`
                : 'Listo para subir nivel'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game info */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <div>
              <strong>Configuración actual:</strong> {currentDigits} dígitos en {Math.round(params.exposureTime / 1000)}s
            </div>
            <div className="flex justify-center gap-6 text-xs">
              <span>🧠 Memoria: Inmediata</span>
              <span>⚡ Exposición: {params.exposureTime}ms</span>
              <span>🎯 Meta: 3 aciertos seguidos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}