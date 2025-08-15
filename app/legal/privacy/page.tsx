'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Shield, Cookie, Database, Mail, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PrivacyPolicyPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Button>
          <Badge variant="secondary">
            <Calendar className="w-3 h-3 mr-1" />
            Actualizado: {new Date().toLocaleDateString('es-ES')}
          </Badge>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold">Política de Privacidad</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Spiread — Tu privacidad es nuestra prioridad
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            
            {/* Important Notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">Aviso Legal</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Esta es una política de privacidad placeholder. No constituye asesoría legal. 
                    Para uso en producción, consulte con un abogado especializado en protección de datos.
                  </p>
                </div>
              </div>
            </div>

            {/* Data Collection */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span>Datos que Recopilamos</span>
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Métricas Agregadas (Sin PII)</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Progreso de juegos y puntuaciones (anónimas)</li>
                    <li>• Estadísticas de uso de la aplicación</li>
                    <li>• Métricas de rendimiento técnico</li>
                    <li>• Configuraciones de accesibilidad</li>
                  </ul>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Datos Técnicos</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Logs de errores (sin información personal)</li>
                    <li>• Datos de navegador (User-Agent, idioma)</li>
                    <li>• Dirección IP (para análisis geográfico agregado)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Legal Basis */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Base Legal</h2>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Consentimiento:</strong> Todos los datos se recopilan únicamente con tu consentimiento explícito. 
                  Puedes retirar tu consentimiento en cualquier momento a través de la configuración de la aplicación.
                </p>
              </div>
            </section>

            {/* Cookies and Analytics */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <Cookie className="w-5 h-5 text-orange-600" />
                <span>Cookies y Analytics</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Cookies Técnicas</h3>
                  <p className="text-sm text-muted-foreground">
                    Utilizamos cookies estrictamente necesarias para el funcionamiento de la aplicación:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• Configuración de idioma y accesibilidad</li>
                    <li>• Estado de sesión de entrenamiento</li>
                    <li>• Progreso de juegos (almacenamiento local)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Analytics (Opcional)</h3>
                  <p className="text-sm text-muted-foreground">
                    Con tu consentimiento, utilizamos servicios de analytics respetuosos con la privacidad 
                    (Plausible Analytics) que no utilizan cookies de seguimiento ni recopilan datos personales.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Retención de Datos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium">Datos de Progreso</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Se mantienen mientras uses la aplicación activamente. 
                    Puedes eliminarlos en cualquier momento.
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h3 className="font-medium">Métricas Analytics</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Datos agregados y anónimos se conservan por 24 meses máximo 
                    para análisis de tendencias.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <Mail className="w-5 h-5 text-green-600" />
                <span>Contacto</span>
              </h2>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm">
                  Para cualquier consulta sobre privacidad, ejercicio de derechos (acceso, rectificación, cancelación), 
                  o preguntas sobre el tratamiento de datos:
                </p>
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium">Email de Contacto</p>
                  <p className="text-sm text-muted-foreground">privacy@spiread.com</p>
                  <p className="text-sm text-muted-foreground">
                    Tiempo de respuesta: 48-72 horas laborables
                  </p>
                </div>
              </div>
            </section>

            {/* Last Updated */}
            <section className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Última actualización: {new Date().toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Versión: 1.0.0-rc.1
                  </p>
                </div>
                <Badge variant="outline">Política Placeholder</Badge>
              </div>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}