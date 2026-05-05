'use client'

import { useState, useCallback, useEffect } from 'react'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { toast } from 'sonner'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales: { 'pt-BR': ptBR },
})

const EVENT_COLORS: Record<string, string> = {
  agendado: '#b8965a',
  confirmado: '#10b981',
  realizado: '#6b7280',
  cancelado: '#ef4444',
}

interface CalEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Record<string, unknown>
}

interface Lead {
  id: string
  nome: string
  whatsapp: string
}

interface Props {
  events: CalEvent[]
  leads: Lead[]
}

const STORAGE_KEY = 'agenda_prefs'

function loadPrefs(): { view: View } {
  if (typeof window === 'undefined') return { view: 'week' }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { view: 'week' }
    return JSON.parse(raw) as { view: View }
  } catch {
    return { view: 'week' }
  }
}

export function AgendaCalendar({ events: initialEvents, leads }: Props) {
  const [events, setEvents] = useState(initialEvents)
  const prefs = loadPrefs()
  const [view, setView] = useState<View>(prefs.view)
  const [date, setDate] = useState(new Date())
  const [selected, setSelected] = useState<CalEvent | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newSlot, setNewSlot] = useState<{ start: Date; end: Date } | null>(null)

  // Persiste preferências de visualização no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ view }))
    } catch { /* privado/incognito */ }
  }, [view])

  const handleSelectEvent = useCallback((event: CalEvent) => {
    setSelected(event)
  }, [])

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setNewSlot({ start, end })
    setShowNewModal(true)
  }, [])

  const eventStyleGetter = useCallback((event: CalEvent) => {
    const status = (event.resource?.status as string) ?? 'agendado'
    const color = EVENT_COLORS[status] ?? '#b8965a'
    return {
      style: {
        backgroundColor: `${color}22`,
        borderLeft: `3px solid ${color}`,
        color: '#0f0e0c',
        fontSize: '12px',
        borderRadius: '4px',
      },
    }
  }, [])

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Legenda */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {Object.entries(EVENT_COLORS).map(([status, color]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.72rem', color: '#7a7570' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        ))}
      </div>

      {/* Calendário */}
      <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', overflow: 'hidden' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 220px)' }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          selectable
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventStyleGetter}
          culture="pt-BR"
          messages={{
            next: 'Próximo',
            previous: 'Anterior',
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            agenda: 'Lista',
            noEventsInRange: 'Nenhum evento neste período.',
          }}
        />
      </div>

      {/* Modal de evento selecionado */}
      {selected && (
        <EventModal
          event={selected}
          onClose={() => setSelected(null)}
          onCancel={async () => {
            try {
              await fetch(`/api/calendar/events/${selected.id}`, { method: 'DELETE' })
              setEvents((prev) => prev.filter((e) => e.id !== selected.id))
              setSelected(null)
              toast.success('Consulta cancelada.')
            } catch {
              toast.error('Erro ao cancelar.')
            }
          }}
        />
      )}

      {/* Modal de novo agendamento */}
      {showNewModal && newSlot && (
        <NewEventModal
          slot={newSlot}
          leads={leads}
          onClose={() => setShowNewModal(false)}
          onCreated={(event) => {
            setEvents((prev) => [...prev, event])
            setShowNewModal(false)
            toast.success('Consulta agendada com sucesso!')
          }}
        />
      )}
    </div>
  )
}

