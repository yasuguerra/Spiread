'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  WifiOff, 
  RefreshCw, 
  Gamepad2, 
  Book, 
  Brain,
  Cloud,
  CheckCircle 
} from 'lucide-react'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine)
    
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      console.log('Connection restored')
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      console.log('Connection lost')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1)
    setLastChecked(new Date())
    
    try {
      // Test connection with a simple fetch
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache'
      })
      
      if (response.ok) {
        // Connection restored - redirect to home
        window.location.href = '/'
      } else {
        console.log('Server responded but not healthy')
      }
    } catch (error) {
      console.log('Still offline:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Main Offline Card */}
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              {isOnline ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <WifiOff className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {isOnline ? 'Conexión Restaurada' : 'Sin Conexión'}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {isOnline 
                ? 'Tu conexión a internet ha sido restaurada. Puedes continuar usando todas las funciones.'
                : 'No hay conexión a internet disponible. Algunas funciones están limitadas en modo offline.'
              }
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Badge variant={isOnline ? 'default' : 'secondary'}>
                  {isOnline ? 'En línea' : 'Offline'}
                </Badge>
                {lastChecked && (
                  <span className="text-sm text-muted-foreground">
                    Última verificación: {lastChecked.toLocaleTimeString()}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-3 justify-center">
                <Button 
                  onClick={handleRetry}
                  disabled={retryCount >= 3 && !isOnline}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reintentar</span>
                </Button>
                
                {isOnline && (
                  <Button 
                    onClick={() => window.location.href = '/'}
                    variant="default"
                  >
                    <span>Volver a Spiread</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offline Features Available */}
        {!isOnline && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span>Funciones Disponibles Offline</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Gamepad2 className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">Juegos de Entrenamiento</div>
                    <div className="text-sm text-muted-foreground">
                      Los 9 juegos funcionan offline
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Book className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Lector RSVP</div>
                    <div className="text-sm text-muted-foreground">
                      Con documentos guardados
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Cloud className="w-5 h-5 text-yellow-600" />
                  <div>
                    <div className="font-medium">Sincronización Automática</div>
                    <div className="text-sm text-muted-foreground">
                      Los datos se guardarán al reconectar
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium">Estadísticas Locales</div>
                    <div className="text-sm text-muted-foreground">
                      Progreso guardado localmente
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Offline Tips */}
        {!isOnline && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Consejos para Uso Offline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">1</span>
                </div>
                <div>
                  <div className="font-medium">Juega sin limitaciones</div>
                  <div className="text-sm text-muted-foreground">
                    Todos los juegos de entrenamiento cerebral funcionan completamente offline.
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">2</span>
                </div>
                <div>
                  <div className="font-medium">Datos seguros</div>
                  <div className="text-sm text-muted-foreground">
                    Tu progreso se guarda localmente y se sincronizará automáticamente cuando vuelvas a tener conexión.
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">3</span>
                </div>
                <div>
                  <div className="font-medium">Funciones limitadas</div>
                  <div className="text-sm text-muted-foreground">
                    Las funciones de IA (resúmenes y quiz) requieren conexión a internet.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}