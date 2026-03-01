import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RankingClient } from "./ranking-client";

export const metadata = {
  title: "Ranking | Bela Orsine Beauty",
  description: "Veja quem esta no topo do ranking de moedas!",
};

export default async function RankingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirect=/cliente/ranking");

  return <RankingClient userId={user.id} />;
}
