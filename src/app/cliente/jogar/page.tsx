/**
 * Pagina: Hub de Jogos do Cliente (/cliente/jogar)
 *
 * Pagina principal de gamificacao onde o cliente pode:
 * - Fazer check-in diario (calendario de 7 dias com streak)
 * - Acessar minigames (roleta, raspadinha, quiz, shake)
 * - Ver saldo de moedas e streak atual
 * - Visualizar historico de jogadas do dia
 *
 * Server Component que:
 * - Valida autenticacao do cliente
 * - Carrega dados de perfil (coins, streaks)
 * - Busca jogadas de hoje para desabilitar repeticoes
 * - Renderiza GameHubClient com dados iniciais
 */
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GameHub } from "./game-hub-client";

export const metadata = {
  title: "Jogar | Bela Orsine Beauty",
  description: "Jogue minigames diarios e ganhe moedas para trocar por recompensas!",
};

export default async function JogarPage() {
  const supabase = await createClient();

  // Valida que usuario esta autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/cliente/jogar");
  }

  // Carrega dados de gamificacao do perfil (moedas, streaks)
  const { data: profile } = await supabase
    .from("profiles")
    .select("game_coins, current_streak, longest_streak, last_checkin_date")
    .eq("id", user.id)
    .single();

  // Carrega jogadas de hoje para desabilitar repeticoes
  const today = new Date().toISOString().split("T")[0];
  const { data: todayPlays } = await supabase
    .from("minigame_plays")
    .select("game_type")
    .eq("client_id", user.id)
    .gte("played_at", `${today}T00:00:00`)
    .lt("played_at", `${today}T23:59:59.999`);

  const playedToday: Record<string, boolean> = {
    checkin: false,
    wheel: false,
    scratch: false,
    quiz: false,
    shake: false,
  };

  if (todayPlays) {
    for (const play of todayPlays) {
      playedToday[(play as { game_type: string }).game_type] = true;
    }
  }

  const profileData = profile as unknown as {
    game_coins: number;
    current_streak: number;
    longest_streak: number;
    last_checkin_date: string | null;
  } | null;

  return (
    <GameHub
      initialCoins={profileData?.game_coins ?? 0}
      initialStreak={profileData?.current_streak ?? 0}
      longestStreak={profileData?.longest_streak ?? 0}
      lastCheckinDate={profileData?.last_checkin_date ?? null}
      playedToday={playedToday}
    />
  );
}
