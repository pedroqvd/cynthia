import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { WhatsAppInbox } from '@/components/admin/WhatsAppInbox'

export const metadata: Metadata = { title: 'WhatsApp' }
export const dynamic = 'force-dynamic'

async function getConversations() {
  const supabase = createClient()

  // Busca leads com mensagens, ordenados pela última mensagem
  const { data } = await supabase
    .from('leads')
    .select(`
      id, nome, whatsapp, status, especialidade,
      messages(id, content, direction, created_at, status)
    `)
    .order('last_seen', { ascending: false, nullsFirst: false })
    .limit(50)

  return data ?? []
}

export default async function WhatsAppPage() {
  const conversations = await getConversations()

  return <WhatsAppInbox conversations={conversations} />
}
