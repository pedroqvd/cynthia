import type { Metadata } from 'next'
import { Nav } from '@/components/site/Nav'
import { Footer } from '@/components/site/Footer'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  robots: { index: false },
}

export default function PrivacidadePage() {
  return (
    <>
      <Nav />
      <main style={{ padding: '10rem 4rem 6rem', maxWidth: '720px', margin: '0 auto' }} className="max-md:!px-8">
        <div className="section-eyebrow">LGPD</div>
        <h1
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 300,
            color: '#f5f0e8',
            marginBottom: '3rem',
          }}
        >
          Política de Privacidade
        </h1>

        {[
          {
            title: '1. Quem somos',
            body: 'Este site é operado pela Dra. Cynthia, cirurgiã-dentista inscrita no CRO-DF, com consultório localizado em Brasília — Asa Sul, DF.',
          },
          {
            title: '2. Dados que coletamos',
            body: 'Coletamos apenas os dados fornecidos voluntariamente por você no formulário de contato: nome, número de WhatsApp, e-mail (opcional) e especialidade de interesse. Também podemos receber mensagens enviadas diretamente pelo WhatsApp.',
          },
          {
            title: '3. Como usamos seus dados',
            body: 'Seus dados são utilizados exclusivamente para: (a) entrar em contato para agendamento de consulta, (b) enviar confirmações e lembretes de consulta, (c) melhorar nosso atendimento.',
          },
          {
            title: '4. Compartilhamento',
            body: 'Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins comerciais. Podemos utilizar serviços de infraestrutura (Supabase, Vercel) que processam dados em conformidade com a LGPD.',
          },
          {
            title: '5. Seus direitos (LGPD)',
            body: 'Você tem direito de: acessar seus dados, corrigir informações incorretas, solicitar a exclusão dos seus dados, revogar o consentimento a qualquer momento. Para exercer esses direitos, envie e-mail ou mensagem pelo WhatsApp.',
          },
          {
            title: '6. Retenção de dados',
            body: 'Mantemos seus dados enquanto existir relação de atendimento. Após encerramento, os dados são excluídos em até 5 anos, salvo obrigação legal.',
          },
          {
            title: '7. Contato',
            body: 'Dra. Cynthia · consultório@dracynthia.com.br · WhatsApp: +55 61 9999-9999',
          },
        ].map((s) => (
          <div key={s.title} style={{ marginBottom: '2.5rem' }}>
            <h2
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '1.3rem',
                fontWeight: 400,
                color: '#f5f0e8',
                marginBottom: '.75rem',
              }}
            >
              {s.title}
            </h2>
            <p style={{ fontSize: '.9rem', color: '#7a7570', lineHeight: 1.8 }}>{s.body}</p>
          </div>
        ))}

        <p style={{ fontSize: '.75rem', color: '#7a7570', marginTop: '4rem' }}>
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </main>
      <Footer />
    </>
  )
}
