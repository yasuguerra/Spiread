'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Play, Square, Pause, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { 
  updateUserProfile, 
  updateStreak, 
  checkAchievements, 
  isValidGameRun,
  calculateXpGain 
} from '@/lib/gamification'

const DURATION_MS = 60000 // 60 seconds

export default function GameWrapper({ 
  gameComponent: GameComponent,
  gameConfig,
  onExit 
}) {
  const [gameState, setGameState] = useState('idle') // idle, playing, paused, complete
  const [timeRemaining, setTimeRemaining] = useState(DURATION_MS)
  const [score, setScore] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [level, setLevel] = useState(1)
  const { userProfile, updateProfile } = useAppStore()

  const timerRef = useRef(null)
  const workerRef = useRef(null)

  // Initialize Web Worker for timing
  useEffect(() => {
    workerRef.current = new Worker('/accelerator-worker.js')
    
    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'tick') {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 100)
          if (newTime === 0) {
            handleGameComplete()
          }
          return newTime
        })
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [])

  // Load user level for this game
  useEffect(() => {
    const loadGameProgress = async () => {
      if (!userProfile?.id) return

      try {
        const { data, error } = await supabase
          .from('settings')
          .select('progress')
          .eq('user_id', userProfile.id)
          .single()

        if (data?.progress?.[gameConfig.name]) {
          const gameProgress = data.progress[gameConfig.name]
          setLevel(gameProgress.lastLevel || 1)
        }
      } catch (error) {
        console.error('Error loading game progress:', error)
      }
    }

    loadGameProgress()
  }, [userProfile?.id, gameConfig.name])

  // Start game
  const startGame = () => {
    setGameState('playing')
    setTimeRemaining(DURATION_MS)
    setScore(0)
    setIsPaused(false)
    
    // Start timer
    workerRef.current?.postMessage({ type: 'start', interval: 100 })
  }

  // Pause game
  const pauseGame = () => {
    setIsPaused(true)
    setGameState('paused')
    workerRef.current?.postMessage({ type: 'stop' })
  }

  // Resume game
  const resumeGame = () => {
    setIsPaused(false)
    setGameState('playing')
    workerRef.current?.postMessage({ type: 'start', interval: 100 })
  }

  // Stop game
  const stopGame = () => {
    setGameState('idle')
    setTimeRemaining(DURATION_MS)
    setScore(0)
    setIsPaused(false)
    workerRef.current?.postMessage({ type: 'stop' })
  }

  // Handle game completion
  const handleGameComplete = async (finalScore = score, metrics = {}) => {
    setGameState('complete')
    workerRef.current?.postMessage({ type: 'stop' })

    if (!userProfile?.id) return

    // Calculate XP gain
    const xpGain = calculateXpGain(finalScore)
    const previousLevel = calculateLevel(userProfile.xp || 0)

    try {
      // Save game run to database
      await saveGameRun(finalScore, metrics)
      
      // Update XP and check for level up
      const profileUpdate = await updateUserProfile(userProfile.id, { xp: xpGain })
      const leveledUp = profileUpdate && profileUpdate.levelUp
      
      // Update streak
      const gameRunData = {
        game: gameConfig.name,
        score: finalScore,
        duration_ms: DURATION_MS - timeRemaining,
        difficulty_level: level,
        metrics
      }
      
      const isValid = isValidGameRun(gameRunData)
      await updateStreak(userProfile.id, isValid)
      
      // Check achievements
      const newAchievements = await checkAchievements(userProfile.id, gameRunData)
      
      // Update progress
      await updateGameProgress(finalScore, metrics)
      
      // Show notifications for level up and achievements
      const notifications = []
      
      if (leveledUp) {
        notifications.push({
          id: `levelup_${Date.now()}`,
          type: 'levelup',
          title: '¡Nivel Subido!',
          description: `Alcanzaste el nivel ${profileUpdate.level}`,
          newLevel: profileUpdate.level
        })
      }
      
      newAchievements.forEach(achievement => {
        notifications.push({
          id: `achievement_${achievement.achievement_type}_${Date.now()}`,
          type: 'achievement',
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          achievement_type: achievement.achievement_type
        })
      })
      
      // Update global state
      if (profileUpdate) {
        updateProfile({ 
          ...userProfile, 
          xp: profileUpdate.xp,
          level: profileUpdate.level,
          lastScore: finalScore
        })
      }
      
      // Show notifications (this would be handled by a global notification system)
      if (notifications.length > 0) {
        console.log('Gamification notifications:', notifications)
        // In a real app, you'd dispatch these to a global notification state
      }
      
    } catch (error) {
      console.error('Error in game completion gamification:', error)
    }
  }

  // Save game run to database
  const saveGameRun = async (finalScore, metrics) => {
    if (!userProfile?.id) return

    try {
      const gameRunData = {
        user_id: userProfile.id,
        game: gameConfig.name,
        score: finalScore,
        duration_ms: DURATION_MS,
        difficulty_level: level,
        metrics: {
          ...metrics,
          level,
          timeRemaining: timeRemaining,
          completed: timeRemaining === 0
        }
      }

      const { error } = await supabase
        .from('game_runs')
        .insert(gameRunData)

      if (error) {
        console.error('Error saving game run:', error)
      }
    } catch (error) {
      console.error('Error in saveGameRun:', error)
    }
  }

  // Update game progress in settings
  const updateGameProgress = async (finalScore, metrics) => {
    if (!userProfile?.id) return

    try {
      // Get current settings
      const { data: currentSettings, error: fetchError } = await supabase
        .from('settings')
        .select('progress')
        .eq('user_id', userProfile.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching settings:', fetchError)
        return
      }

      const currentProgress = currentSettings?.progress || {}
      const gameProgress = currentProgress[gameConfig.name] || { lastLevel: 1, lastBestScore: 0 }

      // Update progress
      const updatedProgress = {
        ...currentProgress,
        [gameConfig.name]: {
          lastLevel: level,
          lastBestScore: Math.max(gameProgress.lastBestScore || 0, finalScore),
          lastPlayed: new Date().toISOString(),
          totalRounds: (gameProgress.totalRounds || 0) + 1
        }
      }

      // Save updated progress
      const { error: updateError } = await supabase
        .from('settings')
        .upsert({
          user_id: userProfile.id,
          progress: updatedProgress,
          updated_at: new Date().toISOString()
        })

      if (updateError) {
        console.error('Error updating progress:', updateError)
      }

      // Update XP and streaks
      if (isValidGameRun(finalScore, DURATION_MS, metrics)) {
        const xpGain = calculateXpGain(gameConfig.name, finalScore, level)
        await updateUserProfile(userProfile.id, { xp: userProfile.xp + xpGain })
        await updateStreak(userProfile.id)
        await checkAchievements(userProfile.id, gameConfig.name, finalScore)
      }

    } catch (error) {
      console.error('Error in updateGameProgress:', error)
    }
  }

  // Handle score updates from game component
  const handleScoreUpdate = (newScore) => {
    setScore(newScore)
  }

  // Render game UI
  const renderGameUI = () => {
    if (gameState === 'idle') {
      return (
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">{gameConfig.displayName}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {gameConfig.description}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 max-w-sm mx-auto">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">Nivel {level}</div>
                <div className="text-sm text-muted-foreground">Dificultad actual</div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Duración:</span>
                  <span className="font-medium">60 segundos</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span className="font-medium">Adaptativo</span>
                </div>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={startGame} className="px-8">
            <Play className="w-5 h-5 mr-2" />
            Jugar 60s
          </Button>
        </div>
      )
    }

    if (gameState === 'playing' || gameState === 'paused') {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={onExit}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Salir
              </Button>
              
              {!isPaused ? (
                <Button variant="outline" size="sm" onClick={pauseGame}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausa
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={resumeGame}>
                  <Play className="w-4 h-4 mr-2" />
                  Continuar
                </Button>
              )}
              
              <Button variant="destructive" size="sm" onClick={stopGame}>
                <Square className="w-4 h-4 mr-2" />
                Detener
              </Button>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div>Puntuación: <span className="font-bold">{score}</span></div>
              <div>Tiempo: <span className="font-bold">{Math.ceil(timeRemaining / 1000)}s</span></div>
            </div>
          </div>

          <Progress value={(1 - timeRemaining / DURATION_MS) * 100} className="h-2" />

          {isPaused ? (
            <div className="text-center py-20">
              <h3 className="text-xl font-bold mb-2">Juego en pausa</h3>
              <p className="text-muted-foreground mb-4">Presiona continuar para reanudar</p>
              <Button onClick={resumeGame}>
                <Play className="w-4 h-4 mr-2" />
                Continuar
              </Button>
            </div>
          ) : (
            <GameComponent
              level={level}
              onComplete={handleGameComplete}
              onScoreUpdate={handleScoreUpdate}
              timeRemaining={timeRemaining}
              locale="es"
            />
          )}
        </div>
      )
    }

    if (gameState === 'complete') {
      return (
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">¡Juego completado!</h3>
            <p className="text-muted-foreground">
              Has terminado tu sesión de {gameConfig.displayName}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 max-w-sm mx-auto">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{score}</div>
                <div className="text-sm text-muted-foreground">Puntuación final</div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Nivel:</span>
                  <span className="font-medium">{level}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duración:</span>
                  <span className="font-medium">60s</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={startGame}>
              <Play className="w-4 h-4 mr-2" />
              Jugar de nuevo
            </Button>
            <Button variant="outline" onClick={onExit}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al menú
            </Button>
          </div>
        </div>
      )
    }
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardContent className="p-8">
        {renderGameUI()}
      </CardContent>
    </Card>
  )
}