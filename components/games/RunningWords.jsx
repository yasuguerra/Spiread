'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SessionManager from './common/SessionManager'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Timer, Trophy, Target, TrendingUp, Clock, Zap } from 'lucide-react'
import { WORD_BANK } from '@/lib/word-bank'
import { getLastLevel, setLastLevel, getLastBestScore, updateBestScore, updateGameProgress, GAME_IDS } from '@/lib/progress-tracking'

const GAME_CONFIG = {
  name: 'running_words',
  displayName: 'Running Words',
  description: 'Memoriza palabras en secuencia de 5 líneas',
  levels: {
    1: { wordsPerLine: 3, wordExposureMs: 350, blocksPerRound: 1, goalRT: 3000 },
    2: { wordsPerLine: 3, wordExposureMs: 320, blocksPerRound: 1, goalRT: 3000 },
    3: { wordsPerLine: 4, wordExposureMs: 300, blocksPerRound: 1, goalRT: 2800 },
    4: { wordsPerLine: 4, wordExposureMs: 280, blocksPerRound: 1, goalRT: 2800 },
    5: { wordsPerLine: 5, wordExposureMs: 260, blocksPerRound: 1, goalRT: 2500 },
    6: { wordsPerLine: 5, wordExposureMs: 240, blocksPerRound: 1, goalRT: 2500 },
    7: { wordsPerLine: 6, wordExposureMs: 220, blocksPerRound: 1, goalRT: 2200 },
    8: { wordsPerLine: 6, wordExposureMs: 200, blocksPerRound: 1, goalRT: 2200 },
    9: { wordsPerLine: 7, wordExposureMs: 190, blocksPerRound: 1, goalRT: 2000 },
    10: { wordsPerLine: 7, wordExposureMs: 180, blocksPerRound: 1, goalRT: 2000 },
    11: { wordsPerLine: 8, wordExposureMs: 170, blocksPerRound: 1, goalRT: 1800 },
    12: { wordsPerLine: 8, wordExposureMs: 165, blocksPerRound: 2, goalRT: 1800 },
    13: { wordsPerLine: 8, wordExposureMs: 160, blocksPerRound: 2, goalRT: 1600 },
    14: { wordsPerLine: 9, wordExposureMs: 158, blocksPerRound: 2, goalRT: 1600 },
    15: { wordsPerLine: 9, wordExposureMs: 156, blocksPerRound: 2, goalRT: 1500 },
    16: { wordsPerLine: 9, wordExposureMs: 154, blocksPerRound: 2, goalRT: 1500 },
    17: { wordsPerLine: 9, wordExposureMs: 152, blocksPerRound: 2, goalRT: 1400 },
    18: { wordsPerLine: 9, wordExposureMs: 151, blocksPerRound: 2, goalRT: 1400 },
    19: { wordsPerLine: 9, wordExposureMs: 150, blocksPerRound: 2, goalRT: 1300 },
    20: { wordsPerLine: 9, wordExposureMs: 150, blocksPerRound: 2, goalRT: 1200 }
  }
}

