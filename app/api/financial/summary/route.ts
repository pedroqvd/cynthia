import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).single()
  const role = roleRow?.role ?? 'secretaria'

  // Últimos 6 meses
  const meses: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    meses.push(d.toISOString().slice(0, 7)) // YYYY-MM
  }

  const mesAtual = new Date().toISOString().slice(0, 7)
  const inicioMes = `${mesAtual}-01`
  const fimMes = new Date(
    new Date().getFullYear(), new Date().getMonth() + 1, 0
  ).toISOString().split('T')[0]

  const [{ data: entries }, { data: porCategoria }, { data: pendentes }] =
    await Promise.all([
      supabase
        .from('financial_entries')
        .select('tipo, valor, data, status')
        .gte('data', `${meses[0]}-01`)
        .eq('status', 'confirmado'),
      supabase
        .from('financial_entries')
        .select('tipo, valor, financial_categories(nome, cor)')
        .gte('data', inicioMes)
        .lte('data', fimMes)
        .eq('status', 'confirmado'),
      supabase
        .from('financial_entries')
        .select('tipo, valor')
        .eq('status', 'pendente'),
    ])

  // Agrupa por mês
  const porMes: Record<string, { mes: string; receitas: number; despesas: number }> = {}
  meses.forEach((m) => {
    porMes[m] = {
      mes: new Date(m + '-15').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      receitas: 0,
      despesas: 0,
    }
  })

  for (const e of entries ?? []) {
    const m = (e.data as string).slice(0, 7)
    if (!porMes[m]) continue
    if (e.tipo === 'receita') porMes[m].receitas += Number(e.valor)
    else porMes[m].despesas += Number(e.valor)
  }

  // Totais do mês atual
  const totalReceitas = (entries ?? [])
    .filter((e) => e.data.startsWith(mesAtual) && e.tipo === 'receita')
    .reduce((s, e) => s + Number(e.valor), 0)
  const totalDespesas = (entries ?? [])
    .filter((e) => e.data.startsWith(mesAtual) && e.tipo === 'despesa')
    .reduce((s, e) => s + Number(e.valor), 0)

  // Por categoria (despesas do mês)
  const catMap: Record<string, { nome: string; cor: string; valor: number }> = {}
  for (const e of porCategoria ?? []) {
    if (e.tipo !== 'despesa') continue
    const cat = Array.isArray(e.financial_categories)
      ? e.financial_categories[0]
      : e.financial_categories as { nome: string; cor: string } | null
    const nome = cat?.nome ?? 'Sem categoria'
    const cor = cat?.cor ?? '#7a7570'
    if (!catMap[nome]) catMap[nome] = { nome, cor, valor: 0 }
    catMap[nome].valor += Number(e.valor)
  }

  const totalPendente = (pendentes ?? []).reduce((s, e) => s + Number(e.valor), 0)

  return apiResponse({
    role,
    totalReceitas,
    totalDespesas,
    saldo: totalReceitas - totalDespesas,
    totalPendente,
    graficoMensal: Object.values(porMes),
    graficoCategorias: Object.values(catMap).sort((a, b) => b.valor - a.valor),
  })
}
