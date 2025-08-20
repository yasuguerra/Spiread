'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
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
import { APP_NAME } from '@/lib/constants'

// Import only essential components immediately
import GamificationHeader from '@/components/GamificationHeader'
import AppFooter from '@/components/AppFooter'

// Lazy load ALL heavy components 
const RSVPReader = lazy(() => import('@/components/RSVPReader'))
const StatsPanel = lazy(() => import('@/components/StatsPanel'))
const SettingsPanel = lazy(() => import('@/components/SettingsPanel'))
const SessionRunner = lazy(() => import('@/components/SessionRunner'))

export default function DebugMainPage() {
  const [activeTab, setActiveTab] = useState('training')
  const [isLoading, setIsLoading] = useState(false)
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

  // Mock some basic stats to test the interface
  useEffect(() => {
    if (stats.totalSessions === 0) {
      // Set some mock data to test the UI
      updateSettings({
        wpmTarget: 350,
        fontSize: 18,
        backgroundColor: '#ffffff'
      })
    }
  }, [])

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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Iniciando {APP_NAME}...</p>
        </div>
      </div>
    )
  }

  // If in session mode
  if (sessionTemplate) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando sesión...</p>
          </div>
        </div>
      }>
        <SessionRunner 
          template={sessionTemplate} 
          onSessionComplete={handleSessionComplete} 
        />
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 hover:scale-105 transition-transform">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {APP_NAME} - DEBUG
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="hidden sm:flex">
              <TrendingUp className="w-3 h-3 mr-1" />
              {stats.averageWpm || 250} WPM
            </Badge>
            <Badge variant="outline" className="hidden sm:flex">
              <Trophy className="w-3 h-3 mr-1" />
              Nivel {stats.level || 1}
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
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Sesiones</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reader" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lector RSVP - DEBUG</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                }>
                  <RSVPReader onViewStats={() => setActiveTab('stats')} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Entrenamiento - DEBUG MODE</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  🔧 Modo debug activo - Los juegos aparecerían aquí
                </p>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm">
                    <strong>Debug Info:</strong><br/>
                    - ActiveTab: {activeTab}<br/>
                    - Stats Total Sessions: {stats.totalSessions}<br/>
                    - Settings WPM Target: {settings.wpmTarget}<br/>
                    - User Profile: {userProfile ? 'Loaded' : 'Not loaded'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <Suspense fallback={
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            }>
              <StatsPanel />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Suspense fallback={
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            }>
              <SettingsPanel />
            </Suspense>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sesiones - DEBUG</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  🔧 Las sesiones de entrenamiento aparecerían aquí
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AppFooter />
    </div>
  )
}
