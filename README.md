# Dra. Cynthia — Site + Sistema Operacional

Aplicação completa em **Next.js 14** para a Dra. Cynthia: site público premium, painel administrativo, integração WhatsApp Business, agenda integrada com Google Calendar e CRM de pacientes.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Banco de dados | Supabase (PostgreSQL + Realtime + Auth + Storage) |
| Estilização | Tailwind CSS |
| WhatsApp | Meta WhatsApp Business Cloud API (direto) |
| Agenda | Google Calendar API (Service Account) |
| E-mail | Resend |
| Rate limiting | Upstash Redis |
| Deploy | Vercel |

---

## Estrutura de pastas

```
app/
  (site)/           → Site público (home, privacidade)
  admin/            → Painel administrativo
    login/
    dashboard/
    agenda/
    leads/
    whatsapp/
    conteudo/
    config/
  api/
    webhooks/
      whatsapp/     → Webhook Meta WA (GET verify + POST events)
      calendar/     → Push notification Google Calendar
    whatsapp/send/  → Envio de mensagens (autenticado)
    calendar/
      events/       → CRUD de consultas
      availability/ → Horários livres
    leads/          → CRUD de leads
    upload/         → Upload imagens → Supabase Storage
    cron/           → Jobs automáticos (Vercel Cron)
components/
  site/             → Componentes do site público
  admin/            → Componentes do painel
lib/
  supabase/         → Clients (browser, server, admin)
  whatsapp.ts       → Integração Meta API
  google-calendar.ts → Integração Google Calendar
  resend.ts         → E-mails transacionais
  rate-limit.ts     → Upstash rate limiting
  schemas.ts        → Validação Zod
supabase/
  migrations/       → Schema SQL + RLS
```

---

## Configuração — passo a passo

### 1. Clone e instale

```bash
git clone https://github.com/pedroqvd/cynthia
cd cynthia
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.local.example .env.local
# Preencha todas as variáveis
```

### 3. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Execute o SQL em `supabase/migrations/001_initial.sql` no SQL Editor
3. Crie os buckets de storage: `before_after`, `testimonials`, `site` (todos públicos para leitura)
4. Crie um usuário admin em Authentication > Users
5. Copie `NEXT_PUBLIC_SUPABASE_URL` e as chaves para `.env.local`

### 4. WhatsApp Business API (Meta)

1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie um App > WhatsApp > Business
3. Obtenha `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_ACCESS_TOKEN`
4. Configure o webhook apontando para `https://seu-dominio.com/api/webhooks/whatsapp`
5. Use qualquer string aleatória como `WHATSAPP_VERIFY_TOKEN`
6. Crie os templates aprovados no Meta Business Manager (ver lista abaixo)

**Templates necessários:**
- `boasvindas_qualificacao` — boas-vindas com menu de opções
- `confirmacao_consulta` — confirmação com data, hora, endereço
- `lembrete_24h` — lembrete 1 dia antes
- `follow_up_3d` — follow-up após 3 dias
- `reativacao_30d` — reativação após 30 dias

### 5. Google Calendar

1. No Google Cloud Console, crie um projeto
2. Ative a Google Calendar API
3. Crie uma Service Account e baixe o JSON de credenciais
4. Converta para base64: `base64 -i service-account.json | tr -d '\n'`
5. Compartilhe o Google Calendar da Dra. Cynthia com o e-mail da service account
6. Defina `GOOGLE_SERVICE_ACCOUNT_JSON` (base64) e `GOOGLE_CALENDAR_ID`

### 6. Resend (e-mails)

1. Crie conta em [resend.com](https://resend.com)
2. Verifique seu domínio
3. Gere API key e defina `RESEND_API_KEY` e `RESEND_FROM_EMAIL`

### 7. Upstash Redis (rate limiting)

1. Crie conta em [upstash.com](https://upstash.com)
2. Crie um banco Redis
3. Defina `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`

### 8. Deploy na Vercel

```bash
vercel --prod
```

Adicione todas as variáveis de ambiente no painel da Vercel.

Os cron jobs estão configurados em `vercel.json` (horários em UTC):
- `0 11 * * *` → Lembretes 24h (08h BRT)
- `0 12 * * *` → Follow-up 3 dias (09h BRT)
- `0 13 * * 1` → Reativação 30 dias (10h BRT, toda segunda)
- `*/15 * * * *` → Sync Google Calendar (a cada 15 min)

Para autenticar os crons, a Vercel envia automaticamente o header `Authorization: Bearer CRON_SECRET`.

---

## Desenvolvimento local

```bash
npm run dev
```

Acesse:
- Site público: http://localhost:3000
- Painel admin: http://localhost:3000/admin

---

## Segurança

- Rotas `/admin/*` protegidas por middleware + Supabase Auth
- Crons protegidos por `CRON_SECRET`
- Webhook WhatsApp validado por HMAC-SHA256
- Rate limiting nas APIs públicas (Upstash)
- RLS habilitado em todas as tabelas Supabase
- Sem credenciais no código — apenas `process.env`

---

## LGPD

- Consentimento explícito no formulário de agendamento
- Exclusão de dados via `DELETE /api/leads/[id]`
- Página de privacidade em `/privacidade`
- Dados de pacientes nunca expostos em logs

---

(c) 2026 Dra. Cynthia - CRO-DF
