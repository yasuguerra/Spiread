// Progress Tracking Utilities for Sprint Juegos
// Handles settings.progress persistence and game resume functionality

import { supabase } from './supabase'

// Utility functions for level persistence (PR A - Core UX)
export function getLastLevel(gameKey) {
  try {
    const stored = localStorage.getItem(`spiread_level_${gameKey}`)
    return stored ? parseInt(stored, 10) : 1
  } catch {
    return 1
  }
}

export function setLastLevel(gameKey, level) {
  try {
    localStorage.setItem(`spiread_level_${gameKey}`, level.toString())
  } catch (error) {
    console.warn('Failed to save level:', error)
  }
}

export function getLastBestScore(gameKey) {
  try {
    const stored = localStorage.getItem(`spiread_best_${gameKey}`)
    return stored ? parseInt(stored, 10) : 0
  } catch {
    return 0
  }
}

export function updateBestScore(gameKey, score) {
  try {
    const currentBest = getLastBestScore(gameKey)
    if (score > currentBest) {
      localStorage.setItem(`spiread_best_${gameKey}`, score.toString())
      return true // New best score
    }
    return false
  } catch (error) {
    console.warn('Failed to update best score:', error)
    return false
  }
}

// Check if GameIntro should be shown today
export function shouldShowGameIntro(gameKey) {
  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const hiddenToday = localStorage.getItem(`gi_${gameKey}_${today}`)
    return hiddenToday !== 'hidden'
  } catch {
    return true
  }
}

// Get historical game runs for sparkline (mock data for now - replace with real API call)
export async function getGameHistoricalData(gameKey, days = 7) {
  try {
    // TODO: Replace with actual API call to get game_runs
    // For now, return mock data based on localStorage
    const mockData = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      // Generate semi-realistic mock scores
      const baseScore = getLastBestScore(gameKey) || Math.floor(Math.random() * 100) + 50
      const variation = Math.floor(Math.random() * 20) - 10 // ±10 variation
      const score = Math.max(0, baseScore + variation)
      
      mockData.push({
        score: score,
        date: dateStr
      })
    }
    
    return mockData
  } catch (error) {
    console.warn('Failed to get historical data:', error)
    return []
  }
}

// Load game progress from settings
export async function loadGameProgress(userId, gameType) {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('progress')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading progress:', error)
      return getDefaultProgress(gameType)
    }

    const progress = data?.progress || {}
    return progress[gameType] || getDefaultProgress(gameType)
  } catch (error) {
    console.error('Error loading game progress:', error)
    return getDefaultProgress(gameType)
  }
}

// Save game progress to settings
export async function saveGameProgress(userId, gameType, progressData) {
  try {
    // First get existing progress
    const { data: existing } = await supabase
      .from('settings')
      .select('progress')
      .eq('user_id', userId)
      .single()

    const currentProgress = existing?.progress || {}
    const updatedProgress = {
      ...currentProgress,
      [gameType]: {
        ...currentProgress[gameType],
        ...progressData,
        updated_at: new Date().toISOString()
      }
    }

    const { error } = await supabase
      .from('settings')
      .upsert({
        user_id: userId,
        progress: updatedProgress,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving progress:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error saving game progress:', error)
    return false
  }
}

// Get default progress for a game type
export function getDefaultProgress(gameType) {
  const defaults = {
    memory_digits: {
      last_level: 1,
      last_best_score: 0,
      total_rounds: 0,
      average_rt: 0
    },
    schulte: {
      last_level: 1,
      last_best_score: 0,
      total_tables: 0,
      best_table_time: null
    },
    par_impar: {
      last_level: 1,
      last_best_score: 0,
      total_rounds: 0,
      best_accuracy: 0
    }
  }

  return defaults[gameType] || defaults.memory_digits
}

// Get historical scores for charts (from game_runs)
export async function getHistoricalScores(userId, gameType, days = 30) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await supabase
      .from('game_runs')
      .select('score, created_at, duration_ms, metrics')
      .eq('user_id', userId)
      .eq('game', gameType)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching historical scores:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting historical scores:', error)
    return []
  }
}

