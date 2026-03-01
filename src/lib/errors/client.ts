/**
 * Modulo de Helpers de Erro no Cliente — Bela Orsine Beauty
 *
 * Utilitarios para tratamento de erros em requisicoes fetch (lado cliente).
 * Exibe toasts automaticamente e retorna estrutura tipada.
 *
 * Uso padrao:
 * 1. const result = await safeFetch("/api/something")
 * 2. if (!result.ok) return (toast ja foi exibido)
 * 3. console.log(result.data) (tipado e seguro)
 */

import { toast } from "sonner";

/**
 * Estrutura padrao de erro retornada pelas API routes.
 * Corresponde a AppError.toJSON() do servidor.
 */
interface ApiErrorResponse {
  error: {
    code: string;     // Codigo do erro (ex: AUTH_NOT_AUTHENTICATED)
    message: string;  // Mensagem amigavel ao usuario
    details?: unknown; // Dados adicionais (debug)
  };
}

/**
 * Resultado tipado de uma chamada de API.
 * Discriminated union: permite saber o tipo sem typeof.
 *
 * Exemplo:
 *   const result = await handleApiResponse<Category[]>(response)
 *   if (result.ok) {
 *     // result.data eh Category[]
 *   } else {
 *     // result.error eh { code, message }
 *   }
 */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorResponse["error"] };

/**
 * Processa resposta HTTP e exibe toast em caso de erro.
 * Suporta multiplos formatos de erro para compatibilidade.
 *
 * Processa:
 * 1. Sucesso (2xx) → retorna { ok: true, data }
 * 2. Erro novo (4xx/5xx com { error: { code, message } }) → toast + { ok: false, error }
 * 3. Erro legado (com { error: "string" }) → toast + { ok: false, error }
 * 4. Erro desconhecido → toast generico + fallback
 *
 * Uso:
 *   const res = await fetch("/api/categories", { method: "POST", ... })
 *   const result = await handleApiResponse<Category>(res)
 *   if (!result.ok) return  // toast ja foi exibido
 *   console.log(result.data) // Category, tipado
 *
 * @param response Resposta HTTP do fetch
 * @returns ApiResult<T> tipado (ok: true/false)
 */
export async function handleApiResponse<T>(
  response: Response
): Promise<ApiResult<T>> {
  if (response.ok) {
    const data = await response.json();
    return { ok: true, data };
  }

  // ── Tenta interpretar corpo de erro ────────────────────
  try {
    const body = await response.json();

    // ── Formato novo (padronizado): { error: { code, message } } ──
    if (body.error?.code && body.error?.message) {
      toast.error(body.error.message);
      return { ok: false, error: body.error };
    }

    // ── Formato legado: { error: "string" } ──────────────────
    if (typeof body.error === "string") {
      toast.error(body.error);
      return {
        ok: false,
        error: { code: "UNKNOWN", message: body.error },
      };
    }

    // ── Corpo nao reconhecido: exibe fallback generico ────────
    const fallbackMsg = `Erro ${response.status}`;
    toast.error(fallbackMsg);
    return { ok: false, error: { code: "UNKNOWN", message: fallbackMsg } };
  } catch {
    // ── Resposta sem body ou JSON invalido ─────────────────
    const fallbackMsg = `Erro ${response.status}: ${response.statusText}`;
    toast.error(fallbackMsg);
    return { ok: false, error: { code: "UNKNOWN", message: fallbackMsg } };
  }
}

/**
 * Wrapper seguro para fetch que trata erros de rede e HTTP.
 * Combina handleApiResponse com captura de excecos de rede.
 *
 * Diferenca do fetch nativo:
 * - fetch nao lanca erro em 4xx/5xx (precisa verificar response.ok)
 * - safeFetch unifica tratamento: erros HTTP + erros de rede
 * - Exibe toast automaticamente em qualquer erro
 * - Retorna tipo seguro ApiResult<T>
 *
 * Uso (GET):
 *   const result = await safeFetch<Category[]>("/api/categories")
 *   if (!result.ok) return  // toast ja exibido
 *   console.log(result.data) // Category[], tipado
 *
 * Uso (POST):
 *   const result = await safeFetch<Category>("/api/categories", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ name: "Unhas" }),
 *   })
 *
 * @param url URL da API (relativa ou absoluta)
 * @param options Opcoes do fetch (method, headers, body, etc)
 * @returns ApiResult<T> tipado
 */
export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, options);
    return handleApiResponse<T>(response);
  } catch (error) {
    // ── Erro de rede: offline, DNS, timeout, conexao resetada ────
    // TypeError com "Failed to fetch" eh erro de rede no navegador
    const message =
      error instanceof TypeError && error.message === "Failed to fetch"
        ? "Sem conexao com o servidor. Verifique sua internet."
        : "Erro inesperado ao conectar com o servidor";

    toast.error(message);

    return {
      ok: false,
      error: { code: "NETWORK_ERROR", message },
    };
  }
}
