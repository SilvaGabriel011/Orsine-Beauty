export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Sparkles, Clock, Calendar, ArrowLeft } from "lucide-react";
import type { Service, Category } from "@/types/database";

interface Props {
  params: Promise<{ categorySlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { categorySlug } = await params;
    const supabase = await createClient();

    const { data: category } = (await supabase
      .from("categories")
      .select("name")
      .eq("slug", categorySlug)
      .eq("is_active", true)
      .single()) as unknown as { data: { name: string } | null };

    if (!category) {
      return { title: "Categoria nao encontrada" };
    }

    return { title: category.name };
  } catch {
    return { title: "Servicos" };
  }
}

export default async function CategoryServicosPage({ params }: Props) {
  const { categorySlug } = await params;
  let category: Category | null = null;
  let services: Service[] | null = null;

  try {
    const supabase = await createClient();

    const { data: catData } = (await supabase
      .from("categories")
      .select("*")
      .eq("slug", categorySlug)
      .eq("is_active", true)
      .single()) as unknown as { data: Category | null };

    category = catData;

    if (category) {
      const { data: svcData } = (await supabase
        .from("services")
        .select("*")
        .eq("category_id", category.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })) as unknown as { data: Service[] | null };
      services = svcData;
    }
  } catch {
    // Supabase not configured
  }

  if (!category) {
    notFound();
  }

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-rose-50 via-rose-100/50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Link
              href="/servicos"
              className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para servicos
            </Link>

            <div className="mb-4 flex justify-center">
              {category.image_url ? (
                <div className="h-20 w-20 overflow-hidden rounded-full shadow-md">
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md">
                  <Sparkles className="h-8 w-8 text-rose-400" />
                </div>
              )}
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-4 text-lg text-gray-600">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {services && services.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service: Service) => (
                <Card
                  key={service.id}
                  className="overflow-hidden border border-gray-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {/* Image placeholder */}
                  <div className="aspect-[16/10] w-full overflow-hidden bg-rose-50">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Sparkles className="h-10 w-10 text-rose-200" />
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-gray-900">
                      {service.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {service.description && (
                      <CardDescription className="text-sm leading-relaxed text-gray-500">
                        {service.description}
                      </CardDescription>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <Clock className="h-4 w-4" />
                        {service.duration_minutes} min
                      </span>
                      <span className="text-lg font-bold text-rose-600">
                        R$ {service.price.toFixed(2).replace(".", ",")}
                      </span>
                    </div>

                    <Link
                      href={`/agendar?service=${service.id}`}
                      className="block"
                    >
                      <Button className="w-full gap-2 bg-rose-600 text-white hover:bg-rose-700">
                        <Calendar className="h-4 w-4" />
                        Agendar
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-rose-50 p-12 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-rose-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Nenhum servico disponivel
              </h3>
              <p className="mt-2 text-gray-500">
                Os servicos desta categoria estao sendo preparados. Volte em
                breve!
              </p>
              <Link href="/servicos" className="mt-6 inline-block">
                <Button
                  variant="outline"
                  className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Ver todas as categorias
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Nao encontrou o que procura?
            </h2>
            <p className="mt-3 text-gray-500">
              Entre em contato conosco pelo WhatsApp e teremos prazer em ajudar.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/servicos">
                <Button
                  variant="outline"
                  className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  Ver todos os servicos
                </Button>
              </Link>
              <Link href="/agendar">
                <Button className="gap-2 bg-rose-600 text-white hover:bg-rose-700">
                  <Calendar className="h-4 w-4" />
                  Agendar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
