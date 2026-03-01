/**
 * API Route: /api/store/my-redemptions
 *
 * Obtem historico de trocas do usuario.
 *
 * GET — Lista todas as trocas do usuario (requer autenticacao)
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";

// GET: Lista historico de trocas do usuario (requer autenticacao)
export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const adminSupabase = createAdminClient();
  // Busca trocas do usuario com informacoes do item, ordenado por mais recentes
  const { data, error } = await adminSupabase
    .from("reward_redemptions")
    .select("*, reward_store_items(name, type, image_url)")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("SYS_DATABASE", error.message);
  }

  return NextResponse.json({ redemptions: data || [] });
});
