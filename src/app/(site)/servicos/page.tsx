/**
 * Pagina: Catalogo de Servicos
 *
 * Exibe lista completa de servicos disponiveis organizados por categoria.
 * Permite filtrar por categoria e ver detalhes (nome, preco, duracao).
 * Botoes CTA para agendar cada servico.
 *
 * Server Component que carrega dados dinamicamente de categorias e servicos.
 */
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Sparkles, Clock, ArrowRight } from "lucide-react";
import type { Category, Service } from "@/types/database";

export const metadata: Metadata = {
  title: "Services",
};

type CategoryWithServices = Category & {
  services: Service[];
};

export default async function ServicosPage() {
  let categories: Category[] | null = null;
  let services: any[] | null = null;

  try {
    const supabase = await createClient();

    const [catResult, svcResult] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }) as unknown as Promise<{ data: Category[] | null }>,
      supabase
        .from("services")
        .select("*, categories(*)")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }) as unknown as Promise<{ data: any[] | null }>,
    ]);

    categories = catResult.data;
    services = svcResult.data;
  } catch {
    // Supabase not configured
  }

  // Group services by category
  const categoriesWithServices: CategoryWithServices[] = (categories || []).map(
    (category) => ({
      ...category,
      services: (services || []).filter(
        (service) => service.category_id === category.id
      ),
    })
  );

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-warm-100 to-cream pt-24 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-sm italic tracking-widest text-gold-500 uppercase">
              What we offer
            </p>
            <h1 className="mt-3 font-serif text-4xl tracking-tight text-warm-900 sm:text-5xl">
              Our Services
            </h1>
            <p className="mt-4 text-lg text-warm-500">
              Discover all the services we offer to enhance your beauty
            </p>
          </div>
        </div>
      </section>

      {/* Categories with Services */}
      <section className="bg-cream py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {categoriesWithServices.length > 0 ? (
            <div className="space-y-20">
              {categoriesWithServices.map((category) => (
                <div key={category.id}>
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-200 bg-gradient-to-br from-gold-50 to-gold-100">
                        <Sparkles className="h-5 w-5 text-burgundy-500" />
                      </div>
                      <div>
                        <h2 className="font-serif text-2xl text-warm-900">
                          {category.name}
                        </h2>
                        {category.description && (
                          <p className="mt-0.5 text-sm text-warm-500">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link href={`/servicos/${category.slug}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-burgundy-600 hover:bg-burgundy-50 hover:text-burgundy-700"
                      >
                        View all
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  {/* Services Grid */}
                  {category.services.length > 0 ? (
                    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {category.services.map((service) => (
                        <Card
                          key={service.id}
                          className="border border-warm-200/50 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-burgundy-600/5 hover:-translate-y-0.5"
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base text-warm-900">
                              {service.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {service.description && (
                              <CardDescription className="mb-3 line-clamp-2 text-sm text-warm-500">
                                {service.description}
                              </CardDescription>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-sm">
                                <span className="flex items-center gap-1 text-warm-400">
                                  <Clock className="h-3.5 w-3.5" />
                                  {service.duration_minutes} min
                                </span>
                                <span className="font-semibold text-burgundy-600">
                                  ${service.price.toFixed(2)}
                                </span>
                              </div>
                              <Link href={`/agendar?service=${service.id}`}>
                                <Button
                                  size="sm"
                                  className="rounded-full bg-burgundy-600 text-white hover:bg-burgundy-700"
                                >
                                  Book
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-xl bg-warm-100 p-6 text-center text-sm text-warm-500">
                      No services listed in this category yet.
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-warm-100 p-12 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-burgundy-200" />
              <h3 className="mt-4 font-serif text-lg text-warm-900">
                Coming Soon
              </h3>
              <p className="mt-2 text-warm-500">
                Our services are being prepared. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
