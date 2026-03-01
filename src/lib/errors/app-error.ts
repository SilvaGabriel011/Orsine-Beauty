/**
 * Modulo de Erros — Bela Orsine Beauty
 *
 * Define AppError (erro padronizado) e utilitarios relacionados.
 * Integrado com o catalogo centralizado de erros (codes.ts).
 */

import { ERROR_CATALOG, type ErrorCode } from "./codes";

/**
 * Erro customizado da aplicacao.
 * Herda de Error nativo mas com estrutura padronizada.
 *
 * Propriedades:
 * - code: Codigo do erro (ex: AUTH_NOT_AUTHENTICATED)
 * - status: HTTP status correspondente (ex: 401)
 * - message: Mensagem amigavel ao usuario
 * - details: Dados adicionais (logs/debug, nao exibidos em producao)
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
    // Busca definicao do erro no catalogo
    const def = ERROR_CATALOG[code];
    // Usa mensagem customizada ou padrao do catalogo
    super(customMessage || def.message);

    this.name = "AppError";
    this.code = code;
    this.status = def.status;
    this.details = details;
  }

  /**
   * Serializa o erro para JSON (usado em respostas HTTP).
   * Details sao inclusos apenas em desenvolvimento para debugging.
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        // Details inclusos em desenvolvimento para debugging
        ...(process.env.NODE_ENV === "development" && this.details
          ? { details: this.details }
          : {}),
      },
    };
  }
}

/**
 * Type guard para verificar se um erro eh AppError.
 * Util em catch blocks para diferenciar erros conhecidos de inesperados.
 *
 * Exemplo:
 *   try { ... }
 *   catch (err) {
 *     if (isAppError(err)) {
 *       // Erro esperado, ja tem mensagem amigavel
 *       return res.status(err.status).json(err.toJSON())
 *     } else {
 *       // Erro inesperado
 *       return res.status(500).json({ error: "Erro interno" })
 *     }
 *   }
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
