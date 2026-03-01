import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";
import {
  playMinigame,
  getGameConfig,
  spinWheel,
  scratchCard,
  shakeResult,
} from "@/lib/gamification";
import type { WheelConfig, ScratchConfig, ShakeConfig } from "@/types/database";

const playSchema = z.object({
  type: z.enum(["wheel", "scratch", "shake"]),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();
  const parsed = playSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError("VAL_INVALID_FORMAT", "Tipo de jogo invalido");
  }

  const { type } = parsed.data;

  // Get game config
  const gameConfig = await getGameConfig(type);
  if (!gameConfig || !gameConfig.is_active) {
    throw new AppError("GAME_DISABLED");
  }

  // Calculate result server-side based on game type
  let coinsEarned = 0;
  let gameResult: Record<string, unknown> = {};

  switch (type) {
    case "wheel": {
      const config = gameConfig.config as unknown as WheelConfig;
      const { segment, index } = spinWheel(config);
      coinsEarned = segment.coins;
      gameResult = {
        segment_index: index,
        segment_label: segment.label,
        segment_coins: segment.coins,
      };
      break;
    }

    case "scratch": {
      const config = gameConfig.config as unknown as ScratchConfig;
      const { prize, grid } = scratchCard(config);
      coinsEarned = prize.coins;
      gameResult = {
        prize_label: prize.label,
        prize_coins: prize.coins,
        matching_symbols: prize.symbols,
        grid,
      };
      break;
    }

    case "shake": {
      const config = gameConfig.config as unknown as ShakeConfig;
      coinsEarned = shakeResult(config);
      gameResult = {
        coins: coinsEarned,
      };
      break;
    }
  }

  // Record play and award coins
  const result = await playMinigame(user.id, type, coinsEarned, gameResult);

  if (!result.success) {
    if (result.error === "ALREADY_PLAYED_TODAY") {
      throw new AppError("GAME_ALREADY_PLAYED");
    }
    if (result.error === "GAME_DISABLED") {
      throw new AppError("GAME_DISABLED");
    }
    throw new AppError("SYS_INTERNAL", result.error);
  }

  // Check achievements (non-blocking)
  const { checkAndAwardAchievements } = await import("@/lib/achievements");
  const newAchievements = await checkAndAwardAchievements(user.id, "game_played").catch(() => []);

  return NextResponse.json({
    coins_earned: coinsEarned,
    result: gameResult,
    new_achievements: newAchievements.map((a) => ({
      name: a.name,
      description: a.description,
      coin_reward: a.coin_reward,
    })),
  });
});
