/**
 * Pagina: Conquistas / Achievements (Area do Cliente)
 *
 * Exibe todas as conquistas (badges) desbloqueadas pelo cliente.
 * Mostra titulo, descricao, data de desbloqueio e recompensa em moedas.
 * Conquistas bloqueadas aparecem desativadas com hint de como desbloquear.
 *
 * Server Component que carrega conquistas do cliente.
 * Renderiza ConquistasClient para exibicao visual.
 */
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ConquistasClient } from "./conquistas-client";

export const metadata = {
  title: "Conquistas | Bela Orsine Beauty",
  description: "Suas conquistas e badges",
};

export default async function ConquistasPage() {
  const supabase = await createClient();

  // Valida que usuario esta autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirect=/cliente/conquistas");

  // Fetch all achievements
  const { data: achievements } = await supabase
    .from("achievements")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Fetch user's unlocked achievements
  const { data: userAchievements } = await supabase
    .from("user_achievements")
    .select("achievement_id, unlocked_at")
    .eq("client_id", user.id);

  const unlockMap: Record<string, string> = {};
  if (userAchievements) {
    for (const ua of userAchievements) {
      const row = ua as unknown as { achievement_id: string; unlocked_at: string };
      unlockMap[row.achievement_id] = row.unlocked_at;
    }
  }

  const achievementsWithStatus = (achievements || []).map((a) => {
    const achievement = a as unknown as {
      id: string;
      slug: string;
      name: string;
      description: string;
      icon: string;
      category: string;
      coin_reward: number;
    };
    return {
      ...achievement,
      unlocked_at: unlockMap[achievement.id] || null,
    };
  });

  return <ConquistasClient achievements={achievementsWithStatus} />;
}
