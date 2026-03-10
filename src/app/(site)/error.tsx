"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Site error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Algo deu errado
        </h2>
        <p className="text-muted-foreground">
          Desculpe, ocorreu um erro inesperado. Tente novamente ou volte para a pagina inicial.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            variant="outline"
          >
            Tentar novamente
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            Pagina inicial
          </Button>
        </div>
      </div>
    </div>
  );
}
