'use client'

import { useState } from 'react'
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

type Lead = {
  id: string
  nome: string
  whatsapp: string
  email: string | null
  especialidade: string | null
  urgencia: 'alta' | 'media' | 'baixa' | null
  origem: string | null
  status: 'novo' | 'em_contato' | 'agendado' | 'proposta' | 'fechado'
  ticket_estimado: number | null
  observacoes: string | null
  created_at: string
  updated_at: string
  messages: { id: string; direction: 'in' | 'out'; content: string; status: string | null; created_at: string }[]
  appointments: { id: string; procedimento: string; data_hora: string; duracao_min: number; status: string; notas: string | null }[]
  activity_log: { id: string; acao: string; detalhes: unknown; created_at: string }[]
}

const STATUS_COLORS: Record<string, string> = {
  novo: '#b8965a',
  em_contato: '#3b82f6',
  agendado: '#10b981',
  proposta: '#8b5cf6',
  fechado: '#6b7280',
}

const URGENCIA_COLORS: Record<string, string> = {
  alta: '#ef4444',
  media: '#f59e0b',
  baixa: '#10b981',
}

const APPT_STATUS_COLORS: Record<string, string> = {
  agendado: '#b8965a',
  confirmado: '#10b981',
  realizado: '#6b7280',
  cancelado: '#ef4444',
}

