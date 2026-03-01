export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FidelidadeClient from "./fidelidade-client";

export const metadata: Metadata = {
  title: "Fidelidade | Admin",
};

export default async function FidelidadePage() {
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

  const { data: rules } = (await (supabase.from("loyalty_rules") as any)
    .select("*")
    .order("type")
    .order("created_at", { ascending: false })) as { data: any[] | null };

  // Stats
  const { data: topClients } = (await (supabase.from("profiles") as any)
    .select("id, full_name, loyalty_points, total_completed")
    .eq("role", "client")
    .order("loyalty_points", { ascending: false })
    .limit(5)) as { data: any[] | null };

  const totalPointsActive =
    topClients?.reduce(
      (sum: number, c: any) => sum + (c.loyalty_points || 0),
      0
    ) ?? 0;

  return (
    <FidelidadeClient
      rules={rules || []}
      topClients={topClients || []}
      totalPointsActive={totalPointsActive}
    />
  );
}
