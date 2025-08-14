// Spanish (ES) translations
export const es = {
  // Common
  common: {
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    close: 'Cerrar',
    next: 'Siguiente',
    previous: 'Anterior',
    start: 'Comenzar',
    pause: 'Pausar',
    resume: 'Continuar',
    stop: 'Detener',
    exit: 'Salir',
    skip: 'Saltar',
    finish: 'Terminar',
    level: 'Nivel',
    score: 'Puntuación',
    time: 'Tiempo',
    duration: 'Duración',
    progress: 'Progreso'
  },

  // Navigation
  nav: {
    reader: 'RSVP',
    training: 'Entrenamiento',
    sessions: 'Sesiones',
    stats: 'Métricas',
    settings: 'Configuración'
  },

  // Onboarding
  onboarding: {
    welcome: '¡Bienvenido a Spiread - Acelera tu lectura, mejora tu comprensión!',
    subtitle: 'Antes de comenzar tu entrenamiento, vamos a medir tu velocidad de lectura actual.',
    description: 'Este test nos ayudará a personalizar tu programa de entrenamiento.',
    speedTest: 'Test de Velocidad',
    comprehensionTest: 'Test de Comprensión',
    personalizedPlan: 'Plan Personalizado',
    speedTestDuration: '2-3 minutos',
    comprehensionQuestions: '2 preguntas',
    basedOnResults: 'Basado en resultados',
    startTest: 'Comenzar Test',
    startReading: 'Comenzar Lectura',
    finished: 'Terminé',
    continue: 'Continuar'
  },

  // RSVP Reader
  reader: {
    title: 'Lector RSVP',
    wpm: 'PPM',
    wordsPerMinute: 'Palabras por minuto',
    chunkSize: 'Tamaño de fragmento',
    mode: 'Modo',
    import: 'Importar',
    export: 'Exportar',
    pasteText: 'Pegar texto aquí...',
    or: 'o',
    uploadFile: 'Subir archivo',
    reading: 'Leyendo...',
    paused: 'Pausado',
    completed: 'Completado',
    progress: 'Progreso',
    timeElapsed: 'Tiempo transcurrido',
    estimatedTime: 'Tiempo estimado',
    wordsRead: 'Palabras leídas',
    totalWords: 'Total de palabras',
    comprehension: 'Comprensión',
    generateQuestions: 'Generar Preguntas',
    aiTools: 'Herramientas IA'
  },

  // Games
  games: {
    // Common
    playFor60s: 'Jugar 60s',
    currentLevel: 'Nivel Actual',
    bestScore: 'Mejor Puntuación',
    difficulty: 'Dificultad',
    adaptive: 'Adaptativo',
    sessions: 'Sesiones',
    accuracy: 'Precisión',
    timeRemaining: 'Tiempo restante',
    gameComplete: '¡Tiempo completado!',
    finalScore: 'Puntuación final',
    preparing: 'Preparando juego...',

    // Specific games
    runningWords: {
      title: 'Running Words',
      description: 'Memoriza palabras en secuencia de 5 líneas',
      question: '¿Cuál fue la última palabra de la línea',
      wordsPerLine: 'palabras/línea',
      rounds: 'Rondas'
    },
    lettersGrid: {
      title: 'Letters Grid',
      description: 'Encuentra las letras objetivo en la cuadrícula',
      search: 'Buscar',
      clickAll: 'Haz clic en todas las letras objetivo',
      selected: 'Seleccionadas',
      targets: 'objetivos',
      withConfusables: 'Con confusables'
    },
    wordSearch: {
      title: 'Word Search',
      description: 'Encuentra las palabras ocultas en la sopa de letras',
      found: 'Encontradas',
      dragToSelect: 'Arrastra para seleccionar palabras',
      wordsFound: 'Palabras encontradas',
      rounds: 'Rondas',
      diagonals: 'Diagonales',
      reverse: 'Reverso'
    },
    anagrams: {
      title: 'Anagramas',
      description: 'Descifra los anagramas antes del tiempo límite',
      orderLetters: 'Ordena las letras para formar una palabra válida',
      writeWord: 'Escribe la palabra...',
      streak: 'Racha',
      solved: 'Resueltos',
      expired: 'Expirados',
      withDecoys: 'Con señuelos',
      letters: 'letras',
      perAnagram: 'por anagrama'
    },
    schulte: {
      title: 'Tabla Schulte',
      description: 'Encuentra los números en orden secuencial'
    },
    twinWords: {
      title: 'Palabras Gemelas',
      description: 'Identifica las palabras idénticas'
    },
    parImpar: {
      title: 'Par/Impar',
      description: 'Clasifica números según paridad'
    },
    memoryDigits: {
      title: 'Memoria de Dígitos',
      description: 'Memoriza secuencias numéricas'
    }
  },

  // Session Runner
  sessions: {
    title: 'Sesiones de Entrenamiento',
    description: 'Entrenamientos estructurados con múltiples ejercicios',
    
    // Templates
    quick: {
      title: 'Sesión Rápida',
      description: 'Calentamiento perfecto para comenzar el día',
      duration: '15 minutos'
    },
    complete: {
      title: 'Sesión Completa', 
      description: 'Entrenamiento equilibrado para desarrollo cognitivo',
      duration: '30 minutos'
    },
    master: {
      title: 'Sesión Master',
      description: 'Entrenamiento intensivo completo',
      duration: '60 minutos'
    },

    // Session states
    ready: 'Listo',
    running: 'En progreso',
    paused: 'Pausado',
    completed: 'Completado',
    
    // Actions
    startSession: 'Comenzar Sesión',
    pauseSession: 'Pausar Sesión',
    resumeSession: 'Continuar Sesión',
    exitAndSave: 'Salir y Guardar',
    skipBlock: 'Saltar Bloque',
    
    // Progress
    sessionProgress: 'Progreso de sesión',
    currentBlock: 'Bloque actual',
    blocksCompleted: 'Bloques completados',
    minutesRemaining: 'min restantes',
    sessionCompleted: '¡Sesión Completada!',
    sessionSummary: 'Has terminado tu sesión de',
    minutes: 'Minutos',
    points: 'Puntos'
  },

  // Gamification
  gamification: {
    // XP & Levels
    level: 'Nivel',
    xp: 'XP',
    experience: 'Experiencia',
    nextLevel: 'hasta el siguiente nivel',
    levelUp: '¡Nivel Subido!',
    reachedLevel: 'Alcanzaste el nivel',
    totalXp: 'XP total',
    xpGained: 'XP ganados',

    // Streaks
    streak: 'Racha',
    currentStreak: 'Racha actual',
    longestStreak: 'Mejor racha',
    days: 'días',
    completeTrainingToday: '¡Completa un entrenamiento hoy!',

    // Achievements
    achievements: 'Logros',
    achievementsUnlocked: 'desbloqueados',
    recentAchievements: 'Logros Recientes',
    noAchievements: '¡Completa entrenamientos para desbloquear logros!',
    latest: 'Último',
    unlocked: 'desbloqueado',

    // Achievement titles
    firstRun: 'Primer Entrenamiento',
    weekStreak: 'Constancia Semanal',
    speedSupersonic: 'Velocidad Supersónica',
    schulteMaster: 'Maestro Schulte',
    exceptionalMemory: 'Memoria Excepcional',
    eagleEye: 'Ojo de Águila',
    sequentialMemory: 'Memoria Secuencial',
    hawkVision: 'Vista de Águila',
    wordHunter: 'Cazador de Palabras',
    expertDecoder: 'Descifrador Experto',
    perfectComprehension: 'Comprensión Perfecta'
  },

  // Stats
  stats: {
    title: 'Estadísticas y Progreso',
    overview: 'General',
    currentLevel: 'Nivel Actual',
    bestScore: 'Mejor Puntuación',
    average: 'Promedio',
    sessions: 'Sesiones',
    progressIn: 'Progreso en',
    recentProgress: 'Progreso Reciente',
    performanceAnalysis: 'Análisis de Rendimiento',
    improvementTrend: 'Tendencia de Mejora',
    
    // Time filters
    last7Days: 'Últimos 7 días',
    last30Days: 'Últimos 30 días',
    last90Days: 'Últimos 90 días',
    
    // Chart insights
    excellentProgress: '¡Excelente progreso! Has mejorado un',
    performanceDown: 'Tu rendimiento ha bajado un',
    dontGiveUp: '¡No te desanimes, sigue practicando!',
    stablePerformance: 'Tu rendimiento se mantiene estable. Considera aumentar la dificultad para seguir mejorando.',
    needMoreSessions: 'Completa más sesiones para obtener un análisis más detallado de tu progreso.',
    
    // Game stats
    gamesPlayed: 'Juegos jugados',
    noDataAvailable: 'No hay datos para mostrar en los últimos',
    completeTraining: '¡Completa algunos entrenamientos de',
    toSeeProgress: 'para ver tu progreso!'
  },

  // AI Tools
  ai: {
    title: 'Herramientas IA',
    summarize: 'Resumir',
    generateQuestions: 'Generar Preguntas',
    questions: 'preguntas',
    
    // Usage
    dailyUsage: 'Uso diario',
    monthlyUsage: 'Uso mensual',
    remaining: 'restantes',
    cacheHit: 'Cache hit',
    loading: 'Generando...',
    error: 'Error al generar',
    
    // Quiz
    quiz: 'Quiz de Comprensión',
    correct: '¡Correcto!',
    incorrect: 'Incorrecto',
    question: 'Pregunta',
    of: 'de',
    nextQuestion: 'Siguiente Pregunta',
    showResults: 'Ver Resultados',
    yourScore: 'Tu puntuación',
    
    // Quota exceeded
    quotaExceeded: 'Cuota excedida',
    quotaMessage: 'Has alcanzado tu límite diario. Usa las preguntas de ejemplo.',
    fallbackQuestions: 'Preguntas de ejemplo disponibles'
  },

  // Settings
  settings: {
    title: 'Configuración',
    language: 'Idioma',
    spanish: 'Español',
    english: 'English',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    auto: 'Automático',
    
    // Accessibility
    accessibility: 'Accesibilidad',
    dyslexiaFont: 'Fuente para dislexia',
    highContrast: 'Alto contraste',
    reduceMotion: 'Reducir animaciones',
    keyboardNavigation: 'Navegación por teclado',
    
    // Reader settings
    readerSettings: 'Configuración del Lector',
    defaultWpm: 'PPM por defecto',
    defaultChunkSize: 'Tamaño de fragmento por defecto',
    autostart: 'Inicio automático',
    
    // Game settings
    gameSettings: 'Configuración de Juegos',
    soundEffects: 'Efectos de sonido',
    vibration: 'Vibración',
    showHints: 'Mostrar pistas',
    
    // Account
    account: 'Cuenta',
    profile: 'Perfil',
    exportData: 'Exportar datos',
    deleteAccount: 'Eliminar cuenta'
  },

  // Accessibility
  accessibility: {
    // ARIA labels
    mainMenu: 'Menú principal',
    userMenu: 'Menú de usuario',
    gameControls: 'Controles de juego',
    progressBar: 'Barra de progreso',
    scoreDisplay: 'Mostrar puntuación',
    levelDisplay: 'Mostrar nivel',
    streakDisplay: 'Mostrar racha',
    xpDisplay: 'Mostrar experiencia',
    
    // Screen reader
    levelUpAnnouncement: 'Subiste al nivel',
    achievementUnlocked: 'Logro desbloqueado',
    gameStarted: 'Juego iniciado',
    gamePaused: 'Juego pausado',
    gameResumed: 'Juego reanudado',
    gameCompleted: 'Juego completado',
    timeRemaining: 'Tiempo restante',
    
    // Keyboard shortcuts
    keyboardShortcuts: 'Atajos de teclado',
    spaceToPlay: 'Espacio para reproducir/pausar',
    escToPause: 'Escape para pausar',
    arrowKeys: 'Flechas para navegar',
    enterToSelect: 'Enter para seleccionar',
    
    // Instructions
    keyboardInstructions: 'Usa las teclas de flecha para navegar, Enter para seleccionar y Escape para pausar',
    touchInstructions: 'Toca los elementos para interactuar con ellos'
  },

  // Notifications
  notifications: {
    sessionSaved: 'Sesión guardada correctamente',
    progressSaved: 'Progreso guardado',
    settingsUpdated: 'Configuración actualizada',
    languageChanged: 'Idioma cambiado',
    achievementUnlocked: 'Nuevo logro desbloqueado',
    levelUp: 'Has subido de nivel',
    connectionLost: 'Conexión perdida - trabajando sin conexión',
    connectionRestored: 'Conexión restaurada - sincronizando datos',
    dataSynced: 'Datos sincronizados correctamente'
  },

  // Offline/PWA
  offline: {
    title: 'Modo Sin Conexión',
    description: 'Spiread funciona sin conexión',
    features: 'Puedes seguir entrenando sin conexión. Tus datos se sincronizarán cuando vuelvas a conectarte.',
    cached: 'Contenido disponible sin conexión',
    install: 'Instalar Spiread',
    installDescription: 'Instala Spiread en tu dispositivo para una experiencia más fluida',
    workingOffline: 'Trabajando sin conexión',
    queuedChanges: 'cambios en cola',
    syncWhenOnline: 'Se sincronizarán cuando vuelvas a estar en línea'
  },

  // Errors
  errors: {
    generic: 'Ha ocurrido un error inesperado',
    network: 'Error de conexión. Verifica tu internet.',
    timeout: 'La solicitud ha tardado demasiado. Inténtalo de nuevo.',
    notFound: 'Recurso no encontrado',
    unauthorized: 'No tienes permisos para realizar esta acción',
    serverError: 'Error del servidor. Inténtalo más tarde.',
    validation: 'Los datos introducidos no son válidos',
    gameNotFound: 'Juego no encontrado',
    sessionNotFound: 'Sesión no encontrada',
    saveError: 'Error al guardar los datos',
    loadError: 'Error al cargar los datos'
  },

  // Success messages
  success: {
    dataSaved: 'Datos guardados correctamente',
    sessionCompleted: 'Sesión completada con éxito',
    settingsUpdated: 'Configuración actualizada',
    gameCompleted: 'Juego completado',
    achievementUnlocked: 'Logro desbloqueado',
    levelUp: 'Has subido de nivel',
    progressSynced: 'Progreso sincronizado'
  }
}

export default es