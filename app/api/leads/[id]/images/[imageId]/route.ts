/**
 * DELETE /api/leads/[id]/images/[imageId] → remove imagem do Storage + banco
 */
import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

const BUCKET = 'patient_images'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)

  const { data: image } = await supabase
    .from('patient_images')
    .select('path')
    .eq('id', params.imageId)
    .eq('lead_id', params.id)
    .single()

  if (!image) return apiError('Imagem não encontrada', 404)

  const admin = createAdminClient()
  await admin.storage.from(BUCKET).remove([image.path])

  const { error } = await supabase
    .from('patient_images')
    .delete()
    .eq('id', params.imageId)

  if (error) return apiError(error.message, 500)
  return apiResponse({ deleted: true })
}
