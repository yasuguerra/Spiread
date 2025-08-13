import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Main app store
export const useAppStore = create(
  persist(
    (set, get) => ({
      // User state
      currentUser: null,
      sessionId: null,
      
      // Reading settings
      settings: {
        wpmTarget: 300,
        chunkSize: 1,
        theme: 'light',
        language: 'es',
        fontSize: 16,
        soundEnabled: true,
        showInstructions: true
      },
      
      // Reading session state
      currentSession: null,
      isReading: false,
      isPaused: false,
      currentText: '',
      currentPosition: 0,
      wpm: 250,
      
      // Progress tracking
      stats: {
        totalSessions: 0,
        totalTimeMinutes: 0,
        averageWpm: 0,
        averageComprehension: 0,
        streak: 0,
        level: 1,
        xp: 0
      },
      
      // Actions
      setUser: (user) => set({ currentUser: user }),
      setSessionId: (sessionId) => set({ sessionId }),
      
      updateSettings: (newSettings) => 
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),
      
      startReading: (text) => set({
        isReading: true,
        isPaused: false,
        currentText: text,
        currentPosition: 0
      }),
      
      pauseReading: () => set({ isPaused: true }),
      resumeReading: () => set({ isPaused: false }),
      stopReading: () => set({
        isReading: false,
        isPaused: false,
        currentPosition: 0
      }),
      
      setWpm: (wpm) => set({ wpm }),
      setPosition: (position) => set({ currentPosition: position }),
      
      updateStats: (sessionData) => 
        set((state) => {
          const newTotalSessions = state.stats.totalSessions + 1
          const newTotalTime = state.stats.totalTimeMinutes + (sessionData.durationSeconds / 60)
          const newAverageWpm = ((state.stats.averageWpm * state.stats.totalSessions) + sessionData.wpmEnd) / newTotalSessions
          const newAverageComprehension = ((state.stats.averageComprehension * state.stats.totalSessions) + sessionData.comprehensionScore) / newTotalSessions
          
          return {
            stats: {
              ...state.stats,
              totalSessions: newTotalSessions,
              totalTimeMinutes: newTotalTime,
              averageWpm: Math.round(newAverageWpm),
              averageComprehension: Math.round(newAverageComprehension),
              xp: state.stats.xp + Math.round(sessionData.wpmEnd / 10)
            }
          }
        })
    }),
    {
      name: 'campayo-spreeder-storage',
      partialize: (state) => ({
        sessionId: state.sessionId,
        settings: state.settings,
        stats: state.stats
      })
    }
  )
)

// RSVP Reader store
export const useRSVPStore = create((set, get) => ({
  // RSVP state
  isActive: false,
  words: [],
  currentIndex: 0,
  wpm: 250,
  chunkSize: 1,
  
  // Display settings
  showFixationPoint: true,
  fontSize: 24,
  fontFamily: 'system-ui',
  
  // Actions
  loadText: (text) => {
    const words = text.match(/\S+/g) || []
    set({ words, currentIndex: 0 })
  },
  
  start: () => set({ isActive: true }),
  pause: () => set({ isActive: false }),
  stop: () => set({ isActive: false, currentIndex: 0 }),
  
  setWpm: (wpm) => set({ wpm }),
  setChunkSize: (chunkSize) => set({ chunkSize }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  
  getNextChunk: () => {
    const state = get()
    const { words, currentIndex, chunkSize } = state
    
    if (currentIndex >= words.length) {
      return null
    }
    
    const chunk = words.slice(currentIndex, currentIndex + chunkSize).join(' ')
    return chunk
  },
  
  advance: () => {
    const state = get()
    const newIndex = state.currentIndex + state.chunkSize
    
    if (newIndex >= state.words.length) {
      set({ isActive: false, currentIndex: state.words.length })
      return false
    }
    
    set({ currentIndex: newIndex })
    return true
  },
  
  getProgress: () => {
    const state = get()
    return state.words.length > 0 ? (state.currentIndex / state.words.length) * 100 : 0
  }
}))

// Campayo Training store
export const useCampayoStore = create((set, get) => ({
  // Exercise state
  currentExercise: null,
  exerciseLevel: 1,
  isTraining: false,
  
  // Visual field training
  peripheralWords: [],
  fixationTarget: null,
  visualFieldWidth: 3,
  
  // Flash words
  flashWord: null,
  flashDuration: 1000,
  
  // Number grid (1-25)
  numberGrid: [],
  gridSize: 5,
  currentNumber: 1,
  gridStartTime: null,
  
  // Actions
  startExercise: (exerciseType) => set({
    currentExercise: exerciseType,
    isTraining: true
  }),
  
  stopExercise: () => set({
    currentExercise: null,
    isTraining: false,
    flashWord: null,
    gridStartTime: null
  }),
  
  setVisualFieldWidth: (width) => set({ visualFieldWidth: width }),
  
  generateNumberGrid: () => {
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1)
    // Shuffle array
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]]
    }
    
    const grid = []
    for (let i = 0; i < 5; i++) {
      grid.push(numbers.slice(i * 5, (i + 1) * 5))
    }
    
    set({
      numberGrid: grid,
      currentNumber: 1,
      gridStartTime: Date.now()
    })
  },
  
  flashWord: (word, duration = 1000) => {
    set({ flashWord: word })
    setTimeout(() => {
      set({ flashWord: null })
    }, duration)
  }
}))