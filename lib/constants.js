// App Constants
export const APP_NAME = "Spiread"
export const APP_DESCRIPTION = "Potencia tu velocidad de lectura y entrenamiento cerebral"

// Game Types
export const GAME_TYPES = {
  SHUTTLE: 'shuttle',
  TWIN_WORDS: 'twin_words', 
  PAR_IMPAR: 'par_impar',
  MEMORY_DIGITS: 'memory_digits'
}

// Session Templates
export const SESSION_TEMPLATES = {
  SHORT: '15min',
  MEDIUM: '30min', 
  LONG: '60min'
}

// Game States
export const GAME_STATES = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused',
  SUMMARY: 'summary'
}

// Feature Flags
export const FEATURE_FLAGS = {
  AI_ENABLED: false,
  STRIPE_ENABLED: false,
  PWA_ENABLED: false
}

// Difficulty Levels
export const DIFFICULTY_RANGE = [1, 10]

// Staircase Parameters (3-down/1-up for ~79% accuracy)
export const STAIRCASE_CONFIG = {
  UP_COUNT: 3,      // Consecutive successes needed to increase difficulty
  DOWN_COUNT: 1,    // Failures needed to decrease difficulty
  TARGET_ACCURACY: 0.79,
  WINDOW_SIZE: 10   // Recent trials to consider for adaptation
}

// Auto-pause settings
export const AUTO_PAUSE_DELAY = 2000 // 2 seconds