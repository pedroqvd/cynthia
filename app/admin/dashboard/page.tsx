import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'
import { DashboardCharts } from '@/components/admin/DashboardCharts'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

async function getMetrics() {
  const supabase = createClient()
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const inicioDaSemana = new Date(hoje)
  inicioDaSemana.setDate(hoje.getDate() - hoje.getDay())
  const trintaDiasAtras = new Date(hoje)
  trintaDiasAtras.setDate(hoje.getDate() - 30)

  const FUNIL_STAGES = [
    { status: 'novo',       label: 'Novos leads',      color: '#b8965a' },
    { status: 'em_contato', label: 'Em contato',        color: '#3b82f6' },
    { status: 'agendado',   label: 'Agendados',         color: '#10b981' },
    { status: 'proposta',   label: 'Proposta enviada',  color: '#8b5cf6' },
    { status: 'fechado',    label: 'Fechados',          color: '#6b7280' },
  ]

  const [
    { count: leadsHoje },
    { count: consultasSemana },
    { data: proximasConsultas },
    { data: ultimasMensagens },
    { data: leadsRecentes },
    { data: leadsPorDia },
    ...funilCounts
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', hoje.toISOString()),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('data_hora', inicioDaSemana.toISOString()).not('status', 'eq', 'cancelado'),
    supabase.from('appointments').select('id, procedimento, data_hora, leads(nome, whatsapp)').gte('data_hora', hoje.toISOString()).not('status', 'eq', 'cancelado').order('data_hora').limit(5),
    supabase.from('messages').select('id, content, direction, created_at, lead_id, leads(nome)').eq('direction', 'in').order('created_at', { ascending: false }).limit(5),
    supabase.from('leads').select('id, nome, status, created_at, especialidade').order('created_at', { ascending: false }).limit(30),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.rpc as any)('leads_por_dia', { dias: 30 }).select('*'),
    ...FUNIL_STAGES.map(({ status }) =>
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', status)
    ),
  ])

  const funil = FUNIL_STAGES.map((stage, i) => ({
    ...stage,
    count: (funilCounts[i] as { count: number | null }).count ?? 0,
  }))

  return {
    leadsHoje: leadsHoje ?? 0,
    consultasSemana: consultasSemana ?? 0,
    proximasConsultas: proximasConsultas ?? [],
    ultimasMensagens: ultimasMensagens ?? [],
    leadsRecentes: leadsRecentes ?? [],
    leadsPorDia: leadsPorDia ?? [],
    funil,
  }
}

export default async function DashboardPage() {
  const metrics = await getMetrics()

  const cards = [
    { label: 'Leads novos hoje', value: metrics.leadsHoje, icon: '👤', color: '#b8965a' },
    { label: 'Consultas esta semana', value: metrics.consultasSemana, icon: '📅', color: '#3b82f6' },
  ]

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '.25rem' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '.85rem', color: '#7a7570' }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Cards de métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              background: '#fff',
              border: '1px solid #e5e5e3',
              borderRadius: '4px',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: `${card.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#0f0e0c', lineHeight: 1 }}>
                {card.value}
              </div>
              <div style={{ fontSize: '.78rem', color: '#7a7570', marginTop: '.25rem' }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <DashboardCharts leadsRecentes={metrics.leadsRecentes} funil={metrics.funil} />

      {/* Grid inferior */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Próximas consultas */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '.9rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '1rem' }}>
            Próximas consultas
          </h2>
          {metrics.proximasConsultas.length === 0 ? (
            <p style={{ fontSize: '.82rem', color: '#7a7570' }}>Nenhuma consulta agendada.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {metrics.proximasConsultas.map((appt: Record<string, unknown>) => {
                const lead = Array.isArray(appt.leads) ? appt.leads[0] : appt.leads as Record<string, string>
                return (
                  <div
                    key={appt.id as string}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '.75rem',
                      background: '#fafaf9',
                      borderRadius: '2px',
                      borderLeft: '3px solid #b8965a',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '.85rem', fontWeight: 500, color: '#0f0e0c' }}>
                        {lead?.nome ?? 'Paciente'}
                      </div>
                      <div style={{ fontSize: '.72rem', color: '#7a7570' }}>{appt.procedimento as string}</div>
                    </div>
                    <div style={{ fontSize: '.72rem', color: '#7a7570', textAlign: 'right' }}>
                      {formatDateTime(appt.data_hora as string)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Últimas mensagens */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '.9rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '1rem' }}>
            Mensagens recentes
          </h2>
          {metrics.ultimasMensagens.length === 0 ? (
            <p style={{ fontSize: '.82rem', color: '#7a7570' }}>Nenhuma mensagem recebida.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {metrics.ultimasMensagens.map((msg: Record<string, unknown>) => {
                const lead = Array.isArray(msg.leads) ? msg.leads[0] : msg.leads as Record<string, string>
                return (
                  <div
                    key={msg.id as string}
                    style={{
                      display: 'flex',
                      gap: '.75rem',
                      alignItems: 'flex-start',
                      padding: '.75rem',
                      background: '#fafaf9',
                      borderRadius: '2px',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#b8965a22',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '.8rem',
                        color: '#b8965a',
                        flexShrink: 0,
                        fontFamily: 'Cormorant Garamond, Georgia, serif',
                      }}
                    >
                      {(lead?.nome as string)?.charAt(0) ?? 'P'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.82rem', fontWeight: 500, color: '#0f0e0c' }}>
                        {lead?.nome ?? 'Desconhecido'}
                      </div>
                      <div
                        style={{
                          fontSize: '.78rem',
                          color: '#7a7570',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {(msg.content as string)?.slice(0, 80)}
                      </div>
                    </div>
                    <div style={{ fontSize: '.68rem', color: '#7a7570', flexShrink: 0 }}>
                      {formatDateTime(msg.created_at as string)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
