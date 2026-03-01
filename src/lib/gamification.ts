import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/errors/logger";
import type {
  GameType,
  PlayerGameStats,
  WheelConfig,
  WheelSegment,
  ScratchConfig,
  ShakeConfig,
} from "@/types/database";

// ── Check-in diario ─────────────────────────────────────────

export interface CheckinResult {
  success: boolean;
  coins_earned: number;
  streak: number;
  bonus: number;
  base: number;
  error?: string;
}

export async function dailyCheckin(clientId: string): Promise<CheckinResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("daily_checkin", {
    p_client_id: clientId,
  });

  if (error) {
    logger.error(error, { message: "daily_checkin RPC failed" });
    return { success: false, coins_earned: 0, streak: 0, bonus: 0, base: 0, error: error.message };
  }

  const result = data as CheckinResult | null;
  if (!result) {
    return { success: false, coins_earned: 0, streak: 0, bonus: 0, base: 0, error: "NO_RESULT" };
  }

  return result;
}

// ── Play minigame ───────────────────────────────────────────

export interface PlayResult {
  success: boolean;
  coins_earned: number;
  result: Record<string, unknown>;
  error?: string;
}

export async function playMinigame(
  clientId: string,
  gameType: GameType,
  coinsEarned: number,
  result: Record<string, unknown> = {}
): Promise<PlayResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("play_minigame", {
    p_client_id: clientId,
    p_game_type: gameType,
    p_coins_earned: coinsEarned,
    p_result: result,
  });

  if (error) {
    logger.error(error, { message: "play_minigame RPC failed" });
    return { success: false, coins_earned: 0, result: {}, error: error.message };
  }

  const res = data as PlayResult | null;
  if (!res) {
    return { success: false, coins_earned: 0, result: {}, error: "NO_RESULT" };
  }

  return res;
}

// ── Player stats ────────────────────────────────────────────

export async function getPlayerStats(clientId: string): Promise<PlayerGameStats | null> {
  const supabase = createAdminClient();

  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("game_coins, current_streak, longest_streak, last_checkin_date")
    .eq("id", clientId)
    .single();

  if (profileError || !profile) {
    logger.error(profileError ?? new Error("No profile"), { message: "getPlayerStats failed" });
    return null;
  }

  // Get today's plays
  const today = new Date().toISOString().split("T")[0];
  const { data: plays } = await supabase
    .from("minigame_plays")
    .select("game_type")
    .eq("client_id", clientId)
    .gte("played_at", `${today}T00:00:00`)
    .lt("played_at", `${today}T23:59:59.999`);

  const todayPlays: Record<GameType, boolean> = {
    checkin: false,
    wheel: false,
    scratch: false,
    quiz: false,
    shake: false,
  };

  if (plays) {
    for (const play of plays) {
      todayPlays[play.game_type as GameType] = true;
    }
  }

  return {
    game_coins: (profile as Record<string, unknown>).game_coins as number,
    current_streak: (profile as Record<string, unknown>).current_streak as number,
    longest_streak: (profile as Record<string, unknown>).longest_streak as number,
    last_checkin_date: (profile as Record<string, unknown>).last_checkin_date as string | null,
    today_plays: todayPlays,
  };
}

// ── Game configs ────────────────────────────────────────────

export async function getGameConfig<T = Record<string, unknown>>(
  gameType: GameType
): Promise<{ config: T; is_active: boolean } | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("game_config")
    .select("config, is_active")
    .eq("game_type", gameType)
    .single();

  if (error || !data) return null;

  return {
    config: (data as Record<string, unknown>).config as T,
    is_active: (data as Record<string, unknown>).is_active as boolean,
  };
}

// ── Wheel logic (server-side result) ────────────────────────

export function spinWheel(config: WheelConfig): { segment: WheelSegment; index: number } {
  const totalWeight = config.segments.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < config.segments.length; i++) {
    random -= config.segments[i].weight;
    if (random <= 0) {
      return { segment: config.segments[i], index: i };
    }
  }

  // Fallback to last segment
  return {
    segment: config.segments[config.segments.length - 1],
    index: config.segments.length - 1,
  };
}

// ── Scratch logic (server-side result) ──────────────────────

export function scratchCard(config: ScratchConfig): {
  prize: ScratchConfig["prizes"][0];
  grid: string[][];
} {
  // Pick prize based on weights
  const totalWeight = config.prizes.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  let selectedPrize = config.prizes[config.prizes.length - 1];

  for (const prize of config.prizes) {
    random -= prize.weight;
    if (random <= 0) {
      selectedPrize = prize;
      break;
    }
  }

  // Generate 3x3 grid based on matching symbols needed
  const symbols = config.symbol_options;
  const grid: string[][] = [];
  const winSymbol = symbols[Math.floor(Math.random() * symbols.length)];

  // Place the required number of matching symbols
  const positions: number[] = [];
  for (let i = 0; i < 9; i++) positions.push(i);

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  const flatGrid: string[] = new Array(9);

  // Place matching symbols
  for (let i = 0; i < Math.min(selectedPrize.symbols, 9); i++) {
    flatGrid[positions[i]] = winSymbol;
  }

  // Fill rest with other symbols
  const otherSymbols = symbols.filter((s) => s !== winSymbol);
  for (let i = selectedPrize.symbols; i < 9; i++) {
    flatGrid[positions[i]] = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
  }

  // Convert to 3x3 grid
  for (let row = 0; row < 3; row++) {
    grid.push(flatGrid.slice(row * 3, row * 3 + 3));
  }

  return { prize: selectedPrize, grid };
}

// ── Shake logic (server-side result) ────────────────────────

export function shakeResult(config: ShakeConfig): number {
  const totalWeight = config.weights.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const w of config.weights) {
    random -= w.weight;
    if (random <= 0) {
      const [min, max] = w.range;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  }

  return config.min_coins;
}

// ── Coin history ────────────────────────────────────────────

export async function getCoinHistory(
  clientId: string,
  limit: number = 50,
  offset: number = 0
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("game_coins_history")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error(error, { message: "getCoinHistory failed" });
    return [];
  }

  return data || [];
}
