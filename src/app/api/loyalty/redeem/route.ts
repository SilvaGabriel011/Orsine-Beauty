/**
 * API Route: /api/loyalty/redeem
 *
 * Processa resgate de pontos de fidelidade.
 *
 * POST — Cliente resgata pontos segundo uma regra (desconto, brinde, etc)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redeemLoyaltyPoints } from "@/lib/loyalty";
import { AppError, withErrorHandler, requireAuth } from "@/lib/errors";
import { z } from "zod";

// Padrao de validacao para UUID
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Schema de validacao para resgate de pontos
const redeemSchema = z.object({
  rule_id: z.string().regex(uuidRegex, "rule_id invalido"),
  appointment_id: z.string().regex(uuidRegex, "appointment_id invalido").optional().nullable(),
});

// POST: Cliente resgata pontos (requer autenticacao) - valida saldo e regra
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();

  // Validacao com Zod: rule_id e appointment_id opcional
  const parsed = redeemSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || "Dados invalidos";
    throw new AppError("VAL_INVALID_FORMAT", firstError);
  }

  const { rule_id, appointment_id } = parsed.data;

  // Executa logica de resgate: desce pontos, aplica desconto/brinde
  const result = await redeemLoyaltyPoints(
    user.id,
    rule_id,
    appointment_id ?? undefined
  );

  if (!result) {
    throw new AppError("LOY_INSUFFICIENT_POINTS");
  }

  return NextResponse.json(result);
});
