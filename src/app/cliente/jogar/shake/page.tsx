import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShakeClient } from "./shake-client";

export const metadata = {
  title: "Shake | Bela Orsine Beauty",
  description: "Chacoalhe e ganhe moedas!",
};

export default async function ShakePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirect=/cliente/jogar/shake");

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
    .eq("game_type", "shake")
    .gte("played_at", `${today}T00:00:00`)
    .lt("played_at", `${today}T23:59:59.999`)
    .limit(1);

  return (
    <ShakeClient
      initialCoins={((profile as unknown as { game_coins: number })?.game_coins) ?? 0}
      alreadyPlayed={!!(todayPlay && todayPlay.length > 0)}
    />
  );
}
