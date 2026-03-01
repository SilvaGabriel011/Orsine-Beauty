/**
 * API Route: /api/admin/gamificacao/adjust-coins
 *
 * Ajuste manual de moedas de gamificacao (admin).
 *
 * POST — Admin credita/debita moedas de usuario com motivo auditavel
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAdmin } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";

// Schema de validacao para ajuste
const adjustSchema = z.object({
  client_id: z.string().uuid(),
  amount: z.number().int().refine((n) => n !== 0, "Valor nao pode ser zero"),
  reason: z.string().optional().default("Ajuste manual pelo admin"),
});

// POST: Admin ajusta moedas do usuario (requer admin)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  // Verifica permissao de admin
  await requireAdmin(supabase);

  const body = await request.json();
  const parsed = adjustSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError("VAL_INVALID_FORMAT");
  }

  const { client_id, amount, reason } = parsed.data;
  const adminSupabase = createAdminClient();

  if (amount > 0) {
    // Credita moedas (positive amount)
    const { data, error } = await adminSupabase.rpc("award_game_coins", {
      p_client_id: client_id,
      p_amount: amount,
      p_source: "admin",
      p_description: reason,
      p_metadata: {},
    });

    if (error) {
      throw new AppError("SYS_INTERNAL", error.message);
    }

    const result = data as unknown as { success: boolean; error?: string };
    if (!result?.success) {
      throw new AppError("SYS_INTERNAL", result?.error);
    }
  } else {
    // Debita moedas (negative amount)
    const { data, error } = await adminSupabase.rpc("spend_game_coins", {
      p_client_id: client_id,
      p_amount: Math.abs(amount),
      p_source: "admin",
      p_description: reason,
    });

    if (error) {
      throw new AppError("SYS_INTERNAL", error.message);
    }

    const result = data as unknown as { success: boolean; error?: string };
    if (!result?.success) {
      // Validacao: usuario nao pode ter saldo negativo
      if (result?.error === "INSUFFICIENT_COINS") {
        throw new AppError("GAME_INSUFFICIENT_COINS");
      }
      throw new AppError("SYS_INTERNAL", result?.error);
    }
  }

  return NextResponse.json({ success: true });
});
