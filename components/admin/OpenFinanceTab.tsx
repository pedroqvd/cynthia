'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────────────────────

type BankConnection = {
  id: string
  item_id: string
  connector_name: string
  account_name: string
  account_number: string
  balance: number
  status: string
  last_sync: string | null
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
  fontFamily: 'inherit',
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
  fontFamily: 'inherit',
}

const btnDanger: React.CSSProperties = {
  background: '#fff5f5',
  color: '#dc2626',
  border: '1px solid #fecaca',
  borderRadius: DS.radius6,
  padding: '.45rem .9rem',
  fontSize: '.82rem',
  fontWeight: 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    active:   { label: 'Ativo',       bg: '#f0fdf4', color: '#16a34a' },
    error:    { label: 'Erro',        bg: '#fff5f5', color: '#dc2626' },
    updating: { label: 'Atualizando', bg: '#fffbeb', color: '#d97706' },
  }
  const s = map[status] ?? { label: status, bg: DS.bg, color: DS.secondary }
  return (
    <span style={{
      display: 'inline-block', padding: '.2rem .6rem',
      background: s.bg, color: s.color,
      borderRadius: '999px', fontSize: '.73rem', fontWeight: 600,
    }}>
      {s.label}
    </span>
  )
}

// ─── How it works section ─────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      n: '1',
      title: 'Conecte sua conta',
      desc: 'Autorize o acesso à sua conta CNPJ pelo app do seu banco',
    },
    {
      n: '2',
      title: 'Transações importadas',
      desc: 'As transações são importadas automaticamente como lançamentos',
    },
    {
      n: '3',
      title: 'Revisão e categorização',
      desc: 'Revise e categorize os lançamentos importados',
    },
  ]

  return (
    <div style={{
      background: DS.white, border: `1px solid ${DS.border}`,
      borderRadius: DS.radius8, padding: '1.5rem', marginTop: '1.5rem',
    }}>
      <div style={{ fontSize: '.82rem', fontWeight: 600, color: DS.secondary, marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        Como funciona
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        {steps.map(step => (
          <div key={step.n} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: DS.dark, color: '#f5f0e8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.82rem', fontWeight: 700,
            }}>
              {step.n}
            </div>
            <div>
              <div style={{ fontSize: '.88rem', fontWeight: 600, color: DS.dark, marginBottom: '.2rem' }}>
                {step.title}
              </div>
              <div style={{ fontSize: '.82rem', color: DS.secondary, lineHeight: 1.5 }}>
                {step.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onConnect, loading }: { onConnect: () => void; loading: boolean }) {
  return (
    <div style={{
      background: DS.white, border: `1px solid ${DS.border}`,
      borderRadius: DS.radius8, padding: '3rem 2rem',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', gap: '1rem',
    }}>
      <div style={{ fontSize: '2.5rem', opacity: .5 }}>🏦</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: DS.dark }}>
        Nenhuma conta vinculada
      </div>
      <div style={{ fontSize: '.85rem', color: DS.secondary, maxWidth: 360, lineHeight: 1.6 }}>
        Conecte sua conta CNPJ para importar transações automaticamente via Open Finance Brasil.
      </div>
      <button
        onClick={onConnect}
        disabled={loading}
        style={{ ...btnPrimary, opacity: loading ? .6 : 1, marginTop: '.5rem' }}
      >
        {loading ? 'Aguarde…' : '+ Conectar conta'}
      </button>
    </div>
  )
}

// ─── Connection Card ──────────────────────────────────────────────────────────

function ConnectionCard({
  conn, onRemove, removing,
}: {
  conn: BankConnection
  onRemove: (id: string) => void
  removing: boolean
}) {
  return (
    <div style={{
      background: DS.white, border: `1px solid ${DS.border}`,
      borderRadius: DS.radius8, padding: '1.25rem 1.5rem',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: '1rem',
    }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1 }}>
        {/* Bank icon */}
        <div style={{
          width: 44, height: 44, borderRadius: DS.radius8, background: DS.bg,
          border: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0,
        }}>
          🏦
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap', marginBottom: '.3rem' }}>
            <span style={{ fontSize: '.95rem', fontWeight: 700, color: DS.dark }}>
              {conn.connector_name || 'Banco'}
            </span>
            <StatusBadge status={conn.status} />
          </div>
          <div style={{ fontSize: '.82rem', color: DS.secondary, marginBottom: '.2rem' }}>
            {conn.account_name}{conn.account_number ? ` • Ag/Cc: ${conn.account_number}` : ''}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: DS.dark, marginBottom: '.3rem' }}>
            {fmtCurrency(conn.balance ?? 0)}
          </div>
          <div style={{ fontSize: '.75rem', color: DS.muted }}>
            Última sincronização: {fmtDate(conn.last_sync)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
        <button
          onClick={() => toast.info('Sincronização iniciada — aguarde alguns instantes.')}
          style={btnSecondary}
        >
          Sincronizar
        </button>
        <button
          onClick={() => onRemove(conn.id)}
          disabled={removing}
          style={{ ...btnDanger, opacity: removing ? .5 : 1 }}
        >
          Remover
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OpenFinanceTab() {
  const [connections, setConnections] = useState<BankConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [connectLoading, setConnectLoading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const supabase = createClient()

  // ─── Fetch connections ────────────────────────────────────────────────────
  async function fetchConnections() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bank_connections')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setConnections((data as BankConnection[]) ?? [])
    } catch {
      toast.error('Erro ao carregar contas bancárias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConnections() }, [])

  // ─── Connect ──────────────────────────────────────────────────────────────
  async function handleConnect() {
    setConnectLoading(true)
    try {
      const res = await fetch('/api/openfinance/connect-token', { method: 'POST' })
      const json = await res.json()

      if (res.status === 503 || json.error) {
        toast.error(
          json.error?.includes('PLUGGY')
            ? 'Configure PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET no .env.local para usar Open Finance.'
            : json.error ?? 'Erro ao obter token de conexão'
        )
        setConnectLoading(false)
        return
      }

      const { accessToken } = json.data

      // Load Pluggy Connect script dynamically
      await new Promise<void>((resolve, reject) => {
        if ((window as any).PluggyConnect) { resolve(); return }
        const s = document.createElement('script')
        s.src = 'https://cdn.pluggy.ai/pluggy-connect/v2.2.0/pluggy-connect.js'
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('Falha ao carregar Pluggy Connect'))
        document.head.appendChild(s)
      })

      const PluggyConnect = (window as any).PluggyConnect
      const pluggy = new PluggyConnect({
        connectToken: accessToken,
        onSuccess: async ({ item }: { item: Record<string, unknown> }) => {
          try {
            await supabase.from('bank_connections').insert({
              item_id: String(item.id ?? ''),
              connector_name: (item as any).connector?.name ?? 'Banco',
              account_name: null,
              account_number: null,
              account_type: 'CHECKING',
              balance: 0,
              status: 'updating',
              last_sync: new Date().toISOString(),
            })
            toast.success('Conta conectada! Importando transações…')
            await fetchConnections()
          } catch {
            toast.error('Erro ao salvar conexão bancária')
          }
          setConnectLoading(false)
        },
        onError: (_err: unknown) => {
          toast.error('Erro ao conectar conta bancária')
          setConnectLoading(false)
        },
        onClose: () => {
          setConnectLoading(false)
        },
      })
      pluggy.init()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error(msg)
      setConnectLoading(false)
    }
  }

  // ─── Remove connection ────────────────────────────────────────────────────
  async function handleRemove(id: string) {
    if (!confirm('Remover esta conta bancária vinculada?')) return
    setRemovingId(id)
    try {
      const { error } = await supabase
        .from('bank_connections')
        .delete()
        .eq('id', id)
      if (error) throw error
      toast.success('Conta removida')
      setConnections(prev => prev.filter(c => c.id !== id))
    } catch {
      toast.error('Erro ao remover conta')
    } finally {
      setRemovingId(null)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem',
      }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: DS.dark, margin: 0 }}>
            Contas bancárias vinculadas
          </h2>
          <p style={{ fontSize: '.82rem', color: DS.secondary, margin: '.25rem 0 0' }}>
            Open Finance Brasil — importação automática de transações
          </p>
        </div>
        {connections.length > 0 && (
          <button
            onClick={handleConnect}
            disabled={connectLoading}
            style={{ ...btnPrimary, opacity: connectLoading ? .6 : 1 }}
          >
            {connectLoading ? 'Aguarde…' : '+ Conectar conta'}
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: DS.muted, fontSize: '.9rem' }}>
          Carregando contas bancárias…
        </div>
      )}

      {/* Empty state */}
      {!loading && connections.length === 0 && (
        <>
          <EmptyState onConnect={handleConnect} loading={connectLoading} />
          <HowItWorks />
        </>
      )}

      {/* Connection cards */}
      {!loading && connections.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {connections.map(conn => (
            <ConnectionCard
              key={conn.id}
              conn={conn}
              onRemove={handleRemove}
              removing={removingId === conn.id}
            />
          ))}

          {/* Summary bar */}
          <div style={{
            background: DS.white, border: `1px solid ${DS.border}`,
            borderRadius: DS.radius8, padding: '1rem 1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '.75rem',
          }}>
            <div style={{ fontSize: '.82rem', color: DS.secondary }}>
              <strong style={{ color: DS.dark }}>{connections.length}</strong> conta{connections.length !== 1 ? 's' : ''} vinculada{connections.length !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '.88rem', fontWeight: 700, color: DS.dark }}>
              Saldo total:{' '}
              <span style={{ color: DS.gold }}>
                {fmtCurrency(connections.reduce((acc, c) => acc + (c.balance ?? 0), 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
