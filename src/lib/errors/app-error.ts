import { ERROR_CATALOG, type ErrorCode } from "./codes";

/**
 * Erro customizado da aplicacao.
 *
 * Uso:
 *   throw new AppError("AUTH_NOT_AUTHENTICATED")
 *   throw new AppError("VAL_MISSING_FIELDS", "Nome e email sao obrigatorios")
 *   throw new AppError("RES_NOT_FOUND", "Categoria nao encontrada", { id: "abc" })
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, customMessage?: string, details?: unknown) {
    const def = ERROR_CATALOG[code];
    super(customMessage || def.message);

    this.name = "AppError";
    this.code = code;
    this.status = def.status;
    this.details = details;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(process.env.NODE_ENV === "development" && this.details
          ? { details: this.details }
          : {}),
      },
    };
  }
}

/**
 * Type guard para verificar se um erro eh AppError.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
