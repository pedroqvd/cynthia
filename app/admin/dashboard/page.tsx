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
  const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1)
  const inicioDaSemana = new Date(hoje); inicioDaSemana.setDate(hoje.getDate() - hoje.getDay())
  const inicioDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  const FUNIL_STAGES = [
    { status: 'novo',       label: 'Novos',           color: '#b8965a' },
    { status: 'em_contato', label: 'Em contato',       color: '#3b82f6' },
    { status: 'agendado',   label: 'Agendados',        color: '#10b981' },
    { status: 'proposta',   label: 'Proposta',         color: '#8b5cf6' },
    { status: 'fechado',    label: 'Fechados',         color: '#6b7280' },
  ]

  const [
    { count: leadsHoje },
    { count: consultasHoje },
    { count: consultasSemana },
    { count: consultasMes },
    { count: totalLeads },
    { count: leadsFechados },
    { count: leadsNovos },
    { data: proximasConsultas },
    { data: ultimasMensagens },
    { data: leadsRecentes },
    { data: ticketData },
    ...funilCounts
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', hoje.toISOString()),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('data_hora', hoje.toISOString()).lt('data_hora', amanha.toISOString()).not('status', 'eq', 'cancelado'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('data_hora', inicioDaSemana.toISOString()).not('status', 'eq', 'cancelado'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('data_hora', inicioDoMes.toISOString()).not('status', 'eq', 'cancelado'),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'fechado'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'novo'),
    supabase.from('appointments').select('id, procedimento, data_hora, status, leads(nome, whatsapp)').gte('data_hora', hoje.toISOString()).not('status', 'eq', 'cancelado').order('data_hora').limit(6),
    supabase.from('messages').select('id, content, direction, created_at, lead_id, leads(id, nome)').eq('direction', 'in').order('created_at', { ascending: false }).limit(5),
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
    leadsNovos: leadsNovos ?? 0,
    consultasHoje: consultasHoje ?? 0,
    consultasSemana: consultasSemana ?? 0,
    consultasMes: consultasMes ?? 0,
    totalLeads: totalLeads ?? 0,
    leadsFechados: leadsFechados ?? 0,
    taxaConversao,
    ticketMedio,
    proximasConsultas: proximasConsultas ?? [],
    ultimasMensagens: ultimasMensagens ?? [],
    leadsRecentes: leadsRecentes ?? [],
    funil,
  }
}

