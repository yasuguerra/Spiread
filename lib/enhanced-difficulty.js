// Enhanced Adaptive Difficulty System for Sprint Juegos
// Implements precise staircase algorithms for each game type

export class EnhancedAdaptiveDifficulty {
  constructor(gameType, initialLevel = 1) {
    this.gameType = gameType
    this.currentLevel = Math.max(1, Math.min(20, initialLevel))
    this.consecutiveCorrect = 0
    this.recentTrials = []
    this.maxTrials = 10 // Keep recent trials for RT calculations
    
    // Game-specific configurations
    this.config = this.getGameConfig(gameType)
  }

  getGameConfig(gameType) {
    const configs = {
      memory_digits: {
        maxLevel: 20,
        staircase: { down: 3, up: 1 }, // 3-down/1-up
        getLevelParams: (level) => {
          const digitsMap = {
            1: 3, 2: 3, 3: 4, 4: 4, 5: 5, 6: 5, 7: 6, 8: 6, 9: 7, 10: 7,
            11: 8, 12: 8, 13: 9, 14: 9, 15: 10, 16: 10, 17: 11, 18: 11, 19: 12, 20: 12
          }
          const digitsLen = digitsMap[level] || 3
          const goalRt = 3500 + 200 * (digitsLen - 3) // 3.5s + 0.2s per extra digit
          return { digitsLen, goalRt }
        }
      },
      
      schulte: {
        maxLevel: 20,
        staircase: { down: 2, up: 1 }, // 2-down/1-up (faster progression)
        getLevelParams: (level) => {
          const levelConfigs = [
            // Level 1-10: Basic progression
            { n: 9, layout: 'grid', hasGuide: true, targetTime: 15000 }, // 1: 3×3
            { n: 9, layout: 'dispersed', hasGuide: true, targetTime: 16000 }, // 2: 9 dispersed
            { n: 16, layout: 'grid', hasGuide: true, targetTime: 20000 }, // 3: 4×4
            { n: 16, layout: 'dispersed', hasGuide: true, targetTime: 22000 }, // 4: 16 dispersed
            { n: 25, layout: 'grid', hasGuide: true, targetTime: 25000 }, // 5: 5×5
            { n: 25, layout: 'dispersed', hasGuide: false, targetTime: 28000 }, // 6: 25 dispersed (no guide)
            { n: 36, layout: 'grid', hasGuide: false, targetTime: 30000 }, // 7: 6×6
            { n: 36, layout: 'dispersed', hasGuide: false, targetTime: 33000 }, // 8: 36 dispersed
            { n: 49, layout: 'grid', hasGuide: false, targetTime: 35000 }, // 9: 7×7
            { n: 49, layout: 'dispersed', hasGuide: false, targetTime: 38000 }, // 10: 49 dispersed
            
            // Level 11-14: Letters and descending
            { n: 25, layout: 'grid', hasGuide: false, targetTime: 28000, mode: 'letters' }, // 11: letters 5×5
            { n: 25, layout: 'dispersed', hasGuide: false, targetTime: 30000, mode: 'letters', hasStroop: true }, // 12: letters + Stroop
            { n: 25, layout: 'grid', hasGuide: false, targetTime: 28000, mode: 'descending' }, // 13: descending 5×5
            { n: 36, layout: 'grid', hasGuide: false, targetTime: 32000, mode: 'descending' }, // 14: descending 6×6
            
            // Level 15-20: Advanced with distractors
            { n: 49, layout: 'grid', hasGuide: false, targetTime: 35000, hasDistractors: true, mode: 'multiples' }, // 15: 7×7 multiples of 3
            { n: 49, layout: 'dispersed', hasGuide: false, targetTime: 38000, hasDistractors: true, mode: 'multiples' }, // 16
            { n: 49, layout: 'grid', hasGuide: false, targetTime: 33000, hasDistractors: true, mode: 'primes' }, // 17
            { n: 49, layout: 'dispersed', hasGuide: false, targetTime: 36000, hasDistractors: true, mode: 'primes' }, // 18
            { n: 49, layout: 'grid', hasGuide: false, targetTime: 30000, hasDistractors: true, mode: 'fibonacci' }, // 19
            { n: 49, layout: 'dispersed', hasGuide: false, targetTime: 33000, hasDistractors: true, mode: 'fibonacci' } // 20
          ]
          return levelConfigs[level - 1] || levelConfigs[0]
        }
      },
      
      par_impar: {
        maxLevel: 20,
        staircase: { down: 3, up: 1 }, // 3-down/1-up
        getLevelParams: (level) => {
          const k = Math.min(20, 8 + Math.floor((level - 1) / 2)) // 8→20 numbers
          const digitsLen = Math.min(6, 3 + Math.floor((level - 1) / 5)) // 3→6 digits
          const exposureTotal = Math.max(4000, 12000 - (level - 1) * 400) // 12s→4s
          const goalRt = Math.max(600, 900 - Math.floor((level - 1) / 3) * 50) // 900ms decreasing
          const hasDistractors = level > 15
          return { k, digitsLen, exposureTotal, goalRt, hasDistractors }
        }
      }
    }
    
    return configs[gameType] || configs.memory_digits
  }

