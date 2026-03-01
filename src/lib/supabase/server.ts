/**
 * Modulo de Cliente Supabase Server — Bela Orsine Beauty
 *
 * Cria cliente Supabase para uso em Server Components e API Routes.
 * Usa chave publica (ANON_KEY) com sessao do usuario a partir de cookies.
 * Middleware ou revalidacao no servidor pode refrescar tokens expirados.
 *
 * Uso em Server Component:
 *   import { createClient } from "@/lib/supabase/server"
 *   const supabase = await createClient()
 *   const { data } = await supabase.from("profiles").select()
 *
 * Uso em API Route:
 *   export const GET = withErrorHandler(async (request) => {
 *     const supabase = await createClient()
 *     const { data } = await supabase.from("profiles").select()
 *     return NextResponse.json(data)
 *   })
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Cria cliente Supabase para Server Components / API Routes.
 * Lida com sessao do usuario a partir de cookies.
 *
 * Nota: Usar em lugar de createAdminClient() quando logica requer autenticacao do usuario.
 *
 * @returns Cliente Supabase tipado com Database schema
 * @throws Error se variaveis de ambiente faltarem
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase nao configurado: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem estar definidos em .env.local"
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      // ── Lê cookies da requisicao ────────────────────────────
      getAll() {
        return cookieStore.getAll();
      },
      // ── Escreve cookies na resposta (para refresh token) ────────
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // ── Erro ao settar cookie em Server Component ───────
          // Pode ser ignorado se middleware faz revalidacao
          // (middleware roda novamente para refrescar token)
        }
      },
    },
  });
}
