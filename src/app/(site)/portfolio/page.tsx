/**
 * Pagina: Portfolio de Trabalhos
 *
 * Galeria visual dos trabalhos realizados no estudio Bela Orsine Beauty.
 * Exibe fotos de servicos realizados, filtravels por categoria.
 * Client-side filtering com PortfolioFilter para melhor UX.
 *
 * Server Component que carrega itens de portfolio do banco de dados.
 */
export const revalidate = 1800; // revalida a cada 30 minutos

import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import PortfolioFilter from "./portfolio-filter";

export const metadata: Metadata = {
  title: "Portfolio | Bela Orsine Beauty",
  description: "Browse our completed work and transformations",
  openGraph: {
    title: "Our Portfolio | Bela Orsine Beauty",
    description: "Browse our gallery of beauty transformations — brows, nails, waxing and more.",
    type: "website",
  },
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
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <section className="bg-gradient-to-b from-warm-100 to-cream pt-24 pb-12 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-sm italic tracking-widest text-gold-500 uppercase">
              Our work
            </p>
            <h1 className="mt-3 font-serif text-4xl tracking-tight text-warm-900 sm:text-5xl">
              Portfolio
            </h1>
            <p className="mt-4 text-lg text-warm-500">
              Browse some of our completed work and transformations
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <PortfolioFilter
          items={items || []}
          categories={categories || []}
        />
      </div>
    </div>
  );
}
