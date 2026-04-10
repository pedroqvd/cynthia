import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/server'
import { Nav } from '@/components/site/Nav'
import { Footer } from '@/components/site/Footer'
import Markdown from 'react-markdown'
import Link from 'next/link'

export const revalidate = 3600 // ISR: revalida a cada 1h

async function getPost(slug: string) {
  const supabase = createAdminClient()
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  
  return post
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return { title: 'Artigo não encontrado' }

  return {
    title: `${post.title} | Dra. Cynthia Quevedo`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.cover_image ? [{ url: post.cover_image }] : undefined,
    }
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <>
      <Nav />
      {/* Blog Article Header */}
      <article style={{ background: '#F5F0E6', minHeight: '100vh', paddingBottom: '6rem' }}>
        <header
          style={{
            padding: '12rem 5rem 4rem',
            textAlign: 'center',
            maxWidth: '900px',
            margin: '0 auto'
          }}
          className="max-md:!px-6 max-md:!pt-32 max-md:!pb-8"
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', animation: 'fadeIn 0.4s ease both' }}>
            <Link href="/blog" style={{ fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#6B6B6B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.5rem', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#1B6B5A')} onMouseLeave={(e) => (e.currentTarget.style.color = '#6B6B6B')}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M13 8H3M7 12L3 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Voltar
            </Link>
            <span style={{ width: '1px', height: '14px', background: '#C9A96E' }} />
            <span style={{ fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#1B6B5A', fontFamily: 'Jost, sans-serif' }}>
              {new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 400,
              color: '#1C1C1C',
              lineHeight: 1.1,
              marginBottom: '1.5rem',
              animation: 'fadeUp 0.4s 0.1s ease both'
            }}
          >
            {post.title}
          </h1>

          {post.excerpt && (
            <p style={{ fontSize: '1.1rem', color: '#6B6B6B', lineHeight: 1.7, animation: 'fadeUp 0.4s 0.2s ease both', maxWidth: '750px', margin: '0 auto', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
              {post.excerpt}
            </p>
          )}
        </header>

        {post.cover_image && (
          <div
            style={{
              maxWidth: '1000px',
              margin: '0 auto 4rem',
              aspectRatio: '16/9',
              position: 'relative',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '0.5px solid #EAE3D2',
              animation: 'fadeIn 0.6s 0.3s ease both'
            }}
            className="max-md:mx-6"
          >
             <Image
              src={post.cover_image}
              alt={post.title}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
        )}

        {/* Prose (Markdown Content) */}
        <div
          className="prose prose-lg mx-auto"
          style={{
            maxWidth: '750px',
            background: 'transparent',
            color: '#1C1C1C',
            padding: '0 1.5rem',
            animation: 'fadeIn 0.6s 0.4s ease both'
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .prose h2, .prose h3, .prose h4 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 400; color: #1C1C1C; }
            .prose p, .prose ul, .prose ol { font-family: 'Jost', sans-serif; font-weight: 300; color: #4A4A4A; line-height: 1.8; }
            .prose a { color: #1B6B5A; text-decoration: none; border-bottom: 1px solid rgba(201,169,110,0.4); }
            .prose a:hover { color: #163D32; border-color: #C9A96E; }
            .prose strong { font-weight: 500; color: #1C1C1C; }
            .prose blockquote { border-left: 3px solid #C9A96E; font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.25rem; color: #7B1D3A; background: rgba(245,240,230,0.5); padding: 1rem 1.5rem; margin: 2rem 0; }
            .prose img { border-radius: 8px; border: 0.5px solid #EAE3D2; margin: 2.5rem 0; }
          `}} />
          <Markdown>{post.content}</Markdown>
        </div>
      </article>

      {/* Compartilhar / Agendar CTA */}
      <section style={{ padding: '6rem 5rem', background: '#163D32', textAlign: 'center' }} className="max-md:!px-6">
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', color: '#C9A96E', marginBottom: '1.5rem' }}>Gostou do artigo?</h2>
        <p style={{ fontSize: '.9rem', color: '#F5F0E6', opacity: 0.8, marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>Continue acompanhando as novidades ou agende uma avaliação para entender como essas técnicas podem ser aplicadas no seu caso.</p>
        <Link href="/agendamento" style={{ display: 'inline-flex', padding: '14px 28px', background: '#1B6B5A', color: '#FFF', fontSize: '.78rem', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', borderRadius: '3px', textDecoration: 'none' }}>
          Agendar Avaliação
        </Link>
      </section>

      <Footer />
    </>
  )
}
