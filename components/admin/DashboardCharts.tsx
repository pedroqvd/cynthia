'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo } from 'react'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import Link from 'next/link'

interface Lead {
  id: string
  nome: string
  status: string
  created_at: string
  especialidade: string | null
}

interface FunilItem {
  status: string
  label: string
  count: number
  color: string
}

interface Props {
  leadsRecentes: Lead[]
  funil: FunilItem[]
}

export function DashboardCharts({ leadsRecentes, funil }: Props) {
  const isMobile = useIsMobile()

  const leadsPorDia = useMemo(() => {
    const map: Record<string, number> = {}
    const hoje = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(hoje)
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      map[key] = 0
    }
    leadsRecentes.forEach((l) => {
      const key = new Date(l.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      if (key in map) map[key]++
    })
    return Object.entries(map).map(([dia, total]) => ({ dia, total }))
  }, [leadsRecentes])

  const maxFunil = Math.max(...funil.map((f) => f.count), 1)
  const total = funil.reduce((s, f) => s + f.count, 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: '1.25rem' }}>

      {/* Gráfico área — leads por dia */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={cardTitle}>Novos leads</h2>
            <p style={cardSub}>Últimos 30 dias</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#0f0e0c' }}>
              {leadsRecentes.length}
            </div>
            <div style={{ fontSize: '.65rem', color: '#b8b4af' }}>no período</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={leadsPorDia} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b8965a" stopOpacity={0.18}/>
                <stop offset="95%" stopColor="#b8965a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="dia" tick={{ fontSize: 9, fill: '#b8b4af' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: '#b8b4af' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#0f0e0c', border: '1px solid rgba(184,150,90,0.2)', borderRadius: '4px', fontSize: '12px', color: '#f5f0e8', padding: '6px 10px' }}
              labelStyle={{ color: '#b8965a', marginBottom: '2px' }}
              cursor={{ stroke: '#e5e5e3', strokeWidth: 1 }}
            />
            <Area type="monotone" dataKey="total" stroke="#b8965a" strokeWidth={1.5} fill="url(#gradGold)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Funil */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={cardTitle}>Pipeline</h2>
            <p style={cardSub}>Distribuição por etapa</p>
          </div>
          <Link href="/admin/leads" style={{ fontSize: '.72rem', color: '#b8965a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.2rem' }}>
            Ver todos
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {funil.map((item, i) => {
            const pct = maxFunil > 0 ? (item.count / maxFunil) * 100 : 0
            const convPct = i > 0 && funil[i - 1].count > 0
              ? Math.round((item.count / funil[i - 1].count) * 100)
              : null
            const sharePct = total > 0 ? Math.round((item.count / total) * 100) : 0

            return (
              <div key={item.status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '.78rem', color: '#4a4a48' }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    {convPct !== null && item.count > 0 && (
                      <span style={{
                        fontSize: '.62rem',
                        color: convPct >= 50 ? '#10b981' : convPct >= 25 ? '#f59e0b' : '#ef4444',
                        background: convPct >= 50 ? '#d1fae5' : convPct >= 25 ? '#fef3c7' : '#fee2e2',
                        padding: '1px 5px', borderRadius: '3px',
                      }}>
                        {convPct}%
                      </span>
                    )}
                    <span style={{ fontSize: '.82rem', fontWeight: 600, color: '#0f0e0c', minWidth: '20px', textAlign: 'right' }}>
                      {item.count}
                    </span>
                  </div>
                </div>
                <div style={{ height: '5px', background: '#f3f4f6', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: '10px', transition: 'width .4s ease' }} />
                </div>
              </div>
            )
          })}
        </div>

        {funil[funil.length - 1]?.count > 0 && funil[0]?.count > 0 && (
          <div style={{ marginTop: '1rem', paddingTop: '.75rem', borderTop: '1px solid #f0f0ee', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '.72rem', color: '#7a7570' }}>Conversão global</span>
            <span style={{ fontSize: '.78rem', fontWeight: 600, color: '#10b981' }}>
              {Math.round((funil[funil.length - 1].count / funil[0].count) * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ebebea',
  borderRadius: '8px',
  padding: '1.25rem',
}

const cardTitle: React.CSSProperties = {
  fontSize: '.88rem',
  fontWeight: 500,
  color: '#0f0e0c',
  marginBottom: '.1rem',
}

const cardSub: React.CSSProperties = {
  fontSize: '.68rem',
  color: '#b8b4af',
}
