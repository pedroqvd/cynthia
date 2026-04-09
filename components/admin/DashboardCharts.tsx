'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useMemo } from 'react'

interface Lead {
  id: string
  nome: string
  status: string
  created_at: string
  especialidade: string | null
}

interface Props {
  leadsRecentes: Lead[]
}

const STATUS_COLORS: Record<string, string> = {
  novo: '#b8965a',
  em_contato: '#3b82f6',
  agendado: '#10b981',
  proposta: '#8b5cf6',
  fechado: '#6b7280',
}

export function DashboardCharts({ leadsRecentes }: Props) {
  // Agrupa leads por dia (últimos 30 dias)
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

  // Agrupa por especialidade para pizza
  const porEspecialidade = useMemo(() => {
    const map: Record<string, number> = {}
    leadsRecentes.forEach((l) => {
      const key = l.especialidade ?? 'Não informado'
      map[key] = (map[key] ?? 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [leadsRecentes])

  const COLORS = ['#b8965a', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
      {/* Gráfico de linha — leads por dia */}
      <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '.9rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '1.5rem' }}>
          Novos leads — últimos 30 dias
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={leadsPorDia}>
            <defs>
              <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b8965a" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#b8965a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="dia"
              tick={{ fontSize: 10, fill: '#7a7570' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10, fill: '#7a7570' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#0f0e0c', border: '1px solid rgba(184,150,90,0.25)', borderRadius: '2px', fontSize: '12px', color: '#f5f0e8' }}
              labelStyle={{ color: '#b8965a' }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#b8965a"
              strokeWidth={2}
              fill="url(#gradGold)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pizza — por especialidade */}
      <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '.9rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '1rem' }}>
          Por especialidade
        </h2>
        {porEspecialidade.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={porEspecialidade}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  dataKey="value"
                >
                  {porEspecialidade.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f0e0c', border: '1px solid rgba(184,150,90,0.25)', borderRadius: '2px', fontSize: '12px', color: '#f5f0e8' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {porEspecialidade.map((item, i) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.72rem', color: '#7a7570' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  {item.name}: <strong style={{ color: '#0f0e0c' }}>{item.value}</strong>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ fontSize: '.82rem', color: '#7a7570' }}>Sem dados suficientes.</p>
        )}
      </div>
    </div>
  )
}
