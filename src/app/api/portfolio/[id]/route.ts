/**
 * API Route: /api/portfolio/[id]
 *
 * Gerencia um item especifico do portfolio.
 *
 * PATCH  — Atualiza item (requer admin)
 * DELETE — Deleta item (requer admin)
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH: Atualiza item de portfolio (requer admin)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Verificacao de autenticacao
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  // Verificacao de permissao admin
  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as unknown as { data: { role: string } | null };

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();

  // Atualiza campos do portfolio (titulo, descricao, imagem, sort_order, etc)
  const { data, error } = (await (supabase.from("portfolio") as any)
    .update(body)
    .eq("id", id)
    .select("*, categories(id, name, slug)")
    .single()) as { data: any | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE: Deleta item de portfolio (requer admin)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Verificacao de autenticacao
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  // Verificacao de permissao admin
  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as unknown as { data: { role: string } | null };

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Deleta item de portfolio permanentemente
  const { error } = (await (supabase.from("portfolio") as any)
    .delete()
    .eq("id", id)) as { error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
