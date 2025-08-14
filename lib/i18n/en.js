// English (EN) translations
export const en = {
  // Common
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    close: 'Close',
    next: 'Next',
    previous: 'Previous',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    stop: 'Stop',
    exit: 'Exit',
    skip: 'Skip',
    finish: 'Finish',
    level: 'Level',
    score: 'Score',
    time: 'Time',
    duration: 'Duration',
    progress: 'Progress'
  },

  // Navigation
  nav: {
    reader: 'RSVP',
    training: 'Training',
    sessions: 'Sessions',
    stats: 'Stats',
    settings: 'Settings'
  },

  // Onboarding
  onboarding: {
    welcome: 'Welcome to Spiread - Speed up your reading, improve your comprehension!',
    subtitle: 'Before starting your training, let\'s measure your current reading speed.',
    description: 'This test will help us personalize your training program.',
    speedTest: 'Speed Test',
    comprehensionTest: 'Comprehension Test',
    personalizedPlan: 'Personalized Plan',
    speedTestDuration: '2-3 minutes',
    comprehensionQuestions: '2 questions',
    basedOnResults: 'Based on results',
    startTest: 'Start Test',
    startReading: 'Start Reading',
    finished: 'Finished',
    continue: 'Continue'
  },

  // RSVP Reader
  reader: {
    title: 'RSVP Reader',
    wpm: 'WPM',
    wordsPerMinute: 'Words per minute',
    chunkSize: 'Chunk size',
    mode: 'Mode',
    import: 'Import',
    export: 'Export',
    pasteText: 'Paste text here...',
    or: 'or',
    uploadFile: 'Upload file',
    reading: 'Reading...',
    paused: 'Paused',
    completed: 'Completed',
    progress: 'Progress',
    timeElapsed: 'Time elapsed',
    estimatedTime: 'Estimated time',
    wordsRead: 'Words read',
    totalWords: 'Total words',
    comprehension: 'Comprehension',
    generateQuestions: 'Generate Questions',
    aiTools: 'AI Tools'
  },

  // Games
  games: {
    // Common
    playFor60s: 'Play 60s',
    currentLevel: 'Current Level',
    bestScore: 'Best Score',
    difficulty: 'Difficulty',
    adaptive: 'Adaptive',
    sessions: 'Sessions',
    accuracy: 'Accuracy',
    timeRemaining: 'Time remaining',
    gameComplete: 'Time completed!',
    finalScore: 'Final score',
    preparing: 'Preparing game...',

    // Specific games
    runningWords: {
      title: 'Running Words',
      description: 'Memorize words in 5-line sequence',
      question: 'What was the last word of line',
      wordsPerLine: 'words/line',
      rounds: 'Rounds'
    },
    lettersGrid: {
      title: 'Letters Grid',
      description: 'Find target letters in the grid',
      search: 'Search',
      clickAll: 'Click all target letters',
      selected: 'Selected',
      targets: 'targets',
      withConfusables: 'With confusables'
    },
    wordSearch: {
      title: 'Word Search',
      description: 'Find hidden words in letter soup',
      found: 'Found',
      dragToSelect: 'Drag to select words',
      wordsFound: 'Words found',
      rounds: 'Rounds',
      diagonals: 'Diagonals',
      reverse: 'Reverse'
    },
    anagrams: {
      title: 'Anagrams',
      description: 'Unscramble anagrams before time limit',
      orderLetters: 'Order the letters to form a valid word',
      writeWord: 'Write the word...',
      streak: 'Streak',
      solved: 'Solved',
      expired: 'Expired',
      withDecoys: 'With decoys',
      letters: 'letters',
      perAnagram: 'per anagram'
    },
    schulte: {
      title: 'Schulte Table',
      description: 'Find numbers in sequential order'
    },
    twinWords: {
      title: 'Twin Words',
      description: 'Identify identical words'
    },
    parImpar: {
      title: 'Even/Odd',
      description: 'Classify numbers by parity'
    },
    memoryDigits: {
      title: 'Memory Digits',
      description: 'Memorize number sequences'
    }
  },

  // Session Runner
  sessions: {
    title: 'Training Sessions',
    description: 'Structured workouts with multiple exercises',
    
    // Templates
    quick: {
      title: 'Quick Session',
      description: 'Perfect warm-up to start the day',
      duration: '15 minutes'
    },
    complete: {
      title: 'Complete Session',
      description: 'Balanced training for cognitive development',
      duration: '30 minutes'
    },
    master: {
      title: 'Master Session',
      description: 'Complete intensive training',
      duration: '60 minutes'
    },

    // Session states
    ready: 'Ready',
    running: 'Running',
    paused: 'Paused',
    completed: 'Completed',
    
    // Actions
    startSession: 'Start Session',
    pauseSession: 'Pause Session',
    resumeSession: 'Resume Session',
    exitAndSave: 'Exit and Save',
    skipBlock: 'Skip Block',
    
    // Progress
    sessionProgress: 'Session progress',
    currentBlock: 'Current block',
    blocksCompleted: 'Blocks completed',
    minutesRemaining: 'min remaining',
    sessionCompleted: 'Session Completed!',
    sessionSummary: 'You have finished your session of',
    minutes: 'Minutes',
    points: 'Points'
  },

  // Gamification
  gamification: {
    // XP & Levels
    level: 'Level',
    xp: 'XP',
    experience: 'Experience',
    nextLevel: 'to next level',
    levelUp: 'Level Up!',
    reachedLevel: 'Reached level',
    totalXp: 'Total XP',
    xpGained: 'XP gained',

    // Streaks
    streak: 'Streak',
    currentStreak: 'Current streak',
    longestStreak: 'Longest streak',
    days: 'days',
    completeTrainingToday: 'Complete a training today!',

    // Achievements
    achievements: 'Achievements',
    achievementsUnlocked: 'unlocked',
    recentAchievements: 'Recent Achievements',
    noAchievements: 'Complete trainings to unlock achievements!',
    latest: 'Latest',
    unlocked: 'unlocked',

    // Achievement titles
    firstRun: 'First Training',
    weekStreak: 'Weekly Consistency',
    speedSupersonic: 'Supersonic Speed',
    schulteMaster: 'Schulte Master',
    exceptionalMemory: 'Exceptional Memory',
    eagleEye: 'Eagle Eye',
    sequentialMemory: 'Sequential Memory',
    hawkVision: 'Hawk Vision',
    wordHunter: 'Word Hunter',
    expertDecoder: 'Expert Decoder',
    perfectComprehension: 'Perfect Comprehension'
  },

  // Stats
  stats: {
    title: 'Statistics and Progress',
    overview: 'Overview',
    currentLevel: 'Current Level',
    bestScore: 'Best Score',
    average: 'Average',
    sessions: 'Sessions',
    progressIn: 'Progress in',
    recentProgress: 'Recent Progress',
    performanceAnalysis: 'Performance Analysis',
    improvementTrend: 'Improvement Trend',
    
    // Time filters
    last7Days: 'Last 7 days',
    last30Days: 'Last 30 days',
    last90Days: 'Last 90 days',
    
    // Chart insights
    excellentProgress: 'Excellent progress! You\'ve improved by',
    performanceDown: 'Your performance has dropped by',
    dontGiveUp: 'Don\'t give up, keep practicing!',
    stablePerformance: 'Your performance remains stable. Consider increasing difficulty to keep improving.',
    needMoreSessions: 'Complete more sessions for a more detailed analysis of your progress.',
    
    // Game stats
    gamesPlayed: 'Games played',
    noDataAvailable: 'No data to show in the last',
    completeTraining: 'Complete some trainings of',
    toSeeProgress: 'to see your progress!'
  },

  // AI Tools
  ai: {
    title: 'AI Tools',
    summarize: 'Summarize',
    generateQuestions: 'Generate Questions',
    questions: 'questions',
    
    // Usage
    dailyUsage: 'Daily usage',
    monthlyUsage: 'Monthly usage',
    remaining: 'remaining',
    cacheHit: 'Cache hit',
    loading: 'Generating...',
    error: 'Error generating',
    
    // Quiz
    quiz: 'Comprehension Quiz',
    correct: 'Correct!',
    incorrect: 'Incorrect',
    question: 'Question',
    of: 'of',
    nextQuestion: 'Next Question',
    showResults: 'Show Results',
    yourScore: 'Your score',
    
    // Quota exceeded
    quotaExceeded: 'Quota exceeded',
    quotaMessage: 'You\'ve reached your daily limit. Use sample questions below.',
    fallbackQuestions: 'Sample questions available'
  },

  // Settings
  settings: {
    title: 'Settings',
    language: 'Language',
    spanish: 'Español',
    english: 'English',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto',
    
    // Accessibility
    accessibility: 'Accessibility',
    dyslexiaFont: 'Dyslexia font',
    highContrast: 'High contrast',
    reduceMotion: 'Reduce motion',
    keyboardNavigation: 'Keyboard navigation',
    
    // Reader settings
    readerSettings: 'Reader Settings',
    defaultWpm: 'Default WPM',
    defaultChunkSize: 'Default chunk size',
    autostart: 'Auto start',
    
    // Game settings
    gameSettings: 'Game Settings',
    soundEffects: 'Sound effects',
    vibration: 'Vibration',
    showHints: 'Show hints',
    
    // Account
    account: 'Account',
    profile: 'Profile',
    exportData: 'Export data',
    deleteAccount: 'Delete account'
  },

  // Accessibility
  accessibility: {
    // ARIA labels
    mainMenu: 'Main menu',
    userMenu: 'User menu',
    gameControls: 'Game controls',
    progressBar: 'Progress bar',
    scoreDisplay: 'Score display',
    levelDisplay: 'Level display',
    streakDisplay: 'Streak display',
    xpDisplay: 'Experience display',
    
    // Screen reader
    levelUpAnnouncement: 'Leveled up to level',
    achievementUnlocked: 'Achievement unlocked',
    gameStarted: 'Game started',
    gamePaused: 'Game paused',
    gameResumed: 'Game resumed',
    gameCompleted: 'Game completed',
    timeRemaining: 'Time remaining',
    
    // Keyboard shortcuts
    keyboardShortcuts: 'Keyboard shortcuts',
    spaceToPlay: 'Space to play/pause',
    escToPause: 'Escape to pause',
    arrowKeys: 'Arrow keys to navigate',
    enterToSelect: 'Enter to select',
    
    // Instructions
    keyboardInstructions: 'Use arrow keys to navigate, Enter to select, and Escape to pause',
    touchInstructions: 'Tap elements to interact with them'
  },

  // Notifications
  notifications: {
    sessionSaved: 'Session saved successfully',
    progressSaved: 'Progress saved',
    settingsUpdated: 'Settings updated',
    languageChanged: 'Language changed',
    achievementUnlocked: 'New achievement unlocked',
    levelUp: 'You leveled up',
    connectionLost: 'Connection lost - working offline',
    connectionRestored: 'Connection restored - syncing data',
    dataSynced: 'Data synced successfully'
  },

  // Offline/PWA
  offline: {
    title: 'Offline Mode',
    description: 'Spiread works offline',
    features: 'You can continue training offline. Your data will sync when you reconnect.',
    cached: 'Content available offline',
    install: 'Install Spiread',
    installDescription: 'Install Spiread on your device for a smoother experience',
    workingOffline: 'Working offline',
    queuedChanges: 'queued changes',
    syncWhenOnline: 'Will sync when you\'re back online'
  },

  // Errors
  errors: {
    generic: 'An unexpected error occurred',
    network: 'Connection error. Check your internet.',
    timeout: 'Request timed out. Try again.',
    notFound: 'Resource not found',
    unauthorized: 'You don\'t have permission to perform this action',
    serverError: 'Server error. Try again later.',
    validation: 'The entered data is invalid',
    gameNotFound: 'Game not found',
    sessionNotFound: 'Session not found',
    saveError: 'Error saving data',
    loadError: 'Error loading data'
  },

  // Success messages
  success: {
    dataSaved: 'Data saved successfully',
    sessionCompleted: 'Session completed successfully',
    settingsUpdated: 'Settings updated',
    gameCompleted: 'Game completed',
    achievementUnlocked: 'Achievement unlocked',
    levelUp: 'You leveled up',
    progressSynced: 'Progress synced'
  }
}

export default en