# Dra. Cynthia — Site + Sistema Operacional

Aplicação completa em **Next.js 14** para a Dra. Cynthia: site público premium, painel administrativo, CRM de pacientes, financeiro, WhatsApp Business, agenda integrada com Google Calendar, blog e automações.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14.2 (App Router) + TypeScript |
| Banco de dados | Supabase (PostgreSQL + Realtime + Auth + Storage) |
| Estilização | Tailwind CSS + estilos inline (design system próprio) |
| WhatsApp | Meta WhatsApp Business Cloud API |
| Agenda | Google Calendar API (Service Account) |
| E-mail | Resend |
| IA | Anthropic Claude (sugestão de respostas WhatsApp) |
| Open Finance | Pluggy API |
| Rate limiting | Upstash Redis |
| Deploy | Vercel |

---

## Módulos do sistema

### Site público (`/`)
- Home com hero, especialidades, resultados antes/depois, depoimentos, agendamento e contato
- Blog com artigos (`/blog`)
- Página de privacidade (`/privacidade`)
- Formulário de agendamento integrado com Google Calendar

### Painel administrativo (`/admin`)

| Seção | Função |
|---|---|
| **Dashboard** | Métricas de leads, funil de conversão, próximas consultas |
| **Leads** | CRM completo — kanban, tabela, perfil detalhado, histórico |
| **Prontuário** | Ficha clínica, notas de evolução, imagens, tarefas por paciente |
| **WhatsApp** | Inbox com respostas, sugestão de IA, envio de templates |
| **Agenda** | Calendário integrado com Google Calendar |
| **Financeiro** | Lançamentos, contratos parcelados, resumo mensal, Open Finance |
| **Analytics** | Métricas de redes sociais (Instagram, TikTok, LinkedIn, etc.) |
| **Blog** | Criação e edição de artigos com upload de capa |
| **Conteúdo** | Gestão de casos antes/depois e depoimentos |
| **Automações** | Disparo manual e monitoramento de cron jobs |
| **Configurações** | Dados do consultório, textos do site, imagens, equipe e permissões |

---

## Estrutura de pastas

```
app/
  (site)/               → Site público
  admin/                → Painel administrativo
    dashboard/
    leads/[id]/
    whatsapp/
    agenda/
    financeiro/
    analytics/
    blog/
    conteudo/
    automacoes/
    config/
  api/
    webhooks/
      whatsapp/         → Webhook Meta WA (verify + events)
      calendar/         → Push notification Google Calendar
    whatsapp/send/      → Envio de mensagens (autenticado)
    calendar/
      events/           → CRUD de consultas
      availability/     → Horários livres
    leads/              → CRUD de leads + notas, imagens, tarefas, prontuário
    booking/            → Agendamento público
    upload/             → Upload de imagens → Supabase Storage
    financial/
      entries/          → Lançamentos financeiros
      contracts/        → Contratos parcelados
      categories/       → Categorias
      summary/          → Resumo mensal
      roles/            → Permissões de usuário
    admin/
      analytics/        → Métricas de redes sociais
      search/           → Busca global
      run-cron/         → Disparo manual de automações
      leads/            → Criação de lead pelo admin
    ai/suggest-reply/   → Sugestão de resposta via Claude
    openfinance/        → Integração Pluggy (connect token + webhook)
    auth/               → Recuperação de senha
    cron/               → Jobs automáticos (Vercel Cron)
components/
  site/                 → Componentes do site público
  admin/                → Componentes do painel
lib/
  supabase/             → Clients (browser, server, admin) + types
  whatsapp.ts           → Integração Meta API + templates
  google-calendar.ts    → Integração Google Calendar
  resend.ts             → E-mails transacionais
  rate-limit.ts         → Upstash rate limiting
  schemas.ts            → Validação Zod
  sync-calendar.ts      → Sincronização Calendar → Supabase
  utils.ts              → Utilitários gerais
supabase/
  migrations/           → Schema SQL + RLS (5 arquivos)
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
2. Execute as migrations em ordem no SQL Editor:
   - `supabase/migrations/001_initial.sql`
   - `supabase/migrations/002_missing_tables.sql`
   - `supabase/migrations/003_patient_records.sql`
   - `supabase/migrations/004_contracts.sql`
   - `supabase/migrations/005_analytics_openfinance.sql`
3. Crie os buckets de storage (todos públicos para leitura):
   - `before_after`, `testimonials`, `site`, `patient_images`
4. Crie um usuário admin em **Authentication > Users**
5. Insira o papel do usuário via SQL:
   ```sql
   insert into user_roles (user_id, role) values ('<seu-user-id>', 'admin');
   ```
6. Copie `NEXT_PUBLIC_SUPABASE_URL` e as chaves para `.env.local`

> **Nota:** Todas as migrations são idempotentes — podem ser re-executadas sem erros.

### 4. WhatsApp Business API (Meta)

1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie um App → WhatsApp → Business
3. Obtenha `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_ACCESS_TOKEN`
4. Configure o webhook: `https://seu-dominio.com/api/webhooks/whatsapp`
5. Use qualquer string aleatória como `WHATSAPP_VERIFY_TOKEN`
6. Copie o App Secret para `WHATSAPP_APP_SECRET` (validação HMAC-SHA256)
7. Crie os templates aprovados no Meta Business Manager:

