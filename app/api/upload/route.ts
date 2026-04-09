/**
 * POST /api/upload — Upload de imagem para Supabase Storage (autenticado)
 */
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 5

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const bucket = formData.get('bucket') as string | null

  if (!file) return apiError('Nenhum arquivo enviado', 400)
  if (!bucket || !['before_after', 'testimonials', 'site'].includes(bucket)) {
    return apiError('Bucket inválido', 400)
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.', 400)
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return apiError(`Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.`, 400)
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = await file.arrayBuffer()

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) return apiError(error.message, 500)

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return apiResponse({ url: publicUrl, path: data.path })
}
