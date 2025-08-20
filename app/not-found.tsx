'use client'

import { Home, Search, ArrowLeft, BookOpen, Brain, Gamepad2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Main 404 Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm text-center">
          <div className="p-6">
            <div className="mx-auto mb-4 w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Search className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              404
            </h1>
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-2">
              Página No Encontrada
            </p>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Lo sentimos, la página que buscas no existe o ha sido movida.
            </p>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-6">
              
              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-center">
                <button 
                  onClick={() => router.push('/')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  <Home className="w-4 h-4" />
                  <span>Ir al Inicio</span>
                </button>
                
                <button 
                  onClick={() => router.back()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver Atrás</span>
                </button>
              </div>
              
              {/* Helpful Links */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  ¿Buscabas alguna de estas secciones?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => router.push('/')}
                    className="flex items-center space-x-3 p-4 h-auto justify-start border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <Gamepad2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Juegos de Entrenamiento</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        9 juegos de entrenamiento cerebral
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => router.push('/')}
                    className="flex items-center space-x-3 p-4 h-auto justify-start border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Lector RSVP</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Entrenamiento de lectura rápida
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => router.push('/legal/privacy')}
                    className="flex items-center space-x-3 p-4 h-auto justify-start border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Políticas</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Privacidad y términos de servicio
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => router.push('/offline')}
                    className="flex items-center space-x-3 p-4 h-auto justify-start border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Modo Offline</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Funciones sin conexión
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
          <div className="p-6">
            <div className="text-center space-y-3">
              <span className="inline-flex items-center px-2 py-0.5 border rounded-md text-xs">Error 404</span>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Si crees que esto es un error, puedes intentar recargando la página 
                o contactando con nuestro equipo de soporte.
              </p>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                <p>Spiread v1.0.0-rc.1 • {new Date().toLocaleDateString('es-ES')}</p>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}