/**
 * Modulo de Logger — Bela Orsine Beauty
 *
 * Logger centralizado e flexivel para desenvolvimento e producao.
 *
 * Desenvolvimento:
 * - Output colorido no console (legivel)
 * - Info, warns e erros em cores diferentes
 *
 * Producao:
 * - JSON estruturado (compativel com Vercel Logs, Datadog, etc)
 * - Pronto para ingestao em plataformas de observabilidade
 *
 * Integracao:
 * - Detecta AppError automaticamente (extrai code e status)
 * - Inclui timing, path, method em requisicoes HTTP
 */

import { isAppError } from "./app-error";

type LogLevel = "info" | "warn" | "error";

/**
 * Estrutura padrao de uma entrada de log.
 * Campos sao opcionais para permitir uso flexivel.
 */
interface LogEntry {
  level: LogLevel;              // Nivel do log
  code?: string;                // Codigo do erro (ex: AUTH_NOT_AUTHENTICATED)
  message: string;              // Mensagem legivel
  path?: string;                // Caminho HTTP da requisicao
  method?: string;              // Metodo HTTP (GET, POST, etc)
  status?: number;              // Status code da resposta
  duration_ms?: number;         // Tempo de execucao em ms
  details?: unknown;            // Dados adicionais (stack, contexto, etc)
  timestamp: string;            // ISO 8601 timestamp
}

/**
 * Escreve log no console (desenvolvimento) ou stdout JSON (producao).
 */
function write(entry: LogEntry) {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    // ── Desenvolvimento: output colorido e legivel ──────────
    const prefix = {
      info: "\x1b[36m[INFO]\x1b[0m",   // Cyan
      warn: "\x1b[33m[WARN]\x1b[0m",   // Yellow
      error: "\x1b[31m[ERROR]\x1b[0m", // Red
    }[entry.level];

    // Monta linha: [PREFIX] METHOD PATH (CODE) [DURATION] message
    const route = entry.method && entry.path ? ` ${entry.method} ${entry.path}` : "";
    const code = entry.code ? ` (${entry.code})` : "";
    const duration = entry.duration_ms !== undefined ? ` [${entry.duration_ms}ms]` : "";

    console.log(`${prefix}${route}${code}${duration} ${entry.message}`);

    // Detalhes em linha separada se houver
    if (entry.details) {
      console.log("  →", entry.details);
    }
  } else {
    // ── Producao: JSON estruturado ─────────────────────────
    // Compativel com Vercel Logs, Datadog, etc
    const method = entry.level === "error" ? console.error : console.log;
    method(JSON.stringify(entry));
  }
}

/**
 * Objeto logger com metodos para diferentes niveis de log.
 * Uso: logger.info(...), logger.warn(...), logger.error(...)
 */
export const logger = {
  /**
   * Log informativo (sucesso, eventos normais).
   *
   * Exemplo:
   *   logger.info("Agendamento criado", {
   *     method: "POST",
   *     path: "/api/appointments",
   *     status: 201
   *   })
   */
  info(message: string, extra?: Partial<LogEntry>) {
    write({ level: "info", message, timestamp: new Date().toISOString(), ...extra });
  },

  /**
   * Log de aviso (comportamento suspeito mas nao erro).
   *
   * Exemplo:
   *   logger.warn("Taxa de retry alta", {
   *     details: { url: "...", attempts: 5 }
   *   })
   */
  warn(message: string, extra?: Partial<LogEntry>) {
    write({ level: "warn", message, timestamp: new Date().toISOString(), ...extra });
  },

  /**
   * Log de erro com tratamento de diferentes tipos.
   * Detecta automaticamente AppError, Error, ou valores genericos.
   *
   * Exemplo:
   *   try { ... }
   *   catch (err) {
   *     logger.error(err, { method: "POST", path: "/api/..." })
   *   }
   */
  error(error: unknown, extra?: Partial<LogEntry>) {
    if (isAppError(error)) {
      // ── AppError: ja tem codigo e status ────────────────
      write({
        level: "error",
        code: error.code,
        message: error.message,
        status: error.status,
        details: error.details,
        timestamp: new Date().toISOString(),
        ...extra,
      });
    } else if (error instanceof Error) {
      // ── Error nativo: inclui stack em desenvolvimento ──
      write({
        level: "error",
        message: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        ...extra,
      });
    } else {
      // ── Outro tipo de erro: converte para string ───────
      write({
        level: "error",
        message: String(error),
        timestamp: new Date().toISOString(),
        ...extra,
      });
    }
  },
};
