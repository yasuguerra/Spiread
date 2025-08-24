'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Timer, Target } from 'lucide-react'
import { t } from '@/locales/es'

interface GameTopBarProps {
  onBack: () => void
  level: number
  timeLeftSec: number
  score?: number
}

/**
 * Shared GameTopBar component for games
 * Provides consistent header layout across all games
 * Fixed height to prevent layout shift when values change
 * Mobile-first design with responsive container
 */
export default function GameTopBar({ 
  onBack, 
  level, 
  timeLeftSec, 
  score 
}: GameTopBarProps) {
  
  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-[480px] mx-auto px-3 overflow-x-hidden">
      {/* Fixed height container to prevent layout shift */}
      <div className="h-16 flex items-center justify-between bg-white rounded-lg border shadow-sm px-4">
        
        {/* Left: Exit Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2 min-w-0"
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          <span className="hidden xs:inline">{t('gameTopBar.exit')}</span>
        </Button>

        {/* Center: Level */}
        <div className="flex-1 flex justify-center">
          <Badge variant="outline" className="px-3 py-1 font-medium">
            {t('gameTopBar.level')} {level}
          </Badge>
        </div>

        {/* Right: Time and optional Score */}
        <div className="flex items-center gap-2 min-w-0">
          <Badge 
            variant="secondary" 
            className="flex items-center gap-1 px-2 py-1 font-mono text-sm"
          >
            <Timer className="w-3 h-3 flex-shrink-0" />
            <span className="whitespace-nowrap">
              {formatTime(timeLeftSec)}
            </span>
          </Badge>
          
          {score !== undefined && (
            <Badge 
              variant="outline" 
              className="flex items-center gap-1 px-2 py-1 text-sm"
            >
              <Target className="w-3 h-3 flex-shrink-0" />
              <span className="whitespace-nowrap">
                {score}
              </span>
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
