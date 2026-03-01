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
import { Heart, Sparkles, Calendar, Award, Star, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Sobre",
};

export default function SobrePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-rose-50 via-rose-100/50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-rose-700 shadow-sm">
              <Heart className="h-4 w-4" />
              Sobre Nos
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Bela Orsine <span className="text-rose-600">Beauty</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-600">
              Um espaco dedicado a realcar a beleza de cada mulher, com carinho,
              profissionalismo e atencao aos detalhes.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Nossa Historia
            </h2>
            <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
              <p>
                O Bela Orsine Beauty nasceu do sonho de criar um espaco onde cada
                pessoa pudesse se sentir acolhida e sair se sentindo mais bonita
                e confiante. Com paixao pela beleza e anos de dedicacao ao
                aperfeicoamento profissional, construimos um estudio que une
                tecnica, qualidade e muito carinho.
              </p>
              <p>
                Acreditamos que a beleza vai alem da estetica -- ela esta na
                autoestima, na confianca e no cuidado consigo mesma. Por isso,
                cada atendimento e personalizado, pensado para atender as suas
                necessidades e realcar o que voce tem de mais bonito.
              </p>
              <p>
                Nosso compromisso e oferecer servicos de excelencia em um
                ambiente acolhedor e confortavel, utilizando sempre os melhores
                produtos e as tecnicas mais atualizadas do mercado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Nossos Valores
            </h2>
            <p className="mt-3 text-gray-500">
              O que nos guia em cada atendimento
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <Heart className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Carinho
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Cada atendimento e feito com amor e dedicacao. Queremos que voce
                se sinta acolhida do inicio ao fim.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <Award className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Qualidade
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Usamos os melhores produtos e tecnicas atualizadas para garantir
                resultados impecaveis.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <Sparkles className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Beleza Natural
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Valorizamos a sua beleza unica. Nosso objetivo e realcar o que
                voce ja tem de mais bonito.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <Star className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Excelencia
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Buscamos a perfeicao em cada detalhe, sempre nos atualizando e
                aprimorando nossos servicos.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <Clock className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Pontualidade
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Valorizamos o seu tempo. Trabalhamos com agendamento para garantir
                um atendimento sem esperas.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <Calendar className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Facilidade
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Agendamento online pratico e rapido. Cuide da sua beleza sem
                complicacao.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-rose-600 to-pink-600 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Venha nos conhecer
            </h2>
            <p className="mt-4 text-lg text-rose-100">
              Agende o seu atendimento e descubra a experiencia Bela Orsine
              Beauty.
            </p>
            <Link href="/agendar" className="mt-8 inline-block">
              <Button
                size="lg"
                className="gap-2 bg-white px-8 text-rose-600 shadow-lg hover:bg-rose-50"
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
