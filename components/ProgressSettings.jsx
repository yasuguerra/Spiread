'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Trash2, RotateCcw, Settings, AlertTriangle } from 'lucide-react'
import { resetAllProgress, resetGameProgress, getAllGameProgress, GAME_IDS } from '@/lib/progress-tracking'

const GAME_NAMES = {
  [GAME_IDS.SCHULTE]: 'Schulte Table',
  [GAME_IDS.TWIN_WORDS]: 'Twin Words',
  [GAME_IDS.PAR_IMPAR]: 'Par/Impar',
  [GAME_IDS.MEMORY_DIGITS]: 'Memory Digits',
  [GAME_IDS.RUNNING_WORDS]: 'Running Words',
  [GAME_IDS.LETTERS_GRID]: 'Letters Grid',
  [GAME_IDS.WORD_SEARCH]: 'Word Search',
  [GAME_IDS.ANAGRAMS]: 'Anagramas'
}

export default function ProgressSettings({ onProgressReset }) {
  const [isResetting, setIsResetting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const allProgress = getAllGameProgress()

  const handleResetAllProgress = async () => {
    setIsResetting(true)
    try {
      resetAllProgress()
      setShowSuccess(true)
      onProgressReset?.()
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error resetting progress:', error)
    } finally {
      setIsResetting(false)
    }
  }

  const handleResetGameProgress = async (gameId) => {
    try {
      resetGameProgress(gameId)
      onProgressReset?.()
    } catch (error) {
      console.error('Error resetting game progress:', error)
    }
  }

  const formatStats = (progress) => {
    if (!progress) return 'Sin datos'
    return `Mejor: ${progress.bestScore} pts • Nivel: ${progress.bestLevel} • ${progress.totalSessions} sesiones`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración de Progreso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSuccess && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ¡Progreso restablecido exitosamente!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Restablecer por Juego</h3>
            <div className="grid gap-2">
              {Object.entries(GAME_NAMES).map(([gameId, gameName]) => {
                const progress = allProgress[gameId]
                const hasData = progress && progress.totalSessions > 0
                
                return (
                  <div key={gameId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{gameName}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatStats(progress)}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!hasData}
                          className="text-destructive hover:text-destructive"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Restablecer progreso de {gameName}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará permanentemente todo el progreso de {gameName}, incluyendo:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Mejor puntuación: {progress?.bestScore || 0}</li>
                              <li>Mejor nivel: {progress?.bestLevel || 1}</li>
                              <li>Total de sesiones: {progress?.totalSessions || 0}</li>
                              <li>Historial de sesiones recientes</li>
                            </ul>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleResetGameProgress(gameId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Restablecer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-destructive">Zona de Peligro</h3>
              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Restablecer Todo el Progreso</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Elimina permanentemente todo el progreso guardado de todos los juegos
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isResetting || Object.keys(allProgress).length === 0}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {isResetting ? 'Restableciendo...' : 'Restablecer Todo'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>
                            Esta acción <strong>no se puede deshacer</strong>. Eliminará permanentemente:
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Todas las puntuaciones máximas</li>
                            <li>Todos los niveles alcanzados</li>
                            <li>Todo el historial de sesiones</li>
                            <li>Todas las estadísticas de progreso</li>
                          </ul>
                          <p className="text-sm text-muted-foreground mt-3">
                            Tendrás que empezar desde cero en todos los juegos.
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleResetAllProgress}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sí, restablecer todo
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
