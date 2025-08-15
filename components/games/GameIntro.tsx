'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { 
  Play, 
  Info, 
  Keyboard, 
  Timer, 
  Trophy, 
  Target,
  X
} from 'lucide-react'

interface GameIntroProps {
  gameKey: string
  gameName: string
  isOpen: boolean
  onClose: () => void
  onStart: () => void
  language?: 'es' | 'en'
}

// Game instructions in both languages
const GAME_INSTRUCTIONS = {
  'schulte': {
    es: {
      objective: 'Encuentra los números en orden ascendente (1, 2, 3...) lo más rápido posible',
      scoring: 'Más puntos cuanto menos tiempo tardes. Penalización por errores',
      difficulty: 'Mayor tamaño de tabla y menos guías visuales al subir nivel',
      controls: ['Clic en números', 'ESC para salir', 'SPACE para pausar']
    },
    en: {
      objective: 'Find numbers in ascending order (1, 2, 3...) as fast as possible',
      scoring: 'More points for faster completion. Penalty for errors',
      difficulty: 'Larger table size and fewer visual guides as level increases',
      controls: ['Click on numbers', 'ESC to exit', 'SPACE to pause']
    }
  },
  'twinwords': {
    es: {
      objective: 'Encuentra y empareja las palabras duplicadas en la pantalla',
      scoring: '+1 por par correcto, +2 si se resuelve ≤2s, -1 por error',
      difficulty: 'Más pares simultáneos y palabras más similares al subir nivel',
      controls: ['Clic en palabras', 'ESC para salir', 'SPACE para pausar']
    },
    en: {
      objective: 'Find and match duplicate words on the screen',
      scoring: '+1 for correct pair, +2 if solved ≤2s, -1 for error',
      difficulty: 'More simultaneous pairs and similar words as level increases',
      controls: ['Click on words', 'ESC to exit', 'SPACE to pause']
    }
  },
  'parimpar': {
    es: {
      objective: 'Selecciona números pares o impares según el modo del nivel',
      scoring: '+1 por acierto, combo +1 extra cada 5 aciertos consecutivos',
      difficulty: 'Más números en pantalla y alternancia pares/impares',
      controls: ['Clic en números', 'ESC para salir', 'SPACE para pausar']
    },
    en: {
      objective: 'Select even or odd numbers according to the level mode',
      scoring: '+1 per hit, combo +1 extra every 5 consecutive hits',
      difficulty: 'More numbers on screen and even/odd alternation',
      controls: ['Click on numbers', 'ESC to exit', 'SPACE to pause']
    }
  },
  'memorydigits': {
    es: {
      objective: 'Memoriza la secuencia de números y repítela en orden',
      scoring: 'Puntos por secuencia correcta, penalización por errores',
      difficulty: 'Secuencias más largas y números mostrados más rápido',
      controls: ['Observa y escribe', 'ESC para salir', 'ENTER confirmar']
    },
    en: {
      objective: 'Memorize the number sequence and repeat it in order',
      scoring: 'Points for correct sequence, penalty for errors',
      difficulty: 'Longer sequences and faster number display',
      controls: ['Watch and type', 'ESC to exit', 'ENTER to confirm']
    }
  },
  'lettersgrid': {
    es: {
      objective: 'Encuentra todas las instancias de las letras objetivo en la grilla',
      scoring: '+1 por objetivo completado (todas las instancias encontradas)',
      difficulty: 'Grilla más grande y más letras objetivo simultáneas',
      controls: ['Clic en letras', 'ESC para salir', 'SPACE para pausar']
    },
    en: {
      objective: 'Find all instances of target letters in the grid',
      scoring: '+1 per completed objective (all instances found)',
      difficulty: 'Larger grid and more simultaneous target letters',
      controls: ['Click on letters', 'ESC to exit', 'SPACE to pause']
    }
  },
  'wordsearch': {
    es: {
      objective: 'Encuentra palabras ocultas haciendo clic en cualquier letra de la palabra',
      scoring: '+1 por palabra encontrada, -1 por clic incorrecto',
      difficulty: 'Más palabras ocultas y grilla más grande',
      controls: ['Clic en letras', 'ESC para salir', 'SPACE para pausar']
    },
    en: {
      objective: 'Find hidden words by clicking on any letter of the word',
      scoring: '+1 per word found, -1 for incorrect click',
      difficulty: 'More hidden words and larger grid',
      controls: ['Click on letters', 'ESC to exit', 'SPACE to pause']
    }
  },
  'anagrams': {
    es: {
      objective: 'Forma palabras válidas usando las letras disponibles',
      scoring: '+longitud de palabra por palabra válida, -1 por inválida',
      difficulty: 'Más letras disponibles y palabras objetivo más largas',
      controls: ['Arrastra letras', 'ESC para salir', 'ENTER confirmar']
    },
    en: {
      objective: 'Form valid words using the available letters',
      scoring: '+word length per valid word, -1 for invalid',
      difficulty: 'More available letters and longer target words',
      controls: ['Drag letters', 'ESC to exit', 'ENTER to confirm']
    }
  },
  'runningwords': {
    es: {
      objective: 'Lee las palabras que aparecen y desaparecen rápidamente',
      scoring: 'Puntos por palabras leídas correctamente',
      difficulty: 'Palabras más rápidas y vocabulario más complejo',
      controls: ['Solo observa', 'ESC para salir', 'SPACE para pausar']
    },
    en: {
      objective: 'Read words that appear and disappear quickly',
      scoring: 'Points for correctly read words',
      difficulty: 'Faster words and more complex vocabulary',
      controls: ['Just observe', 'ESC to exit', 'SPACE to pause']
    }
  }
}

