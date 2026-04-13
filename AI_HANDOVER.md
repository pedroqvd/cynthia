# AI Context / Developer Handover

Este arquivo é a bússola para futuras IAs e desenvolvedores no repositório `Dra. Cynthia`.
Atualizado em: **Abril 2026**. Leia **tudo** antes de tocar em qualquer arquivo.

---

## Visão Geral do Projeto

App Next.js 14 (App Router) para clínica odontológica. Duas áreas principais:
- **Site público** (`/`) — captação de leads, agendamento online, blog
- **Painel admin** (`/admin/*`) — CRM, agenda, WhatsApp inbox, dashboard

Stack: Next.js 14 · TypeScript · Supabase (auth + DB + Realtime + Storage) · Tailwind CSS (site) + Inline Styles (admin) · Vercel (deploy + Cron Jobs)

---

## Histórico de Correções Importantes

### Correção de Auth (Abril 2026)
O painel sofria loop de redirecionamento após login.

**Causa raiz:** O login usava `createBrowserClient` (client-side), que escrevia cookies via `document.cookie` sem `path='/'`. Em alguns navegadores, cookies sem path explícito ficam restritos a `/admin/login` e não são enviados para `/admin/dashboard`.

**Solução implementada:**
- `app/api/auth/login/route.ts` — Server Route que faz `signInWithPassword` server-side e escreve cookies via HTTP `Set-Cookie` com `path: '/'`
- `middleware.ts` — usa `getUser()` (valida JWT server-side no Supabase, mais seguro e resiliente a deploys)
- `app/admin/login/page.tsx` — chama `fetch('/api/auth/login')` em vez de usar o browser client

**IMPORTANTE:** Os cookies NÃO usam `httpOnly: true` porque o browser client (`createBrowserClient`) precisa lê-los para `signOut`, callback e reset-password.

### Correção de Sessão Pós-Deploy (Abril 2026)
O middleware usava `getSession()` (JWT local), que não renovava a sessão após novos deploys, forçando login manual.

**Solução:** Trocado `getSession()` por `getUser()` no `middleware.ts`. O `getUser()` valida o token diretamente na API do Supabase e renova automaticamente usando o refresh token — sessão persiste entre deploys.

---

## Brand Guidelines

- Fundo escuro: `#0f0e0c`
- Ouro/Dourado: `#b8965a`
- Texto cinza: `#7a7570`
- Fonte principal: DM Sans
- Fonte serif: Cormorant Garamond

Tailwind config sobrescrito com cores da marca. Ver `tailwind.config.ts`.

---

## Schema do Banco de Dados (Supabase)

### Tabelas principais:
- `leads` — id, nome, whatsapp, email, especialidade, status (novo|em_contato|agendado|proposta|fechado), urgencia (alta|media|baixa), origem, ticket_estimado, anotacoes, created_at
- `appointments` — id, lead_id, procedimento, data_hora, duracao_min, status (agendado|confirmado|realizado|cancelado), google_event_id, **avaliacao_enviada** (ver nota abaixo), created_at
- `messages` — id, lead_id, content, direction (in|out), status (sent|delivered|read), wa_message_id, created_at
- `posts` — id, slug, title, excerpt, content, cover_image, published, created_at, updated_at
- `site_config` — key, value, updated_at (configurações dinâmicas do site: textos, imagens, horários)
- `before_after` — id, titulo, descricao, imagem_antes, imagem_depois, ativo, ordem
- `testimonials` — id, nome, texto, avaliacao, ativo, ordem

### ⚠️ Migração pendente (o USER precisa executar):
```sql
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS avaliacao_enviada BOOLEAN DEFAULT false;
```
Sem esta coluna, o cron `/api/cron/avaliacao` vai falhar com erro de coluna inexistente.

---

## Blog

A tabela de blog é **`posts`** (não `blog_posts`). Colunas: `id, slug, title, excerpt, content, cover_image, published, created_at, updated_at`.

Rotas:
- `/app/(site)/blog/page.tsx` — lista pública
- `/app/(site)/blog/[slug]/page.tsx` — artigo individual
- `/app/admin/blog/page.tsx` — painel de gerenciamento
- `/app/admin/blog/novo/page.tsx` — criar artigo
- `/app/admin/blog/[id]/page.tsx` — editar artigo
- `components/admin/BlogForm.tsx` — componente de formulário reutilizado

---

## Sistema de Imagens Dinâmicas (Implementado Abril 2026)

### ImageCropper Universal
- `components/admin/ImageCropper.tsx` — modal com `react-easy-crop`, zoom + pan, aspect ratio travado
- Props: `imageFile?: File | null`, `imageUrl?: string | null` (para re-editar imagem já salva), `aspectRatio: number`, `onCancel`, `onConfirm`
- **Correção CORS:** `crossOrigin='anonymous'` só é setado para URLs absolutas (`http...`). Para imagens locais (`/images/...`) não setar evita canvas tainted e `toBlob()` retornando `null`.

