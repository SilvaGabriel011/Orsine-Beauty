export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import PortfolioFilter from "./portfolio-filter";

export const metadata: Metadata = {
  title: "Portfolio | Bela Orsine Beauty",
  description: "Confira nossos trabalhos realizados",
};

export default async function PortfolioPage() {
  let items: any[] | null = null;
  let categories: any[] | null = null;

  try {
    const supabase = await createClient();

    const [itemsResult, catsResult] = await Promise.all([
      (supabase.from("portfolio") as any)
        .select("*, categories(id, name, slug)")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      (supabase.from("categories") as any)
        .select("id, name, slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

    items = itemsResult.data;
    categories = catsResult.data;
  } catch {
    // Supabase not configured
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Nosso Portfolio
        </h1>
        <p className="mt-2 text-gray-500">
          Confira alguns dos nossos trabalhos realizados
        </p>
      </div>

      <PortfolioFilter
        items={items || []}
        categories={categories || []}
      />
    </div>
  );
}
