/**
 * API Route: /api/loyalty/rules
 *
 * Gerencia regras de fidelidade (pontos por acao).
 *
 * GET  — Lista todas as regras de fidelidade (ordenadas por tipo)
 * POST — Cria nova regra (requer admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAdmin } from "@/lib/errors";

// GET: Lista regras de fidelidade (ex: pontos por R$ gasto, checkin diario, etc)
export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  // Busca todas as regras, ordenadas por tipo e data de criacao
  const { data, error } = (await (supabase.from("loyalty_rules") as any)
    .select("*")
    .order("type")
    .order("created_at", { ascending: false })) as {
    data: any[] | null;
    error: any;
  };

  if (error) {
    throw new AppError("SYS_DATABASE", error.message, error);
  }

  return NextResponse.json(data);
});

// POST: Cria nova regra de fidelidade (requer admin)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  // Verifica permissao de admin
  await requireAdmin(supabase);

  const body = await request.json();

  // Insercao: type (purchase, checkin, etc), points, description, is_active
  const { data, error } = (await (supabase.from("loyalty_rules") as any)
    .insert(body)
    .select()
    .single()) as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_CREATE_FAILED", error.message, error);
  }

  return NextResponse.json(data, { status: 201 });
});
