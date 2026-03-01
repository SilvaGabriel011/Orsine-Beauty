/**
 * API Route: /api/store/items
 *
 * Gerencia itens disponveis na loja de recompensas.
 *
 * GET — Lista itens ativos na loja (requer autenticacao)
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";

// GET: Lista itens da loja de recompensas (requer autenticacao)
export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  // Verifica autenticacao (apenas usuarios autenticados podem ver loja)
  await requireAuth(supabase);

  // Busca itens ativos da loja, ordenados por sort_order
  const { data: items, error } = await supabase
    .from("reward_store_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new AppError("SYS_DATABASE", error.message);
  }

  return NextResponse.json({ items: items || [] });
});
