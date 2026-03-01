/**
 * Modulo de Retry — Bela Orsine Beauty
 *
 * Utilitario para retentar chamadas a servicos externos com backoff exponencial.
 * Importante para integracoes com Google Calendar, Email (Resend), etc.
 *
 * Estrategia:
 * - Tentativa 1: Imediato
 * - Tentativa 2: Apos 500ms
 * - Tentativa 3: Apos 1s (500 * 2)
 * - Tentativa 4: Apos 2s (1000 * 2), mas capped em 5s max
 *
 * Uso:
 *   const result = await withRetry(() => callExternalAPI(), { maxAttempts: 3 });
 */

interface RetryOptions {
  /** Numero maximo de tentativas (default: 3) */
  maxAttempts?: number;
  /** Delay inicial em ms (default: 500) */
  initialDelayMs?: number;
  /** Multiplicador de backoff (default: 2, ex: 500ms → 1s → 2s) */
  backoffMultiplier?: number;
  /** Delay maximo em ms (default: 5000) — evita esperas muito longas */
  maxDelayMs?: number;
  /** Funcao para determinar se um erro pode ser retentado (default: sempre true) */
  isRetryable?: (error: unknown) => boolean;
  /** Callback chamado em cada retentativa para logging */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

// ── Opcoes padrao ──────────────────────────────────────────
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 500,
  backoffMultiplier: 2,
  maxDelayMs: 5000,
  isRetryable: () => true,
  onRetry: () => {},
};

/**
 * Pausa por um numero de milissegundos.
 * Usado entre tentativas.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executa uma funcao com retentas automaticas e backoff exponencial.
 *
 * Processa:
 * 1. Tenta executar a funcao
 * 2. Se falhar e for retentavel, aguarda delay
 * 3. Aumenta delay (multiplicador 2x, max 5s)
 * 4. Retenta ate maxAttempts
 *
 * Exemplo:
 *   try {
 *     await withRetry(
 *       () => fetch(url),
 *       { maxAttempts: 3, isRetryable: isHttpRetryable }
 *     )
 *   } catch (err) {
 *     console.error("Falhou apos 3 tentativas", err)
 *   }
 *
 * @param fn Funcao async a ser retentada
 * @param options Opcoes de retry (ver RetryOptions)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // ── Nao retenta na ultima tentativa ou erros nao-retentaveis ──
      if (attempt >= opts.maxAttempts || !opts.isRetryable(error)) {
        throw error;
      }

      // ── Log da retentativa ────────────────────────────────────────
      opts.onRetry(error, attempt, delay);

      // ── Aguarda antes da proxima tentativa ────────────────────────
      await sleep(delay);

      // ── Aumenta delay para proxima tentativa (exponencial) ────────
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Helper: determina se um erro HTTP pode ser retentado.
 * Retenta em:
 * - 5xx (erros do servidor — talvez temporario)
 * - 429 (rate limit — aguardar pode resolver)
 * - Erros de rede (offline, timeout, conexao resetada)
 *
 * NAO retenta em:
 * - 4xx (exceto 429) — erro do cliente, retentativa nao vai ajudar
 * - 2xx/3xx — sucesso, nao retenta
 */
export function isHttpRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    // ── Erros de rede / timeout ────────────────────────────────
    if (error.message.includes("fetch failed") || error.message.includes("ECONNRESET")) {
      return true;
    }
  }

  // ── Verifica status HTTP se disponivel ──────────────────────
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status: number }).status;
    // Retenta em 5xx (servidor) e 429 (rate limit)
    return status >= 500 || status === 429;
  }

  // ── Padrao: retenta erros desconhecidos ───────────────────
  // Melhor ser otimista e retentador que falhar imediatamente
  return true;
}
