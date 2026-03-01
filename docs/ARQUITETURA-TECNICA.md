# Arquitetura Tecnica — Bela Orsine Beauty

## Stack

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Frontend | Next.js (App Router) | 14+ |
| UI | shadcn/ui + Tailwind CSS | - |
| Animacoes | Framer Motion | - |
| Auth | Supabase Auth | - |
| Banco de Dados | PostgreSQL (Supabase) | - |
| Storage | Supabase Storage | - |
| Email | Resend | - |
| Calendar | Google Calendar API v3 | - |
| Testes | Vitest | - |
| Deploy | Vercel (frontend) + Supabase Cloud (backend) | - |

## Estrutura de Pastas

```
src/
├── app/
│   ├── (site)/          # Paginas publicas (home, sobre, servicos, portfolio, depoimentos, agendar)
│   ├── admin/           # Painel administrativo
│   ├── cliente/         # Area logada do cliente
│   ├── auth/            # Login, cadastro, reset senha
│   └── api/             # API Routes
│       ├── appointments/    # CRUD agendamentos
│       ├── categories/      # CRUD categorias
│       ├── services/        # CRUD servicos
│       ├── reviews/         # CRUD avaliacoes
│       ├── availability/    # Consulta disponibilidade
│       ├── loyalty/         # Programa de fidelidade
│       ├── portfolio/       # CRUD portfolio
│       ├── games/           # Gamificacao (checkin, play, status, ranking, quiz)
│       ├── store/           # Loja de recompensas
│       ├── upload/          # Upload de imagens
│       ├── profile/         # Perfil do usuario
│       └── admin/           # APIs exclusivas do admin
├── components/
│   ├── ui/              # Componentes base shadcn/ui
│   ├── games/           # Componentes de gamificacao
│   ├── marketplace/     # Componentes do carrinho/marketplace
│   ├── reviews/         # Componentes de avaliacao
│   ├── admin/           # Componentes do admin
│   └── shared/          # Header, Footer, WhatsAppButton
├── lib/
│   ├── supabase/        # Clients do Supabase (browser, server, admin)
│   ├── errors/          # Sistema de erros (AppError, handler, logger, auth helpers)
│   ├── timezone.ts      # Helpers de timezone para Adelaide
│   ├── gamification.ts  # Logica de gamificacao (minigames, coins, stats)
│   ├── achievements.ts  # Engine de conquistas
│   ├── loyalty.ts       # Calculo de pontos de fidelidade
│   ├── availability.ts  # Calculo de horarios disponiveis
│   ├── notifications.ts # Templates e envio de email
│   ├── google-calendar.ts # Integracao Google Calendar
│   ├── retry.ts         # Retry com backoff exponencial
│   ├── cart-context.tsx  # Context do carrinho (React)
│   └── utils.ts         # Utilidades gerais
└── types/
    └── database.ts      # Tipos TypeScript gerados do Supabase
```

## Fluxo de Dados

### Autenticacao
1. Supabase Auth gerencia sessoes via cookies
2. `middleware.ts` renova sessao em cada request
3. `requireAuth()` / `requireAdmin()` protegem API routes
4. RLS no PostgreSQL garante isolamento por usuario

### Sistema de Erros
1. `AppError` + `ERROR_CATALOG` definem erros tipados com HTTP status
2. `withErrorHandler()` wrapa cada API route com try/catch padrao
3. `logger` faz log estruturado (JSON em prod, colorido em dev)
4. Client-side: `safeFetch()` trata respostas de erro e exibe toasts

### Gamificacao
1. Moedas de gamificacao sao separadas de pontos de fidelidade
2. RPCs atomicas no PostgreSQL (`daily_checkin`, `play_minigame`, `spend_game_coins`)
3. Resultados dos jogos sao calculados server-side (anti-fraude)
4. Engine de conquistas verifica apos cada acao

### Timezone
- Todas as operacoes de data/hora usam helpers de `src/lib/timezone.ts`
- Timezone fixo: `Australia/Adelaide` (UTC+9:30 / UTC+10:30 DST)
- Supabase armazena timestamps em UTC; conversao e feita na camada de aplicacao

## Seguranca

- **Double Booking:** Exclusion constraint com `btree_gist` no PostgreSQL
- **Validacao:** Zod schemas em todos os endpoints
- **RLS:** Politicas de Row Level Security isolam dados por usuario
- **XSS:** Variaveis sanitizadas nos templates de email
- **Upload:** Validacao de MIME type e tamanho maximo de 5MB
- **Open Redirect:** Parametro `next` validado como URL relativa
