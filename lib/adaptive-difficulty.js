import { STAIRCASE_CONFIG, DIFFICULTY_RANGE } from './constants'

/**
 * Adaptive Difficulty System using 3-down/1-up staircase method
 * Maintains ~79% accuracy by adjusting difficulty based on performance
 */

export class AdaptiveDifficulty {
  constructor(gameType, initialLevel = 3) {
    this.gameType = gameType
    this.currentLevel = Math.max(DIFFICULTY_RANGE[0], Math.min(DIFFICULTY_RANGE[1], initialLevel))
    this.consecutiveSuccesses = 0
    this.recentTrials = [] // Recent performance window
    this.totalTrials = 0
    this.totalSuccesses = 0
  }

  /**
   * Record a trial result and potentially adjust difficulty
   * @param {boolean} success - Whether the trial was successful
   * @param {number} responseTime - Response time in ms (optional)
   * @param {Object} metadata - Additional trial data
   * @returns {Object} - { levelChanged, oldLevel, newLevel, reason }
   */
  recordTrial(success, responseTime = null, metadata = {}) {
    this.totalTrials++
    if (success) {
      this.totalSuccesses++
      this.consecutiveSuccesses++
    } else {
      this.consecutiveSuccesses = 0
    }

    // Add to recent trials window
    const trial = {
      success,
      responseTime,
      level: this.currentLevel,
      timestamp: Date.now(),
      ...metadata
    }
    
    this.recentTrials.push(trial)
    
    // Keep only recent window
    if (this.recentTrials.length > STAIRCASE_CONFIG.WINDOW_SIZE) {
      this.recentTrials.shift()
    }

    // Check for level adjustment
    const adjustment = this.checkLevelAdjustment()
    
    if (adjustment.levelChanged) {
      this.consecutiveSuccesses = 0 // Reset on level change
      
      return {
        levelChanged: true,
        oldLevel: adjustment.oldLevel,
        newLevel: this.currentLevel,
        reason: adjustment.reason,
        stats: this.getStats()
      }
    }

    return {
      levelChanged: false,
      stats: this.getStats()
    }
  }

  /**
   * Check if level should be adjusted based on staircase rules
   * @returns {Object} - { levelChanged, oldLevel, reason }
   */
  checkLevelAdjustment() {
    const oldLevel = this.currentLevel

    // 3-down rule: increase difficulty after 3 consecutive successes
    if (this.consecutiveSuccesses >= STAIRCASE_CONFIG.UP_COUNT) {
      if (this.currentLevel < DIFFICULTY_RANGE[1]) {
        this.currentLevel++
        return {
          levelChanged: true,
          oldLevel,
          reason: `3 consecutive successes - increased to level ${this.currentLevel}`
        }
      }
    }

    // 1-up rule: decrease difficulty immediately after failure
    const lastTrial = this.recentTrials[this.recentTrials.length - 1]
    if (lastTrial && !lastTrial.success) {
      if (this.currentLevel > DIFFICULTY_RANGE[0]) {
        this.currentLevel--
        return {
          levelChanged: true,
          oldLevel,
          reason: `Failure - decreased to level ${this.currentLevel}`
        }
      }
    }

    return { levelChanged: false }
  }

