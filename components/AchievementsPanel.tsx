'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Trophy, Star, Lock, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ACHIEVEMENTS, 
  Badge as AchievementBadge,
  getRarityColor, 
  getCategoryIcon,
  getAchievementProgress 
} from '@/lib/achievements'
import { 
  getUserAchievements, 
  getOverallProgress,
  type UserAchievements 
} from '@/lib/progress-tracking'

export default function AchievementsPanel() {
  const [userAchievements, setUserAchievements] = useState<UserAchievements | null>(null)
  const [overallProgress, setOverallProgress] = useState<any>(null)

  useEffect(() => {
    const achievements = getUserAchievements()
    const progress = getOverallProgress()
    setUserAchievements(achievements)
    setOverallProgress(progress)
  }, [])

  if (!userAchievements || !overallProgress) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="text-lg">Cargando logros...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const earnedBadges = userAchievements.earnedBadges
  const totalEarned = earnedBadges.length
  const totalAchievements = ACHIEVEMENTS.length
  const completionPercentage = (totalEarned / totalAchievements) * 100

  // Show only a preview of achievements
  const recentAchievements = ACHIEVEMENTS.slice(0, 6)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Logros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {totalEarned} / {totalAchievements}
              </div>
              <div className="text-sm text-gray-600 mb-4">Logros desbloqueados</div>
              <Progress {...{ value: completionPercentage } as any} className="mb-2" />
              <div className="text-xs text-gray-500">
                {completionPercentage.toFixed(1)}% completado
              </div>
            </div>

            {/* Recent Achievements Preview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {recentAchievements.map((achievement) => {
                const isEarned = earnedBadges.includes(achievement.id)
                const progress = getAchievementProgress(achievement, overallProgress)
                const isPartiallyComplete = progress > 0 && progress < 1

                return (
                  <motion.div
                    key={achievement.id}
                    className={`p-4 border rounded-lg text-center transition-all duration-200 ${
                      isEarned ? 'ring-2 ring-yellow-400 bg-yellow-50' : 
                      isPartiallyComplete ? 'ring-1 ring-blue-300 bg-blue-50' : 
                      'hover:shadow-sm'
                    }`}
                  >
                    <div className={`text-2xl mb-2 transition-all duration-200 ${
                      isEarned ? 'scale-110' : 'grayscale opacity-50'
                    }`}>
                      {isEarned ? achievement.icon : '🔒'}
                    </div>
                    
                    <h4 className={`font-medium text-sm mb-1 ${isEarned ? 'text-gray-900' : 'text-gray-500'}`}>
                      {achievement.name}
                    </h4>
                    
                    <p className={`text-xs mb-2 ${isEarned ? 'text-gray-700' : 'text-gray-400'}`}>
                      {achievement.description}
                    </p>

                    {/* Progress Bar for partial completion */}
                    {isPartiallyComplete && (
                      <div className="mb-2">
                        <Progress {...{ value: progress * 100 } as any} className="h-1" />
                        <div className="text-xs text-gray-500 mt-1">
                          {(progress * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}

                    {/* Rarity Badge */}
                    <Badge className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                      {achievement.rarity === 'common' ? 'Común' :
                       achievement.rarity === 'rare' ? 'Raro' :
                       achievement.rarity === 'epic' ? 'Épico' :
                       achievement.rarity === 'legendary' ? 'Legendario' :
                       achievement.rarity}
                    </Badge>
                  </motion.div>
                )
              })}
            </div>

            {/* View All Button */}
            <div className="text-center">
              <Link href="/achievements">
                <Button variant="outline" className="w-full sm:w-auto">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver todos los logros
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{overallProgress.totalSessions}</div>
                <div className="text-xs text-gray-600">Sesiones</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {Math.round(overallProgress.totalTimePlayed / 3600)}h
                </div>
                <div className="text-xs text-gray-600">Tiempo</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {(overallProgress.avgAccuracy * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Precisión</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{totalEarned}</div>
                <div className="text-xs text-gray-600">Logros</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
