import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LojaClient } from "./loja-client";

export const metadata = {
  title: "Loja de Recompensas | Bela Orsine Beauty",
  description: "Troque suas moedas por descontos, servicos e produtos!",
};

export default async function LojaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirect=/cliente/loja");

  const { data: profile } = await supabase
    .from("profiles")
    .select("game_coins")
    .eq("id", user.id)
    .single();

  const { data: items } = await supabase
    .from("reward_store_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: redemptions } = await supabase
    .from("reward_redemptions")
    .select("*, reward_store_items(name, type, image_url)")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <LojaClient
      initialCoins={((profile as unknown as { game_coins: number })?.game_coins) ?? 0}
      items={(items as unknown as StoreItem[]) || []}
      redemptions={(redemptions as unknown as Redemption[]) || []}
    />
  );
}

interface StoreItem {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  type: "discount" | "service" | "product";
  coin_price: number;
  metadata: Record<string, unknown>;
  stock: number | null;
  sort_order: number;
}

interface Redemption {
  id: string;
  item_id: string;
  coins_spent: number;
  status: "pending" | "fulfilled" | "cancelled";
  fulfilled_at: string | null;
  notes: string | null;
  created_at: string;
  reward_store_items: {
    name: string;
    type: string;
    image_url: string | null;
  };
}
