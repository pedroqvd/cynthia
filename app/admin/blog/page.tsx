import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = { title: 'Gestão de Artigos' }
export const dynamic = 'force-dynamic'

async function getAdminPosts() {
  const supabase = createClient()
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, published, cover_image, created_at')
    .order('created_at', { ascending: false })
  
  return posts ?? []
}

export default async function AdminBlogPage() {
  const posts = await getAdminPosts()

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 500, color: '#0f0e0c', margin: 0 }}>Artigos do Blog</h1>
        <Link
          href="/admin/blog/novo"
          style={{
            padding: '.75rem 1.5rem',
            background: '#b8965a',
            color: '#0f0e0c',
            textDecoration: 'none',
            fontSize: '.85rem',
            fontWeight: 500,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '.5rem'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Novo Artigo
        </Link>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e5e3', borderRadius: '6px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e5e5e3', color: '#7a7570', fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Artigo</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Status</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Data</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 500, textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#7a7570' }}>Nenhum artigo encontrado. Crie o primeiro!</td>
              </tr>
            ) : (
              posts.map(post => (
                <tr key={post.id} style={{ borderBottom: '1px solid #e5e5e3' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '4px', background: '#f5f5f5', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                        {post.cover_image && <Image src={post.cover_image} alt="capa" fill style={{ objectFit: 'cover' }} sizes="48px" />}
                      </div>
                      <span style={{ fontSize: '.9rem', fontWeight: 500, color: '#0f0e0c', maxWidth: '300px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    {post.published ? (
                      <span style={{ display: 'inline-block', padding: '4px 8px', background: '#e0f2f1', color: '#00695c', fontSize: '.75rem', borderRadius: '4px', fontWeight: 500 }}>Público</span>
                    ) : (
                      <span style={{ display: 'inline-block', padding: '4px 8px', background: '#f5f5f5', color: '#666', fontSize: '.75rem', borderRadius: '4px', fontWeight: 500 }}>Rascunho</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: '#7a7570', fontSize: '.85rem' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <Link
                      href={`/admin/blog/${post.id}`}
                      style={{
                        padding: '.4rem .8rem',
                        border: '1px solid #e5e5e3',
                        color: '#0f0e0c',
                        textDecoration: 'none',
                        fontSize: '.8rem',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
