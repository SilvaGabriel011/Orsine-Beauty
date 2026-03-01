# Bela Orsine Beauty — Features Roadmap

Arquivo organizado com features pendentes, melhorias planejadas e ideias novas.
Atualizado em: Março 2026

---

## Features Pendentes (das Fases originais)

### Fase 3 — Incompleta

- [ ] **Reagendamento standalone**: Permitir alterar data/hora de um appointment existente sem cancelar e criar novo (atualizar no banco + Google Calendar via `updateEvent`)
- [ ] **Cancelamento via link com token**: Gerar token unico no link de cancelamento do email/WhatsApp para que clientes cancelem sem precisar fazer login
- [ ] **Lightbox no portfolio publico**: Ampliar fotos ao clicar no grid do portfolio (`/portfolio`)
- [ ] **Notificacao de cancelamento para admin**: Alertar admin (email ou dashboard) quando uma cliente cancela um agendamento

### Fase 4 — Nao iniciada

- [ ] **Integracao WhatsApp**: Escolher provedor (Evolution API / Z-API / Twilio), implementar `lib/whatsapp.ts` com `sendMessage()` e `sendTemplate()`, e integrar em: confirmacao, lembretes 24h/2h, alerta de feedback 1h apos atendimento, cancelamento
- [ ] **Gateway de pagamento**: Integrar Mercado Pago, Stripe ou PagSeguro com PIX e cartao. Criar webhook em `/api/payments/webhook`, fluxo de checkout online, e paginas de sucesso/falha
- [ ] **Desconto de fidelidade no pagamento online**: Integrar `discount_applied` no valor enviado ao gateway. Validar saldo de pontos no momento do pagamento (race condition)
- [ ] **SEO completo**: Meta tags dinamicas por pagina, Open Graph tags para compartilhamento, sitemap.xml, robots.txt
- [ ] **Otimizacao de imagens**: Usar `next/image` com blur placeholder, lazy loading no portfolio, prefetch de paginas frequentes
- [ ] **Acessibilidade**: Labels em todos os inputs, navegacao por teclado, contraste de cores, alt text em imagens
- [ ] **Loading states**: Skeleton loaders nas listas e cards, spinner nos botoes de acao, indicador de carregamento no calendario
- [ ] **Empty states**: Ilustracoes + CTAs para: nenhum agendamento, nenhum servico na categoria, nenhuma avaliacao
- [ ] **Pagina 404 customizada**: Pagina amigavel com link para home
- [ ] **Testes E2E**: Fluxo completo de agendamento, cancelamento, login admin + gerenciar servicos, avaliacao pos-atendimento (Playwright ou Cypress)
- [ ] **Testes de integracao**: Criar appointment, cancelar, criar review, resgatar pontos, calcular disponibilidade, webhook de pagamento

---

## Melhorias Tecnicas

### Prioridade Alta

- [ ] **Rate limiting nos endpoints de jogos**: Implementar middleware com `@upstash/ratelimit` (Redis serverless) ou `lru-cache` em memoria. Priorizar `/api/games/*` e `/api/store/redeem` para prevenir abuso. Opcoes:
  - `@upstash/ratelimit` + `@upstash/redis` — rate limiting distribuido, funciona em edge/serverless, ~$0 no free tier
  - `lru-cache` em memoria — simples, sem dependencia externa, mas nao funciona entre instancias serverless
  - Middleware personalizado em `src/middleware.ts` que lê o `SYS_RATE_LIMIT` error code ja existente
- [ ] **Compensacao atomica no store/redeem**: Mover todo o fluxo de troca (spend coins + decrement stock + create redemption) para uma unica RPC do PostgreSQL, garantindo rollback automatico se qualquer etapa falhar
- [ ] **Remover `as any` casts em appointments/route.ts**: Usar os tipos gerados de `@/types/database` com Supabase generics (`supabase.from("appointments")` ja deveria retornar os tipos corretos se o client for tipado com `Database`)

### Prioridade Media

- [ ] **Tipar Supabase client**: Configurar `createClient<Database>()` no `supabase/client.ts` e `supabase/server.ts` para que todas as queries tenham autocomplete e type safety
- [ ] **Validacao de status no GET /api/appointments**: Adicionar `z.enum(["pending","confirmed","cancelled","completed","no_show"])` para o parametro `status` da query string
- [ ] **Melhorar retry de notificacoes**: Implementar dead-letter queue para emails/WhatsApp que falharam apos X tentativas
- [ ] **Logs estruturados em producao**: Configurar o logger para output JSON em producao (ja preparado no codigo, verificar se esta ativo)

### Prioridade Baixa

- [ ] **Migrar Supabase client para typed**: Gerar tipos automaticamente com `supabase gen types typescript` e integrar no CI
- [ ] **Cache de categorias/servicos**: Usar ISR (Incremental Static Regeneration) do Next.js para paginas publicas de categorias e servicos
- [ ] **Monitoramento de performance**: Integrar Vercel Analytics ou Web Vitals para tracking de performance

---

## Ideias de Features Novas

### Engajamento

- [ ] **Notificacoes push (PWA)**: Implementar Web Push Notifications via service worker para lembretes de streak diario, conquistas desbloqueadas, e lembretes de agendamento. Usar `next-pwa` ou `@ducanh2912/next-pwa`
- [ ] **Modo "ferias" no admin**: Botao simples que bloqueia todos os horarios por um periodo selecionado, sem precisar criar blocked_slots individualmente
- [ ] **Preview de email no admin**: Rota `/admin/preview-email?type=confirmation|reminder|feedback|cancellation` que renderiza o template HTML para visualizacao antes de ativar

### Negocios

- [ ] **Relatorio de receita no dashboard**: Grafico de receita mensal/semanal no dashboard admin com breakdown por categoria de servico
- [ ] **Historico de precos**: Rastrear mudancas de preco dos servicos para analise de impacto na receita
- [ ] **Lista de espera**: Quando todos os horarios estao ocupados, permitir que clientes entrem em lista de espera e sejam notificadas automaticamente quando um horario abrir (cancelamento)

### Experiencia do Cliente

- [ ] **Favoritos**: Permitir que clientes marquem servicos como favoritos para acesso rapido ao agendar
- [ ] **Programa de indicacao**: Cliente indica amiga, ambas ganham moedas de gamificacao quando a indicada faz o primeiro agendamento
- [ ] **Historico visual de transformacao**: Galeria pessoal da cliente com fotos de antes/depois dos atendimentos (upload pelo admin)

---

## Sobre Neon como alternativa ao Supabase

Se migrar o banco para Neon (Postgres serverless), considerar:

**O que continua funcionando:** RPCs atomicas, migrations, schema, queries SQL, extensoes como btree_gist

**O que precisaria ser substituido:**
- Supabase Auth → NextAuth.js, Lucia, ou Auth.js
- Supabase Storage → Cloudinary, AWS S3, ou Uploadthing
- Supabase Edge Functions → Vercel Cron Jobs ou Inngest
- RLS Policies → Logica de autorizacao na camada de aplicacao
- Supabase Realtime → Nao utilizado atualmente, sem impacto

**Recomendacao:** Manter Supabase por enquanto. O free tier atende bem e a migracao teria custo alto de desenvolvimento sem beneficio claro. Reavaliar se/quando o projeto precisar de mais capacidade de banco ou se houver necessidade de serverless connections (onde Neon brilha).
