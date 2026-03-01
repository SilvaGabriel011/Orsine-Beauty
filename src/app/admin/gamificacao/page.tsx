export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GamificacaoAdminClient } from "./gamificacao-admin-client";

export const metadata: Metadata = {
  title: "Gamificacao | Admin",
};

export default async function GamificacaoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as unknown as { data: { role: string } | null };

  if (profile?.role !== "admin") redirect("/");

  // Fetch game configs
  const { data: configs } = await supabase
    .from("game_config")
    .select("*")
    .order("game_type");

  // Fetch stats: total coins in circulation
  const { data: profiles } = await supabase
    .from("profiles")
    .select("game_coins")
    .eq("role", "client");

  const totalCoins = (profiles || []).reduce(
    (sum, p) => sum + ((p as unknown as { game_coins: number }).game_coins || 0),
    0
  );

  // Count total plays today
  const today = new Date().toISOString().split("T")[0];
  const { count: todayPlays } = await supabase
    .from("minigame_plays")
    .select("*", { count: "exact", head: true })
    .gte("played_at", `${today}T00:00:00`);

  // Count total quiz questions
  const { count: totalQuestions } = await supabase
    .from("quiz_questions")
    .select("*", { count: "exact", head: true });

  // Count achievements
  const { count: totalAchievements } = await supabase
    .from("achievements")
    .select("*", { count: "exact", head: true });

  // Top players by coins
  const { data: topPlayers } = await supabase
    .from("profiles")
    .select("id, full_name, game_coins, current_streak")
    .eq("role", "client")
    .order("game_coins", { ascending: false })
    .limit(10);

  return (
    <GamificacaoAdminClient
      configs={(configs as unknown as GameConfigRow[]) || []}
      stats={{
        totalCoinsInCirculation: totalCoins,
        todayPlays: todayPlays || 0,
        totalQuestions: totalQuestions || 0,
        totalAchievements: totalAchievements || 0,
      }}
      topPlayers={
        (topPlayers as unknown as {
          id: string;
          full_name: string;
          game_coins: number;
          current_streak: number;
        }[]) || []
      }
    />
  );
}

interface GameConfigRow {
  id: string;
  game_type: string;
  config: Record<string, unknown>;
  is_active: boolean;
  updated_at: string;
}
