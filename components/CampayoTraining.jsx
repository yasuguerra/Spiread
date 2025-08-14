'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, 
  Eye, 
  Timer, 
  Zap, 
  Target,
  Grid3x3,
  Clock,
  Calendar,
  Play
} from 'lucide-react'

// Import game components
import AcceleratorReader from './AcceleratorReader'
import SchulteTable from './games/SchulteTable'
import TwinWords from './games/TwinWordsGrid'
import ParImpar from './games/ParImpar'
import MemoryDigits from './games/MemoryDigits'
import SessionRunner from './SessionRunner'

// Import Phase 3 games
import RunningWords from './games/RunningWords'
import LettersGrid from './games/LettersGrid'
import WordSearch from './games/WordSearch'
import Anagrams from './games/Anagrams'
import GameWrapper from './games/GameWrapper'

export default function CampayoTraining() {
  const [activeGame, setActiveGame] = useState(null)
  const [sessionTemplate, setSessionTemplate] = useState(null)

  // Handle game completion
  const handleGameFinish = (result) => {
    console.log('Game finished:', result)
    setActiveGame(null) // Return to menu
  }

  // Handle game exit
  const handleGameExit = () => {
    setActiveGame(null) // Return to menu
  }

  // Game configurations
  const gameConfigs = {
    running_words: {
      name: 'running_words',
      displayName: 'Running Words',
      description: 'Memoriza palabras en secuencia de 5 líneas',
      component: RunningWords
    },
    letters_grid: {
      name: 'letters_grid',
      displayName: 'Letters Grid',
      description: 'Encuentra las letras objetivo en la cuadrícula',
      component: LettersGrid
    },
    word_search: {
      name: 'word_search',
      displayName: 'Word Search',
      description: 'Encuentra las palabras ocultas en la sopa de letras',
      component: WordSearch
    },
    anagrams: {
      name: 'anagrams',
      displayName: 'Anagramas',
      description: 'Descifra los anagramas antes del tiempo límite',
      component: Anagrams
    }
  }

  // Handle session completion
  const handleSessionComplete = (result) => {
    console.log('Session completed:', result)
    setSessionTemplate(null) // Return to menu
  }

  // If in session mode
  if (sessionTemplate) {
    return <SessionRunner 
      template={sessionTemplate} 
      onSessionComplete={handleSessionComplete} 
    />
  }

  // If playing individual game
  if (activeGame) {
    const gameComponents = {
      accelerator: AcceleratorReader,
      schulte: SchulteTable,
      twin_words: TwinWords,
      par_impar: ParImpar,
      memory_digits: MemoryDigits
    }
    
    // Check if it's a Phase 3 game (uses GameWrapper)
    const gameConfig = gameConfigs[activeGame]
    if (gameConfig) {
      return (
        <GameWrapper
          gameComponent={gameConfig.component}
          gameConfig={gameConfig}
          onExit={handleGameExit}
        />
      )
    }
    
    // Legacy games (existing implementation)
    const GameComponent = gameComponents[activeGame]
    if (GameComponent) {
      return <GameComponent onGameFinish={handleGameFinish} />
    }
  }

  // Main training menu
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Entrenamiento Campayo</h2>
        <p className="text-muted-foreground">
          Potencia tu velocidad de lectura con ejercicios científicamente diseñados
        </p>
      </div>

      <Tabs defaultValue="games" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="games">Ejercicios Individuales</TabsTrigger>
          <TabsTrigger value="sessions">Sesiones Programadas</TabsTrigger>
        </TabsList>

        <TabsContent value="games" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Acelerador de Lectura */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                  onClick={() => setActiveGame('accelerator')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Acelerador de Lectura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Lee textos resaltando grupos de palabras con cadencia controlada por WPM.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">RSVP</Badge>
                    <Badge variant="outline">Comprensión</Badge>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>• Control preciso de velocidad (100-1000 WPM)</div>
                    <div>• Chunks de 1-5 palabras</div>
                    <div>• Quiz de comprensión automático</div>
                    <div>• Web Worker para cadencia estable</div>
                  </div>
                  <Button className="w-full">
                    <Zap className="w-4 h-4 mr-2" />
                    Comenzar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de Schulte */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setActiveGame('schulte')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3x3 className="w-5 h-5 text-green-600" />
                  Tabla de Schulte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Expande tu campo visual periférico encontrando números en orden.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Campo Visual</Badge>
                    <Badge variant="outline">Fijación</Badge>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>• Grids adaptativos 3×3 hasta 7×7</div>
                    <div>• Mantén fijación en el centro</div>
                    <div>• Métricas de velocidad y precisión</div>
                    <div>• Entrenamiento clásico Campayo</div>
                  </div>
                  <Button className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Comenzar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Palabras Gemelas */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setActiveGame('twin_words')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Palabras Gemelas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Detecta diferencias sutiles entre palabras mostradas brevemente.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Discriminación</Badge>
                    <Badge variant="outline">Velocidad</Badge>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>• Exposición adaptativa (500-1500ms)</div>
                    <div>• Diferencias micro: m/n, rn/m, acentos</div>
                    <div>• Medición de tiempo de reacción</div>
                    <div>• Entrenamiento de precisión visual</div>
                  </div>
                  <Button className="w-full">
                    <Brain className="w-4 h-4 mr-2" />
                    Comenzar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Target className="w-12 h-12 mx-auto text-blue-600" />
                <h3 className="text-lg font-semibold">Entrenamiento Libre</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Los ejercicios individuales se adaptan automáticamente a tu nivel de rendimiento. 
                  Cada juego utiliza un sistema de dificultad inteligente que ajusta los parámetros 
                  según tu puntuación (≥80% sube nivel, &lt;60% baja nivel).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">10</div>
                    <div className="text-sm text-muted-foreground">Niveles de Dificultad</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">Auto</div>
                    <div className="text-sm text-muted-foreground">Adaptación</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">100%</div>
                    <div className="text-sm text-muted-foreground">Scoring</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sesión 15 minutos */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSessionTemplate('15min')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  Sesión Rápida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-green-600">15 min</div>
                  <p className="text-sm text-muted-foreground">
                    Entrenamiento intensivo para rutinas diarias
                  </p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>• 2min Calentamiento</div>
                    <div>• 5min Acelerador</div>
                    <div>• 4min Palabras Gemelas</div>
                    <div>• 4min Schulte</div>
                  </div>
                  <Button className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sesión 30 minutos */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSessionTemplate('30min')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Sesión Estándar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-blue-600">30 min</div>
                  <p className="text-sm text-muted-foreground">
                    Entrenamiento completo balanceado
                  </p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>• 3min Calentamiento</div>
                    <div>• 10min Acelerador</div>
                    <div>• 7min Carrera de Palabras</div>
                    <div>• 5min Palabras Gemelas</div>
                    <div>• 5min Schulte</div>
                  </div>
                  <Button className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    Iniciar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sesión 60 minutos */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSessionTemplate('60min')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-purple-600" />
                  Sesión Completa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-purple-600">60 min</div>
                  <p className="text-sm text-muted-foreground">
                    Entrenamiento intensivo de nivel profesional
                  </p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>• 5min Calentamiento</div>
                    <div>• 20min Acelerador</div>
                    <div>• 10min Carrera de Palabras</div>
                    <div>• 10min Palabras Gemelas</div>
                    <div>• 10min Schulte</div>
                    <div>• 5min Relajación</div>
                  </div>
                  <Button className="w-full">
                    <Timer className="w-4 h-4 mr-2" />
                    Iniciar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Calendar className="w-12 h-12 mx-auto text-blue-600" />
                <h3 className="text-lg font-semibold">Sesiones Programadas</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Las sesiones programadas combinan múltiples ejercicios en secuencia optimizada. 
                  Cada bloque utiliza dificultad adaptativa individual y el sistema persiste 
                  automáticamente tu progreso y ajustes de nivel.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">4-6</div>
                    <div className="text-sm text-muted-foreground">Ejercicios</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">Auto</div>
                    <div className="text-sm text-muted-foreground">Transiciones</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">Adaptativo</div>
                    <div className="text-sm text-muted-foreground">Dificultad</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">Completo</div>
                    <div className="text-sm text-muted-foreground">Reporte</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}