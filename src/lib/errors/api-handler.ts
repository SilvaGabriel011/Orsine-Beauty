/**
 * Modulo de Handler de Erros para API Routes — Bela Orsine Beauty
 *
 * Wrapper centralizado que:
 * 1. Captura todos os erros (AppError e inesperados)
 * 2. Registra em log com request ID para rastreamento
 * 3. Retorna respostas HTTP padronizadas
 * 4. Inclui debug info em desenvolvimento
 *
 * Garante que toda API route retorna estrutura consistente de erro:
 * {
 *   error: {
 *     code: "AUTH_NOT_AUTHENTICATED",
 *     message: "Faca login para continuar",
 *     requestId: "uuid"
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { AppError } from "./app-error";
import { logger } from "./logger";

type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Wrapper para API routes que trata erros automaticamente.
 * Similar a try/catch global para requisicoes HTTP.
 *
 * Processa:
 * 1. Executa handler
 * 2. Log sucesso com timing
 * 3. Captura erros esperados (AppError) → resposta padronizada
 * 4. Captura JSON invalido → resposta 400
 * 5. Captura erros inesperados → resposta 500 com debug info em dev
 *
 * Uso:
 *   export const GET = withErrorHandler(async (request) => {
 *     const user = await requireAuth(supabase)
 *     throw new AppError("AUTH_NOT_AUTHENTICATED") // sera interceptado
 *     return NextResponse.json({ data: [] })
 *   })
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    // ── Inicia timing e extrai informacoes da requisicao ───
    const start = Date.now();
    const method = request.method;
    const path = request.nextUrl.pathname;
    // UUID unico por requisicao para rastreamento em logs
    const requestId = crypto.randomUUID();

    try {
      // ── Executa handler original ───────────────────────────
      const response = await handler(request, context);

      // ── Log de sucesso com timing ──────────────────────────
      logger.info(`${method} ${path}`, {
        method,
        path,
        status: response.status,
        duration_ms: Date.now() - start,
        details: { requestId },
      });

      // ── Adiciona request ID no header para rastreamento ────
      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error) {
      const duration_ms = Date.now() - start;

      // ── Erro esperado: AppError (lancado por logica) ───────
      if (error instanceof AppError) {
        logger.error(error, { method, path, duration_ms, details: { requestId } });

        const response = NextResponse.json(
          { ...error.toJSON(), requestId },
          { status: error.status }
        );
        response.headers.set("x-request-id", requestId);
        return response;
      }

      // ── JSON invalido no body ──────────────────────────────
      // SyntaxError de parse com texto "JSON" na mensagem
      if (
        error instanceof SyntaxError &&
        error.message.includes("JSON")
      ) {
        const appError = new AppError("SYS_INVALID_JSON");
        logger.error(appError, { method, path, duration_ms, details: { requestId } });

        const response = NextResponse.json(
          { ...appError.toJSON(), requestId },
          { status: appError.status }
        );
        response.headers.set("x-request-id", requestId);
        return response;
      }

      // ── Erro inesperado (bugs, erros de infraestrutura) ────
      // Loga o erro completo para investigacao
      logger.error(error, { method, path, duration_ms, details: { requestId } });

      // Responde com mensagem generico ao usuario
      const fallback = new AppError("SYS_INTERNAL");
      const response = NextResponse.json(
        {
          error: {
            code: fallback.code,
            message: fallback.message,
            requestId,
            // Debug info incluido apenas em desenvolvimento
            ...(process.env.NODE_ENV === "development" && error instanceof Error
              ? { _debug: error.message, _stack: error.stack }
              : {}),
          },
        },
        { status: 500 }
      );
      response.headers.set("x-request-id", requestId);
      return response;
    }
  };
}
