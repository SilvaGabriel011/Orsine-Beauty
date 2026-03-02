import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 px-6 text-center">
      {/* Logo / Marca */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-md">
        <Sparkles className="h-10 w-10 text-rose-400" />
      </div>

      {/* Número 404 */}
      <h1 className="mb-2 text-7xl font-bold text-rose-400">404</h1>

      {/* Mensagem principal */}
      <h2 className="mb-3 text-2xl font-bold text-gray-900">
        Página não encontrada
      </h2>
      <p className="mb-8 max-w-sm text-gray-500 text-sm leading-relaxed">
        Hmm, parece que essa página saiu para fazer as unhas e não voltou ainda.{" "}
        Mas não se preocupe, temos muito mais para você!
      </p>

      {/* Ações */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="bg-rose-500 hover:bg-rose-600 text-white">
          <Link href="/">Voltar para a home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/agendar">Agendar um horário</Link>
        </Button>
      </div>

      {/* Rodapé */}
      <p className="mt-12 text-xs text-gray-400">
        Bela Orsine Beauty Studio
      </p>
    </div>
  );
}
