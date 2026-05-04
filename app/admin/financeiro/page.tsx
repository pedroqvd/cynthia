import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { FinanceiroManager } from '@/components/admin/FinanceiroManager'

export const metadata: Metadata = { title: 'Financeiro' }
export const dynamic = 'force-dynamic'

async function getData() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { entries: [], contratos: [], categories: [], leads: [], summary: null, role: 'secretaria' }

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
  const role = roleRow?.role ?? 'secretaria'

  const mesAtual = new Date().toISOString().slice(0, 7)
  const inicioMes = `${mesAtual}-01`

  const [{ data: entries }, { data: categories }, { data: contratos }, { data: leads }] = await Promise.all([
    supabase
      .from('financial_entries')
      .select(`
        *,
        financial_categories(id, nome, cor, tipo),
        leads(id, nome, whatsapp, especialidade),
        appointments(procedimento),
        contratos(id, descricao, valor_total, parcelas)
      `)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('financial_categories')
      .select('*')
      .eq('ativo', true)
      .order('tipo').order('ordem'),
    supabase
      .from('contratos')
      .select(`
        *,
        leads(id, nome, whatsapp, especialidade),
        financial_entries(id, valor, status, parcela_numero, tipo, data)
      `)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('leads')
      .select('id, nome, whatsapp, especialidade')
      .order('nome')
      .limit(300),
  ])

  const allEntries = role === 'admin'
    ? (entries ?? [])
    : (entries ?? []).filter((e) => e.tipo === 'despesa')

  const doMes = allEntries.filter((e) => e.data >= inicioMes && e.status === 'confirmado')
  const totalReceitas = doMes.filter((e) => e.tipo === 'receita').reduce((s, e) => s + Number(e.valor), 0)
  const totalDespesas = doMes.filter((e) => e.tipo === 'despesa').reduce((s, e) => s + Number(e.valor), 0)
  const totalPendente = allEntries.filter((e) => e.status === 'pendente').reduce((s, e) => s + Number(e.valor), 0)

  return {
    entries: allEntries,
    contratos: contratos ?? [],
    categories: categories ?? [],
    leads: leads ?? [],
    role,
    summary: { totalReceitas, totalDespesas, saldo: totalReceitas - totalDespesas, totalPendente },
  }
}

export default async function FinanceiroPage() {
  const { entries, contratos, categories, leads, role, summary } = await getData()
  return (
    <div style={{ padding: '2rem' }}>
      <FinanceiroManager
        initialEntries={entries}
        initialContratos={contratos}
        categories={categories}
        leads={leads}
        role={role}
        summary={summary}
      />
    </div>
  )
}
