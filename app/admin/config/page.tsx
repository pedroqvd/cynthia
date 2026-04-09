import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ConfigForm } from '@/components/admin/ConfigForm'

export const metadata: Metadata = { title: 'Configurações' }
export const dynamic = 'force-dynamic'

async function getConfig() {
  const supabase = createClient()
  const { data } = await supabase.from('site_config').select('key, value')
  const config: Record<string, string> = {}
  ;(data ?? []).forEach((row) => { config[row.key] = row.value })
  return config
}

export default async function ConfigPage() {
  const config = await getConfig()
  return (
    <div style={{ padding: '2rem', maxWidth: '720px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '2rem' }}>Configurações</h1>
      <ConfigForm config={config} />
    </div>
  )
}
