/**
 * API Route: /api/loyalty/adjust
 *
 * Ajuste manual de pontos de fidelidade (admin).
 *
 * POST — Admin adiciona/subtrai pontos manualmente de cliente
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppError, withErrorHandler, requireAdmin } from "@/lib/errors";

// POST: Admin ajusta pontos manualmente (requer admin) - registra no historico
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  // Verifica permissao de admin
  await requireAdmin(supabase);

  const body = await request.json();
  const { client_id, points, description } = body;

  // Validacao: cliente_id obrigatorio e points diferente de zero
  if (!client_id || points === undefined || points === 0) {
    throw new AppError("VAL_MISSING_FIELDS", "client_id e points sao obrigatorios");
  }

  const adminSupabase = createAdminClient();

  // Busca saldo atual do cliente
  const { data: clientProfile } = (await (adminSupabase
    .from("profiles") as any)
    .select("loyalty_points")
    .eq("id", client_id)
    .single()) as { data: { loyalty_points: number } | null };

  if (!clientProfile) {
    throw new AppError("RES_NOT_FOUND", "Cliente nao encontrado");
  }

  // Calcula novo saldo: nao permite negativo
  const newPoints = Math.max(0, (clientProfile.loyalty_points || 0) + points);

  // Atualiza saldo do cliente
  await (adminSupabase.from("profiles") as any)
    .update({ loyalty_points: newPoints })
    .eq("id", client_id);

  // Registra operacao no historico para auditoria
  await (adminSupabase.from("loyalty_history") as any).insert({
    client_id,
    type: points > 0 ? "adjustment_add" : "adjustment_remove",
    points,
    description: description || `Ajuste manual pelo admin`,
  });

  return NextResponse.json({ loyalty_points: newPoints });
});
