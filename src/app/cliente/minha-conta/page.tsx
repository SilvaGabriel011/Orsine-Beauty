/**
 * Pagina: Minha Conta (Area do Cliente)
 *
 * Perfil do cliente com informacoes pessoais, saldo de moedas e pontos
 * de fidelidade. Permite editar dados pessoais e ver historico de atividades.
 *
 * Server Component que valida autenticacao e carrega dados do cliente.
 * Renderiza MinhaContaClient para integracao com formularios.
 */
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MinhaContaClient from "./minha-conta-client";

export const metadata: Metadata = { title: "Minha Conta" };

export default async function MinhaContaPage() {
  const supabase = await createClient();

  // Valida que usuario esta autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = (await supabase
    .from("profiles")
    .select("full_name, email, phone, role, loyalty_points, total_completed")
    .eq("id", user.id)
    .single()) as unknown as {
    data: {
      full_name: string;
      email: string;
      phone: string | null;
      role: string;
      loyalty_points: number;
      total_completed: number;
    } | null;
  };

  if (!profile) redirect("/auth/login");

  return <MinhaContaClient profile={profile} />;
}
