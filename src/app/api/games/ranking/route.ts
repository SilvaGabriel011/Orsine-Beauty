/**
 * API Route: /api/games/ranking
 *
 * Obtem leaderboard de usuarios por moedas ganhas.
 *
 * GET — Retorna top 10 usuarios (semanal ou mensal) e posicao do usuario atual
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";

// GET: Obtem ranking de moedas (requer autenticacao)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const url = new URL(request.url);
  // Parametro period: "weekly" (default) ou "monthly"
  const period = url.searchParams.get("period") || "weekly";

  const adminSupabase = createAdminClient();

  // Calcula intervalo de datas baseado no period
  const now = new Date();
  let startDate: string;

  if (period === "monthly") {
    // Primeiro dia do mes atual
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  } else {
    // Weekly: comeca na segunda-feira (ou domingo se domingo)
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    startDate = monday.toISOString();
  }

  // Busca todas as moedas ganhas no periodo especificado
  const { data: rankings, error } = await adminSupabase
    .from("game_coins_history")
    .select("client_id, amount")
    .eq("type", "earned")
    .gte("created_at", startDate);

  if (error) {
    throw new AppError("SYS_DATABASE", error.message);
  }

  // Agrega moedas por cliente (somatorio)
  const totals: Record<string, number> = {};
  for (const row of rankings || []) {
    const clientId = (row as Record<string, unknown>).client_id as string;
    const amount = (row as Record<string, unknown>).amount as number;
    totals[clientId] = (totals[clientId] || 0) + amount;
  }

  // Ordena e pega top 10
  const sorted = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Busca nomes dos top 10 usuarios
  const topIds = sorted.map(([id]) => id);
  const { data: profiles } = await adminSupabase
    .from("profiles")
    .select("id, full_name")
    .in("id", topIds.length > 0 ? topIds : ["__none__"]);

  // Mapa de id -> nome para quick lookup
  const profileMap: Record<string, string> = {};
  for (const p of profiles || []) {
    const profile = p as Record<string, unknown>;
    profileMap[profile.id as string] = profile.full_name as string;
  }

  // Monta lista de ranking com posicoes
  const rankedList = sorted.map(([id, coins], index) => ({
    position: index + 1,
    client_id: id,
    name: profileMap[id] || "Anonimo",
    coins_earned: coins,
    is_current_user: id === user.id,
  }));

  // Encontra posicao do usuario atual no ranking geral
  const allSorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const userIndex = allSorted.findIndex(([id]) => id === user.id);
  const userPosition = userIndex >= 0
    ? {
        position: userIndex + 1,
        coins_earned: allSorted[userIndex][1],
      }
    : null;

  return NextResponse.json({
    rankings: rankedList,
    user_position: userPosition,
    period,
  });
});
