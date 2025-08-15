'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Users, AlertTriangle, Mail, Calendar, Scale } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TermsOfServicePage() {
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
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold">Términos de Servicio</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Spiread — Condiciones de uso de la plataforma
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            
            {/* Important Notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Scale className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">Aviso Legal</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Estos son términos de servicio placeholder. No constituyen asesoría legal. 
                    Para uso en producción, consulte con un abogado especializado en derecho digital.
                  </p>
                </div>
              </div>
            </div>

            {/* Permitted Use */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <span>Uso Permitido</span>
              </h2>
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h3 className="font-medium mb-2">✅ Está Permitido</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Usar la aplicación para entrenamiento personal de lectura rápida</li>
                    <li>• Participar en todos los juegos de entrenamiento cerebral disponibles</li>
                    <li>• Acceder a funciones de IA para análisis de textos propios</li>
                    <li>• Compartir tu progreso y estadísticas de forma personal</li>
                    <li>• Utilizar la aplicación con fines educativos</li>
                  </ul>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h3 className="font-medium mb-2">❌ Está Prohibido</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Uso comercial sin autorización previa</li>
                    <li>• Ingeniería inversa del código de la aplicación</li>
                    <li>• Distribución o reventa del acceso a la plataforma</li>
                    <li>• Cargar contenido protegido por derechos de autor sin permiso</li>
                    <li>• Intentar acceder a datos de otros usuarios</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Propiedad Intelectual</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Spiread</h3>
                  <p className="text-sm text-muted-foreground">
                    Todos los elementos de la aplicación (código, diseño, algoritmos, juegos) son propiedad 
                    de Spiread y están protegidos por las leyes de propiedad intelectual aplicables.
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Tu Contenido</h3>
                  <p className="text-sm text-muted-foreground">
                    Mantienes la propiedad de todos los textos y documentos que subas a la plataforma. 
                    Nos otorgas una licencia limitada para procesarlos con fines de análisis y IA.
                  </p>
                </div>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span>Limitación de Responsabilidad</span>
              </h2>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium">Servicio "Como Está"</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Spiread se proporciona "como está" sin garantías de ningún tipo. 
                      No podemos garantizar resultados específicos en tu entrenamiento de lectura.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Limitación de Daños</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      En ningún caso seremos responsables por daños indirectos, incidentales o 
                      consecuentes derivados del uso de la aplicación.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Disponibilidad del Servicio</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Aunque nos esforzamos por mantener la aplicación disponible 24/7, pueden 
                      ocurrir interrupciones por mantenimiento o causas técnicas.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Cambios en los Términos</h2>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="space-y-3">
                  <p className="text-sm">
                    <strong>Notificación de Cambios:</strong> Te notificaremos sobre cambios importantes 
                    en estos términos con al menos 30 días de anticipación a través de la aplicación 
                    o por email.
                  </p>
                  <p className="text-sm">
                    <strong>Aceptación Continuada:</strong> El uso continuado de la aplicación después 
                    de la entrada en vigor de los nuevos términos constituye tu aceptación de los mismos.
                  </p>
                  <p className="text-sm">
                    <strong>Derecho de Cancelación:</strong> Si no estás de acuerdo con los nuevos términos, 
                    puedes cancelar tu cuenta antes de que entren en vigor.
                  </p>
                </div>
              </div>
            </section>

            {/* Applicable Law */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Ley Aplicable</h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm">
                  Estos términos se rigen por las leyes aplicables en la jurisdicción donde opera Spiread. 
                  Cualquier disputa se resolverá mediante arbitraje o en los tribunales competentes de dicha jurisdicción.
                </p>
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
                  Para cualquier consulta sobre estos términos de servicio, disputas, 
                  o aclaraciones legales:
                </p>
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium">Email Legal</p>
                  <p className="text-sm text-muted-foreground">legal@spiread.com</p>
                  <p className="text-sm text-muted-foreground">
                    Tiempo de respuesta: 5-7 días laborables
                  </p>
                </div>
              </div>
            </section>

            {/* Acceptance */}
            <section className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Aceptación de Términos
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Al usar Spiread, confirmas que has leído, comprendido y aceptas estos términos de servicio 
                en su totalidad. Si eres menor de edad, debes contar con el consentimiento de tus padres o tutores.
              </p>
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
                <Badge variant="outline">Términos Placeholder</Badge>
              </div>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}