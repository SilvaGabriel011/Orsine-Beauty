import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { dailyCheckin } from "@/lib/gamification";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { AppError } from "@/lib/errors/app-error";

export const POST = withErrorHandler(async () => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const result = await dailyCheckin(user.id);

  if (!result.success) {
    if (result.error === "ALREADY_CHECKED_IN") {
      throw new AppError("GAME_ALREADY_CHECKED_IN");
    }
    throw new AppError("SYS_INTERNAL", result.error);
  }

  // Check achievements (non-blocking)
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
