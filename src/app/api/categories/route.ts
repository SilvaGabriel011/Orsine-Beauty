/**
 * API Route: /api/categories
 *
 * Gerencia categorias de servicos.
 *
 * GET  — Lista todas as categorias ativas, ordenadas por sort_order
 * POST — Cria nova categoria (requer admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAdmin } from "@/lib/errors";
import { z } from "zod";
import type { Category } from "@/types/database";

// Schema de validacao para criar/atualizar categoria
const createCategorySchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio").max(100),
  slug: z.string().min(1, "Slug e obrigatorio").max(100).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minusculas, numeros e hifens"),
  description: z.string().max(500).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).optional().default(0),
});

// GET: Lista todas as categorias ordenadas por sort_order para exibicao
export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  // Busca categorias ordernadas por campo sort_order (controla ordem de exibicao)
  const { data, error } = (await supabase
    .from("categories")
    .select("*")
    .order("sort_order")) as unknown as { data: Category[] | null; error: any };

  if (error) {
    throw new AppError("SYS_DATABASE", error.message, error);
  }

  return NextResponse.json(data);
});

// POST: Cria nova categoria (requer admin) - valida slug unico
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  // Verifica se usuario tem permissao de admin
  await requireAdmin(supabase);

  const body = await request.json();

  // Validacao com Zod: nome, slug (unico), descricao, imagem, etc
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || "Dados invalidos";
    throw new AppError("VAL_INVALID_FORMAT", firstError);
  }

  const { name, slug, description, image_url, is_active, sort_order } = parsed.data;

  const { data, error } = (await (supabase
    .from("categories") as any)
    .insert({ name, slug, description, image_url, is_active, sort_order })
    .select()
    .single()) as { data: Category | null; error: any };

  if (error) {
    // Trata violacao de constraint unica no slug
    if (error.code === "23505") {
      throw new AppError("RES_ALREADY_EXISTS", "Ja existe uma categoria com este slug");
    }
    throw new AppError("RES_CREATE_FAILED", error.message, error);
  }

  return NextResponse.json(data, { status: 201 });
});
