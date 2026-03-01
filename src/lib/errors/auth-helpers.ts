import { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "./app-error";

/**
 * Exige que o usuario esteja autenticado. Lanca AppError se nao estiver.
 * Retorna o user autenticado.
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
 * Exige que o usuario seja admin. Lanca AppError se nao for.
 * Retorna o user autenticado.
 */
export async function requireAdmin(supabase: SupabaseClient) {
  const user = await requireAuth(supabase);

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
