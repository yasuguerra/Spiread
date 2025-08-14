'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Trophy, Star, TrendingUp } from 'lucide-react'

export default function GamificationToasts({ notifications, onDismiss }) {
  const [visibleNotifications, setVisibleNotifications] = useState([])

  useEffect(() => {
    // Add new notifications with animation delay
    notifications.forEach((notification, index) => {
      if (!visibleNotifications.find(n => n.id === notification.id)) {
        setTimeout(() => {
          setVisibleNotifications(prev => [...prev, notification])
        }, index * 200)
      }
    })
  }, [notifications, visibleNotifications])

  const handleDismiss = (notificationId) => {
    setVisibleNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    )
    onDismiss?.(notificationId)
  }

  if (visibleNotifications.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3">
      {visibleNotifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onDismiss={() => handleDismiss(notification.id)}
        />
      ))}
    </div>
  )
}

function NotificationCard({ notification, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50)
    
    // Auto dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onDismiss, 300) // Wait for animation
    }, 5000)

    return () => {
      clearTimeout(timer)
      clearTimeout(dismissTimer)
    }
  }, [onDismiss])

  const getIcon = () => {
    switch (notification.type) {
      case 'achievement':
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 'levelup':
        return <Star className="w-5 h-5 text-blue-500" />
      case 'xp':
        return <TrendingUp className="w-5 h-5 text-green-500" />
      default:
        return <Trophy className="w-5 h-5 text-gray-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'achievement':
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200'
      case 'levelup':
        return 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
      case 'xp':
        return 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
    }
  }

  return (
    <div
      className={`transform transition-all duration-300 ease-out ${
        isVisible
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95'
      }`}
    >
      <Card className={`w-80 shadow-lg ${getBackgroundColor()}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">
                    {notification.title}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {notification.description}
                  </p>
                  
                  {notification.type === 'achievement' && notification.icon && (
                    <Badge variant="secondary" className="text-xs">
                      {notification.icon} {notification.achievement_type}
                    </Badge>
                  )}
                  
                  {notification.type === 'levelup' && (
                    <Badge variant="default" className="text-xs bg-blue-500">
                      Nivel {notification.newLevel}
                    </Badge>
                  )}
                  
                  {notification.type === 'xp' && notification.xpGain > 0 && (
                    <Badge variant="secondary" className="text-xs text-green-700">
                      +{notification.xpGain} XP
                    </Badge>
                  )}
                </div>
                
                <button
                  onClick={onDismiss}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
                  aria-label="Cerrar notificación"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}