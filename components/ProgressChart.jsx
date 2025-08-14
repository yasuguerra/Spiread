'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import { getHistoricalScores, processScoresForChart } from '@/lib/progress-tracking'

const TIME_FILTERS = {
  WEEK: { days: 7, label: '7 días' },
  MONTH: { days: 30, label: '30 días' },
  QUARTER: { days: 90, label: '90 días' }
}

export default function ProgressChart({ userId = 'anonymous', gameType, gameTitle, currentLevel = 1 }) {
  const [selectedFilter, setSelectedFilter] = useState('MONTH')
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    bestScore: 0,
    averageScore: 0,
    totalSessions: 0,
    improvement: 0
  })

  useEffect(() => {
    loadChartData()
  }, [gameType, selectedFilter, userId])

  const loadChartData = async () => {
    setLoading(true)
    try {
      const days = TIME_FILTERS[selectedFilter].days
      const historicalData = await getHistoricalScores(userId, gameType, days)
      
      if (historicalData.length === 0) {
        setChartData([])
        setStats({
          bestScore: 0,
          averageScore: 0,
          totalSessions: 0,
          improvement: 0
        })
        return
      }

      // Process data for chart
      const processedData = processScoresForChart(historicalData, days)
      
      // Convert to chart format
      const chartPoints = processedData.labels.map((label, index) => ({
        date: label,
        score: processedData.data[index],
        originalIndex: index
      })).filter(point => point.score !== null)

      setChartData(chartPoints)

      // Calculate stats
      const scores = historicalData.map(item => item.score).filter(score => score > 0)
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0
      const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
      
      // Calculate improvement (comparing first vs last quartile)
      let improvement = 0
      if (scores.length >= 4) {
        const quartileSize = Math.floor(scores.length / 4)
        const firstQuartile = scores.slice(0, quartileSize)
        const lastQuartile = scores.slice(-quartileSize)
        
        const firstAvg = firstQuartile.reduce((sum, score) => sum + score, 0) / firstQuartile.length
        const lastAvg = lastQuartile.reduce((sum, score) => sum + score, 0) / lastQuartile.length
        
        improvement = ((lastAvg - firstAvg) / firstAvg) * 100
      }

      setStats({
        bestScore: Math.round(bestScore),
        averageScore: Math.round(averageScore),
        totalSessions: historicalData.length,
        improvement: Math.round(improvement)
      })

    } catch (error) {
      console.error('Error loading chart data:', error)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  const formatTooltipValue = (value, name) => {
    if (name === 'score') {
      return [value, 'Puntuación']
    }
    return [value, name]
  }

  const formatTooltipLabel = (label) => {
    return `Fecha: ${label}`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {gameTitle} - Progreso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            {gameTitle} - Progreso
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Nivel {currentLevel}
            </Badge>
          </div>
        </div>
        
        {/* Time filter buttons */}
        <div className="flex gap-2">
          {Object.entries(TIME_FILTERS).map(([key, filter]) => (
            <Button
              key={key}
              variant={selectedFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter(key)}
            >
              <Calendar className="w-3 h-3 mr-1" />
              {filter.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.bestScore}</div>
            <div className="text-sm text-muted-foreground">Mejor Puntuación</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.averageScore}</div>
            <div className="text-sm text-muted-foreground">Promedio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalSessions}</div>
            <div className="text-sm text-muted-foreground">Sesiones</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              stats.improvement >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.improvement >= 0 ? '+' : ''}{stats.improvement}%
            </div>
            <div className="text-sm text-muted-foreground">Mejora</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <Tooltip
                  formatter={formatTooltipValue}
                  labelFormatter={formatTooltipLabel}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ccc',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                  tension={0.3}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <BarChart3 className="w-12 h-12 mx-auto opacity-50" />
                <div className="font-medium">No hay datos disponibles</div>
                <div className="text-sm">
                  Juega algunas partidas para ver tu progreso aquí
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Insights */}
        {chartData.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-900 mb-2">
              Análisis del Rendimiento
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              {stats.improvement > 10 && (
                <div>✨ ¡Excelente mejora! Tu rendimiento ha aumentado {stats.improvement}% en este período.</div>
              )}
              {stats.improvement > 0 && stats.improvement <= 10 && (
                <div>📈 Progreso constante. Has mejorado {stats.improvement}% gradualmente.</div>
              )}
              {stats.improvement === 0 && (
                <div>🎯 Rendimiento estable. Mantén la consistencia para seguir mejorando.</div>
              )}
              {stats.improvement < 0 && (
                <div>💡 Oportunidad de mejora. Considera ajustar tu estrategia de entrenamiento.</div>
              )}
              {stats.totalSessions >= 10 && (
                <div>🏆 ¡Gran dedicación! Has completado {stats.totalSessions} sesiones de entrenamiento.</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}