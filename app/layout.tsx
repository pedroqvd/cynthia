import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { AuthHashRedirect } from '@/components/AuthHashRedirect'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://dracynthia.com.br'),
  title: {
    default: 'Dra. Cynthia — Especialista em Estética, Cirurgia e Prótese Dental | Brasília',
    template: '%s | Dra. Cynthia',
  },
  description:
    'Especialista em Estética Dental, Cirurgia Bucomaxilofacial e Prótese em Brasília-DF. Atendimento particular premium. Agende sua avaliação.',
  keywords: [
    'dentista brasília',
    'estética dental brasília',
    'cirurgia bucomaxilofacial brasília',
    'implante dentário brasília',
    'facetas dentárias brasília',
    'prótese dental brasília',
    'DTM bruxismo brasília',
    'design do sorriso brasília',
  ],
  authors: [{ name: 'Dra. Cynthia' }],
  creator: 'Dra. Cynthia',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://dracynthia.com.br',
    siteName: 'Dra. Cynthia',
    title: 'Dra. Cynthia — Especialista em Estética, Cirurgia e Prótese Dental',
    description:
      'Especialista em Estética Dental, Cirurgia Bucomaxilofacial e Prótese em Brasília-DF.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Dra. Cynthia — Especialista em Brasília',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dra. Cynthia — Especialista em Estética, Cirurgia e Prótese Dental',
    description:
      'Especialista em Estética Dental, Cirurgia Bucomaxilofacial e Prótese em Brasília-DF.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/images/favicon.ico.png',
    shortcut: '/images/favicon.ico.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthHashRedirect />
        {children}
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  )
}
