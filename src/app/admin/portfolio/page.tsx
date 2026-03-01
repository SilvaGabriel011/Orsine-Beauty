export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PortfolioClient from "./portfolio-client";

export const metadata: Metadata = {
  title: "Portfolio | Admin",
};

export default async function PortfolioPage() {
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

  const { data: items } = (await (supabase.from("portfolio") as any)
    .select("*, categories(id, name)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })) as { data: any[] | null };

  const { data: categories } = (await (supabase.from("categories") as any)
    .select("id, name")
    .eq("is_active", true)
    .order("name")) as { data: any[] | null };

  return (
    <PortfolioClient
      items={items || []}
      categories={categories || []}
    />
  );
}
