# Changelog — Bela Orsine Beauty

Todas as mudancas notaveis do projeto estao documentadas neste arquivo.

---

## [2026-03-01] — Correcoes de Bugs e Melhorias

### Bugs Corrigidos

#### Bug 1: Timezone — Australia/Adelaide
- **Arquivo:** `src/lib/timezone.ts` (novo)
- **Problema:** Todos os calculos de data/hora usavam UTC do servidor, causando inconsistencias para clientes em Adelaide (UTC+9:30/+10:30).
- **Solucao:** Criado modulo `timezone.ts` com helpers `getAdelaideDateString()`, `getAdelaideNow()`, `adelaideDateTime()` e `getAdelaideDayRange()`. Todos os endpoints afetados agora usam essas funcoes.
- **Arquivos afetados:** `appointments/route.ts`, `appointments/[id]/route.ts`, `gamification.ts`, `games/quiz/question/route.ts`

#### Bug 2: Criacao de Agendamento Nao-Atomica
- **Arquivo:** `src/app/api/appointments/route.ts`
- **Problema:** Se o insert em `appointment_services` falhasse apos criar o appointment, ficava um registro orfao no banco.
- **Solucao:** Adicionada verificacao de erro no insert de `appointment_services` com rollback (delete do appointment) em caso de falha.

#### Bug 3: Janela de Tempo Incorreta em getPlayerStats
- **Arquivo:** `src/lib/gamification.ts`
- **Problema:** O range de query para "jogadas de hoje" usava strings sem timezone, podendo retornar resultados incorretos.
- **Solucao:** Substituido por `getAdelaideDayRange()` que retorna ISO strings corretas com offset de Adelaide.

#### Bug 4: scratchCard com Simbolo Unico
- **Arquivo:** `src/lib/gamification.ts`
- **Problema:** Se `symbol_options` tivesse apenas 1 simbolo, `otherSymbols` ficava vazio e o grid gerava `NaN`.
- **Solucao:** Adicionado fallback: se `otherSymbols` esta vazio, usa a lista completa de simbolos.

#### Bug 5: Quiz — Verificado Seguro
- **Arquivo:** `src/app/api/games/quiz/question/route.ts`
- **Status:** Nao era bug — o GET ja seleciona apenas `id, question, options, category, difficulty` sem enviar `correct_index`.

#### Bug 6: Error Handling — Verificado Corrigido
- **Arquivos:** `store/items`, `store/my-redemptions`, `games/ranking`, `store/redeem`
- **Status:** Todos ja usam `throw new AppError("SYS_DATABASE")` corretamente.

#### Bug 7: Pagina de Cancelamento Standalone
- **Arquivos:** `src/app/cliente/cancelar/[id]/page.tsx`, `cancelar-client.tsx` (novos)
- **Problema:** Cancelamento so funcionava inline na pagina "Meus Agendamentos". Nao existia pagina acessivel via link direto (email/WhatsApp).
- **Solucao:** Criada pagina standalone com autenticacao, verificacao de propriedade, politica de 24h, e estados visuais para cada cenario.

### Melhorias

#### Melhoria 1: Validacao end_time > start_time
- **Arquivo:** `src/app/api/appointments/route.ts`
- **Descricao:** Adicionada validacao no Zod schema que rejeita agendamentos onde o horario de fim e anterior ou igual ao de inicio.

#### Melhoria 2: Compensacao Atomica no Store/Redeem
- **Status:** Documentada no `FEATURES-ROADMAP.md` como prioridade alta. Requer nova RPC no PostgreSQL.

#### Melhoria 3: Remocao de `as any` Casts
- **Status:** Documentada no `FEATURES-ROADMAP.md`. Requer tipagem do Supabase client com `Database` generics.

### Arquivos Criados
- `src/lib/timezone.ts` — Helpers de timezone para Adelaide
- `src/app/cliente/cancelar/[id]/page.tsx` — Server component da pagina de cancelamento
- `src/app/cliente/cancelar/[id]/cancelar-client.tsx` — Client component da pagina de cancelamento
- `FEATURES-ROADMAP.md` — Roadmap completo de features pendentes e novas
- `docs/CHANGELOG.md` — Este arquivo
- `docs/ARQUITETURA-TECNICA.md` — Documentacao tecnica detalhada
- `docs/GUIA-DESENVOLVIMENTO.md` — Guia para desenvolvedores

---

## [Inicial] — Sistema Base

### Implementado
- Sistema de agendamento com marketplace/carrinho
- Painel admin completo (categorias, servicos, agendamentos, horarios, portfolio, feedbacks, fidelidade, clientes, configuracoes)
- Sistema de gamificacao (check-in, roleta, raspadinha, quiz, shake, loja, conquistas, ranking)
- Programa de fidelidade com pontos
- Integracao Google Calendar
- Email de confirmacao e cancelamento (Resend)
- Sistema de erros padronizado (AppError, withErrorHandler, logger)
- Retry com backoff exponencial
- Testes unitarios (Vitest)
- Edge Functions (send-reminders, feedback-cron)
