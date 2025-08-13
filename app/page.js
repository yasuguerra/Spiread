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
  BarChart3
} from 'lucide-react'

import { useAppStore, useRSVPStore } from '@/lib/store'
import { initializeDatabase, createAnonymousSession } from '@/lib/supabase'

// Import components
import RSVPReader from '@/components/RSVPReader'
import OnboardingTest from '@/components/OnboardingTest'
import CampayoTraining from '@/components/CampayoTraining'
import StatsPanel from '@/components/StatsPanel'
import SettingsPanel from '@/components/SettingsPanel'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('onboarding')
  const [isLoading, setIsLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(true)
  
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
          setActiveTab('reader')
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
    setActiveTab('reader')
    
    // Update settings with initial baseline
    updateSettings({
      wpmTarget: results.wpm + 50 // Set target 50 WPM higher than baseline
    })
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
          <p className="text-lg text-muted-foreground">Iniciando Campayo Spreeder Pro...</p>
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
                Campayo Spreeder Pro
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="reader" className="flex items-center gap-2">
              <Book className="w-4 h-4" />
              <span className="hidden sm:inline">Lector</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Campayo</span>
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
            <CampayoTraining />
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
  const { settings, updateSettings } = useAppStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Controles de Lectura</CardTitle>
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
              Test Rápido
            </Button>
            <Button size="sm" variant="outline">
              <Target className="w-4 h-4 mr-1" />
              Objetivo
            </Button>
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
      id: 'comprehension_master',
      title: 'Maestro de Comprensión',
      description: 'Mantén 90% de comprensión promedio',
      icon: Brain,
      unlocked: stats.averageComprehension >= 90
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