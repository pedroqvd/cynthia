import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { BlogForm } from '@/components/admin/BlogForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Editar Artigo' }

async function getPost(id: string) {
  const supabase = createClient()
  const { data } = await supabase.from('posts').select('*').eq('id', id).single()
  return data
}

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id)

  if (!post) {
    notFound()
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/admin/blog" style={{ color: '#7a7570', textDecoration: 'none', fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
          &larr; Voltar para artigos
        </Link>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 500, color: '#0f0e0c', margin: 0 }}>Editar Artigo: {post.title}</h1>
      </div>
      
      <BlogForm initialData={post} />
    </div>
  )
}
