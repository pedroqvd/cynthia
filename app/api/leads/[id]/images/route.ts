/**
 * GET  /api/leads/[id]/images  → lista imagens do paciente
 * POST /api/leads/[id]/images  → faz upload e persiste
 */
import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 10
const BUCKET = 'patient_images'
const ALLOWED_TIPOS = ['radiografia', 'foto_intraoral', 'foto_extraoral', 'documento', 'outro']

async function getAuth() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase } = await getAuth()
  if (!user) return apiError('Não autorizado', 401)

  const { data, error } = await supabase
    .from('patient_images')
    .select('id, nome, url, tipo, created_at')
    .eq('lead_id', params.id)
    .order('created_at', { ascending: false })

  if (error) return apiError(error.message, 500)
  return apiResponse(data)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase } = await getAuth()
  if (!user) return apiError('Não autorizado', 401)

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const nome = (formData.get('nome') as string | null)?.trim()
  const tipo = (formData.get('tipo') as string | null) ?? 'outro'

  if (!file) return apiError('Nenhum arquivo enviado', 400)
  if (!nome) return apiError('Nome da imagem é obrigatório', 422)
  if (!ALLOWED_TYPES.includes(file.type)) return apiError('Tipo não permitido. Use JPEG, PNG ou WebP.', 400)
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return apiError(`Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.`, 400)
  if (!ALLOWED_TIPOS.includes(tipo)) return apiError('Tipo de imagem inválido', 422)

  const admin = createAdminClient()

  const { data: buckets } = await admin.storage.listBuckets()
  if (!buckets?.some(b => b.name === BUCKET)) {
    await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE_MB * 1024 * 1024,
      allowedMimeTypes: ALLOWED_TYPES,
    })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${params.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = await file.arrayBuffer()

  const { data: uploaded, error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return apiError(uploadError.message, 500)

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(uploaded.path)

  const { data, error } = await supabase
    .from('patient_images')
    .insert({
      lead_id: params.id,
      nome,
      url: publicUrl,
      path: uploaded.path,
      tipo,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    await admin.storage.from(BUCKET).remove([uploaded.path])
    return apiError(error.message, 500)
  }

  return apiResponse(data, 201)
}
