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
  title: "Servicos",
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
      <section className="bg-gradient-to-br from-rose-50 via-rose-100/50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-rose-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Servicos
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Nossos Servicos
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Conhega todos os servicos que oferecemos para realcar a sua beleza
            </p>
          </div>
        </div>
      </section>

      {/* Categories with Services */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {categoriesWithServices.length > 0 ? (
            <div className="space-y-16">
              {categoriesWithServices.map((category) => (
                <div key={category.id}>
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                        <Sparkles className="h-5 w-5 text-rose-500" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {category.name}
                        </h2>
                        {category.description && (
                          <p className="mt-0.5 text-sm text-gray-500">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link href={`/servicos/${category.slug}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        Ver todos
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  {/* Services Grid */}
                  {category.services.length > 0 ? (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {category.services.map((service) => (
                        <Card
                          key={service.id}
                          className="border border-gray-100 shadow-sm transition-all hover:shadow-md"
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base text-gray-900">
                              {service.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {service.description && (
                              <CardDescription className="mb-3 line-clamp-2 text-sm text-gray-500">
                                {service.description}
                              </CardDescription>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-sm">
                                <span className="flex items-center gap-1 text-gray-500">
                                  <Clock className="h-3.5 w-3.5" />
                                  {service.duration_minutes} min
                                </span>
                                <span className="font-semibold text-rose-600">
                                  R${" "}
                                  {service.price
                                    .toFixed(2)
                                    .replace(".", ",")}
                                </span>
                              </div>
                              <Link href={`/agendar?service=${service.id}`}>
                                <Button
                                  size="sm"
                                  className="bg-rose-600 text-white hover:bg-rose-700"
                                >
                                  Agendar
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
                      Nenhum servico cadastrado nesta categoria ainda.
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-rose-50 p-12 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-rose-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Em breve
              </h3>
              <p className="mt-2 text-gray-500">
                Nossos servicos estao sendo preparados. Volte em breve!
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
