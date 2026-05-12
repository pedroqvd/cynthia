'use client'

import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

const OpenFinanceTabComponent = lazy(() => import('./OpenFinanceTab'))
function OpenFinanceTabLazy() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', fontSize: '.82rem', color: '#b8b4af' }}>Carregando...</div>}>
      <OpenFinanceTabComponent />
    </Suspense>
  )
}
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = { id: string; tipo: string; nome: string; cor: string }

type Lead = { id: string; nome: string; whatsapp: string; especialidade: string | null }

type Contrato = {
  id: string
  lead_id: string
  descricao: string
  valor_total: number
  parcelas: number
  valor_entrada: number
  data_inicio: string
  status: 'ativo' | 'quitado' | 'cancelado'
  notas: string | null
  leads: Lead | null
  financial_entries: EntryCompact[]
}

type EntryCompact = {
  id: string
  valor: number
  status: 'confirmado' | 'pendente' | 'cancelado'
  parcela_numero: number | null
  tipo: 'receita' | 'despesa'
  data: string
}

type Entry = {
  id: string
  tipo: 'receita' | 'despesa'
  descricao: string
  valor: number
  data: string
  status: 'confirmado' | 'pendente' | 'cancelado'
  forma_pagamento: string | null
  notas: string | null
  created_by: string | null
  categoria_id: string | null
  contrato_id: string | null
  parcela_numero: number | null
  parcelas_total: number | null
  financial_categories: { id: string; nome: string; cor: string } | null
  leads: Lead | null
  contratos: { id: string; descricao: string; valor_total: number; parcelas: number } | null
  appointments: { procedimento: string } | null
}

type Summary = { totalReceitas: number; totalDespesas: number; saldo: number; totalPendente: number }

// ─── Constants ───────────────────────────────────────────────────────────────

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
const CONTRATO_STATUS_LABELS = { ativo: 'Ativo', quitado: 'Quitado', cancelado: 'Cancelado' }
const CONTRATO_STATUS_COLORS = { ativo: '#10b981', quitado: '#7a7570', cancelado: '#ef4444' }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR')
}

function valorPago(c: Contrato) {
  return (c.financial_entries ?? [])
    .filter((e) => e.tipo === 'receita' && e.status === 'confirmado')
    .reduce((s, e) => s + Number(e.valor), 0)
}

