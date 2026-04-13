# AI Context / Developer Handover — Dra. Cynthia

Atualizado em: **Abril 2026**. Leia tudo antes de tocar em qualquer arquivo.

---

## Visão Geral

App Next.js 14 (App Router) para clínica odontológica em Brasília-DF. Duas áreas:

- **Site público** (`/`) — captação de leads, agendamento online, blog
- **Painel admin** (`/admin/*`) — CRM, agenda, WhatsApp inbox, dashboard analítico

**Stack:** Next.js 14 · TypeScript · Supabase (auth + DB + Realtime) · Tailwind CSS (site público) · Inline Styles (admin) · Vercel (deploy + Cron Jobs)

---

## Brand Guidelines

- Fundo escuro: `#0f0e0c`
- Ouro/Dourado: `#b8965a`
- Texto cinza: `#7a7570`
- Fundo claro: `#fafaf9`
- Fonte principal: DM Sans
- Fonte serif: Cormorant Garamond

---

## Arquitetura de Autenticação (REAL — não alterar sem ler isto)

```
Browser → createBrowserClient().signInWithPassword(email, password)
        ↓ Supabase escreve cookies de sessão no browser (client-side)
window.location.href = redirect   ← hard redirect (não router.push)
        ↓ Browser envia os cookies na nova requisição
middleware.ts → createServerClient → getSession()
        ↓ Valida JWT localmente via assinatura (SEM chamada de rede)
Autorizado: NextResponse.next() | Não autorizado: redirect('/admin/login')
```

### Regras críticas:
- **`getSession()` no middleware** — valida JWT localmente, sem rede. Nunca usar `getUser()` no middleware (faz chamada de rede ao Supabase e pode falhar no Edge Runtime).
- **`window.location.href`** no login, não `router.push()` — garante que o browser envia os cookies recém-criados na próxima requisição.
- **`getUser()`** pode e deve ser usado dentro de Server Components e Route Handlers (fora do Edge Runtime).
- **Cookies sem `httpOnly`** — o browser client precisa lê-los para signOut e reset-password.

### Arquivos de auth:
- `app/admin/login/page.tsx` — formulário cliente, chama `createBrowserClient().signInWithPassword()` diretamente
- `app/admin/reset-password/page.tsx` — redefinição de senha pós-link
- `app/api/auth/forgot-password/route.ts` — dispara e-mail de reset via Supabase
- `middleware.ts` — guarda todas as rotas `/admin/*` (exceto `/admin/login` e `/admin/reset-password`) e `/api/cron/*`

---

## Schema do Banco de Dados (Supabase)

### Tabelas:
| Tabela | Colunas principais |
|---|---|
| `leads` | id, nome, whatsapp, email, especialidade, status, urgencia, origem, ticket_estimado, observacoes, created_at, updated_at, last_seen |
| `appointments` | id, lead_id, procedimento, data_hora, duracao_min, status, google_event_id, **avaliacao_enviada**, notas, created_at |
| `messages` | id, lead_id, direction (in\|out), content, type, status, whatsapp_message_id, created_at |
| `posts` | id, slug, title, excerpt, content, cover_image, published, created_at, updated_at |
| `before_after` | id, procedimento, descricao, foto_antes_url, foto_depois_url, ativo, ordem |
| `testimonials` | id, nome, cargo, texto, foto_url, nota, ativo, ordem |
| `activity_log` | id, lead_id, user_id, acao, detalhes, created_at |
| `site_config` | key, value, updated_at |

### Enums de status:
- **leads.status**: `novo` | `em_contato` | `agendado` | `proposta` | `fechado`
- **leads.urgencia**: `alta` | `media` | `baixa`
- **appointments.status**: `agendado` | `confirmado` | `realizado` | `cancelado`
- **messages.direction**: `in` | `out`

### ⚠️ Migração OBRIGATÓRIA (ainda pendente):
```sql
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS avaliacao_enviada BOOLEAN DEFAULT false;
```
Sem esta coluna o cron `/api/cron/avaliacao` falha com erro de coluna inexistente.

---

## Variáveis de Ambiente

