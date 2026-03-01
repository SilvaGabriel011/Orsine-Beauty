/**
 * API Route: /api/categories/[id]
 *
 * Gerencia uma categoria especifica.
 *
 * GET    — Obtem categoria com todos seus servicos relacionados
 * PATCH  — Atualiza categoria (requer autenticacao)
 * DELETE — Soft delete: desativa categoria (requer autenticacao)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAuth } from "@/lib/errors";

// GET: Obtem categoria com relacao para servicos
export const GET = withErrorHandler(async (
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();

  // Busca categoria e inclui todos os servicos relacionados (relacao 1:N)
  const { data, error } = (await supabase
    .from("categories")
    .select("*, services(*)")
    .eq("id", id)
    .single()) as unknown as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_NOT_FOUND", error.message, error);
  }

  return NextResponse.json(data);
});

// PATCH: Atualiza campos da categoria (requer autenticacao)
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();
  // Verifica autenticacao do usuario
  await requireAuth(supabase);

  const body = await request.json();

  // Atualiza campos enviados (name, slug, description, image_url, is_active, sort_order)
  const { data, error } = (await (supabase
    .from("categories") as any)
    .update(body)
    .eq("id", id)
    .select()
    .single()) as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_UPDATE_FAILED", error.message, error);
  }

  return NextResponse.json(data);
});

// DELETE: Soft delete - desativa categoria ao inves de deletar (requer autenticacao)
export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();
  // Verifica autenticacao do usuario
  await requireAuth(supabase);

  // Soft delete: apenas desativa categoria (nunca deleta da BD)
  // Isso preserva referencia historica de servicos que usavam a categoria
  const { error } = await (supabase
    .from("categories") as any)
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    throw new AppError("RES_DELETE_FAILED", error.message, error);
  }

  return NextResponse.json({ success: true });
});