function pctPago(c: Contrato) {
  const vt = Number(c.valor_total)
  if (!vt) return 0
  return Math.min(100, (valorPago(c) / vt) * 100)
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FinanceiroManager({
  initialEntries,
  initialContratos,
  categories,
  leads: initialLeads,
  role,
  summary: initialSummary,
}: {
  initialEntries: Entry[]
  initialContratos: Contrato[]
  categories: Category[]
  leads: Lead[]
  role: string
  summary: Summary | null
}) {
  const isMobile = useIsMobile()
  const isAdmin = role === 'admin'

  const [entries, setEntries] = useState(initialEntries)
  const [contratos, setContratos] = useState(initialContratos)
  const [summary, setSummary] = useState(initialSummary)
  const [tab, setTab] = useState<'resumo' | 'lancamentos' | 'contratos' | 'bancario'>('resumo')
  const [filterTipo, setFilterTipo] = useState<'todos' | 'receita' | 'despesa'>('todos')
  const [filterMes, setFilterMes] = useState(new Date().toISOString().slice(0, 7))
  const [chartData, setChartData] = useState<{ mes: string; receitas: number; despesas: number }[]>([])

  // Modals
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [showContratoModal, setShowContratoModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null)

  useEffect(() => {
    fetch('/api/financial/summary')
      .then((r) => r.json())
      .then(({ data }) => { if (data?.graficoMensal) setChartData(data.graficoMensal) })
      .catch(() => {})
  }, [])

  // ── Filtered entries ──────────────────────────────────────────

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filterTipo !== 'todos' && e.tipo !== filterTipo) return false
      if (filterMes && !e.data.startsWith(filterMes)) return false
      return true
    })
  }, [entries, filterTipo, filterMes])

  // ── Month options ─────────────────────────────────────────────

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

  // ── Entry handlers ────────────────────────────────────────────

  const openNewEntry = useCallback(() => { setEditingEntry(null); setShowEntryModal(true) }, [])
  const openEditEntry = useCallback((e: Entry) => { setEditingEntry(e); setShowEntryModal(true) }, [])

  async function handleSaveEntry(form: Partial<Entry>) {
    if (editingEntry) {
      const res = await fetch(`/api/financial/entries/${editingEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error ?? 'Erro ao salvar.')
        return
      }
      const { data } = await res.json()
      setEntries((prev) => prev.map((e) => e.id === editingEntry.id ? { ...e, ...data } : e))
      toast.success('Lançamento atualizado.')
    } else {
      const res = await fetch('/api/financial/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error ?? 'Erro ao criar lançamento.')
        return
      }
      const { data } = await res.json()
      setEntries((prev) => [data, ...prev])
      // Atualiza contrato relacionado se houver
      if (data.contrato_id) {
        setContratos((prev) => prev.map((c) =>
          c.id === data.contrato_id
            ? { ...c, financial_entries: [...(c.financial_entries ?? []), { id: data.id, valor: data.valor, status: data.status, parcela_numero: data.parcela_numero, tipo: data.tipo, data: data.data }] }
            : c
        ))
      }
      toast.success('Lançamento criado.')
    }

    const mes = (form.data as string)?.slice(0, 7)
    if (mes === new Date().toISOString().slice(0, 7)) {
      const r = await fetch('/api/financial/summary')
      const { data } = await r.json()
      if (data) setSummary({ totalReceitas: data.totalReceitas, totalDespesas: data.totalDespesas, saldo: data.saldo, totalPendente: data.totalPendente })
    }
    setShowEntryModal(false)
  }

  async function handleDeleteEntry(id: string) {
    if (!confirm('Excluir este lançamento permanentemente?')) return
    const res = await fetch(`/api/financial/entries/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Sem permissão ou erro ao excluir.'); return }
    setEntries((prev) => prev.filter((e) => e.id !== id))
    toast.success('Lançamento excluído.')
  }

  // ── Contrato handlers ─────────────────────────────────────────

  const openNewContrato = useCallback(() => { setEditingContrato(null); setShowContratoModal(true) }, [])
  const openEditContrato = useCallback((c: Contrato) => { setEditingContrato(c); setShowContratoModal(true) }, [])

  async function handleSaveContrato(form: Partial<Contrato>) {
    if (editingContrato) {
      const res = await fetch(`/api/financial/contracts/${editingContrato.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { toast.error('Erro ao salvar contrato.'); return }
      const { data } = await res.json()
      setContratos((prev) => prev.map((c) => c.id === editingContrato.id ? { ...c, ...data } : c))
      toast.success('Contrato atualizado.')
    } else {
      const res = await fetch('/api/financial/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { toast.error('Erro ao criar contrato.'); return }
      const { data } = await res.json()
      setContratos((prev) => [data, ...prev])
      toast.success('Contrato criado.')
    }
    setShowContratoModal(false)
  }

  async function handleDeleteContrato(id: string) {
    if (!confirm('Excluir este contrato? Os lançamentos vinculados serão desvinculados.')) return
    const res = await fetch(`/api/financial/contracts/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Sem permissão ou erro ao excluir.'); return }
    setContratos((prev) => prev.filter((c) => c.id !== id))
    toast.success('Contrato excluído.')
  }

  // ── Summary for selected month ────────────────────────────────

  const mesReceitas = useMemo(() =>
    entries.filter((e) => e.tipo === 'receita' && e.status === 'confirmado' && e.data.startsWith(filterMes))
      .reduce((s, e) => s + Number(e.valor), 0), [entries, filterMes])

  const mesDespesas = useMemo(() =>
    entries.filter((e) => e.tipo === 'despesa' && e.status === 'confirmado' && e.data.startsWith(filterMes))
      .reduce((s, e) => s + Number(e.valor), 0), [entries, filterMes])

  const mesPendente = useMemo(() =>
    entries.filter((e) => e.status === 'pendente' && e.data.startsWith(filterMes))
      .reduce((s, e) => s + Number(e.valor), 0), [entries, filterMes])

  const contratosAtivos = contratos.filter((c) => c.status === 'ativo')
  const valorTotalContratos = contratosAtivos.reduce((s, c) => s + Number(c.valor_total), 0)
  const valorRecebidoContratos = contratosAtivos.reduce((s, c) => s + valorPago(c), 0)

  // ─────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Cabeçalho ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#0f0e0c' }}>Financeiro</h1>
          <p style={{ fontSize: '.85rem', color: '#7a7570' }}>
            {isAdmin ? 'Controle completo de receitas, despesas e contratos' : 'Gestão de despesas'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          {isAdmin && (
            <button onClick={openNewContrato} style={btnSecStyle}>
              + Contrato
            </button>
          )}
          <button onClick={openNewEntry} style={btnPrimStyle}>
            + Lançamento
          </button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e5e3', marginBottom: '1.5rem' }}>
        {([
          { key: 'resumo', label: 'Resumo' },
          { key: 'lancamentos', label: 'Lançamentos' },
          ...(isAdmin ? [{ key: 'contratos', label: `Contratos (${contratosAtivos.length})` }] : []),
          { key: 'bancario', label: 'Bancário' },
        ] as { key: typeof tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '.6rem 1.25rem', border: 'none', background: 'transparent',
              cursor: 'pointer', fontSize: '.82rem', fontWeight: tab === t.key ? 500 : 400,
              color: tab === t.key ? '#0f0e0c' : '#7a7570',
              borderBottom: `2px solid ${tab === t.key ? '#b8965a' : 'transparent'}`,
              marginBottom: -1, transition: 'all .15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          TAB: RESUMO
      ═══════════════════════════════════════════════════════ */}
      {tab === 'resumo' && (
        <div>
          {/* Seletor de mês */}
          <div style={{ marginBottom: '1.25rem' }}>
            <select
              value={filterMes}
              onChange={(e) => setFilterMes(e.target.value)}
              style={{ ...inputStyle, width: 'auto', display: 'inline-block' }}
            >
              {mesesOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Cards do mês */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {isAdmin && (
              <>
                <SummaryCard label="Receitas" value={fmt(mesReceitas)} color="#10b981" icon="↑" sub={filterMes ? mesesOptions.find(m => m.value === filterMes)?.label : ''} />
                <SummaryCard label="Despesas" value={fmt(mesDespesas)} color="#ef4444" icon="↓" sub={filterMes ? mesesOptions.find(m => m.value === filterMes)?.label : ''} />
                <SummaryCard
                  label="Saldo"
                  value={fmt(mesReceitas - mesDespesas)}
                  color={(mesReceitas - mesDespesas) >= 0 ? '#10b981' : '#ef4444'}
                  icon="=" sub=""
                />
              </>
            )}
            {!isAdmin && (
              <SummaryCard label="Despesas" value={fmt(mesDespesas)} color="#ef4444" icon="↓" sub="" />
            )}
            <SummaryCard label="Pendentes" value={fmt(mesPendente)} color="#f59e0b" icon="⏳" sub="aguardando confirmação" />
          </div>

          {/* Gráfico de barras — só admin */}
          {isAdmin && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={cardStyle}>
                <h2 style={sectionTitle}>Receitas vs Despesas — últimos 6 meses</h2>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData} barGap={4}>
                      <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#7a7570' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#7a7570' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(v: number) => fmt(v)}
                        contentStyle={{ background: '#0f0e0c', border: '1px solid rgba(184,150,90,0.25)', borderRadius: '2px', fontSize: '12px', color: '#f5f0e8' }}
                      />
                      <Bar dataKey="receitas" fill="#10b981" radius={[2, 2, 0, 0]} name="Receitas" />
                      <Bar dataKey="despesas" fill="#ef4444" radius={[2, 2, 0, 0]} name="Despesas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ fontSize: '.82rem', color: '#7a7570' }}>Sem dados suficientes.</p>
                )}
              </div>

              {/* Painel contratos ativos */}
              <div style={cardStyle}>
                <h2 style={sectionTitle}>Contratos ativos</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.72rem', color: '#7a7570' }}>Total em contratos</span>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0f0e0c' }}>{fmt(valorTotalContratos)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.72rem', color: '#7a7570' }}>Já recebido</span>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#10b981' }}>{fmt(valorRecebidoContratos)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.72rem', color: '#7a7570' }}>Saldo a receber</span>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#b8965a' }}>{fmt(Math.max(0, valorTotalContratos - valorRecebidoContratos))}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 20, background: '#f0f0ee', overflow: 'hidden', marginTop: 4 }}>
                    <div style={{ height: '100%', width: `${valorTotalContratos > 0 ? Math.min(100, (valorRecebidoContratos / valorTotalContratos) * 100) : 0}%`, background: '#10b981', transition: 'width .3s' }} />
                  </div>
                  <div style={{ fontSize: '.68rem', color: '#7a7570', textAlign: 'right' }}>
                    {contratosAtivos.length} contrato{contratosAtivos.length !== 1 ? 's' : ''} ativo{contratosAtivos.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top contratos por receber */}
          {isAdmin && contratosAtivos.length > 0 && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ ...sectionTitle, marginBottom: 0 }}>Contratos — visão rápida</h2>
                <button onClick={() => setTab('contratos')} style={{ fontSize: '.72rem', color: '#b8965a', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Ver todos →
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {contratosAtivos.slice(0, 5).map((c) => {
                  const pct = pctPago(c)
                  const vPago = valorPago(c)
                  const vRestante = Math.max(0, Number(c.valor_total) - vPago)
                  return (
                    <div key={c.id} style={{ borderBottom: '1px solid #f0f0ee', paddingBottom: '.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.35rem' }}>
                        <div>
                          <span style={{ fontSize: '.82rem', fontWeight: 500, color: '#0f0e0c' }}>
                            {c.leads?.nome ?? '—'}
                          </span>
                          <span style={{ fontSize: '.72rem', color: '#7a7570', marginLeft: '.5rem' }}>{c.descricao}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '.82rem', fontWeight: 500, color: '#0f0e0c' }}>{fmt(Number(c.valor_total))}</div>
                          <div style={{ fontSize: '.68rem', color: '#7a7570' }}>falta {fmt(vRestante)}</div>
                        </div>
                      </div>
                      <div style={{ height: 4, borderRadius: 20, background: '#f0f0ee', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#10b981' : '#b8965a', transition: 'width .3s' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.25rem' }}>
                        <span style={{ fontSize: '.65rem', color: '#7a7570' }}>{c.parcelas}x de {fmt(Number(c.valor_total) / c.parcelas)}</span>
                        <span style={{ fontSize: '.65rem', color: '#7a7570' }}>{Math.round(pct)}% pago</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB: LANÇAMENTOS
      ═══════════════════════════════════════════════════════ */}
      {tab === 'lancamentos' && (
        <div>
          {/* Filtros */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', border: '1px solid #e5e5e3', borderRadius: '2px', overflow: 'hidden' }}>
              {(['todos', ...(isAdmin ? ['receita'] : []), 'despesa'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTipo(t as typeof filterTipo)}
                  style={{
                    padding: '.4rem .9rem', border: 'none', cursor: 'pointer', fontSize: '.78rem',
                    background: filterTipo === t ? '#0f0e0c' : 'transparent',
                    color: filterTipo === t ? '#f5f0e8' : '#7a7570',
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
              {filteredEntries.length} lançamento{filteredEntries.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Tabela */}
          <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e5e3', background: '#fafaf9' }}>
                  <Th>Data</Th>
                  <Th>Descrição / Paciente</Th>
                  {isAdmin && <Th>Tipo</Th>}
                  <Th>Categoria</Th>
                  <Th>Forma</Th>
                  <Th>Parcela</Th>
                  <Th>Status</Th>
                  <Th align="right">Valor</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: '2.5rem', color: '#7a7570', fontSize: '.82rem' }}>
                      Nenhum lançamento encontrado.
                    </td>
                  </tr>
                ) : filteredEntries.map((e) => {
                  const cat = e.financial_categories
                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f0f0ee' }}
                      onMouseEnter={(ev) => { (ev.currentTarget as HTMLElement).style.background = '#faf7f2' }}
                      onMouseLeave={(ev) => { (ev.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <td style={{ padding: '.65rem 1rem', color: '#7a7570', whiteSpace: 'nowrap' }}>
                        {fmtDate(e.data)}
                      </td>
                      <td style={{ padding: '.65rem 1rem', color: '#0f0e0c' }}>
                        <div style={{ fontWeight: 500 }}>{e.descricao}</div>
                        {e.leads && (
                          <div style={{ fontSize: '.7rem', color: '#7a7570' }}>
                            <Link href={`/admin/leads/${(e.leads as Lead).id}`} style={{ color: '#7a7570', textDecoration: 'none', borderBottom: '1px dashed #d0cec9' }}>
                              {(e.leads as Lead).nome}
                            </Link>
                            {e.leads.especialidade && ` · ${e.leads.especialidade}`}
                          </div>
                        )}
                        {e.contratos && (
                          <div style={{ fontSize: '.68rem', color: '#b8965a', marginTop: '.1rem' }}>
                            Contrato: {e.contratos.descricao}
                          </div>
                        )}
                      </td>
                      {isAdmin && (
                        <td style={{ padding: '.65rem 1rem' }}>
                          <TipoBadge tipo={e.tipo} />
                        </td>
                      )}
                      <td style={{ padding: '.65rem 1rem' }}>
                        {cat ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', fontSize: '.75rem', color: '#7a7570' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: cat.cor, flexShrink: 0 }} />
                            {cat.nome}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '.65rem 1rem', color: '#7a7570', fontSize: '.75rem' }}>
                        {FORMAS.find((f) => f.value === e.forma_pagamento)?.label ?? '—'}
                      </td>
                      <td style={{ padding: '.65rem 1rem', color: '#7a7570', fontSize: '.75rem', whiteSpace: 'nowrap' }}>
                        {e.parcela_numero && e.parcelas_total
                          ? `${e.parcela_numero}/${e.parcelas_total}`
                          : e.parcela_numero
                            ? `Parc. ${e.parcela_numero}`
                            : '—'}
                      </td>
                      <td style={{ padding: '.65rem 1rem' }}>
                        <StatusBadge status={e.status} />
                      </td>
                      <td style={{ padding: '.65rem 1rem', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap',
                        color: e.tipo === 'receita' ? '#10b981' : '#ef4444' }}>
                        {e.tipo === 'receita' ? '+' : '-'}{fmt(Number(e.valor))}
                      </td>
                      <td style={{ padding: '.65rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                          <button onClick={() => openEditEntry(e)} style={btnEditStyle}>Editar</button>
                          {isAdmin && (
                            <button onClick={() => handleDeleteEntry(e.id)} style={btnDelStyle}>✕</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totais do período */}
          {filteredEntries.length > 0 && isAdmin && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '.78rem', color: '#10b981' }}>
                Entradas: <strong>{fmt(filteredEntries.filter(e => e.tipo === 'receita' && e.status === 'confirmado').reduce((s, e) => s + Number(e.valor), 0))}</strong>
              </span>
              <span style={{ fontSize: '.78rem', color: '#ef4444' }}>
                Saídas: <strong>{fmt(filteredEntries.filter(e => e.tipo === 'despesa' && e.status === 'confirmado').reduce((s, e) => s + Number(e.valor), 0))}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB: CONTRATOS
      ═══════════════════════════════════════════════════════ */}
      {tab === 'contratos' && isAdmin && (
        <div>
          {contratos.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: '#7a7570' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>📋</div>
              <div style={{ fontWeight: 500, marginBottom: '.5rem' }}>Nenhum contrato ainda</div>
              <div style={{ fontSize: '.82rem' }}>Crie um contrato vinculando um paciente a um tratamento.</div>
              <button onClick={openNewContrato} style={{ ...btnPrimStyle, marginTop: '1.25rem' }}>+ Criar contrato</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {contratos.map((c) => {
                const pct = pctPago(c)
                const vPago = valorPago(c)
                const vRestante = Math.max(0, Number(c.valor_total) - vPago)
                const parcelasConfirmadas = (c.financial_entries ?? []).filter(
                  (e) => e.tipo === 'receita' && e.status === 'confirmado'
                ).length
                const entradaRegistrada = (c.financial_entries ?? []).some(
                  (e) => e.tipo === 'receita' && e.parcela_numero === 0
                )
                const statusColor = CONTRATO_STATUS_COLORS[c.status]

                return (
                  <div key={c.id} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      {/* Info do paciente */}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.35rem' }}>
                          {c.leads?.id ? (
                            <Link href={`/admin/leads/${c.leads.id}`} style={{ fontSize: '.95rem', fontWeight: 600, color: '#0f0e0c', textDecoration: 'none', borderBottom: '1px dashed #d0cec9' }}>
                              {c.leads.nome}
                            </Link>
                          ) : (
                            <span style={{ fontSize: '.95rem', fontWeight: 600, color: '#0f0e0c' }}>{c.leads?.nome ?? '—'}</span>
                          )}
                          <span style={{
                            fontSize: '.62rem', padding: '.15rem .45rem', borderRadius: '2px',
                            background: `${statusColor}18`, color: statusColor, fontWeight: 500,
                          }}>
                            {CONTRATO_STATUS_LABELS[c.status]}
                          </span>
                        </div>
                        {c.leads?.especialidade && (
                          <div style={{ fontSize: '.72rem', color: '#7a7570', marginBottom: '.25rem' }}>
                            {c.leads.especialidade}
                          </div>
                        )}
                        <div style={{ fontSize: '.82rem', color: '#7a7570' }}>{c.descricao}</div>
                        {c.notas && <div style={{ fontSize: '.72rem', color: '#7a7570', marginTop: '.25rem', fontStyle: 'italic' }}>{c.notas}</div>}
                      </div>

                      {/* Valores */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0f0e0c' }}>{fmt(Number(c.valor_total))}</div>
                        <div style={{ fontSize: '.72rem', color: '#7a7570' }}>
                          {c.parcelas}x de {fmt(Number(c.valor_total) / c.parcelas)}
                        </div>
                        {Number(c.valor_entrada) > 0 && (
                          <div style={{ fontSize: '.68rem', color: '#b8965a', marginTop: '.1rem' }}>
                            Entrada: {fmt(Number(c.valor_entrada))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Barra de progresso */}
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.35rem' }}>
                        <span style={{ fontSize: '.72rem', color: '#7a7570' }}>
                          {parcelasConfirmadas} pagamento{parcelasConfirmadas !== 1 ? 's' : ''} confirmado{parcelasConfirmadas !== 1 ? 's' : ''} · {fmt(vPago)} recebido
                        </span>
                        <span style={{ fontSize: '.72rem', fontWeight: 500, color: pct >= 100 ? '#10b981' : '#b8965a' }}>
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <div style={{ height: 7, borderRadius: 20, background: '#f0f0ee', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#10b981' : '#b8965a', transition: 'width .3s', borderRadius: 20 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.3rem' }}>
                        <span style={{ fontSize: '.65rem', color: '#7a7570' }}>
                          Início: {fmtDate(c.data_inicio)}
                        </span>
                        <span style={{ fontSize: '.65rem', color: vRestante > 0 ? '#b8965a' : '#10b981', fontWeight: 500 }}>
                          {vRestante > 0 ? `Falta ${fmt(vRestante)}` : 'Quitado'}
                        </span>
                      </div>
                    </div>

                    {/* Detalhe parcelas */}
                    {(c.financial_entries ?? []).length > 0 && (
                      <div style={{ marginTop: '.75rem', background: '#fafaf9', borderRadius: '3px', padding: '.65rem .9rem' }}>
                        <div style={{ fontSize: '.68rem', color: '#7a7570', marginBottom: '.4rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                          Lançamentos vinculados
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                          {(c.financial_entries ?? [])
                            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                            .map((e) => (
                              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                                  <span style={{ fontSize: '.68rem', color: '#7a7570' }}>{fmtDate(e.data)}</span>
                                  {e.parcela_numero !== null && (
                                    <span style={{ fontSize: '.65rem', color: '#b8965a' }}>
                                      {e.parcela_numero === 0 ? 'Entrada' : `Parc. ${e.parcela_numero}`}
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                                  <span style={{ fontSize: '.72rem', color: STATUS_COLORS[e.status] }}>
                                    {STATUS_LABELS[e.status]}
                                  </span>
                                  <span style={{ fontSize: '.78rem', fontWeight: 600, color: e.tipo === 'receita' ? '#10b981' : '#ef4444' }}>
                                    {e.tipo === 'receita' ? '+' : '-'}{fmt(Number(e.valor))}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem' }}>
                      <button
                        onClick={() => {
                          setEditingEntry(null)
                          setShowEntryModal(true)
                          // Pré-preencher contrato no modal via state
                          setTimeout(() => {
                            const modal = document.querySelector('[data-modal-contrato-id]') as HTMLSelectElement
                            if (modal) modal.value = c.id
                          }, 50)
                        }}
                        style={{ ...btnEditStyle, fontSize: '.72rem' }}
                      >
                        + Lançamento
                      </button>
                      <button onClick={() => openEditContrato(c)} style={btnEditStyle}>Editar</button>
                      <button onClick={() => handleDeleteContrato(c.id)} style={btnDelStyle}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB: BANCÁRIO (Open Finance)
      ═══════════════════════════════════════════════════════ */}
      {tab === 'bancario' && <OpenFinanceTabLazy />}

      {/* ═══════════════════════════════════════════════════════
          MODAL: NOVO / EDITAR LANÇAMENTO
      ═══════════════════════════════════════════════════════ */}
      {showEntryModal && (
        <EntryModal
          entry={editingEntry}
          categories={categories}
          contratos={contratos}
          leads={initialLeads}
          isAdmin={isAdmin}
          onClose={() => setShowEntryModal(false)}
          onSave={handleSaveEntry}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: NOVO / EDITAR CONTRATO
      ═══════════════════════════════════════════════════════ */}
      {showContratoModal && (
        <ContratoModal
          contrato={editingContrato}
          leads={initialLeads}
          onClose={() => setShowContratoModal(false)}
          onSave={handleSaveContrato}
        />
      )}
    </div>
  )
}

// ─── Entry Modal ─────────────────────────────────────────────────────────────

function EntryModal({ entry, categories, contratos, leads, isAdmin, onClose, onSave }: {
  entry: Entry | null
  categories: Category[]
  contratos: Contrato[]
  leads: Lead[]
  isAdmin: boolean
  onClose: () => void
  onSave: (form: Partial<Entry>) => Promise<void>
}) {
  const [tipo, setTipo] = useState<'receita' | 'despesa'>(entry?.tipo ?? (isAdmin ? 'receita' : 'despesa'))
  const [descricao, setDescricao] = useState(entry?.descricao ?? '')
  const [valor, setValor] = useState(entry?.valor?.toString() ?? '')
  const [data, setData] = useState(entry?.data ?? new Date().toISOString().split('T')[0])
  const [categoriaId, setCategoriaId] = useState(entry?.categoria_id ?? '')
  const [formaPagamento, setFormaPagamento] = useState(entry?.forma_pagamento ?? '')
  const [status, setStatus] = useState<'confirmado' | 'pendente' | 'cancelado'>(entry?.status ?? 'confirmado')
  const [notas, setNotas] = useState(entry?.notas ?? '')
  const [leadId, setLeadId] = useState(entry?.leads?.id ?? '')
  const [contratoId, setContratoId] = useState(entry?.contrato_id ?? '')
  const [parcelaNumero, setParcelaNumero] = useState(entry?.parcela_numero?.toString() ?? '')
  const [parcelasTotal, setParcelasTotal] = useState(entry?.parcelas_total?.toString() ?? '')
  const [showVinculo, setShowVinculo] = useState(!!(entry?.leads?.id || entry?.contrato_id))
  const [loading, setLoading] = useState(false)

  const catsFiltradas = categories.filter((c) => c.tipo === tipo)
  const contratosDoLead = contratos.filter((c) => c.lead_id === leadId && c.status === 'ativo')
  const contratoSelecionado = contratos.find((c) => c.id === contratoId)

  function onContratoChange(id: string) {
    setContratoId(id)
    const c = contratos.find((ct) => ct.id === id)
    if (c) {
      setParcelasTotal(c.parcelas.toString())
      if (!leadId) setLeadId(c.lead_id)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!descricao || !valor || !data) return
    setLoading(true)
    await onSave({
      tipo, descricao, valor: Number(valor), data,
      categoria_id: categoriaId || null,
      forma_pagamento: formaPagamento || null,
      status, notas: notas || null,
      lead_id: leadId || null,
      contrato_id: contratoId || null,
      parcela_numero: parcelaNumero ? Number(parcelaNumero) : null,
      parcelas_total: parcelasTotal ? Number(parcelasTotal) : null,
    } as Partial<Entry>)
    setLoading(false)
  }

  const isReceita = tipo === 'receita'
  const accentColor = isReceita ? '#059669' : '#dc2626'
  const accentBg = isReceita ? '#f0fdf4' : '#fef2f2'
  const accentBorder = isReceita ? '#bbf7d0' : '#fecaca'

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,14,12,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,.18)', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header colorido por tipo ── */}
        <div style={{ padding: '1.5rem 1.75rem 1.25rem', borderBottom: '1px solid #f0eeec' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f0e0c', margin: 0 }}>
              {entry ? 'Editar lançamento' : 'Novo lançamento'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a9590', fontSize: '1.2rem', lineHeight: 1, padding: '.25rem' }}
            >
              ✕
            </button>
          </div>

          {/* Tipo toggle */}
          {isAdmin ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
              {(['receita', 'despesa'] as const).map((t) => {
                const sel = tipo === t
                const c = t === 'receita' ? '#059669' : '#dc2626'
                const bg = t === 'receita' ? '#f0fdf4' : '#fef2f2'
                const border = t === 'receita' ? '#bbf7d0' : '#fecaca'
                return (
                  <button
                    key={t} type="button"
                    onClick={() => { setTipo(t); setCategoriaId('') }}
                    style={{
                      padding: '.7rem 1rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '.85rem',
                      fontWeight: sel ? 600 : 400,
                      border: `1.5px solid ${sel ? border : '#e8e6e3'}`,
                      background: sel ? bg : '#fafaf9',
                      color: sel ? c : '#9a9590',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '.5rem',
                      transition: 'all .15s',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{t === 'receita' ? '↑' : '↓'}</span>
                    {t === 'receita' ? 'Receita' : 'Despesa'}
                  </button>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '.45rem .85rem' }}>
              <span style={{ color: '#dc2626', fontSize: '.85rem', fontWeight: 500 }}>↓ Despesa</span>
            </div>
          )}
        </div>

        {/* ── Corpo do formulário ── */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* Descrição */}
          <Field label="Descrição *">
            <input
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={isReceita ? 'Ex: Facetas de porcelana — parcela 1' : 'Ex: Aluguel do consultório'}
              style={inputStyle}
            />
          </Field>

          {/* Valor + Data */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }}>
            <Field label="Valor (R$) *">
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '.9rem', top: '50%', transform: 'translateY(-50%)', color: '#9a9590', fontSize: '.85rem', pointerEvents: 'none' }}>R$</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  style={{ ...inputStyle, paddingLeft: '2.4rem' }}
                />
              </div>
            </Field>
            <Field label="Data *">
              <input required type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ ...inputStyle, colorScheme: 'light' }} />
            </Field>
          </div>

          {/* Categoria + Forma de pagamento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }}>
            <Field label="Categoria">
              <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} style={inputStyle}>
                <option value="">Sem categoria</option>
                {catsFiltradas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Field>
            <Field label="Forma de pagamento">
              <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} style={inputStyle}>
                <option value="">Selecione...</option>
                {FORMAS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </Field>
          </div>

          {/* Status — pill buttons */}
          <div>
            <label style={fieldLabel}>Status</label>
            <div style={{ display: 'flex', gap: '.4rem', marginTop: '.35rem' }}>
              {([
                { v: 'confirmado', label: 'Confirmado', color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
                { v: 'pendente', label: 'Pendente', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                { v: 'cancelado', label: 'Cancelado', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
              ] as const).map(({ v, label, color, bg, border }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setStatus(v)}
                  style={{
                    padding: '.35rem .8rem',
                    borderRadius: '20px',
                    fontSize: '.75rem',
                    fontWeight: status === v ? 600 : 400,
                    border: `1px solid ${status === v ? border : '#e8e6e3'}`,
                    background: status === v ? bg : 'transparent',
                    color: status === v ? color : '#9a9590',
                    cursor: 'pointer',
                    transition: 'all .12s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <Field label="Observações">
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Notas internas, condições especiais..."
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </Field>

          {/* Vínculo com paciente/contrato — seção expansível */}
          <div style={{ borderTop: '1px solid #f0eeec', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowVinculo((v) => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.78rem', color: '#7a7570', padding: 0 }}
            >
              <span style={{ transition: 'transform .15s', display: 'inline-block', transform: showVinculo ? 'rotate(90deg)' : 'none' }}>▶</span>
              Vincular a paciente / contrato
              {(leadId || contratoId) && (
                <span style={{ marginLeft: '.25rem', fontSize: '.68rem', background: accentBg, color: accentColor, border: `1px solid ${accentBorder}`, borderRadius: '10px', padding: '.1rem .5rem' }}>
                  vinculado
                </span>
              )}
            </button>

            {showVinculo && (
              <div style={{ marginTop: '.85rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                <Field label="Paciente">
                  <select value={leadId} onChange={(e) => { setLeadId(e.target.value); setContratoId('') }} style={inputStyle}>
                    <option value="">— Sem vínculo —</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome}{l.especialidade ? ` · ${l.especialidade}` : ''}
                      </option>
                    ))}
                  </select>
                </Field>

                {leadId && (
                  <Field label="Contrato">
                    <select
                      data-modal-contrato-id
                      value={contratoId}
                      onChange={(e) => onContratoChange(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">— Sem contrato —</option>
                      {contratosDoLead.length === 0 && <option disabled>Nenhum contrato ativo</option>}
                      {contratosDoLead.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.descricao} ({fmt(Number(c.valor_total))})
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                {contratoId && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }}>
                    <Field label="Nº da parcela">
                      <input
                        type="number"
                        min="0"
                        value={parcelaNumero}
                        onChange={(e) => setParcelaNumero(e.target.value)}
                        placeholder="1  (0 = entrada)"
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Total de parcelas">
                      <input
                        type="number"
                        min="1"
                        value={parcelasTotal}
                        onChange={(e) => setParcelasTotal(e.target.value)}
                        placeholder={contratoSelecionado?.parcelas.toString() ?? '1'}
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rodapé com ações */}
          <div style={{ display: 'flex', gap: '.75rem', paddingTop: '.25rem' }}>
            <button type="button" onClick={onClose} style={btnCancelStyle}>Cancelar</button>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...btnPrimStyle,
                background: loading ? '#555' : accentColor,
                opacity: loading ? .7 : 1,
              }}
            >
              {loading ? 'Salvando...' : entry ? 'Salvar alterações' : `Registrar ${isReceita ? 'receita' : 'despesa'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Contrato Modal ───────────────────────────────────────────────────────────

function ContratoModal({ contrato, leads, onClose, onSave }: {
  contrato: Contrato | null
  leads: Lead[]
  onClose: () => void
  onSave: (form: Partial<Contrato>) => Promise<void>
}) {
  const [leadId, setLeadId] = useState(contrato?.lead_id ?? '')
  const [descricao, setDescricao] = useState(contrato?.descricao ?? '')
  const [valorTotal, setValorTotal] = useState(contrato?.valor_total?.toString() ?? '')
  const [parcelas, setParcelas] = useState(contrato?.parcelas?.toString() ?? '1')
  const [valorEntrada, setValorEntrada] = useState(contrato?.valor_entrada?.toString() ?? '0')
  const [dataInicio, setDataInicio] = useState(contrato?.data_inicio ?? new Date().toISOString().split('T')[0])
  const [statusContrato, setStatusContrato] = useState<'ativo' | 'quitado' | 'cancelado'>(contrato?.status ?? 'ativo')
  const [notas, setNotas] = useState(contrato?.notas ?? '')
  const [loading, setLoading] = useState(false)

  const valorParcela = valorTotal && parcelas
    ? Number(valorTotal) / Number(parcelas)
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!leadId || !descricao || !valorTotal) return
    setLoading(true)
    await onSave({
      lead_id: leadId,
      descricao,
      valor_total: Number(valorTotal),
      parcelas: Number(parcelas),
      valor_entrada: Number(valorEntrada),
      data_inicio: dataInicio,
      status: statusContrato,
      notas: notas || null,
    } as Partial<Contrato>)
    setLoading(false)
  }

  return (
    <ModalWrapper onClose={onClose}>
      <h2 style={modalTitle}>{contrato ? 'Editar contrato' : 'Novo contrato'}</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Field label="Paciente *">
          <select required value={leadId} onChange={(e) => setLeadId(e.target.value)} style={inputStyle}>
            <option value="">— Selecione —</option>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.nome}{l.especialidade ? ` (${l.especialidade})` : ''}</option>)}
          </select>
        </Field>

        <Field label="Descrição do tratamento *">
          <input required value={descricao} onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Facetas de porcelana superior" style={inputStyle} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Valor total (R$) *">
            <input required type="number" min="0.01" step="0.01" value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)} placeholder="0,00" style={inputStyle} />
          </Field>
          <Field label="Nº de parcelas">
            <input type="number" min="1" value={parcelas}
              onChange={(e) => setParcelas(e.target.value)} style={inputStyle} />
          </Field>
        </div>

        {valorParcela > 0 && (
          <div style={{ fontSize: '.75rem', color: '#b8965a', background: '#faf7f2', padding: '.5rem .75rem', borderRadius: '3px', border: '1px solid #e8ddd0' }}>
            {Number(parcelas)}x de <strong>{fmt(valorParcela)}</strong>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Valor de entrada (R$)">
            <input type="number" min="0" step="0.01" value={valorEntrada}
              onChange={(e) => setValorEntrada(e.target.value)} placeholder="0,00" style={inputStyle} />
          </Field>
          <Field label="Data de início">
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} style={inputStyle} />
          </Field>
        </div>

        {contrato && (
          <Field label="Status do contrato">
            <select value={statusContrato} onChange={(e) => setStatusContrato(e.target.value as typeof statusContrato)} style={inputStyle}>
              <option value="ativo">Ativo</option>
              <option value="quitado">Quitado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </Field>
        )}

        <Field label="Observações">
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2}
            placeholder="Condições especiais, observações do paciente..." style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>

        <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
          <button type="button" onClick={onClose} style={btnCancelStyle}>Cancelar</button>
          <button type="submit" disabled={loading} style={btnPrimStyle}>
            {loading ? 'Salvando...' : contrato ? 'Salvar alterações' : 'Criar contrato'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: '10px', padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color, icon, sub }: { label: string; value: string; color: string; icon: string; sub?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
        <span style={{ fontSize: '.72rem', color: '#7a7570' }}>{label}</span>
        <span style={{ fontSize: '1rem', color }}>{icon}</span>
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 600, color }}>{value}</div>
      {sub && <div style={{ fontSize: '.65rem', color: '#7a7570', marginTop: '.25rem' }}>{sub}</div>}
    </div>
  )
}

function TipoBadge({ tipo }: { tipo: 'receita' | 'despesa' }) {
  return (
    <span style={{
      fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.06em',
      color: tipo === 'receita' ? '#10b981' : '#ef4444',
      background: tipo === 'receita' ? '#d1fae5' : '#fee2e2',
      padding: '.15rem .5rem', borderRadius: '2px',
    }}>
      {tipo}
    </span>
  )
}

function StatusBadge({ status }: { status: 'confirmado' | 'pendente' | 'cancelado' }) {
  const color = STATUS_COLORS[status]
  return (
    <span style={{
      fontSize: '.65rem', color, background: `${color}18`,
      padding: '.15rem .5rem', borderRadius: '2px',
    }}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function Th({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return (
    <th style={{
      padding: '.6rem 1rem', textAlign: align ?? 'left', fontSize: '.68rem',
      letterSpacing: '.08em', textTransform: 'uppercase', color: '#7a7570',
      fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
      <label style={{ fontSize: '.7rem', letterSpacing: '.08em', textTransform: 'uppercase', color: '#7a7570' }}>{label}</label>
      {children}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e5e5e3', borderRadius: '6px',
  padding: '.65rem .9rem', fontSize: '.85rem', outline: 'none',
  background: '#fff', color: '#0f0e0c', boxSizing: 'border-box',
}

const fieldLabel: React.CSSProperties = {
  fontSize: '.7rem', letterSpacing: '.08em', textTransform: 'uppercase', color: '#7a7570', display: 'block', marginBottom: '.35rem',
}

const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #ebebea', borderRadius: '8px', padding: '1.5rem',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '.9rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '1rem',
}

const modalTitle: React.CSSProperties = {
  fontSize: '1.1rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '1.5rem',
}

const btnPrimStyle: React.CSSProperties = {
  flex: 1, padding: '.65rem 1.25rem', background: '#0f0e0c', color: '#f5f0e8',
  border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '.78rem', fontWeight: 500,
}

const btnSecStyle: React.CSSProperties = {
  padding: '.55rem 1.25rem', background: 'transparent', color: '#0f0e0c',
  border: '1px solid #ebebea', borderRadius: '6px', cursor: 'pointer', fontSize: '.78rem',
}

const btnCancelStyle: React.CSSProperties = {
  flex: 1, padding: '.65rem', border: '1px solid #ebebea', borderRadius: '6px',
  background: 'transparent', cursor: 'pointer', fontSize: '.78rem', color: '#7a7570',
}

const btnEditStyle: React.CSSProperties = {
  padding: '.3rem .7rem', border: '1px solid #ebebea', borderRadius: '5px',
  background: 'transparent', cursor: 'pointer', fontSize: '.72rem', color: '#b8965a',
}

const btnDelStyle: React.CSSProperties = {
  padding: '.3rem .6rem', border: '1px solid #ef444440', borderRadius: '2px',
  background: 'transparent', cursor: 'pointer', fontSize: '.72rem', color: '#ef4444',
}
