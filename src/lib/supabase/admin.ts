/**
 * Modulo de Cliente Supabase Admin — Bela Orsine Beauty
 *
 * Cria cliente Supabase com permissoes administrativas (SUPER USER).
 * Usa chave de servico (SERVICE_ROLE_KEY) — SECRETA, apenas servidor!
 *
 * Usado para:
 * - RPCs que precisam de permissoes elevadas
 * - Operacoes que devem ignorar RLS (Row Level Security)
 * - Tarefas administrativas automatizadas
 *
 * CUIDADO: Nunca exponha SERVICE_ROLE_KEY ao cliente!
 *
 * Uso:
 *   import { createAdminClient } from "@/lib/supabase/admin"
 *   const supabase = createAdminClient()
 *   await supabase.rpc("daily_checkin", { p_client_id: "..." })
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cria cliente Supabase com permissoes administrativas.
 * Requer SUPABASE_SERVICE_ROLE_KEY (variavel secreta de servidor).
 *
 * Diferenca:
 * - createClient(): chave publica, respeita RLS
 * - createAdminClient(): chave secreta, ignora RLS
 *
 * @returns Cliente Supabase tipado com Database schema
 * @throws Error se variaveis de ambiente faltarem
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin nao configurado: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos em .env.local"
    );
  }

  return createClient<Database>(url, serviceKey);
}
