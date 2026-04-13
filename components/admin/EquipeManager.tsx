'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface TeamUser {
  id: string
  email: string
  nome: string
  role: 'admin' | 'secretaria'
  last_sign_in: string | null
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  secretaria: 'Secretária',
}

export function EquipeManager() {
  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/financial/roles')
      if (!res.ok) throw new Error('Sem permissão')
      const json = await res.json()
      setUsers(json.data ?? json)
    } catch {
      toast.error('Não foi possível carregar a equipe. Apenas admins têm acesso.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleRoleChange(userId: string, newRole: string, nome: string) {
    setSaving(userId)
    try {
      const res = await fetch('/api/financial/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: newRole, nome }),
      })
      if (!res.ok) throw new Error()
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole as 'admin' | 'secretaria' } : u))
      toast.success('Permissão atualizada.')
    } catch {
      toast.error('Erro ao atualizar permissão.')
    } finally {
      setSaving(null)
    }
  }

  async function handleNomeChange(userId: string, nome: string) {
    const user = users.find((u) => u.id === userId)
    if (!user) return
    setSaving(userId)
    try {
      const res = await fetch('/api/financial/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: user.role, nome }),
      })
      if (!res.ok) throw new Error()
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, nome } : u))
      toast.success('Nome atualizado.')
    } catch {
      toast.error('Erro ao atualizar nome.')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2].map((i) => (
          <div key={i} style={{ height: '60px', background: '#f5f4f2', borderRadius: '4px', animation: 'shimmer 1.4s infinite' }} />
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return <p style={{ fontSize: '.82rem', color: '#7a7570' }}>Nenhum usuário encontrado ou sem permissão de admin.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {users.map((u) => (
        <div
          key={u.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            gap: '12px',
            alignItems: 'center',
            padding: '12px 16px',
            background: '#faf9f7',
            border: '1px solid #e5e5e3',
            borderRadius: '4px',
          }}
        >
          <div>
            <input
              defaultValue={u.nome || u.email}
              onBlur={(e) => {
                const newNome = e.target.value.trim()
                if (newNome && newNome !== u.nome) handleNomeChange(u.id, newNome)
              }}
              style={{ ...inputStyle, marginBottom: '4px' }}
              placeholder="Nome do usuário"
            />
            <div style={{ fontSize: '.7rem', color: '#7a7570' }}>{u.email}</div>
          </div>

          <select
            value={u.role}
            onChange={(e) => handleRoleChange(u.id, e.target.value, u.nome)}
            disabled={saving === u.id}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {Object.entries(ROLE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <div style={{ fontSize: '.7rem', color: '#b8b4af', whiteSpace: 'nowrap' }}>
            {u.last_sign_in
              ? `último acesso ${new Date(u.last_sign_in).toLocaleDateString('pt-BR')}`
              : 'nunca acessou'}
          </div>
        </div>
      ))}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #e5e5e3',
  borderRadius: '2px',
  padding: '.5rem .75rem',
  fontSize: '.82rem',
  outline: 'none',
  fontFamily: 'DM Sans, sans-serif',
  background: '#fff',
}
