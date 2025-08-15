'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Cookie, 
  Shield, 
  Settings, 
  X, 
  ExternalLink,
  BarChart3
} from 'lucide-react'
import { getConsentStatus, setConsentStatus } from '@/lib/analytics/track'

export default function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if user has already given/denied consent
    const hasConsent = getConsentStatus()
    const hasSeenBanner = localStorage.getItem('spiread_consent_banner_seen') === 'true'
    
    // Show banner if user hasn't seen it yet
    if (!hasSeenBanner) {
      // Small delay to prevent hydration mismatch
      setTimeout(() => setShowBanner(true), 1000)
    }
  }, [])

  const handleAccept = () => {
    setConsentStatus(true)
    localStorage.setItem('spiread_consent_banner_seen', 'true')
    setShowBanner(false)
    
    // Optional: reload to initialize analytics
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  const handleDecline = () => {
    setConsentStatus(false)
    localStorage.setItem('spiread_consent_banner_seen', 'true')
    setShowBanner(false)
  }

  const handleSettings = () => {
    // Toggle to settings view - could navigate to settings page
    setShowDetails(!showDetails)
  }

  // Don't render on server-side or if not mounted
  if (!mounted || !showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border shadow-xl">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Cookie className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Preferencias de Analytics</h3>
                  <Badge variant="secondary" className="mt-1">
                    <Shield className="w-3 h-3 mr-1" />
                    Privacy-first
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDecline}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            {!showDetails ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    <strong>🛡️ Spiread respeta tu privacidad.</strong> Utilizamos analytics anónimos 
                    para mejorar la aplicación. Sin cookies de seguimiento, sin PII, sin venta de datos.
                  </p>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="flex items-center space-x-1">
                      <BarChart3 className="w-3 h-3" />
                      <span>Plausible Analytics</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Shield className="w-3 h-3" />
                      <span>GDPR Compliant</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Button onClick={handleAccept} size="sm" className="flex-1">
                    Aceptar Analytics
                  </Button>
                  <Button onClick={handleDecline} variant="outline" size="sm">
                    Solo Esenciales
                  </Button>
                  <Button 
                    onClick={handleSettings} 
                    variant="ghost" 
                    size="sm"
                    className="px-2"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">¿Qué datos recopilamos?</h4>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      <li>• <strong>Métricas agregadas:</strong> páginas visitadas, duración de sesión</li>
                      <li>• <strong>Progreso de juegos:</strong> puntuaciones promedio, niveles completados</li>
                      <li>• <strong>Preferencias técnicas:</strong> idioma, tema, configuración de accesibilidad</li>
                      <li>• <strong>NO recopilamos:</strong> datos personales, email, IP exacta, textos privados</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Tus derechos</h4>
                    <div className="text-muted-foreground text-xs space-y-1">
                      <p>• Puedes cambiar tu consentimiento en cualquier momento en Configuración</p>
                      <p>• Los datos se eliminan automáticamente después de 24 meses</p>
                      <p>• Respetamos Do Not Track y Global Privacy Control</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs h-auto p-0"
                      onClick={() => window.open('/legal/privacy', '_blank')}
                    >
                      Política de Privacidad
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button onClick={() => setShowDetails(false)} variant="ghost" size="sm">
                      Volver
                    </Button>
                    <Button onClick={handleAccept} size="sm">
                      Aceptar
                    </Button>
                    <Button onClick={handleDecline} variant="outline" size="sm">
                      Declinar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}