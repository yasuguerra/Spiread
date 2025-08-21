'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GameShell from '../GameShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Timer, Trophy, Target, TrendingUp, Lightbulb, CheckCircle, Shuffle, Flame } from 'lucide-react'
import { WORD_BANK } from '@/lib/word-bank'
import { getLastLevel, setLastLevel, getLastBestScore, updateBestScore } from '@/lib/progress-tracking'

const GAME_CONFIG = {
  name: 'anagrams',
  displayName: 'Anagramas',
  description: 'Descifra los anagramas antes del tiempo límite',
  levels: {
    1: { length: 4, timePerAnagram: 10000, goalRT: 8000, decoyLetters: false },
    2: { length: 4, timePerAnagram: 9500, goalRT: 7500, decoyLetters: false },
    3: { length: 4, timePerAnagram: 9000, goalRT: 7000, decoyLetters: false },
    4: { length: 5, timePerAnagram: 9000, goalRT: 7000, decoyLetters: false },
    5: { length: 5, timePerAnagram: 8500, goalRT: 6500, decoyLetters: false },
    6: { length: 5, timePerAnagram: 8000, goalRT: 6000, decoyLetters: false },
    7: { length: 6, timePerAnagram: 8000, goalRT: 6000, decoyLetters: false },
    8: { length: 6, timePerAnagram: 7500, goalRT: 5500, decoyLetters: false },
    9: { length: 6, timePerAnagram: 7000, goalRT: 5000, decoyLetters: false },
    10: { length: 7, timePerAnagram: 7000, goalRT: 5000, decoyLetters: false },
    11: { length: 7, timePerAnagram: 6500, goalRT: 4500, decoyLetters: false },
    12: { length: 7, timePerAnagram: 6000, goalRT: 4000, decoyLetters: true },
    13: { length: 8, timePerAnagram: 6000, goalRT: 4000, decoyLetters: true },
    14: { length: 8, timePerAnagram: 5500, goalRT: 3500, decoyLetters: true },
    15: { length: 8, timePerAnagram: 5000, goalRT: 3000, decoyLetters: true },
    16: { length: 8, timePerAnagram: 4800, goalRT: 2800, decoyLetters: true },
    17: { length: 8, timePerAnagram: 4600, goalRT: 2600, decoyLetters: true },
    18: { length: 8, timePerAnagram: 4400, goalRT: 2400, decoyLetters: true },
    19: { length: 8, timePerAnagram: 4200, goalRT: 2200, decoyLetters: true },
    20: { length: 8, timePerAnagram: 4000, goalRT: 2000, decoyLetters: true }
  }
}

