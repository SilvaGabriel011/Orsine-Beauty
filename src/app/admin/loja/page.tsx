export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LojaAdminClient } from "./loja-admin-client";

export const metadata: Metadata = {
  title: "Loja de Recompensas | Admin",
};

export default async function LojaAdminPage() {
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

  // Fetch store items
  const { data: items } = await supabase
    .from("reward_store_items")
    .select("*")
    .order("sort_order", { ascending: true });

  // Fetch pending redemptions with client info
  const { data: redemptions } = await supabase
    .from("reward_redemptions")
    .select("*, profiles(full_name, email), reward_store_items(name, type)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <LojaAdminClient
      items={(items as unknown as StoreItem[]) || []}
      redemptions={(redemptions as unknown as AdminRedemption[]) || []}
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
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface AdminRedemption {
  id: string;
  client_id: string;
  item_id: string;
  coins_spent: number;
  status: "pending" | "fulfilled" | "cancelled";
  fulfilled_at: string | null;
  notes: string | null;
  created_at: string;
  profiles: { full_name: string; email: string };
  reward_store_items: { name: string; type: string };
}