// Process historical data for charts
export function processScoresForChart(scores, days = 30) {
  if (!scores.length) return { labels: [], data: [] }

  // Group scores by date
  const scoresByDate = {}
  scores.forEach(score => {
    const date = new Date(score.created_at).toISOString().split('T')[0]
    if (!scoresByDate[date]) {
      scoresByDate[date] = []
    }
    scoresByDate[date].push(score.score)
  })

  // Generate date range
  const labels = []
  const data = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    const dateStr = currentDate.toISOString().split('T')[0]
    
    labels.push(formatDateForChart(currentDate))
    
    if (scoresByDate[dateStr]) {
      // Use best score of the day
      data.push(Math.max(...scoresByDate[dateStr]))
    } else {
      data.push(null) // No score for this date
    }
  }

  return { labels, data }
}

// Format date for chart display
function formatDateForChart(date) {
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return date.toLocaleDateString('es-ES', { weekday: 'short' })
  
  return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
}

// Generate random number for memory digits game
export function generateRandomNumber(digits) {
  const min = Math.pow(10, digits - 1)
  const max = Math.pow(10, digits) - 1
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Generate number grid for par/impar game
export function generateNumberGrid(k, digitsLen, hasDistractors = false) {
  const numbers = []
  
  for (let i = 0; i < k; i++) {
    const number = generateRandomNumber(digitsLen)
    const isEven = number % 2 === 0
    
    numbers.push({
      id: i,
      value: number,
      isEven,
      isOdd: !isEven,
      selected: false,
      style: hasDistractors ? getRandomStyle() : null
    })
  }
  
  return numbers
}

// Get random style for distractors
function getRandomStyle() {
  const colors = ['text-red-600', 'text-blue-600', 'text-green-600', 'text-purple-600']
  const opacities = ['opacity-80', 'opacity-90', 'opacity-100']
  
  return {
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: opacities[Math.floor(Math.random() * opacities.length)]
  }
}

// Calculate accuracy for par/impar game
export function calculateAccuracy(selections, targets, rule) {
  let hits = 0
  let falsePositives = 0
  let misses = 0
  
  selections.forEach(selection => {
    const shouldBeSelected = rule === 'even' ? selection.isEven : selection.isOdd
    
    if (selection.selected && shouldBeSelected) {
      hits++
    } else if (selection.selected && !shouldBeSelected) {
      falsePositives++
    } else if (!selection.selected && shouldBeSelected) {
      misses++
    }
  })
  
  const totalTargets = targets
  const accuracy = totalTargets > 0 ? hits / totalTargets : 0
  
  return {
    hits,
    falsePositives,
    misses,
    accuracy,
    totalTargets
  }
}

// Generate Schulte table numbers
export function generateSchulteNumbers(n, mode = 'numbers') {
  let values = []
  
  switch (mode) {
    case 'letters':
      // Generate A-Z letters
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      values = Array.from({ length: n }, (_, i) => letters[i % 26])
      break
      
    case 'descending':
      values = Array.from({ length: n }, (_, i) => n - i)
      break
      
    case 'multiples':
      // Multiples of 3
      values = Array.from({ length: n }, (_, i) => (i + 1) * 3)
      break
      
    case 'primes':
      // First n prime numbers
      values = generatePrimes(n)
      break
      
    case 'fibonacci':
      // Fibonacci sequence
      values = generateFibonacci(n)
      break
      
    default:
      values = Array.from({ length: n }, (_, i) => i + 1)
  }
  
  // Shuffle the values
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]]
  }
  
  return values
}

// Generate first n prime numbers
function generatePrimes(n) {
  const primes = []
  let num = 2
  
  while (primes.length < n) {
    if (isPrime(num)) {
      primes.push(num)
    }
    num++
  }
  
  return primes
}

// Check if number is prime
function isPrime(num) {
  if (num < 2) return false
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false
  }
  return true
}

// Generate first n Fibonacci numbers
function generateFibonacci(n) {
  const fib = [1, 1]
  
  while (fib.length < n) {
    fib.push(fib[fib.length - 1] + fib[fib.length - 2])
  }
  
  return fib.slice(0, n)
}