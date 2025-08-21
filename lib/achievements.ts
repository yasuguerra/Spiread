import { GAME_IDS } from './progress-tracking'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: 'speed' | 'accuracy' | 'endurance' | 'mastery' | 'exploration'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  condition: (progress: any) => boolean
}

export const ACHIEVEMENTS: Badge[] = [
  // Speed Category
  {
    id: 'speed_demon',
    name: 'Demonio de Velocidad',
    description: 'Completa 10 juegos en menos de 30 segundos promedio',
    icon: '⚡',
    category: 'speed',
    rarity: 'rare',
    condition: (progress) => {
      const sessions = progress.gameSessions || []
      const fastSessions = sessions.filter((s: any) => s.durationSec <= 30)
      return fastSessions.length >= 10
    }
  },
  {
    id: 'lightning_reflexes',
    name: 'Reflejos Relámpago',
    description: 'Tiempo de reacción promedio < 400ms en Par/Impar',
    icon: '⚡',
    category: 'speed',
    rarity: 'epic',
    condition: (progress) => {
      const sessions = progress.gameSessions?.filter((s: any) => s.gameId === GAME_IDS.PAR_IMPAR) || []
      if (sessions.length === 0) return false
      const avgRT = sessions.reduce((sum: number, s: any) => sum + (s.extras?.avgRT || 1000), 0) / sessions.length
      return avgRT < 400
    }
  },

  // Accuracy Category
  {
    id: 'perfectionist',
    name: 'Perfeccionista',
    description: 'Logra 100% precisión en 5 sesiones consecutivas',
    icon: '🎯',
    category: 'accuracy',
    rarity: 'epic',
    condition: (progress) => {
      const sessions = progress.gameSessions || []
      let consecutivePerfect = 0
      let maxConsecutive = 0
      
      for (const session of sessions.slice().reverse()) {
        if (session.accuracy >= 1.0) {
          consecutivePerfect++
          maxConsecutive = Math.max(maxConsecutive, consecutivePerfect)
        } else {
          consecutivePerfect = 0
        }
      }
      
      return maxConsecutive >= 5
    }
  },
  {
    id: 'sharpshooter',
    name: 'Tirador Certero',
    description: 'Promedio de 95%+ precisión en todos los juegos',
    icon: '🏹',
    category: 'accuracy',
    rarity: 'rare',
    condition: (progress) => {
      const sessions = progress.gameSessions || []
      if (sessions.length < 10) return false
      
      const avgAccuracy = sessions.reduce((sum: number, s: any) => sum + (s.accuracy || 0), 0) / sessions.length
      return avgAccuracy >= 0.95
    }
  },

  // Endurance Category
  {
    id: 'marathon_runner',
    name: 'Corredor de Maratón',
    description: 'Juega 100 sesiones totales',
    icon: '🏃',
    category: 'endurance',
    rarity: 'common',
    condition: (progress) => {
      const sessions = progress.gameSessions || []
      return sessions.length >= 100
    }
  },
  {
    id: 'iron_mind',
    name: 'Mente de Hierro',
    description: 'Completa 50 sesiones de entrenamiento sin parar',
    icon: '🧠',
    category: 'endurance',
    rarity: 'legendary',
    condition: (progress) => {
      const sessions = progress.gameSessions || []
      return sessions.length >= 50 && sessions.every((s: any) => s.score > 0)
    }
  },

  // Mastery Category
  {
    id: 'digit_master_100',
    name: 'Maestro de Dígitos 100',
    description: 'Memoriza secuencias de 7+ dígitos en Memory Digits',
    icon: '🔢',
    category: 'mastery',
    rarity: 'epic',
    condition: (progress) => {
      const sessions = progress.gameSessions?.filter((s: any) => s.gameId === GAME_IDS.MEMORY_DIGITS) || []
      return sessions.some((s: any) => (s.extras?.maxSequenceLength || 0) >= 7)
    }
  },
  {
    id: 'word_hunter_50',
    name: 'Cazador de Palabras 50',
    description: 'Encuentra 50+ palabras en una sesión de Word Search',
    icon: '🔍',
    category: 'mastery',
    rarity: 'rare',
    condition: (progress) => {
      const sessions = progress.gameSessions?.filter((s: any) => s.gameId === GAME_IDS.WORD_SEARCH) || []
      return sessions.some((s: any) => (s.extras?.totalWordsFound || 0) >= 50)
    }
  },
  {
    id: 'speed_reader',
    name: 'Lector Veloz',
    description: 'Lee a 600+ WPM en RSVP con 80%+ comprensión',
    icon: '📚',
    category: 'mastery',
    rarity: 'legendary',
    condition: (progress) => {
      const sessions = progress.gameSessions?.filter((s: any) => s.gameId === GAME_IDS.RSVP_READER) || []
      return sessions.some((s: any) => 
        (s.extras?.wpm || 0) >= 600 && (s.extras?.comprehensionScore || 0) >= 0.8
      )
    }
  },

  // Exploration Category
  {
    id: 'game_explorer',
    name: 'Explorador de Juegos',
    description: 'Juega todos los tipos de juegos disponibles',
    icon: '🗺️',
    category: 'exploration',
    rarity: 'common',
    condition: (progress) => {
      const sessions = progress.gameSessions || []
      const gameIds = new Set(sessions.map((s: any) => s.gameId))
      const allGameIds = Object.values(GAME_IDS)
      return allGameIds.every(id => gameIds.has(id))
    }
  },
  {
    id: 'level_climber',
    name: 'Escalador de Niveles',
    description: 'Alcanza nivel 10+ en cualquier juego',
    icon: '🏔️',
    category: 'exploration',
    rarity: 'rare',
    condition: (progress) => {
      const gameProgress = progress.gameProgress || {}
      return Object.values(gameProgress).some((game: any) => game.bestLevel >= 10)
    }
  },
  {
    id: 'streak_master',
    name: 'Maestro de Rachas',
    description: 'Mantén una racha de 7 días consecutivos',
    icon: '🔥',
    category: 'exploration',
    rarity: 'epic',
    condition: (progress) => {
      const sessions = progress.gameSessions || []
      if (sessions.length === 0) return false
      
      // Group sessions by day
      const dayGroups = new Map()
      sessions.forEach((s: any) => {
        const day = new Date(s.timestamp).toDateString()
        dayGroups.set(day, true)
      })
      
      // Check for 7 consecutive days
      const sortedDays = Array.from(dayGroups.keys()).sort()
      let streak = 1
      let maxStreak = 1
      
      for (let i = 1; i < sortedDays.length; i++) {
        const prevDate = new Date(sortedDays[i - 1])
        const currDate = new Date(sortedDays[i])
        const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        
        if (diffDays === 1) {
          streak++
          maxStreak = Math.max(maxStreak, streak)
        } else {
          streak = 1
        }
      }
      
      return maxStreak >= 7
    }
  }
]

