'use client'

import { useState, useCallback } from 'react'
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

export function AgendaCalendar({ events: initialEvents, leads }: Props) {
  const [events, setEvents] = useState(initialEvents)
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState(new Date())
  const [selected, setSelected] = useState<CalEvent | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newSlot, setNewSlot] = useState<{ start: Date; end: Date } | null>(null)

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
        borderRadius: '2px',
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
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '1rem' }}>{event.title}</h2>
        <p style={{ fontSize: '.85rem', color: '#7a7570', marginBottom: '.5rem' }}>
          <strong>Início:</strong> {event.start.toLocaleString('pt-BR')}
        </p>
        <p style={{ fontSize: '.85rem', color: '#7a7570', marginBottom: '.5rem' }}>
          <strong>Fim:</strong> {event.end.toLocaleString('pt-BR')}
        </p>
        {resource.leadWpp && (
          <p style={{ fontSize: '.85rem', color: '#7a7570', marginBottom: '.5rem' }}>
            <strong>WhatsApp:</strong>{' '}
            <a href={`https://wa.me/${resource.leadWpp}`} target="_blank" rel="noreferrer" style={{ color: '#b8965a' }}>
              {resource.leadWpp as string}
            </a>
          </p>
        )}
        <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem' }}>
          <button onClick={onClose} style={btnSecStyle}>Fechar</button>
          <button onClick={onCancel} style={{ ...btnSecStyle, color: '#ef4444', borderColor: '#ef4444' }}>Cancelar consulta</button>
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
  background: '#fff', borderRadius: '4px', padding: '2rem',
  width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,.15)',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '.72rem', letterSpacing: '.1em',
  textTransform: 'uppercase', color: '#7a7570', marginBottom: '.4rem',
}
const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e5e5e3', borderRadius: '2px',
  padding: '.65rem .9rem', fontSize: '.85rem', outline: 'none',
}
const btnSecStyle: React.CSSProperties = {
  flex: 1, padding: '.7rem', border: '1px solid #e5e5e3', borderRadius: '2px',
  background: 'transparent', cursor: 'pointer', fontSize: '.78rem', color: '#7a7570',
}
const btnPrimStyle: React.CSSProperties = {
  flex: 1, padding: '.7rem', border: 'none', borderRadius: '2px',
  background: '#b8965a', cursor: 'pointer', fontSize: '.78rem',
  fontWeight: 500, color: '#0f0e0c',
}