const APPT_STATUS_COLORS: Record<string, string> = {
  agendado: '#b8965a', confirmado: '#10b981', realizado: '#6b7280', cancelado: '#ef4444',
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export default async function DashboardPage() {
  const m = await getMetrics()

  const diaSemana = new Date().toLocaleDateString('pt-BR', { weekday: 'long' })
  const dataFormatada = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Cabeçalho ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: '.72rem', color: '#b8b4af', textTransform: 'capitalize', marginBottom: '.2rem', letterSpacing: '.02em' }}>
            {diaSemana}, {dataFormatada}
          </p>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 500, color: '#0f0e0c', lineHeight: 1.2 }}>
            Visão geral
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <Link href="/admin/leads" style={btnPrim}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M1.5 13c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Novo paciente
          </Link>
          <Link href="/admin/agenda" style={btnSec}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M4 1v2.5M10 1v2.5M1 5.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Agendar consulta
          </Link>
        </div>
      </div>

      {/* ── Hero: hoje ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

        {/* Consultas hoje — destaque */}
        <div style={{ background: '#0f0e0c', borderRadius: '8px', padding: '1.5rem', gridColumn: m.consultasHoje === 0 ? undefined : 'span 1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Consultas hoje</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(184,150,90,0.15)', border: '1px solid rgba(184,150,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="#b8965a" strokeWidth="1.3"/>
                <path d="M4 1v2.5M10 1v2.5M1 5.5h12" stroke="#b8965a" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 600, color: '#f5f0e8', lineHeight: 1, marginBottom: '.5rem' }}>
            {m.consultasHoje}
          </div>
          <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,0.3)' }}>
            {m.consultasSemana} na semana · {m.consultasMes} no mês
          </div>
        </div>

        {/* Leads novos */}
        <MetricCard
          label="Novos leads hoje"
          value={m.leadsHoje}
          sub={`${m.leadsNovos} aguardando contato`}
          icon={
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M1.5 13c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          }
        />

        {/* Taxa de conversão */}
        <MetricCard
          label="Taxa de conversão"
          value={`${m.taxaConversao}%`}
          sub={`${m.leadsFechados} de ${m.totalLeads} leads fechados`}
          valueColor={m.taxaConversao >= 20 ? '#10b981' : m.taxaConversao >= 10 ? '#f59e0b' : '#ef4444'}
          icon={
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 10L5.5 6l3 2.5L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.5 4H11v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />

        {/* Ticket médio */}
        <MetricCard
          label="Ticket médio"
          value={m.ticketMedio > 0 ? fmt(m.ticketMedio) : '—'}
          sub="estimado nos leads"
          icon={
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M7 3v8M5 5.5c0-1.1.7-2 2-2s2 .9 2 2c0 1.1-.9 1.5-2 1.5s-2 .4-2 1.5c0 1.1.7 2 2 2s2-.9 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          }
        />
      </div>

      {/* ── Grid principal ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: '1.25rem' }} className="max-md:!grid-cols-1">

        {/* Próximas consultas */}
        <div style={card}>
          <SectionHeader title="Próximas consultas" link={{ href: '/admin/agenda', label: 'Ver agenda' }} />
          {m.proximasConsultas.length === 0 ? (
            <Empty text="Nenhuma consulta agendada." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {(m.proximasConsultas as Record<string, unknown>[]).map((appt) => {
                const lead = Array.isArray(appt.leads) ? appt.leads[0] : appt.leads as Record<string, string>
                const statusColor = APPT_STATUS_COLORS[(appt.status as string)] ?? '#b8965a'
                const dt = new Date(appt.data_hora as string)
                const isToday = dt.toDateString() === new Date().toDateString()
                return (
                  <div key={appt.id as string} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '.75rem', borderRadius: '6px',
                    background: isToday ? 'rgba(184,150,90,0.05)' : '#fafaf9',
                    border: `1px solid ${isToday ? 'rgba(184,150,90,0.2)' : '#f0f0ee'}`,
                  }}>
                    {/* Hora */}
                    <div style={{ flexShrink: 0, textAlign: 'center', minWidth: '44px' }}>
                      <div style={{ fontSize: '.88rem', fontWeight: 600, color: '#0f0e0c', lineHeight: 1 }}>
                        {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {!isToday && (
                        <div style={{ fontSize: '.62rem', color: '#b8b4af', marginTop: '.15rem' }}>
                          {dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </div>
                      )}
                    </div>
                    {/* Divider */}
                    <div style={{ width: '1px', height: '28px', background: '#e5e5e3', flexShrink: 0 }} />
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.85rem', fontWeight: 500, color: '#0f0e0c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lead?.nome ?? 'Paciente'}
                      </div>
                      <div style={{ fontSize: '.72rem', color: '#7a7570', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {appt.procedimento as string}
                      </div>
                    </div>
                    {/* Status dot */}
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Mensagens recentes */}
        <div style={card}>
          <SectionHeader title="Mensagens recentes" link={{ href: '/admin/whatsapp', label: 'Inbox' }} />
          {m.ultimasMensagens.length === 0 ? (
            <Empty text="Nenhuma mensagem recebida." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
              {(m.ultimasMensagens as Record<string, unknown>[]).map((msg) => {
                const lead = Array.isArray(msg.leads) ? msg.leads[0] : msg.leads as Record<string, string>
                return (
                  <Link
                    key={msg.id as string}
                    href={`/admin/leads/${msg.lead_id}`}
                    style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start', padding: '.65rem .75rem', borderRadius: '6px', background: '#fafaf9', textDecoration: 'none', border: '1px solid #f0f0ee' }}
                  >
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      background: 'rgba(184,150,90,0.1)', border: '1px solid rgba(184,150,90,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '.75rem', color: '#b8965a', flexShrink: 0,
                      fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 600,
                    }}>
                      {(lead?.nome as string)?.charAt(0) ?? 'P'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '.5rem', marginBottom: '.15rem' }}>
                        <span style={{ fontSize: '.8rem', fontWeight: 500, color: '#0f0e0c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lead?.nome ?? 'Desconhecido'}
                        </span>
                        <span style={{ fontSize: '.62rem', color: '#b8b4af', flexShrink: 0 }}>
                          {new Date(msg.created_at as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '.75rem', color: '#7a7570', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(msg.content as string)?.slice(0, 70)}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Gráficos e funil ───────────────────────────────── */}
      <DashboardCharts leadsRecentes={m.leadsRecentes} funil={m.funil} />

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function MetricCard({ label, value, sub, icon, valueColor }: {
  label: string; value: string | number; sub: string
  icon: React.ReactNode; valueColor?: string
}) {
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
        <span style={{ fontSize: '.7rem', color: '#7a7570', textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</span>
        <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#f5f4f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a7570' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '1.9rem', fontWeight: 600, color: valueColor ?? '#0f0e0c', lineHeight: 1, marginBottom: '.35rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '.68rem', color: '#b8b4af' }}>{sub}</div>
    </div>
  )
}

function SectionHeader({ title, link }: { title: string; link: { href: string; label: string } }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <h2 style={{ fontSize: '.88rem', fontWeight: 500, color: '#0f0e0c' }}>{title}</h2>
      <Link href={link.href} style={{ fontSize: '.72rem', color: '#b8965a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.2rem' }}>
        {link.label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p style={{ fontSize: '.82rem', color: '#b8b4af', padding: '1.5rem 0' }}>{text}</p>
}

// ── Styles ────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ebebea',
  borderRadius: '8px',
  padding: '1.25rem',
}

const btnPrim: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '.4rem',
  padding: '.5rem 1rem', background: '#0f0e0c', color: '#f5f0e8',
  borderRadius: '6px', fontSize: '.78rem', fontWeight: 500,
  textDecoration: 'none',
}

const btnSec: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '.4rem',
  padding: '.5rem 1rem', background: '#fff', color: '#0f0e0c',
  border: '1px solid #e5e5e3', borderRadius: '6px', fontSize: '.78rem',
  fontWeight: 500, textDecoration: 'none',
}