export default function GameIntro({ gameKey, gameName, isOpen, onClose, onStart, language = 'es' }: GameIntroProps) {
  const [dontShowToday, setDontShowToday] = useState(false)
  
  const instructions = GAME_INSTRUCTIONS[gameKey as keyof typeof GAME_INSTRUCTIONS]?.[language] || {
    objective: 'Complete the game challenges and improve your score',
    scoring: 'Points awarded for correct actions',
    difficulty: 'Difficulty increases with level progression',
    controls: ['Various controls available']
  }

  const labels = {
    es: {
      title: '¿Cómo se juega?',
      objective: 'Objetivo',
      scoring: 'Puntuación',
      difficulty: 'Dificultad',
      controls: 'Controles',
      dontShow: 'No mostrar hoy',
      startGame: 'Empezar Juego',
      close: 'Cerrar'
    },
    en: {
      title: 'How to Play?',
      objective: 'Objective',
      scoring: 'Scoring',
      difficulty: 'Difficulty',
      controls: 'Controls',
      dontShow: "Don't show today",
      startGame: 'Start Game',
      close: 'Close'
    }
  }[language]

  const handleClose = () => {
    if (dontShowToday) {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      localStorage.setItem(`gi_${gameKey}_${today}`, 'hidden')
    }
    onClose()
  }

  const handleStart = () => {
    if (dontShowToday) {
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(`gi_${gameKey}_${today}`, 'hidden')
    }
    onStart()
  }

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleStart()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-describedby="game-intro-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-xl">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div>{labels.title}</div>
              <div className="text-sm font-normal text-muted-foreground mt-1">
                {gameName}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div id="game-intro-description" className="space-y-6">
          {/* Objective */}
          <Card className="p-4">
            <div className="flex items-start space-x-3">
              <Target className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  {labels.objective}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {instructions.objective}
                </p>
              </div>
            </div>
          </Card>

          {/* Scoring */}
          <Card className="p-4">
            <div className="flex items-start space-x-3">
              <Trophy className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  {labels.scoring}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {instructions.scoring}
                </p>
              </div>
            </div>
          </Card>

          {/* Difficulty */}
          <Card className="p-4">
            <div className="flex items-start space-x-3">
              <Timer className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                  {labels.difficulty}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {instructions.difficulty}
                </p>
              </div>
            </div>
          </Card>

          {/* Controls */}
          <Card className="p-4">
            <div className="flex items-start space-x-3">
              <Keyboard className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  {labels.controls}
                </h3>
                <div className="space-y-1">
                  {instructions.controls.map((control, index) => (
                    <Badge key={index} variant="secondary" className="mr-2 mb-1">
                      {control}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Timer info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
              <Timer className="w-4 h-4" />
              <span className="text-sm font-medium">
                {language === 'es' ? 'Duración: 60 segundos por sesión' : 'Duration: 60 seconds per session'}
              </span>
            </div>
          </div>

          {/* Don't show today option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dont-show-today"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <label htmlFor="dont-show-today" className="text-sm text-muted-foreground">
              {labels.dontShow}
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
            <Button 
              onClick={handleStart}
              className="flex-1 flex items-center justify-center space-x-2"
              autoFocus
            >
              <Play className="w-4 h-4" />
              <span>{labels.startGame}</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>{labels.close}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}