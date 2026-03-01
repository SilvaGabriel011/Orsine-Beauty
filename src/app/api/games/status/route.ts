/**
 * API Route: /api/games/status
 *
 * Obtem status/estatisticas do usuario em jogos e gamificacao.
 *
 * GET — Retorna moedas, streak, historico de checkin, quais jogos ja jogou hoje
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { getPlayerStats } from "@/lib/gamification";

// GET: Obtem estatisticas de gamificacao do usuario (requer autenticacao)
export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  // Busca stats: moedas, streak, ultima data de checkin, quais jogos já jogou hoje
  const stats = await getPlayerStats(user.id);

  // Caso usuario novo (sem stats), retorna defaults
  if (!stats) {
    return NextResponse.json({
      game_coins: 0,
      current_streak: 0,
      longest_streak: 0,
      last_checkin_date: null,
      today_plays: {
        checkin: false,
        wheel: false,
        scratch: false,
        quiz: false,
        shake: false,
      },
    });
  }

  return NextResponse.json(stats);
});
