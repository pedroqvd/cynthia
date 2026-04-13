'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LeadsKanban } from './LeadsKanban'
import { LeadsTable } from './LeadsTable'
import type { Lead } from '@/lib/supabase/types'

interface Coluna { id: string; label: string }

interface Props {
  leads: Lead[]
  colunas: Coluna[]
  byStatus: Record<string, Lead[]>
}

export function LeadsViewToggle({ leads, colunas, byStatus }: Props) {
  const [view, setView] = useState<'kanban' | 'tabela'>('kanban')

  return (
    <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#0f0e0c' }}>Leads / CRM</h1>
          <p style={{ fontSize: '.85rem', color: '#7a7570' }}>{leads.length} leads no total</p>
        </div>

        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Toggle Kanban / Tabela */}
          <div style={{ display: 'flex', border: '1px solid #e5e5e3', borderRadius: '2px', overflow: 'hidden' }}>
            <button
              onClick={() => setView('kanban')}
              style={{
                padding: '.45rem .85rem', border: 'none', cursor: 'pointer', fontSize: '.75rem',
                background: view === 'kanban' ? '#0f0e0c' : 'transparent',
                color: view === 'kanban' ? '#f5f0e8' : '#7a7570',
                display: 'flex', alignItems: 'center', gap: '.4rem',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="6" y="1" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="11" y="1" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              Kanban
            </button>
            <button
              onClick={() => setView('tabela')}
              style={{
                padding: '.45rem .85rem', border: 'none', cursor: 'pointer', fontSize: '.75rem',
                background: view === 'tabela' ? '#0f0e0c' : 'transparent',
                color: view === 'tabela' ? '#f5f0e8' : '#7a7570',
                display: 'flex', alignItems: 'center', gap: '.4rem',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 5h14M1 9h14M1 13h14M5 1v14M11 1v14" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              Tabela
            </button>
          </div>

          <a
            href="/api/leads?format=csv"
            style={{
              fontSize: '.75rem',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: '#7a7570',
              border: '1px solid #e5e5e3',
              padding: '.45rem 1rem',
              borderRadius: '2px',
              textDecoration: 'none',
            }}
          >
            Exportar CSV
          </a>
        </div>
      </div>

      {view === 'kanban'
        ? <LeadsKanban colunas={colunas} byStatus={byStatus} />
        : <LeadsTable leads={leads} />
      }
    </div>
  )
}
