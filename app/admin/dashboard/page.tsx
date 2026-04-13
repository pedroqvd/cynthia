import type { Metadata } from 'next'
import Link from 'next/link'
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
  const inicioDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
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
    { count: consultasMes },
    { count: totalLeads },
    { count: leadsFechados },
    { data: proximasConsultas },
    { data: ultimasMensagens },
    { data: leadsRecentes },
    { data: ticketData },
    ...funilCounts
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', hoje.toISOString()),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('data_hora', inicioDaSemana.toISOString()).not('status', 'eq', 'cancelado'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('data_hora', inicioDoMes.toISOString()).not('status', 'eq', 'cancelado'),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'fechado'),
    supabase.from('appointments').select('id, procedimento, data_hora, leads(nome, whatsapp)').gte('data_hora', hoje.toISOString()).not('status', 'eq', 'cancelado').order('data_hora').limit(5),
    supabase.from('messages').select('id, content, direction, created_at, lead_id, leads(nome)').eq('direction', 'in').order('created_at', { ascending: false }).limit(5),
    supabase.from('leads').select('id, nome, status, created_at, especialidade').order('created_at', { ascending: false }).limit(30),
    supabase.from('leads').select('ticket_estimado').not('ticket_estimado', 'is', null),
    ...FUNIL_STAGES.map(({ status }) =>
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', status)
    ),
  ])

  const funil = FUNIL_STAGES.map((stage, i) => ({
    ...stage,
    count: (funilCounts[i] as { count: number | null }).count ?? 0,
  }))

  const tickets = (ticketData ?? []) as { ticket_estimado: number }[]
  const ticketMedio = tickets.length > 0
    ? Math.round(tickets.reduce((sum, t) => sum + t.ticket_estimado, 0) / tickets.length)
    : 0

  const taxaConversao = totalLeads && totalLeads > 0 && leadsFechados
    ? Math.round((leadsFechados / totalLeads) * 100)
    : 0

  return {
    leadsHoje: leadsHoje ?? 0,
    consultasSemana: consultasSemana ?? 0,
    consultasMes: consultasMes ?? 0,
    totalLeads: totalLeads ?? 0,
    taxaConversao,
    ticketMedio,
    proximasConsultas: proximasConsultas ?? [],
    ultimasMensagens: ultimasMensagens ?? [],
    leadsRecentes: leadsRecentes ?? [],
    funil,
  }
}

export default async function DashboardPage() {
  const metrics = await getMetrics()

  const cards = [
    { label: 'Leads novos hoje', value: metrics.leadsHoje, icon: '👤', color: '#b8965a', sub: 'entradas hoje' },
    { label: 'Consultas esta semana', value: metrics.consultasSemana, icon: '📅', color: '#3b82f6', sub: 'a partir de hoje' },
    { label: 'Consultas este mês', value: metrics.consultasMes, icon: '🗓️', color: '#10b981', sub: 'no mês corrente' },
    { label: 'Total no pipeline', value: metrics.totalLeads, icon: '📊', color: '#8b5cf6', sub: 'leads ativos' },
    {
      label: 'Taxa de conversão',
      value: `${metrics.taxaConversao}%`,
      icon: '🎯',
      color: metrics.taxaConversao >= 20 ? '#10b981' : metrics.taxaConversao >= 10 ? '#f59e0b' : '#ef4444',
      sub: 'leads → fechados',
    },
    {
      label: 'Ticket médio estimado',
      value: metrics.ticketMedio > 0 ? `R$\u00a0${metrics.ticketMedio.toLocaleString('pt-BR')}` : '—',
      icon: '💰',
      color: '#b8965a',
      sub: 'média dos leads com ticket',
    },
  ]

  return (
    <div style={{ padding: '2rem' }}>

      {/* Cabeçalho com atalhos */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '.25rem' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '.85rem', color: '#7a7570' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <Link
            href="/admin/leads"
            style={{
              display: 'flex', alignItems: 'center', gap: '.4rem',
              padding: '.55rem 1.1rem', background: '#0f0e0c', color: '#f5f0e8',
              borderRadius: '2px', fontSize: '.78rem', fontWeight: 500,
              textDecoration: 'none', border: 'none',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M1.5 14c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Novo lead
          </Link>
          <Link
            href="/admin/agenda"
            style={{
              display: 'flex', alignItems: 'center', gap: '.4rem',
              padding: '.55rem 1.1rem', background: 'transparent', color: '#0f0e0c',
              border: '1px solid #e5e5e3', borderRadius: '2px', fontSize: '.78rem',
              fontWeight: 500, textDecoration: 'none',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="2.5" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M4.5 1v3M11.5 1v3M1 6.5h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Nova consulta
          </Link>
          <Link
            href="/admin/blog/novo"
            style={{
              display: 'flex', alignItems: 'center', gap: '.4rem',
              padding: '.55rem 1.1rem', background: 'transparent', color: '#0f0e0c',
              border: '1px solid #e5e5e3', borderRadius: '2px', fontSize: '.78rem',
              fontWeight: 500, textDecoration: 'none',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Novo artigo
          </Link>
        </div>
      </div>

      {/* Cards de métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              background: '#fff',
              border: '1px solid #e5e5e3',
              borderRadius: '4px',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
              <span style={{ fontSize: '.72rem', color: '#7a7570' }}>{card.label}</span>
              <span style={{ fontSize: '1.1rem' }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 600, color: card.color, lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: '.68rem', color: '#7a7570', marginTop: '.4rem' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <DashboardCharts leadsRecentes={metrics.leadsRecentes} funil={metrics.funil} />

      {/* Grid inferior */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>

        {/* Próximas consultas */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '.9rem', fontWeight: 500, color: '#0f0e0c' }}>Próximas consultas</h2>
            <Link href="/admin/agenda" style={{ fontSize: '.72rem', color: '#b8965a', textDecoration: 'none' }}>Ver agenda →</Link>
          </div>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '.9rem', fontWeight: 500, color: '#0f0e0c' }}>Mensagens recentes</h2>
            <Link href="/admin/whatsapp" style={{ fontSize: '.72rem', color: '#b8965a', textDecoration: 'none' }}>Ver inbox →</Link>
          </div>
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