export function LeadProfile({ lead: initialLead }: { lead: Lead }) {
  const router = useRouter()
  const [lead, setLead] = useState(initialLead)
  const [editingObs, setEditingObs] = useState(false)
  const [obsText, setObsText] = useState(lead.observacoes ?? '')
  const [savingObs, setSavingObs] = useState(false)
  const [activeTab, setActiveTab] = useState<'mensagens' | 'consultas' | 'atividade'>('mensagens')

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

  async function handleDelete() {
    if (!confirm(`Excluir o lead "${lead.nome}" permanentemente? Esta ação não pode ser desfeita.`)) return
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Lead excluído.')
      router.push('/admin/leads')
    } catch {
      toast.error('Erro ao excluir lead.')
    }
  }

  const statusColor = STATUS_COLORS[lead.status] ?? '#b8965a'
  const urgenciaColor = lead.urgencia ? URGENCIA_COLORS[lead.urgencia] : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: '1.5rem' }} className="max-md:!grid-cols-1">

      {/* Coluna Principal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Cabeçalho do lead */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: `${statusColor}20`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.3rem', fontWeight: 600,
                color: statusColor, flexShrink: 0,
                fontFamily: 'Cormorant Garamond, Georgia, serif',
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
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '.4rem',
                  padding: '.5rem 1rem', background: '#25D366', color: '#fff',
                  borderRadius: '2px', fontSize: '.75rem', fontWeight: 500,
                  textDecoration: 'none', border: 'none',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1.5C4.858 1.5 1.5 4.858 1.5 9c0 1.306.34 2.532.935 3.595L1.5 16.5l3.99-1.012A7.43 7.43 0 009 16.5c4.142 0 7.5-3.358 7.5-7.5S13.142 1.5 9 1.5z" fill="currentColor"/>
                </svg>
                WhatsApp
              </a>
              <button
                onClick={handleDelete}
                style={{
                  padding: '.5rem 1rem', background: 'transparent', color: '#ef4444',
                  border: '1px solid #ef444440', borderRadius: '2px', fontSize: '.75rem',
                  cursor: 'pointer',
                }}
              >
                Excluir lead
              </button>
            </div>
          </div>
        </div>

        {/* Tabs: Mensagens / Consultas / Atividade */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e5e3' }}>
            {(['mensagens', 'consultas', 'atividade'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '.85rem 1.25rem', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: '.82rem', fontWeight: 500,
                  color: activeTab === tab ? '#b8965a' : '#7a7570',
                  borderBottom: activeTab === tab ? '2px solid #b8965a' : '2px solid transparent',
                  marginBottom: '-1px',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'mensagens' && `Mensagens (${lead.messages.length})`}
                {tab === 'consultas' && `Consultas (${lead.appointments.length})`}
                {tab === 'atividade' && `Atividade (${lead.activity_log.length})`}
              </button>
            ))}
          </div>

          <div style={{ padding: '1rem', maxHeight: '420px', overflowY: 'auto' }}>

            {/* Tab Mensagens */}
            {activeTab === 'mensagens' && (
              lead.messages.length === 0
                ? <p style={{ fontSize: '.82rem', color: '#7a7570', textAlign: 'center', padding: '2rem' }}>Nenhuma mensagem encontrada.</p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {lead.messages.map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: msg.direction === 'out' ? 'row-reverse' : 'row',
                          gap: '.5rem',
                        }}
                      >
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

            {/* Tab Consultas */}
            {activeTab === 'consultas' && (
              lead.appointments.length === 0
                ? <p style={{ fontSize: '.82rem', color: '#7a7570', textAlign: 'center', padding: '2rem' }}>Nenhuma consulta encontrada.</p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {lead.appointments.map((appt) => {
                      const color = APPT_STATUS_COLORS[appt.status] ?? '#b8965a'
                      return (
                        <div key={appt.id} style={{
                          padding: '1rem', background: '#fafaf9', borderRadius: '2px',
                          borderLeft: `3px solid ${color}`,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                            <div>
                              <div style={{ fontSize: '.88rem', fontWeight: 500, color: '#0f0e0c' }}>{appt.procedimento}</div>
                              <div style={{ fontSize: '.75rem', color: '#7a7570', marginTop: '.2rem' }}>
                                {formatDateTime(appt.data_hora)} · {appt.duracao_min}min
                              </div>
                              {appt.notas && <div style={{ fontSize: '.75rem', color: '#7a7570', marginTop: '.4rem', fontStyle: 'italic' }}>{appt.notas}</div>}
                            </div>
                            <span style={{
                              fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em',
                              color, background: `${color}18`, padding: '.2rem .6rem', borderRadius: '2px', flexShrink: 0,
                            }}>
                              {appt.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
            )}

            {/* Tab Atividade */}
            {activeTab === 'atividade' && (
              lead.activity_log.length === 0
                ? <p style={{ fontSize: '.82rem', color: '#7a7570', textAlign: 'center', padding: '2rem' }}>Sem registros de atividade.</p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {lead.activity_log.map((log) => (
                      <div key={log.id} style={{
                        display: 'flex', gap: '.75rem', alignItems: 'flex-start',
                        padding: '.65rem', borderBottom: '1px solid #f0f0ee',
                      }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#b8965a', marginTop: '6px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '.8rem', color: '#0f0e0c' }}>{log.acao.replace(/_/g, ' ')}</div>
                          <div style={{ fontSize: '.68rem', color: '#7a7570', marginTop: '.15rem' }}>{formatDateTime(log.created_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
            )}
          </div>
        </div>
      </div>

      {/* Coluna Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Status */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.25rem' }}>
          <div style={{ fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#7a7570', marginBottom: '.75rem' }}>
            Status do funil
          </div>
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
                    color: isActive ? color : '#7a7570', fontWeight: isActive ? 500 : 400,
                    textAlign: 'left',
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

        {/* Dados */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.25rem' }}>
          <div style={{ fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#7a7570', marginBottom: '.75rem' }}>
            Informações
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            <InfoRow label="WhatsApp" value={formatWhatsApp(lead.whatsapp)} />
            {lead.email && <InfoRow label="E-mail" value={lead.email} />}
            {lead.especialidade && <InfoRow label="Especialidade" value={ESPECIALIDADE_LABELS[lead.especialidade] ?? lead.especialidade} />}
            {lead.origem && <InfoRow label="Origem" value={lead.origem} />}
            {lead.ticket_estimado && (
              <InfoRow label="Ticket estimado" value={`R$ ${lead.ticket_estimado.toLocaleString('pt-BR')}`} highlight />
            )}
            <InfoRow label="Cadastrado em" value={formatDateTime(lead.created_at)} />
          </div>
        </div>

        {/* Observações */}
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
            <div style={{ fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#7a7570' }}>
              Observações
            </div>
            {!editingObs && (
              <button
                onClick={() => setEditingObs(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b8965a', fontSize: '.72rem' }}
              >
                Editar
              </button>
            )}
          </div>
          {editingObs ? (
            <>
              <textarea
                value={obsText}
                onChange={(e) => setObsText(e.target.value)}
                rows={4}
                placeholder="Adicione observações sobre este lead..."
                style={{
                  width: '100%', border: '1px solid #e5e5e3', borderRadius: '2px',
                  padding: '.65rem', fontSize: '.82rem', resize: 'vertical',
                  fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
                <button
                  onClick={() => { setEditingObs(false); setObsText(lead.observacoes ?? '') }}
                  style={{ flex: 1, padding: '.5rem', border: '1px solid #e5e5e3', borderRadius: '2px', background: 'transparent', cursor: 'pointer', fontSize: '.75rem', color: '#7a7570' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveObs}
                  disabled={savingObs}
                  style={{ flex: 1, padding: '.5rem', border: 'none', borderRadius: '2px', background: '#b8965a', cursor: 'pointer', fontSize: '.75rem', fontWeight: 500, color: '#0f0e0c' }}
                >
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

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem' }}>
      <span style={{ fontSize: '.72rem', color: '#7a7570', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '.78rem', color: highlight ? '#b8965a' : '#0f0e0c', fontWeight: highlight ? 500 : 400, textAlign: 'right' }}>{value}</span>
    </div>
  )
}