### Upload de Imagens (route.ts)
- `app/api/upload/route.ts` — usa **admin client** (`SUPABASE_SERVICE_ROLE_KEY`) para bypass de RLS
- **Auto-criação de bucket:** lista os buckets existentes e cria automaticamente se necessário (bucket `site`, `before_after`, `testimonials`)
- Valida tipo (JPEG/PNG/WebP) e tamanho (máx 5MB)

### Integrações do Cropper
| Componente | Bucket | Aspect Ratio |
|---|---|---|
| `BlogForm.tsx` | `before_after` | 16:9 |
| `ConteudoManager.tsx` | `before_after` | 1:1 |
| `ConfigForm.tsx` | `site` | 3:4 (hero/sobre) ou 4:5 (cta) |

### Imagens Dinâmicas no Site Público
- `app/(site)/page.tsx` — busca `img_hero`, `img_sobre`, `img_cta` da tabela `site_config`
- `Hero.tsx`, `Sobre.tsx`, `Agendamento.tsx` — aceitam `imgUrl?: string` via props, com fallback para imagens estáticas em `/public/images/`

### ConfigForm — Seção "Imagens Principais do Site"
- Preview sempre visível (mostra fallback local se nenhuma imagem salva)
- Dois botões por imagem: **"Ajustar Imagem Atual"** (re-crop da URL existente) + **"Novo Upload"**
- Ao salvar, chama `revalidateSite()` (Server Action) para invalidar o ISR cache do Next.js

### Cache Invalidation (revalidateSite)
- `app/actions.ts` → `export async function revalidateSite()` → `revalidatePath('/', 'layout')`
- Chamada após: salvar configs, publicar blog, ativar/desativar Antes/Depois ou Depoimentos

---

## Features Implementadas (Abril 2026)

### 1. Funil de Conversão no Dashboard
- `app/admin/dashboard/page.tsx` — 5 queries paralelas por status do lead
- `components/admin/DashboardCharts.tsx` — barras horizontais com % de conversão por etapa

### 2. Notificação de Novo Lead em Tempo Real
- `components/admin/NewLeadNotifier.tsx` — Supabase Realtime, beep via Web Audio API, toast + Notification API
- Renderizado em `app/admin/layout.tsx`

### 3. Sugestão de Resposta com IA
- `app/api/ai/suggest-reply/route.ts` — chama Claude Haiku (`claude-haiku-4-5-20251001`)
- `components/admin/WhatsAppInbox.tsx` — botão ✦ IA (roxo) no input
- **Requer:** `ANTHROPIC_API_KEY` nas variáveis de ambiente da Vercel

### 4. Exportação CSV de Leads
- `app/api/leads/route.ts` — handler GET detecta `?format=csv`, retorna CSV com BOM UTF-8
- Botão de exportação na página `/admin/leads`

### 5. Agendamento Online com Slots de Horário
- `components/site/Agendamento.tsx` — date picker + dropdown de horários disponíveis
- `app/api/booking/route.ts` — cria lead, evento Google Calendar, salva appointment
- `app/api/calendar/availability/route.ts` — busca slots livres
- **Requer:** `GOOGLE_SERVICE_ACCOUNT_JSON` e `GOOGLE_CALENDAR_ID` na Vercel

### 6. Cron de Avaliação Pós-Consulta
- `app/api/cron/avaliacao/route.ts` — envia WhatsApp com link de avaliação 24-48h após consulta
- Agendado no `vercel.json`: `"0 15 * * *"` (15h UTC = 12h BRT)
- **Requer:** `GOOGLE_REVIEWS_URL` na Vercel + migração `avaliacao_enviada` (acima)

### 7. Preferências de Visualização da Agenda
- `components/admin/AgendaCalendar.tsx` — salva e restaura view (semana/mês/dia) no `localStorage`

### 8. Busca Global (Cmd+K)
- `components/admin/GlobalSearch.tsx` — modal com atalho de teclado, busca debounced
- `app/api/admin/search/route.ts` — busca em `leads`, `appointments`, `posts`
- Renderizado em `app/admin/layout.tsx`

### 9. Badge de Leads Novos no Título da Aba
- `components/admin/AdminTitleBadge.tsx` — atualiza `document.title` com `(N)` em tempo real
- Renderizado em `app/admin/layout.tsx`

### 10. Ícones Premium no Admin (Abril 2026)
- `app/admin/dashboard/page.tsx` — cards de métricas usam SVGs flat coloridos (dourado para leads, azul para consultas)
- `components/site/Agendamento.tsx` — botão WhatsApp usa logo oficial SVG com cor `#25D366`

