import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@dracynthia.com.br'

/** E-mail de confirmação de agendamento para o paciente */
export async function sendConfirmationEmail(params: {
  to: string
  nome: string
  procedimento: string
  dataHora: string
  endereco: string
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  return resend.emails.send({
    from: `Dra. Cynthia <${FROM}>`,
    to: params.to,
    subject: 'Consulta confirmada — Dra. Cynthia',
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0f0e0c; color: #f5f0e8; padding: 40px;">
        <h1 style="color: #b8965a; font-size: 24px; margin-bottom: 8px;">Consulta confirmada</h1>
        <p style="color: #7a7570; font-size: 14px; margin-bottom: 32px;">Dra. Cynthia — Especialista em Brasília</p>

        <p>Olá, <strong>${params.nome}</strong>!</p>
        <p>Sua consulta foi confirmada. Veja os detalhes abaixo:</p>

        <div style="border: 1px solid rgba(184,150,90,0.25); padding: 24px; margin: 24px 0; border-radius: 2px;">
          <p><strong style="color: #b8965a;">Procedimento:</strong> ${params.procedimento}</p>
          <p><strong style="color: #b8965a;">Data e hora:</strong> ${params.dataHora}</p>
          <p><strong style="color: #b8965a;">Local:</strong> ${params.endereco}</p>
        </div>

        <p>Em caso de dúvidas ou para reagendar, entre em contato pelo WhatsApp.</p>

        <p style="margin-top: 32px; color: #7a7570; font-size: 12px;">
          Dra. Cynthia · CRO-DF · Brasília, Asa Sul
        </p>
      </div>
    `,
  })
}

/** E-mail de notificação de novo lead para a secretária */
export async function sendNewLeadEmail(params: {
  nome: string
  whatsapp: string
  especialidade: string
  origem: string
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const adminEmail = process.env.RESEND_FROM_EMAIL!
  return resend.emails.send({
    from: `Sistema Cynthia <${FROM}>`,
    to: adminEmail,
    subject: `Novo lead: ${params.nome}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2>Novo lead recebido</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td><strong>Nome:</strong></td><td>${params.nome}</td></tr>
          <tr><td><strong>WhatsApp:</strong></td><td>${params.whatsapp}</td></tr>
          <tr><td><strong>Especialidade:</strong></td><td>${params.especialidade}</td></tr>
          <tr><td><strong>Origem:</strong></td><td>${params.origem}</td></tr>
        </table>
        <p><a href="${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '')}/admin/leads">Abrir painel de leads →</a></p>
      </div>
    `,
  })
}
