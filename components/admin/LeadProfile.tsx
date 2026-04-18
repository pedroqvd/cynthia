'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  URGENCIA_LABELS,
  STATUS_LABELS,
  ESPECIALIDADE_LABELS,
  formatDateTime,
  formatWhatsApp,
  whatsAppUrl,
} from '@/lib/utils'
import { ESPECIALIDADES } from '@/lib/schemas'
import { PatientRecordsTab } from './PatientRecordsTab'

type Lead = {
  id: string
  nome: string
  cpf: string | null
  whatsapp: string
  email: string | null
  especialidade: string | null
  urgencia: 'alta' | 'media' | 'baixa' | null
  origem: string | null
  status: 'novo' | 'em_contato' | 'agendado' | 'proposta' | 'fechado'
  ticket_estimado: number | null
  observacoes: string | null
  data_nascimento: string | null
  convenio: string | null
  indicado_por: string | null
  created_at: string
  updated_at: string
  messages: { id: string; direction: 'in' | 'out'; content: string; status: string | null; created_at: string }[]
  appointments: { id: string; procedimento: string; data_hora: string; duracao_min: number; status: string; notas: string | null }[]
  activity_log: { id: string; acao: string; detalhes: unknown; created_at: string }[]
}

type FinancialEntry = {
  id: string
  tipo: 'receita' | 'despesa'
  descricao: string
  valor: number
  data: string
  status: 'pendente' | 'confirmado' | 'cancelado'
  financial_categories: { nome: string; cor: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  novo: '#b8965a', em_contato: '#3b82f6', agendado: '#10b981', proposta: '#8b5cf6', fechado: '#6b7280',
}
const URGENCIA_COLORS: Record<string, string> = { alta: '#ef4444', media: '#f59e0b', baixa: '#10b981' }
const APPT_STATUS_COLORS: Record<string, string> = {
  agendado: '#b8965a', confirmado: '#10b981', realizado: '#6b7280', cancelado: '#ef4444',
}

const ACAO_LABELS: Record<string, string> = {
  lead_atualizado: 'Cadastro atualizado',
  mensagem_enviada: 'Mensagem enviada',
  consulta_agendada: 'Consulta agendada',
  lembrete_24h_enviado: 'Lembrete 24h enviado',
  followup_3d_enviado: 'Follow-up 3 dias enviado',
  reativacao_30d_enviada: 'Reativação 30 dias enviada',
}

const CAMPO_LABELS: Record<string, string> = {
  nome: 'Nome', cpf: 'CPF', whatsapp: 'WhatsApp', email: 'E-mail',
  especialidade: 'Especialidade', urgencia: 'Urgência', status: 'Status',
  ticket_estimado: 'Ticket estimado', observacoes: 'Observações',
  data_nascimento: 'Data de nascimento', convenio: 'Convênio', indicado_por: 'Indicado por',
}

export function LeadProfile({ lead: initialLead }: { lead: Lead }) {
  const router = useRouter()
  const [lead, setLead] = useState(initialLead)
  const [editingObs, setEditingObs] = useState(false)
  const [obsText, setObsText] = useState(lead.observacoes ?? '')
  const [savingObs, setSavingObs] = useState(false)
  const [activeTab, setActiveTab] = useState<'mensagens' | 'consultas' | 'atividade' | 'financeiro' | 'prontuario'>('mensagens')
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([])
  const [loadingFinancial, setLoadingFinancial] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [fieldValue, setFieldValue] = useState<string>('')
  const [sideSummary, setSideSummary] = useState<{ receitas: number; despesas: number } | null>(null)

  const fetchFinancial = useCallback(async () => {
    setLoadingFinancial(true)
    try {
      const res = await fetch(`/api/financial/entries?lead_id=${lead.id}`)
      if (!res.ok) return
      const json = await res.json()
      setFinancialEntries(json.data ?? json)
    } finally {
      setLoadingFinancial(false)
    }
  }, [lead.id])

  useEffect(() => {
    if (activeTab === 'financeiro' && financialEntries.length === 0) fetchFinancial()
  }, [activeTab, fetchFinancial, financialEntries.length])

  useEffect(() => {
    fetch(`/api/financial/entries?lead_id=${lead.id}`)
      .then((r) => r.json())
      .then((j) => {
        const entries = (j.data ?? j) as { tipo: string; valor: number; status: string }[]
        const confirmed = entries.filter((e) => e.status === 'confirmado')
        setSideSummary({
          receitas: confirmed.filter((e) => e.tipo === 'receita').reduce((s, e) => s + Number(e.valor), 0),
          despesas: confirmed.filter((e) => e.tipo === 'despesa').reduce((s, e) => s + Number(e.valor), 0),
        })
      })
      .catch(() => {})
  }, [lead.id])

  const proximaConsulta = [...lead.appointments]
    .filter((a) => a.status !== 'cancelado' && new Date(a.data_hora) > new Date())
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())[0] ?? null

  async function patch(fields: Record<string, unknown>) {
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    if (!res.ok) throw new Error()
    const { data } = await res.json()
    return data
  }

  async function handleStatusChange(status: string) {
    try {
      const updated = await patch({ status })
      setLead((prev) => ({ ...prev, ...updated }))
      toast.success(`Status atualizado para "${STATUS_LABELS[status]}"`)
      router.refresh()
    } catch {
      toast.error('Erro ao atualizar status.')
    }
  }

  async function handleSaveObs() {
    setSavingObs(true)
    try {
      await patch({ observacoes: obsText })
      setLead((prev) => ({ ...prev, observacoes: obsText }))
      setEditingObs(false)
      toast.success('Observações salvas.')
    } catch {
      toast.error('Erro ao salvar observações.')
    } finally {
      setSavingObs(false)
    }
  }

  async function handleSaveField(campo: string, valor: string) {
    try {
      const updated = await patch({ [campo]: valor || null })
      setLead((prev) => ({ ...prev, ...updated }))
      setEditingField(null)
      toast.success(`${CAMPO_LABELS[campo] ?? campo} atualizado.`)
    } catch {
      toast.error('Erro ao salvar.')
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir o paciente "${lead.nome}" permanentemente? Esta ação não pode ser desfeita.`)) return
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Paciente excluído.')
      router.push('/admin/leads')
    } catch {
      toast.error('Erro ao excluir paciente.')
    }
  }

  const statusColor = STATUS_COLORS[lead.status] ?? '#b8965a'
  const urgenciaColor = lead.urgencia ? URGENCIA_COLORS[lead.urgencia] : null

  // Resumo financeiro
  const confirmados = financialEntries.filter((e) => e.status === 'confirmado')
  const totalReceitas = confirmados.filter((e) => e.tipo === 'receita').reduce((s, e) => s + Number(e.valor), 0)
  const totalDespesas = confirmados.filter((e) => e.tipo === 'despesa').reduce((s, e) => s + Number(e.valor), 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: '1.5rem' }} className="max-md:!grid-cols-1">

      {/* Coluna Principal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Cabeçalho */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: 'clamp(.875rem, 3vw, 1.5rem)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: `${statusColor}20`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.3rem', fontWeight: 600,
                color: statusColor, flexShrink: 0, fontFamily: 'Cormorant Garamond, Georgia, serif',
              }}>
                {lead.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '.25rem' }}>
                  {lead.nome}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '.8rem', color: '#7a7570' }}>{formatWhatsApp(lead.whatsapp)}</span>
                  {lead.email && <span style={{ fontSize: '.8rem', color: '#7a7570' }}>{lead.email}</span>}
                  {lead.urgencia && (
                    <span style={{
                      fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em',
                      color: urgenciaColor!, background: `${urgenciaColor}18`,
                      padding: '.15rem .5rem', borderRadius: '2px',
                    }}>
                      {URGENCIA_LABELS[lead.urgencia]}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              <a
                href={whatsAppUrl(lead.whatsapp, `Olá ${lead.nome.split(' ')[0]}!`)}
                target="_blank" rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '.4rem',
                  padding: '.5rem 1rem', background: '#25D366', color: '#fff',
                  borderRadius: '2px', fontSize: '.75rem', fontWeight: 500, textDecoration: 'none',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1.5C4.858 1.5 1.5 4.858 1.5 9c0 1.306.34 2.532.935 3.595L1.5 16.5l3.99-1.012A7.43 7.43 0 009 16.5c4.142 0 7.5-3.358 7.5-7.5S13.142 1.5 9 1.5z" fill="currentColor"/>
                </svg>
                WhatsApp
              </a>
              <button
                onClick={handleDelete}
                style={{ padding: '.5rem 1rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef444440', borderRadius: '2px', fontSize: '.75rem', cursor: 'pointer' }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e5e3', overflowX: 'auto' }}>
            {(['mensagens', 'consultas', 'prontuario', 'financeiro', 'atividade'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '.85rem 1.25rem', border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: '.82rem', fontWeight: 500, whiteSpace: 'nowrap',
                  color: activeTab === tab ? '#b8965a' : '#7a7570',
                  borderBottom: activeTab === tab ? '2px solid #b8965a' : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                {tab === 'mensagens'  && `Mensagens (${lead.messages.length})`}
                {tab === 'consultas'  && `Consultas (${lead.appointments.length})`}
                {tab === 'prontuario' && 'Prontuário'}
                {tab === 'financeiro' && 'Financeiro'}
                {tab === 'atividade'  && `Atividade (${lead.activity_log.length})`}
              </button>
            ))}
          </div>

          <div style={{ padding: '1rem', maxHeight: activeTab === 'prontuario' ? 'none' : '460px', overflowY: activeTab === 'prontuario' ? 'visible' : 'auto' }}>

            {/* Mensagens */}
            {activeTab === 'mensagens' && (
              lead.messages.length === 0
                ? <EmptyState text="Nenhuma mensagem encontrada." />
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {lead.messages.map((msg) => (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: msg.direction === 'out' ? 'row-reverse' : 'row', gap: '.5rem' }}>
                        <div style={{
                          maxWidth: '75%', padding: '.65rem .9rem',
                          background: msg.direction === 'out' ? '#b8965a15' : '#f5f4f2',
                          borderRadius: msg.direction === 'out' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          fontSize: '.82rem', color: '#0f0e0c', lineHeight: 1.5,
                        }}>
                          {msg.content}
                          <div style={{ fontSize: '.65rem', color: '#7a7570', marginTop: '.25rem', textAlign: 'right' }}>
                            {formatDateTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
            )}

            {/* Consultas */}
            {activeTab === 'consultas' && (
              lead.appointments.length === 0
                ? <EmptyState text="Nenhuma consulta encontrada." />
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {lead.appointments.map((appt) => {
                      const color = APPT_STATUS_COLORS[appt.status] ?? '#b8965a'
                      return (
                        <div key={appt.id} style={{ padding: '1rem', background: '#fafaf9', borderRadius: '2px', borderLeft: `3px solid ${color}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                            <div>
                              <div style={{ fontSize: '.88rem', fontWeight: 500, color: '#0f0e0c' }}>{appt.procedimento}</div>
                              <div style={{ fontSize: '.75rem', color: '#7a7570', marginTop: '.2rem' }}>
                                {formatDateTime(appt.data_hora)} · {appt.duracao_min}min
                              </div>
                              {appt.notas && <div style={{ fontSize: '.75rem', color: '#7a7570', marginTop: '.4rem', fontStyle: 'italic' }}>{appt.notas}</div>}
                            </div>
                            <span style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em', color, background: `${color}18`, padding: '.2rem .6rem', borderRadius: '2px', flexShrink: 0 }}>
                              {appt.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
            )}

            {/* Financeiro */}
            {activeTab === 'financeiro' && (
              loadingFinancial
                ? <EmptyState text="Carregando..." />
                : financialEntries.length === 0
                  ? <EmptyState text="Nenhum lançamento financeiro vinculado a este paciente." />
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Cards resumo */}
                      <div className="fin-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                        <SummaryCard label="Receitas confirmadas" value={`R$ ${totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="#10b981" />
                        <SummaryCard label="Despesas confirmadas" value={`R$ ${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="#ef4444" />
                        <SummaryCard label="Saldo" value={`R$ ${(totalReceitas - totalDespesas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color={totalReceitas >= totalDespesas ? '#b8965a' : '#ef4444'} />
                      </div>
                      {/* Tabela */}
                      <div className="table-scroll-wrap">
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem', minWidth: '500px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e5e5e3' }}>
                            {['Data', 'Descrição', 'Categoria', 'Valor', 'Status'].map((h) => (
                              <th key={h} style={{ textAlign: 'left', padding: '.4rem .6rem', fontSize: '.68rem', color: '#7a7570', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {financialEntries.map((e) => (
                            <tr key={e.id} style={{ borderBottom: '1px solid #f0f0ee' }}>
                              <td style={{ padding: '.5rem .6rem', color: '#7a7570', whiteSpace: 'nowrap' }}>{new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                              <td style={{ padding: '.5rem .6rem', color: '#0f0e0c' }}>{e.descricao}</td>
                              <td style={{ padding: '.5rem .6rem' }}>
                                {e.financial_categories && (
                                  <span style={{ fontSize: '.68rem', padding: '.15rem .5rem', borderRadius: '2px', background: `${e.financial_categories.cor}20`, color: e.financial_categories.cor }}>
                                    {e.financial_categories.nome}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '.5rem .6rem', fontWeight: 500, color: e.tipo === 'receita' ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>
                                {e.tipo === 'receita' ? '+' : '-'} R$ {Number(e.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '.5rem .6rem' }}>
                                <span style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.06em', color: e.status === 'confirmado' ? '#10b981' : e.status === 'pendente' ? '#f59e0b' : '#ef4444' }}>
                                  {e.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    </div>
            )}

            {/* Prontuário */}
            {activeTab === 'prontuario' && (
              <PatientRecordsTab leadId={lead.id} appointments={lead.appointments} />
            )}

            {/* Atividade */}
            {activeTab === 'atividade' && (
              lead.activity_log.length === 0
                ? <EmptyState text="Sem registros de atividade." />
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                    {[...lead.activity_log].reverse().map((log) => {
                      const detalhes = log.detalhes as { alteracoes?: Record<string, { anterior: unknown; novo: unknown }> } | null
                      const alteracoes = detalhes?.alteracoes
                      return (
                        <div key={log.id} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start', padding: '.75rem', borderBottom: '1px solid #f0f0ee' }}>
                          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#b8965a', marginTop: '5px', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '.82rem', color: '#0f0e0c', fontWeight: 500 }}>
                              {ACAO_LABELS[log.acao] ?? log.acao.replace(/_/g, ' ')}
                            </div>
                            {alteracoes && Object.entries(alteracoes).map(([campo, { anterior, novo }]) => (
                              <div key={campo} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: '.3rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '.68rem', color: '#7a7570', background: '#f5f4f2', padding: '.1rem .4rem', borderRadius: '2px' }}>
                                  {CAMPO_LABELS[campo] ?? campo}
                                </span>
                                <span style={{ fontSize: '.68rem', color: '#ef4444', textDecoration: 'line-through' }}>
                                  {String(anterior ?? '—')}
                                </span>
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="#7a7570" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <span style={{ fontSize: '.68rem', color: '#10b981' }}>
                                  {String(novo ?? '—')}
                                </span>
                              </div>
                            ))}
                            <div style={{ fontSize: '.68rem', color: '#b8b4af', marginTop: '.25rem' }}>{formatDateTime(log.created_at)}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Contato Rápido */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.25rem' }}>
          <SectionTitle>Contato rápido</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <a
              href={whatsAppUrl(lead.whatsapp, `Olá ${lead.nome.split(' ')[0]}!`)}
              target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.55rem .75rem', background: '#25D36615', border: '1px solid #25D36630', borderRadius: '2px', fontSize: '.78rem', fontWeight: 500, color: '#1a9e4d', textDecoration: 'none' }}
            >
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M9 1.5C4.858 1.5 1.5 4.858 1.5 9c0 1.306.34 2.532.935 3.595L1.5 16.5l3.99-1.012A7.43 7.43 0 009 16.5c4.142 0 7.5-3.358 7.5-7.5S13.142 1.5 9 1.5z" fill="currentColor" /></svg>
              Enviar WhatsApp
            </a>
            <a
              href={`/admin/agenda`}
              style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.55rem .75rem', background: '#b8965a12', border: '1px solid #b8965a30', borderRadius: '2px', fontSize: '.78rem', fontWeight: 500, color: '#b8965a', textDecoration: 'none' }}
            >
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><rect x="1" y="3" width="16" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 1v4M13 1v4M1 7h16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              Agendar Consulta
            </a>
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.55rem .75rem', background: '#3b82f612', border: '1px solid #3b82f630', borderRadius: '2px', fontSize: '.78rem', fontWeight: 500, color: '#3b82f6', textDecoration: 'none' }}
              >
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><rect x="1" y="3" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 4l8 6 8-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                Enviar E-mail
              </a>
            )}
          </div>
        </div>

        {/* Próxima Consulta */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.25rem' }}>
          <SectionTitle>Próxima consulta</SectionTitle>
          {proximaConsulta ? (
            <div style={{ padding: '.75rem', background: '#f5f4f2', borderRadius: '2px', borderLeft: '3px solid #b8965a' }}>
              <div style={{ fontSize: '.85rem', fontWeight: 500, color: '#0f0e0c' }}>{proximaConsulta.procedimento}</div>
              <div style={{ fontSize: '.75rem', color: '#7a7570', marginTop: '.25rem' }}>{formatDateTime(proximaConsulta.data_hora)}</div>
              <div style={{ fontSize: '.68rem', marginTop: '.35rem', color: '#b8965a', textTransform: 'uppercase', letterSpacing: '.06em' }}>{proximaConsulta.status}</div>
            </div>
          ) : (
            <p style={{ fontSize: '.78rem', color: '#7a7570', margin: 0 }}>Nenhuma consulta futura agendada.</p>
          )}
        </div>

        {/* Status */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.25rem' }}>
          <SectionTitle>Status do funil</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            {Object.entries(STATUS_LABELS).map(([value, label]) => {
              const color = STATUS_COLORS[value]
              const isActive = lead.status === value
              return (
                <button
                  key={value}
                  onClick={() => handleStatusChange(value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '.6rem',
                    padding: '.55rem .75rem', border: `1px solid ${isActive ? color : '#e5e5e3'}`,
                    borderRadius: '2px', background: isActive ? `${color}12` : 'transparent',
                    cursor: 'pointer', fontSize: '.8rem',
                    color: isActive ? color : '#7a7570', fontWeight: isActive ? 500 : 400, textAlign: 'left',
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                  {label}
                  {isActive && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                      <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Informações editáveis */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.25rem' }}>
          <SectionTitle>Informações</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <EditableRow label="CPF" field="cpf" value={lead.cpf} editingField={editingField} fieldValue={fieldValue}
              onEdit={(f, v) => { setEditingField(f); setFieldValue(v) }}
              onChange={setFieldValue} onSave={handleSaveField} onCancel={() => setEditingField(null)} />
            <EditableRow label="Data de nasc." field="data_nascimento" value={lead.data_nascimento}
              type="date" editingField={editingField} fieldValue={fieldValue}
              onEdit={(f, v) => { setEditingField(f); setFieldValue(v) }}
              onChange={setFieldValue} onSave={handleSaveField} onCancel={() => setEditingField(null)} />
            <EditableRow label="Convênio" field="convenio" value={lead.convenio} editingField={editingField} fieldValue={fieldValue}
              onEdit={(f, v) => { setEditingField(f); setFieldValue(v) }}
              onChange={setFieldValue} onSave={handleSaveField} onCancel={() => setEditingField(null)} />
            <EditableRow label="Indicado por" field="indicado_por" value={lead.indicado_por} editingField={editingField} fieldValue={fieldValue}
              onEdit={(f, v) => { setEditingField(f); setFieldValue(v) }}
              onChange={setFieldValue} onSave={handleSaveField} onCancel={() => setEditingField(null)} />
            <EditableRow label="Especialidade" field="especialidade" value={lead.especialidade} type="especialidade"
              editingField={editingField} fieldValue={fieldValue}
              onEdit={(f, v) => { setEditingField(f); setFieldValue(v) }}
              onChange={setFieldValue} onSave={handleSaveField} onCancel={() => setEditingField(null)} />
            <EditableRow label="Ticket estimado" field="ticket_estimado"
              value={lead.ticket_estimado != null ? String(lead.ticket_estimado) : null}
              type="number" editingField={editingField} fieldValue={fieldValue}
              onEdit={(f, v) => { setEditingField(f); setFieldValue(v) }}
              onChange={setFieldValue}
              onSave={(f, v) => handleSaveField(f, v)}
              onCancel={() => setEditingField(null)} />

            <div style={{ borderTop: '1px solid #f0f0ee', paddingTop: '.5rem', marginTop: '.25rem' }}>
              <InfoRow label="WhatsApp" value={formatWhatsApp(lead.whatsapp)} />
              {lead.email && <InfoRow label="E-mail" value={lead.email} />}
              {lead.origem && <InfoRow label="Origem" value={lead.origem} />}
              <InfoRow label="Cadastrado em" value={formatDateTime(lead.created_at)} />
              <InfoRow label="Atualizado em" value={formatDateTime(lead.updated_at)} />
            </div>
          </div>
        </div>

        {/* Resumo Financeiro */}
        {sideSummary !== null && (
          <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.25rem' }}>
            <SectionTitle>Resumo financeiro</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem' }}>
                <span style={{ color: '#7a7570' }}>Receitas confirmadas</span>
                <span style={{ color: '#10b981', fontWeight: 500 }}>R$ {sideSummary.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem' }}>
                <span style={{ color: '#7a7570' }}>Despesas confirmadas</span>
                <span style={{ color: '#ef4444', fontWeight: 500 }}>R$ {sideSummary.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', borderTop: '1px solid #f0f0ee', paddingTop: '.3rem', marginTop: '.1rem' }}>
                <span style={{ color: '#0f0e0c', fontWeight: 500 }}>Saldo</span>
                <span style={{ color: sideSummary.receitas >= sideSummary.despesas ? '#b8965a' : '#ef4444', fontWeight: 600 }}>
                  R$ {(sideSummary.receitas - sideSummary.despesas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Observações */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
            <SectionTitle style={{ marginBottom: 0 }}>Observações</SectionTitle>
            {!editingObs && (
              <button onClick={() => setEditingObs(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b8965a', fontSize: '.72rem' }}>
                Editar
              </button>
            )}
          </div>
          {editingObs ? (
            <>
              <textarea
                value={obsText} onChange={(e) => setObsText(e.target.value)} rows={4}
                placeholder="Adicione observações sobre este paciente..."
                style={{ width: '100%', border: '1px solid #e5e5e3', borderRadius: '2px', padding: '.65rem', fontSize: '.82rem', resize: 'vertical', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
                <button onClick={() => { setEditingObs(false); setObsText(lead.observacoes ?? '') }}
                  style={{ flex: 1, padding: '.5rem', border: '1px solid #e5e5e3', borderRadius: '2px', background: 'transparent', cursor: 'pointer', fontSize: '.75rem', color: '#7a7570' }}>
                  Cancelar
                </button>
                <button onClick={handleSaveObs} disabled={savingObs}
                  style={{ flex: 1, padding: '.5rem', border: 'none', borderRadius: '2px', background: '#b8965a', cursor: 'pointer', fontSize: '.75rem', fontWeight: 500, color: '#0f0e0c' }}>
                  {savingObs ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </>
          ) : (
            <p style={{ fontSize: '.82rem', color: lead.observacoes ? '#0f0e0c' : '#7a7570', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {lead.observacoes || 'Nenhuma observação.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-componentes ────────────────────────────────────────────────

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#7a7570', marginBottom: '.75rem', ...style }}>
      {children}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p style={{ fontSize: '.82rem', color: '#7a7570', textAlign: 'center', padding: '2rem' }}>{text}</p>
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem', padding: '.3rem 0' }}>
      <span style={{ fontSize: '.72rem', color: '#7a7570', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '.78rem', color: highlight ? '#b8965a' : '#0f0e0c', fontWeight: highlight ? 500 : 400, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: '.75rem', background: `${color}08`, border: `1px solid ${color}25`, borderRadius: '4px' }}>
      <div style={{ fontSize: '.62rem', color: '#7a7570', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.3rem' }}>{label}</div>
      <div style={{ fontSize: '.95rem', fontWeight: 600, color }}>{value}</div>
    </div>
  )
}

function EditableRow({
  label, field, value, type = 'text', editingField, fieldValue,
  onEdit, onChange, onSave, onCancel,
}: {
  label: string; field: string; value: string | null; type?: string
  editingField: string | null; fieldValue: string
  onEdit: (field: string, value: string) => void
  onChange: (v: string) => void
  onSave: (field: string, value: string) => void
  onCancel: () => void
}) {
  const isEditing = editingField === field
  const displayValue = type === 'especialidade'
    ? (ESPECIALIDADES.find((e) => e.value === value)?.label ?? value)
    : type === 'date' && value
      ? new Date(value + 'T12:00:00').toLocaleDateString('pt-BR')
      : value

  return (
    <div style={{ padding: '.35rem 0', borderBottom: '1px solid #f5f5f3' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem' }}>
        <span style={{ fontSize: '.72rem', color: '#7a7570', flexShrink: 0 }}>{label}</span>
        {!isEditing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            <span style={{ fontSize: '.78rem', color: displayValue ? '#0f0e0c' : '#c5c2be', textAlign: 'right' }}>
              {displayValue || '—'}
            </span>
            <button
              onClick={() => onEdit(field, value ?? '')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b8b4af', padding: '2px', display: 'flex', alignItems: 'center' }}
              title={`Editar ${label}`}
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      {isEditing && (
        <div style={{ marginTop: '.4rem', display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
          {type === 'especialidade' ? (
            <select value={fieldValue} onChange={(e) => onChange(e.target.value)} style={editInputStyle} autoFocus>
              <option value="">— sem especialidade —</option>
              {ESPECIALIDADES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          ) : (
            <input
              type={type} value={fieldValue} onChange={(e) => onChange(e.target.value)}
              style={editInputStyle} autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') onSave(field, fieldValue); if (e.key === 'Escape') onCancel() }}
            />
          )}
          <div style={{ display: 'flex', gap: '.35rem' }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '.35rem', border: '1px solid #e5e5e3', borderRadius: '2px', background: 'transparent', cursor: 'pointer', fontSize: '.72rem', color: '#7a7570' }}>
              Cancelar
            </button>
            <button onClick={() => onSave(field, fieldValue)} style={{ flex: 1, padding: '.35rem', border: 'none', borderRadius: '2px', background: '#b8965a', cursor: 'pointer', fontSize: '.72rem', fontWeight: 500, color: '#0f0e0c' }}>
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const editInputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #b8965a', borderRadius: '2px',
  padding: '.4rem .6rem', fontSize: '.82rem', outline: 'none',
  fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
}
