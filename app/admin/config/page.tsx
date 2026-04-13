import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ConfigForm } from '@/components/admin/ConfigForm'
import { EquipeManager } from '@/components/admin/EquipeManager'

export const metadata: Metadata = { title: 'Configurações' }
export const dynamic = 'force-dynamic'

async function getConfig() {
  const supabase = createClient()
  const { data } = await supabase.from('site_config').select('key, value')
  const config: Record<string, string> = {}
  ;((data ?? []) as { key: string; value: string }[]).forEach((row) => { config[row.key] = row.value })
  return config
}

export default async function ConfigPage() {
  const config = await getConfig()
  return (
    <div style={{ padding: '2rem', maxWidth: '720px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '2rem' }}>Configurações</h1>
      <ConfigForm config={config} />

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '.82rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#7a7570', marginBottom: '1rem', paddingBottom: '.5rem', borderBottom: '1px solid #e5e5e3' }}>
          Equipe &amp; Permissões
        </h2>
        <p style={{ fontSize: '.8rem', color: '#7a7570', marginBottom: '1.25rem' }}>
          Gerencie os acessos da equipe. Apenas admins visualizam esta seção.
          Edite o nome exibido e altere a permissão de cada usuário.
        </p>
        <EquipeManager />
      </div>
    </div>
  )
}
