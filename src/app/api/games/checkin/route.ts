/**
 * API Route: /api/games/checkin
 *
 * Processa check-in diario para gamificacao.
 *
 * POST — Usuario faz checkin diario (requer autenticacao)
 *        Concede moedas base + bonus streak
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { dailyCheckin } from "@/lib/gamification";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { AppError } from "@/lib/errors/app-error";

// POST: Usuario realiza checkin diario (requer autenticacao)
export const POST = withErrorHandler(async () => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  // Executa logica de checkin: valida se ja fez hoje, atualiza streak, concede moedas
  const result = await dailyCheckin(user.id);

  if (!result.success) {
    // Caso especial: usuario ja fez checkin hoje
    if (result.error === "ALREADY_CHECKED_IN") {
      throw new AppError("GAME_ALREADY_CHECKED_IN");
    }
    throw new AppError("SYS_INTERNAL", result.error);
  }

  // Verifica e premia achievments (nao-bloqueante)
  const newAchievements = await checkAndAwardAchievements(user.id, "checkin").catch(() => []);

  return NextResponse.json({
    coins_earned: result.coins_earned,
    streak: result.streak,
    bonus: result.bonus,
    base: result.base,
    new_achievements: newAchievements.map((a) => ({
      name: a.name,
      description: a.description,
      coin_reward: a.coin_reward,
    })),
  });
});
