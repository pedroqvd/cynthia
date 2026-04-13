'use client'

import { useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

type Category = { id: string; tipo: string; nome: string; cor: string }
type Entry = {
  id: string; tipo: 'receita' | 'despesa'; descricao: string; valor: number
  data: string; status: 'confirmado' | 'pendente' | 'cancelado'
  forma_pagamento: string | null; notas: string | null; created_by: string | null
  category_id: string | null
  financial_categories: { nome: string; cor: string } | null
  leads: { nome: string } | null
  appointments: { procedimento: string } | null
}
type Summary = { totalReceitas: number; totalDespesas: number; saldo: number; totalPendente: number }

const FORMAS = [
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de crédito' },
  { value: 'cartao_debito', label: 'Cartão de débito' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'outro', label: 'Outro' },
]

const STATUS_COLORS = { confirmado: '#10b981', pendente: '#f59e0b', cancelado: '#ef4444' }
const STATUS_LABELS = { confirmado: 'Confirmado', pendente: 'Pendente', cancelado: 'Cancelado' }

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function FinanceiroManager({
  initialEntries, categories, role, summary: initialSummary,
}: {
  initialEntries: Entry[]
  categories: Category[]
  role: string
  summary: Summary | null
}) {
  const isMobile = useIsMobile()
  const isAdmin = role === 'admin'

  const [entries, setEntries] = useState(initialEntries)
  const [summary, setSummary] = useState(initialSummary)
  const [tab, setTab] = useState<'todos' | 'receita' | 'despesa'>('todos')
  const [filterMes, setFilterMes] = useState(new Date().toISOString().slice(0, 7))
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Entry | null>(null)
  const [loadingChart, setLoadingChart] = useState(false)
  const [chartData, setChartData] = useState<{ mes: string; receitas: number; despesas: number }[]>([])
  const [catChartData, setCatChartData] = useState<{ nome: string; cor: string; valor: number }[]>([])

  // Carrega dados dos gráficos ao montar
  useState(() => {
    fetch('/api/financial/summary')
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) {
          setChartData(data.graficoMensal ?? [])
          setCatChartData(data.graficoCategorias ?? [])
        }
      })
      .catch(() => {})
  })

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (tab !== 'todos' && e.tipo !== tab) return false
      if (filterMes && !e.data.startsWith(filterMes)) return false
      return true
    })
  }, [entries, tab, filterMes])

  const openNew = useCallback(() => { setEditing(null); setShowModal(true) }, [])
  const openEdit = useCallback((e: Entry) => { setEditing(e); setShowModal(true) }, [])

  async function handleSave(form: Partial<Entry>) {
    if (editing) {
      const res = await fetch(`/api/financial/entries/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { toast.error('Erro ao salvar.'); return }
      const { data } = await res.json()
      setEntries((prev) => prev.map((e) => e.id === editing.id ? { ...e, ...data } : e))
      toast.success('Lançamento atualizado.')
    } else {
      const res = await fetch('/api/financial/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { toast.error('Erro ao criar lançamento.'); return }
      const { data } = await res.json()
      setEntries((prev) => [data, ...prev])
      toast.success('Lançamento criado.')
    }

    // Atualiza summary
    const mes = (form.data as string)?.slice(0, 7)
    if (mes === new Date().toISOString().slice(0, 7)) {
      const res = await fetch('/api/financial/summary')
      const { data } = await res.json()
      if (data) setSummary({ totalReceitas: data.totalReceitas, totalDespesas: data.totalDespesas, saldo: data.saldo, totalPendente: data.totalPendente })
    }
    setShowModal(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este lançamento permanentemente?')) return
    const res = await fetch(`/api/financial/entries/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Sem permissão ou erro ao excluir.'); return }
    setEntries((prev) => prev.filter((e) => e.id !== id))
    toast.success('Lançamento excluído.')
  }

  // Meses para o seletor
  const mesesOptions = useMemo(() => {
    const opts = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
      opts.push({
        value: d.toISOString().slice(0, 7),
        label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      })
    }
    return opts
  }, [])

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#0f0e0c' }}>Financeiro</h1>
          <p style={{ fontSize: '.85rem', color: '#7a7570' }}>
            {isAdmin ? 'Visão completa de receitas e despesas' : 'Gestão de despesas'}
          </p>
        </div>
        <button onClick={openNew} style={btnPrimStyle}>
          + Novo lançamento
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {isAdmin && (
          <>
            <Card label="Receitas do mês" value={fmt(summary?.totalReceitas ?? 0)} color="#10b981" icon="↑" />
            <Card label="Despesas do mês" value={fmt(summary?.totalDespesas ?? 0)} color="#ef4444" icon="↓" />
            <Card label="Saldo do mês" value={fmt(summary?.saldo ?? 0)} color={(summary?.saldo ?? 0) >= 0 ? '#10b981' : '#ef4444'} icon="=" />
          </>
        )}
        {!isAdmin && (
          <Card label="Despesas do mês" value={fmt(summary?.totalDespesas ?? 0)} color="#ef4444" icon="↓" />
        )}
        <Card label="Pendentes" value={fmt(summary?.totalPendente ?? 0)} color="#f59e0b" icon="⏳" />
      </div>

      {/* Gráficos (só admin) */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '.9rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '1.5rem' }}>
              Receitas vs Despesas — últimos 6 meses
            </h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barGap={4}>
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#7a7570' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#7a7570' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number) => fmt(v)}
                    contentStyle={{ background: '#0f0e0c', border: '1px solid rgba(184,150,90,0.25)', borderRadius: '2px', fontSize: '12px', color: '#f5f0e8' }}
                  />
                  <Bar dataKey="receitas" fill="#10b981" radius={[2, 2, 0, 0]} name="Receitas" />
                  <Bar dataKey="despesas" fill="#ef4444" radius={[2, 2, 0, 0]} name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ fontSize: '.82rem', color: '#7a7570' }}>Sem dados para exibir.</p>
            )}
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '.9rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '1rem' }}>
              Despesas por categoria
            </h2>
            {catChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={catChartData} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={70}>
                    {catChartData.map((c, i) => <Cell key={i} fill={c.cor} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: '#0f0e0c', border: '1px solid rgba(184,150,90,0.25)', borderRadius: '2px', fontSize: '12px', color: '#f5f0e8' }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '.68rem' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ fontSize: '.82rem', color: '#7a7570' }}>Sem dados para exibir.</p>
            )}
          </div>
        </div>
      )}

      {/* Filtros e tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', border: '1px solid #e5e5e3', borderRadius: '2px', overflow: 'hidden' }}>
          {(['todos', ...(isAdmin ? ['receita'] : []), 'despesa'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as typeof tab)}
              style={{
                padding: '.4rem .9rem', border: 'none', cursor: 'pointer', fontSize: '.78rem',
                background: tab === t ? '#0f0e0c' : 'transparent',
                color: tab === t ? '#f5f0e8' : '#7a7570',
                textTransform: 'capitalize',
              }}
            >
              {t === 'todos' ? 'Todos' : t === 'receita' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>

        <select
          value={filterMes}
          onChange={(e) => setFilterMes(e.target.value)}
          style={{ height: '34px', border: '1px solid #e5e5e3', borderRadius: '2px', fontSize: '.8rem', padding: '0 .75rem', outline: 'none', background: '#fff' }}
        >
          {mesesOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <span style={{ fontSize: '.75rem', color: '#7a7570', marginLeft: 'auto' }}>
          {filtered.length} lançamento{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabela */}
      <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e5e3', background: '#fafaf9' }}>
              <Th>Data</Th>
              <Th>Descrição</Th>
              {isAdmin && <Th>Tipo</Th>}
              <Th>Categoria</Th>
              <Th>Forma</Th>
              <Th>Status</Th>
              <Th align="right">Valor</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '2.5rem', color: '#7a7570', fontSize: '.82rem' }}>
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            ) : filtered.map((e) => {
              const cat = e.financial_categories
              const statusColor = STATUS_COLORS[e.status]
              return (
                <tr key={e.id} style={{ borderBottom: '1px solid #f0f0ee' }}
                  onMouseEnter={(ev) => { (ev.currentTarget as HTMLElement).style.background = '#faf7f2' }}
                  onMouseLeave={(ev) => { (ev.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <td style={{ padding: '.75rem 1rem', color: '#7a7570', whiteSpace: 'nowrap' }}>
                    {new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '.75rem 1rem', color: '#0f0e0c', fontWeight: 500 }}>
                    {e.descricao}
                    {e.leads && <div style={{ fontSize: '.7rem', color: '#7a7570', fontWeight: 400 }}>{(e.leads as { nome: string }).nome}</div>}
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '.75rem 1rem' }}>
                      <span style={{
                        fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.06em',
                        color: e.tipo === 'receita' ? '#10b981' : '#ef4444',
                        background: e.tipo === 'receita' ? '#d1fae5' : '#fee2e2',
                        padding: '.15rem .5rem', borderRadius: '2px',
                      }}>
                        {e.tipo}
                      </span>
                    </td>
                  )}
                  <td style={{ padding: '.75rem 1rem' }}>
                    {cat ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', fontSize: '.75rem', color: '#7a7570' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: (cat as { cor: string }).cor, flexShrink: 0 }} />
                        {(cat as { nome: string }).nome}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '.75rem 1rem', color: '#7a7570' }}>
                    {FORMAS.find((f) => f.value === e.forma_pagamento)?.label ?? '—'}
                  </td>
                  <td style={{ padding: '.75rem 1rem' }}>
                    <span style={{
                      fontSize: '.68rem', color: statusColor,
                      background: `${statusColor}18`, padding: '.15rem .5rem', borderRadius: '2px',
                    }}>
                      {STATUS_LABELS[e.status]}
                    </span>
                  </td>
                  <td style={{ padding: '.75rem 1rem', textAlign: 'right', fontWeight: 600,
                    color: e.tipo === 'receita' ? '#10b981' : '#ef4444' }}>
                    {e.tipo === 'receita' ? '+' : '-'}{fmt(Number(e.valor))}
                  </td>
                  <td style={{ padding: '.75rem 1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <button onClick={() => openEdit(e)} style={btnEditStyle}>Editar</button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(e.id)} style={btnDelStyle}>✕</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <EntryModal
          entry={editing}
          categories={categories}
          isAdmin={isAdmin}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function Card({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.75rem' }}>
        <span style={{ fontSize: '.72rem', color: '#7a7570' }}>{label}</span>
        <span style={{ fontSize: '1rem', color }}>{icon}</span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 600, color }}>{value}</div>
    </div>
  )
}

