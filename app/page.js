'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Book, 
  Zap, 
  Target, 
  TrendingUp, 
  Play, 
  Pause, 
  Settings, 
  Trophy,
  Eye,
  Brain,
  Timer,
  BarChart3,
  Grid3x3,
  Calculator,
  Calendar
} from 'lucide-react'

import { useAppStore, useRSVPStore } from '@/lib/store'
import { initializeDatabase, createAnonymousSession } from '@/lib/supabase'
import { APP_NAME } from '@/lib/constants'

// Import components
import RSVPReader from '@/components/RSVPReader'
import OnboardingTest from '@/components/OnboardingTest'
import StatsPanel from '@/components/StatsPanel'
import SettingsPanel from '@/components/SettingsPanel'
import GamificationHeader from '@/components/GamificationHeader'

// Import new games
import ShuttleTable from '@/components/games/ShuttleTable'
import TwinWordsGrid from '@/components/games/TwinWordsGrid'
import ParImpar from '@/components/games/ParImpar'
import MemoryDigits from '@/components/games/MemoryDigits'
import SessionRunner from '@/components/SessionRunner'

// Import Phase 3 games
import RunningWords from '@/components/games/RunningWords'
import LettersGrid from '@/components/games/LettersGrid'
import WordSearch from '@/components/games/WordSearch'
import Anagrams from '@/components/games/Anagrams'
import GameWrapper from '@/components/games/GameWrapper'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('onboarding')
  const [isLoading, setIsLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [activeGame, setActiveGame] = useState(null)
  const [sessionTemplate, setSessionTemplate] = useState(null)
  
  // Get user profile from store
  const { userProfile, updateProfile } = useAppStore()
  
  const { 
    currentUser, 
    sessionId, 
    settings, 
    stats,
    setSessionId,
    updateSettings 
  } = useAppStore()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database connection
        await initializeDatabase()
        
        // Create anonymous session if none exists
        if (!sessionId) {
          const newSessionId = await createAnonymousSession()
          setSessionId(newSessionId)
        }
        
        // Check if user has completed onboarding
        if (stats.totalSessions > 0) {
          setShowOnboarding(false)
          setActiveTab('training')
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Error initializing app:', error)
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [sessionId, stats.totalSessions, setSessionId])

  const handleOnboardingComplete = (results) => {
    console.log('Onboarding results:', results)
    setShowOnboarding(false)
    setActiveTab('training')
    
    // Update settings with initial baseline
    updateSettings({
      wpmTarget: results.wpm + 50 // Set target 50 WPM higher than baseline
    })
  }

  const handleGameFinish = (result) => {
    console.log('Game finished:', result)
    setActiveGame(null)
  }

  const handleSessionComplete = (result) => {
    console.log('Session completed:', result)
    setSessionTemplate(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-lg text-muted-foreground">Iniciando {APP_NAME}...</p>
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <OnboardingTest onComplete={handleOnboardingComplete} />
      </div>
    )
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
      shuttle: ShuttleTable,
      twin_words: TwinWordsGrid,
      par_impar: ParImpar,
      memory_digits: MemoryDigits,
      rsvp: RSVPReader
    }
    
    const GameComponent = gameComponents[activeGame]
    if (GameComponent) {
      return <GameComponent 
        onFinish={handleGameFinish}
        onExit={() => setActiveGame(null)}
      />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {APP_NAME}
              </span>
            </motion.div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="hidden sm:flex">
              <TrendingUp className="w-3 h-3 mr-1" />
              {stats.averageWpm} WPM
            </Badge>
            <Badge variant="outline" className="hidden sm:flex">
              <Trophy className="w-3 h-3 mr-1" />
              Nivel {stats.level}
            </Badge>
          </div>
        </div>
      </header>

      {/* Gamification Header */}
      {!showOnboarding && userProfile && (
        <GamificationHeader />
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="reader" className="flex items-center gap-2">
              <Book className="w-4 h-4" />
              <span className="hidden sm:inline">RSVP</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Training</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Métricas</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Ajustes</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Logros</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reader" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <RSVPReader />
              </div>
              <div className="space-y-4">
                <QuickStatsCard />
                <ReadingControlsCard />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold">Entrenamiento Cerebral</h2>
              <p className="text-muted-foreground">
                Potencia tu velocidad de lectura y habilidades cognitivas
              </p>
            </div>

            <Tabs defaultValue="games" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="games">Ejercicios Individuales</TabsTrigger>
                <TabsTrigger value="sessions">Sesiones Programadas</TabsTrigger>
              </TabsList>

              <TabsContent value="games" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* RSVP Reader */}
                  <GameCard
                    title="Lector RSVP"
                    description="Lectura rápida con presentación visual secuencial"
                    icon={<Zap className="w-6 h-6 text-blue-600" />}
                    badges={["RSVP", "Velocidad"]}
                    features={[
                      "Control preciso de WPM",
                      "Chunks adaptativos",
                      "Quiz de comprensión"
                    ]}
                    onClick={() => setActiveGame('rsvp')}
                  />

                  {/* Shuttle Table */}
                  <GameCard
                    title="Tabla de Shuttle"
                    description="Expande tu campo visual periférico con números secuenciales"
                    icon={<Grid3x3 className="w-6 h-6 text-green-600" />}
                    badges={["Campo Visual", "Atención"]}
                    features={[
                      "Grids adaptativos 3×3 a 7×7",
                      "Modo continuo con puntos",
                      "Fijación central"
                    ]}
                    onClick={() => setActiveGame('shuttle')}
                  />

                  {/* Twin Words */}
                  <GameCard
                    title="Palabras Gemelas"
                    description="Detecta diferencias sutiles entre palabras"
                    icon={<Eye className="w-6 h-6 text-purple-600" />}
                    badges={["Discriminación", "Precisión"]}
                    features={[
                      "Grid de pares por pantalla",
                      "Diferencias micro (m/n, acentos)",
                      "Selección múltiple"
                    ]}
                    onClick={() => setActiveGame('twin_words')}
                  />

                  {/* Par/Impar */}
                  <GameCard
                    title="Par / Impar"
                    description="Decisiones rápidas bajo presión temporal"
                    icon={<Calculator className="w-6 h-6 text-orange-600" />}
                    badges={["Go/No-Go", "Velocidad"]}
                    features={[
                      "ISI adaptativo",
                      "Números 1-9999",
                      "Distractores de color"
                    ]}
                    onClick={() => setActiveGame('par_impar')}
                  />

                  {/* Memory Digits */}
                  <GameCard
                    title="Recuerda el Número"
                    description="Memoria inmediata de secuencias de dígitos"
                    icon={<Brain className="w-6 h-6 text-red-600" />}
                    badges={["Memoria", "Secuencial"]}
                    features={[
                      "3-12 dígitos adaptativos",
                      "Exposición variable",
                      "Staircase 3-down/1-up"
                    ]}
                    onClick={() => setActiveGame('memory_digits')}
                  />

                  {/* Running Words */}
                  <GameCard
                    title="Running Words"
                    description="Memoriza palabras en secuencia de 5 líneas"
                    icon={<Timer className="w-6 h-6 text-orange-600" />}
                    badges={["Memoria", "Secuencial"]}
                    features={[
                      "60 segundos de entrenamiento",
                      "3-9 palabras por línea",
                      "Dificultad adaptativa"
                    ]}
                    onClick={() => setActiveGame('running_words')}
                  />

                  {/* Letters Grid */}
                  <GameCard
                    title="Letters Grid"
                    description="Encuentra letras objetivo en cuadrículas aleatorias"
                    icon={<Grid3x3 className="w-6 h-6 text-teal-600" />}
                    badges={["Atención", "Visual"]}
                    features={[
                      "Grids 5×5 hasta 15×15",
                      "1-3 letras objetivo",
                      "Letras confusables (nivel 10+)"
                    ]}
                    onClick={() => setActiveGame('letters_grid')}
                  />

                  {/* Word Search */}
                  <GameCard
                    title="Word Search"
                    description="Encuentra palabras ocultas en sopas de letras"
                    icon={<Eye className="w-6 h-6 text-cyan-600" />}
                    badges={["Búsqueda", "Palabras"]}
                    features={[
                      "Grids 8×8 hasta 14×14",
                      "3-10 palabras por ronda",
                      "Diagonales y reverso (nivel 8+)"
                    ]}
                    onClick={() => setActiveGame('word_search')}
                  />

                  {/* Anagrams */}
                  <GameCard
                    title="Anagramas"
                    description="Descifra anagramas antes del tiempo límite"
                    icon={<Brain className="w-6 h-6 text-pink-600" />}
                    badges={["Anagramas", "Velocidad"]}
                    features={[
                      "Palabras de 4-8 letras",
                      "10s-4s por anagrama",
                      "Letras señuelo (nivel 12+)"
                    ]}
                    onClick={() => setActiveGame('anagrams')}
                  />
                </div>

                <AdaptiveSystemCard />
              </TabsContent>

              <TabsContent value="sessions" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Session Templates */}
                  <SessionCard
                    title="Sesión Rápida"
                    duration="15 min"
                    description="Entrenamiento intensivo diario"
                    icon={<Timer className="w-6 h-6 text-green-600" />}
                    blocks={[
                      "2min Par/Impar",
                      "5min Shuttle",
                      "4min Palabras Gemelas", 
                      "4min Recuerda Nº"
                    ]}
                    onClick={() => setSessionTemplate('15min')}
                  />

                  <SessionCard
                    title="Sesión Estándar"
                    duration="30 min"
                    description="Entrenamiento completo balanceado"
                    icon={<Calendar className="w-6 h-6 text-blue-600" />}
                    blocks={[
                      "3min Par/Impar",
                      "10min Shuttle",
                      "7min Palabras Gemelas",
                      "5min Recuerda Nº",
                      "5min Resumen"
                    ]}
                    onClick={() => setSessionTemplate('30min')}
                  />

                  <SessionCard
                    title="Sesión Completa"
                    duration="60 min"
                    description="Entrenamiento intensivo profesional"
                    icon={<Trophy className="w-6 h-6 text-purple-600" />}
                    blocks={[
                      "5min Par/Impar",
                      "20min Shuttle",
                      "10min Palabras Gemelas",
                      "10min Recuerda Nº",
                      "10min Shuttle Extra",
                      "5min Cooldown"
                    ]}
                    onClick={() => setSessionTemplate('60min')}
                  />
                </div>

                <SessionInfoCard />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <StatsPanel />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsPanel />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <AchievementsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Game Card Component
function GameCard({ title, description, icon, badges, features, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full" onClick={onClick}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
            <div className="flex gap-2 flex-wrap">
              {badges.map((badge, index) => (
                <Badge key={index} variant="secondary">{badge}</Badge>
              ))}
            </div>
            <div className="space-y-1">
              {features.map((feature, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  • {feature}
                </div>
              ))}
            </div>
            <Button className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Comenzar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Session Card Component  
function SessionCard({ title, duration, description, icon, blocks, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full" onClick={onClick}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-3xl font-bold text-center text-blue-600">
              {duration}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {description}
            </p>
            <div className="space-y-1">
              {blocks.map((block, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  • {block}
                </div>
              ))}
            </div>
            <Button className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Iniciar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Quick Stats Card Component
function QuickStatsCard() {
  const { stats } = useAppStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Estadísticas Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">WPM Promedio</span>
          <span className="font-medium">{stats.averageWpm}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Comprensión</span>
          <span className="font-medium">{stats.averageComprehension}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Racha</span>
          <span className="font-medium">{stats.streak} días</span>
        </div>
        <Progress value={(stats.xp % 100)} className="h-2" />
        <div className="text-xs text-muted-foreground text-center">
          {stats.xp % 100}/100 XP al siguiente nivel
        </div>
      </CardContent>
    </Card>
  )
}

// Reading Controls Card Component
function ReadingControlsCard() {
  const { wpm, setWpm } = useRSVPStore()
  const { settings } = useAppStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Controles RSVP</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Velocidad (WPM)</label>
          <div className="flex items-center space-x-2 mt-1">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setWpm(Math.max(50, wpm - 25))}
            >
              -25
            </Button>
            <span className="font-mono text-sm min-w-[60px] text-center">{wpm}</span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setWpm(Math.min(1000, wpm + 25))}
            >
              +25
            </Button>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline">
              <Timer className="w-4 h-4 mr-1" />
              Test
            </Button>
            <Button size="sm" variant="outline">
              <Target className="w-4 h-4 mr-1" />
              Meta
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Adaptive System Info Card
function AdaptiveSystemCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <Target className="w-12 h-12 mx-auto text-blue-600" />
          <h3 className="text-lg font-semibold">Sistema Adaptativo 3-down/1-up</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Todos los juegos utilizan dificultad adaptativa basada en tu rendimiento. 
            El sistema ajusta automáticamente la dificultad para mantener ~79% de aciertos, 
            optimizando tu zona de flow y aprendizaje.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">3↗</div>
              <div className="text-sm text-muted-foreground">Aciertos → Sube</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">1↘</div>
              <div className="text-sm text-muted-foreground">Fallo → Baja</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">79%</div>
              <div className="text-sm text-muted-foreground">Objetivo</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Session Info Card
function SessionInfoCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <Calendar className="w-12 h-12 mx-auto text-blue-600" />
          <h3 className="text-lg font-semibold">Sesiones Programadas</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Las sesiones combinan múltiples ejercicios en secuencia optimizada. 
            Cada juego mantiene su dificultad adaptativa individual y el progreso 
            se guarda automáticamente.
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
  )
}

// Achievements Panel Component
function AchievementsPanel() {
  const { stats } = useAppStore()
  
  const achievements = [
    {
      id: 'first_session',
      title: 'Primera Lectura',
      description: 'Completa tu primera sesión de lectura',
      icon: Book,
      unlocked: stats.totalSessions >= 1
    },
    {
      id: 'speed_demon',
      title: 'Demonio de Velocidad',
      description: 'Alcanza 500 WPM',
      icon: Zap,
      unlocked: stats.averageWpm >= 500
    },
    {
      id: 'week_streak',
      title: 'Semana Constante',
      description: 'Mantén una racha de 7 días',
      icon: Trophy,
      unlocked: stats.streak >= 7
    },
    {
      id: 'brain_trainer',
      title: 'Entrenador Cerebral',
      description: 'Completa 50 ejercicios adaptativos',
      icon: Brain,
      unlocked: stats.totalSessions >= 50
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map((achievement) => (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className={`${achievement.unlocked ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <achievement.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{achievement.title}</h3>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
              </div>
              {achievement.unlocked && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  Desbloqueado
                </Badge>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}