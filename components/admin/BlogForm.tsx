'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Post {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string | null
  published: boolean
}

export function BlogForm({ initialData }: { initialData?: Post }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<Post>(
    initialData || {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      cover_image: null,
      published: false,
    }
  )

  function generateSlug(text: string) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('bucket', 'site') // Usando o bucket 'site' que já deve existir. Ou before_after

      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const { data } = await res.json()

      if (!res.ok) throw new Error(data?.error)
      setFormData(prev => ({ ...prev, cover_image: data.url }))
      toast.success('Imagem enviada com sucesso!')
    } catch (err) {
      toast.error('Erro ao enviar imagem.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const isNew = !formData.id

      if (isNew) {
        const { error } = await supabase.from('posts').insert([formData])
        if (error) throw error
        toast.success('Artigo criado com sucesso!')
      } else {
        const { error } = await supabase.from('posts').update({
          title: formData.title,
          slug: formData.slug,
          excerpt: formData.excerpt,
          content: formData.content,
          cover_image: formData.cover_image,
          published: formData.published
        }).eq('id', formData.id)
        
        if (error) throw error
        toast.success('Artigo salvo com sucesso!')
      }

      router.push('/admin/blog')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar o artigo. Verifique se o título/slug já existe ou contate o suporte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '2rem', alignItems: 'start' }} className="max-md:!grid-cols-1">
      {/* Coluna Principal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontSize: '.8rem', color: '#7a7570', fontWeight: 500 }}>Título do Artigo</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => {
              const title = e.target.value
              setFormData(prev => ({
                ...prev,
                title,
                slug: initialData ? prev.slug : generateSlug(title)
              }))
            }}
            placeholder="Ex: Novos paradigmas na estética dental..."
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontSize: '.8rem', color: '#7a7570', fontWeight: 500 }}>Corpo do Texto (Use formato Markdown para negritos e subtítulos)</label>
          <div style={{ display: 'flex', padding: '.5rem 1rem', background: 'rgba(184,150,90,0.08)', borderRadius: '4px 4px 0 0', border: '1px solid #e5e5e3', borderBottom: 'none', gap: '1rem', fontSize: '.75rem', color: '#7a7570' }}>
            <span>**Negrito**</span>
            <span>*Itálico*</span>
            <span># Título Gigante</span>
            <span>## Subtítulo Grande</span>
          </div>
          <textarea
            required
            rows={20}
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Escreva seu artigo aqui..."
            style={{ ...inputStyle, borderRadius: '0 0 4px 4px', resize: 'vertical', fontFamily: 'monospace', fontSize: '.9rem' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontSize: '.8rem', color: '#7a7570', fontWeight: 500 }}>URL/Slug (Link único do post)</label>
          <input
            type="text"
            required
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            placeholder="meu-artigo-lindo"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Coluna Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'sticky', top: '100px' }}>
        
        <div style={{ background: '#fff', border: '1px solid #e5e5e3', padding: '1.5rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '.95rem', fontWeight: 500, color: '#0f0e0c', margin: 0 }}>Publicação</h3>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.85rem', color: '#7a7570', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.published}
              onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
              style={{ accentColor: '#b8965a', width: '16px', height: '16px' }}
            />
            Artigo está Público?
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '.8rem',
              background: '#0f0e0c',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '.85rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e5e3', padding: '1.5rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '.95rem', fontWeight: 500, color: '#0f0e0c', margin: 0 }}>Imagem de Capa</h3>
          
          <div style={{ aspectRatio: '16/9', background: '#f5f5f5', borderRadius: '4px', overflow: 'hidden', position: 'relative', border: '1px dashed #ccc' }}>
            {formData.cover_image ? (
              <Image src={formData.cover_image} alt="Capa" fill style={{ objectFit: 'cover' }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '.8rem' }}>Sem capa</div>
            )}
          </div>

          <label style={{ display: 'inline-block', textAlign: 'center', padding: '.5rem', border: '1px solid #e5e5e3', borderRadius: '4px', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '.8rem', color: '#0f0e0c' }}>
            {uploading ? 'Fazendo Upload...' : 'Escolher Imagem (Upload)'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading}/>
          </label>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e5e3', padding: '1.5rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '.95rem', fontWeight: 500, color: '#0f0e0c', margin: 0 }}>Resumo (Excerpt)</h3>
          <p style={{ fontSize: '.75rem', color: '#7a7570', margin: 0 }}>Um texto curto de 2 linhas que aparecerá na página inicial do blog.</p>
          <textarea
            rows={4}
            value={formData.excerpt}
            onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>

      </div>
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '.85rem 1rem',
  background: '#fff',
  border: '1px solid #e5e5e3',
  borderRadius: '4px',
  color: '#0f0e0c',
  fontSize: '.9rem',
  outline: 'none',
}