function Th({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return (
    <th style={{
      padding: '.65rem 1rem', textAlign: align ?? 'left', fontSize: '.7rem',
      letterSpacing: '.08em', textTransform: 'uppercase', color: '#7a7570',
      fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  )
}

function EntryModal({ entry, categories, isAdmin, onClose, onSave }: {
  entry: Entry | null
  categories: Category[]
  isAdmin: boolean
  onClose: () => void
  onSave: (form: Partial<Entry>) => Promise<void>
}) {
  const [tipo, setTipo] = useState<'receita' | 'despesa'>(entry?.tipo ?? (isAdmin ? 'receita' : 'despesa'))
  const [descricao, setDescricao] = useState(entry?.descricao ?? '')
  const [valor, setValor] = useState(entry?.valor?.toString() ?? '')
  const [data, setData] = useState(entry?.data ?? new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState(entry?.category_id ?? '')
  const [formaPagamento, setFormaPagamento] = useState(entry?.forma_pagamento ?? '')
  const [status, setStatus] = useState<'confirmado' | 'pendente' | 'cancelado'>(entry?.status ?? 'confirmado')
  const [notas, setNotas] = useState(entry?.notas ?? '')
  const [loading, setLoading] = useState(false)

  const catsFiltradas = categories.filter((c) => c.tipo === tipo)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!descricao || !valor || !data) return
    setLoading(true)
    await onSave({
      tipo, descricao, valor: Number(valor), data,
      category_id: categoryId || null,
      forma_pagamento: formaPagamento || null,
      status, notas: notas || null,
    })
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '4px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '1.5rem' }}>
          {entry ? 'Editar lançamento' : 'Novo lançamento'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Tipo */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: '.5rem' }}>
              {(['receita', 'despesa'] as const).map((t) => (
                <button
                  key={t} type="button" onClick={() => { setTipo(t); setCategoryId('') }}
                  style={{
                    flex: 1, padding: '.6rem', border: `1px solid ${tipo === t ? (t === 'receita' ? '#10b981' : '#ef4444') : '#e5e5e3'}`,
                    borderRadius: '2px', cursor: 'pointer', fontSize: '.82rem', fontWeight: tipo === t ? 500 : 400,
                    background: tipo === t ? (t === 'receita' ? '#d1fae5' : '#fee2e2') : 'transparent',
                    color: tipo === t ? (t === 'receita' ? '#10b981' : '#ef4444') : '#7a7570',
                    textTransform: 'capitalize',
                  }}
                >
                  {t === 'receita' ? '↑ Receita' : '↓ Despesa'}
                </button>
              ))}
            </div>
          )}

          <Field label="Descrição *">
            <input required value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Facetas de porcelana — Paciente João" style={inputStyle} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Valor (R$) *">
              <input required type="number" min="0.01" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" style={inputStyle} />
            </Field>
            <Field label="Data *">
              <input required type="date" value={data} onChange={(e) => setData(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Categoria">
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputStyle}>
                <option value="">— Sem categoria —</option>
                {catsFiltradas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Field>
            <Field label="Forma de pagamento">
              <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} style={inputStyle}>
                <option value="">— Selecione —</option>
                {FORMAS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} style={inputStyle}>
              <option value="confirmado">Confirmado</option>
              <option value="pendente">Pendente</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </Field>

          <Field label="Observações">
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Opcional..." style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>

          <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '.7rem', border: '1px solid #e5e5e3', borderRadius: '2px', background: 'transparent', cursor: 'pointer', fontSize: '.78rem', color: '#7a7570' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '.7rem', border: 'none', borderRadius: '2px', background: '#b8965a', cursor: 'pointer', fontSize: '.78rem', fontWeight: 500, color: '#0f0e0c' }}>
              {loading ? 'Salvando...' : entry ? 'Salvar alterações' : 'Criar lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
      <label style={{ fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: '#7a7570' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e5e5e3', borderRadius: '2px',
  padding: '.65rem .9rem', fontSize: '.85rem', outline: 'none',
  background: '#fff', color: '#0f0e0c', boxSizing: 'border-box',
}
const btnPrimStyle: React.CSSProperties = {
  padding: '.55rem 1.25rem', background: '#0f0e0c', color: '#f5f0e8',
  border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '.78rem', fontWeight: 500,
}
const btnEditStyle: React.CSSProperties = {
  padding: '.3rem .7rem', border: '1px solid #e5e5e3', borderRadius: '2px',
  background: 'transparent', cursor: 'pointer', fontSize: '.72rem', color: '#b8965a',
}
const btnDelStyle: React.CSSProperties = {
  padding: '.3rem .6rem', border: '1px solid #ef444440', borderRadius: '2px',
  background: 'transparent', cursor: 'pointer', fontSize: '.72rem', color: '#ef4444',
}
