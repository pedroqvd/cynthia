import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ConteudoManager } from '@/components/admin/ConteudoManager'

export const metadata: Metadata = { title: 'Conteúdo' }
export const dynamic = 'force-dynamic'

async function getData() {
  const supabase = createClient()
  const [{ data: beforeAfter }, { data: testimonials }] = await Promise.all([
    supabase.from('before_after').select('*').order('ordem'),
    supabase.from('testimonials').select('*').order('ordem'),
  ])
  return { beforeAfter: beforeAfter ?? [], testimonials: testimonials ?? [] }
}

export default async function ConteudoPage() {
  const { beforeAfter, testimonials } = await getData()
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '2rem' }}>Conteúdo do site</h1>
      <ConteudoManager beforeAfter={beforeAfter} testimonials={testimonials} />
    </div>
  )
}