  /**
   * Get current performance statistics
   * @returns {Object} - Performance stats
   */
  getStats() {
    const recentAccuracy = this.recentTrials.length > 0 
      ? this.recentTrials.filter(t => t.success).length / this.recentTrials.length 
      : 0

    const overallAccuracy = this.totalTrials > 0 
      ? this.totalSuccesses / this.totalTrials 
      : 0

    const avgResponseTime = this.recentTrials
      .filter(t => t.responseTime !== null)
      .reduce((sum, t, _, arr) => sum + t.responseTime / arr.length, 0)

    return {
      currentLevel: this.currentLevel,
      totalTrials: this.totalTrials,
      totalSuccesses: this.totalSuccesses,
      consecutiveSuccesses: this.consecutiveSuccesses,
      recentAccuracy: Math.round(recentAccuracy * 100) / 100,
      overallAccuracy: Math.round(overallAccuracy * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      recentTrialsCount: this.recentTrials.length
    }
  }

  /**
   * Get game-specific parameters for current difficulty level
   * @returns {Object} - Game parameters
   */
  getGameParameters() {
    switch (this.gameType) {
      case 'shuttle':
        return this.getShuttleParameters()
      case 'twin_words':
        return this.getTwinWordsParameters()
      case 'par_impar':
        return this.getParImparParameters()
      case 'memory_digits':
        return this.getMemoryDigitsParameters()
      default:
        return {}
    }
  }

  getShuttleParameters() {
    // Level 1: 9 numbers (3x3), Level 2: 9 dispersed, etc.
    const baseNumbers = 9
    const isDispersed = this.currentLevel % 2 === 0
    const numbersCount = baseNumbers + Math.floor((this.currentLevel - 1) / 2) * 2
    const maxNumbers = Math.min(35, numbersCount)
    
    // Target time decreases with level
    const baseTargetTime = 30000 // 30 seconds for level 1
    const targetTime = Math.max(8000, baseTargetTime - (this.currentLevel - 1) * 2000)
    
    return {
      numbersCount: maxNumbers,
      layout: isDispersed ? 'dispersed' : 'grid',
      targetTime,
      hasColorDistractors: this.currentLevel >= 7,
      isDescending: this.currentLevel >= 9
    }
  }

  getTwinWordsParameters() {
    const basePairs = 8
    const pairsCount = basePairs + Math.floor((this.currentLevel - 1) / 2)
    const baseExposure = 20000 // 20 seconds for level 1
    const exposureTime = Math.max(8000, baseExposure - (this.currentLevel - 1) * 1500)
    
    return {
      pairsCount: Math.min(16, pairsCount),
      exposureTime,
      difficultyRatio: 0.5 + (this.currentLevel - 1) * 0.03, // % of different pairs
      subtletyLevel: Math.min(5, Math.ceil(this.currentLevel / 2))
    }
  }

  getParImparParameters() {
    const baseISI = 2000 // 2 seconds between stimuli for level 1
    const isi = Math.max(300, baseISI - (this.currentLevel - 1) * 150)
    
    return {
      interstimulus_interval: isi,
      hasColorDistractors: this.currentLevel >= 7,
      numberRange: this.currentLevel >= 5 ? [1, 9999] : [1, 999]
    }
  }

  getMemoryDigitsParameters() {
    const baseDigits = 3
    const digitsCount = baseDigits + Math.floor((this.currentLevel - 1) / 2)
    const baseExposure = 2000 // 2 seconds per digit for level 1  
    const exposurePerDigit = Math.max(500, baseExposure - (this.currentLevel - 1) * 100)
    
    return {
      digitsCount: Math.min(12, digitsCount),
      exposureTime: exposurePerDigit * digitsCount,
      hasDecoyDigits: this.currentLevel >= 6
    }
  }

  /**
   * Serialize state for persistence
   */
  toJSON() {
    return {
      gameType: this.gameType,
      currentLevel: this.currentLevel,
      consecutiveSuccesses: this.consecutiveSuccesses,
      totalTrials: this.totalTrials,
      totalSuccesses: this.totalSuccesses,
      recentTrials: this.recentTrials
    }
  }

  /**
   * Restore from serialized state
   */
  static fromJSON(data) {
    const instance = new AdaptiveDifficulty(data.gameType, data.currentLevel)
    instance.consecutiveSuccesses = data.consecutiveSuccesses || 0
    instance.totalTrials = data.totalTrials || 0
    instance.totalSuccesses = data.totalSuccesses || 0
    instance.recentTrials = data.recentTrials || []
    return instance
  }
}