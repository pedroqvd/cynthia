'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'
import type { Lead, Message } from '@/lib/supabase/types'

interface Conversation extends Lead {
  messages: Message[]
}

interface Props {
  conversations: Conversation[]
}

const TEMPLATES = [
  { label: 'Boas-vindas', text: 'Olá! Obrigada pelo contato. Como posso ajudar? 😊' },
  { label: 'Confirmar consulta', text: 'Sua consulta está confirmada! Qualquer dúvida, é só me chamar.' },
  { label: 'Solicitar foto', text: 'Para avaliarmos melhor seu caso, poderia nos enviar uma foto do sorriso?' },
  { label: 'Encerrar atendimento', text: 'Fico à disposição sempre que precisar! Obrigada pela confiança. 🙏' },
]

export function WhatsAppInbox({ conversations: initial }: Props) {
  const [conversations, setConversations] = useState(initial)
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null)
  const [messages, setMessages] = useState<Message[]>(initial[0]?.messages ?? [])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedConv = conversations.find((c) => c.id === selectedId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Supabase Realtime — novas mensagens
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message
          if (newMsg.lead_id === selectedId) {
            setMessages((prev) => [...prev, newMsg])
          }
          // Notificação de nova mensagem de outra conversa
          if (newMsg.direction === 'in' && newMsg.lead_id !== selectedId) {
            toast.info('Nova mensagem recebida', { description: 'Clique para ver' })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedId])

  async function handleSelectConv(conv: Conversation) {
    setSelectedId(conv.id)
    // Carrega mensagens do lead
    const supabase = createClient()
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', conv.id)
      .order('created_at', { ascending: true })
      .limit(100)

    setMessages(data ?? [])
  }

  async function handleSuggestAI() {
    if (!selectedId || suggesting) return
    setSuggesting(true)
    try {
      const res = await fetch('/api/ai/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedId }),
      })
      const data = await res.json() as { suggestion?: string; error?: string }
      if (!res.ok || !data.suggestion) {
        toast.error(data.error ?? 'Erro ao gerar sugestão.')
        return
      }
      setText(data.suggestion)
    } catch {
      toast.error('Erro ao conectar com IA.')
    } finally {
      setSuggesting(false)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !selectedId || sending) return

    setSending(true)
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: selectedId, type: 'text', content: text }),
      })

      if (!res.ok) throw new Error()
      setText('')
    } catch {
      toast.error('Erro ao enviar mensagem.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Lista de conversas */}
      <div
        style={{
          width: '300px',
          borderRight: '1px solid #e5e5e3',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #e5e5e3' }}>
          <h1 style={{ fontSize: '.95rem', fontWeight: 500, color: '#0f0e0c' }}>WhatsApp</h1>
          <p style={{ fontSize: '.72rem', color: '#7a7570' }}>{conversations.length} conversas</p>
        </div>

        <div style={{ overflow: 'auto', flex: 1 }}>
          {conversations.map((conv) => {
            const lastMsg = [...(conv.messages ?? [])].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]

            return (
              <button
                key={conv.id}
                onClick={() => handleSelectConv(conv)}
                style={{
                  width: '100%',
                  display: 'flex',
                  gap: '.75rem',
                  padding: '.9rem 1rem',
                  background: selectedId === conv.id ? '#faf7f2' : 'transparent',
                  borderBottom: '1px solid #f0f0ee',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  alignItems: 'flex-start',
                  borderLeft: selectedId === conv.id ? '3px solid #b8965a' : '3px solid transparent',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: '#b8965a22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '.9rem',
                    color: '#b8965a',
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    flexShrink: 0,
                  }}
                >
                  {conv.nome.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '.85rem', fontWeight: 500, color: '#0f0e0c' }}>{conv.nome}</span>
                    {lastMsg && (
                      <span style={{ fontSize: '.65rem', color: '#7a7570', flexShrink: 0 }}>
                        {new Date(lastMsg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {lastMsg && (
                    <p
                      style={{
                        fontSize: '.75rem',
                        color: '#7a7570',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: '2px',
                      }}
                    >
                      {lastMsg.direction === 'out' ? '✓ ' : ''}{lastMsg.content?.slice(0, 50)}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafaf9', overflow: 'hidden' }}>
        {selectedConv ? (
          <>
            {/* Header do chat */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #e5e5e3',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '.95rem', fontWeight: 500, color: '#0f0e0c' }}>{selectedConv.nome}</div>
                <div style={{ fontSize: '.72rem', color: '#7a7570' }}>{selectedConv.whatsapp}</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem' }}>
                <a
                  href={`/admin/leads/${selectedConv.id}`}
                  style={{ fontSize: '.72rem', color: '#b8965a', textDecoration: 'none', padding: '.4rem .8rem', border: '1px solid rgba(184,150,90,0.3)', borderRadius: '2px' }}
                >
                  Ver perfil
                </a>
              </div>
            </div>

            {/* Mensagens */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.direction === 'out' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '.6rem .9rem',
                      borderRadius: msg.direction === 'out' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      background: msg.direction === 'out' ? '#b8965a' : '#fff',
                      color: msg.direction === 'out' ? '#0f0e0c' : '#0f0e0c',
                      fontSize: '.85rem',
                      lineHeight: 1.5,
                      boxShadow: '0 1px 2px rgba(0,0,0,.06)',
                    }}
                  >
                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                    <div
                      style={{
                        fontSize: '.65rem',
                        color: msg.direction === 'out' ? 'rgba(15,14,12,.6)' : '#7a7570',
                        marginTop: '.3rem',
                        textAlign: 'right',
                      }}
                    >
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {msg.direction === 'out' && msg.status === 'read' && ' ✓✓'}
                      {msg.direction === 'out' && msg.status === 'delivered' && ' ✓✓'}
                      {msg.direction === 'out' && msg.status === 'sent' && ' ✓'}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '1rem 1.5rem', background: '#fff', borderTop: '1px solid #e5e5e3' }}>
              {showTemplates && (
                <div
                  style={{
                    marginBottom: '.75rem',
                    display: 'flex',
                    gap: '.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => { setText(t.text); setShowTemplates(false) }}
                      style={{
                        fontSize: '.72rem',
                        padding: '.3rem .7rem',
                        border: '1px solid rgba(184,150,90,0.4)',
                        borderRadius: '12px',
                        background: 'transparent',
                        color: '#b8965a',
                        cursor: 'pointer',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSend} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-end' }}>
                {/* Botão IA */}
                <button
                  type="button"
                  onClick={handleSuggestAI}
                  disabled={suggesting}
                  style={{ background: suggesting ? '#f3f4f6' : 'none', border: suggesting ? '1px solid #e5e5e3' : 'none', cursor: suggesting ? 'wait' : 'pointer', color: '#8b5cf6', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '.7rem' }}
                  title="Sugerir resposta com IA"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"/>
                  </svg>
                  {suggesting ? 'IA...' : 'IA'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a7570', padding: '6px' }}
                  title="Templates"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M2 4h14M2 8h10M2 12h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend(e)
                    }
                  }}
                  rows={1}
                  placeholder="Digite a mensagem..."
                  style={{
                    flex: 1,
                    border: '1px solid #e5e5e3',
                    borderRadius: '20px',
                    padding: '.6rem 1rem',
                    resize: 'none',
                    fontSize: '.85rem',
                    outline: 'none',
                    fontFamily: 'DM Sans, sans-serif',
                    maxHeight: '120px',
                    overflow: 'auto',
                  }}
                />

                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: text.trim() ? '#b8965a' : '#e5e5e3',
                    border: 'none',
                    cursor: text.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background .2s',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 8L2 2l4 6-4 6 12-6z" fill={text.trim() ? '#0f0e0c' : '#7a7570'}/>
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a7570', fontSize: '.9rem' }}>
            Selecione uma conversa para começar
          </div>
        )}
      </div>
    </div>
  )
}
