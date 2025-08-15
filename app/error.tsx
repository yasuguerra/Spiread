'use client'

import { useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Home, RefreshCw, Bug, Mail } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Application error:', error)
  }, [error])

  const handleReportError = () => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }
    
    // In a real app, you would send this to your error reporting service
    console.log('Error report:', errorReport)
    
    // For now, copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => alert('Información del error copiada al portapapeles'))
      .catch(() => alert('No se pudo copiar el error'))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Main Error Card */}
        <Card className="text-center border-red-200 dark:border-red-800">
          <CardHeader>
            <div className="mx-auto mb-4 w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <CardTitle className="text-4xl font-bold text-red-600 dark:text-red-400">
              500
            </CardTitle>
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-2">
              Error del Servidor
            </p>
            <p className="text-muted-foreground mt-2">
              Algo salió mal en nuestra aplicación. Nuestro equipo ha sido notificado automáticamente.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              
              {/* Error Details */}
              {error.message && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Bug className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <h3 className="font-medium text-red-800 dark:text-red-200 mb-1">
                        Detalles Técnicos
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 font-mono">
                        {error.message}
                      </p>
                      {error.digest && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          ID de Error: {error.digest}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-center">
                <Button 
                  onClick={reset}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Intentar de Nuevo</span>
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Ir al Inicio</span>
                </Button>
                
                <Button 
                  onClick={handleReportError}
                  variant="ghost"
                  className="flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Reportar Error</span>
                </Button>
              </div>
              
              {/* Help Information */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  ¿Qué puedes hacer mientras tanto?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      🎮 Juegos Offline
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Los juegos de entrenamiento cerebral funcionan completamente offline.
                    </p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                      📖 Lector Local
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Usa el lector RSVP con documentos guardados localmente.
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                      ⏳ Recargar Página
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      A veces un simple recarga resuelve el problema.
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                      🔄 Reiniciar Sesión
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Cerrar y volver a abrir la aplicación puede ayudar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Additional Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <Badge variant="destructive">Error 500</Badge>
              <p className="text-sm text-muted-foreground">
                Este error ha sido registrado automáticamente. Si el problema persiste, 
                por favor contacta con nuestro equipo de soporte.
              </p>
              <div className="text-xs text-muted-foreground">
                <p>Spiread v1.0.0-rc.1 • {new Date().toLocaleDateString('es-ES')}</p>
                <p>Timestamp: {new Date().toISOString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  )
}