'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Github, Info } from 'lucide-react'
import Link from 'next/link'

export default function AppFooter() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Spiread'
  const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local'
  const environment = process.env.NODE_ENV || 'development'

  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Version */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">{appName}</h3>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>v{version}</span>
                  <span>•</span>
                  <span>{commitSha}</span>
                  <span>•</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    environment === 'production' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {environment}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Potencia tu velocidad de lectura y entrenamiento cerebral con técnicas científicamente probadas.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Enlaces</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Términos
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-muted-foreground hover:text-foreground transition-colors">
                  Soporte
                </Link>
              </li>
              <li>
                <Link 
                  href="/debug" 
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <Info className="w-3 h-3" />
                  Debug
                </Link>
              </li>
            </ul>
          </div>

          {/* Tech & Status */}
          <div>
            <h4 className="font-semibold mb-4">Estado</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Sistema activo</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-muted-foreground">IA disponible</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-muted-foreground">PWA habilitada</span>
              </div>
              <div className="mt-4">
                <Link 
                  href="https://status.spiread.com" 
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3" />
                  Estado del sistema
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 mt-8 border-t border-border">
          <div className="text-xs text-muted-foreground mb-4 md:mb-0">
            © 2025 {appName}. Desarrollado con ❤️ para mejorar la lectura.
          </div>
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>Build: {commitSha}</span>
            <span>•</span>
            <span>Next.js 14</span>
            <span>•</span>
            <motion.a
              href="https://github.com/spiread/spiread"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="w-3 h-3" />
              GitHub
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  )
}