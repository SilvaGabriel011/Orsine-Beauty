import { createAdminClient } from "@/lib/supabase/admin";
import type { Achievement } from "@/types/database";

export type AchievementEvent =
  | "checkin"
  | "game_played"
  | "reward_redeemed"
  | "review_submitted"
  | "appointment_completed";

/**
 * Check and award achievements after an event.
 * Returns newly unlocked achievements (if any).
 */
export async function checkAndAwardAchievements(
  clientId: string,
  event: AchievementEvent
): Promise<Achievement[]> {
  const supabase = createAdminClient();

  // Get all active achievements
  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("*")
    .eq("is_active", true);

  if (!allAchievements || allAchievements.length === 0) return [];

  // Get user's already unlocked achievements
  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("client_id", clientId);

  const unlockedSet = new Set(
    (unlocked || []).map((u) => (u as unknown as { achievement_id: string }).achievement_id)
  );

  // Filter to only check relevant, not-yet-unlocked achievements
  const candidates = (allAchievements as unknown as Achievement[]).filter(
    (a) => !unlockedSet.has(a.id) && isRelevantToEvent(a, event)
  );

  if (candidates.length === 0) return [];

  // Get user stats for condition checking
  const stats = await getUserStats(clientId);
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of candidates) {
    if (isConditionMet(achievement, stats)) {
      // Award achievement
      const { error: insertError } = await supabase
        .from("user_achievements")
        .insert({ client_id: clientId, achievement_id: achievement.id });

      if (insertError) {
        // Already unlocked (race condition) or other error
        continue;
      }

      // Award coin reward
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

function isRelevantToEvent(achievement: Achievement, event: AchievementEvent): boolean {
  const eventToConditions: Record<AchievementEvent, string[]> = {
    checkin: ["streak_days", "total_games", "all_games_in_day"],
    game_played: ["total_games", "all_games_in_day", "wheel_jackpot", "total_coins_earned"],
    reward_redeemed: ["total_redeems"],
    review_submitted: ["total_reviews"],
    appointment_completed: ["total_appointments"],
  };

  return eventToConditions[event]?.includes(achievement.condition_type) ?? false;
}

interface UserStats {
  current_streak: number;
  longest_streak: number;
  total_games_played: number;
  total_reviews: number;
  total_completed_appointments: number;
  total_redeems: number;
  total_coins_earned: number;
  all_games_today: boolean;
  max_wheel_coins: number;
}

async function getUserStats(clientId: string): Promise<UserStats> {
  const supabase = createAdminClient();

  // Get profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak, longest_streak, total_completed, game_coins")
    .eq("id", clientId)
    .single();

  const p = (profile || {}) as Record<string, unknown>;

  // Total games played
  const { count: totalGames } = await supabase
    .from("minigame_plays")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);

  // Total reviews
  const { count: totalReviews } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);

  // Total redeems (from reward store)
  const { count: totalRedeems } = await supabase
    .from("reward_redemptions")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .neq("status", "cancelled");

  // Check all games played today
  const today = new Date().toISOString().split("T")[0];
  const { data: todayPlays } = await supabase
    .from("minigame_plays")
    .select("game_type")
    .eq("client_id", clientId)
    .gte("played_at", `${today}T00:00:00`)
    .lt("played_at", `${today}T23:59:59.999`);

  const todayTypes = new Set((todayPlays || []).map((p) => (p as unknown as { game_type: string }).game_type));
  const allGamesToday = ["checkin", "wheel", "scratch", "quiz", "shake"].every((g) => todayTypes.has(g));

  // Total coins earned
  const { data: coinSums } = await supabase
    .from("game_coins_history")
    .select("amount")
    .eq("client_id", clientId)
    .eq("type", "earned");

  const totalCoinsEarned = (coinSums || []).reduce(
    (sum, row) => sum + ((row as unknown as { amount: number }).amount || 0),
    0
  );

  // Max wheel win
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
      return stats.max_wheel_coins >= 50; // 50 is the jackpot in default config
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
