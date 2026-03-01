/**
 * API Route: /api/reviews/[id]
 *
 * Gerencia uma avaliacao especifica.
 *
 * PATCH — Admin aprova/rejeita avaliacao ou muda visibilidade
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAdmin } from "@/lib/errors";

// PATCH: Admin atualiza status de visibilidade da avaliacao
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();
  // Requer permissao de admin
  await requireAdmin(supabase);

  const body = await request.json();

  // Admin pode atualizar: is_visible (aprovar/rejeitar), notas internas, etc
  const { data, error } = (await (supabase.from("reviews") as any)
    .update(body)
    .eq("id", id)
    .select()
    .single()) as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_UPDATE_FAILED", error.message, error);
  }

  return NextResponse.json(data);
});