export function checkNewAchievements(progress: any, previousAchievements: string[] = []): Badge[] {
  const newAchievements: Badge[] = []
  
  for (const badge of ACHIEVEMENTS) {
    if (!previousAchievements.includes(badge.id) && badge.condition(progress)) {
      newAchievements.push(badge)
    }
  }
  
  return newAchievements
}

export function getAchievementProgress(badge: Badge, progress: any): number {
  // Return progress percentage (0-1) for achievements that can be partially completed
  switch (badge.id) {
    case 'marathon_runner': {
      const sessions = progress.gameSessions || []
      return Math.min(sessions.length / 100, 1)
    }
    case 'iron_mind': {
      const sessions = progress.gameSessions || []
      return Math.min(sessions.length / 50, 1)
    }
    case 'perfectionist': {
      const sessions = progress.gameSessions || []
      let consecutivePerfect = 0
      let maxConsecutive = 0
      
      for (const session of sessions.slice().reverse()) {
        if (session.accuracy >= 1.0) {
          consecutivePerfect++
          maxConsecutive = Math.max(maxConsecutive, consecutivePerfect)
        } else {
          consecutivePerfect = 0
        }
      }
      
      return Math.min(maxConsecutive / 5, 1)
    }
    case 'streak_master': {
      const sessions = progress.gameSessions || []
      if (sessions.length === 0) return 0
      
      const dayGroups = new Map()
      sessions.forEach((s: any) => {
        const day = new Date(s.timestamp).toDateString()
        dayGroups.set(day, true)
      })
      
      const sortedDays = Array.from(dayGroups.keys()).sort()
      let streak = 1
      let maxStreak = 1
      
      for (let i = 1; i < sortedDays.length; i++) {
        const prevDate = new Date(sortedDays[i - 1])
        const currDate = new Date(sortedDays[i])
        const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        
        if (diffDays === 1) {
          streak++
          maxStreak = Math.max(maxStreak, streak)
        } else {
          streak = 1
        }
      }
      
      return Math.min(maxStreak / 7, 1)
    }
    default:
      return badge.condition(progress) ? 1 : 0
  }
}

export function getRarityColor(rarity: Badge['rarity']): string {
  switch (rarity) {
    case 'common': return 'text-gray-600 bg-gray-100'
    case 'rare': return 'text-blue-600 bg-blue-100'
    case 'epic': return 'text-purple-600 bg-purple-100'
    case 'legendary': return 'text-yellow-600 bg-yellow-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

export function getCategoryIcon(category: Badge['category']): string {
  switch (category) {
    case 'speed': return '⚡'
    case 'accuracy': return '🎯'
    case 'endurance': return '🏃'
    case 'mastery': return '👑'
    case 'exploration': return '🗺️'
    default: return '🏆'
  }
}
