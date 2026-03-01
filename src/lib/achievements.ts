/**
 * Modulo de Conquistas — Bela Orsine Beauty
 *
 * Sistema de badges e recompensas desbloqueadas por milestones.
 * Conquistas sao condicoes baseadas em eventos (check-in, jogos, reviews, etc).
 * Cada conquista pode premiear moedas de gamificacao.
 *
 * Tipos de condicoes:
 * - streak_days: X dias de streak
 * - total_games: Y jogos totais
 * - all_games_in_day: Jogar todos os 5 minigames em um dia
 * - wheel_jackpot: Ganhar 50+ moedas em um giro da roleta
 * - total_redeems: Z resgates de pontos fidelidade
 * - total_reviews: W avaliacoes postadas
 * - total_appointments: V agendamentos completados
 * - total_coins_earned: U moedas totais ganhas
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { Achievement } from "@/types/database";

export type AchievementEvent =
  | "checkin"
  | "game_played"
  | "reward_redeemed"
  | "review_submitted"
  | "appointment_completed";

/**
 * Verifica e premia conquistas apos um evento.
 * Busca todas as conquistas ativas, identifica as nao desbloqueadas ainda,
 * valida as condicoes contra as estatisticas do jogador e premia as novas.
 *
 * Retorna lista de conquistas recentemente desbloqueadas.
 */
export async function checkAndAwardAchievements(
  clientId: string,
  event: AchievementEvent
): Promise<Achievement[]> {
  const supabase = createAdminClient();

  // ── Busca todas as conquistas ativas ──────────────────────
  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("*")
    .eq("is_active", true);

  if (!allAchievements || allAchievements.length === 0) return [];

  // ── Identifica conquistas ja desbloqueadas ────────────────
  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("client_id", clientId);

  const unlockedSet = new Set(
    (unlocked || []).map((u) => (u as unknown as { achievement_id: string }).achievement_id)
  );

  // ── Filtra candidatas: nao desbloqueadas + relevantes ao evento ──
  // Relevancia eh determinada por isRelevantToEvent (ex: evento "checkin"
  // so verifica conquistas baseadas em streak, jogos totais, etc)
  const candidates = (allAchievements as unknown as Achievement[]).filter(
    (a) => !unlockedSet.has(a.id) && isRelevantToEvent(a, event)
  );

  if (candidates.length === 0) return [];

  // ── Carrega estatisticas do jogador para validacao ────────
  const stats = await getUserStats(clientId);
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of candidates) {
    if (isConditionMet(achievement, stats)) {
      // ── Registra a conquista como desbloqueada ────────────
      const { error: insertError } = await supabase
        .from("user_achievements")
        .insert({ client_id: clientId, achievement_id: achievement.id });

      if (insertError) {
        // Pode ser race condition ou erro do banco — ignora
        continue;
      }

      // ── Premia moedas se configurado ──────────────────────
      if (achievement.coin_reward > 0) {
        await supabase.rpc("award_game_coins", {
          p_client_id: clientId,
          p_amount: achievement.coin_reward,
          p_source: "achievement",
          p_description: `Conquista: ${achievement.name}`,
          p_metadata: { achievement_id: achievement.id, achievement_slug: achievement.slug },
        });
      }

      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

/**
 * Determina se uma conquista eh relevante para um evento especifico.
 * Evita verificar conquistas que nao podem ser desbloqueadas por esse evento.
 *
 * Exemplo: evento "checkin" so verifica conquistas de streak e total_games.
 */
function isRelevantToEvent(achievement: Achievement, event: AchievementEvent): boolean {
  // Mapa de eventos → tipos de condicoes relevantes
  const eventToConditions: Record<AchievementEvent, string[]> = {
    checkin: ["streak_days", "total_games", "all_games_in_day"],
    game_played: ["total_games", "all_games_in_day", "wheel_jackpot", "total_coins_earned"],
    reward_redeemed: ["total_redeems"],
    review_submitted: ["total_reviews"],
    appointment_completed: ["total_appointments"],
  };

  return eventToConditions[event]?.includes(achievement.condition_type) ?? false;
}

/**
 * Estatisticas agregadas do jogador para validacao de conquistas.
 * Inclui totais de eventos e status de hoje.
 */
interface UserStats {
  current_streak: number;              // Dias seguidos de check-in
  longest_streak: number;              // Maior streak ja alcancado
  total_games_played: number;          // Total de minigames jogados (todos os tempos)
  total_reviews: number;               // Total de avaliacoes postadas
  total_completed_appointments: number; // Total de agendamentos finalizados
  total_redeems: number;               // Total de resgates de fidelidade (nao cancelados)
  total_coins_earned: number;          // Total de moedas ganhas em todos os minigames
  all_games_today: boolean;            // True se os 5 minigames foram jogados hoje
  max_wheel_coins: number;             // Maior premio em um giro da roleta
}

/**
 * Carrega estatisticas agregadas do jogador a partir de multiplas tabelas.
 * Usa COUNT queries e agregacoes para otimizar a busca.
 */
async function getUserStats(clientId: string): Promise<UserStats> {
  const supabase = createAdminClient();

  // ── Carrega dados de streaks do perfil ────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak, longest_streak, total_completed, game_coins")
    .eq("id", clientId)
    .single();

  const p = (profile || {}) as Record<string, unknown>;

  // ── Conta total de jogos (todos os tipos, todos os tempos) ──
  const { count: totalGames } = await supabase
    .from("minigame_plays")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);

  // ── Conta avaliacoes postadas ──────────────────────────────
  const { count: totalReviews } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);

  // ── Conta resgates de fidelidade (nao cancelados) ──────────
  const { count: totalRedeems } = await supabase
    .from("reward_redemptions")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .neq("status", "cancelled");

  // ── Verifica se todos os 5 minigames foram jogados hoje ──
  const today = new Date().toISOString().split("T")[0];
  const { data: todayPlays } = await supabase
    .from("minigame_plays")
    .select("game_type")
    .eq("client_id", clientId)
    .gte("played_at", `${today}T00:00:00`)
    .lt("played_at", `${today}T23:59:59.999`);

  const todayTypes = new Set((todayPlays || []).map((p) => (p as unknown as { game_type: string }).game_type));
  const allGamesToday = ["checkin", "wheel", "scratch", "quiz", "shake"].every((g) => todayTypes.has(g));

  // ── Soma total de moedas ganhas ────────────────────────────
  const { data: coinSums } = await supabase
    .from("game_coins_history")
    .select("amount")
    .eq("client_id", clientId)
    .eq("type", "earned");

  const totalCoinsEarned = (coinSums || []).reduce(
    (sum, row) => sum + ((row as unknown as { amount: number }).amount || 0),
    0
  );

  // ── Maior premio em um giro da roleta ──────────────────────
  const { data: wheelPlays } = await supabase
    .from("minigame_plays")
    .select("coins_earned")
    .eq("client_id", clientId)
    .eq("game_type", "wheel")
    .order("coins_earned", { ascending: false })
    .limit(1);

  const maxWheelCoins = wheelPlays && wheelPlays.length > 0
    ? (wheelPlays[0] as unknown as { coins_earned: number }).coins_earned
    : 0;

  return {
    current_streak: (p.current_streak as number) || 0,
    longest_streak: Math.max((p.longest_streak as number) || 0, (p.current_streak as number) || 0),
    total_games_played: totalGames || 0,
    total_reviews: totalReviews || 0,
    total_completed_appointments: (p.total_completed as number) || 0,
    total_redeems: totalRedeems || 0,
    total_coins_earned: totalCoinsEarned,
    all_games_today: allGamesToday,
    max_wheel_coins: maxWheelCoins,
  };
}