---

## Responsividade Mobile (Atualizada Abril 2026)

### Site público — OK ✅
Todos os componentes (`Nav`, `Hero`, `Agendamento`, `Especialidades`, `Depoimentos`, `Footer`, `Diferencial`, `Resultados`, `Sobre`) usam classes Tailwind `max-md:` para responsividade.

### Painel Admin — Corrigido ✅
- **`AdminSidebar`** — auto-colapsa em viewports < 640px via `useEffect` + `resize` listener
- **`WhatsAppInbox`** — toggle entre lista de conversas e chat em mobile; botão "voltar" no header do chat
- **`DashboardCharts`** — grid `2fr 1fr` vira `1fr` em mobile via `useIsMobile()`
- **`Dashboard page`** — grid inferior usa `repeat(auto-fit, minmax(300px, 1fr))` (CSS puro)
- **`LeadsKanban`** — scroll horizontal com `-webkit-overflow-scrolling: touch` + `overscrollBehaviorX: contain`

Hook utilitário: `lib/hooks/useIsMobile.ts` — detecta `window.innerWidth < 768`, SSR-safe (inicia `false`).

---

## Variáveis de Ambiente Necessárias

| Variável | Status | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Configurada | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Configurada | Chave anônima Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Configurada | Chave admin Supabase (usada no upload) |
| `ANTHROPIC_API_KEY` | ⚠️ **Pendente** | Para sugestão de resposta com IA |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | ⚠️ **Pendente** | JSON da service account Google Calendar |
| `GOOGLE_CALENDAR_ID` | ⚠️ **Pendente** | ID do calendário Google |
| `GOOGLE_REVIEWS_URL` | ⚠️ **Pendente** | Link do Google Business para avaliações |
| `WHATSAPP_ACCESS_TOKEN` | ⚠️ **Pendente** | Token da API WhatsApp Business |
| `WHATSAPP_PHONE_NUMBER_ID` | ⚠️ **Pendente** | ID do número WhatsApp |
| `WHATSAPP_APP_SECRET` | ⚠️ **Pendente** | Segredo para verificar webhooks |
| `WHATSAPP_VERIFY_TOKEN` | ⚠️ **Pendente** | Token de verificação do webhook |
| `UPSTASH_REDIS_REST_URL` | ⚠️ **Pendente** | Para rate limiting do agendamento público |
| `UPSTASH_REDIS_REST_TOKEN` | ⚠️ **Pendente** | Token do Upstash Redis |
| `RESEND_API_KEY` | ⚠️ **Pendente** | Para envio de e-mail de confirmação |
| `RESEND_FROM_EMAIL` | ⚠️ **Pendente** | E-mail remetente (ex: noreply@dracynthia.com.br) |
| `NEXT_PUBLIC_GA_ID` | ⚠️ **Opcional** | Google Analytics 4 |
| `NEXT_PUBLIC_META_PIXEL_ID` | ⚠️ **Opcional** | Meta Pixel para anúncios |

---

## O Que o Usuário Ainda Precisa Fazer

### 🔴 Crítico (o app não funciona plenamente sem isso):

**1. Migração Supabase** — executar no SQL Editor:
```sql
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS avaliacao_enviada BOOLEAN DEFAULT false;
```

**2. JWT Expiry no Supabase** — Supabase → Authentication → Settings → JWT expiry: mudar de `3600` para `2592000` (30 dias). Resolve sessão expirando e precisar entrar toda hora.

**3. Criar bucket `site` no Supabase Storage** — Supabase → Storage → New Bucket → nome: `site`, visibilidade: **Public**. Necessário para upload das 3 imagens principais do site.

**4. Domínio na Vercel** — configurar `dracynthia.com.br` (DNS CNAME/A records)

**5. Supabase Auth URLs** — Authentication → Settings → atualizar Site URL e Redirect URLs para `https://dracynthia.com.br`

### 🟡 Importante (funcionalidades ficam inativas sem isso):

**6. WhatsApp Business API** — Meta Business Suite:
1. Criar app tipo "Business" → adicionar produto WhatsApp
2. Registrar número real
3. Webhook: `https://dracynthia.com.br/api/whatsapp/webhook`
4. Configurar: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`

**7. Google Calendar** — Google Cloud Console:
1. Criar service account → baixar JSON da chave
2. Compartilhar calendário com e-mail da service account
3. Configurar: `GOOGLE_SERVICE_ACCOUNT_JSON` (JSON em base64) e `GOOGLE_CALENDAR_ID`

**8. Anthropic API Key** — [console.anthropic.com](https://console.anthropic.com) → API Keys → configurar `ANTHROPIC_API_KEY` na Vercel

**9. Upstash Redis** — [upstash.com](https://upstash.com) → criar database → configurar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`

