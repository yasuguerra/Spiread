// Universal Level Progression System for Spiread Games
// Handles level advancement logic, difficulty scaling, and progress persistence

import { setLastLevel, getLastLevel } from './progress-tracking'

// Level progression configurations for each game
export const GAME_LEVEL_CONFIGS = {
  schulte: {
    maxLevel: 10,
    eyeGuideDisableLevel: 5,
    levelUpConditions: {
      minAccuracy: 0.8,
      minCompletionRate: 0.6,
      minTablesCompleted: 1
    },
    levelDownConditions: {
      maxAccuracy: 0.5,
      maxCompletionRate: 0.3
    }
  },
  twinwords: {
    maxLevel: 8,
    eyeGuideDisableLevel: 4,
    // FUTURE FEATURE: Continuous Flow Mode could be enabled at level 8+
    // continuousFlowLevel: 8, // Level where pairs regenerate immediately
    levelUpConditions: {
      minAccuracy: 0.85,
      minScore: 100
    },
    levelDownConditions: {
      maxAccuracy: 0.6,
      maxScore: 50
    }
  },
  parimpar: {
    maxLevel: 12,
    eyeGuideDisableLevel: 6,
    levelUpConditions: {
      minAccuracy: 0.9,
      minCorrectInRow: 10
    },
    levelDownConditions: {
      maxAccuracy: 0.7,
      maxCorrectInRow: 5
    }
  },
  memorydigits: {
    maxLevel: 15,
    eyeGuideDisableLevel: 8,
    levelUpConditions: {
      minAccuracy: 0.8,
      minSequenceLength: 5
    },
    levelDownConditions: {
      maxAccuracy: 0.6,
      maxSequenceLength: 3
    }
  }
}

/**
 * Calculate new level based on game performance
 * @param {string} gameKey - Game identifier (e.g., 'schulte', 'twinwords')
 * @param {number} currentLevel - Current player level
 * @param {Object} performance - Performance metrics
 * @returns {Object} - { newLevel, levelChanged, direction }
 */
export function calculateLevelProgression(gameKey, currentLevel, performance) {
  const config = GAME_LEVEL_CONFIGS[gameKey]
  
  if (!config) {
    console.warn(`No level config found for game: ${gameKey}`)
    return { newLevel: currentLevel, levelChanged: false, direction: 'none' }
  }

  const { maxLevel, levelUpConditions, levelDownConditions } = config
  let newLevel = currentLevel
  let direction = 'none'

  // Check for level up
  if (shouldLevelUp(performance, levelUpConditions) && currentLevel < maxLevel) {
    newLevel = Math.min(currentLevel + 1, maxLevel)
    direction = 'up'
  }
  // Check for level down
  else if (shouldLevelDown(performance, levelDownConditions) && currentLevel > 1) {
    newLevel = Math.max(currentLevel - 1, 1)
    direction = 'down'
  }

  const levelChanged = newLevel !== currentLevel

  // Save the new level if it changed
  if (levelChanged) {
    setLastLevel(gameKey, newLevel)
    console.log(`Level progression: ${gameKey} ${currentLevel} -> ${newLevel} (${direction})`)
  }

  return {
    newLevel,
    levelChanged,
    direction,
    previousLevel: currentLevel
  }
}

/**
 * Check if player should level up
 */
function shouldLevelUp(performance, conditions) {
  // Check all required conditions
  for (const [key, threshold] of Object.entries(conditions)) {
    const performanceKey = key.replace('min', '').toLowerCase()
    const actualValue = performance[performanceKey] || performance[key.replace('min', '')]
    
    if (actualValue === undefined || actualValue < threshold) {
      return false
    }
  }
  return true
}

/**
 * Check if player should level down
 */
function shouldLevelDown(performance, conditions) {
  // Check if any condition triggers level down
  for (const [key, threshold] of Object.entries(conditions)) {
    const performanceKey = key.replace('max', '').toLowerCase()
    const actualValue = performance[performanceKey] || performance[key.replace('max', '')]
    
    if (actualValue !== undefined && actualValue <= threshold) {
      return true
    }
  }
  return false
}

/**
 * Get eye guide configuration for a game level
 * @param {string} gameKey - Game identifier
 * @param {number} level - Current level
 * @returns {Object} - Eye guide configuration
 */
export function getEyeGuideConfig(gameKey, level) {
  const config = GAME_LEVEL_CONFIGS[gameKey]
  
  if (!config) {
    return { enabled: true, type: 'full' }
  }

  const { eyeGuideDisableLevel } = config
  
  if (level >= eyeGuideDisableLevel) {
    return { enabled: false, type: 'none' }
  } else if (level >= Math.floor(eyeGuideDisableLevel * 0.7)) {
    return { enabled: true, type: 'minimal' }
  } else {
    return { enabled: true, type: 'full' }
  }
}

/**
 * Get level display information
 * @param {string} gameKey - Game identifier
 * @param {number} level - Current level
 * @returns {Object} - Display information
 */
export function getLevelDisplayInfo(gameKey, level) {
  const config = GAME_LEVEL_CONFIGS[gameKey]
  const eyeGuide = getEyeGuideConfig(gameKey, level)
  
  if (!config) {
    return {
      level,
      maxLevel: 10,
      progress: (level / 10) * 100,
      eyeGuideStatus: 'enabled',
      description: `Nivel ${level}`
    }
  }

  const { maxLevel, eyeGuideDisableLevel } = config
  const progress = (level / maxLevel) * 100
  
  let eyeGuideStatus = 'enabled'
  let description = `Nivel ${level} de ${maxLevel}`
  
  if (level >= eyeGuideDisableLevel) {
    eyeGuideStatus = 'disabled'
    description += ' (Modo Experto)'
  } else if (level >= Math.floor(eyeGuideDisableLevel * 0.7)) {
    eyeGuideStatus = 'minimal'
    description += ' (Guía Mínima)'
  } else {
    description += ' (Guía Completa)'
  }

  return {
    level,
    maxLevel,
    progress,
    eyeGuideStatus,
    description,
    eyeGuideConfig: eyeGuide
  }
}

/**
 * Initialize level for a game (used when starting a game)
 * @param {string} gameKey - Game identifier
 * @returns {number} - Initial level
 */
export function initializeGameLevel(gameKey) {
  const savedLevel = getLastLevel(gameKey)
  const config = GAME_LEVEL_CONFIGS[gameKey]
  
  if (config && savedLevel > config.maxLevel) {
    // Clamp to max level if saved level is too high
    setLastLevel(gameKey, config.maxLevel)
    return config.maxLevel
  }
  
  return savedLevel
}

export default {
  calculateLevelProgression,
  getEyeGuideConfig,
  getLevelDisplayInfo,
  initializeGameLevel,
  GAME_LEVEL_CONFIGS
}