export default function RunningWords({ 
  level = 1, 
  onComplete,
  onScoreUpdate,
  durationSec = 120, // Default 2 minutes
  locale = 'es',
  onExit,
  onBackToGames,
  onViewStats
}) {
  const [gameState, setGameState] = useState('idle') // idle, showing, question, complete
  const [currentBlock, setCurrentBlock] = useState(0)
  const [currentLine, setCurrentLine] = useState(0)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [lines, setLines] = useState([])
  const [questionData, setQuestionData] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [sessionData, setSessionData] = useState({
    totalRounds: 0,
    correctAnswers: 0,
    responseTs: [],
    accuracy: 0,
    avgResponseTime: 0,
    bestResponseTime: Infinity,
    wordsProcessed: 0,
    streakBest: 0
  })

  // Timer and session tracking
  const [gameStartTime, setGameStartTime] = useState(0)
  const [roundStartTime, setRoundStartTime] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const gameContextRef = useRef(null)

  const config = GAME_CONFIG.levels[Math.min(level, 20)]
  const words = WORD_BANK.runningWords[locale] || WORD_BANK.runningWords.es
  const showLineNumbers = level < 8

  const questionStartTime = useRef(null)

  // Generate a random block of lines with words
  const generateBlock = useCallback(() => {
    const blockLines = []
    for (let i = 0; i < 5; i++) {
      const lineWords = []
      for (let j = 0; j < config.wordsPerLine; j++) {
        const randomWord = words[Math.floor(Math.random() * words.length)]
        lineWords.push(randomWord)
      }
      blockLines.push(lineWords)
    }
    return blockLines
  }, [config.wordsPerLine, words])

  // Generate question with distractors
  const generateQuestion = useCallback((blockLines) => {
    const askedLine = Math.floor(Math.random() * 5)
    const correctAnswer = blockLines[askedLine][blockLines[askedLine].length - 1]
    
    // Generate distractors: last words from other lines + one random word
    const distractors = []
    for (let i = 0; i < 5; i++) {
      if (i !== askedLine) {
        distractors.push(blockLines[i][blockLines[i].length - 1])
      }
    }
    // Add one random word from the word bank
    const randomWord = words[Math.floor(Math.random() * words.length)]
    distractors.push(randomWord)
    
    // Shuffle choices (correct + 3 distractors)
    const choices = [correctAnswer, ...distractors.slice(0, 3)]
    const shuffledChoices = choices.sort(() => Math.random() - 0.5)
    const correctIndex = shuffledChoices.indexOf(correctAnswer)

    return {
      askedLine: askedLine + 1, // 1-indexed for display
      question: `¿Cuál fue la última palabra de la línea ${askedLine + 1}?`,
      choices: shuffledChoices,
      correctIndex,
      correctAnswer
    }
  }, [words])

  // Start a new round
  const startRound = useCallback(() => {
    if (!gameStarted) return

    const blockLines = generateBlock()
    setLines(blockLines)
    setCurrentBlock(0)
    setCurrentLine(0)
    setCurrentWordIndex(0)
    setGameState('showing')
    setSelectedAnswer(null)
  }, [generateBlock, gameStarted])

  // Handle word display sequence
  useEffect(() => {
    if (gameState !== 'showing') return

    const timer = setTimeout(() => {
      const currentLines = lines[currentBlock] || lines
      
      if (currentLine < 5) {
        if (currentWordIndex < config.wordsPerLine) {
          setCurrentWordIndex(prev => prev + 1)
        } else {
          setCurrentLine(prev => prev + 1)
          setCurrentWordIndex(0)
        }
      } else {
        // Block complete, show question
        const question = generateQuestion(lines)
        setQuestionData(question)
        setGameState('question')
        questionStartTime.current = Date.now()
      }
    }, config.wordExposureMs)

    return () => clearTimeout(timer)
  }, [gameState, currentLine, currentWordIndex, config.wordExposureMs, config.wordsPerLine, lines, generateQuestion])

  // Handle answer selection
  const handleAnswerSelect = useCallback((choiceIndex) => {
    if (selectedAnswer !== null) return
    
    const rt = Date.now() - questionStartTime.current
    const isCorrect = choiceIndex === questionData.correctIndex
    
    setSelectedAnswer(choiceIndex)
    
    // Calculate score with enhanced bonuses
    const baseScore = config.wordsPerLine
    const speedBonus = isCorrect ? Math.ceil(Math.max(0, (config.goalRT - rt) / config.goalRT * config.wordsPerLine)) : 0
    let streakBonus = 0
    
    // Calculate streak bonus for consecutive correct answers
    if (isCorrect && sessionData.totalRounds > 0) {
      const recentAnswers = sessionData.responseTs.slice(-4) // Last 4 answers
      const recentCorrect = recentAnswers.length > 0 ? recentAnswers.filter((_, i) => {
        const roundIndex = sessionData.totalRounds - recentAnswers.length + i
        return roundIndex >= 0 && sessionData.correctAnswers > 0
      }).length : 0
      
      if (recentCorrect >= 3) streakBonus = Math.floor(recentCorrect / 3) * 2
    }
    
    const roundScore = baseScore + speedBonus + streakBonus
    setScore(prev => prev + roundScore)

    // Enhanced session tracking
    const newResponseTs = [...sessionData.responseTs, rt]
    const newCorrectAnswers = sessionData.correctAnswers + (isCorrect ? 1 : 0)
    const newTotalRounds = sessionData.totalRounds + 1
    const newWordsProcessed = sessionData.wordsProcessed + (config.wordsPerLine * 5) // 5 lines per round
    const avgResponseTime = newResponseTs.length > 0 ? newResponseTs.reduce((a, b) => a + b) / newResponseTs.length : 0
    const bestResponseTime = Math.min(sessionData.bestResponseTime, rt)

    setSessionData(prev => ({
      totalRounds: newTotalRounds,
      correctAnswers: newCorrectAnswers,
      responseTs: newResponseTs,
      accuracy: (newCorrectAnswers / newTotalRounds) * 100,
      avgResponseTime,
      bestResponseTime: bestResponseTime === Infinity ? rt : bestResponseTime,
      wordsProcessed: newWordsProcessed
    }))

    setCurrentRound(prev => prev + 1)

    // Continue or complete based on game context
    setTimeout(() => {
      if (gameContextRef.current && gameContextRef.current.gameState === 'playing') {
        startRound()
      } else {
        setGameState('complete')
      }
    }, 1500)
  }, [selectedAnswer, questionData, config, sessionData, startRound])

  // Auto-start first round when game starts
  useEffect(() => {
    if (gameStarted && gameState === 'idle') {
      startRound()
    }
  }, [gameStarted, gameState, startRound])

  // Handle session end
  const handleSessionEnd = useCallback((summary) => {
    setGameState('complete')
    
    const meanRT = sessionData.responseTs.length > 0 
      ? sessionData.responseTs.reduce((a, b) => a + b, 0) / sessionData.responseTs.length 
      : 0

    const finalSummary = {
      ...summary,
      gameId: GAME_IDS.RUNNING_WORDS,
      score: score,
      level: level,
      accuracy: sessionData.accuracy,
      extras: {
        wordsPerLine: config.wordsPerLine,
        wordExposureMs: config.wordExposureMs,
        totalRounds: sessionData.totalRounds,
        meanRT: meanRT,
        responseTs: sessionData.responseTs,
        streakBest: sessionData.streakBest
      }
    }

    // Persist the progress
    updateGameProgress(GAME_IDS.RUNNING_WORDS, finalSummary)

    onComplete?.(score, {
      wordsPerLine: config.wordsPerLine,
      wordExposureMs: config.wordExposureMs,
      totalRounds: sessionData.totalRounds,
      accuracy: sessionData.accuracy,
      meanRT
    })
  }, [score, sessionData, config, level, onComplete])

  // Render current display
  const renderContent = () => {
    if (gameState === 'showing') {
      return (
        <div className="text-center space-y-4">
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, lineIndex) => (
              <div key={lineIndex} className="flex items-center justify-center space-x-2 h-12">
                {showLineNumbers && (
                  <span className="w-8 text-sm text-muted-foreground">
                    {lineIndex + 1}.
                  </span>
                )}
                <div className="flex space-x-3 min-w-0 flex-1 justify-center">
                  {Array.from({ length: config.wordsPerLine }, (_, wordIndex) => (
                    <span 
                      key={wordIndex}
                      className={`text-lg font-medium transition-opacity duration-100 ${
                        lineIndex === currentLine && wordIndex === currentWordIndex
                          ? 'opacity-100 text-blue-600 font-bold scale-110'
                          : lineIndex < currentLine || (lineIndex === currentLine && wordIndex < currentWordIndex)
                          ? 'opacity-60'
                          : 'opacity-20'
                      }`}
                    >
                      {lineIndex < lines.length && wordIndex < lines[lineIndex]?.length 
                        ? lines[lineIndex][wordIndex] 
                        : '---'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Progress 
            value={(currentLine * config.wordsPerLine + currentWordIndex) / (5 * config.wordsPerLine) * 100} 
            className="w-full max-w-md mx-auto"
          />
        </div>
      )
    }

    if (gameState === 'question' && questionData) {
      return (
        <div className="text-center space-y-6">
          <h3 className="text-xl font-bold">{questionData.question}</h3>
          <div className="grid gap-3 max-w-md mx-auto">
            {questionData.choices.map((choice, index) => (
              <Button
                key={index}
                variant={
                  selectedAnswer === null 
                    ? "outline" 
                    : index === questionData.correctIndex
                    ? "default"
                    : selectedAnswer === index
                    ? "destructive"
                    : "outline"
                }
                className={`text-left justify-start ${
                  selectedAnswer !== null && index === questionData.correctIndex
                    ? "bg-green-100 border-green-500 text-green-800"
                    : selectedAnswer === index && index !== questionData.correctIndex
                    ? "bg-red-100 border-red-500 text-red-800"
                    : ""
                }`}
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null}
              >
                {String.fromCharCode(65 + index)}. {choice}
              </Button>
            ))}
          </div>
          {selectedAnswer !== null && (
            <div className="text-sm text-muted-foreground">
              {selectedAnswer === questionData.correctIndex ? "¡Correcto!" : "Incorrecto"}
            </div>
          )}
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
              Precisión: {(sessionData.accuracy * 100).toFixed(1)}% • 
              Rondas: {sessionData.totalRounds}
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

  // Handle session start
  const handleSessionStart = useCallback(() => {
    setGameStarted(true)
    setGameState('idle')
  }, [])

  return (
    <SessionManager
      gameTitle={GAME_CONFIG.displayName}
      durationSec={durationSec}
      currentScore={score}
      currentLevel={level}
      accuracy={sessionData.accuracy}
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
              <p className="text-xs text-muted-foreground">
                Nivel {level} • {config.wordsPerLine} palabras/línea • {config.wordExposureMs}ms
              </p>
            </div>
            
            <div className="min-h-[400px] flex items-center justify-center">
              {!gameStarted ? (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Presiona Iniciar para comenzar</p>
                  <Button onClick={handleSessionStart}>
                    Comenzar Juego
                  </Button>
                </div>
              ) : (
                renderContent()
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </SessionManager>
  )
}