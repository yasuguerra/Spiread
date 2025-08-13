// Game types and interfaces
export const GAME_TYPES = {
  ACCELERATOR: 'accelerator',
  SCHULTE: 'schulte',
  TWIN_WORDS: 'twin_words',
  PAR_IMPAR: 'par_impar',
  WORD_RACE: 'word_race'
}

export const SESSION_TEMPLATES = {
  SHORT: '15min',
  MEDIUM: '30min',
  LONG: '60min'
}

// Text processing utilities
export const normalizeText = (text) => {
  // Remove extra whitespace and normalize
  let normalized = text.replace(/\s+/g, ' ').trim()
  
  // Join hyphenated words at line breaks
  normalized = normalized.replace(/-\s+/g, '')
  
  // Preserve abbreviations
  const abbreviations = ['Sr.', 'Sra.', 'Dr.', 'Dra.', 'Ing.', 'Prof.', 'p.ej.', 'etc.']
  abbreviations.forEach(abbr => {
    const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    normalized = normalized.replace(new RegExp(escaped, 'g'), abbr.replace('.', '<!DOT!>'))
  })
  
  return normalized
}

// Tokenize text into words
export const tokenizeText = (text) => {
  const normalized = normalizeText(text)
  
  // Use simple regex for word tokenization
  const words = normalized.match(/[\w\u00C0-\u017F]+(?:[''-][\w\u00C0-\u017F]+)?|\d+|[^\s\w\d]/g) || []
  return words.map(word => word.replace(/<!DOT!>/g, '.'))
}

// Create chunks avoiding sentence breaks
export const createChunks = (words, chunkSize) => {
  const chunks = []
  let currentChunk = []
  
  for (let i = 0; i < words.length; i++) {
    currentChunk.push(words[i])
    
    const word = words[i]
    const isEndOfSentence = /[.!?…:]$/.test(word)
    const chunkFull = currentChunk.length >= chunkSize
    
    if (chunkFull || isEndOfSentence || i === words.length - 1) {
      chunks.push([...currentChunk])
      currentChunk = []
    }
  }
  
  return chunks
}

// Calculate difficulty-based parameters
export const getDifficultyParams = (game, level) => {
  switch (game) {
    case GAME_TYPES.SCHULTE:
      if (level <= 2) return { gridSize: 3 }
      if (level <= 4) return { gridSize: 4 }
      if (level <= 6) return { gridSize: 5 }
      if (level <= 8) return { gridSize: 6 }
      return { gridSize: 7 }
    
    case GAME_TYPES.TWIN_WORDS:
      const baseExposure = 1500
      const exposureMs = Math.max(500, baseExposure - (level - 1) * 100)
      return { 
        exposureMs,
        wordLength: Math.min(3 + Math.floor(level / 2), 12),
        subtlety: Math.min(level, 5)
      }
    
    default:
      return {}
  }
}

// Score calculation functions
export const calculateAcceleratorScore = (metrics) => {
  const { quiz_score = 0, pauses = 0, regressions = 0, duration_ms = 0 } = metrics
  
  // Efficiency based on pauses and regressions
  const maxActions = Math.max(1, Math.ceil(duration_ms / 10000)) // Expected actions per 10s
  const totalActions = pauses + regressions
  const efficiency = Math.max(0, 1 - (totalActions / maxActions))
  
  // Combined score: 70% comprehension, 30% efficiency
  const score = Math.round(0.7 * quiz_score + 0.3 * (efficiency * 100))
  return Math.max(0, Math.min(100, score))
}

export const calculateSchulteScore = (metrics) => {
  const { grid, total_time_ms = 0, mistakes = 0 } = metrics
  const gridSize = parseInt(grid.split('x')[0]) || 3
  
  // Expected time based on grid size (in ms)
  const expectedTimes = { 3: 15000, 4: 25000, 5: 40000, 6: 60000, 7: 90000 }
  const expectedTime = expectedTimes[gridSize] || 30000
  
  // Normalize time score (faster is better)
  const timeScore = Math.max(0, 100 - ((total_time_ms - expectedTime) / expectedTime) * 50)
  
  // Penalty for mistakes
  const mistakePenalty = mistakes * 10
  
  const score = Math.round(timeScore - mistakePenalty)
  return Math.max(0, Math.min(100, score))
}

export const calculateTwinWordsScore = (metrics) => {
  const { correct = 0, wrong = 0, mean_rt_ms = 1000 } = metrics
  const total = correct + wrong
  
  if (total === 0) return 0
  
  const accuracy = correct / total
  const reactionPenalty = Math.max(0, (mean_rt_ms - 800) * 0.02) // Penalty for slow reactions
  
  const score = Math.round(100 * accuracy - reactionPenalty)
  return Math.max(0, Math.min(100, score))
}

// Adaptive difficulty adjustment
export const adjustDifficulty = (currentLevel, score) => {
  if (score >= 80) {
    return Math.min(10, currentLevel + 1)
  } else if (score < 60) {
    return Math.max(1, currentLevel - 1)
  }
  return currentLevel
}

// Session templates
export const getSessionTemplate = (template) => {
  const templates = {
    [SESSION_TEMPLATES.SHORT]: [
      { game: GAME_TYPES.PAR_IMPAR, duration: 2 * 60 * 1000 },
      { game: GAME_TYPES.ACCELERATOR, duration: 5 * 60 * 1000 },
      { game: GAME_TYPES.TWIN_WORDS, duration: 4 * 60 * 1000 },
      { game: GAME_TYPES.SCHULTE, duration: 4 * 60 * 1000 }
    ],
    [SESSION_TEMPLATES.MEDIUM]: [
      { game: GAME_TYPES.PAR_IMPAR, duration: 3 * 60 * 1000 },
      { game: GAME_TYPES.ACCELERATOR, duration: 10 * 60 * 1000 },
      { game: GAME_TYPES.WORD_RACE, duration: 7 * 60 * 1000 },
      { game: GAME_TYPES.TWIN_WORDS, duration: 5 * 60 * 1000 },
      { game: GAME_TYPES.SCHULTE, duration: 5 * 60 * 1000 }
    ],
    [SESSION_TEMPLATES.LONG]: [
      { game: GAME_TYPES.PAR_IMPAR, duration: 5 * 60 * 1000 },
      { game: GAME_TYPES.ACCELERATOR, duration: 20 * 60 * 1000 },
      { game: GAME_TYPES.WORD_RACE, duration: 10 * 60 * 1000 },
      { game: GAME_TYPES.TWIN_WORDS, duration: 10 * 60 * 1000 },
      { game: GAME_TYPES.SCHULTE, duration: 10 * 60 * 1000 },
      { game: 'cooldown', duration: 5 * 60 * 1000 }
    ]
  }
  
  return templates[template] || templates[SESSION_TEMPLATES.SHORT]
}