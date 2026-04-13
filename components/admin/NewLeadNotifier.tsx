'use client'

/**
 * NewLeadNotifier
 * Ouve novos leads via Supabase Realtime e dispara notificação sonora + toast.
 * Solicita permissão de notificação do browser na primeira atividade do usuário.
 */
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch {
    // AudioContext bloqueado — ignora silenciosamente
  }
}

export function NewLeadNotifier() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Solicita permissão para notificações do browser
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const supabase = createClient()

    const channel = supabase
      .channel('new-leads-notifier')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload) => {
          const lead = payload.new as { nome?: string; especialidade?: string }

          playBeep()

          toast.success(`Novo lead: ${lead.nome ?? 'Paciente'}`, {
            description: lead.especialidade ? `Especialidade: ${lead.especialidade}` : 'Sem especialidade informada',
            duration: 6000,
            action: {
              label: 'Ver leads',
              onClick: () => { window.location.href = '/admin/leads' },
            },
          })

          // Notificação nativa do browser (quando aba não está em foco)
          if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
            new Notification('Novo lead!', {
              body: `${lead.nome ?? 'Paciente'} entrou em contato.`,
              icon: '/images/favicon.ico.png',
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return null
}
