import type { Metadata } from 'next'
import { TriggerButton } from '@/components/admin/TriggerButton'

export const metadata: Metadata = { title: 'Automações' }
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const AUTOMACOES = [
  {
    id: 'reminders',
    nome: 'Lembretes de consulta',
    descricao: 'Envia mensagem WhatsApp 24h antes de cada consulta agendada.',
    horario: 'Todo dia às 08h BRT',
    endpoint: '/api/cron/reminders',
    cor: '#1B6B5A',
  },
  {
    id: 'followup',
    nome: 'Follow-up de leads',
    descricao: 'Mensagem automática para leads sem resposta há 3 dias.',
    horario: 'Todo dia às 09h BRT',
    endpoint: '/api/cron/followup',
    cor: '#7B1D3A',
  },
  {
    id: 'reativacao',
    nome: 'Reativação de inativos',
    descricao: 'Envia mensagem para leads sem interação há 30+ dias.',
    horario: 'Toda segunda às 10h BRT',
    endpoint: '/api/cron/reativacao',
    cor: '#C9A96E',
  },
  {
    id: 'sync-calendar',
    nome: 'Sincronização de agenda',
    descricao: 'Sincroniza eventos do Google Calendar com o banco de dados.',
    horario: 'Todo dia às 11h BRT',
    endpoint: '/api/cron/sync-calendar',
    cor: '#163D32',
  },
]

export default function AutomacoesPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '860px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#0f0e0c', marginBottom: '.5rem' }}>
        Automações
      </h1>
      <p style={{ fontSize: '.85rem', color: '#7a7570', marginBottom: '2.5rem' }}>
        Tarefas agendadas que rodam automaticamente. Você também pode executá-las manualmente.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {AUTOMACOES.map((a) => (
          <div
            key={a.id}
            style={{
              background: '#fff',
              border: '1px solid #e5e5e3',
              borderRadius: '6px',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <div
              style={{
                width: '4px',
                height: '60px',
                background: a.cor,
                borderRadius: '4px',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: '.9rem', color: '#0f0e0c', marginBottom: '.25rem' }}>
                {a.nome}
              </div>
              <div style={{ fontSize: '.82rem', color: '#7a7570', lineHeight: 1.5 }}>{a.descricao}</div>
              <div
                style={{
                  marginTop: '.5rem',
                  fontSize: '.7rem',
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: a.cor,
                }}
              >
                {a.horario}
              </div>
            </div>
            <TriggerButton endpoint={a.endpoint} />
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: '3rem',
          padding: '1.5rem',
          background: '#f5f4f2',
          borderRadius: '4px',
          border: '1px solid #e5e5e3',
        }}
      >
        <h2 style={{ fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#7a7570', marginBottom: '1rem' }}>
          Como funcionam
        </h2>
        <ul style={{ fontSize: '.83rem', color: '#555', lineHeight: 1.8, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <li>• As automações rodam automaticamente pelo Vercel Cron no horário configurado.</li>
          <li>• O botão &quot;Executar agora&quot; dispara a automação imediatamente, fora do horário normal.</li>
          <li>• Mensagens WhatsApp só são enviadas se a API estiver configurada em Configurações.</li>
          <li>• A sincronização do Google Calendar requer as credenciais configuradas.</li>
        </ul>
      </div>
    </div>
  )
}
