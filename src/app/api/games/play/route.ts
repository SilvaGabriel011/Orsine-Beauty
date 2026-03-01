/**
 * API Route: /api/games/play
 *
 * Processa jogadas de minigames (rodinha, raspadinha, shake).
 *
 * POST — Usuario joga um minigame (requer autenticacao)
 *        Logica: sorteia resultado no servidor, premia moedas, registra historico
 */

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

// Schema de validacao para tipo de jogo
const playSchema = z.object({
  type: z.enum(["wheel", "scratch", "shake"]),
});

// POST: Usuario joga minigame (requer autenticacao)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();
  const parsed = playSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError("VAL_INVALID_FORMAT", "Tipo de jogo invalido");
  }

  const { type } = parsed.data;

  // Busca configuracao do jogo
  const gameConfig = await getGameConfig(type);
  if (!gameConfig || !gameConfig.is_active) {
    throw new AppError("GAME_DISABLED");
  }

  // Calcula resultado no servidor (nunca no cliente) - evita fraude
  // Resultado varia por tipo de jogo: roda tem segmentos, raspadinha tem premos, shake e aleatorio
  let coinsEarned = 0;
  let gameResult: Record<string, unknown> = {};

  switch (type) {
    case "wheel": {
      // Roda de sorte: sorteia segmento, extrai moedas do config
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
      // Raspadinha: gera grid, encontra 3 simbolos identicos = premo
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
      // Shake (tremida): random entre min/max do config
      const config = gameConfig.config as unknown as ShakeConfig;
      coinsEarned = shakeResult(config);
      gameResult = {
        coins: coinsEarned,
      };
      break;
    }
  }

  // Registra jogada na BD e premia moedas
  const result = await playMinigame(user.id, type, coinsEarned, gameResult);

  if (!result.success) {
    // Caso especial: usuario ja jogou este jogo hoje
    if (result.error === "ALREADY_PLAYED_TODAY") {
      throw new AppError("GAME_ALREADY_PLAYED");
    }
    if (result.error === "GAME_DISABLED") {
      throw new AppError("GAME_DISABLED");
    }
    throw new AppError("SYS_INTERNAL", result.error);
  }

  // Verifica e premia achievements (nao-bloqueante)
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
