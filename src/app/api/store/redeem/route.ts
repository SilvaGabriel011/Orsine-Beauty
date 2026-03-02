/**
 * API Route: /api/store/redeem
 *
 * Processa troca de moedas por itens da loja.
 *
 * POST — Usuario resgata moedas para comprar item (requer autenticacao)
 *        Logica: valida saldo, deduz moedas (atomicamente), cria registro de troca
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";

// Schema de validacao para resgate
const redeemSchema = z.object({
  item_id: z.string().uuid(),
});

// POST: Usuario resgata moedas por item (requer autenticacao)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();
  const parsed = redeemSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError("VAL_INVALID_FORMAT");
  }

  const { item_id } = parsed.data;
  const adminSupabase = createAdminClient();

  // Executa resgate atomicamente via RPC (coins + estoque + redemption em uma transacao)
  const { data: redeemResult, error: redeemError } = await adminSupabase.rpc("redeem_store_item", {
    p_client_id: user.id,
    p_item_id: item_id,
  });

  if (redeemError) {
    throw new AppError("SYS_INTERNAL", redeemError.message);
  }

  const result = redeemResult as {
    success: boolean;
    error?: string;
    redemption_id?: string;
    remaining_coins?: number;
    item_type?: string;
  };

  if (!result.success) {
    switch (result.error) {
      case "ITEM_NOT_FOUND":
        throw new AppError("GAME_ITEM_NOT_FOUND");
      case "OUT_OF_STOCK":
        throw new AppError("GAME_ITEM_OUT_OF_STOCK");
      case "INSUFFICIENT_COINS":
        throw new AppError("GAME_INSUFFICIENT_COINS");
      default:
        throw new AppError("SYS_INTERNAL", result.error);
    }
  }

  // Verifica e premia achievements (nao-bloqueante)
  const { checkAndAwardAchievements } = await import("@/lib/achievements");
  const newAchievements = await checkAndAwardAchievements(user.id, "reward_redeemed").catch(() => []);

  return NextResponse.json({
    success: true,
    redemption_id: result.redemption_id,
    remaining_coins: result.remaining_coins,
    item_type: result.item_type,
    new_achievements: newAchievements.map((a) => ({
      name: a.name,
      description: a.description,
      coin_reward: (a as { coin_reward?: number }).coin_reward,
    })),
  });
});