**10. Resend (e-mail)** — [resend.com](https://resend.com) → criar conta → configurar `RESEND_API_KEY` e `RESEND_FROM_EMAIL`

**11. Google Reviews URL** — Google Business Profile → pegar link de avaliação → configurar `GOOGLE_REVIEWS_URL`

### 🟢 Conteúdo / Configuração:

**12. Preencher `/admin/config`:**
- Nome do consultório, endereço, CRO, telefone, WhatsApp (formato: `5561999999999`)
- Horários de abertura e fechamento
- Headline e subtítulo do Hero
- Texto da seção Sobre

**13. Upload das 3 Fotos Principais** (em `/admin/config` → Imagens Principais do Site):
- Foto Hero (proporção 3:4)
- Foto Sobre (proporção 3:4)
- Foto Agendamento CTA (proporção 4:5)

**14. Publicar primeiros artigos** em `/admin/blog/novo`

**15. Adicionar casos Antes/Depois** em `/admin/conteudo`

---

## Endpoints Importantes

| Rota | Descrição |
|---|---|
| `POST /api/auth/login` | Login server-side (cookies com path='/') |
| `GET /api/leads?format=csv` | Download CSV de todos os leads |
| `POST /api/booking` | Agendamento público (rate limited) |
| `GET /api/calendar/availability?date=YYYY-MM-DD` | Slots livres do Google Calendar |
| `POST /api/ai/suggest-reply` | Sugestão de resposta via Claude Haiku |
| `GET /api/admin/search?q=termo` | Busca global (auth obrigatório) |
| `POST /api/whatsapp/webhook` | Recebe mensagens do WhatsApp |
| `POST /api/upload` | Upload de imagem para Supabase Storage (admin client) |
| `GET /api/cron/*` | Cron jobs (autenticados por `CRON_SECRET`) |

---

## Cron Jobs (vercel.json)

| Path | Schedule (UTC) | BRT | Função |
|---|---|---|---|
| `/api/cron/reminders` | `0 11 * * *` | 08h | Lembra pacientes de consultas do dia |
| `/api/cron/followup` | `0 12 * * *` | 09h | Follow-up de leads inativos |
| `/api/cron/reativacao` | `0 13 * * 1` | 10h (seg) | Reativa leads frios |
| `/api/cron/sync-calendar` | `0 14 * * *` | 11h | Sincroniza Google Calendar |
| `/api/cron/avaliacao` | `0 15 * * *` | 12h | Pede avaliação Google pós-consulta |

---

## Arquitetura de Autenticação

```
Browser → POST /api/auth/login → Supabase signInWithPassword
                ↓
         Set-Cookie (path='/', sem httpOnly)
                ↓
Browser → GET /admin/dashboard → middleware.ts
                ↓
         createServerClient → getUser() (valida JWT no Supabase + renova token)
                ↓
         Autorizado: next() | Não autorizado: redirect('/admin/login')
```

**Nunca usar `getSession()` no middleware** — usa `getUser()` que valida o JWT no Supabase e renova o token automaticamente.

---

## Supabase Realtime

| Canal | Tabela | Eventos | Componente |
|---|---|---|---|
| `title-badge-leads` | leads | INSERT, UPDATE | AdminTitleBadge |
| `new-lead-notifier` | leads | INSERT | NewLeadNotifier |
| `messages-realtime` | messages | INSERT | WhatsAppInbox |

---

## Notas para Próxima IA

1. **Tabela de blog é `posts`**, não `blog_posts`. Nunca referenciar `blog_posts`.
2. **Admin usa inline styles**, não Tailwind (exceto nos componentes públicos). Manter padrão.
3. **`useIsMobile()`** em `lib/hooks/useIsMobile.ts` — SSR-safe, começa `false`.
4. **Não usar `httpOnly: true`** nos cookies de auth — quebra o browser client.
5. **O cron `avaliacao` depende da migração** da coluna `avaliacao_enviada`. Sem migração = erro 500.
6. **Rate limiting** em `/api/booking` usa Upstash Redis — sem as env vars, o endpoint falha.
7. **`/api/auth/whoami`** foi **removido** (era endpoint de debug — não recriar).
8. **Upload de imagens** usa `createAdminClient()` com `SUPABASE_SERVICE_ROLE_KEY` — nunca usar anon key para storage.
9. **`ImageCropper`** aceita tanto `imageFile` (novo upload) quanto `imageUrl` (re-editar imagem já salva). NÃO setar `crossOrigin` para URLs relativas (`/images/...`) — causa canvas tainted.
10. **`app/actions.ts`** contém `revalidateSite()` — chamar após qualquer mutação que afete a home pública.
11. **`site_config`** table — chave-valor com as configurações dinâmicas. Sempre ler via `supabase.from('site_config').select('key, value')` e transformar em `Record<string, string>`.
