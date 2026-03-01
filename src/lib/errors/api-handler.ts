import { NextRequest, NextResponse } from "next/server";
import { AppError } from "./app-error";
import { logger } from "./logger";

type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Wrapper ("armadilha") para API routes.
 *
 * Captura automaticamente erros esperados (AppError) e inesperados,
 * retornando respostas padronizadas e logando tudo.
 * Includes request ID for tracing across logs.
 *
 * Uso:
 *   export const GET = withErrorHandler(async (request) => {
 *     // ... sua logica
 *     throw new AppError("AUTH_NOT_AUTHENTICATED")
 *     // ou simplesmente deixe erros inesperados borbulharem
 *   })
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const start = Date.now();
    const method = request.method;
    const path = request.nextUrl.pathname;
    const requestId = crypto.randomUUID();

    try {
      const response = await handler(request, context);

      logger.info(`${method} ${path}`, {
        method,
        path,
        status: response.status,
        duration_ms: Date.now() - start,
        details: { requestId },
      });

      // Include request ID in response headers for tracing
      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error) {
      const duration_ms = Date.now() - start;

      // ── Erro esperado (AppError) ──────────────────────────
      if (error instanceof AppError) {
        logger.error(error, { method, path, duration_ms, details: { requestId } });

        const response = NextResponse.json(
          { ...error.toJSON(), requestId },
          { status: error.status }
        );
        response.headers.set("x-request-id", requestId);
        return response;
      }

      // ── JSON invalido ─────────────────────────────────────
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

      // ── Erro inesperado (bug, infra, etc) ─────────────────
      logger.error(error, { method, path, duration_ms, details: { requestId } });

      const fallback = new AppError("SYS_INTERNAL");
      const response = NextResponse.json(
        {
          error: {
            code: fallback.code,
            message: fallback.message,
            requestId,
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
