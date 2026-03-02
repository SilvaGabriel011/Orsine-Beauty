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
export const revalidate = 3600; // revalida a cada 1 hora

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { Category, Service } from "@/types/database";
import LandingCategoriesCarousel from "./landing-categories";
import LandingServicesCarousel from "./landing-services";
import TestimonialCarousel from "@/components/shared/TestimonialCarousel";
import HomeHeroClient from "./home-hero-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bela Orsine Beauty | Beauty Studio in Australia",
  description: "Premium beauty services including brows, nails, waxing and more. Book your appointment online at Bela Orsine Beauty Studio.",
  keywords: ["beauty studio", "brow shaping", "nail salon", "waxing", "Bela Orsine", "Australia"],
  openGraph: {
    title: "Bela Orsine Beauty Studio",
    description: "Premium beauty services — brows, nails, waxing and more. Book online today.",
    type: "website",
    locale: "en_AU",
    siteName: "Bela Orsine Beauty",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Bela Orsine Beauty Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bela Orsine Beauty Studio",
    description: "Premium beauty services — book online today.",
  },
  robots: {
    index: true,
    follow: true,
  },
};


export default async function HomePage() {
  let categories: Category[] | null = null;
  let services: (Service & { categories: { id: string; name: string; slug: string } })[] | null = null;
  let reviews: any[] | null = null;

  try {
    const supabase = await createClient();

    const [catResult, svcResult, revResult] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("services")
        .select("*, categories(id, name, slug)")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(12),
      supabase
        .from("reviews")
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
      {/* Hero Section — Cinematic fullscreen */}
      <HomeHeroClient />

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <section className="relative bg-cream dark:bg-[#1A1412] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="font-display text-sm italic tracking-widest text-gold-500 dark:text-gold-400 uppercase">
                  Explore
                </p>
                <h2 className="mt-2 font-serif text-3xl tracking-tight text-warm-900 dark:text-warm-100 sm:text-4xl">
                  Our Categories
                </h2>
              </div>
              <Link href="/agendar">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-burgundy-600 dark:text-burgundy-400 hover:text-burgundy-700 dark:hover:text-burgundy-300 hover:bg-burgundy-50 dark:hover:bg-burgundy-900/30"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <LandingCategoriesCarousel categories={categories} />
          </div>
        </section>
      )}

      {/* Featured Services Section */}
      {services && services.length > 0 && (
        <section className="relative bg-warm-50 dark:bg-[#1E1814] py-20 sm:py-28">
          {/* Decorative top line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-300/30 to-transparent" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="font-display text-sm italic tracking-widest text-gold-500 dark:text-gold-400 uppercase">
                  Curated for you
                </p>
                <h2 className="mt-2 font-serif text-3xl tracking-tight text-warm-900 dark:text-warm-100 sm:text-4xl">
                  Featured Services
                </h2>
              </div>
              <Link href="/agendar">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-burgundy-600 dark:text-burgundy-400 hover:text-burgundy-700 dark:hover:text-burgundy-300 hover:bg-burgundy-50 dark:hover:bg-burgundy-900/30"
                >
                  Full Catalogue
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <LandingServicesCarousel services={services} />
          </div>
        </section>
      )}

      {/* How it works — Editorial style */}
      <section className="relative bg-cream dark:bg-[#1A1412] py-20 sm:py-28">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warm-300/50 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-sm italic tracking-widest text-gold-500 dark:text-gold-400 uppercase">
              How it works
            </p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight text-warm-900 dark:text-warm-100 sm:text-4xl">
              Book in Three Steps
            </h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-4xl gap-12 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold-300/50 dark:border-gold-500/30 bg-gradient-to-br from-gold-50 to-gold-100 dark:from-warm-800 dark:to-warm-700 font-serif text-2xl font-bold text-burgundy-600 dark:text-burgundy-400">
                1
              </div>
              <h3 className="font-serif text-lg text-warm-900 dark:text-warm-100">
                Choose Services
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-500 dark:text-warm-400">
                Browse our curated catalogue and add your favourite services to the cart
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold-300/50 dark:border-gold-500/30 bg-gradient-to-br from-gold-50 to-gold-100 dark:from-warm-800 dark:to-warm-700 font-serif text-2xl font-bold text-burgundy-600 dark:text-burgundy-400">
                2
              </div>
              <h3 className="font-serif text-lg text-warm-900 dark:text-warm-100">
                Pick Date & Time
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-500 dark:text-warm-400">
                See real-time availability and select the perfect time slot
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold-300/50 dark:border-gold-500/30 bg-gradient-to-br from-gold-50 to-gold-100 dark:from-warm-800 dark:to-warm-700 font-serif text-2xl font-bold text-burgundy-600 dark:text-burgundy-400">
                3
              </div>
              <h3 className="font-serif text-lg text-warm-900 dark:text-warm-100">
                Confirm & Enjoy
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-500 dark:text-warm-400">
                Receive instant confirmation and get ready for your beauty experience
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Carousel */}
      {reviews && reviews.length > 0 && (
        <TestimonialCarousel testimonials={reviews} loading={false} />
      )}

      {/* About Preview — Editorial */}
      <section className="relative bg-warm-50 dark:bg-[#1E1814] py-20 sm:py-28">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-300/30 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-display text-sm italic tracking-widest text-gold-500 dark:text-gold-400 uppercase">
              Our Philosophy
            </p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-warm-900 dark:text-warm-100 sm:text-4xl">
              Care and love in every detail
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-warm-500 dark:text-warm-400">
              At Bela Orsine Beauty, we believe everyone deserves to feel
              special. With years of experience and dedication, we offer
              high-quality services in a welcoming and comfortable environment.
            </p>
            <Link href="/sobre" className="mt-8 inline-block">
              <Button
                variant="outline"
                className="gap-2 rounded-full border-burgundy-200 dark:border-burgundy-700 px-6 text-burgundy-600 dark:text-burgundy-400 hover:bg-burgundy-50 dark:hover:bg-burgundy-900/30 hover:border-burgundy-300 dark:hover:border-burgundy-600"
              >
                Discover our story
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA — Premium gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-burgundy-700 via-burgundy-800 to-warm-900 py-20 sm:py-28">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-burgundy-600/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-48 w-48 rounded-full bg-gold-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-sm italic tracking-widest text-gold-400 uppercase">
              Your beauty journey starts here
            </p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight text-white sm:text-5xl">
              Ready to feel even more beautiful?
            </h2>
            <p className="mt-6 text-lg text-burgundy-200">
              Build your service cart and book everything at once.
            </p>
            <Link href="/agendar" className="mt-10 inline-block">
              <Button
                size="lg"
                className="gap-2 rounded-full bg-gold-300 px-10 text-burgundy-900 shadow-xl shadow-gold-400/20 hover:bg-gold-200 hover:shadow-2xl transition-all duration-300"
              >
                Book Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
