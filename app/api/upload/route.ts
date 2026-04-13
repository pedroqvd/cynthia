/**
 * POST /api/upload — Upload de imagem para Supabase Storage (autenticado, admin client)
 */
import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 5
const ALLOWED_BUCKETS = ['before_after', 'testimonials', 'site']

export async function POST(request: NextRequest) {
  // Verifica autenticação pelo client do usuário
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const bucket = formData.get('bucket') as string | null

  if (!file) return apiError('Nenhum arquivo enviado', 400)
  if (!bucket || !ALLOWED_BUCKETS.includes(bucket)) {
    return apiError('Bucket inválido', 400)
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.', 400)
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return apiError(`Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.`, 400)
  }

  // Usa admin client para bypass de RLS no Storage
  const admin = createAdminClient()

  // Garante que o bucket existe (cria se necessário)
  const { data: buckets } = await admin.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === bucket)
  if (!bucketExists) {
    const { error: createError } = await admin.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: MAX_SIZE_MB * 1024 * 1024,
      allowedMimeTypes: ALLOWED_TYPES,
    })
    if (createError) {
      console.error('Erro ao criar bucket:', createError)
      return apiError(`Não foi possível criar o bucket "${bucket}": ${createError.message}`, 500)
    }
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = await file.arrayBuffer()

  const { data, error } = await admin.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error('Erro no upload:', error)
    return apiError(`Erro no upload: ${error.message}`, 500)
  }

  const { data: { publicUrl } } = admin.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return apiResponse({ url: publicUrl, path: data.path })
}
