'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type PatientRecord = {
  id?: string
  queixa_principal: string | null
  alergias: string | null
  medicamentos: string | null
  doencas_sistemicas: string | null
  historico_odontologico: string | null
  plano_tratamento: string | null
  updated_at?: string
}

type ClinicalNote = {
  id: string
  titulo: string
  conteudo: string
  appointment_id: string | null
  created_at: string
}

type PatientImage = {
  id: string
  nome: string
  url: string
  tipo: string
  created_at: string
}

type PatientTask = {
  id: string
  titulo: string
  descricao: string | null
  status: 'pendente' | 'concluida'
  vencimento: string | null
  created_at: string
}

const TIPO_LABELS: Record<string, string> = {
  radiografia: 'Radiografia',
  foto_intraoral: 'Foto Intraoral',
  foto_extraoral: 'Foto Extraoral',
  documento: 'Documento',
  outro: 'Outro',
}

const TIPO_COLORS: Record<string, string> = {
  radiografia: '#3b82f6',
  foto_intraoral: '#10b981',
  foto_extraoral: '#8b5cf6',
  documento: '#f59e0b',
  outro: '#7a7570',
}

const FICHA_FIELDS: { key: keyof PatientRecord; label: string; placeholder: string }[] = [
  { key: 'queixa_principal',       label: 'Queixa Principal',        placeholder: 'Motivo inicial da consulta...' },
  { key: 'alergias',               label: 'Alergias',                placeholder: 'Ex: Penicilina, látex...' },
  { key: 'medicamentos',           label: 'Medicamentos em Uso',     placeholder: 'Ex: Losartana 50mg, 1x ao dia...' },
  { key: 'doencas_sistemicas',     label: 'Doenças Sistêmicas',      placeholder: 'Ex: Diabetes tipo 2, hipertensão...' },
  { key: 'historico_odontologico', label: 'Histórico Odontológico',  placeholder: 'Tratamentos anteriores relevantes...' },
  { key: 'plano_tratamento',       label: 'Plano de Tratamento',     placeholder: 'Plano definido pela Dra. Cynthia...' },
]

// ─── Root ─────────────────────────────────────────────────────────────────────

export function PatientRecordsTab({
  leadId,
  appointments,
}: {
  leadId: string
  appointments: { id: string; procedimento: string }[]
}) {
  const [subTab, setSubTab] = useState<'ficha' | 'evolucao' | 'imagens' | 'tarefas'>('ficha')

  const SUB_TABS = [
    { id: 'ficha',    label: 'Ficha Clínica' },
    { id: 'evolucao', label: 'Evolução Clínica' },
    { id: 'imagens',  label: 'Imagens' },
    { id: 'tarefas',  label: 'Tarefas' },
  ] as const

  return (
    <div>
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e5e3', overflowX: 'auto', marginBottom: '1.25rem' }}>
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              padding: '.6rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: '.78rem', fontWeight: 500, whiteSpace: 'nowrap',
              color: subTab === t.id ? '#b8965a' : '#7a7570',
              borderBottom: subTab === t.id ? '2px solid #b8965a' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'ficha'    && <FichaClinica leadId={leadId} />}
      {subTab === 'evolucao' && <EvolucaoClinica leadId={leadId} appointments={appointments} />}
      {subTab === 'imagens'  && <PatientImages leadId={leadId} />}
      {subTab === 'tarefas'  && <PatientTasks leadId={leadId} />}
    </div>
  )
}

// ─── Ficha Clínica ────────────────────────────────────────────────────────────

