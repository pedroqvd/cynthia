# AI Context / Developer Handover

Este arquivo foi criado para servir de bússola para futuras Inteligências Artificiais e Desenvolvedores que atuarem na manutenção do repositório da `Dra. Cynthia`. Abaixo, listo exatamente o que foi arquitetado e modificado recentemente (Abril/2026).

## 1. Correção de Ambiente & Painel Admin
- **Problema resolvido:** O painel administrativo sofria "falsos bloqueios" de auth. 
- **Correção:** A variável de ambiente na Vercel `NEXT_PUBLIC_SUPABASE_URL` estava apontando para uma *api key* e não para a URL (`https://oteywlorjrqwwrsodosc.supabase.co`).
- **Segurança:** A página `/admin/login/page.tsx` foi isolada; implementou-se uma condicional no `components/admin/Sidebar.tsx` que esconde todo o menu se `isLoginPage === true`, garantindo que visitantes e possíveis invasores não visualizem a infraestrutura administrativa do sistema antes de autenticar.

## 2. Refatoração Visual (Brand Guidelines v2.0)
- **Tailwind Config:** Todas as cores foram sobregravadas no `tailwind.config.ts`.
  - Esmeralda: `#1B6B5A`
  - Bordô: `#7B1D3A`
  - Creme/Bone: `#F5F0E6`
  - Ouro: `#C9A96E`
- **Animações:** Foram reduzidas para respeitar a restrição de *máximo 400ms* na subida e aparição (`fade-up`, `fade-in`).
- **Padrões de UI:** Componentes como `Especialidades`, `Hero`, e `Agendamento` tiveram remoção de *drop-shadows*. Os botões primários foram fixados no novo preenchimento (`14px 28px`), textos de Label seguiram fonte **Jost uppercase com tracking 0.14em**.
- **Imagem de Logo:** Os logotipos puramente baseados em texto renderizado no `Nav.tsx` e `Footer.tsx` foram trocados por chamadas definitivas à `<img src="/images/logo-cq.png" />`.
- **Favicon:** Adicionado meta configuration no `app/layout.tsx` forçando o apontamento para `/images/favicon.ico.png`.

## 3. Arquitetura do Blog / CMS (Novidade)
Foi implementada uma seção de revista científica e de notícias (O Blog).

### 3.1: Migrations Supabase
- Tabela criada: `posts` (`id, slug, title, excerpt, content, cover_image, published, created_at, updated_at`).
- Trigger gerado para autogerenciamento de `updated_at`.
- RLS Políticas Ativadas: Público apenas visualiza (`select where published = true`); Autenticados (Admin) tem total (`all`).

### 3.2: Rotas Públicas do Next.js
- `/app/(site)/blog/page.tsx`: Lista dinâmica de todos os artigos publicados, usando cards fluidos e requisição segura tipada.
- `/app/(site)/blog/[slug]/page.tsx`: A página de leitura do artigo em si, utilizando a biblioteca npm `react-markdown` combinada ao `@tailwindcss/typography` no Tailwind (`prose prose-lg`).

### 3.3: Rotas Administrativas 
- `/app/admin/blog/page.tsx`: Painel de visualização de todos os artigos com label Rascunho/Público.
- `/app/admin/blog/novo/page.tsx`: Gerador da página.
- `/app/admin/blog/[id]/page.tsx`: Editor.
- `components/admin/BlogForm.tsx`: Componente isolado e reutilizável pelo estado Create e Update. Realiza interface de escrita Markdown, *slug generation* nativo e faz interface de Upload de Imagem de Capa diretamente voltada ao bucket do Supabase (bucket compartilhado e de uso geral do site).

### Ferramental adicionado em Package.json:
- `react-markdown`
- `@tailwindcss/typography`

*Fim do log. O projeto permanece utilizando App Router do Next.js com as mais perfeitas práticas de render.*