export default function Anagrams({ 
  level = 1, 
  onComplete,
  onScoreUpdate,
  timeRemaining, // Managed by GameShell
  locale = 'es',
  onExit,
  onBackToGames,
  onViewStats
}) {
  const [gameState, setGameState] = useState('idle') // idle, playing, complete
  const [currentWord, setCurrentWord] = useState('')
  const [anagram, setAnagram] = useState('')
  const [userInput, setUserInput] = useState('')
  const [anagramTimeLeft, setAnagramTimeLeft] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [sessionData, setSessionData] = useState({
    totalAnagrams: 0,
    solvedAnagrams: 0,
    expiredAnagrams: 0,
    responseTimes: [],
    accuracy: 0,
    correctStreak: 0,
    bestStreak: 0,
    avgResponseTime: 0,
    perfectSolves: 0 // Solved within goal time
  })

  // Enhanced state for new features
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [trainingMode, setTrainingMode] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [gameStartTime, setGameStartTime] = useState(0)
  const [normalizedInput, setNormalizedInput] = useState('')
  const gameContextRef = useRef(null)

  const config = GAME_CONFIG.levels[Math.min(level, 20)]
  const wordsData = WORD_BANK.anagrams[locale] || WORD_BANK.anagrams.es
  const anagramStartTime = useRef(null)
  const anagramTimer = useRef(null)

  // Load best streak from localStorage
  useEffect(() => {
    const savedBestStreak = localStorage.getItem('anagrams_best_streak')
    if (savedBestStreak) {
      setBestStreak(parseInt(savedBestStreak))
    }
  }, [])

  // Save best streak when it changes
  useEffect(() => {
    localStorage.setItem('anagrams_best_streak', bestStreak.toString())
  }, [bestStreak])

  // Normalize input function - remove accents, convert to lowercase
  const normalizeText = useCallback((text) => {
    return text
      .toLowerCase()
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
      .trim()
  }, [])

  // Get random word for current length
  const getRandomWord = useCallback(() => {
    const wordsOfLength = wordsData[config.length] || []
    if (wordsOfLength.length === 0) return 'test'
    return wordsOfLength[Math.floor(Math.random() * wordsOfLength.length)]
  }, [config.length, wordsData])

  // Shuffle letters to create anagram
  const shuffleWord = useCallback((word) => {
    const letters = word.split('')
    
    // Add decoy letters if enabled
    if (config.decoyLetters && Math.random() < 0.4) {
      const vowels = ['a', 'e', 'i', 'o', 'u']
      const consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z']
      
      // Add 1-2 decoy letters
      const decoyCount = Math.random() < 0.7 ? 1 : 2
      for (let i = 0; i < decoyCount; i++) {
        const isVowel = Math.random() < 0.3
        const decoyLetter = isVowel 
          ? vowels[Math.floor(Math.random() * vowels.length)]
          : consonants[Math.floor(Math.random() * consonants.length)]
        letters.push(decoyLetter)
      }
    }
    
    // Shuffle the letters
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[letters[i], letters[j]] = [letters[j], letters[i]]
    }
    
    return letters.join('')
  }, [config.decoyLetters])

  // Start new anagram
  const startAnagram = useCallback(() => {
    if (timeRemaining <= 0) return

    const word = getRandomWord()
    const shuffled = shuffleWord(word)
    
    setCurrentWord(word)
    setAnagram(shuffled)
    setUserInput('')
    setAnagramTimeLeft(config.timePerAnagram)
    anagramStartTime.current = Date.now()
    
    // Start countdown timer
    if (anagramTimer.current) {
      clearInterval(anagramTimer.current)
    }
    
    anagramTimer.current = setInterval(() => {
      setAnagramTimeLeft(prev => {
        if (prev <= 100) {
          return 0 // Don't call handleAnagramExpired here to avoid recursion
        }
        return prev - 100
      })
    }, 100)
  }, [getRandomWord, shuffleWord, config.timePerAnagram]) // Remove timeRemaining from deps

  // Handle anagram expired
  const handleAnagramExpired = useCallback(() => {
    if (anagramTimer.current) {
      clearInterval(anagramTimer.current)
      anagramTimer.current = null
    }
    
    // Penalty for expired anagram
    setScore(prev => Math.max(0, prev - 1))
    setStreak(0)
    
    // Update session data
    setSessionData(prev => ({
      ...prev,
      totalAnagrams: prev.totalAnagrams + 1,
      expiredAnagrams: prev.expiredAnagrams + 1,
      correctStreak: 0,
      accuracy: prev.solvedAnagrams / (prev.totalAnagrams + 1)
    }))
  }, []) // Remove startAnagram from dependencies
  
  // Watch for anagram timer expiration
  useEffect(() => {
    if (anagramTimeLeft <= 0 && gameState === 'playing') {
      handleAnagramExpired()
      
      // Start next anagram or complete after short delay
      setTimeout(() => {
        if (timeRemaining > 1000) {
          startAnagram()
        } else {
          setGameState('complete')
        }
      }, 1000)
    }
  }, [anagramTimeLeft, gameState, timeRemaining, handleAnagramExpired, startAnagram])

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const value = e.target.value
    setUserInput(value)
    
    // Normalize both input and target word for comparison
    const normalizedInput = normalizeText(value)
    const normalizedTarget = normalizeText(currentWord)
    
    // Check if correct
    if (normalizedInput === normalizedTarget) {
      handleCorrectAnswer()
    }
  }, [currentWord, normalizeText])

  // Handle correct answer
  const handleCorrectAnswer = useCallback(() => {
    if (anagramTimer.current) {
      clearInterval(anagramTimer.current)
      anagramTimer.current = null
    }
    
    const rt = Date.now() - anagramStartTime.current
    const newStreak = streak + 1
    
    // Calculate score
    const baseScore = config.length
    const streakBonus = Math.floor(newStreak / 3) // Bonus every 3 correct
    const timeBonus = rt < config.goalRT ? 1 : 0
    const anagramScore = baseScore + streakBonus + timeBonus
    
    setScore(prev => prev + anagramScore)
    setStreak(newStreak)
    onScoreUpdate?.(score + anagramScore)
    
    // Update session data
    setSessionData(prev => ({
      ...prev,
      totalAnagrams: prev.totalAnagrams + 1,
      solvedAnagrams: prev.solvedAnagrams + 1,
      responseTimes: [...prev.responseTimes, rt],
      correctStreak: newStreak,
      bestStreak: Math.max(prev.bestStreak, newStreak),
      accuracy: (prev.solvedAnagrams + 1) / (prev.totalAnagrams + 1)
    }))
    
    // Start next anagram or complete after short delay
    setTimeout(() => {
      if (timeRemaining > 1000) {
        startAnagram()
      } else {
        setGameState('complete')
      }
    }, 500)
  }, [streak, config, score, onScoreUpdate, timeRemaining, startAnagram])

  // Handle key press (Enter to submit)
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      const normalizedInput = normalizeText(userInput)
      const normalizedTarget = normalizeText(currentWord)
      
      if (normalizedInput === normalizedTarget) {
        handleCorrectAnswer()
      }
    }
  }, [userInput, currentWord, handleCorrectAnswer, normalizeText])

  // Auto-start first anagram
  useEffect(() => {
    if (timeRemaining > 0 && gameState === 'idle') {
      setGameState('playing')
      startAnagram()
    }
  }, [timeRemaining, gameState, startAnagram])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (anagramTimer.current) {
        clearInterval(anagramTimer.current)
      }
    }
  }, [])

  // Handle game completion
  useEffect(() => {
    if (timeRemaining <= 0 && gameState !== 'complete') {
      if (anagramTimer.current) {
        clearInterval(anagramTimer.current)
        anagramTimer.current = null
      }
      
      setGameState('complete')
      
      const meanRT = sessionData.responseTimes.length > 0 
        ? sessionData.responseTimes.reduce((a, b) => a + b, 0) / sessionData.responseTimes.length 
        : 0

      const metrics = {
        length: config.length,
        timeLimit_ms: config.timePerAnagram,
        solved: sessionData.solvedAnagrams,
        expired: sessionData.expiredAnagrams,
        rt_ms: meanRT,
        totalAnagrams: sessionData.totalAnagrams,
        accuracy: sessionData.accuracy,
        bestStreak: sessionData.bestStreak
      }

      onComplete?.(score, metrics)
    }
  }, [timeRemaining, gameState, score, sessionData, config, onComplete])

  const renderContent = () => {
    if (gameState === 'playing') {
      const progressPercent = (anagramTimeLeft / config.timePerAnagram) * 100
      
      return (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-3xl font-mono font-bold tracking-widest bg-gray-100 py-4 px-6 rounded-lg">
                {anagram.toUpperCase()}
              </h3>
              <p className="text-sm text-muted-foreground">
                Ordena las letras para formar una palabra válida
              </p>
            </div>
            
            <div className="max-w-xs mx-auto space-y-2">
              <Input
                value={userInput}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Escribe la palabra..."
                className="text-center text-lg font-medium"
                autoFocus
              />
              
              <Progress 
                value={progressPercent} 
                className={`h-2 transition-colors ${
                  progressPercent < 20 ? 'bg-red-100' : progressPercent < 50 ? 'bg-yellow-100' : 'bg-green-100'
                }`}
              />
              
              <p className="text-xs text-muted-foreground">
                Tiempo: {Math.ceil(anagramTimeLeft / 1000)}s
              </p>
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <div className="flex justify-center gap-4 text-sm">
              <span>Racha: <strong className="text-blue-600">{streak}</strong></span>
              <span>Resueltos: <strong>{sessionData.solvedAnagrams}</strong></span>
              <span>Precisión: <strong>{(sessionData.accuracy * 100).toFixed(1)}%</strong></span>
            </div>
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
              Anagramas resueltos: {sessionData.solvedAnagrams} • 
              Mejor racha: {sessionData.bestStreak} •
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
              Nivel {level} • {config.length} letras • {config.timePerAnagram/1000}s por anagrama
              {config.decoyLetters && " • Con señuelos"}
            </p>
          </div>
          
          <div className="min-h-[400px] flex items-center justify-center">
            {renderContent()}
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Puntuación: {score} • Racha: {streak}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}