/**
 * API Route: /api/portfolio
 *
 * Gerencia portfolio (galeria de fotos/trabalhos).
 *
 * GET  — Lista itens de portfolio ativos, opcionalmente filtrado por categoria
 * POST — Cria novo item (requer admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAdmin } from "@/lib/errors";

// GET: Lista itens de portfolio ativos com categoria relacionada
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const categoryId = request.nextUrl.searchParams.get("categoryId");

  // Busca apenas itens ativos, ordenados por sort_order
  let query = (supabase.from("portfolio") as any)
    .select("*, categories(id, name, slug)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Filtro opcional por categoria
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = (await query) as { data: any[] | null; error: any };

  if (error) {
    throw new AppError("SYS_DATABASE", error.message, error);
  }

  return NextResponse.json(data);
});

// POST: Cria novo item de portfolio (requer admin)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  // Verifica permissao de admin
  await requireAdmin(supabase);

  const body = await request.json();

  // Insercao: category_id, titulo, descricao, imagem, sort_order, etc
  const { data, error } = (await (supabase.from("portfolio") as any)
    .insert(body)
    .select("*, categories(id, name, slug)")
    .single()) as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_CREATE_FAILED", error.message, error);
  }

  return NextResponse.json(data, { status: 201 });
});
