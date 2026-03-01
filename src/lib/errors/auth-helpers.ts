/**
 * Modulo de Helpers de Autenticacao — Bela Orsine Beauty
 *
 * Funcoes auxiliares para validacao de autenticacao em API routes.
 * Lancam AppError se condicoes nao sao atendidas.
 * Util para guardar rotas que requerem autenticacao/autorizacao.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "./app-error";

/**
 * Valida que usuario esta autenticado.
 * Lanca AppError(AUTH_NOT_AUTHENTICATED) se nao estiver.
 *
 * Uso em API routes:
 *   export const POST = withErrorHandler(async (request) => {
 *     const user = await requireAuth(supabase)
 *     // aqui 'user' eh garantidamente valido
 *     return NextResponse.json({ user: user.id })
 *   })
 *
 * @param supabase Cliente Supabase (servidor)
 * @returns Usuario autenticado
 * @throws AppError se nao autenticado
 */
export async function requireAuth(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError("AUTH_NOT_AUTHENTICATED");
  }

  return user;
}

/**
 * Valida que usuario eh admin.
 * Verifica role no perfil: exige "admin" para passar.
 * Lanca AppError(AUTH_NOT_AUTHORIZED) se nao for admin.
 *
 * Uso em API routes administrativas:
 *   export const DELETE = withErrorHandler(async (request) => {
 *     const admin = await requireAdmin(supabase)
 *     // aqui 'admin' eh garantidamente um usuario admin
 *     return NextResponse.json({ deleted: true })
 *   })
 *
 * @param supabase Cliente Supabase (servidor)
 * @returns Usuario autenticado com role admin
 * @throws AppError se nao autenticado ou sem role admin
 */
export async function requireAdmin(supabase: SupabaseClient) {
  // Primeiro valida que esta autenticado
  const user = await requireAuth(supabase);

  // Depois valida role no perfil
  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as unknown as { data: { role: string } | null };

  if (profile?.role !== "admin") {
    throw new AppError("AUTH_NOT_AUTHORIZED");
  }

  return user;
}
