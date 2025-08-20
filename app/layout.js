import './globals.css'
// import { Inter } from 'next/font/google'
import ConsentBanner from '@/components/ConsentBanner'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'

// const inter = Inter({ subsets: ['latin'] })
const inter = { className: '' }

export const metadata = {
  title: 'Spiread — Acelera tu lectura, mejora tu comprensión',
  description: 'Potencia tu velocidad de lectura y entrenamiento cerebral con técnicas científicamente probadas. 9 juegos de entrenamiento, lector RSVP avanzado, y seguimiento de progreso con IA.',
  keywords: 'lectura rápida, speed reading, entrenamiento cerebral, brain training, cognición, RSVP, comprensión lectora',
  author: 'Spiread',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://app.spiread.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: '/',
    title: 'Spiread — Acelera tu lectura, mejora tu comprensión',
    description: 'Potencia tu velocidad de lectura y entrenamiento cerebral con técnicas científicamente probadas. 9 juegos de entrenamiento, lector RSVP avanzado, y seguimiento de progreso con IA.',
    siteName: 'Spiread',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1617791160536-598cf32026fb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxicmFpbiUyMHRyYWluaW5nfGVufDB8fHxibHVlfDE3NTUyMjM2NDd8MA&ixlib=rb-4.1.0&q=85&w=1200&h=630',
        width: 1200,
        height: 630,
        alt: 'Spiread - Speed Reading & Brain Training'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spiread — Acelera tu lectura, mejora tu comprensión',
    description: 'Potencia tu velocidad de lectura y entrenamiento cerebral con técnicas científicamente probadas.',
    images: ['https://images.unsplash.com/photo-1617791160536-598cf32026fb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxicmFpbiUyMHRyYWluaW5nfGVufDB8fHxibHVlfDE3NTUyMjM2NDd8MA&ixlib=rb-4.1.0&q=85&w=1200&h=630'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  }
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
        <ConsentBanner />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}