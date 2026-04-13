'use client'

/**
 * AdminTitleBadge
 * Atualiza o título da aba com o número de leads novos.
 * Ex: "(3) Painel — Dra. Cynthia"
 */
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AdminTitleBadge() {
  const countRef = useRef(0)

  async function updateTitle() {
    try {
      const supabase = createClient()
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'novo')

      countRef.current = count ?? 0
      const base = document.title.replace(/^\(\d+\)\s*/, '')
      document.title = count && count > 0 ? `(${count}) ${base}` : base
    } catch {
      // ignora silenciosamente
    }
  }

  useEffect(() => {
    updateTitle()

    // Escuta inserções de novos leads para atualizar em tempo real
    const supabase = createClient()
    const channel = supabase
      .channel('title-badge-leads')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, updateTitle)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, updateTitle)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
