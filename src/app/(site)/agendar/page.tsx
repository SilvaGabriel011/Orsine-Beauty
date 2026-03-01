export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category, Service } from "@/types/database";
import MarketplaceClient from "./marketplace-client";

export const metadata = { title: "Agendar | Bela Orsine Beauty" };

export default async function AgendarPage() {
  let categories: Category[] | null = null;
  let services: (Service & { categories: { id: string; name: string; slug: string } })[] | null = null;

  try {
    const supabase = await createClient();

    const [catResult, svcResult] = await Promise.all([
      (supabase.from("categories") as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
      (supabase.from("services") as any)
        .select("*, categories(id, name, slug)")
        .eq("is_active", true)
        .order("sort_order"),
    ]);

    categories = catResult.data;
    services = svcResult.data;
  } catch {
    // Supabase not configured
  }

  return (
    <Suspense>
      <MarketplaceClient
        categories={categories || []}
        services={services || []}
      />
    </Suspense>
  );
}
