import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { FinanceiroManager } from '@/components/admin/FinanceiroManager'

export const metadata: Metadata = { title: 'Financeiro' }
export const dynamic = 'force-dynamic'

async function getData() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { entries: [], categories: [], summary: null, role: 'secretaria' }

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
  const role = roleRow?.role ?? 'secretaria'

  const mesAtual = new Date().toISOString().slice(0, 7)
  const inicioMes = `${mesAtual}-01`

  const [{ data: entries }, { data: categories }] = await Promise.all([
    supabase
      .from('financial_entries')
      .select('*, financial_categories(id, nome, cor, tipo), leads(nome), appointments(procedimento)')
      .order('data', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(300),
    supabase
      .from('financial_categories')
      .select('*')
      .eq('ativo', true)
      .order('tipo').order('ordem'),
  ])

  const all = role === 'admin' ? (entries ?? []) : (entries ?? []).filter((e) => e.tipo === 'despesa')

  // Resumo do mês para os cards
  const doMes = all.filter((e) => e.data >= inicioMes && e.status === 'confirmado')
  const totalReceitas = doMes.filter((e) => e.tipo === 'receita').reduce((s, e) => s + Number(e.valor), 0)
  const totalDespesas = doMes.filter((e) => e.tipo === 'despesa').reduce((s, e) => s + Number(e.valor), 0)
  const totalPendente = all.filter((e) => e.status === 'pendente').reduce((s, e) => s + Number(e.valor), 0)

  return {
    entries: all,
    categories: categories ?? [],
    role,
    summary: { totalReceitas, totalDespesas, saldo: totalReceitas - totalDespesas, totalPendente },
  }
}

export default async function FinanceiroPage() {
  const { entries, categories, role, summary } = await getData()
  return (
    <div style={{ padding: '2rem' }}>
      <FinanceiroManager
        initialEntries={entries}
        categories={categories}
        role={role}
        summary={summary}
      />
    </div>
  )
}
