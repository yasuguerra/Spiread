'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Trophy, Flame, Star, TrendingUp } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { getUserStats, calculateLevel, getXpToNextLevel } from '@/lib/gamification'

export default function GamificationHeader() {
  const { userProfile } = useAppStore()
  const [stats, setStats] = useState({
    profile: { xp: 0, level: 1 },
    streak: { current: 0, longest: 0 },
    achievements: []
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load user stats
  useEffect(() => {
    const loadStats = async () => {
      if (!userProfile?.id) {
        setIsLoading(false)
        return
      }

      try {
        const userStats = await getUserStats(userProfile.id)
        setStats(userStats)
      } catch (error) {
        console.error('Error loading gamification stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [userProfile?.id])

  // Update stats when userProfile changes (for real-time updates)
  useEffect(() => {
    if (userProfile?.xp !== undefined) {
      setStats(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          xp: userProfile.xp,
          level: calculateLevel(userProfile.xp)
        }
      }))
    }
  }, [userProfile?.xp])

  if (isLoading || !userProfile?.id) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 bg-background border-b">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="w-24 h-2 bg-gray-200 rounded animate-pulse" />
        <div className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  const { xp, level } = stats.profile
  const xpToNext = getXpToNextLevel(xp)
  const xpForCurrentLevel = (level - 1) * 1000
  const xpInCurrentLevel = xp - xpForCurrentLevel
  const xpProgressPercent = (xpInCurrentLevel / 1000) * 100

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b" data-testid="header-gamification">
        <div className="flex items-center gap-6">
          {/* Level & XP */}
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm">
                    {level}
                  </div>
                  <div className="text-sm font-semibold text-blue-900">
                    Nivel {level}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Nivel actual: {level}</p>
                <p>XP total: {xp.toLocaleString()}</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Progress 
                  value={xpProgressPercent} 
                  className="w-24 h-2"
                  data-testid="xp-bar"
                />
                <span className="text-xs text-muted-foreground min-w-0">
                  {xpToNext} XP
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {xpInCurrentLevel.toLocaleString()}/1,000 XP
              </div>
            </div>
          </div>

          {/* Daily Streak */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={stats.streak.current > 0 ? "default" : "secondary"}
                className={`flex items-center gap-1 ${
                  stats.streak.current > 0 
                    ? "bg-orange-500 hover:bg-orange-600" 
                    : "bg-gray-200 text-gray-600"
                }`}
                data-testid="streak-badge"
              >
                <Flame className="w-3 h-3" />
                <span className="font-medium">{stats.streak.current}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Racha actual: {stats.streak.current} días</p>
              <p>Mejor racha: {stats.streak.longest} días</p>
              {stats.streak.current === 0 && (
                <p className="text-yellow-600">¡Completa un entrenamiento hoy!</p>
              )}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Recent Achievement or Stats */}
        <div className="flex items-center gap-3">
          {stats.achievements.length > 0 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full">
                  <Trophy className="w-3 h-3 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-800">
                    {stats.achievements.length}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logros desbloqueados: {stats.achievements.length}</p>
                {stats.achievements[0] && (
                  <p className="text-yellow-600">
                    Último: {stats.achievements[0].title}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
              <Star className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">Sin logros</span>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>+{Math.min(300, Math.max(0, userProfile.lastScore || 0))} XP</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}