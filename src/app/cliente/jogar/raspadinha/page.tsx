import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RaspadinhaClient } from "./raspadinha-client";

export const metadata = {
  title: "Raspadinha | Bela Orsine Beauty",
  description: "Raspe e descubra seu premio!",
};

export default async function RaspadinhaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirect=/cliente/jogar/raspadinha");

  const { data: profile } = await supabase
    .from("profiles")
    .select("game_coins")
    .eq("id", user.id)
    .single();

  const today = new Date().toISOString().split("T")[0];
  const { data: todayPlay } = await supabase
    .from("minigame_plays")
    .select("id")
    .eq("client_id", user.id)
    .eq("game_type", "scratch")
    .gte("played_at", `${today}T00:00:00`)
    .lt("played_at", `${today}T23:59:59.999`)
    .limit(1);

  return (
    <RaspadinhaClient
      initialCoins={((profile as unknown as { game_coins: number })?.game_coins) ?? 0}
      alreadyPlayed={!!(todayPlay && todayPlay.length > 0)}
    />
  );
}
