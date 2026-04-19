import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Toaster } from 'sonner'
import { FloatingWhatsApp } from '@/components/site/FloatingWhatsApp'

export const metadata: Metadata = {
  // Herda do root layout
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-body">
      {children}
      <FloatingWhatsApp />
      <Toaster
        theme="light"
        toastOptions={{
          style: {
            background: '#F5F0E6',
            border: '1px solid rgba(201,169,110,0.3)',
            color: '#1C1C1C',
            fontFamily: 'Jost, sans-serif',
          },
        }}
      />
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </div>
  )
}
