'use client'

import { useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'

interface MiniSparklineProps {
  data?: Array<{ score: number; date: string }>
  height?: number
  color?: string
  showAxis?: boolean
  className?: string
}

export default function MiniSparkline({ 
  data = [], 
  height = 60, 
  color = '#3b82f6',
  showAxis = false,
  className = ''
}: MiniSparklineProps) {
  // Process data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Generate dummy flat line if no data
      return Array.from({ length: 7 }, (_, i) => ({
        index: i,
        score: 0,
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }))
    }

    // Sort by date and take last 7 entries
    const sortedData = [...data]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7)

    // Fill missing days with last known score or 0
    const result = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = targetDate.toISOString().split('T')[0]
      
      const dayData = sortedData.find(d => d.date === dateStr)
      result.push({
        index: 6 - i,
        score: dayData?.score || 0,
        date: dateStr
      })
    }

    return result
  }, [data])

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return 'neutral'
    
    const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2))
    const secondHalf = chartData.slice(Math.floor(chartData.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.score, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.score, 0) / secondHalf.length
    
    const difference = secondAvg - firstAvg
    const threshold = Math.max(firstAvg * 0.1, 1) // 10% change or minimum 1 point
    
    if (difference > threshold) return 'up'
    if (difference < -threshold) return 'down'
    return 'neutral'
  }, [chartData])

  const maxScore = useMemo(() => {
    return Math.max(...chartData.map(d => d.score), 1)
  }, [chartData])

  const trendColors = {
    up: '#10b981', // green
    down: '#ef4444', // red
    neutral: color
  }

  return (
    <div className={`relative ${className}`}>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            {showAxis && (
              <YAxis 
                domain={[0, maxScore]} 
                hide={true}
              />
            )}
            <Line
              type="monotone"
              dataKey="score"
              stroke={trendColors[trend]}
              strokeWidth={2}
              dot={false}
              activeDot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Trend indicator */}
      <div className="absolute -top-1 -right-1">
        <div className={`w-2 h-2 rounded-full ${
          trend === 'up' ? 'bg-green-500' : 
          trend === 'down' ? 'bg-red-500' : 
          'bg-gray-400'
        }`} />
      </div>
      
      {/* Data points info */}
      <div className="absolute -bottom-5 left-0 text-xs text-muted-foreground">
        {chartData.length} {chartData.length === 1 ? 'day' : 'days'}
      </div>
    </div>
  )
}