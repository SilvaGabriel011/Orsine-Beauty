/**
 * Pagina: Home / Landing Page
 *
 * Pagina inicial do site com carrosses de categorias e servicos.
 * Exibe depoimentos de clientes, chamadas para acao (CTA) e informacoes
 * sobre a empresa Bela Orsine Beauty.
 *
 * Server Component que carrega dados de:
 * - Categorias ativas
 * - Ultimos 12 servicos
 * - Avaliacoes visiveis de clientes
 *
 * Renderiza:
 * - Hero section com CTA principal
 * - Carrossel de categorias
 * - Carrossel de servicos populares
 * - Carrossel de depoimentos/reviews
 * - Diferenciais da empresa
 */
export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Calendar,
  ArrowRight,
  Heart,
  Star,
  Users,
  Award,
} from "lucide-react";
import type { Category, Service } from "@/types/database";
import LandingCategoriesCarousel from "./landing-categories";
import LandingServicesCarousel from "./landing-services";
import ReviewsCarousel from "@/components/reviews/ReviewsCarousel";

export default async function HomePage() {
  let categories: Category[] | null = null;
  let services: (Service & { categories: { id: string; name: string; slug: string } })[] | null = null;
  let reviews: any[] | null = null;

  try {
    const supabase = await createClient();

    const [catResult, svcResult, revResult] = await Promise.all([
      (supabase.from("categories") as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      (supabase.from("services") as any)
        .select("*, categories(id, name, slug)")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(12),
      (supabase.from("reviews") as any)
        .select("id, rating, comment, created_at, profiles(full_name), services(name)")
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    categories = catResult.data;
    services = svcResult.data;
    reviews = revResult.data;
  } catch {
    // Supabase not configured — render static content only
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-rose-100 to-pink-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-200/40 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-rose-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Estudio de Beleza
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Bela Orsine{" "}
              <span className="text-rose-600">Beauty</span>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-gray-600">
              Realce a sua beleza natural com os nossos servicos especializados.
              Escolha os servicos, monte seu carrinho e agende com poucos
              cliques.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/agendar">
                <Button
                  size="lg"
                  className="gap-2 bg-rose-600 px-8 text-white shadow-lg hover:bg-rose-700 hover:shadow-xl"
                >
                  <Calendar className="h-5 w-5" />
                  Agendar Agora
                </Button>
              </Link>
              <Link href="/agendar">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 border-rose-200 px-8 text-rose-700 hover:bg-rose-50"
                >
                  Ver catalogo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Quick stats */}
            <div className="mx-auto mt-12 flex max-w-md justify-center gap-8 sm:gap-12">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4 text-rose-500" />
                  <span className="text-2xl font-bold text-rose-600">+500</span>
                </div>
                <div className="text-xs text-gray-500">Clientes felizes</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 text-rose-500" />
                  <span className="text-2xl font-bold text-rose-600">5.0</span>
                </div>
                <div className="text-xs text-gray-500">Avaliacao media</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Award className="h-4 w-4 text-rose-500" />
                  <span className="text-2xl font-bold text-rose-600">3+</span>
                </div>
                <div className="text-xs text-gray-500">Anos de experiencia</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Carousel */}
      {categories && categories.length > 0 && (
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Categorias
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Explore nossos servicos por categoria
                </p>
              </div>
              <Link href="/agendar">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-rose-600 hover:text-rose-700"
                >
                  Ver todos
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <LandingCategoriesCarousel categories={categories} />
          </div>
        </section>
      )}

      {/* Popular Services Carousel */}
      {services && services.length > 0 && (
        <section className="bg-gray-50/50 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Servicos em destaque
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Adicione ao carrinho e agende varios de uma vez
                </p>
              </div>
              <Link href="/agendar">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-rose-600 hover:text-rose-700"
                >
                  Ver catalogo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <LandingServicesCarousel services={services} />
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Agende em 3 passos
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Simples, rapido e sem complicacao
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-3xl gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-2xl font-bold text-rose-600">
                1
              </div>
              <h3 className="text-sm font-semibold text-gray-900">
                Escolha os servicos
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Navegue pelo catalogo e adicione ao carrinho
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-2xl font-bold text-rose-600">
                2
              </div>
              <h3 className="text-sm font-semibold text-gray-900">
                Escolha data e horario
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Veja os horarios disponiveis e selecione o melhor
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-2xl font-bold text-rose-600">
                3
              </div>
              <h3 className="text-sm font-semibold text-gray-900">
                Confirme o agendamento
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Pronto! Voce recebe a confirmacao por email
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Carousel */}
      {reviews && reviews.length > 0 && (
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                O que nossas clientes dizem
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Avaliacoes reais de quem ja experimentou
              </p>
            </div>
            <ReviewsCarousel reviews={reviews} />
          </div>
        </section>
      )}

      {/* About Preview */}
      <section className="bg-gray-50/50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-1.5 text-sm font-medium text-rose-700">
              <Heart className="h-4 w-4" />
              Sobre Nos
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Cuidado e carinho em cada detalhe
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-500">
              No Bela Orsine Beauty, acreditamos que cada pessoa merece se sentir
              especial. Com anos de experiencia e dedicacao, oferecemos servicos
              de alta qualidade em um ambiente acolhedor e confortavel.
            </p>
            <Link href="/sobre" className="mt-6 inline-block">
              <Button
                variant="outline"
                className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
              >
                Conhecer nossa historia
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-rose-600 to-pink-600 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Pronta para se sentir ainda mais bonita?
            </h2>
            <p className="mt-4 text-lg text-rose-100">
              Monte seu carrinho de servicos e agende tudo de uma vez.
            </p>
            <Link href="/agendar" className="mt-8 inline-block">
              <Button
                size="lg"
                className="gap-2 bg-white px-8 text-rose-600 shadow-lg hover:bg-rose-50 hover:shadow-xl"
              >
                <Calendar className="h-5 w-5" />
                Agendar Agora
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
