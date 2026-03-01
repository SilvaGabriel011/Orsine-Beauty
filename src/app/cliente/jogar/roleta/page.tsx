import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RoletaClient } from "./roleta-client";

export const metadata = {
  title: "Roleta da Sorte | Bela Orsine Beauty",
  description: "Gire a roleta e ganhe moedas!",
};

export default async function RoletaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirect=/cliente/jogar/roleta");

  // Get game coins
  const { data: profile } = await supabase
    .from("profiles")
    .select("game_coins")
    .eq("id", user.id)
    .single();

  // Check if already played today
  const today = new Date().toISOString().split("T")[0];
  const { data: todayPlay } = await supabase
    .from("minigame_plays")
    .select("id")
    .eq("client_id", user.id)
    .eq("game_type", "wheel")
    .gte("played_at", `${today}T00:00:00`)
    .lt("played_at", `${today}T23:59:59.999`)
    .limit(1);

  // Get wheel config
  const { data: gameConfig } = await supabase
    .from("game_config")
    .select("config, is_active")
    .eq("game_type", "wheel")
    .single();

  const config = gameConfig as unknown as {
    config: {
      segments: Array<{ label: string; coins: number; weight: number; color: string }>;
    };
    is_active: boolean;
  } | null;

  const segments = config?.config?.segments || [
    { label: "5 moedas", coins: 5, weight: 25, color: "#f43f5e" },
    { label: "10 moedas", coins: 10, weight: 25, color: "#ec4899" },
    { label: "2 moedas", coins: 2, weight: 25, color: "#f43f5e" },
    { label: "15 moedas", coins: 15, weight: 25, color: "#ec4899" },
  ];

  return (
    <RoletaClient
      segments={segments}
      initialCoins={((profile as unknown as { game_coins: number })?.game_coins) ?? 0}
      alreadyPlayed={!!(todayPlay && todayPlay.length > 0)}
      gameDisabled={config?.is_active === false}
    />
  );
}
