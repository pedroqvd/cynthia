import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { AdminSidebar } from '@/components/admin/Sidebar'

export const metadata: Metadata = {
  title: { default: 'Painel — Dra. Cynthia', template: '%s | Painel' },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', background: '#fafaf9' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}
