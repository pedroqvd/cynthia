import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/server'
import { Nav } from '@/components/site/Nav'
import { Footer } from '@/components/site/Footer'

export const revalidate = 3600 // ISR: revalida a cada 1h

export const metadata: Metadata = {
  title: 'Artigos e Pesquisas',
  description: 'Leia artigos, tccs e pesquisas da Dra. Cynthia Quevedo sobre Odontologia, Estética e Cirurgia Oral.',
}

async function getPosts() {
  try {
    const supabase = createAdminClient()
    const { data: posts } = await supabase
      .from('posts')
      .select('id, slug, title, excerpt, cover_image, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
    
    return posts ?? []
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <>
      <Nav />
      {/* Header do Blog */}
      <section
        style={{
          padding: '12rem 5rem 6rem',
          background: '#F5F0E6',
          textAlign: 'center',
          borderBottom: '1px solid rgba(201,169,110,0.3)'
        }}
        className="max-md:!px-6 max-md:!pt-32 max-md:!pb-12"
      >
        <div className="section-eyebrow" style={{ justifyContent: 'center' }}>
          Conhecimento e Ciência
        </div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2.5rem, 4vw, 4rem)',
            fontWeight: 400,
            color: '#1C1C1C',
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            animation: 'fadeUp 0.4s ease both'
          }}
        >
          Artigos & <em style={{ fontStyle: 'italic', color: '#1B6B5A' }}>Pesquisas</em>
        </h1>
        <p
          style={{
            fontSize: '.9rem',
            color: '#6B6B6B',
            maxWidth: '500px',
            margin: '0 auto',
            lineHeight: 1.8,
            animation: 'fadeUp 0.4s 0.1s ease both'
          }}
        >
          Explorando ciência, tecnologia e estética na odontologia — do consultório para a comunidade científica.
        </p>
      </section>

      {/* Listagem de Posts */}
      <section
        style={{
          padding: '6rem 5rem',
          background: '#F5F0E6',
          minHeight: '400px'
        }}
        className="max-md:!px-6 max-md:!py-16"
      >
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6B6B6B', fontSize: '.9rem', padding: '4rem 0' }}>
            Nenhum artigo publicado no momento. Volte em breve.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3rem',
              maxWidth: '1200px',
              margin: '0 auto'
            }}
          >
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                  group: 'true'
                }}
                className="group"
              >
                {/* Imagem */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16/10',
                    position: 'relative',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: '#EDE7D9',
                    border: '0.5px solid #EAE3D2'
                  }}
                >
                  {post.cover_image ? (
                    <Image
                      src={post.cover_image}
                      alt={post.title}
                      fill
                      style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      className="group-hover:scale-105"
                    />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(201,169,110,0.5)', fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem' }}>
                      CQ
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div>
                  <div style={{ fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#1B6B5A', marginBottom: '.75rem', fontFamily: 'Jost, sans-serif' }}>
                    {new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                  <h2
                    style={{
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      fontSize: '1.8rem',
                      fontWeight: 400,
                      color: '#1C1C1C',
                      marginBottom: '1rem',
                      lineHeight: 1.2
                    }}
                  >
                    {post.title}
                  </h2>
                  <p style={{ fontSize: '.85rem', color: '#6B6B6B', lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.excerpt}
                  </p>
                  <div style={{ marginTop: '1.5rem', fontSize: '.78rem', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: '#1B6B5A', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    Ler artigo
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </>
  )
}