| Variável | Status | Onde obter |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Configurada | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Configurada | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Configurada | Supabase → Project Settings → API |
| `RESEND_API_KEY` | ✅ Configurada | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | ⚠️ **Pendente** | Ex: `noreply@dracynthia.com.br` (domínio verificado no Resend) |
| `ANTHROPIC_API_KEY` | ⚠️ **Pendente** | console.anthropic.com → API Keys |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | ⚠️ **Pendente** | GCP Console → Service Accounts → JSON em base64 |
| `GOOGLE_CALENDAR_ID` | ⚠️ **Pendente** | Google Calendar → Configurações → ID do calendário |
| `GOOGLE_REVIEWS_URL` | ⚠️ **Pendente** | Google Business Profile → link de avaliação |
| `WHATSAPP_ACCESS_TOKEN` | ⚠️ **Pendente** | Meta Business Suite → WhatsApp → Access Token |
| `WHATSAPP_PHONE_NUMBER_ID` | ⚠️ **Pendente** | Meta Business Suite → WhatsApp → Phone Number ID |
| `WHATSAPP_APP_SECRET` | ⚠️ **Pendente** | Meta Business Suite → App → App Secret |
| `WHATSAPP_VERIFY_TOKEN` | ⚠️ **Pendente** | Gerar string aleatória e registrar no webhook Meta |
| `UPSTASH_REDIS_REST_URL` | ⚠️ **Pendente** | upstash.com → Database Redis → REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | ⚠️ **Pendente** | upstash.com → Database Redis → REST Token |
| `CRON_SECRET` | ⚠️ **Pendente** | Gerar string aleatória (protege endpoints `/api/cron/*`) |

---

## O Que Ainda Precisa Ser Feito

### 🔴 Crítico (funcionalidade quebrada sem isso):

1. **Migração SQL** no Supabase SQL Editor:
   ```sql
   ALTER TABLE appointments ADD COLUMN IF NOT EXISTS avaliacao_enviada BOOLEAN DEFAULT false;
   ```

2. **Domínio na Vercel:** configurar `dracynthia.com.br` (DNS CNAME/A records apontando para Vercel)

3. **Supabase Auth URLs:** em Authentication → URL Configuration:
   - Site URL: `https://dracynthia.com.br`
   - Redirect URLs: `https://dracynthia.com.br/auth/callback`

### 🟡 Importante (funcionalidades inativas sem isso):

4. **`RESEND_FROM_EMAIL`** — verificar domínio `dracynthia.com.br` no painel do Resend antes de configurar

5. **`ANTHROPIC_API_KEY`** — habilita sugestão de resposta com IA no WhatsApp inbox (botão ✦)

6. **Google Calendar** — configurar `GOOGLE_SERVICE_ACCOUNT_JSON` (JSON em base64) e `GOOGLE_CALENDAR_ID`; compartilhar o calendário com o e-mail da service account

7. **WhatsApp Business API** — configurar as 4 vars do Meta; registrar webhook em:
   `https://dracynthia.com.br/api/webhooks/whatsapp`

8. **`GOOGLE_REVIEWS_URL`** — link de avaliação do Google Business Profile (`https://g.page/r/[ID]/review`)

9. **Upstash Redis** — `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`; sem isso `/api/booking` falha no rate limiting (o código tem fallback gracioso, mas não é ideal)

10. **`CRON_SECRET`** — sem ele os endpoints de cron ficam sem proteção

### 🟢 Conteúdo e configuração:

11. **Preencher `/admin/config`** — nome do consultório, CRO, endereço, WhatsApp, horários, headline do Hero, textos

12. **Fotos reais** — substituir placeholders no Hero, Sobre e Resultados

13. **Depoimentos e antes/depois** — criar registros em `/admin/conteudo`

---

## Features Implementadas

### Admin
| Feature | Arquivo principal |
|---|---|
| Dashboard analítico (6 cards + funil + gráficos) | `app/admin/dashboard/page.tsx` |
| Perfil completo do lead | `app/admin/leads/[id]/page.tsx` + `components/admin/LeadProfile.tsx` |
| CRM Kanban + Tabela com filtros | `components/admin/LeadsKanban.tsx` + `components/admin/LeadsTable.tsx` |
| Agenda (react-big-calendar) | `components/admin/AgendaCalendar.tsx` |
| WhatsApp Inbox + sugestão IA | `components/admin/WhatsAppInbox.tsx` |
| Blog (criar/editar/preview) | `components/admin/BlogForm.tsx` |
| Busca global (⌘K) | `components/admin/GlobalSearch.tsx` |
| Notificação tempo real de novo lead | `components/admin/NewLeadNotifier.tsx` |
| Badge de leads novos no título da aba | `components/admin/AdminTitleBadge.tsx` |
| Exportação CSV de leads | `app/api/leads/route.ts` (`?format=csv`) |
| Automações manuais | `app/admin/automacoes/page.tsx` |
| Configurações do site | `app/admin/config/page.tsx` + `components/admin/ConfigForm.tsx` |
| Conteúdo (before/after, depoimentos) | `components/admin/ConteudoManager.tsx` |
| Skeletons de carregamento | `app/admin/*/loading.tsx` |