function EventModal({ event, onClose, onCancel }: { event: CalEvent; onClose: () => void; onCancel: () => void }) {
  const resource = event.resource
  const [showPayment, setShowPayment] = useState(false)
  const [payValor, setPayValor] = useState('')
  const [payStatus, setPayStatus] = useState<'confirmado' | 'pendente'>('confirmado')
  const [payDescricao, setPayDescricao] = useState(`Consulta — ${event.title}`)
  const [savingPay, setSavingPay] = useState(false)
  const [payDone, setPayDone] = useState(false)

  async function registrarPagamento() {
    if (!payValor || Number(payValor) <= 0) { toast.error('Informe o valor.'); return }
    setSavingPay(true)
    try {
      const res = await fetch('/api/financial/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'receita',
          descricao: payDescricao,
          valor: Number(payValor),
          data: event.start.toISOString().slice(0, 10),
          status: payStatus,
          lead_id: resource.lead_id ?? undefined,
          appointment_id: event.id,
        }),
      })
      if (!res.ok) throw new Error()
      setPayDone(true)
      setShowPayment(false)
      toast.success('Lançamento registrado.')
    } catch {
      toast.error('Erro ao registrar pagamento.')
    } finally {
      setSavingPay(false)
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalStyle, borderRadius: '8px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f0e0c', lineHeight: 1.3, paddingRight: '1rem' }}>{event.title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b8b4af', padding: '2px', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '.82rem', color: '#7a7570' }}>
            <strong style={{ color: '#0f0e0c' }}>Início:</strong> {event.start.toLocaleString('pt-BR')}
          </div>
          <div style={{ fontSize: '.82rem', color: '#7a7570' }}>
            <strong style={{ color: '#0f0e0c' }}>Fim:</strong> {event.end.toLocaleString('pt-BR')}
          </div>
          {resource.leadWpp && (
            <div style={{ fontSize: '.82rem', color: '#7a7570' }}>
              <strong style={{ color: '#0f0e0c' }}>WhatsApp:</strong>{' '}
              <a href={`https://wa.me/${resource.leadWpp}`} target="_blank" rel="noreferrer" style={{ color: '#7a7570' }}>
                {resource.leadWpp as string}
              </a>
            </div>
          )}
        </div>

        {/* Links para o paciente */}
        {resource.lead_id && (
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <a href={`/admin/leads/${resource.lead_id as string}`}
              style={{ fontSize: '.75rem', color: '#0f0e0c', textDecoration: 'none', padding: '.4rem .8rem', border: '1px solid #ebebea', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M1.5 14c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Ver perfil
            </a>
            <a href={`/admin/leads/${resource.lead_id as string}?tab=prontuario`}
              style={{ fontSize: '.75rem', color: '#0f0e0c', textDecoration: 'none', padding: '.4rem .8rem', border: '1px solid #ebebea', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M3 2h10a1 1 0 011 1v11a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M5 6h6M5 9h6M5 12h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Prontuário
            </a>
          </div>
        )}

        {/* Lançamento financeiro */}
        <div style={{ borderTop: '1px solid #f0f0ee', paddingTop: '1rem' }}>
          {payDone ? (
            <div style={{ fontSize: '.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Lançamento registrado com sucesso
            </div>
          ) : showPayment ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              <div style={{ fontSize: '.68rem', fontWeight: 600, color: '#b8b4af', textTransform: 'uppercase', letterSpacing: '.08em' }}>Registrar pagamento</div>
              <input value={payDescricao} onChange={(e) => setPayDescricao(e.target.value)} placeholder="Descrição" style={inputStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                <input type="number" min="0" step="10" value={payValor} onChange={(e) => setPayValor(e.target.value)} placeholder="Valor (R$)" style={inputStyle} />
                <select value={payStatus} onChange={(e) => setPayStatus(e.target.value as 'confirmado' | 'pendente')} style={inputStyle}>
                  <option value="confirmado">Confirmado</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button onClick={() => setShowPayment(false)} style={btnSecStyle}>Cancelar</button>
                <button onClick={registrarPagamento} disabled={savingPay} style={btnPrimStyle}>
                  {savingPay ? 'Salvando...' : 'Salvar lançamento'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowPayment(true)} style={{ ...btnSecStyle, width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M8 4.5v7M5 8h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Registrar pagamento
            </button>
          )}
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: '.75rem', marginTop: '1rem' }}>
          <button onClick={onCancel} style={{ ...btnSecStyle, flex: 1, color: '#ef4444', borderColor: '#ef444430' }}>Cancelar consulta</button>
        </div>
      </div>
    </div>
  )
}

function NewEventModal({ slot, leads, onClose, onCreated }: { slot: { start: Date; end: Date }; leads: Lead[]; onClose: () => void; onCreated: (e: CalEvent) => void }) {
  const [leadId, setLeadId] = useState('')
  const [procedimento, setProcedimento] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!procedimento) return
    setLoading(true)

    try {
      const duracaoMin = Math.round((slot.end.getTime() - slot.start.getTime()) / 60000)
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId || undefined,
          procedimento,
          data_hora: slot.start.toISOString(),
          duracao_min: duracaoMin > 0 ? duracaoMin : 60,
        }),
      })
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      const lead = leads.find((l) => l.id === leadId)
      onCreated({
        id: data.id,
        title: `${procedimento} — ${lead?.nome ?? 'Paciente'}`,
        start: slot.start,
        end: slot.end,
        resource: { ...data, leadNome: lead?.nome, status: 'agendado' },
      })
    } catch {
      toast.error('Erro ao agendar consulta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '1.5rem' }}>Nova consulta</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Paciente (lead)</label>
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)} style={inputStyle}>
              <option value="">— Sem lead associado —</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Procedimento *</label>
            <input value={procedimento} onChange={(e) => setProcedimento(e.target.value)} required placeholder="Ex: Facetas de porcelana" style={inputStyle} />
          </div>
          <p style={{ fontSize: '.78rem', color: '#7a7570' }}>
            {slot.start.toLocaleDateString('pt-BR')} das {slot.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às {slot.end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
            <button type="button" onClick={onClose} style={btnSecStyle}>Cancelar</button>
            <button type="submit" disabled={loading} style={btnPrimStyle}>{loading ? 'Agendando...' : 'Agendar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: '8px', padding: '1.5rem',
  width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,.15)',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '.72rem', letterSpacing: '.08em',
  textTransform: 'uppercase', color: '#b8b4af', marginBottom: '.4rem', fontWeight: 600,
}
const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #ebebea', borderRadius: '6px',
  padding: '.6rem .85rem', fontSize: '.85rem', outline: 'none',
  fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box', color: '#0f0e0c',
}
const btnSecStyle: React.CSSProperties = {
  flex: 1, padding: '.65rem', border: '1px solid #ebebea', borderRadius: '6px',
  background: '#fff', cursor: 'pointer', fontSize: '.78rem', color: '#7a7570',
}
const btnPrimStyle: React.CSSProperties = {
  flex: 1, padding: '.65rem', border: 'none', borderRadius: '6px',
  background: '#0f0e0c', cursor: 'pointer', fontSize: '.78rem',
  fontWeight: 500, color: '#f5f0e8',
}
