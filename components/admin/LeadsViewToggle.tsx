'use client'

import { useState } from 'react'
import { LeadsKanban } from './LeadsKanban'
import { LeadsTable } from './LeadsTable'
import type { Lead } from '@/lib/supabase/types'

interface Coluna { id: string; label: string }
interface Props { leads: Lead[]; colunas: Coluna[]; byStatus: Record<string, Lead[]> }

const STATUS_COUNTS: Record<string, string> = {
  novo: '#b8965a', em_contato: '#3b82f6', agendado: '#10b981', proposta: '#8b5cf6', fechado: '#6b7280',
}

export function LeadsViewToggle({ leads, colunas, byStatus }: Props) {
  const [view, setView] = useState<'kanban' | 'tabela'>('kanban')

  return (
    <div className="admin-page" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', height: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '.2rem' }}>Pacientes</h1>
          <p style={{ fontSize: '.78rem', color: '#7a7570' }}>
            {leads.length} paciente{leads.length !== 1 ? 's' : ''} cadastrado{leads.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: '#f5f4f2', borderRadius: '6px', padding: '2px', gap: '2px' }}>
            {(['kanban', 'tabela'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '.38rem .8rem', border: 'none', cursor: 'pointer', fontSize: '.75rem',
                  borderRadius: '5px', fontWeight: 500,
                  background: view === v ? '#fff' : 'transparent',
                  color: view === v ? '#0f0e0c' : '#7a7570',
                  boxShadow: view === v ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
                  display: 'flex', alignItems: 'center', gap: '.35rem',
                  transition: 'all .12s',
                }}
              >
                {v === 'kanban' ? (
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="5.25" y="1" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="9.5" y="1" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M1 4.5h12M1 8h12M1 11.5h12M4.5 1v12" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                )}
                {v === 'kanban' ? 'Kanban' : 'Tabela'}
              </button>
            ))}
          </div>

          <a
            href="/api/leads?format=csv"
            style={{
              fontSize: '.75rem', color: '#7a7570',
              border: '1px solid #e5e5e3', padding: '.4rem .85rem',
              borderRadius: '6px', textDecoration: 'none',
              background: '#fff', display: 'flex', alignItems: 'center', gap: '.35rem',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 10v1.5A1.5 1.5 0 002.5 13h9a1.5 1.5 0 001.5-1.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Exportar
          </a>
        </div>
      </div>

      {/* Mini-stats bar */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
        {colunas.map((col) => {
          const count = byStatus[col.id]?.length ?? 0
          const color = STATUS_COUNTS[col.id] ?? '#7a7570'
          return (
            <div key={col.id} style={{
              display: 'flex', alignItems: 'center', gap: '.4rem',
              padding: '.3rem .7rem', background: '#fff',
              border: '1px solid #ebebea', borderRadius: '20px',
              fontSize: '.72rem', color: '#4a4a48',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
              {col.label}
              <span style={{ fontWeight: 600, color: '#0f0e0c' }}>{count}</span>
            </div>
          )
        })}
      </div>

      {view === 'kanban'
        ? <LeadsKanban colunas={colunas} byStatus={byStatus} />
        : <LeadsTable leads={leads} />
      }
    </div>
  )
}
