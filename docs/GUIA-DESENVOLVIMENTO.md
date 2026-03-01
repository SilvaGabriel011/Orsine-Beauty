# Guia de Desenvolvimento — Bela Orsine Beauty

## Setup Local

```bash
# 1. Clonar repositorio
git clone [repo-url]
cd bela-orsine-beauty

# 2. Instalar dependencias
npm install

# 3. Configurar variaveis de ambiente
cp .env.local.example .env.local
# Preencher com suas credenciais de Supabase, Google, Resend

# 4. Rodar em desenvolvimento
npm run dev
```

## Comandos Uteis

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de producao |
| `npm test` | Testes em modo watch |
| `npm run test:run` | Executar testes uma vez |

## Convencoes de Codigo

### Nomenclatura de Arquivos
- Pages: `page.tsx` (Next.js App Router)
- Client components: `*-client.tsx` (ex: `booking-client.tsx`)
- API routes: `route.ts`
- Libs: camelCase (ex: `gamification.ts`)
- Componentes: PascalCase (ex: `SpinWheel.tsx`)

### API Routes
- Sempre usar `withErrorHandler()` para wraping
- Validar input com Zod
- Usar `requireAuth()` / `requireAdmin()` para protecao
- Usar `AppError` com codigos do `ERROR_CATALOG`
- Integracoes externas sao non-blocking (try/catch com logger.warn)

### Banco de Dados
- Queries via Supabase client (server ou admin)
- Operacoes atomicas via RPCs do PostgreSQL
- Timestamps em UTC (conversao na aplicacao)
- Migrations em `supabase/migrations/`

### Timezone
- SEMPRE usar helpers de `src/lib/timezone.ts` para operacoes de data/hora
- NUNCA usar `new Date().toISOString().split("T")[0]` diretamente
- O timezone do app e `Australia/Adelaide`

### Gamificacao
- Resultados de jogos sao SEMPRE calculados no servidor
- Moedas sao separadas de pontos de fidelidade
- RPCs atomicas previnem race conditions

## Estrutura de um Endpoint Tipico

```typescript
import { withErrorHandler, requireAuth, AppError } from "@/lib/errors";
import { z } from "zod";

const schema = z.object({ /* ... */ });

export const POST = withErrorHandler(async (request) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new AppError("VAL_INVALID_FORMAT");

  // ... logica de negocio ...

  return NextResponse.json(data, { status: 201 });
});
```

## Testes

- Framework: Vitest
- Localizacao: `src/lib/__tests__/`
- Areas cobertas: loyalty, retry, errors, notifications
- Rodar: `npm test` ou `npm run test:run`
