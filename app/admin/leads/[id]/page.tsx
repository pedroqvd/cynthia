import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LeadProfile } from '@/components/admin/LeadProfile'

export const metadata: Metadata = { title: 'Perfil do Lead' }
export const dynamic = 'force-dynamic'

async function getLead(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      messages(id, direction, content, type, status, created_at),
      appointments(id, procedimento, data_hora, duracao_min, status, notas),
      activity_log(id, acao, detalhes, created_at)
    `)
    .eq('id', id)
    .order('created_at', { referencedTable: 'messages', ascending: true })
    .order('data_hora', { referencedTable: 'appointments', ascending: false })
    .order('created_at', { referencedTable: 'activity_log', ascending: false })
    .single()

  if (error) return null
  return data
}

export default async function LeadPage({ params }: { params: { id: string } }) {
  const lead = await getLead(params.id)
  if (!lead) notFound()

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1.5rem', fontSize: '.8rem', color: '#7a7570' }}>
        <Link href="/admin/leads" style={{ color: '#7a7570', textDecoration: 'none' }}>
          Leads / CRM
        </Link>
        <span>›</span>
        <span style={{ color: '#0f0e0c' }}>{lead.nome}</span>
      </div>

      <LeadProfile lead={lead} />
    </div>
  )
}
