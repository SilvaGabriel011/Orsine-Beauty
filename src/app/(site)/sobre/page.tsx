/**
 * Pagina: Sobre a Empresa
 *
 * Pagina que apresenta a historia, missao e valores de Bela Orsine Beauty.
 * Exibe informacoes sobre a proprietaria, servicos principais e diferenciais.
 * Inclui chamadas para acao de agendamento.
 *
 * Static page renderizada no servidor.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, Target, Eye } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
};

export default function SobrePage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-warm-100 to-cream pt-24 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-sm italic tracking-widest text-gold-500 uppercase">
              Our Story
            </p>
            <h1 className="mt-3 font-serif text-4xl tracking-tight text-warm-900 sm:text-5xl">
              About Us
            </h1>
            <p className="mt-4 text-lg text-warm-500">
              How Bela Orsine Beauty was born and our commitment to you
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-cream py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-6 text-base leading-relaxed text-warm-600">
              <p>
                Bela Orsine Beauty was born from the dream of creating a space where
                everyone could feel welcomed and leave feeling more beautiful
                and confident. With a passion for beauty and years of dedication to
                professional development, we built a studio that combines
                technique, quality and lots of care.
              </p>
              <p>
                We believe beauty goes beyond aesthetics — it lives in
                self-esteem, confidence and self-care. That is why
                every appointment is personalised, designed to meet your
                needs and enhance what makes you uniquely beautiful.
              </p>
              <p>
                Our commitment is to deliver excellent services in a
                welcoming and comfortable environment, always using the best
                products and the most up-to-date techniques in the industry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative bg-warm-50 py-16 sm:py-20">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-300/30 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-sm italic tracking-widest text-gold-500 uppercase">
              Our foundation
            </p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight text-warm-900 sm:text-4xl">
              What Guides Us
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-warm-200/50 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-burgundy-600/5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold-200 bg-gradient-to-br from-gold-50 to-gold-100">
                <Target className="h-6 w-6 text-burgundy-600" />
              </div>
              <h3 className="font-serif text-lg text-warm-900">
                Our Mission
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-500">
                To enhance the natural beauty of each client, providing
                high-quality services with care and professionalism.
              </p>
            </div>
            <div className="rounded-2xl border border-warm-200/50 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-burgundy-600/5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold-200 bg-gradient-to-br from-gold-50 to-gold-100">
                <Eye className="h-6 w-6 text-burgundy-600" />
              </div>
              <h3 className="font-serif text-lg text-warm-900">
                Our Vision
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-500">
                To be the most loved and recommended beauty studio,
                known for excellent service and welcoming environment.
              </p>
            </div>
            <div className="rounded-2xl border border-warm-200/50 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-burgundy-600/5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold-200 bg-gradient-to-br from-gold-50 to-gold-100">
                <Heart className="h-6 w-6 text-burgundy-600" />
              </div>
              <h3 className="font-serif text-lg text-warm-900">
                Our Values
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-500">
                Dedication, quality, respect, innovation and, above all,
                love for what we do.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-burgundy-700 via-burgundy-800 to-warm-900 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-burgundy-600/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-48 w-48 rounded-full bg-gold-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-sm italic tracking-widest text-gold-400 uppercase">
              Start your journey
            </p>
            <h2 className="mt-4 font-serif text-3xl tracking-tight text-white sm:text-4xl">
              Ready to experience the difference?
            </h2>
            <p className="mt-4 text-lg text-burgundy-200">
              Book your appointment and let us take care of you.
            </p>
            <Link href="/agendar" className="mt-10 inline-block">
              <Button
                size="lg"
                className="gap-2 rounded-full bg-gold-300 px-10 text-burgundy-900 shadow-xl shadow-gold-400/20 hover:bg-gold-200 hover:shadow-2xl transition-all duration-300"
              >
                <Calendar className="h-5 w-5" />
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
