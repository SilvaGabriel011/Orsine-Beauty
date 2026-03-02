/**
 * Pagina: Marketplace / Agendamento de Servicos
 *
 * Interface para selecionar servicos para agendar. Exibe catalogo de servicos
 * com filtro por categoria, carrinho de compras flutuante e integracao com
 * fluxo de agendamento.
 *
 * Server Component que:
 * - Carrega categorias e servicos
 * - Renderiza MarketplaceClient com dados iniciais
 * - Permite selecionar multiplos servicos antes de agendar horario
 */
export const revalidate = 3600; // revalida a cada 1 hora

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category, Service } from "@/types/database";
import MarketplaceClient from "./marketplace-client";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book an Appointment | Bela Orsine Beauty",
  description: "Book your beauty appointment online — choose from brows, nails, waxing and more services at Bela Orsine Beauty Studio.",
  openGraph: {
    title: "Book an Appointment | Bela Orsine Beauty",
    description: "Choose your service and book online. Fast, easy and secure.",
    type: "website",
  },
};

export default async function AgendarPage() {
  let categories: Category[] | null = null;
  let services: (Service & { categories: { id: string; name: string; slug: string } })[] | null = null;

  try {
    const supabase = await createClient();

    const [catResult, svcResult] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("services")
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
