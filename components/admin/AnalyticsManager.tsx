'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Types ───────────────────────────────────────────────────────────────────

type SocialMetric = {
  id: string
  platform: string
  periodo: string
  seguidores: number
  novos_seguidores: number
  alcance: number
  impressoes: number
  engajamento: number
  curtidas: number
  comentarios: number
  compartilhamentos: number
  salvamentos: number
  visitas_perfil: number
  cliques_link: number
  notas: string | null
  created_at: string
}

type FormData = Omit<SocialMetric, 'id' | 'created_at'>

// ─── Constants ───────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: '#E1306C', icon: '📸' },
  { id: 'tiktok',   label: 'TikTok',    color: '#fe2c55', icon: '🎵' },
  { id: 'linkedin', label: 'LinkedIn',  color: '#0A66C2', icon: '💼' },
  { id: 'x',        label: 'X',         color: '#000000', icon: '𝕏' },
  { id: 'facebook', label: 'Facebook',  color: '#1877F2', icon: '👥' },
]

const EMPTY_FORM: FormData = {
  platform: 'instagram',
  periodo: '',
  seguidores: 0,
  novos_seguidores: 0,
  alcance: 0,
  impressoes: 0,
  engajamento: 0,
  curtidas: 0,
  comentarios: 0,
  compartilhamentos: 0,
  salvamentos: 0,
  visitas_perfil: 0,
  cliques_link: 0,
  notas: null,
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const DS = {
  bg: '#f7f6f4',
  white: '#fff',
  dark: '#0f0e0c',
  gold: '#b8965a',
  border: '#ebebea',
  secondary: '#7a7570',
  muted: '#b8b4af',
  radius8: '8px',
  radius6: '6px',
}

const btnPrimary: React.CSSProperties = {
  background: DS.dark,
  color: '#f5f0e8',
  borderRadius: DS.radius6,
  border: 'none',
  padding: '.55rem 1.1rem',
  fontSize: '.85rem',
  fontWeight: 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const btnSecondary: React.CSSProperties = {
  background: DS.white,
  color: DS.secondary,
  border: `1px solid ${DS.border}`,
  borderRadius: DS.radius6,
  padding: '.55rem 1.1rem',
  fontSize: '.85rem',
  fontWeight: 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const inputStyle: React.CSSProperties = {
  border: `1px solid ${DS.border}`,
  borderRadius: DS.radius6,
  padding: '.6rem .85rem',
  fontSize: '.85rem',
  background: DS.white,
  color: DS.dark,
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtPeriodo(iso: string): string {
  try {
    // periodo comes as YYYY-MM-DD, format as MMM/YY
    return format(parseISO(iso), 'MMM/yy', { locale: ptBR })
  } catch {
    return iso
  }
}

function fmtDate(iso: string): string {
  try {
    return format(parseISO(iso), 'dd/MM/yyyy')
  } catch {
    return iso
  }
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(n)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ platformColor }: { platformColor: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '3rem 1rem', gap: '1rem', color: DS.muted, textAlign: 'center',
    }}>
      <div style={{ fontSize: '2.5rem', opacity: 0.5 }}>📊</div>
      <div style={{ fontSize: '1rem', fontWeight: 600, color: DS.secondary }}>Nenhuma métrica registrada</div>
      <div style={{ fontSize: '.85rem', maxWidth: 320 }}>
        Clique em "+ Adicionar métricas" para registrar o desempenho desta plataforma.
      </div>
      <div style={{
        width: 40, height: 3, borderRadius: 2, background: platformColor, opacity: 0.5, marginTop: '0.5rem'
      }} />
    </div>
  )
}

function SummaryCard({
  label, value, sub,
}: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: DS.white, border: `1px solid ${DS.border}`, borderRadius: DS.radius8,
      padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '.35rem',
    }}>
      <div style={{ fontSize: '.75rem', color: DS.muted, textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: DS.dark, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '.75rem', color: DS.secondary }}>{sub}</div>}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function MetricModal({
  open, editing, platform, platformColor,
  onClose, onSave,
}: {
  open: boolean
  editing: SocialMetric | null
  platform: string
  platformColor: string
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
}) {
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM, platform })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editing) {
      // Convert YYYY-MM-DD to YYYY-MM for the month input
      const monthVal = editing.periodo ? editing.periodo.slice(0, 7) : ''
      setForm({
        platform: editing.platform,
        periodo: monthVal,
        seguidores: editing.seguidores,
        novos_seguidores: editing.novos_seguidores,
        alcance: editing.alcance,
        impressoes: editing.impressoes,
        engajamento: editing.engajamento,
        curtidas: editing.curtidas,
        comentarios: editing.comentarios,
        compartilhamentos: editing.compartilhamentos,
        salvamentos: editing.salvamentos,
        visitas_perfil: editing.visitas_perfil,
        cliques_link: editing.cliques_link,
        notas: editing.notas,
      })
    } else {
      setForm({ ...EMPTY_FORM, platform })
    }
  }, [editing, platform, open])

  if (!open) return null

  function setField(key: keyof FormData, value: string | number | null) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.periodo) { toast.error('Período é obrigatório'); return }
    setSaving(true)
    try {
      // Convert YYYY-MM to YYYY-MM-01 for storage
      const periodoDate = form.periodo.length === 7 ? `${form.periodo}-01` : form.periodo
      await onSave({ ...form, periodo: periodoDate })
    } finally {
      setSaving(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '.78rem', fontWeight: 600, color: DS.secondary, marginBottom: '.3rem', display: 'block',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,14,12,.45)', backdropFilter: 'blur(3px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: DS.white, borderRadius: DS.radius8, width: '100%', maxWidth: 620,
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.18)',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: `1px solid ${DS.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: DS.dark }}>
              {editing ? 'Editar métricas' : 'Adicionar métricas'}
            </div>
            <div style={{ fontSize: '.8rem', color: DS.secondary, marginTop: '.15rem' }}>
              Plataforma: <span style={{ color: platformColor, fontWeight: 600 }}>{platform}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem',
            color: DS.muted, lineHeight: 1, padding: '.25rem',
          }}>✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Row 1 */}
            <div>
              <label style={labelStyle}>Período *</label>
              <input type="month" value={form.periodo} required
                onChange={e => setField('periodo', e.target.value)}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Seguidores</label>
              <input type="number" min={0} value={form.seguidores}
                onChange={e => setField('seguidores', Number(e.target.value))}
                style={inputStyle} />
            </div>

            {/* Row 2 */}
            <div>
              <label style={labelStyle}>Novos seguidores</label>
              <input type="number" value={form.novos_seguidores}
                onChange={e => setField('novos_seguidores', Number(e.target.value))}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Alcance</label>
              <input type="number" min={0} value={form.alcance}
                onChange={e => setField('alcance', Number(e.target.value))}
                style={inputStyle} />
            </div>

            {/* Row 3 */}
            <div>
              <label style={labelStyle}>Impressões</label>
              <input type="number" min={0} value={form.impressoes}
                onChange={e => setField('impressoes', Number(e.target.value))}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Engajamento %</label>
              <input type="number" min={0} max={100} step={0.01} value={form.engajamento}
                onChange={e => setField('engajamento', Number(e.target.value))}
                style={inputStyle} />
            </div>

            {/* Row 4 */}
            <div>
              <label style={labelStyle}>Curtidas</label>
              <input type="number" min={0} value={form.curtidas}
                onChange={e => setField('curtidas', Number(e.target.value))}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Comentários</label>
              <input type="number" min={0} value={form.comentarios}
                onChange={e => setField('comentarios', Number(e.target.value))}
                style={inputStyle} />
            </div>

            {/* Row 5 */}
            <div>
              <label style={labelStyle}>Compartilhamentos</label>
              <input type="number" min={0} value={form.compartilhamentos}
                onChange={e => setField('compartilhamentos', Number(e.target.value))}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Salvamentos</label>
              <input type="number" min={0} value={form.salvamentos}
                onChange={e => setField('salvamentos', Number(e.target.value))}
                style={inputStyle} />
            </div>

            {/* Row 6 */}
            <div>
              <label style={labelStyle}>Visitas ao perfil</label>
              <input type="number" min={0} value={form.visitas_perfil}
                onChange={e => setField('visitas_perfil', Number(e.target.value))}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Cliques no link</label>
              <input type="number" min={0} value={form.cliques_link}
                onChange={e => setField('cliques_link', Number(e.target.value))}
                style={inputStyle} />
            </div>

            {/* Row 7 – full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Notas</label>
              <textarea
                value={form.notas ?? ''}
                onChange={e => setField('notas', e.target.value || null)}
                rows={3}
                placeholder="Observações sobre este período..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', gap: '.75rem', justifyContent: 'flex-end',
            marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: `1px solid ${DS.border}`,
          }}>
            <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? .6 : 1 }}>
              {saving ? 'Salvando…' : 'Salvar métricas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsManager({
  initialData,
}: {
  initialData: Record<string, SocialMetric[]>
}) {
  const [selectedPlatform, setSelectedPlatform] = useState('instagram')
  const [metrics, setMetrics] = useState<SocialMetric[]>(
    initialData['instagram'] ?? []
  )
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingMetric, setEditingMetric] = useState<SocialMetric | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const currentPlatform = PLATFORMS.find(p => p.id === selectedPlatform)!

  // ─── Fetch metrics ──────────────────────────────────────────────────────────
  const fetchMetrics = useCallback(async (platform: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?platform=${platform}&limit=12`)
      const json = await res.json()
      setMetrics(json.data ?? [])
    } catch {
      toast.error('Erro ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Use initialData for first render, then fetch on platform switch
    if (initialData[selectedPlatform]) {
      setMetrics(initialData[selectedPlatform])
    } else {
      fetchMetrics(selectedPlatform)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlatform])

  // ─── Save metric ────────────────────────────────────────────────────────────
  async function handleSave(data: FormData) {
    const body = { ...data, platform: selectedPlatform }
    const res = await fetch('/api/admin/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (json.error) {
      toast.error(json.error)
      return
    }
    toast.success(editingMetric ? 'Métricas atualizadas' : 'Métricas adicionadas')
    setShowModal(false)
    setEditingMetric(null)
    await fetchMetrics(selectedPlatform)
  }

  // ─── Delete metric ──────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('Remover estas métricas?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/analytics/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.error) { toast.error(json.error); return }
      toast.success('Métricas removidas')
      setMetrics(prev => prev.filter(m => m.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  // ─── Chart data (chronological) ─────────────────────────────────────────────
  const chartData = [...metrics].reverse().map(m => ({
    periodo: fmtPeriodo(m.periodo),
    seguidores: m.seguidores,
    alcance: m.alcance,
    impressoes: m.impressoes,
    engajamento: m.engajamento,
  }))

  // ─── Latest metric for summary cards ────────────────────────────────────────
  const latest = metrics[0]

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: DS.dark, margin: 0 }}>Analytics</h1>
          <p style={{ fontSize: '.88rem', color: DS.secondary, margin: '.35rem 0 0' }}>
            Acompanhe o desempenho das redes sociais
          </p>
        </div>
        <button
          onClick={() => { setEditingMetric(null); setShowModal(true) }}
          style={btnPrimary}
        >
          + Adicionar métricas
        </button>
      </div>

      {/* Platform tab strip */}
      <div style={{
        display: 'flex', gap: '.5rem', overflowX: 'auto', paddingBottom: '.25rem',
        marginBottom: '1.5rem', scrollbarWidth: 'none',
      }}>
        {PLATFORMS.map(p => {
          const active = p.id === selectedPlatform
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '.4rem',
                padding: '.45rem 1rem', borderRadius: '999px', whiteSpace: 'nowrap',
                border: active ? 'none' : `1px solid ${DS.border}`,
                background: active ? p.color : DS.white,
                color: active ? '#fff' : DS.secondary,
                fontWeight: active ? 600 : 400,
                fontSize: '.82rem', cursor: 'pointer',
                transition: 'all .15s',
                fontFamily: 'inherit',
                boxShadow: active ? `0 2px 8px ${p.color}44` : 'none',
              }}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          )
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: DS.muted, fontSize: '.9rem' }}>
          Carregando métricas…
        </div>
      )}

      {/* Empty state */}
      {!loading && metrics.length === 0 && (
        <div style={{
          background: DS.white, border: `1px solid ${DS.border}`,
          borderRadius: DS.radius8, marginBottom: '1.5rem',
        }}>
          <EmptyState platformColor={currentPlatform.color} />
        </div>
      )}

      {/* Content when there are metrics */}
      {!loading && metrics.length > 0 && (
        <>
          {/* Summary cards */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem', marginBottom: '1.5rem',
          }}>
            <SummaryCard
              label="Seguidores"
              value={fmtNum(latest.seguidores)}
              sub={`+${fmtNum(latest.novos_seguidores)} novos`}
            />
            <SummaryCard
              label="Alcance"
              value={fmtNum(latest.alcance)}
              sub={fmtPeriodo(latest.periodo)}
            />
            <SummaryCard
              label="Impressões"
              value={fmtNum(latest.impressoes)}
              sub={fmtPeriodo(latest.periodo)}
            />
            <SummaryCard
              label="Engajamento"
              value={`${latest.engajamento}%`}
              sub="taxa de engajamento"
            />
          </div>

          {/* Charts */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem', marginBottom: '1.5rem',
          }}>
            {/* Area chart – Seguidores */}
            <div style={{
              background: DS.white, border: `1px solid ${DS.border}`,
              borderRadius: DS.radius8, padding: '1.25rem',
            }}>
              <div style={{ fontSize: '.82rem', fontWeight: 600, color: DS.secondary, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Crescimento de seguidores
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${selectedPlatform}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentPlatform.color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={currentPlatform.color} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={DS.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: DS.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: DS.muted }} axisLine={false} tickLine={false}
                    tickFormatter={v => fmtNum(Number(v))} />
                  <Tooltip
                    contentStyle={{ borderRadius: DS.radius6, border: `1px solid ${DS.border}`, fontSize: '.82rem' }}
                    formatter={(v: number) => [fmtCurrency(v), 'Seguidores']}
                  />
                  <Area
                    type="monotone" dataKey="seguidores"
                    stroke={currentPlatform.color} strokeWidth={2}
                    fill={`url(#grad-${selectedPlatform})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bar chart – Alcance & Impressões */}
            <div style={{
              background: DS.white, border: `1px solid ${DS.border}`,
              borderRadius: DS.radius8, padding: '1.25rem',
            }}>
              <div style={{ fontSize: '.82rem', fontWeight: 600, color: DS.secondary, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Alcance vs Impressões
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                  <CartesianGrid stroke={DS.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: DS.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: DS.muted }} axisLine={false} tickLine={false}
                    tickFormatter={v => fmtNum(Number(v))} />
                  <Tooltip
                    contentStyle={{ borderRadius: DS.radius6, border: `1px solid ${DS.border}`, fontSize: '.82rem' }}
                    formatter={(v: number) => fmtCurrency(v)}
                  />
                  <Bar dataKey="alcance" name="Alcance" fill={currentPlatform.color} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="impressoes" name="Impressões" fill={DS.gold} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History table */}
          <div style={{
            background: DS.white, border: `1px solid ${DS.border}`,
            borderRadius: DS.radius8, overflow: 'hidden',
          }}>
            <div style={{
              padding: '1rem 1.25rem', borderBottom: `1px solid ${DS.border}`,
              fontSize: '.85rem', fontWeight: 600, color: DS.dark,
            }}>
              Histórico de métricas
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                <thead>
                  <tr style={{ background: DS.bg }}>
                    {['Período', 'Seguidores', 'Novos', 'Alcance', 'Impressões', 'Engajamento', 'Curtidas', 'Ações'].map(h => (
                      <th key={h} style={{
                        padding: '.7rem 1rem', textAlign: 'left', fontWeight: 600,
                        color: DS.secondary, whiteSpace: 'nowrap', fontSize: '.75rem',
                        textTransform: 'uppercase', letterSpacing: '.04em',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m, i) => (
                    <tr key={m.id} style={{
                      borderTop: i === 0 ? 'none' : `1px solid ${DS.border}`,
                      transition: 'background .1s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = DS.bg)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '.75rem 1rem', whiteSpace: 'nowrap', color: DS.dark, fontWeight: 500 }}>
                        {fmtDate(m.periodo)}
                      </td>
                      <td style={{ padding: '.75rem 1rem', whiteSpace: 'nowrap' }}>
                        {fmtCurrency(m.seguidores)}
                      </td>
                      <td style={{ padding: '.75rem 1rem', whiteSpace: 'nowrap', color: '#16a34a', fontWeight: 500 }}>
                        +{fmtCurrency(m.novos_seguidores)}
                      </td>
                      <td style={{ padding: '.75rem 1rem', whiteSpace: 'nowrap' }}>
                        {fmtCurrency(m.alcance)}
                      </td>
                      <td style={{ padding: '.75rem 1rem', whiteSpace: 'nowrap' }}>
                        {fmtCurrency(m.impressoes)}
                      </td>
                      <td style={{ padding: '.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block', padding: '.2rem .5rem',
                          background: `${currentPlatform.color}18`, color: currentPlatform.color,
                          borderRadius: '999px', fontWeight: 600, fontSize: '.75rem',
                        }}>
                          {m.engajamento}%
                        </span>
                      </td>
                      <td style={{ padding: '.75rem 1rem', whiteSpace: 'nowrap' }}>
                        {fmtCurrency(m.curtidas)}
                      </td>
                      <td style={{ padding: '.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                          <button
                            title="Editar"
                            onClick={() => { setEditingMetric(m); setShowModal(true) }}
                            style={{
                              background: DS.bg, border: `1px solid ${DS.border}`,
                              borderRadius: DS.radius6, padding: '.3rem .55rem',
                              cursor: 'pointer', fontSize: '.8rem', color: DS.secondary,
                              lineHeight: 1,
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            title="Remover"
                            onClick={() => handleDelete(m.id)}
                            disabled={deletingId === m.id}
                            style={{
                              background: '#fff5f5', border: '1px solid #fecaca',
                              borderRadius: DS.radius6, padding: '.3rem .55rem',
                              cursor: 'pointer', fontSize: '.8rem', color: '#dc2626',
                              lineHeight: 1, opacity: deletingId === m.id ? .5 : 1,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      <MetricModal
        open={showModal}
        editing={editingMetric}
        platform={selectedPlatform}
        platformColor={currentPlatform.color}
        onClose={() => { setShowModal(false); setEditingMetric(null) }}
        onSave={handleSave}
      />
    </div>
  )
}