| Template | Uso |
|---|---|
| `boasvindas_qualificacao` | Boas-vindas com menu de opções |
| `confirmacao_consulta` | Confirmação com data, hora, endereço |
| `lembrete_24h` | Lembrete 1 dia antes da consulta |
| `follow_up_3d` | Follow-up após 3 dias sem resposta |
| `reativacao_30d` | Reativação após 30 dias inativo |

### 5. Google Calendar

1. No Google Cloud Console, crie um projeto e ative a **Google Calendar API**
2. Crie uma **Service Account** e baixe o JSON de credenciais
3. Converta para base64:
   ```bash
   base64 -i service-account.json | tr -d '\n'
   ```
4. Compartilhe o Google Calendar com o e-mail da service account (permissão de edição)
5. Defina `GOOGLE_SERVICE_ACCOUNT_JSON` (base64) e `GOOGLE_CALENDAR_ID`

### 6. Resend (e-mails)

1. Crie conta em [resend.com](https://resend.com)
2. Verifique seu domínio
3. Defina `RESEND_API_KEY`, `RESEND_FROM_EMAIL` e `ADMIN_NOTIFICATION_EMAIL`

### 7. Anthropic (sugestão de respostas IA)

1. Obtenha uma API key em [console.anthropic.com](https://console.anthropic.com)
2. Defina `ANTHROPIC_API_KEY`

### 8. Upstash Redis (rate limiting)

1. Crie conta em [upstash.com](https://upstash.com) e crie um banco Redis
2. Defina `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`

> O rate limiting falha de forma segura (fail-open) quando não configurado — não bloqueia requisições em desenvolvimento.

### 9. Pluggy (Open Finance — opcional)

1. Crie conta em [pluggy.ai](https://pluggy.ai)
2. Defina `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`
3. Configure o webhook do Pluggy: `https://seu-dominio.com/api/openfinance/webhook`

### 10. Deploy na Vercel

```bash
vercel --prod
```

Adicione todas as variáveis de ambiente no painel da Vercel. Os cron jobs são configurados automaticamente pelo `vercel.json`:

| Cron | Horário BRT | Função |
|---|---|---|
| `/api/cron/reminders` | Todo dia às 08h | Lembretes de consulta 24h antes |
| `/api/cron/followup` | Todo dia às 09h | Follow-up de leads sem resposta há 3 dias |
| `/api/cron/reativacao` | Toda segunda às 10h | Reativação de leads inativos há 30+ dias |
| `/api/cron/sync-calendar` | Todo dia às 11h | Sincronização Google Calendar → banco |
| `/api/cron/avaliacao` | Todo dia às 12h | Solicitação de avaliação 24–48h após consulta |

A Vercel envia automaticamente `Authorization: Bearer CRON_SECRET` em cada disparo.

---

## Desenvolvimento local

```bash
npm run dev
```

- Site público: http://localhost:3000
- Painel admin: http://localhost:3000/admin

---

## Segurança

- Rotas `/admin/*` protegidas por middleware + Supabase Auth (`getUser()` no servidor)
- Cron jobs protegidos por `CRON_SECRET` com comparação em tempo constante (timing-safe)
- Webhook WhatsApp validado por HMAC-SHA256 (`WHATSAPP_APP_SECRET`)
- Rate limiting nas APIs públicas via Upstash Redis
- RLS habilitado em todas as tabelas do Supabase
- Campos de PATCH filtrados por allowlist (sem mass assignment)
- Sem credenciais no código — apenas `process.env`

---

## Papéis de usuário

| Papel | Acesso |
|---|---|
| `admin` | Acesso total — financeiro, configurações, exclusão de dados, contratos |
| `secretaria` | CRM, agenda, WhatsApp — sem acesso a dados financeiros sensíveis |

Gerencie em `/admin/config` → seção **Equipe & Permissões**.

---

## LGPD

- Consentimento explícito no formulário de agendamento público
- Exclusão completa de dados via `DELETE /api/leads/[id]`
- Página de privacidade em `/privacidade`
- Dados de pacientes nunca expostos em logs

---

© 2026 Dra. Cynthia — CRO-DF
