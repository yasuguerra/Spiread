'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Trophy, Star, Lock, ArrowLeft } from 'lucide-react'
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

export default function AchievementsPage() {
  const [userAchievements, setUserAchievements] = useState<UserAchievements | null>(null)
  const [overallProgress, setOverallProgress] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    const achievements = getUserAchievements()
    const progress = getOverallProgress()
    setUserAchievements(achievements)
    setOverallProgress(progress)
  }, [])

  if (!userAchievements || !overallProgress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="text-lg">Cargando logros...</div>
          </div>
        </div>
      </div>
    )
  }

  const categories = ['all', 'speed', 'accuracy', 'endurance', 'mastery', 'exploration']
  const filteredAchievements = selectedCategory === 'all' 
    ? ACHIEVEMENTS 
    : ACHIEVEMENTS.filter(achievement => achievement.category === selectedCategory)

  const earnedBadges = userAchievements.earnedBadges
  const totalEarned = earnedBadges.length
  const totalAchievements = ACHIEVEMENTS.length
  const completionPercentage = (totalEarned / totalAchievements) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🏆 Logros
            </h1>
            <p className="text-gray-600 mb-6">
              Desbloquea insignias completando desafíos y mejorando tus habilidades
            </p>
            
            {/* Progress Overview */}
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {totalEarned} / {totalAchievements}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">Logros desbloqueados</div>
                  <Progress {...{ value: completionPercentage } as any} className="mb-2" />
                  <div className="text-xs text-gray-500">
                    {completionPercentage.toFixed(1)}% completado
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category === 'all' ? 'Todos' : 
               category === 'speed' ? 'Velocidad' :
               category === 'accuracy' ? 'Precisión' :
               category === 'endurance' ? 'Resistencia' :
               category === 'mastery' ? 'Maestría' :
               category === 'exploration' ? 'Exploración' : category}
            </Button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement, index) => {
            const isEarned = earnedBadges.includes(achievement.id)
            const progress = getAchievementProgress(achievement, overallProgress)
            const isPartiallyComplete = progress > 0 && progress < 1

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full transition-all duration-200 hover:shadow-lg ${
                  isEarned ? 'ring-2 ring-yellow-400 bg-yellow-50' : 
                  isPartiallyComplete ? 'ring-1 ring-blue-300 bg-blue-50' : 
                  'hover:shadow-md'
                }`}>
                  <CardContent className="p-6">
                    <div className="text-center">
                      {/* Icon and Lock */}
                      <div className="relative mb-4">
                        <div className={`text-4xl mb-2 transition-all duration-200 ${
                          isEarned ? 'scale-110' : 'grayscale opacity-50'
                        }`}>
                          {isEarned ? achievement.icon : '🔒'}
                        </div>
                        
                        {isEarned && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1"
                          >
                            <div className="bg-yellow-400 rounded-full p-1">
                              <Star className="w-3 h-3 text-yellow-800 fill-current" />
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Title and Description */}
                      <h3 className={`font-bold mb-2 ${isEarned ? 'text-gray-900' : 'text-gray-500'}`}>
                        {achievement.name}
                      </h3>
                      <p className={`text-sm mb-4 ${isEarned ? 'text-gray-700' : 'text-gray-400'}`}>
                        {achievement.description}
                      </p>

                      {/* Progress Bar for partial completion */}
                      {isPartiallyComplete && (
                        <div className="mb-4">
                          <Progress {...{ value: progress * 100 } as any} className="mb-1" />
                          <div className="text-xs text-gray-500">
                            {(progress * 100).toFixed(0)}% completado
                          </div>
                        </div>
                      )}

                      {/* Category and Rarity Badges */}
                      <div className="flex justify-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryIcon(achievement.category)} {
                            achievement.category === 'speed' ? 'Velocidad' :
                            achievement.category === 'accuracy' ? 'Precisión' :
                            achievement.category === 'endurance' ? 'Resistencia' :
                            achievement.category === 'mastery' ? 'Maestría' :
                            achievement.category === 'exploration' ? 'Exploración' : 
                            achievement.category
                          }
                        </Badge>
                        <Badge className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                          {achievement.rarity === 'common' ? 'Común' :
                           achievement.rarity === 'rare' ? 'Raro' :
                           achievement.rarity === 'epic' ? 'Épico' :
                           achievement.rarity === 'legendary' ? 'Legendario' :
                           achievement.rarity}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Stats Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center">Resumen de Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{overallProgress.totalSessions}</div>
                <div className="text-sm text-gray-600">Sesiones totales</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(overallProgress.totalTimePlayed / 3600)}h
                </div>
                <div className="text-sm text-gray-600">Tiempo jugado</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {(overallProgress.avgAccuracy * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Precisión promedio</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{totalEarned}</div>
                <div className="text-sm text-gray-600">Logros desbloqueados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>¡Sigue entrenando para desbloquear más logros!</p>
        </div>
      </div>
    </div>
  )
}
