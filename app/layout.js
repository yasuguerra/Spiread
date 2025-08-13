import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Spiread - Speed Reading & Brain Training',
  description: 'Potencia tu velocidad de lectura y entrenamiento cerebral con técnicas científicamente probadas',
  keywords: 'lectura rápida, speed reading, entrenamiento cerebral, brain training, cognición',
  author: 'Spiread',
  themeColor: '#2563eb'
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb'
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
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