import { toast } from "sonner";

/**
 * Estrutura padrao de erro retornada pela API.
 */
interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Resultado de uma chamada de API tratada.
 *
 * Uso com generics:
 *   const result = await handleApiResponse<Category[]>(response)
 *   if (!result.ok) return  // toast ja foi exibido
 *   console.log(result.data) // Category[]
 */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorResponse["error"] };

/**
 * Processa a resposta de uma API route e exibe toast automatico em caso de erro.
 *
 * Uso:
 *   const res = await fetch("/api/categories", { method: "POST", ... })
 *   const result = await handleApiResponse<Category>(res)
 *   if (!result.ok) return
 *   // result.data eh tipado como Category
 */
export async function handleApiResponse<T>(
  response: Response
): Promise<ApiResult<T>> {
  if (response.ok) {
    const data = await response.json();
    return { ok: true, data };
  }

  // Tenta parsear o corpo de erro padronizado
  try {
    const body = await response.json();

    // Formato novo padronizado: { error: { code, message } }
    if (body.error?.code && body.error?.message) {
      toast.error(body.error.message);
      return { ok: false, error: body.error };
    }

    // Formato legado: { error: "mensagem" }
    if (typeof body.error === "string") {
      toast.error(body.error);
      return {
        ok: false,
        error: { code: "UNKNOWN", message: body.error },
      };
    }

    // Corpo nao reconhecido
    const fallbackMsg = `Erro ${response.status}`;
    toast.error(fallbackMsg);
    return { ok: false, error: { code: "UNKNOWN", message: fallbackMsg } };
  } catch {
    // Resposta sem body parseavel
    const fallbackMsg = `Erro ${response.status}: ${response.statusText}`;
    toast.error(fallbackMsg);
    return { ok: false, error: { code: "UNKNOWN", message: fallbackMsg } };
  }
}

/**
 * Wrapper para chamadas fetch que captura erros de rede e exibe toast.
 *
 * Uso:
 *   const result = await safeFetch<Category[]>("/api/categories")
 *   if (!result.ok) return
 *   console.log(result.data)
 *
 *   const result = await safeFetch<Category>("/api/categories", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ name: "Unhas" }),
 *   })
 */
export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, options);
    return handleApiResponse<T>(response);
  } catch (error) {
    // Erro de rede (offline, DNS, timeout, etc)
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
