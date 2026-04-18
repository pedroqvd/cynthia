/**
 * DELETE /api/leads/[id]/notes/[noteId] → remove nota
 */
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)

  const { error } = await supabase
    .from('clinical_notes')
    .delete()
    .eq('id', params.noteId)
    .eq('lead_id', params.id)

  if (error) return apiError(error.message, 500)
  return apiResponse({ deleted: true })
}
