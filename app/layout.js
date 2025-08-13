import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Campayo Spreeder Pro - Speed Reading Training',
  description: 'Multiplica tu velocidad de lectura con las técnicas de Ramón Campayo y lectura RSVP avanzada',
  keywords: 'lectura rápida, speed reading, RSVP, Campayo, entrenamiento cerebral',
  author: 'Campayo Spreeder Pro',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#2563eb'
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <div className="min-h-screen bg-background font-sans antialiased">
          {children}
        </div>
      </body>
    </html>
  )
}