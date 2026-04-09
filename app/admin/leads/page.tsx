import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { LeadsKanban } from '@/components/admin/LeadsKanban'

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
    .select('id, nome, whatsapp, especialidade, urgencia, origem, status, ticket_estimado, created_at, last_seen')
    .order('created_at', { ascending: false })
    .limit(200)

  return data ?? []
}

export default async function LeadsPage() {
  const leads = await getLeads()

  // Agrupa por status
  const byStatus = COLUNAS.reduce<Record<string, typeof leads>>((acc, col) => {
    acc[col.id] = leads.filter((l) => l.status === col.id)
    return acc
  }, {})

  return (
    <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#0f0e0c' }}>Leads / CRM</h1>
          <p style={{ fontSize: '.85rem', color: '#7a7570' }}>{leads.length} leads no total</p>
        </div>
        <a
          href="/api/leads?format=csv"
          style={{
            fontSize: '.75rem',
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: '#7a7570',
            border: '1px solid #e5e5e3',
            padding: '.5rem 1rem',
            borderRadius: '2px',
            textDecoration: 'none',
          }}
        >
          Exportar CSV
        </a>
      </div>

      <LeadsKanban colunas={COLUNAS} byStatus={byStatus} />
    </div>
  )
}
