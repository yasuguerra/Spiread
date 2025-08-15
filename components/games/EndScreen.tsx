'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Trophy, 
  RotateCcw, 
  Home, 
  BarChart3, 
  TrendingUp,
  Star,
  Target,
  Clock
} from 'lucide-react'
import MiniSparkline from './MiniSparkline'

interface EndScreenProps {
  gameKey: string
  gameName: string
  isOpen: boolean
  score: number
  level: number
  bestScore: number
  duration: number // in seconds
  historicalData?: Array<{ score: number; date: string }>
  onPlayAgain: () => void
  onBackToGames: () => void
  onViewStats: () => void
  language?: 'es' | 'en'
}

export default function EndScreen({
  gameKey,
  gameName,
  isOpen,
  score,
  level,
  bestScore,
  duration,
  historicalData = [],
  onPlayAgain,
  onBackToGames,
  onViewStats,
  language = 'es'
}: EndScreenProps) {
  const [showDetails, setShowDetails] = useState(false)

  const labels = {
    es: {
      title: '¡Sesión Completada!',
      score: 'Puntuación',
      level: 'Nivel Alcanzado',
      best: 'Mejor Puntuación',
      duration: 'Duración',
      newBest: '¡Nuevo Récord!',
      progress: 'Progreso (7 días)',
      playAgain: 'Jugar de Nuevo',
      backToGames: 'Volver a Juegos',
      viewStats: 'Ver Estadísticas',
      showDetails: 'Ver Detalles',
      hideDetails: 'Ocultar Detalles',
      performance: 'Rendimiento',
      avgScore: 'Puntuación Media',
      trend: 'Tendencia',
      sessions: 'sesiones',
      seconds: 'segundos'
    },
    en: {
      title: 'Session Complete!',
      score: 'Score',
      level: 'Level Reached',
      best: 'Best Score',
      duration: 'Duration',
      newBest: 'New Record!',
      progress: 'Progress (7 days)',
      playAgain: 'Play Again',
      backToGames: 'Back to Games',
      viewStats: 'View Statistics',
      showDetails: 'Show Details',
      hideDetails: 'Hide Details',
      performance: 'Performance',
      avgScore: 'Average Score',
      trend: 'Trend',
      sessions: 'sessions',
      seconds: 'seconds'
    }
  }[language]

  const isNewBest = score > bestScore && bestScore > 0
  const hasHistoricalData = historicalData.length > 0

  // Calculate performance metrics
  const avgScore = hasHistoricalData 
    ? Math.round(historicalData.reduce((sum, d) => sum + d.score, 0) / historicalData.length)
    : score

  const scorePercentile = bestScore > 0 ? Math.round((score / Math.max(bestScore, score)) * 100) : 100

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBackToGames()
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onPlayAgain()
      } else if (e.key === 's' || e.key === 'S') {
        onViewStats()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onPlayAgain, onBackToGames, onViewStats])

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-describedby="end-screen-description"
        data-testid="end-screen"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-xl">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isNewBest 
                ? 'bg-yellow-100 dark:bg-yellow-900' 
                : 'bg-green-100 dark:bg-green-900'
            }`}>
              {isNewBest ? (
                <Star className="w-5 h-5 text-yellow-600" />
              ) : (
                <Trophy className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div>
              <div>{labels.title}</div>
              <div className="text-sm font-normal text-muted-foreground mt-1">
                {gameName}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div id="end-screen-description" className="space-y-6">
          
          {/* New best notification */}
          {isNewBest && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    {labels.newBest}
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {language === 'es' 
                      ? `Superaste tu récord anterior de ${bestScore} puntos`
                      : `You beat your previous record of ${bestScore} points`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {score}
                </div>
                <div className="text-sm text-muted-foreground">
                  {labels.score}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {level}
                </div>
                <div className="text-sm text-muted-foreground">
                  {labels.level}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600 mb-1">
                  {Math.max(bestScore, score)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {labels.best}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {duration}s
                </div>
                <div className="text-sm text-muted-foreground">
                  {labels.duration}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress chart */}
          {hasHistoricalData && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>{labels.progress}</span>
                  </h3>
                  <Badge variant="secondary">
                    {historicalData.length} {labels.sessions}
                  </Badge>
                </div>
                
                  <div className="relative">
                    <MiniSparkline 
                      data={historicalData}
                      height={80}
                      color="#3b82f6"
                      className="mb-4"
                      data-testid="mini-sparkline"
                    />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{labels.avgScore}:</span>
                      <span className="font-medium">{avgScore}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{labels.performance}:</span>
                      <span className="font-medium">{scorePercentile}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed stats (collapsible) */}
          {hasHistoricalData && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full justify-between"
              >
                <span>{showDetails ? labels.hideDetails : labels.showDetails}</span>
                <BarChart3 className="w-4 h-4" />
              </Button>
              
              {showDetails && (
                <Card className="mt-3">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">
                          {language === 'es' ? 'Sesiones jugadas' : 'Sessions played'}
                        </div>
                        <div className="font-medium">{historicalData.length}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          {language === 'es' ? 'Mejor racha' : 'Best streak'}
                        </div>
                        <div className="font-medium">
                          {Math.max(...historicalData.map(d => d.score))}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          {language === 'es' ? 'Mejora total' : 'Total improvement'}
                        </div>
                        <div className="font-medium">
                          +{score - (historicalData[0]?.score || 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">
                          {language === 'es' ? 'Nivel máximo' : 'Max level'}
                        </div>
                        <div className="font-medium">{level}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
            <Button 
              onClick={onPlayAgain}
              className="flex-1 flex items-center justify-center space-x-2"
              autoFocus
              data-testid="btn-retry"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{labels.playAgain}</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onBackToGames}
              className="flex-1 flex items-center justify-center space-x-2"
              data-testid="btn-back-to-games"
            >
              <Home className="w-4 h-4" />
              <span>{labels.backToGames}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={onViewStats}
              className="flex items-center justify-center space-x-2"
              data-testid="btn-to-stats"
            >
              <BarChart3 className="w-4 h-4" />
              <span>{labels.viewStats}</span>
            </Button>
          </div>

          {/* Keyboard shortcuts info */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <div>
              {language === 'es' ? 'Atajos de teclado:' : 'Keyboard shortcuts:'} 
              <strong className="ml-1">ENTER</strong> - {labels.playAgain} | 
              <strong className="ml-1">ESC</strong> - {labels.backToGames} | 
              <strong className="ml-1">S</strong> - {labels.viewStats}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}