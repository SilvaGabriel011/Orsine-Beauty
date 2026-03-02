/**
 * API Route: /api/services/[id]
 *
 * Gerencia um servico especifico.
 *
 * GET    — Obtem servico com categoria relacionada
 * PATCH  — Atualiza servico (requer autenticacao)
 * DELETE — Soft delete: desativa servico (requer autenticacao)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAuth } from "@/lib/errors";

// GET: Obtem servico individual com categoria
export const GET = withErrorHandler(async (
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();

  // Busca servico com categoria relacionada
  const { data, error } = await supabase
    .from("services")
    .select("*, categories(id, name, slug)")
    .eq("id", id)
    .single() as unknown as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_NOT_FOUND", error.message, error);
  }

  return NextResponse.json(data);
});

// PATCH: Atualiza servico (requer autenticacao)
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();
  // Verifica autenticacao
  await requireAuth(supabase);

  const body = await request.json();

  // Atualiza campos: nome, descricao, duracao, preco, imagem, status
  const { data, error } = await (supabase
    .from("services")
    .update(body)
    .eq("id", id)
    .select("*, categories(id, name, slug)")
    .single()) as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_UPDATE_FAILED", error.message, error);
  }

  return NextResponse.json(data);
});

// DELETE: Soft delete - desativa servico (requer autenticacao)
export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();
  // Verifica autenticacao
  await requireAuth(supabase);

  // Soft delete: apenas desativa servico (nunca deleta da BD)
  const { error } = await supabase
    .from("services")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    throw new AppError("RES_DELETE_FAILED", error.message, error);
  }

  return NextResponse.json({ success: true });
});
