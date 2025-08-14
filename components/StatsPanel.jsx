'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BarChart3, TrendingUp, Target, Trophy, Flame, Star, Zap } from 'lucide-react'
import { getUserStats, calculateLevel, getXpToNextLevel } from '@/lib/gamification'

export default function StatsPanel() {
  const [stats, setStats] = useState({
    profile: { xp: 0, level: 1 },
    streak: { current: 0, longest: 0 },
    achievements: []
  })
  const [loading, setLoading] = useState(true)

  // Mock user ID - in production, get from auth context
  const userId = '550e8400-e29b-41d4-a716-446655440000'

  useEffect(() => {
    loadUserStats()
  }, [])

  const loadUserStats = async () => {
    try {
      const userStats = await getUserStats(userId)
      setStats(userStats)
    } catch (error) {
      console.error('Error loading user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const xpProgress = stats.profile.xp % 1000
  const xpToNext = getXpToNextLevel(stats.profile.xp)
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Progreso WPM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">250 WPM</div>
            <p className="text-sm text-muted-foreground">Velocidad actual</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Comprensión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-sm text-muted-foreground">Promedio</p>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              <div>
                <div className="font-medium">12</div>
                <div className="text-xs text-muted-foreground">Sesiones</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              <div>
                <div className="font-medium">47</div>
                <div className="text-xs text-muted-foreground">Juegos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <div>
                <div className="font-medium">{stats.achievements.length}</div>
                <div className="text-xs text-muted-foreground">Logros</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <div>
                <div className="font-medium">{Math.floor(stats.profile.xp / 100)}</div>
                <div className="text-xs text-muted-foreground">Puntos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}