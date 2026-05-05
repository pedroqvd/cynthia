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

const FICHA_FIELDS: { key: keyof PatientRecord; label: string; placeholder: string; icon: string }[] = [
  { key: 'queixa_principal',       label: 'Queixa Principal',       placeholder: 'Motivo inicial da consulta...', icon: '💬' },
  { key: 'alergias',               label: 'Alergias',               placeholder: 'Ex: Penicilina, látex...', icon: '⚠️' },
  { key: 'medicamentos',           label: 'Medicamentos em Uso',    placeholder: 'Ex: Losartana 50mg, 1x ao dia...', icon: '💊' },
  { key: 'doencas_sistemicas',     label: 'Doenças Sistêmicas',     placeholder: 'Ex: Diabetes tipo 2, hipertensão...', icon: '🫀' },
  { key: 'historico_odontologico', label: 'Histórico Odontológico', placeholder: 'Tratamentos anteriores relevantes...', icon: '🦷' },
  { key: 'plano_tratamento',       label: 'Plano de Tratamento',    placeholder: 'Plano definido pela Dra. Cynthia...', icon: '📋' },
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
    { id: 'evolucao', label: 'Evolução' },
    { id: 'imagens',  label: 'Imagens' },
    { id: 'tarefas',  label: 'Tarefas' },
  ] as const

  return (
    <div>
      <div style={{ display: 'flex', gap: '.25rem', borderBottom: '1px solid #ebebea', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              padding: '.55rem .9rem', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: '.78rem', fontWeight: subTab === t.id ? 600 : 400, whiteSpace: 'nowrap',
              color: subTab === t.id ? '#0f0e0c' : '#7a7570',
              borderBottom: subTab === t.id ? '2px solid #0f0e0c' : '2px solid transparent',
              marginBottom: '-1px', transition: 'color .15s',
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

  if (loading) return <EmptyState icon="⏳" text="Carregando ficha clínica..." />

  const hasAnyContent = FICHA_FIELDS.some(({ key }) => record?.[key])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {record?.updated_at && (
        <p style={{ fontSize: '.68rem', color: '#b8b4af', textAlign: 'right', margin: 0 }}>
          Última atualização: {new Date(record.updated_at).toLocaleString('pt-BR')}
        </p>
      )}

      {!hasAnyContent && !editingField && (
        <div style={{ background: '#fff', border: '1px dashed #ebebea', borderRadius: '8px', padding: '2rem', textAlign: 'center', marginBottom: '.5rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>🦷</div>
          <div style={{ fontSize: '.85rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '.25rem' }}>Ficha clínica vazia</div>
          <div style={{ fontSize: '.78rem', color: '#7a7570' }}>Clique em qualquer campo abaixo para preencher</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
        {FICHA_FIELDS.map(({ key, label, placeholder, icon }) => {
          const isEditing = editingField === key
          const value = record?.[key] as string | null
          const hasValue = Boolean(value)

          return (
            <div
              key={key}
              style={{
                background: '#fff',
                border: `1px solid ${isEditing ? '#0f0e0c' : '#ebebea'}`,
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '.6rem',
                gridColumn: key === 'plano_tratamento' ? '1 / -1' : undefined,
                transition: 'border-color .15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <span style={{ fontSize: '.9rem' }}>{icon}</span>
                  <span style={{ fontSize: '.68rem', fontWeight: 600, color: '#b8b4af', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                    {label}
                  </span>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => { setEditingField(key); setFieldValue(value ?? '') }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '.72rem', color: '#7a7570', padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {hasValue ? 'Editar' : '+ Adicionar'}
                  </button>
                )}
              </div>

              {isEditing ? (
                <>
                  <textarea
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    rows={key === 'plano_tratamento' ? 4 : 3}
                    placeholder={placeholder}
                    autoFocus
                    style={textareaStyle}
                  />
                  <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditingField(null)} style={btnSecondary}>Cancelar</button>
                    <button onClick={() => saveField(key, fieldValue)} disabled={saving} style={btnPrimary}>
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </>
              ) : hasValue ? (
                <p style={{ fontSize: '.82rem', color: '#0f0e0c', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>{value}</p>
              ) : (
                <p style={{ fontSize: '.78rem', color: '#c5c2be', fontStyle: 'italic', margin: 0 }}>Não informado</p>
              )}
            </div>
          )
        })}
      </div>
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
      if (expanded === id) setExpanded(null)
      toast.success('Nota excluída.')
    }
  }

  if (loading) return <EmptyState icon="⏳" text="Carregando notas clínicas..." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '.78rem', color: '#7a7570' }}>
          {notes.length > 0 ? `${notes.length} nota${notes.length !== 1 ? 's' : ''}` : 'Nenhuma nota'}
        </span>
        <button
          onClick={() => setShowForm(!showForm)}
          style={showForm ? btnSecondary : btnPrimary}
        >
          {showForm ? 'Cancelar' : '+ Nova nota'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #ebebea', borderRadius: '8px', padding: '1.25rem' }}>
          <div style={{ fontSize: '.68rem', fontWeight: 600, color: '#b8b4af', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.85rem' }}>
            Nova nota clínica
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título (ex: Avaliação inicial, Sessão 2...)"
              style={inputStyle}
            />
            {appointments.length > 0 && (
              <select value={apptId} onChange={(e) => setApptId(e.target.value)} style={inputStyle}>
                <option value="">Sem consulta vinculada</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>{a.procedimento}</option>
                ))}
              </select>
            )}
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Descreva a evolução clínica, observações do atendimento..."
              rows={5}
              style={textareaStyle}
            />
            <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end' }}>
              <button onClick={addNote} disabled={saving} style={btnPrimary}>
                {saving ? 'Salvando...' : 'Salvar nota'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <EmptyState icon="📝" text="Nenhuma nota de evolução ainda. Registre o progresso clínico após cada atendimento." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          {notes.map((note) => (
            <div key={note.id} style={{ border: '1px solid #ebebea', borderRadius: '8px', background: '#fff', overflow: 'hidden' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.1rem', cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === note.id ? null : note.id)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem', minWidth: 0 }}>
                  <div style={{ fontSize: '.85rem', fontWeight: 500, color: '#0f0e0c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {note.titulo}
                  </div>
                  <div style={{ fontSize: '.68rem', color: '#b8b4af' }}>
                    {new Date(note.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0, marginLeft: '.75rem' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef444460', padding: '4px', borderRadius: '4px', lineHeight: 1 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                  <svg
                    width="13" height="13" viewBox="0 0 12 12" fill="none"
                    style={{ transform: expanded === note.id ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: '#b8b4af', flexShrink: 0 }}
                  >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              {expanded === note.id && (
                <div style={{ padding: '.75rem 1.1rem 1.1rem', borderTop: '1px solid #f5f4f2' }}>
                  <p style={{ fontSize: '.82rem', color: '#0f0e0c', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0 }}>{note.conteudo}</p>
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

  if (loading) return <EmptyState icon="⏳" text="Carregando imagens..." />

  const TIPOS = Object.entries(TIPO_LABELS)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '.78rem', color: '#7a7570' }}>
          {images.length > 0 ? `${images.length} imagem${images.length !== 1 ? 's' : ''}` : 'Nenhuma imagem'}
        </span>
        <button onClick={() => setShowForm(!showForm)} style={showForm ? btnSecondary : btnPrimary}>
          {showForm ? 'Cancelar' : '+ Adicionar imagem'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #ebebea', borderRadius: '8px', padding: '1.25rem' }}>
          <div style={{ fontSize: '.68rem', fontWeight: 600, color: '#b8b4af', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.85rem' }}>
            Nova imagem
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome (ex: Rx panorâmica antes do tratamento)" style={inputStyle} />
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
              {TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <label
              style={{
                border: '2px dashed #ebebea', borderRadius: '8px', padding: '1.5rem',
                textAlign: 'center', cursor: 'pointer', background: file ? '#f7f6f4' : '#fff',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b8b4af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {file ? (
                <div>
                  <div style={{ fontSize: '.82rem', fontWeight: 500, color: '#0f0e0c' }}>{file.name}</div>
                  <div style={{ fontSize: '.72rem', color: '#7a7570' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '.82rem', color: '#7a7570' }}>Clique para selecionar</div>
                  <div style={{ fontSize: '.72rem', color: '#b8b4af' }}>JPEG, PNG ou WEBP</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
            </label>
            <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end' }}>
              <button onClick={upload} disabled={uploading || !file} style={{ ...btnPrimary, opacity: (!file || uploading) ? 0.6 : 1 }}>
                {uploading ? 'Enviando...' : 'Enviar imagem'}
              </button>
            </div>
          </div>
        </div>
      )}

      {images.length === 0 ? (
        <EmptyState icon="🖼️" text="Nenhuma imagem. Adicione radiografias, fotos intraorais e documentos do paciente." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '.75rem' }}>
          {images.map((img) => {
            const color = TIPO_COLORS[img.tipo] ?? '#7a7570'
            return (
              <div key={img.id} style={{ border: '1px solid #ebebea', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                <div
                  onClick={() => setPreview(img)}
                  style={{ cursor: 'zoom-in', background: '#f7f6f4', height: '120px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '.6rem .7rem' }}>
                  <div style={{ fontSize: '.75rem', fontWeight: 500, color: '#0f0e0c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '.3rem' }} title={img.nome}>
                    {img.nome}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.62rem', padding: '.15rem .4rem', borderRadius: '4px', background: `${color}18`, color, fontWeight: 500 }}>
                      {TIPO_LABELS[img.tipo]}
                    </span>
                    <button
                      onClick={() => deleteImage(img)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef444460', padding: '2px', borderRadius: '4px', lineHeight: 1 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {preview && (
        <div
          onClick={() => setPreview(null)}
          className="modal-safe"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          <div style={{ position: 'absolute', top: 'max(1.5rem, env(safe-area-inset-top))', right: 'max(1rem, env(safe-area-inset-right))', display: 'flex', gap: '.75rem' }}>
            <button
              onClick={(e) => { e.stopPropagation(); deleteImage(preview) }}
              style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '.4rem .9rem', cursor: 'pointer', fontSize: '.78rem' }}
            >
              Excluir
            </button>
            <button
              onClick={() => setPreview(null)}
              style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: '6px', padding: '.4rem .9rem', cursor: 'pointer', fontSize: '.78rem' }}
            >
              Fechar
            </button>
          </div>
          <div style={{ maxWidth: 'min(90vw, 800px)', maxHeight: '75vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.url} alt={preview.nome} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '6px' }} onClick={(e) => e.stopPropagation()} />
            <div style={{ color: '#fff', textAlign: 'center' }}>
              <div style={{ fontWeight: 500, fontSize: '.95rem' }}>{preview.nome}</div>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)', marginTop: '.25rem' }}>
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

  if (loading) return <EmptyState icon="⏳" text="Carregando tarefas..." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          {pendentes.length > 0 && (
            <span style={{ fontSize: '.72rem', background: '#fef3c7', color: '#92400e', padding: '.15rem .55rem', borderRadius: '20px', fontWeight: 500 }}>
              {pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''}
            </span>
          )}
          {concluidas.length > 0 && (
            <span style={{ fontSize: '.72rem', background: '#d1fae5', color: '#065f46', padding: '.15rem .55rem', borderRadius: '20px', fontWeight: 500 }}>
              {concluidas.length} concluída{concluidas.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)} style={showForm ? btnSecondary : btnPrimary}>
          {showForm ? 'Cancelar' : '+ Nova tarefa'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #ebebea', borderRadius: '8px', padding: '1.25rem' }}>
          <div style={{ fontSize: '.68rem', fontWeight: 600, color: '#b8b4af', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.85rem' }}>
            Nova tarefa
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Tarefa (ex: Ligar para confirmar consulta)" style={inputStyle} />
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (opcional)" style={inputStyle} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <label style={{ fontSize: '.75rem', color: '#7a7570', flexShrink: 0, fontWeight: 500 }}>Prazo</label>
              <input type="datetime-local" value={vencimento} onChange={(e) => setVencimento(e.target.value)} style={{ ...inputStyle }} />
            </div>
            <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end' }}>
              <button onClick={addTask} disabled={saving} style={btnPrimary}>{saving ? 'Criando...' : 'Criar tarefa'}</button>
            </div>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState icon="✅" text="Nenhuma tarefa. Crie lembretes e acompanhamentos para este paciente." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {pendentes.length > 0 && (
            <div>
              <div style={{ fontSize: '.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#b8b4af', marginBottom: '.6rem' }}>
                Pendentes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                {pendentes.map((task) => {
                  const isOverdue = task.vencimento && new Date(task.vencimento) < now
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '.75rem', padding: '.85rem 1rem',
                        border: `1px solid ${isOverdue ? '#fca5a520' : '#ebebea'}`,
                        borderLeft: `3px solid ${isOverdue ? '#ef4444' : '#e5e5e3'}`,
                        borderRadius: '8px',
                        background: isOverdue ? '#fff9f9' : '#fff',
                      }}
                    >
                      <div style={{ paddingTop: '2px' }}>
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => toggleTask(task)}
                          style={{ cursor: 'pointer', accentColor: '#10b981', width: '15px', height: '15px', flexShrink: 0 }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '.85rem', fontWeight: 500, color: '#0f0e0c' }}>{task.titulo}</div>
                        {task.descricao && (
                          <div style={{ fontSize: '.75rem', color: '#7a7570', marginTop: '.2rem' }}>{task.descricao}</div>
                        )}
                        {task.vencimento && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', marginTop: '.3rem' }}>
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke={isOverdue ? '#ef4444' : '#b8b4af'} strokeWidth="1.5" strokeLinecap="round">
                              <circle cx="8" cy="8" r="7" /><path d="M8 4v4l3 2" />
                            </svg>
                            <span style={{ fontSize: '.68rem', color: isOverdue ? '#ef4444' : '#7a7570', fontWeight: isOverdue ? 500 : 400 }}>
                              {isOverdue ? 'Vencido: ' : 'Prazo: '}{new Date(task.vencimento).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef444460', padding: '4px', borderRadius: '4px', flexShrink: 0, lineHeight: 1 }}
                      >
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
              <div style={{ fontSize: '.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#b8b4af', marginBottom: '.6rem' }}>
                Concluídas
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                {concluidas.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.75rem 1rem',
                      border: '1px solid #ebebea', borderLeft: '3px solid #10b98140',
                      borderRadius: '8px', background: '#f9fdf9', opacity: 0.75,
                    }}
                  >
                    <input type="checkbox" checked={true} onChange={() => toggleTask(task)} style={{ cursor: 'pointer', accentColor: '#10b981', width: '15px', height: '15px', flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: '.82rem', fontWeight: 500, color: '#7a7570', textDecoration: 'line-through' }}>{task.titulo}</div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef444460', padding: '4px', borderRadius: '4px', flexShrink: 0, lineHeight: 1 }}
                    >
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

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.6rem', padding: '3rem 1.5rem', textAlign: 'center' }}>
      <span style={{ fontSize: '1.75rem' }}>{icon}</span>
      <p style={{ fontSize: '.82rem', color: '#7a7570', margin: 0, maxWidth: '280px', lineHeight: 1.6 }}>{text}</p>
    </div>
  )
}

const btnPrimary: React.CSSProperties = {
  padding: '.5rem 1rem', border: 'none', borderRadius: '6px',
  background: '#0f0e0c', color: '#f5f0e8', fontSize: '.78rem', fontWeight: 500, cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  padding: '.5rem 1rem', border: '1px solid #ebebea', borderRadius: '6px',
  background: '#fff', color: '#7a7570', fontSize: '.78rem', cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #ebebea', borderRadius: '6px',
  padding: '.55rem .75rem', fontSize: '.82rem', outline: 'none',
  fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box', background: '#fff', color: '#0f0e0c',
}

const textareaStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #ebebea', borderRadius: '6px',
  padding: '.65rem .75rem', fontSize: '.82rem', resize: 'vertical',
  fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#0f0e0c',
}
