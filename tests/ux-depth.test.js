/**
 * Test suite for UX Depth features
 * Validates achievements, adaptive difficulty, text normalization, and RSVP quiz
 */

import { describe, test, expect } from 'vitest'
import { 
  checkNewAchievements, 
  getAchievementProgress,
  ACHIEVEMENTS 
} from '@/lib/achievements'
import { 
  updateStaircase, 
  createStaircase,
  adaptTwinWordsComplexity 
} from '@/lib/adaptive'
import { 
  normalizeText, 
  compareTexts, 
  matchesAnyAnswer 
} from '@/lib/text-normalize'
import { 
  calculateQuizScore, 
  getComprehensionLevel 
} from '@/lib/rsvp-quiz'

describe('Achievements System', () => {
  test('should detect new achievements correctly', () => {
    const mockProgress = {
      gameSessions: [
        { accuracy: 1.0, durationSec: 25 },
        { accuracy: 1.0, durationSec: 28 },
        { accuracy: 1.0, durationSec: 30 }
      ],
      gameProgress: {},
      achievements: []
    }

    const newAchievements = checkNewAchievements(mockProgress, [])
    expect(newAchievements.length).toBeGreaterThan(0)
  })

  test('should calculate achievement progress', () => {
    const marathonAchievement = ACHIEVEMENTS.find(a => a.id === 'marathon_runner')
    const mockProgress = {
      gameSessions: new Array(50).fill({ score: 100 })
    }

    const progress = getAchievementProgress(marathonAchievement, mockProgress)
    expect(progress).toBe(0.5) // 50/100 sessions
  })
})

describe('Adaptive Difficulty', () => {
  test('should adjust difficulty based on performance', () => {
    let staircase = createStaircase(5, 1, 10, 1)
    
    // Three correct answers should increase difficulty
    staircase = updateStaircase(staircase, true)
    staircase = updateStaircase(staircase, true)
    staircase = updateStaircase(staircase, true)
    
    expect(staircase.currentLevel).toBe(6)
    expect(staircase.lastDirection).toBe('up')
  })

  test('should decrease difficulty on incorrect answer', () => {
    let staircase = createStaircase(5, 1, 10, 1)
    staircase = updateStaircase(staircase, false)
    
    expect(staircase.currentLevel).toBe(4)
    expect(staircase.lastDirection).toBe('down')
  })

  test('should adapt TwinWords complexity', () => {
    const highAccuracySessions = [
      { accuracy: 0.9 },
      { accuracy: 0.85 },
      { accuracy: 0.88 }
    ]

    const complexity = adaptTwinWordsComplexity(highAccuracySessions)
    expect(complexity.useConfusableFonts).toBe(true)
  })
})

describe('Spanish Text Normalization', () => {
  test('should normalize accented characters', () => {
    expect(normalizeText('café')).toBe('cafe')
    expect(normalizeText('niño')).toBe('nino')
    expect(normalizeText('corazón')).toBe('corazon')
  })

  test('should compare texts ignoring accents', () => {
    expect(compareTexts('más', 'mas')).toBe(true)
    expect(compareTexts('CAFÉ', 'cafe')).toBe(true)
    expect(compareTexts('inglés', 'ingles')).toBe(true)
  })

  test('should match answers with normalization', () => {
    const result = matchesAnyAnswer('mas', ['más', 'menos'])
    expect(result.matches).toBe(true)
    expect(result.matchedAnswer).toBe('más')
  })

  test('should handle case sensitivity', () => {
    expect(compareTexts('CASA', 'casa')).toBe(true)
    expect(compareTexts('Mesa', 'MESA')).toBe(true)
  })
})

describe('RSVP Quiz System', () => {
  test('should calculate quiz scores correctly', () => {
    const questions = [
      { type: 'main_idea', correctAnswer: 1 },
      { type: 'factual', correctAnswer: 2 },
      { type: 'inference', correctAnswer: 0 },
      { type: 'vocabulary', correctAnswer: 1 }
    ]

    const answers = [1, 2, 0, 1] // All correct
    const result = calculateQuizScore(answers, questions)
    
    expect(result.score).toBe(1.0)
    expect(result.correct).toBe(4)
    expect(result.total).toBe(4)
  })

  test('should provide appropriate comprehension levels', () => {
    expect(getComprehensionLevel(0.95).level).toBe('Excelente')
    expect(getComprehensionLevel(0.8).level).toBe('Bueno')
    expect(getComprehensionLevel(0.65).level).toBe('Aceptable')
    expect(getComprehensionLevel(0.3).level).toBe('Deficiente')
  })

  test('should calculate partial scores', () => {
    const questions = [
      { type: 'main_idea', correctAnswer: 1 },
      { type: 'factual', correctAnswer: 2 }
    ]

    const answers = [1, 0] // One correct, one incorrect
    const result = calculateQuizScore(answers, questions)
    
    expect(result.score).toBe(0.5)
    expect(result.correct).toBe(1)
    expect(result.total).toBe(2)
  })
})

describe('Integration Tests', () => {
  test('should work with realistic session data', () => {
    const mockSession = {
      gameId: 'twin_words',
      score: 150,
      level: 3,
      accuracy: 0.85,
      durationSec: 120,
      timestamp: Date.now(),
      extras: {
        avgRT: 450,
        useAccents: true,
        timePressure: 0.8
      }
    }

    // Test that session can be processed by achievements
    const progress = {
      gameSessions: [mockSession],
      gameProgress: { twin_words: { bestLevel: 3 } }
    }

    const achievements = checkNewAchievements(progress, [])
    expect(Array.isArray(achievements)).toBe(true)
  })
})

export default {
  name: 'UX Depth Test Suite',
  description: 'Comprehensive tests for all Prompt 4 features'
}
