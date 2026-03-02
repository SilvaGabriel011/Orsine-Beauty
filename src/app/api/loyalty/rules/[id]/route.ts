/**
 * API Route: /api/loyalty/rules/[id]
 *
 * Gerencia uma regra especifica de fidelidade.
 *
 * PATCH  — Atualiza regra (requer admin)
 * DELETE — Deleta regra (requer admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAdmin } from "@/lib/errors";

// PATCH: Atualiza regra de fidelidade (requer admin)
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();
  // Verifica permissao de admin
  await requireAdmin(supabase);

  const body = await request.json();

  // Atualiza campos da regra: type, points, description, is_active
  const { data, error } = await (supabase
    .from("loyalty_rules")
    .update(body)
    .eq("id", id)
    .select()
    .single()) as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_UPDATE_FAILED", error.message, error);
  }

  return NextResponse.json(data);
});

// DELETE: Deleta regra de fidelidade (requer admin)
export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();
  // Verifica permissao de admin
  await requireAdmin(supabase);

  // Deleta regra permanentemente
  const { error } = await (supabase
    .from("loyalty_rules")
    .delete()
    .eq("id", id)) as { error: any };

  if (error) {
    throw new AppError("RES_DELETE_FAILED", error.message, error);
  }

  return NextResponse.json({ success: true });
});