  recordTrial(success, responseTime = null, metadata = {}) {
    const trial = {
      success,
      responseTime,
      metadata,
      timestamp: Date.now(),
      level: this.currentLevel
    }
    
    this.recentTrials.push(trial)
    if (this.recentTrials.length > this.maxTrials) {
      this.recentTrials.shift()
    }

    const oldLevel = this.currentLevel
    let levelChanged = false
    let reason = ''

    // Game-specific staircase logic
    if (this.gameType === 'memory_digits') {
      levelChanged = this.handleMemoryDigitsStaircase(trial)
    } else if (this.gameType === 'schulte') {
      levelChanged = this.handleSchulteStaircase(trial)
    } else if (this.gameType === 'par_impar') {
      levelChanged = this.handleParImparStaircase(trial)
    }

    if (levelChanged) {
      reason = this.currentLevel > oldLevel ? 'Performance improved' : 'Performance declined'
      this.consecutiveCorrect = 0 // Reset on level change
    }

    return {
      success,
      oldLevel,
      newLevel: this.currentLevel,
      levelChanged,
      reason,
      consecutiveCorrect: this.consecutiveCorrect
    }
  }

  handleMemoryDigitsStaircase(trial) {
    const params = this.config.getLevelParams(this.currentLevel)
    
    if (trial.success) {
      this.consecutiveCorrect++
      
      // Check for level up: 3 consecutive correct AND mean RT ≤ goal_rt
      if (this.consecutiveCorrect >= 3) {
        const recentCorrect = this.recentTrials.filter(t => t.success).slice(-3)
        if (recentCorrect.length >= 3) {
          const meanRt = recentCorrect.reduce((sum, t) => sum + (t.responseTime || 0), 0) / recentCorrect.length
          if (meanRt <= params.goalRt && this.currentLevel < this.config.maxLevel) {
            this.currentLevel++
            this.consecutiveCorrect = 0
            return true
          }
        }
      }
    } else {
      // Level down on failure
      this.consecutiveCorrect = 0
      if (this.currentLevel > 1) {
        this.currentLevel--
        return true
      }
    }

    // Also check RT performance for level down
    if (trial.responseTime && trial.responseTime > params.goalRt * 1.25) {
      this.consecutiveCorrect = 0
      if (this.currentLevel > 1) {
        this.currentLevel--
        return true
      }
    }

    return false
  }

  handleSchulteStaircase(trial) {
    const params = this.config.getLevelParams(this.currentLevel)
    
    if (trial.success) {
      this.consecutiveCorrect++
      
      // 2-down/1-up: level up after 2 consecutive successes within target time
      if (this.consecutiveCorrect >= 2) {
        if (trial.responseTime && trial.responseTime <= params.targetTime && this.currentLevel < this.config.maxLevel) {
          this.currentLevel++
          this.consecutiveCorrect = 0
          return true
        }
      }
    } else {
      // Level down on failure or excessive time
      this.consecutiveCorrect = 0
      if (this.currentLevel > 1) {
        this.currentLevel--
        return true
      }
    }

    // Level down if time exceeded significantly
    if (trial.responseTime && trial.responseTime > params.targetTime * 1.5) {
      this.consecutiveCorrect = 0
      if (this.currentLevel > 1) {
        this.currentLevel--
        return true
      }
    }

    return false
  }

  handleParImparStaircase(trial) {
    const params = this.config.getLevelParams(this.currentLevel)
    const { accuracy = 0, meanRt = 0 } = trial.metadata
    
    if (trial.success && accuracy >= 0.85) {
      this.consecutiveCorrect++
      
      // Level up: 3 consecutive with ≥85% accuracy AND mean RT ≤ goal_rt
      if (this.consecutiveCorrect >= 3) {
        if (meanRt <= params.goalRt && this.currentLevel < this.config.maxLevel) {
          this.currentLevel++
          this.consecutiveCorrect = 0
          return true
        }
      }
    } else {
      // Level down: accuracy < 65% OR mean RT > 1.25× goal_rt
      if (accuracy < 0.65 || meanRt > params.goalRt * 1.25) {
        this.consecutiveCorrect = 0
        if (this.currentLevel > 1) {
          this.currentLevel--
          return true
        }
      }
    }

    return false
  }

  getGameParameters() {
    return this.config.getLevelParams(this.currentLevel)
  }

  getCurrentLevel() {
    return this.currentLevel
  }

  setLevel(level) {
    this.currentLevel = Math.max(1, Math.min(this.config.maxLevel, level))
    this.consecutiveCorrect = 0
    this.recentTrials = []
  }

  getStats() {
    const recentSuccessRate = this.recentTrials.length > 0 
      ? this.recentTrials.filter(t => t.success).length / this.recentTrials.length 
      : 0
    
    const recentRt = this.recentTrials
      .filter(t => t.responseTime)
      .map(t => t.responseTime)
    
    const meanRt = recentRt.length > 0 
      ? recentRt.reduce((sum, rt) => sum + rt, 0) / recentRt.length 
      : 0

    return {
      currentLevel: this.currentLevel,
      consecutiveCorrect: this.consecutiveCorrect,
      recentTrials: this.recentTrials.length,
      successRate: recentSuccessRate,
      meanResponseTime: meanRt,
      gameParameters: this.getGameParameters()
    }
  }
}