### Site Público
| Feature | Arquivo |
|---|---|
| Landing page completa | `app/(site)/page.tsx` |
| Agendamento online com slots | `components/site/Agendamento.tsx` |
| Blog público | `app/(site)/blog/` |
| SEO + Schema.org | `app/(site)/page.tsx` (jsonLd) |

### Integrações
| Integração | Lib | Status |
|---|---|---|
| Supabase Auth + DB + Realtime | `lib/supabase/` | ✅ Ativo |
| E-mail (Resend) | `lib/resend.ts` | ✅ API Key configurada |
| Google Calendar | `lib/google-calendar.ts` | ⚠️ Aguarda env vars |
| WhatsApp Business | `lib/whatsapp.ts` | ⚠️ Aguarda env vars |
| Rate limiting (Upstash Redis) | `lib/rate-limit.ts` | ⚠️ Aguarda env vars |
| IA (Claude Haiku) | `app/api/ai/suggest-reply/` | ⚠️ Aguarda ANTHROPIC_API_KEY |

---

## Endpoints

| Rota | Método | Descrição |
|---|---|---|
| `/api/leads` | GET | Lista leads; `?format=csv` exporta CSV |
| `/api/leads/[id]` | GET / PATCH / DELETE | Detalhe, atualização e exclusão de lead |
| `/api/booking` | POST | Agendamento público (rate limited) |
| `/api/calendar/availability` | GET | Slots livres (`?date=YYYY-MM-DD`) |
| `/api/calendar/events` | POST / DELETE | Criar/cancelar evento no Google Calendar |
| `/api/ai/suggest-reply` | POST | Sugestão de resposta via Claude Haiku |
| `/api/admin/search` | GET | Busca global (`?q=termo`, auth obrigatório) |
| `/api/whatsapp/send` | POST | Envia mensagem via WhatsApp Business |
| `/api/webhooks/whatsapp` | GET / POST | Webhook Meta (verificação + recebimento) |
| `/api/webhooks/calendar` | POST | Webhook Google Calendar (push notifications) |
| `/api/auth/forgot-password` | POST | Dispara e-mail de reset de senha |
| `/api/upload` | POST | Upload de imagens para Supabase Storage |
| `/api/cron/*` | GET | Cron jobs (requerem header `Authorization: Bearer CRON_SECRET`) |

---

## Cron Jobs (`vercel.json`)

| Path | Schedule (UTC) | BRT | Função |
|---|---|---|---|
| `/api/cron/reminders` | `0 11 * * *` | 08h | Lembrete WhatsApp 24h antes da consulta |
| `/api/cron/followup` | `0 12 * * *` | 09h | Follow-up de leads sem resposta há 3 dias |
| `/api/cron/reativacao` | `0 13 * * 1` | 10h (seg) | Reativação de leads inativos há 30+ dias |
| `/api/cron/sync-calendar` | `0 14 * * *` | 11h | Sincroniza Google Calendar → banco |
| `/api/cron/avaliacao` | `0 15 * * *` | 12h | Pede avaliação Google 24-48h pós-consulta |

---

## Supabase Realtime

| Canal | Tabela | Evento | Componente |
|---|---|---|---|
| `new-lead-notifier` | `leads` | INSERT | `NewLeadNotifier` (beep + toast + Notification API) |
| `title-badge-leads` | `leads` | INSERT, UPDATE | `AdminTitleBadge` (badge `(N)` no título) |
| `messages-realtime` | `messages` | INSERT | `WhatsAppInbox` (mensagens em tempo real) |

---

## Responsividade Mobile

### Site público ✅
Todos os componentes usam classes Tailwind `max-md:` para responsividade.

### Admin ✅
- `AdminSidebar` — colapsa automaticamente em viewports < 640px
- `WhatsAppInbox` — toggle sidebar/chat em mobile, botão "voltar"
- `DashboardCharts` — grid responsivo via `useIsMobile()`
- `LeadsKanban` — scroll horizontal com `-webkit-overflow-scrolling: touch`
- Hook: `lib/hooks/useIsMobile.ts` — SSR-safe, começa `false`

---

## Convenções do Projeto

1. **Admin usa inline styles**, não Tailwind. Manter padrão.
2. **Site público usa Tailwind**. Manter padrão.
3. **Tabela de blog é `posts`** — nunca referenciar `blog_posts`.
4. **`createAdminClient()`** para crons e webhooks (service role, ignora RLS). **`createClient()`** para Server Components autenticados.
5. **Rate limiting** em `/api/booking` tem fallback gracioso — se Redis não estiver configurado, a requisição passa.
6. **Google Calendar JSON** deve ser enviado em **base64** na env var.
7. O campo `observacoes` nos leads corresponde a `anotacoes` na documentação antiga — usar `observacoes` (coluna real no banco).
