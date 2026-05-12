import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)
  const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
  if (roleRow?.role !== 'admin') return apiError('Sem permissão', 403)

  const { error } = await supabase
    .from('social_metrics')
    .delete()
    .eq('id', params.id)

  if (error) return apiError(error.message, 500)
  return apiResponse({ ok: true })
}
