import { isAppError } from "./app-error";

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  code?: string;
  message: string;
  path?: string;
  method?: string;
  status?: number;
  duration_ms?: number;
  details?: unknown;
  timestamp: string;
}

/**
 * Logger centralizado.
 *
 * Em desenvolvimento: console colorido.
 * Em producao: JSON estruturado (pronto para ingestao em Vercel Logs, Datadog, etc.).
 */
function write(entry: LogEntry) {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    const prefix = {
      info: "\x1b[36m[INFO]\x1b[0m",
      warn: "\x1b[33m[WARN]\x1b[0m",
      error: "\x1b[31m[ERROR]\x1b[0m",
    }[entry.level];

    const route = entry.method && entry.path ? ` ${entry.method} ${entry.path}` : "";
    const code = entry.code ? ` (${entry.code})` : "";
    const duration = entry.duration_ms !== undefined ? ` [${entry.duration_ms}ms]` : "";

    console.log(`${prefix}${route}${code}${duration} ${entry.message}`);

    if (entry.details) {
      console.log("  →", entry.details);
    }
  } else {
    // JSON estruturado para producao
    const method = entry.level === "error" ? console.error : console.log;
    method(JSON.stringify(entry));
  }
}

export const logger = {
  info(message: string, extra?: Partial<LogEntry>) {
    write({ level: "info", message, timestamp: new Date().toISOString(), ...extra });
  },

  warn(message: string, extra?: Partial<LogEntry>) {
    write({ level: "warn", message, timestamp: new Date().toISOString(), ...extra });
  },

  error(error: unknown, extra?: Partial<LogEntry>) {
    if (isAppError(error)) {
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
      write({
        level: "error",
        message: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        ...extra,
      });
    } else {
      write({
        level: "error",
        message: String(error),
        timestamp: new Date().toISOString(),
        ...extra,
      });
    }
  },
};
