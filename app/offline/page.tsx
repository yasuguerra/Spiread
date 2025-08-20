'use client'

import { useState, useEffect } from 'react'
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

  const checkConnection = async () => {
    setRetryCount(prev => prev + 1)
    setLastChecked(new Date())
    
    try {
      // Try to fetch from a reliable endpoint
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache' 
      })
      
      if (response.ok) {
        setIsOnline(true)
        // Optionally redirect to home
        window.location.href = '/'
      } else {
        setIsOnline(false)
      }
    } catch (error) {
      setIsOnline(false)
      console.log('Connection check failed:', error)
    }
  }

  const goHome = () => {
    if (isOnline) {
      window.location.href = '/'
    } else {
      checkConnection()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Main Offline Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm text-center">
          <div className="p-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              {isOnline ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <WifiOff className="w-8 h-8 text-orange-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold">
              {isOnline ? '¡Conexión Restaurada!' : 'Sin Conexión'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {isOnline 
                ? 'Tu conexión a internet se ha restablecido. Puedes continuar usando Spiread.'
                : 'Parece que no tienes conexión a internet. Algunas funciones pueden no estar disponibles.'
              }
            </p>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-md text-xs ${
                isOnline 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {isOnline ? 'Conectado' : 'Desconectado'}
              </span>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-center">
                <button
                  onClick={checkConnection}
                  disabled={isOnline}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Verificar Conexión
                </button>
                
                {isOnline && (
                  <button
                    onClick={goHome}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Cloud className="w-4 h-4" />
                    Ir a Spiread
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Offline Features */}
        {!isOnline && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold flex items-center space-x-2">
                <Gamepad2 className="w-5 h-5" />
                <span>Funciones Disponibles Sin Conexión</span>
              </h2>
            </div>
            <div className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Games */}
                <div className="p-4 border rounded-lg">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-3">
                    <Gamepad2 className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-2">Juegos Básicos</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Algunos juegos funcionan sin conexión utilizando datos almacenados localmente.
                  </p>
                </div>

                {/* Reading */}
                <div className="p-4 border rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3">
                    <Book className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-medium mb-2">Lector Local</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Puedes usar el lector RSVP con textos que hayas cargado previamente.
                  </p>
                </div>

                {/* Settings */}
                <div className="p-4 border rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-3">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-medium mb-2">Configuración</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Ajusta configuraciones y preferencias que se guardan localmente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connection Info */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
          <div className="p-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {lastChecked && (
                  <>Última verificación: {lastChecked.toLocaleTimeString('es-ES')}</>
                )}
                {retryCount > 0 && (
                  <> • Intentos: {retryCount}</>
                )}
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>Spiread v1.0.0-rc.1 • Modo {isOnline ? 'Online' : 'Offline'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}