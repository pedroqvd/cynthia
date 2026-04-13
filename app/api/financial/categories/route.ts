import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)

  const { data, error } = await supabase
    .from('financial_categories')
    .select('*')
    .eq('ativo', true)
    .order('tipo')
    .order('ordem')

  if (error) return apiError(error.message, 500)
  return apiResponse(data)
}