function FichaClinica({ leadId }: { leadId: string }) {
  const [record, setRecord] = useState<PatientRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingField, setEditingField] = useState<keyof PatientRecord | null>(null)
  const [fieldValue, setFieldValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/leads/${leadId}/records`)
      .then((r) => r.json())
      .then((j) => setRecord(j.data ?? {}))
      .finally(() => setLoading(false))
  }, [leadId])

  async function saveField(key: keyof PatientRecord, value: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/records`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value || null }),
      })
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      setRecord(data)
      setEditingField(null)
      toast.success('Salvo.')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <EmptyState text="Carregando ficha clínica..." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
      {record?.updated_at && (
        <p style={{ fontSize: '.68rem', color: '#b8b4af', textAlign: 'right', margin: 0 }}>
          Atualizado em {new Date(record.updated_at).toLocaleString('pt-BR')}
        </p>
      )}
      {FICHA_FIELDS.map(({ key, label, placeholder }) => {
        const isEditing = editingField === key
        const value = record?.[key] as string | null
        return (
          <div key={key} style={{ background: '#fafaf9', borderRadius: '4px', padding: '.9rem 1rem', border: '1px solid #e5e5e3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (isEditing || value) ? '.6rem' : 0 }}>
              <span style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#7a7570', fontWeight: 500 }}>
                {label}
              </span>
              {!isEditing && (
                <button
                  onClick={() => { setEditingField(key); setFieldValue(value ?? '') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b8965a', fontSize: '.72rem', padding: 0 }}
                >
                  {value ? 'Editar' : '+ Adicionar'}
                </button>
              )}
            </div>
            {isEditing ? (
              <>
                <textarea
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  rows={3}
                  placeholder={placeholder}
                  autoFocus
                  style={{ ...textareaStyle }}
                />
                <div style={{ display: 'flex', gap: '.4rem', marginTop: '.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setEditingField(null)} style={btnSecondary}>Cancelar</button>
                  <button onClick={() => saveField(key, fieldValue)} disabled={saving} style={btnPrimary}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </>
            ) : value ? (
              <p style={{ fontSize: '.82rem', color: '#0f0e0c', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{value}</p>
            ) : (
              <p style={{ fontSize: '.78rem', color: '#c5c2be', fontStyle: 'italic', margin: 0 }}>Não informado</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Evolução Clínica ─────────────────────────────────────────────────────────

function EvolucaoClinica({
  leadId,
  appointments,
}: {
  leadId: string
  appointments: { id: string; procedimento: string }[]
}) {
  const [notes, setNotes] = useState<ClinicalNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [apptId, setApptId] = useState('')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/leads/${leadId}/notes`)
      .then((r) => r.json())
      .then((j) => setNotes(j.data ?? []))
      .finally(() => setLoading(false))
  }, [leadId])

  async function addNote() {
    if (!titulo.trim() || !conteudo.trim()) { toast.error('Preencha título e conteúdo.'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, conteudo, appointment_id: apptId || null }),
      })
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      setNotes((prev) => [data, ...prev])
      setShowForm(false); setTitulo(''); setConteudo(''); setApptId('')
      toast.success('Nota adicionada.')
    } catch {
      toast.error('Erro ao salvar nota.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteNote(id: string) {
    if (!confirm('Excluir esta nota?')) return
    const res = await fetch(`/api/leads/${leadId}/notes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== id))
      toast.success('Nota excluída.')
    }
  }

  if (loading) return <EmptyState text="Carregando notas..." />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>
          {showForm ? 'Cancelar' : '+ Nova Nota'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fafaf9', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título (ex: Avaliação inicial, Sessão 2...)" style={inputStyle} />
            {appointments.length > 0 && (
              <select value={apptId} onChange={(e) => setApptId(e.target.value)} style={inputStyle}>
                <option value="">Sem consulta vinculada</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>{a.procedimento}</option>
                ))}
              </select>
            )}
            <textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder="Descreva a evolução clínica..." rows={4} style={{ ...textareaStyle }} />
            <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end' }}>
              <button onClick={addNote} disabled={saving} style={btnPrimary}>{saving ? 'Salvando...' : 'Salvar Nota'}</button>
            </div>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <EmptyState text="Nenhuma nota de evolução. Clique em '+ Nova Nota' para adicionar." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {notes.map((note) => (
            <div key={note.id} style={{ border: '1px solid #e5e5e3', borderRadius: '4px', background: '#fff', overflow: 'hidden' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.85rem 1rem', cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === note.id ? null : note.id)}
              >
                <div>
                  <div style={{ fontSize: '.88rem', fontWeight: 500, color: '#0f0e0c' }}>{note.titulo}</div>
                  <div style={{ fontSize: '.68rem', color: '#b8b4af', marginTop: '.2rem' }}>
                    {new Date(note.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef444480', fontSize: '.7rem', padding: '2px 6px' }}
                  >
                    Excluir
                  </button>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: expanded === note.id ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: '#7a7570', flexShrink: 0 }}>
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              {expanded === note.id && (
                <div style={{ padding: '.75rem 1rem 1rem', borderTop: '1px solid #f0f0ee' }}>
                  <p style={{ fontSize: '.82rem', color: '#0f0e0c', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{note.conteudo}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Imagens ──────────────────────────────────────────────────────────────────

function PatientImages({ leadId }: { leadId: string }) {
  const [images, setImages] = useState<PatientImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('outro')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<PatientImage | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/leads/${leadId}/images`)
      .then((r) => r.json())
      .then((j) => setImages(j.data ?? []))
      .finally(() => setLoading(false))
  }, [leadId])

  async function upload() {
    if (!file || !nome.trim()) { toast.error('Selecione um arquivo e informe o nome.'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('nome', nome)
      fd.append('tipo', tipo)
      const res = await fetch(`/api/leads/${leadId}/images`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      setImages((prev) => [data, ...prev])
      setShowForm(false); setNome(''); setTipo('outro'); setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      toast.success('Imagem adicionada.')
    } catch {
      toast.error('Erro no upload.')
    } finally {
      setUploading(false)
    }
  }

  async function deleteImage(img: PatientImage) {
    if (!confirm(`Excluir "${img.nome}"?`)) return
    const res = await fetch(`/api/leads/${leadId}/images/${img.id}`, { method: 'DELETE' })
    if (res.ok) {
      setImages((prev) => prev.filter((i) => i.id !== img.id))
      if (preview?.id === img.id) setPreview(null)
      toast.success('Imagem excluída.')
    }
  }

  if (loading) return <EmptyState text="Carregando imagens..." />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>
          {showForm ? 'Cancelar' : '+ Adicionar Imagem'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fafaf9', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da imagem (ex: Rx panorâmica antes do tratamento)" style={inputStyle} />
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
              {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ fontSize: '.8rem', color: '#0f0e0c' }} />
              {file && <span style={{ fontSize: '.72rem', color: '#7a7570' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
            </div>
            <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end' }}>
              <button onClick={upload} disabled={uploading} style={btnPrimary}>{uploading ? 'Enviando...' : 'Enviar'}</button>
            </div>
          </div>
        </div>
      )}

      {images.length === 0 ? (
        <EmptyState text="Nenhuma imagem. Clique em '+ Adicionar Imagem' para enviar." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '.75rem' }}>
          {images.map((img) => {
            const color = TIPO_COLORS[img.tipo] ?? '#7a7570'
            return (
              <div key={img.id} style={{ border: '1px solid #e5e5e3', borderRadius: '4px', overflow: 'hidden', background: '#fff' }}>
                <div
                  onClick={() => setPreview(img)}
                  style={{ cursor: 'zoom-in', background: '#f5f4f2', height: '110px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '.5rem' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 500, color: '#0f0e0c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={img.nome}>{img.nome}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.3rem' }}>
                    <span style={{ fontSize: '.62rem', padding: '.1rem .35rem', borderRadius: '2px', background: `${color}18`, color }}>{TIPO_LABELS[img.tipo]}</span>
                    <button onClick={() => deleteImage(img)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef444480', fontSize: '.68rem', padding: '2px 4px' }}>✕</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal preview */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          className="modal-safe"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          <div style={{ position: 'absolute', top: 'max(1.5rem, env(safe-area-inset-top))', right: 'max(1rem, env(safe-area-inset-right))', display: 'flex', gap: '.75rem' }}>
            <button
              onClick={(e) => { e.stopPropagation(); deleteImage(preview) }}
              style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '.4rem .9rem', cursor: 'pointer', fontSize: '.78rem' }}
            >
              Excluir
            </button>
            <button
              onClick={() => setPreview(null)}
              style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: '4px', padding: '.4rem .9rem', cursor: 'pointer', fontSize: '.78rem' }}
            >
              Fechar ✕
            </button>
          </div>
          <div style={{ maxWidth: 'min(90vw, 800px)', maxHeight: '75vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.url} alt={preview.nome} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '4px' }} onClick={(e) => e.stopPropagation()} />
            <div style={{ color: '#fff', textAlign: 'center' }}>
              <div style={{ fontWeight: 500, fontSize: '.95rem' }}>{preview.nome}</div>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.55)', marginTop: '.25rem' }}>
                {TIPO_LABELS[preview.tipo]} · {new Date(preview.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tarefas ──────────────────────────────────────────────────────────────────

function PatientTasks({ leadId }: { leadId: string }) {
  const [tasks, setTasks] = useState<PatientTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/leads/${leadId}/tasks`)
      .then((r) => r.json())
      .then((j) => setTasks(j.data ?? []))
      .finally(() => setLoading(false))
  }, [leadId])

  async function addTask() {
    if (!titulo.trim()) { toast.error('Informe o título da tarefa.'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descricao: descricao || null, vencimento: vencimento ? new Date(vencimento).toISOString() : null }),
      })
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      setTasks((prev) => [data, ...prev])
      setShowForm(false); setTitulo(''); setDescricao(''); setVencimento('')
      toast.success('Tarefa criada.')
    } catch {
      toast.error('Erro ao criar tarefa.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleTask(task: PatientTask) {
    const newStatus = task.status === 'pendente' ? 'concluida' : 'pendente'
    const res = await fetch(`/api/leads/${leadId}/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t))
  }

  async function deleteTask(id: string) {
    const res = await fetch(`/api/leads/${leadId}/tasks/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id))
      toast.success('Tarefa removida.')
    }
  }

  const now = new Date()
  const pendentes = tasks.filter((t) => t.status === 'pendente')
  const concluidas = tasks.filter((t) => t.status === 'concluida')

  if (loading) return <EmptyState text="Carregando tarefas..." />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>
          {showForm ? 'Cancelar' : '+ Nova Tarefa'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fafaf9', border: '1px solid #e5e5e3', borderRadius: '4px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Tarefa (ex: Ligar para confirmar consulta)" style={inputStyle} />
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (opcional)" style={inputStyle} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <label style={{ fontSize: '.75rem', color: '#7a7570', flexShrink: 0 }}>Prazo:</label>
              <input type="datetime-local" value={vencimento} onChange={(e) => setVencimento(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end' }}>
              <button onClick={addTask} disabled={saving} style={btnPrimary}>{saving ? 'Criando...' : 'Criar Tarefa'}</button>
            </div>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState text="Nenhuma tarefa. Crie lembretes e acompanhamentos para este paciente." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {pendentes.length > 0 && (
            <div>
              <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#7a7570', marginBottom: '.5rem' }}>
                Pendentes ({pendentes.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                {pendentes.map((task) => {
                  const isOverdue = task.vencimento && new Date(task.vencimento) < now
                  return (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', padding: '.75rem', border: `1px solid ${isOverdue ? '#ef444430' : '#e5e5e3'}`, borderRadius: '4px', background: isOverdue ? '#fef2f2' : '#fff' }}>
                      <input type="checkbox" checked={false} onChange={() => toggleTask(task)} style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#b8965a', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '.85rem', fontWeight: 500, color: '#0f0e0c' }}>{task.titulo}</div>
                        {task.descricao && <div style={{ fontSize: '.75rem', color: '#7a7570', marginTop: '.2rem' }}>{task.descricao}</div>}
                        {task.vencimento && (
                          <div style={{ fontSize: '.68rem', color: isOverdue ? '#ef4444' : '#7a7570', marginTop: '.25rem' }}>
                            {isOverdue ? '⚠ Vencido: ' : 'Prazo: '}{new Date(task.vencimento).toLocaleString('pt-BR')}
                          </div>
                        )}
                      </div>
                      <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef444460', padding: '2px', flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {concluidas.length > 0 && (
            <div>
              <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.08em', color: '#7a7570', marginBottom: '.5rem' }}>
                Concluídas ({concluidas.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                {concluidas.map((task) => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.65rem .75rem', border: '1px solid #e5e5e3', borderRadius: '4px', background: '#fafaf9', opacity: 0.7 }}>
                    <input type="checkbox" checked={true} onChange={() => toggleTask(task)} style={{ cursor: 'pointer', accentColor: '#10b981', flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: '.82rem', fontWeight: 500, color: '#7a7570', textDecoration: 'line-through' }}>{task.titulo}</div>
                    <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef444460', padding: '2px', flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return <p style={{ fontSize: '.82rem', color: '#7a7570', textAlign: 'center', padding: '2.5rem', margin: 0 }}>{text}</p>
}

const btnPrimary: React.CSSProperties = {
  padding: '.45rem 1rem', border: 'none', borderRadius: '2px',
  background: '#b8965a', color: '#0f0e0c', fontSize: '.75rem', fontWeight: 500, cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  padding: '.45rem 1rem', border: '1px solid #e5e5e3', borderRadius: '2px',
  background: 'transparent', color: '#7a7570', fontSize: '.75rem', cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e5e5e3', borderRadius: '2px',
  padding: '.5rem .65rem', fontSize: '.82rem', outline: 'none',
  fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box', background: '#fff',
}

const textareaStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #b8965a', borderRadius: '2px',
  padding: '.6rem', fontSize: '.82rem', resize: 'vertical',
  fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box', background: '#fff',
}
