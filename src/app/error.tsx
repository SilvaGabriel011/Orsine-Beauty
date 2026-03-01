"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  const isSupabaseError =
    error.message?.includes("Supabase") ||
    error.message?.includes("env") ||
    error.message?.includes("NEXT_PUBLIC_SUPABASE");

  const isNetworkError =
    error.message?.includes("fetch") ||
    error.message?.includes("network") ||
    error.message?.includes("Failed to fetch");

  const title = isSupabaseError
    ? "Configuracao necessaria"
    : isNetworkError
      ? "Problema de conexao"
      : "Algo deu errado";

  const description = isSupabaseError
    ? "O banco de dados nao esta configurado. Verifique se as variaveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estao definidas no arquivo .env.local"
    : isNetworkError
      ? "Nao foi possivel conectar ao servidor. Verifique sua conexao com a internet."
      : "Ocorreu um erro inesperado. Tente novamente.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
          <svg
            className="h-8 w-8 text-rose-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-3 text-gray-600">{description}</p>

        {error.digest && (
          <p className="mt-2 font-mono text-xs text-gray-400">
            Codigo: {error.digest}
          </p>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-700"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Voltar ao inicio
          </a>
        </div>

        {isSupabaseError && (
          <div className="mt-6 rounded-lg border bg-gray-100 p-4 text-left text-xs text-gray-700">
            <p className="mb-1 font-semibold">Como configurar:</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>Crie um projeto em supabase.com</li>
              <li>
                Copie a URL e Anon Key em Settings &gt; API
              </li>
              <li>Preencha o .env.local com os valores</li>
              <li>Reinicie o servidor dev</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