/**
 * Valida se uma conquista foi desbloqueada baseado em suas condicoes.
 * Cada tipo de condicao tem uma logica diferente.
 *
 * Tipos suportados:
 * - streak_days: Verifica longest_streak >= dias_requeridos
 * - total_games: Verifica total_games_played >= count_requerido
 * - all_games_in_day: Verifica se todos os 5 minigames foram jogados hoje
 * - wheel_jackpot: Verifica se max_wheel_coins >= 50 moedas
 * - total_redeems: Verifica total_redeems >= count_requerido
 * - total_reviews: Verifica total_reviews >= count_requerido
 * - total_appointments: Verifica total_completed_appointments >= count_requerido
 * - total_coins_earned: Verifica total_coins_earned >= amount_requerido
 */
function isConditionMet(achievement: Achievement, stats: UserStats): boolean {
  const condValue = achievement.condition_value as Record<string, unknown>;

  switch (achievement.condition_type) {
    case "streak_days": {
      const required = (condValue.days as number) || 0;
      return stats.longest_streak >= required;
    }
    case "total_games": {
      const required = (condValue.count as number) || 0;
      return stats.total_games_played >= required;
    }
    case "all_games_in_day": {
      return stats.all_games_today;
    }
    case "wheel_jackpot": {
      // Jackpot e considerado 50 moedas ou mais em um giro
      return stats.max_wheel_coins >= 50;
    }
    case "total_redeems": {
      const required = (condValue.count as number) || 0;
      return stats.total_redeems >= required;
    }
    case "total_reviews": {
      const required = (condValue.count as number) || 0;
      return stats.total_reviews >= required;
    }
    case "total_appointments": {
      const required = (condValue.count as number) || 0;
      return stats.total_completed_appointments >= required;
    }
    case "total_coins_earned": {
      const required = (condValue.amount as number) || 0;
      return stats.total_coins_earned >= required;
    }
    default:
      return false;
  }
}
