import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  // Herda do root layout
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-body noise-overlay">
      {children}
      <Toaster
        theme="dark"
        toastOptions={{
          style: { background: '#1a1916', border: '1px solid rgba(184,150,90,0.25)', color: '#f5f0e8' },
        }}
      />
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </div>
  )
}
