'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Lead } from '@/lib/supabase/types'
import {
  URGENCIA_LABELS,
  STATUS_LABELS,
  ESPECIALIDADE_LABELS,
  formatDateTime,
} from '@/lib/utils'

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

interface Props {
  leads: Lead[]
}

export function LeadsTable({ leads: initialLeads }: Props) {
  const [leads, setLeads] = useState(initialLeads)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterUrgencia, setFilterUrgencia] = useState('')
  const [filterEspecialidade, setFilterEspecialidade] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'nome' | 'ticket_estimado'>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(col); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    let list = leads

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (l) =>
          l.nome.toLowerCase().includes(q) ||
          l.whatsapp.includes(q) ||
          (l.email ?? '').toLowerCase().includes(q) ||
          (l.cpf ?? '').replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      )
    }
    if (filterStatus) list = list.filter((l) => l.status === filterStatus)
    if (filterUrgencia) list = list.filter((l) => l.urgencia === filterUrgencia)
    if (filterEspecialidade) list = list.filter((l) => l.especialidade === filterEspecialidade)

    list = [...list].sort((a, b) => {
      let va: string | number = a[sortBy] ?? ''
      let vb: string | number = b[sortBy] ?? ''
      if (sortBy === 'ticket_estimado') { va = Number(va); vb = Number(vb) }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [leads, search, filterStatus, filterUrgencia, filterEspecialidade, sortBy, sortDir])

  async function handleStatusChange(leadId: string, status: string) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: status as Lead['status'] } : l))
      toast.success(`Status atualizado para "${STATUS_LABELS[status]}"`)
    } else {
      toast.error('Erro ao atualizar status.')
    }
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: sortBy === col ? 1 : 0.3, marginLeft: '4px' }}>
      {sortDir === 'asc' && sortBy === col
        ? <path d="M5 1l4 8H1l4-8z" fill="currentColor"/>
        : <path d="M5 9L1 1h8L5 9z" fill="currentColor"/>
      }
    </svg>
  )

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#7a7570' }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, WhatsApp, e-mail, CPF…"
            style={{
              width: '100%', paddingLeft: '30px', paddingRight: '10px',
              height: '44px', border: '1px solid #e5e5e3', borderRadius: '2px',
              fontSize: '.82rem', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <select value={filterUrgencia} onChange={(e) => setFilterUrgencia(e.target.value)} style={selectStyle}>
          <option value="">Todas as urgências</option>
          {Object.entries(URGENCIA_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <select value={filterEspecialidade} onChange={(e) => setFilterEspecialidade(e.target.value)} style={selectStyle}>
          <option value="">Todas as especialidades</option>
          {Object.entries(ESPECIALIDADE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        {(search || filterStatus || filterUrgencia || filterEspecialidade) && (
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterUrgencia(''); setFilterEspecialidade('') }}
            style={{ height: '36px', padding: '0 .75rem', border: '1px solid #e5e5e3', borderRadius: '2px', background: 'transparent', cursor: 'pointer', fontSize: '.75rem', color: '#7a7570' }}
          >
            Limpar
          </button>
        )}

        <span style={{ fontSize: '.75rem', color: '#7a7570', marginLeft: 'auto' }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabela */}
      <div className="table-scroll-wrap" style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e5e3', background: '#fafaf9' }}>
              <Th onClick={() => toggleSort('nome')}>
                Nome <SortIcon col="nome" />
              </Th>
              <Th>WhatsApp</Th>
              <Th>Especialidade</Th>
              <Th>Status</Th>
              <Th>Urgência</Th>
              <Th onClick={() => toggleSort('ticket_estimado')}>
                Ticket <SortIcon col="ticket_estimado" />
              </Th>
              <Th onClick={() => toggleSort('created_at')}>
                Cadastro <SortIcon col="created_at" />
              </Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#7a7570', fontSize: '.82rem' }}>
                  Nenhum paciente encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((lead) => {
                const statusColor = STATUS_COLORS[lead.status]
                const urgColor = lead.urgencia ? URGENCIA_COLORS[lead.urgencia] : null
                return (
                  <tr
                    key={lead.id}
                    style={{ borderBottom: '1px solid #f0f0ee' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#faf7f2' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <td style={{ padding: '.75rem 1rem', fontWeight: 500, color: '#0f0e0c' }}>
                      <Link href={`/admin/leads/${lead.id}`} style={{ color: '#0f0e0c', textDecoration: 'none' }}>
                        {lead.nome}
                      </Link>
                    </td>
                    <td style={{ padding: '.75rem 1rem', color: '#7a7570' }}>{lead.whatsapp}</td>
                    <td style={{ padding: '.75rem 1rem', color: '#7a7570' }}>
                      {lead.especialidade ? (ESPECIALIDADE_LABELS[lead.especialidade] ?? lead.especialidade) : '—'}
                    </td>
                    <td style={{ padding: '.75rem 1rem' }}>
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        style={{
                          border: `1px solid ${statusColor}40`,
                          borderRadius: '2px', background: `${statusColor}12`,
                          color: statusColor, fontSize: '.72rem', padding: '.2rem .4rem',
                          cursor: 'pointer', outline: 'none', fontWeight: 500,
                        }}
                      >
                        {Object.entries(STATUS_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '.75rem 1rem' }}>
                      {lead.urgencia ? (
                        <span style={{
                          fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em',
                          color: urgColor!, background: `${urgColor}18`,
                          padding: '.15rem .5rem', borderRadius: '2px',
                        }}>
                          {URGENCIA_LABELS[lead.urgencia]}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '.75rem 1rem', color: lead.ticket_estimado ? '#b8965a' : '#7a7570', fontWeight: lead.ticket_estimado ? 500 : 400 }}>
                      {lead.ticket_estimado ? `R$ ${lead.ticket_estimado.toLocaleString('pt-BR')}` : '—'}
                    </td>
                    <td style={{ padding: '.75rem 1rem', color: '#7a7570', whiteSpace: 'nowrap' }}>
                      {formatDateTime(lead.created_at)}
                    </td>
                    <td style={{ padding: '.75rem 1rem' }}>
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        style={{ fontSize: '.72rem', color: '#b8965a', textDecoration: 'none', whiteSpace: 'nowrap' }}
                      >
                        Ver perfil →
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <th
      onClick={onClick}
      style={{
        padding: '.65rem 1rem', textAlign: 'left', fontSize: '.7rem',
        letterSpacing: '.08em', textTransform: 'uppercase', color: '#7a7570',
        fontWeight: 500, cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  )
}

const selectStyle: React.CSSProperties = {
  height: '44px', border: '1px solid #e5e5e3', borderRadius: '2px',
  fontSize: '.8rem', padding: '0 .75rem', outline: 'none', background: '#fff',
  color: '#0f0e0c', cursor: 'pointer',
}
