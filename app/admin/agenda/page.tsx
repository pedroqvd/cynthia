import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AgendaCalendar } from '@/components/admin/AgendaCalendar'

export const metadata: Metadata = { title: 'Agenda' }
export const dynamic = 'force-dynamic'

type ApptRow = {
  id: string
  procedimento: string
  data_hora: string
  duracao_min: number
  status: string
  lead_id: string | null
  leads: { nome: string; whatsapp: string } | { nome: string; whatsapp: string }[] | null
}

async function getEvents() {
  const supabase = createClient()
  const { data } = await supabase
    .from('appointments')
    .select('id, procedimento, data_hora, duracao_min, status, lead_id, leads(nome, whatsapp)')
    .not('status', 'eq', 'cancelado')
    .order('data_hora')
    .limit(200)

  return ((data ?? []) as ApptRow[]).map((appt) => {
    const lead = Array.isArray(appt.leads) ? appt.leads[0] : appt.leads
    return {
      id: appt.id,
      title: `${appt.procedimento} — ${(lead as { nome?: string })?.nome ?? 'Paciente'}`,
      start: new Date(appt.data_hora),
      end: new Date(new Date(appt.data_hora).getTime() + appt.duracao_min * 60000),
      resource: { ...appt, leadNome: (lead as { nome?: string })?.nome, leadWpp: (lead as { whatsapp?: string })?.whatsapp },
    }
  })
}

async function getLeads() {
  const supabase = createClient()
  const { data } = await supabase.from('leads').select('id, nome, whatsapp').order('nome').limit(200)
  return data ?? []
}

export default async function AgendaPage() {
  const [events, leads] = await Promise.all([getEvents(), getLeads()])

  return (
    <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#0f0e0c' }}>Agenda</h1>
      </div>
      <AgendaCalendar events={events} leads={leads} />
    </div>
  )
}
