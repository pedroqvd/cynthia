import type { Metadata } from 'next'
import { BlogForm } from '@/components/admin/BlogForm'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Novo Artigo' }

export default function NewPostPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/admin/blog" style={{ color: '#7a7570', textDecoration: 'none', fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
          &larr; Voltar para artigos
        </Link>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 500, color: '#0f0e0c', margin: 0 }}>Escrever Novo Artigo</h1>
      </div>
      
      <BlogForm />
    </div>
  )
}
