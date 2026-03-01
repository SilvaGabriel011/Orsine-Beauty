/**
 * Modulo de Cliente Supabase Browser — Bela Orsine Beauty
 *
 * Cria cliente Supabase para uso no navegador (cliente).
 * Usa chave publica (ANON_KEY) — segura para expor no cliente.
 * Inclui sessao do usuario (lido dos cookies).
 *
 * Uso:
 *   import { createClient } from "@/lib/supabase/client"
 *   const supabase = createClient()
 *   const { data } = await supabase.from("profiles").select()
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Cria cliente Supabase para execucao no navegador.
 * Usa SSR helper para lidar com sessao e cookies automaticamente.
 *
 * @returns Cliente Supabase tipado com Database schema
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
