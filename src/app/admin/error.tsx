"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Erro no painel admin
        </h2>
        <p className="text-muted-foreground">
          Ocorreu um erro inesperado. Tente recarregar a pagina.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            variant="outline"
          >
            Tentar novamente
          </Button>
          <Button
            onClick={() => (window.location.href = "/admin/dashboard")}
          >
            Voltar ao dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
