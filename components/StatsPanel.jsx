'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, TrendingUp, Target, Trophy, Flame, Star, Zap, Brain, 
  Grid3x3, CheckCircle, Timer, Eye, Play, MessageSquare
} from 'lucide-react'
import { getUserStats, calculateLevel, getXpToNextLevel } from '@/lib/gamification'
import { useAppStore } from '@/lib/store'
import ProgressChart from './ProgressChart'

// Game configurations for tabs
const GAME_CONFIGS = {
  overview: {
    title: 'General',
    icon: BarChart3,
    color: 'text-blue-500'
  },
  // Legacy games
  schulte: {
    title: 'Schulte Table',
    icon: Grid3x3,
    color: 'text-green-500'
  },
  twin_words: {
    title: 'Twin Words',
    icon: Eye,
    color: 'text-purple-500'
  },
  par_impar: {
    title: 'Par/Impar',
    icon: CheckCircle,
    color: 'text-orange-500'
  },
  memory_digits: {
    title: 'Memoria',
    icon: Brain,
    color: 'text-pink-500'
  },
  // Phase 3 games
  running_words: {
    title: 'Running Words',
    icon: Timer,
    color: 'text-orange-600'
  },
  letters_grid: {
    title: 'Letters Grid',
    icon: Grid3x3,
    color: 'text-green-600'
  },
  word_search: {
    title: 'Word Search',
    icon: Eye,
    color: 'text-blue-600'
  },
  anagrams: {
    title: 'Anagramas',
    icon: Brain,
    color: 'text-purple-600'
  },
  // Reading & AI
  rsvp: {
    title: 'RSVP',
    icon: Zap,
    color: 'text-yellow-500'
  },
  reading_quiz: {
    title: 'Quiz IA',
    icon: MessageSquare,
    color: 'text-indigo-500'
  }
}

export default function StatsPanel() {
  const { userProfile } = useAppStore()
  const [stats, setStats] = useState({
    profile: { xp: 0, level: 1 },
    streak: { current: 0, longest: 0 },
    achievements: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [gameStats, setGameStats] = useState({})
  const [progressData, setProgressData] = useState({})

  useEffect(() => {
    if (userProfile?.id) {
      loadUserStats()
      loadGameStats()
      loadProgressData()
    } else {
      setLoading(false)
    }
  }, [userProfile?.id])

  const loadUserStats = async () => {
    try {
      const userStats = await getUserStats(userProfile.id)
      setStats(userStats)
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  const loadGameStats = async () => {
    try {
      // Load game statistics from progress API
      const response = await fetch(`/api/progress/get?userId=${userProfile.id}`)
      if (response.ok) {
        const data = await response.json()
        setProgressData(data.progress || {})
      }
    } catch (error) {
      console.error('Error loading game stats:', error)
    }
  }

  const loadProgressData = async () => {
    try {
      // This would typically load from game_runs table for chart data
      // For now, mock some basic stats
      setGameStats({
        totalSessions: 0,
        totalGames: 0,
        averageScore: 0
      })
    } catch (error) {
      console.error('Error loading progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const xpProgress = stats.profile.xp % 1000
  const xpToNext = getXpToNextLevel(stats.profile.xp)

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12">
          {Object.entries(GAME_CONFIGS).map(([key, config]) => {
            const Icon = config.icon
            return (
              <TabsTrigger key={key} value={key} className="text-xs">
                <Icon className={`w-3 h-3 mr-1 ${config.color}`} />
                <span className="hidden sm:inline">{config.title}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* XP and Level Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Nivel & XP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">Nivel {stats.profile.level}</span>
                    <Badge variant="secondary">{stats.profile.xp} XP</Badge>
                  </div>
                  <Progress value={(xpProgress / 1000) * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {xpToNext} XP hasta el siguiente nivel
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Racha
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{stats.streak.current} días</div>
                  <p className="text-sm text-muted-foreground">
                    Récord: {stats.streak.longest} días
                  </p>
                  {stats.streak.current === 0 && (
                    <Badge variant="outline" className="text-xs">
                      ¡Completa un entrenamiento hoy!
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Logros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.achievements.length}</div>
                <p className="text-sm text-muted-foreground">
                  {stats.achievements.length === 0 
                    ? 'Sin logros aún' 
                    : `${stats.achievements.length} desbloqueados`
                  }
                </p>
                {stats.achievements.length > 0 && stats.achievements[0] && (
                  <Badge variant="secondary" className="text-xs mt-2">
                    Último: {stats.achievements[0].title}
                  </Badge>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Progreso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(progressData).length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Juegos jugados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Achievements Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Logros Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.achievements.slice(0, 6).map((achievement, index) => (
                    <div 
                      key={achievement.achievement_type || index}
                      className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                    >
                      <div className="text-2xl">{achievement.icon || '🏆'}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{achievement.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>¡Completa entrenamientos para desbloquear logros!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Progress Overview */}
          <Card data-testid="stats-chart">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Progreso por Juego
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Object.entries(GAME_CONFIGS)
                  .filter(([key]) => key !== 'overview')
                  .map(([gameKey, config]) => {
                    const Icon = config.icon
                    const gameProgress = progressData[gameKey]
                    const lastLevel = gameProgress?.lastLevel || 1
                    const lastBestScore = gameProgress?.lastBestScore || 0
                    
                    return (
                      <div 
                        key={gameKey}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedTab(gameKey)}
                      >
                        <Icon className={`w-5 h-5 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{config.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Nivel {lastLevel} • {lastBestScore} pts
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual Game Tabs */}
        {Object.entries(GAME_CONFIGS)
          .filter(([key]) => key !== 'overview')
          .map(([gameKey, config]) => (
            <TabsContent key={gameKey} value={gameKey}>
              <ProgressChart 
                userId={userProfile?.id}
                gameType={gameKey}
                gameTitle={config.title}
                currentLevel={progressData[gameKey]?.lastLevel || 1}
                bestScore={progressData[gameKey]?.lastBestScore || 0}
              />
            </TabsContent>
          ))}
      </Tabs>
    </div>
  )
}