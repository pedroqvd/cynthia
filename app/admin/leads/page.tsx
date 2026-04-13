import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { LeadsKanban } from '@/components/admin/LeadsKanban'
import { LeadsViewToggle } from '@/components/admin/LeadsViewToggle'

export const metadata: Metadata = { title: 'Leads / CRM' }
export const dynamic = 'force-dynamic'

const COLUNAS = [
  { id: 'novo', label: 'Novo Lead' },
  { id: 'em_contato', label: 'Em Contato' },
  { id: 'agendado', label: 'Agendado' },
  { id: 'proposta', label: 'Proposta Enviada' },
  { id: 'fechado', label: 'Fechado' },
]

async function getLeads() {
  const supabase = createClient()
  const { data } = await supabase
    .from('leads')
    .select('id, nome, whatsapp, email, especialidade, urgencia, origem, status, ticket_estimado, observacoes, created_at, updated_at, last_seen')
    .order('created_at', { ascending: false })
    .limit(200)

  return data ?? []
}

export default async function LeadsPage() {
  const leads = await getLeads()

  const byStatus = COLUNAS.reduce<Record<string, typeof leads>>((acc, col) => {
    acc[col.id] = leads.filter((l) => l.status === col.id)
    return acc
  }, {})

  return (
    <LeadsViewToggle
      leads={leads}
      colunas={COLUNAS}
      byStatus={byStatus}
    />
  )
}
