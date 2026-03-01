export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClientesClient from "./clientes-client";

export const metadata: Metadata = {
  title: "Clientes | Admin",
};

export default async function ClientesPage() {
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

  // Fetch all clients
  const { data: clients } = (await (supabase.from("profiles") as any)
    .select("id, full_name, email, phone, loyalty_points, total_completed, created_at")
    .eq("role", "client")
    .order("created_at", { ascending: false })) as { data: any[] | null };

  return <ClientesClient clients={clients || []} />;
}
