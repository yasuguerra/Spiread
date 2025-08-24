// Spanish translations for Spiread
// Default language: ES

export const es = {
  // Global UI
  exit: 'Salir',
  back: 'Volver',
  level: 'Nivel',
  time: 'Tiempo',
  score: 'Puntos',
  points: 'Puntos',
  
  // Game TopBar
  gameTopBar: {
    exit: 'Salir',
    level: 'Nivel',
    time: 'Tiempo',
    score: 'Puntos'
  },
  
  // Common game terms
  round: 'Ronda',
  rounds: 'Rondas',
  accuracy: 'Precisión',
  streak: 'Racha',
  
  // Games section
  games: {
    parimpar: {
      title: 'Par / Impar',
      description: 'Observa los números y selecciona solo los pares o impares según la instrucción',
      readyInstruction: 'Prepárate para memorizar números',
      instruction_even: 'Selecciona todos los números PARES',
      instruction_odd: 'Selecciona todos los números IMPARES',
      confirm: 'Confirmar Selección',
      even: 'PARES',
      odd: 'IMPARES',
      selectAll: 'Selecciona todos los números',
      target: 'Objetivo',
      selected: 'Seleccionados',
      howToPlay: 'Cómo jugar:',
      step1: 'Los números aparecen por unos segundos',
      step2: 'Memoriza su posición en la cuadrícula',
      step3: 'Selecciona solo los PARES o IMPARES según la regla mostrada',
      step4: 'Feedback inmediato: verde ✓ correcto, rojo ✗ incorrecto',
      startGame: 'Empezar Juego',
      showing: 'Memoriza estos números',
      selecting_even: 'Selecciona todos los números PARES',
      selecting_odd: 'Selecciona todos los números IMPARES',
      results: 'Resultados',
      gameComplete: 'Juego Completo',
      loading: 'Cargando...',
      restart: 'Reiniciar',
      finish: 'Terminar'
    },
    
    // Game cards
    start: 'Comenzar',
    cardTitle: {
      parimpar: 'Par / Impar',
      twinwords: 'Palabras Gemelas',
      memorydigits: 'Recuerda el Número',
      schulte: 'Tabla de Schulte',
      rsvp: 'Lectura Rápida'
    },
    cardDescription: {
      parimpar: 'Decisiones rápidas bajo presión temporal',
      twinwords: 'Encuentra palabras idénticas en la cuadrícula',
      memorydigits: 'Memoria inmediata de secuencias de dígitos',
      schulte: 'Entrenamiento de atención visual periférica',
      rsvp: 'Entrenamiento de velocidad lectora con RSVP'
    },
    badges: {
      goNoGo: 'Go/No-Go',
      speed: 'Velocidad',
      memory: 'Memoria',
      attention: 'Atención',
      reading: 'Lectura',
      visual: 'Visual',
      processing: 'Procesamiento',
      discrimination: 'Discriminación',
      precision: 'Precisión'
    },
    features: {
      adaptiveISI: 'ISI adaptativo',
      numbers1to9999: 'Números 1-9999',
      colorDistractors: 'Distractores de color',
      identicalPairs: 'Parejas idénticas',
      confusablePairs: 'Parejas confundibles',
      variableGrid: 'Cuadrícula variable',
      digitSequences: 'Secuencias de dígitos',
      increasingLength: 'Longitud creciente',
      immediateRecall: 'Recuerdo inmediato',
      peripheralAttention: 'Atención periférica',
      randomizedNumbers: 'Números aleatorizados',
      spatialMemory: 'Memoria espacial',
      speedReading: 'Lectura rápida',
      wpmControl: 'Control WPM',
      comprehensionQuestions: 'Preguntas de comprensión',
      gridPairs: 'Grid de pares por pantalla',
      microDifferences: 'Diferencias micro (m/n, acentos)',
      multipleSelection: 'Selección múltiple',
      adaptiveGrids: 'Grids adaptativos 3×3 a 7×7',
      continuousMode: 'Modo continuo con puntos',
      centralFixation: 'Fijación central'
    }
  },
  
  // Par/Impar specific (legacy, keeping for compatibility)
  parimpar: {
    title: 'Par / Impar',
    description: 'Observa los números y selecciona solo los pares o impares según la instrucción',
    readyInstruction: 'Prepárate para memorizar números',
    instruction_even: 'Selecciona todos los números PARES',
    instruction_odd: 'Selecciona todos los números IMPARES',
    confirm: 'Confirmar Selección',
    even: 'PARES',
    odd: 'IMPARES',
    selectAll: 'Selecciona todos los números',
    target: 'Objetivo',
    selected: 'Seleccionados',
    howToPlay: 'Cómo jugar:',
    step1: 'Los números aparecen por unos segundos',
    step2: 'Memoriza su posición en la cuadrícula',
    step3: 'Selecciona solo los PARES o IMPARES según la regla mostrada',
    step4: 'Feedback inmediato: verde ✓ correcto, rojo ✗ incorrecto',
    startGame: 'Empezar Juego'
  },
  
  // Twin Words specific
  twinwords: {
    title: 'Palabras Gemelas',
    pairs: 'pares',
    pair: 'pareja',
    matchWords: 'Empareja palabras iguales',
    instruction: 'Marca las palabras DIFERENTES',
    startGame: 'Comenzar Juego',
    examples: {
      accents: 'Acentos: esta vs está',
      similar: 'Similares: rn vs m', 
      minimal: 'Pares mínimos: casa vs caza'
    }
  }
} as const

export type TranslationKey = typeof es
export type NestedKeyOf<ObjectType extends object> = 
  {
    [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
      ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
      : `${Key}`
  }[keyof ObjectType & (string | number)]

export type TranslationPath = NestedKeyOf<TranslationKey>

// Simple translation helper
export function t(path: TranslationPath, params?: Record<string, string | number>): string {
  try {
    const keys = path.split('.')
    let value: any = es
    
    for (const key of keys) {
      value = value[key]
      if (value === undefined) {
        console.warn(`Translation not found for path: ${path}`)
        return path
      }
    }
    
    let result = String(value)
    
    // Simple parameter substitution
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        result = result.replace(new RegExp(`{${key}}`, 'g'), String(val))
      })
    }
    
    return result
  } catch (error) {
    console.warn(`Translation error for path: ${path}`, error)
    return path
  }
}

// Default export for convenience
export default es
